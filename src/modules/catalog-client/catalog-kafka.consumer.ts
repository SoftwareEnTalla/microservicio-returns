/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client — Consumer Kafka para invalidación reactiva.
 *
 * Se suscribe a `catalog.catalog-item-upserted` y `catalog.catalog-item-deprecated`.
 * En cada evento recibido: invalida la caché del CatalogClient para la categoría
 * afectada y dispara un syncCategory con triggeredBy=KAFKA_EVENT.
 *
 * Si no hay brokers configurados (KAFKA_BROKERS vacío) o no carga kafkajs,
 * el consumer queda inactivo (no-op) sin romper el arranque.
 */

import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogClientService } from './catalog-client.service';
import { CatalogSyncService } from './catalog-sync.service';

@Injectable()
export class CatalogKafkaConsumer implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(CatalogKafkaConsumer.name);
  private consumer: any | null = null;
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly client: CatalogClientService,
    private readonly sync: CatalogSyncService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const brokersRaw = this.config.get<string>('KAFKA_BROKERS') ?? '';
    const brokers = brokersRaw.split(',').map((b) => b.trim()).filter(Boolean);
    if (brokers.length === 0) {
      this.logger.debug('KAFKA_BROKERS vacío — CatalogKafkaConsumer inactivo.');
      return;
    }

    let Kafka: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Kafka = require('kafkajs').Kafka;
    } catch {
      this.logger.debug('kafkajs no disponible — CatalogKafkaConsumer inactivo.');
      return;
    }

    try {
      const clientId =
        this.config.get<string>('CATALOG_KAFKA_CLIENT_ID') ?? 'catalog-client-consumer';
      const groupId =
        this.config.get<string>('CATALOG_KAFKA_GROUP_ID') ??
        `${clientId}-${process.env.npm_package_name ?? 'ms'}`;
      const k = new Kafka({ clientId, brokers });
      this.consumer = k.consumer({ groupId });
      await this.consumer.connect();
      const topics = [
        this.config.get<string>('CATALOG_TOPIC_UPSERTED') ?? 'catalog.catalog-item-upserted',
        this.config.get<string>('CATALOG_TOPIC_DEPRECATED') ?? 'catalog.catalog-item-deprecated',
      ];
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }
      await this.consumer.run({
        eachMessage: async ({ topic, message }: any) => this.handle(topic, message),
      });
      this.enabled = true;
      this.logger.log(
        `CatalogKafkaConsumer suscrito a ${topics.join(', ')} (group ${groupId}).`,
      );
    } catch (err: any) {
      this.logger.warn(`No se pudo iniciar CatalogKafkaConsumer: ${err?.message ?? err}`);
      this.consumer = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      try {
        await this.consumer.disconnect();
      } catch {
        /* noop */
      }
      this.consumer = null;
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async handle(topic: string, message: any): Promise<void> {
    try {
      const raw = message?.value?.toString('utf8') ?? '{}';
      const payload = JSON.parse(raw);
      const categoryCode: string | undefined = payload?.categoryCode ?? payload?.data?.categoryCode;
      if (!categoryCode) {
        this.logger.debug(`Mensaje ${topic} sin categoryCode; ignorado.`);
        return;
      }
      this.client.invalidateCache(`items:`);
      await this.sync.syncCategory(categoryCode, 'KAFKA_EVENT', `kafka:${topic}`);
    } catch (err: any) {
      this.logger.warn(`Error manejando ${topic}: ${err?.message ?? err}`);
    }
  }
}
