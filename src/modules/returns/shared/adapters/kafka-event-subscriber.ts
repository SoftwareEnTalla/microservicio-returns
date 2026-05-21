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


import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { KafkaService } from '../messaging/kafka.service';
import {
  EVENT_CONSUMER_TOPICS,
  resolveEventDefinition,
} from '../../events/event-registry';
import { EventIdempotencyService } from '../messaging/event-idempotency.service';
import { KafkaDeadLetterService } from '../messaging/kafka-dead-letter.service';
//Logger - Codetrace
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';

@Injectable()
export class KafkaEventSubscriber {
  private readonly logger = new Logger(KafkaEventSubscriber.name);
  private initialized = false;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly eventBus: EventBus,
    private readonly idempotencyService: EventIdempotencyService,
    private readonly deadLetterService: KafkaDeadLetterService,
  ) {}

  async initializeSubscriptions() {
    if (this.initialized) {
      return;
    }
    if (process.env.KAFKA_ENABLED !== 'true') {
      this.logger.warn('Kafka está deshabilitado. No se inicializan suscriptores.');
      return;
    }
    await this.kafkaService.connect();
    await this.setupSubscriptions();
    this.initialized = true;
  }

  private async setupSubscriptions() {
      if (EVENT_CONSUMER_TOPICS.length === 0) {
        this.logger.warn('No hay tópicos registrados para suscripción Kafka.');
        return;
      }
      await this.kafkaService.subscribe(EVENT_CONSUMER_TOPICS, async (message, metadata) => {
        await this.routeExternalEvent(message, metadata);
      });
  }

  async replayRegisteredEvents(): Promise<void> {
    await this.kafkaService.replayTopics(EVENT_CONSUMER_TOPICS, async (message, metadata) => {
      await this.routeExternalEvent(message, metadata, { ignoreIdempotency: true, allowRetry: false, replay: true });
    });
  }

    @LogExecutionTime({
    layer: 'event-subscriber',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace event consumed:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de consume:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(KafkaEventSubscriber.name)
      .get(KafkaEventSubscriber.name),
  })
    async routeExternalEvent(message: any, metadata: any, options?: { ignoreIdempotency?: boolean; allowRetry?: boolean; replay?: boolean }) {
    try {
        const eventType = this.extractHeaderValue(metadata?.headers?.['event-type']);
        const topic = metadata?.topic;
        const eventDefinition = this.resolveEventDefinition(topic, eventType);
      
      if (!eventDefinition) {
          this.logger.warn('No handler for event type: ' + String(eventType || topic || 'unknown'));
        return;
      }

        if (!this.isTrustedProducer(metadata?.headers)) {
          this.logger.warn('Kafka message ignored due to untrusted producer: ' + String(this.extractHeaderValue(metadata?.headers?.['source-service']) || 'unknown'));
          return;
        }

        const aggregateId = String(message?.aggregateId ?? message?.id ?? message?.payload?.metadata?.correlationId ?? 'unknown-aggregate');
        const payload = this.normalizePayload(message, metadata, eventDefinition, aggregateId, eventType);
        const idempotencyKey = this.idempotencyService.buildKey(eventDefinition.topic, aggregateId, payload.metadata);

      if (!options?.ignoreIdempotency && this.idempotencyService.hasProcessed(idempotencyKey)) {
        this.logger.warn('Skipping duplicate Kafka event: ' + idempotencyKey);
        return;
      }

        const event = new eventDefinition.eventClass(aggregateId, payload);
      this.eventBus.publish(event);
      if (!options?.ignoreIdempotency) {
        this.idempotencyService.markProcessed(idempotencyKey);
      }
      this.logger.debug('Kafka event processed: ' + payload.metadata.eventName + ' [' + payload.metadata.eventId + ']');
    } catch (error:any) {
      this.logger.error(`Error processing external event: ${error.message}`, error.stack);
      if (options?.allowRetry !== false) {
        await this.handleProcessingFailure(message, metadata, error);
      }
    }
  }

    private resolveEventDefinition(topic?: string, eventType?: string) {
      const normalizedTopic = topic || this.normalizeEventTypeToTopic(eventType);
      return resolveEventDefinition(normalizedTopic) || resolveEventDefinition(eventType);
    }

    private extractHeaderValue(header: any): string | undefined {
      if (!header) {
        return undefined;
      }
      if (typeof header === 'string') {
        return header;
      }
      if (Buffer.isBuffer(header)) {
        return header.toString('utf-8');
      }
      return String(header);
    }

    private normalizeEventTypeToTopic(eventType?: string): string | undefined {
      if (!eventType) {
        return undefined;
      }
      return eventType
        .replace(/Event$/, '')
        .replace(/([a-z])([A-Z])/g, (_match, first, second) => first + '-' + second)
        .toLowerCase();
  }

  private normalizePayload(message: any, metadata: any, eventDefinition: any, aggregateId: string, eventType?: string) {
    const payload = message?.payload ? { ...message.payload } : { instance: message?.instance ?? message, metadata: message?.metadata ?? {} };
    const normalizedMetadata = {
      initiatedBy: payload?.metadata?.initiatedBy || 'system',
      correlationId: payload?.metadata?.correlationId || aggregateId,
      causationId: payload?.metadata?.causationId || payload?.metadata?.correlationId || aggregateId,
      eventId: payload?.metadata?.eventId || this.extractHeaderValue(metadata?.headers?.['event-id']) || aggregateId + '-' + Date.now(),
      eventName: payload?.metadata?.eventName || eventType || eventDefinition.eventName,
      eventVersion: payload?.metadata?.eventVersion || this.extractHeaderValue(metadata?.headers?.['event-version']) || eventDefinition.version,
      sourceService: payload?.metadata?.sourceService || this.extractHeaderValue(metadata?.headers?.['source-service']) || 'unknown-service',
      traceId: payload?.metadata?.traceId || this.extractHeaderValue(metadata?.headers?.['trace-id']) || payload?.metadata?.correlationId || aggregateId,
      retryCount: Number(payload?.metadata?.retryCount ?? this.extractHeaderValue(metadata?.headers?.['retry-count']) ?? 0),
      occurredOn: payload?.metadata?.occurredOn || this.extractHeaderValue(metadata?.headers?.timestamp) || new Date().toISOString(),
      originalTopic: payload?.metadata?.originalTopic || this.extractHeaderValue(metadata?.headers?.['original-topic']) || eventDefinition.topic,
      idempotencyKey: payload?.metadata?.idempotencyKey || this.extractHeaderValue(metadata?.headers?.['idempotency-key']) || eventDefinition.topic + ':' + (payload?.metadata?.eventId || aggregateId),
      ...payload?.metadata,
    };

    return {
      ...payload,
      metadata: normalizedMetadata,
    };
  }

  private isTrustedProducer(headers: any): boolean {
    const trustedProducers = (process.env.KAFKA_TRUSTED_PRODUCERS || '')
      .split(',')
      .map((producer) => producer.trim())
      .filter(Boolean);

    if (trustedProducers.length === 0) {
      return true;
    }

    const sourceService = this.extractHeaderValue(headers?.['source-service']);
    return !!sourceService && trustedProducers.includes(sourceService);
  }

  private async handleProcessingFailure(message: any, metadata: any, error: Error): Promise<void> {
    const eventType = this.extractHeaderValue(metadata?.headers?.['event-type']);
    const topic = metadata?.topic;
    const eventDefinition = this.resolveEventDefinition(topic, eventType);
    if (!eventDefinition) {
      return;
    }

    const aggregateId = String(message?.aggregateId ?? message?.id ?? message?.payload?.metadata?.correlationId ?? 'unknown-aggregate');
    const payload = this.normalizePayload(message, metadata, eventDefinition, aggregateId, eventType);
    const retryCount = Number(payload.metadata.retryCount ?? 0);
    const nextRetryCount = retryCount + 1;
    const retriableEnvelope = {
      ...message,
      aggregateId,
      payload: {
        ...payload,
        metadata: {
          ...payload.metadata,
          retryCount: nextRetryCount,
        },
      },
    };

    if (retryCount < eventDefinition.maxRetries) {
      this.logger.warn('Retrying Kafka event ' + payload.metadata.eventName + ' attempt ' + nextRetryCount + '/' + eventDefinition.maxRetries);
      await this.kafkaService.sendMessage(eventDefinition.retryTopic, retriableEnvelope, {
        key: aggregateId,
        headers: {
          'event-type': payload.metadata.eventName,
          'event-id': payload.metadata.eventId,
          'event-version': payload.metadata.eventVersion,
          'correlation-id': payload.metadata.correlationId,
          'causation-id': payload.metadata.causationId,
          'trace-id': payload.metadata.traceId,
          'source-service': payload.metadata.sourceService,
          'retry-count': nextRetryCount,
          'idempotency-key': payload.metadata.idempotencyKey,
          'original-topic': payload.metadata.originalTopic || eventDefinition.topic,
        },
      });
      return;
    }

    await this.deadLetterService.publish(eventDefinition, retriableEnvelope, error);
  }
}

