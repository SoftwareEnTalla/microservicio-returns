/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client
 *
 * Encapsula el consumo de catalog-service (horizontal) con:
 *  - CatalogClientService: HTTP + circuit-breaker simple + TTL cache
 *  - CatalogSyncService: OnApplicationBootstrap + interval + persistencia en catalog-sync-log
 *  - CatalogKafkaConsumer: invalidación reactiva por eventos Kafka
 *  - CatalogSyncController: REST /api/catalog-sync/*
 *
 * Envs relevantes (todas opcionales):
 *   CATALOG_BASE_URL=http://localhost:3001
 *   CATALOG_CATEGORIES=CURRENCY,APPROVAL_STATUS
 *   CATALOG_SYNC_ENABLED=true
 *   CATALOG_SYNC_INTERVAL_MS=900000
 *   CATALOG_SYNC_BOOTSTRAP_TIMEOUT_MS=3000
 *   CATALOG_REQUEST_TIMEOUT_MS=500
 *   CATALOG_HEALTH_TIMEOUT_MS=800
 *   CATALOG_CACHE_TTL_MS=300000
 *   CATALOG_BREAKER_ERROR_THRESHOLD=3
 *   CATALOG_BREAKER_RESET_MS=30000
 *   CATALOG_SYNC_LOG_TABLE=catalog_sync_log_base_entity
 *   KAFKA_BROKERS=localhost:9092   (activa CatalogKafkaConsumer)
 *   CATALOG_KAFKA_GROUP_ID=catalog-client-<ms>
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogClientService } from './catalog-client.service';
import { CatalogSyncService } from './catalog-sync.service';
import { CatalogKafkaConsumer } from './catalog-kafka.consumer';
import { CatalogSyncController } from './catalog-sync.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CatalogSyncController],
  providers: [CatalogClientService, CatalogSyncService, CatalogKafkaConsumer],
  exports: [CatalogClientService, CatalogSyncService],
})
export class CatalogClientModule {}
