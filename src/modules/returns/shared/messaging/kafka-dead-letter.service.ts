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
import { RegisteredEventDefinition } from '../../events/event-registry';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaDeadLetterService {
  private readonly logger = new Logger(KafkaDeadLetterService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async publish(definition: RegisteredEventDefinition, envelope: any, error: Error): Promise<void> {
    const payloadMetadata = envelope?.payload?.metadata || {};
    await this.kafkaService.sendMessage(definition.dlqTopic, {
      ...envelope,
      deadLetter: {
        failedAt: new Date().toISOString(),
        reason: error.message,
        stack: error.stack,
        originalTopic: payloadMetadata.originalTopic || definition.topic,
      },
    }, {
      key: String(envelope?.aggregateId || payloadMetadata.correlationId || 'unknown-aggregate'),
      headers: {
        'event-type': payloadMetadata.eventName || definition.eventName,
        'event-id': payloadMetadata.eventId,
        'event-version': payloadMetadata.eventVersion || definition.version,
        'correlation-id': payloadMetadata.correlationId,
        'causation-id': payloadMetadata.causationId,
        'trace-id': payloadMetadata.traceId,
        'source-service': payloadMetadata.sourceService,
        'retry-count': payloadMetadata.retryCount,
        'idempotency-key': payloadMetadata.idempotencyKey,
        'original-topic': payloadMetadata.originalTopic || definition.topic,
        'dead-letter-reason': error.message,
      },
    });

    this.logger.error('Kafka event moved to DLQ: ' + definition.dlqTopic + ' [' + String(payloadMetadata.eventId || 'unknown-event') + ']');
  }
}
