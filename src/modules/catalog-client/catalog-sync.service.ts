/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client — CatalogSyncService
 *
 * Responsabilidades:
 *  - OnApplicationBootstrap: intenta sync de todas las categorías configuradas
 *    en CATALOG_CATEGORIES (coma separada). Timeout duro 3s — nunca bloquea startup.
 *  - Cron programado cada CATALOG_SYNC_INTERVAL_MS (default 15 min).
 *  - Endpoint manual vía CatalogSyncController.
 *  - Invalidación por evento Kafka delegada a CatalogKafkaConsumer.
 *  - Persistencia de trazabilidad en `catalog-sync-log` si DataSource disponible.
 */

import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { CatalogClientService } from './catalog-client.service';
import {
  CatalogItemDto,
  CatalogSyncStatusSnapshot,
  SyncDiff,
  SyncOutcome,
  SyncResult,
  SyncTriggeredBy,
} from './types';

@Injectable()
export class CatalogSyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(CatalogSyncService.name);

  private readonly bootstrapTimeoutMs: number;
  private readonly intervalMs: number;
  private readonly categories: string[];
  private readonly enabled: boolean;

  private readonly lastByCategory = new Map<string, SyncResult>();
  private readonly itemsByCategory = new Map<string, Map<string, CatalogItemDto>>();
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly client: CatalogClientService,
    @Optional() @Inject(DataSource) private readonly dataSource?: DataSource,
  ) {
    this.enabled =
      (this.config.get<string>('CATALOG_SYNC_ENABLED') ?? 'true').toLowerCase() !== 'false';
    this.bootstrapTimeoutMs = Number(
      this.config.get('CATALOG_SYNC_BOOTSTRAP_TIMEOUT_MS') ?? 3_000,
    );
    this.intervalMs = Number(
      this.config.get('CATALOG_SYNC_INTERVAL_MS') ?? 15 * 60 * 1000,
    );
    const raw = this.config.get<string>('CATALOG_CATEGORIES') ?? '';
    this.categories = raw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Catalog sync deshabilitado (CATALOG_SYNC_ENABLED=false).');
      return;
    }
    if (this.categories.length === 0) {
      this.logger.log('Catalog sync sin categorías (CATALOG_CATEGORIES vacío). Skip.');
      return;
    }

    this.logger.log(
      `Catalog sync bootstrap: ${this.categories.length} categorías, timeout ${this.bootstrapTimeoutMs}ms.`,
    );

    // Probe de salud con timeout corto — no bloquea aunque falle.
    const probe = this.client.probeHealth().catch(() => 'DOWN' as const);
    await this.withHardTimeout(probe, this.bootstrapTimeoutMs, 'bootstrap health probe');

    // Lanzar sync en background sin bloquear el arranque.
    setImmediate(() => {
      this.withHardTimeout(
        this.syncAll('BOOTSTRAP', 'application-bootstrap'),
        this.bootstrapTimeoutMs,
        'bootstrap sync',
      ).catch((err) => this.logger.warn(`Bootstrap sync abortado: ${err?.message ?? err}`));
    });

    // Programar ciclo periódico.
    this.intervalHandle = setInterval(() => {
      this.syncAll('SCHEDULED', 'cron-interval').catch((err) =>
        this.logger.warn(`Scheduled sync error: ${err?.message ?? err}`),
      );
    }, this.intervalMs);
    // evita bloquear el shutdown del proceso
    (this.intervalHandle as any).unref?.();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getStatus(): CatalogSyncStatusSnapshot {
    const lastSyncByCategory: Record<string, SyncResult> = {};
    for (const [k, v] of this.lastByCategory.entries()) lastSyncByCategory[k] = v;
    return {
      catalogBaseUrl: this.client.getBaseUrl(),
      catalogState: this.client.getHealthState(),
      lastHealthCheckAt: this.client.getLastHealthCheckAt(),
      lastSyncByCategory,
      consecutiveFailures: this.client.getConsecutiveFailures(),
    };
  }

  async syncAll(triggeredBy: SyncTriggeredBy, reason: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const category of this.categories) {
      try {
        results.push(await this.syncCategory(category, triggeredBy, reason));
      } catch (err: any) {
        this.logger.warn(
          `Fallo sincronizando ${category}: ${err?.message ?? err}`,
        );
      }
    }
    return results;
  }

  async syncCategory(
    categoryCode: string,
    triggeredBy: SyncTriggeredBy,
    reason: string,
  ): Promise<SyncResult> {
    const startedAt = Date.now();
    const emptyDiff: SyncDiff = { added: [], updated: [], removed: [] };
    const buildResult = (
      outcome: SyncOutcome,
      extra: Partial<SyncResult> = {},
    ): SyncResult => ({
      categoryCode,
      triggeredBy,
      outcome,
      itemsAddedCount: extra.itemsAddedCount ?? 0,
      itemsUpdatedCount: extra.itemsUpdatedCount ?? 0,
      itemsRemovedCount: extra.itemsRemovedCount ?? 0,
      diffSnapshot: extra.diffSnapshot ?? emptyDiff,
      reason,
      catalogVersion: extra.catalogVersion,
      catalogHash: extra.catalogHash,
      durationMs: Date.now() - startedAt,
      errorMessage: extra.errorMessage,
      syncedAt: new Date(),
    });

    try {
      if (this.client.getHealthState() === 'DOWN') {
        const res = buildResult('SKIPPED_CATALOG_DOWN', {
          errorMessage: 'catalog service DOWN (breaker abierto)',
        });
        this.lastByCategory.set(categoryCode, res);
        await this.persist(res);
        return res;
      }

      const schema = await this.client.getSchema(categoryCode);
      if (!schema) {
        const res = buildResult('SKIPPED_CATALOG_DOWN', {
          errorMessage: 'no schema response',
        });
        this.lastByCategory.set(categoryCode, res);
        await this.persist(res);
        return res;
      }

      const last = this.lastByCategory.get(categoryCode);
      if (last && last.catalogHash === schema.hash && last.outcome !== 'ERROR') {
        const res = buildResult('SKIPPED_UP_TO_DATE', {
          catalogVersion: schema.version,
          catalogHash: schema.hash,
        });
        this.lastByCategory.set(categoryCode, res);
        await this.persist(res);
        return res;
      }

      const remoteItems = await this.client.getItems(categoryCode, {
        activeOnly: false,
      });
      if (!Array.isArray(remoteItems) || remoteItems.length === 0) {
        // El catálogo puede devolver [] legítimamente — no lo tratamos como error.
        const diff = this.computeDiff(categoryCode, []);
        this.itemsByCategory.set(categoryCode, new Map());
        const res = buildResult('SUCCESS', {
          itemsAddedCount: diff.added.length,
          itemsUpdatedCount: diff.updated.length,
          itemsRemovedCount: diff.removed.length,
          diffSnapshot: diff,
          catalogVersion: schema.version,
          catalogHash: schema.hash,
        });
        this.lastByCategory.set(categoryCode, res);
        await this.persist(res);
        return res;
      }

      const diff = this.computeDiff(categoryCode, remoteItems);
      this.storeRemoteItems(categoryCode, remoteItems);
      const computedHash = schema.hash || this.hashItems(remoteItems);
      const res = buildResult('SUCCESS', {
        itemsAddedCount: diff.added.length,
        itemsUpdatedCount: diff.updated.length,
        itemsRemovedCount: diff.removed.length,
        diffSnapshot: diff,
        catalogVersion: schema.version,
        catalogHash: computedHash,
      });
      this.lastByCategory.set(categoryCode, res);
      await this.persist(res);
      return res;
    } catch (err: any) {
      const res = buildResult('ERROR', {
        errorMessage: err?.message ?? String(err),
      });
      this.lastByCategory.set(categoryCode, res);
      await this.persist(res);
      return res;
    }
  }

  private computeDiff(categoryCode: string, remote: CatalogItemDto[]): SyncDiff {
    const prev = this.itemsByCategory.get(categoryCode) ?? new Map<string, CatalogItemDto>();
    const remoteMap = new Map<string, CatalogItemDto>();
    for (const it of remote) if (it?.itemCode) remoteMap.set(it.itemCode, it);

    const added: CatalogItemDto[] = [];
    const updated: SyncDiff['updated'] = [];
    const removed: CatalogItemDto[] = [];

    for (const [code, after] of remoteMap.entries()) {
      const before = prev.get(code);
      if (!before) {
        added.push(after);
      } else if (JSON.stringify(before) !== JSON.stringify(after)) {
        updated.push({ itemCode: code, before, after });
      }
    }
    for (const [code, before] of prev.entries()) {
      if (!remoteMap.has(code)) removed.push(before);
    }
    return { added, updated, removed };
  }

  private storeRemoteItems(categoryCode: string, items: CatalogItemDto[]): void {
    const map = new Map<string, CatalogItemDto>();
    for (const it of items) if (it?.itemCode) map.set(it.itemCode, it);
    this.itemsByCategory.set(categoryCode, map);
  }

  private hashItems(items: CatalogItemDto[]): string {
    const sorted = [...items].sort((a, b) =>
      (a.itemCode ?? '').localeCompare(b.itemCode ?? ''),
    );
    return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
  }

  private async persist(result: SyncResult): Promise<void> {
    this.logger.log(
      `catalog-sync ${result.categoryCode} ${result.triggeredBy} ${result.outcome} +${result.itemsAddedCount}/~${result.itemsUpdatedCount}/-${result.itemsRemovedCount} (${result.durationMs}ms)`,
    );
    if (!this.dataSource || !this.dataSource.isInitialized) return;
    try {
      const table = this.config.get<string>('CATALOG_SYNC_LOG_TABLE') ?? 'catalog_sync_log_base_entity';
      await this.dataSource.query(
        `INSERT INTO ${table}
          (id, type, "creationDate", "modificationDate", "createdBy", active,
           name, description,
           "categoryCode", "triggeredBy",
           "itemsAddedCount", "itemsUpdatedCount", "itemsRemovedCount",
           "diffSnapshot", reason, "catalogVersion", "catalogHash",
           "durationMs", outcome, "errorMessage", "syncedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          cryptoRandomUuid(),
          'catalogsynclog',
          result.syncedAt,
          result.syncedAt,
          'catalog-sync-service',
          true,
          `sync-${result.categoryCode}-${result.syncedAt.getTime()}`,
          `auto-sync ${result.triggeredBy} ${result.outcome}`,
          result.categoryCode,
          result.triggeredBy,
          result.itemsAddedCount,
          result.itemsUpdatedCount,
          result.itemsRemovedCount,
          JSON.stringify(result.diffSnapshot ?? {}),
          result.reason ?? null,
          result.catalogVersion ?? null,
          result.catalogHash ?? null,
          result.durationMs,
          result.outcome,
          result.errorMessage ?? null,
          result.syncedAt,
        ],
      );
    } catch (err: any) {
      // Persistencia best-effort; no volcamos stacktrace para no ruido en logs.
      this.logger.debug(`persist catalog-sync-log falló: ${err?.message ?? err}`);
    }
  }

  private async withHardTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
  ): Promise<T | null> {
    return await new Promise<T | null>((resolve) => {
      const t = setTimeout(() => {
        this.logger.debug(`Timeout duro (${ms}ms) en ${label}`);
        resolve(null);
      }, ms);
      (t as any).unref?.();
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch(() => {
          clearTimeout(t);
          resolve(null);
        });
    });
  }
}

// Fallback a crypto.randomUUID si está disponible, para no añadir dependencias.
function cryptoRandomUuid(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto') as typeof import('crypto');
  return randomUUID();
}
