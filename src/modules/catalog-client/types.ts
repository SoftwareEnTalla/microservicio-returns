/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client — tipos compartidos
 */

export type CatalogHealthState = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export type SyncTriggeredBy = 'BOOTSTRAP' | 'SCHEDULED' | 'KAFKA_EVENT' | 'MANUAL';

export type SyncOutcome =
  | 'SUCCESS'
  | 'PARTIAL'
  | 'SKIPPED_UP_TO_DATE'
  | 'SKIPPED_CATALOG_DOWN'
  | 'ERROR';

export interface CatalogItemDto {
  itemCode: string;
  label?: string;
  status?: string;
  validTo?: string | null;
  metadata?: Record<string, any> | null;
  [k: string]: any;
}

export interface CatalogSchemaDto {
  version: string;
  hash: string;
  itemsCount: number;
  updatedAt: string;
}

export interface SyncDiff {
  added: CatalogItemDto[];
  updated: Array<{ itemCode: string; before: CatalogItemDto; after: CatalogItemDto }>;
  removed: CatalogItemDto[];
}

export interface SyncResult {
  categoryCode: string;
  triggeredBy: SyncTriggeredBy;
  outcome: SyncOutcome;
  itemsAddedCount: number;
  itemsUpdatedCount: number;
  itemsRemovedCount: number;
  diffSnapshot: SyncDiff;
  reason?: string;
  catalogVersion?: string;
  catalogHash?: string;
  durationMs: number;
  errorMessage?: string;
  syncedAt: Date;
}

export interface CatalogSyncStatusSnapshot {
  catalogBaseUrl: string;
  catalogState: CatalogHealthState;
  lastHealthCheckAt: Date | null;
  lastSyncByCategory: Record<string, SyncResult>;
  consecutiveFailures: number;
}
