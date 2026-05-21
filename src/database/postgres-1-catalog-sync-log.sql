-- ════════════════════════════════════════════════════════════════════
-- catalog_sync_log_base_entity
-- Tabla de auditoría/trazabilidad de sincronizaciones contra
-- catalog-service (verdad mandataria de nomencladores horizontales).
-- Idempotente: se ejecuta en cada arranque del microservicio.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "catalog_sync_log_base_entity" (
  "id"                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type"              varchar(100) NOT NULL DEFAULT 'catalogsynclog',
  "creationDate"      timestamp NOT NULL DEFAULT NOW(),
  "modificationDate"  timestamp NOT NULL DEFAULT NOW(),
  "createdBy"         varchar(100) NOT NULL DEFAULT 'catalog-sync-service',
  "active"            boolean NOT NULL DEFAULT TRUE,
  "name"              varchar(255),
  "description"       varchar(500),
  "categoryCode"      varchar(80) NOT NULL,
  "triggeredBy"       varchar(40) NOT NULL,
  "itemsAddedCount"   integer NOT NULL DEFAULT 0,
  "itemsUpdatedCount" integer NOT NULL DEFAULT 0,
  "itemsRemovedCount" integer NOT NULL DEFAULT 0,
  "diffSnapshot"      jsonb,
  "reason"            text,
  "catalogVersion"    varchar(40),
  "catalogHash"       varchar(80),
  "durationMs"        integer NOT NULL DEFAULT 0,
  "outcome"           varchar(40) NOT NULL,
  "errorMessage"      text,
  "syncedAt"          timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_catalog_sync_log_category_synced"
  ON "catalog_sync_log_base_entity" ("categoryCode", "syncedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_catalog_sync_log_outcome"
  ON "catalog_sync_log_base_entity" ("outcome");
