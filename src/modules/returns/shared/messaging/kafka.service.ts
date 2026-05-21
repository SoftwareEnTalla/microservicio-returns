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


import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { Kafka, Producer, Consumer, Admin } from "kafkajs";
import { KafkaMessageCallback } from "../../../../interfaces/kafka";
import { logger } from '@core/logs/logger';

export interface KafkaPublishOptions {
  headers?: Record<string, string | number | boolean | undefined | null>;
  key?: string;
}

export interface KafkaSubscribeOptions {
  fromBeginning?: boolean;
}

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly moduleMessagingKey = 'returns';
  private readonly kafkaClientId: string;
  private readonly kafkaGroupId: string;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly subscribedTopics = new Set<string>();
  private readonly topicHandlers = new Map<string, KafkaMessageCallback<any>[]>();
  private readonly replayConsumers: Consumer[] = [];
  private connected = false;
  private consumerRunning = false;

  private adminClient: Admin | null = null;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);
    const baseClientId = (process.env.KAFKA_CLIENT_ID || 'nestjs-client').trim();
    const baseGroupId = (process.env.KAFKA_GROUP_ID || 'nestjs-group').trim();
    this.kafkaClientId = baseClientId + '-' + this.moduleMessagingKey;
    this.kafkaGroupId = baseGroupId + '-' + this.moduleMessagingKey;
    this.kafka = new Kafka({
      clientId: this.kafkaClientId,
      brokers,
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: this.kafkaGroupId });
    this.adminClient = this.kafka.admin();
  }

  async connect() {
    if (this.connected) {
      return;
    }
    await Promise.all([this.producer.connect(), this.consumer.connect()]);
    this.connected = true;
  }

  private async isAdminConnected(): Promise<boolean> {
    try {
      await this.adminClient?.describeCluster();
      return true;
    } catch {
      return false;
    }
  }

  async disconnectAdmin(): Promise<void> {
    try {
      await this.adminClient?.disconnect();
      this.adminClient = null;
    } catch (error) {
      this.logger.error("Error disconnecting Admin client", error);
    }
  }
  /**
   * Obtiene el cliente Admin de Kafka con conexión establecida
   * @returns {Promise<Admin>} Instancia conectada de Kafka Admin
   */
  async getAdminClient(): Promise<Admin | null> {
    try {
      // Verifica si ya está conectado
      if (this.adminClient !== null) {
        const connected = await this.adminClient?.describeCluster();
        this.logger.debug("Admin client already connected");
        return this.adminClient;
      }
      return null;
    } catch (error) {
      // Si no está conectado, establece conexión
      this.logger.warn("Admin client not connected, attempting to connect...");
      await this.adminClient?.connect();
      this.logger.log("Admin client connected successfully");
      return this.adminClient;
    }
  }
  async sendMessage(topic: string, message: any, options?: KafkaPublishOptions) {
    await this.connect();
    const normalizedHeaders = Object.fromEntries(
      Object.entries(options?.headers || {}).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    );
    await this.producer.send({
      topic,
      messages: [
        {
          key: options?.key,
          value: JSON.stringify(message),
          headers: {
            "event-type": message.constructor?.name || "unknown",
            timestamp: new Date().toISOString(),
            ...normalizedHeaders,
          },
        },
      ],
    });
  }

  async subscribe<T = any>(
    topic: string | string[],
    callback: KafkaMessageCallback<T>,
    options?: KafkaSubscribeOptions,
  ): Promise<void> {
    await this.connect();
    const topics = Array.isArray(topic) ? topic : [topic];

    for (const currentTopic of topics) {
      const handlers = this.topicHandlers.get(currentTopic) || [];
      handlers.push(callback as KafkaMessageCallback<any>);
      this.topicHandlers.set(currentTopic, handlers);

      if (!this.subscribedTopics.has(currentTopic)) {
        await this.consumer.subscribe({ topic: currentTopic, fromBeginning: options?.fromBeginning ?? false });
        this.subscribedTopics.add(currentTopic);
      }
    }

    if (this.consumerRunning) {
      return;
    }

    this.consumerRunning = true;
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const parsedMessage: T = JSON.parse(message.value.toString());
          const handlers = this.topicHandlers.get(topic) || [];
          for (const handler of handlers) {
            await handler(parsedMessage, {
              topic,
              partition,
              offset: message.offset,
              headers: message.headers,
              timestamp: message.timestamp,
            });
          }
        } catch (error) {
          logger.error("Error processing Kafka message:", error);
        }
      },
    });
  }

  async replayTopics<T = any>(
    topic: string | string[],
    callback: KafkaMessageCallback<T>
  ): Promise<void> {
    const topics = Array.isArray(topic) ? topic : [topic];
    const replayConsumer = this.kafka.consumer({
      groupId: this.kafkaGroupId + '-replay-' + Date.now(),
    });

    await replayConsumer.connect();
    this.replayConsumers.push(replayConsumer);

    for (const currentTopic of topics) {
      await replayConsumer.subscribe({ topic: currentTopic, fromBeginning: true });
    }

    await replayConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          const parsedMessage: T = JSON.parse(message.value.toString());
          await callback(parsedMessage, {
            topic,
            partition,
            offset: message.offset,
            headers: message.headers,
            timestamp: message.timestamp,
          });
        } catch (error) {
          logger.error('Error replaying Kafka message:', error);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async disconnect() {
    this.connected = false;
    this.consumerRunning = false;
    await Promise.all([
      this.producer.disconnect(),
      this.consumer.disconnect(),
      ...this.replayConsumers.map((consumer) => consumer.disconnect().catch(() => undefined)),
    ]);
    this.replayConsumers.length = 0;
  }
}

