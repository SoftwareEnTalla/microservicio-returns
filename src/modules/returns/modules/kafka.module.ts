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


import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaService } from "../shared/messaging/kafka.service";
import { KafkaAdminService } from "../shared/messaging/kafka-admin.service";
import { EventIdempotencyService } from "../shared/messaging/event-idempotency.service";
import { KafkaDeadLetterService } from "../shared/messaging/kafka-dead-letter.service";
import { ProjectionReplayService } from "../shared/messaging/projection-replay.service";
import { KafkaEventPublisher } from "../shared/adapters/kafka-event-publisher";
import { KafkaEventSubscriber } from "../shared/adapters/kafka-event-subscriber";
import { EVENT_ADMIN_TOPICS } from "../events/event-registry";

@Module({
  imports: [CqrsModule],
  providers: [
    KafkaService,
    KafkaAdminService,
    EventIdempotencyService,
    KafkaDeadLetterService,
    ProjectionReplayService,
    KafkaEventPublisher,
    KafkaEventSubscriber,
    {
      provide: "IEventPublisher",
      useExisting: KafkaEventPublisher,
    },
  ],
  exports: [KafkaService, KafkaAdminService, EventIdempotencyService, KafkaDeadLetterService, ProjectionReplayService, KafkaEventPublisher, KafkaEventSubscriber],
})
export class KafkaModule implements OnModuleInit {
  private readonly logger = new Logger(KafkaModule.name);

  constructor(
    private readonly kafkaSubscriber: KafkaEventSubscriber,
    private readonly kafkaService: KafkaService,
    private readonly kafkaAdminService: KafkaAdminService
  ) {}

  async onModuleInit() {
    if (process.env.KAFKA_ENABLED !== 'true') {
      this.logger.warn('Kafka deshabilitado por configuración. Se omite inicialización del módulo Kafka.');
      return;
    }
    void this.bootstrapKafka();
  }

  private async bootstrapKafka(attempt: number = 1, maxRetries: number = 10): Promise<void> {
    try {
      this.logger.log("Initializing Kafka module...");

      await this.kafkaService.connect();
      this.logger.log("Successfully connected to Kafka");

  await this.kafkaAdminService.ensureTopics(EVENT_ADMIN_TOPICS);
      this.logger.log("Kafka topics are ready");

      await this.kafkaSubscriber.initializeSubscriptions();
      this.logger.log("Kafka event subscribers initialized");

      await this.verifyKafkaConnection();

      this.logger.log("Kafka module initialized successfully");
    } catch (error: any) {
      this.logger.error("Failed to initialize Kafka module", error.stack);
      this.scheduleKafkaRecovery(attempt, maxRetries);
    }
  }

  private async verifyKafkaConnection(): Promise<void> {
    try {
      // Verificación básica de conexión
      const admin = await this.kafkaService.getAdminClient(); // Asume que has añadido este método
      if (admin !== null) {
        const topics = await admin.listTopics();
        this.logger.debug(
          `Connected to Kafka. Available topics: ${topics.join(", ")}`
        );
      } else this.logger.error(`Admin instance is null`);
    } catch (error: any) {
      this.logger.warn("Kafka connection verification failed", error.message);
      // No relanzar el error para no bloquear la inicialización
    }
  }

  private scheduleKafkaRecovery(attempt: number, maxRetries: number = 10): void {
    const retryDelay = 5000;
    if (attempt > maxRetries) {
      this.logger.error('All ' + maxRetries + ' Kafka initialization retries failed');
      return;
    }

    setTimeout(async () => {
      this.logger.warn('Retrying Kafka initialization (attempt ' + attempt + '/' + maxRetries + ')...');
      try {
        await this.bootstrapKafka(attempt + 1, maxRetries);
      } catch (retryError: any) {
        this.logger.warn('Retry attempt ' + attempt + ' failed: ' + retryError.message);
        this.scheduleKafkaRecovery(attempt + 1, maxRetries);
      }
    }, retryDelay);
  }
}

