/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 * CEOs: 
 *       Persy Morell Guerra      Email: pmorellpersi@gmail.com  Phone : +53-5336-4654 Linkedin: https://www.linkedin.com/in/persy-morell-guerra-288943357/
 *       Dailyn García Domínguez  Email: dailyngd@gmail.com      Phone : +53-5432-0312 Linkedin: https://www.linkedin.com/in/dailyn-dominguez-3150799b/
 *
 * CTO: Persy Morell Guerra
 * COO: Dailyn García Domínguez and Persy Morell Guerra
 * CFO: Dailyn García Domínguez and Persy Morell Guerra
 *
 * Repositories: 
 *               https://github.com/SoftwareEnTalla 
 *
 *               https://github.com/apokaliptolesamale?tab=repositories
 *
 *
 * Social Networks:
 *
 *              https://x.com/SoftwarEnTalla
 *
 *              https://www.facebook.com/profile.php?id=61572625716568
 *
 *              https://www.instagram.com/softwarentalla/
 *              
 *
 *
 */

import { Injectable } from '@nestjs/common';
import { IEvent, IEventPublisher } from '@nestjs/cqrs';
import { KafkaService } from '../messaging/kafka.service';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { resolveEventDefinition } from '../../events/event-registry';
//logger
import { logger } from '@core/logs/logger';
//Logger - Codetrace
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';

@Injectable()
export class KafkaEventPublisher implements IEventPublisher {
  constructor(private readonly kafkaService: KafkaService) {}

  @LogExecutionTime({
    layer: 'event-publisher',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace event publish:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de publish:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(KafkaEventPublisher.name)
      .get(KafkaEventPublisher.name),
  })
  async publish<T extends IEvent>(event: T) {
    if(process.env.KAFKA_ENABLED && process.env.KAFKA_ENABLED==='true'){
      const topic = this.resolveTopic(event);
      const normalized = this.normalizeEvent(event, topic);
      await this.kafkaService.sendMessage(topic, normalized.event, {
        key: normalized.aggregateId,
        headers: {
          'event-id': normalized.metadata.eventId,
          'event-name': normalized.metadata.eventName,
          'event-version': normalized.metadata.eventVersion,
          'correlation-id': normalized.metadata.correlationId,
          'causation-id': normalized.metadata.causationId,
          'trace-id': normalized.metadata.traceId,
          'source-service': normalized.metadata.sourceService,
          'retry-count': normalized.metadata.retryCount,
          'idempotency-key': normalized.metadata.idempotencyKey,
          'original-topic': topic,
        },
      });
      logger.info('Kafka event published', [topic, normalized.metadata.eventId, normalized.metadata.eventVersion]);
    } 
    else logger.warn(
      `Kafka is disabled. Event not published: ${event.constructor.name}`
    );
  }

  async publishAll(events: IEvent[]) {
    if(process.env.KAFKA_ENABLED && process.env.KAFKA_ENABLED==='true'){
      await Promise.all(events.map(event => this.publish(event)));
    } 
    else logger.warn(
      'Kafka is disabled. Events not published...'
    );
  }

  private resolveTopic(event: IEvent): string {
    const candidate = event.constructor.name
      .replace(/Event$/, '')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    return resolveEventDefinition(candidate)?.topic || candidate;
  }

  private normalizeEvent<T extends IEvent>(event: T, topic: string) {
    const mutableEvent = event as any;
    const definition = resolveEventDefinition(topic);
    const payload = mutableEvent.payload || { instance: mutableEvent, metadata: {} };
    const metadata = {
      initiatedBy: payload?.metadata?.initiatedBy || 'system',
      correlationId: payload?.metadata?.correlationId || mutableEvent.aggregateId || randomUUID(),
      causationId: payload?.metadata?.causationId || payload?.metadata?.correlationId || mutableEvent.aggregateId || randomUUID(),
      eventId: payload?.metadata?.eventId || randomUUID(),
      eventName: payload?.metadata?.eventName || mutableEvent.constructor?.name || definition?.eventName || topic,
      eventVersion: payload?.metadata?.eventVersion || definition?.version || process.env.KAFKA_EVENT_VERSION || '1.0.0',
      sourceService: payload?.metadata?.sourceService || process.env.APP_NAME || process.env.KAFKA_CLIENT_ID || 'unknown-service',
      traceId: payload?.metadata?.traceId || payload?.metadata?.correlationId || mutableEvent.aggregateId || randomUUID(),
      retryCount: Number(payload?.metadata?.retryCount ?? 0),
      occurredOn: payload?.metadata?.occurredOn || new Date().toISOString(),
      idempotencyKey: payload?.metadata?.idempotencyKey || topic + ':' + (payload?.metadata?.eventId || mutableEvent.aggregateId || randomUUID()),
      originalTopic: payload?.metadata?.originalTopic || topic,
      ...payload?.metadata,
    };

    mutableEvent.payload = {
      ...payload,
      metadata,
    };

    return {
      event: mutableEvent,
      aggregateId: String(mutableEvent.aggregateId || metadata.correlationId),
      metadata,
    };
  }
}

