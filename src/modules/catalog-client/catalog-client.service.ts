/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client — cliente HTTP con circuit-breaker simple + TTL cache
 *
 * Patrón: catalog-fallback. Nunca lanza hacia arriba fallos de red/timeout;
 * retorna lista vacía o null y marca el estado del breaker para que
 * los consumidores puedan caer a su enum local del DSL.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CatalogHealthState,
  CatalogItemDto,
  CatalogSchemaDto,
} from './types';

type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CatalogClientService {
  private readonly logger = new Logger(CatalogClientService.name);

  private readonly baseUrl: string;
  private readonly requestTimeoutMs: number;
  private readonly healthTimeoutMs: number;
  private readonly cacheTtlMs: number;
  private readonly errorThreshold: number;
  private readonly resetTimeoutMs: number;

  private breakerState: BreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  private healthState: CatalogHealthState = 'UNKNOWN';
  private lastHealthCheckAt: Date | null = null;

  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      this.config.get<string>('CATALOG_BASE_URL') ?? 'http://localhost:3001'
    ).replace(/\/+$/, '');
    this.requestTimeoutMs = Number(
      this.config.get('CATALOG_REQUEST_TIMEOUT_MS') ?? 500,
    );
    this.healthTimeoutMs = Number(
      this.config.get('CATALOG_HEALTH_TIMEOUT_MS') ?? 800,
    );
    this.cacheTtlMs = Number(
      this.config.get('CATALOG_CACHE_TTL_MS') ?? 5 * 60 * 1000,
    );
    this.errorThreshold = Number(
      this.config.get('CATALOG_BREAKER_ERROR_THRESHOLD') ?? 3,
    );
    this.resetTimeoutMs = Number(
      this.config.get('CATALOG_BREAKER_RESET_MS') ?? 30_000,
    );
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getHealthState(): CatalogHealthState {
    return this.healthState;
  }

  getLastHealthCheckAt(): Date | null {
    return this.lastHealthCheckAt;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  invalidateCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  async probeHealth(): Promise<CatalogHealthState> {
    const result = await this.rawFetch<{ status?: string }>(
      '/health',
      this.healthTimeoutMs,
      false,
    );
    this.lastHealthCheckAt = new Date();
    if (result.ok) {
      this.healthState = 'UP';
    } else {
      this.healthState = 'DOWN';
    }
    return this.healthState;
  }

  async getSchema(
    categoryCode: string,
    timeoutOverrideMs?: number,
  ): Promise<CatalogSchemaDto | null> {
    return this.getJsonOrNull<CatalogSchemaDto>(
      `/api/catalog/${encodeURIComponent(categoryCode)}/schema`,
      timeoutOverrideMs ?? this.requestTimeoutMs,
    );
  }

  async getItems(
    categoryCode: string,
    opts: { activeOnly?: boolean; locale?: string; timeoutMs?: number } = {},
  ): Promise<CatalogItemDto[]> {
    const params = new URLSearchParams();
    if (opts.activeOnly !== undefined) params.set('activeOnly', String(opts.activeOnly));
    if (opts.locale) params.set('locale', opts.locale);
    const qs = params.toString();
    const path =
      `/api/catalog/${encodeURIComponent(categoryCode)}/items` +
      (qs ? `?${qs}` : '');
    const cacheKey = `items:${path}`;
    const cached = this.readCache<CatalogItemDto[]>(cacheKey);
    if (cached) return cached;
    const res = await this.getJsonOrNull<CatalogItemDto[]>(
      path,
      opts.timeoutMs ?? this.requestTimeoutMs,
    );
    const items = Array.isArray(res) ? res : [];
    this.writeCache(cacheKey, items);
    return items;
  }

  async validateItem(
    categoryCode: string,
    itemCode: string,
    timeoutOverrideMs?: number,
  ): Promise<boolean | null> {
    const path = `/api/catalog/${encodeURIComponent(
      categoryCode,
    )}/items/${encodeURIComponent(itemCode)}/validate`;
    const res = await this.getJsonOrNull<{ valid?: boolean }>(
      path,
      timeoutOverrideMs ?? this.requestTimeoutMs,
    );
    if (res === null) return null;
    return Boolean(res?.valid);
  }

  private async getJsonOrNull<T>(
    path: string,
    timeoutMs: number,
  ): Promise<T | null> {
    if (!this.canAttempt()) return null;
    const result = await this.rawFetch<T>(path, timeoutMs, true);
    if (result.ok) {
      this.recordSuccess();
      return result.body ?? null;
    }
    this.recordFailure(result.error);
    return null;
  }

  private async rawFetch<T>(
    path: string,
    timeoutMs: number,
    countsTowardsBreaker: boolean,
  ): Promise<{ ok: boolean; body?: T; status?: number; error?: string }> {
    const url = `${this.baseUrl}${path}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) {
        const error = `HTTP ${resp.status}`;
        if (countsTowardsBreaker) this.logger.debug(`catalog ${path} -> ${error}`);
        return { ok: false, status: resp.status, error };
      }
      const ctype = resp.headers.get('content-type') ?? '';
      const body = ctype.includes('json')
        ? ((await resp.json()) as T)
        : ((await resp.text()) as unknown as T);
      return { ok: true, body, status: resp.status };
    } catch (err: any) {
      const msg = err?.name === 'AbortError' ? 'timeout' : (err?.message ?? String(err));
      if (countsTowardsBreaker) this.logger.debug(`catalog ${path} -> ${msg}`);
      return { ok: false, error: msg };
    } finally {
      clearTimeout(timer);
    }
  }

  private canAttempt(): boolean {
    if (this.breakerState === 'CLOSED') return true;
    if (this.breakerState === 'HALF_OPEN') return true;
    if (this.breakerState === 'OPEN') {
      if (this.openedAt && Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.breakerState = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.breakerState = 'CLOSED';
    this.openedAt = null;
    this.healthState = 'UP';
  }

  private recordFailure(_reason?: string): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.errorThreshold) {
      this.breakerState = 'OPEN';
      this.openedAt = Date.now();
      this.healthState = 'DOWN';
    } else if (this.healthState === 'UP') {
      this.healthState = 'DEGRADED';
    }
  }

  private readCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private writeCache<T>(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }
}
