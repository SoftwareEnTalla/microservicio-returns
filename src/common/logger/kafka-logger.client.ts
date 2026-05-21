/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 */

import { Kafka, Producer, logLevel } from "kafkajs";
import { HttpLoggerApiRest, ILoggerClient } from "src/interfaces/log-context";
import { logger } from "@core/logs/logger";

/**
 * Cliente Kafka para enviar trazas de ejecución al servicio codetrace.
 * Implementa ILoggerClient para ser intercambiable con HttpLoggerClient.
 * Patrón Singleton: reutiliza una única conexión de productor Kafka.
 */
export class KafkaLoggerClient implements ILoggerClient {
  private static instance: KafkaLoggerClient;
  private producer: Producer;
  private connected = false;
  private connecting: Promise<void> | null = null;
  private readonly serviceName: string;

  private constructor() {
    const brokers = (process.env.KAFKA_BROKERS || "kafka:9092")
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    const kafka = new Kafka({
      clientId:
        (process.env.KAFKA_CLIENT_ID || "nestjs-client") + "-trace-logger",
      brokers,
      logLevel: logLevel.WARN,
    });
    this.producer = kafka.producer();
    this.serviceName = process.env.APP_NAME || "unknown-service";
  }

  static getInstance(): KafkaLoggerClient {
    if (!KafkaLoggerClient.instance) {
      KafkaLoggerClient.instance = new KafkaLoggerClient();
    }
    return KafkaLoggerClient.instance;
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true;
    if (this.connecting) {
      await this.connecting;
      return this.connected;
    }
    this.connecting = this.producer
      .connect()
      .then(() => {
        this.connected = true;
        logger.log("KafkaLoggerClient: Productor conectado.");
      })
      .catch((error) => {
        logger.error(
          `KafkaLoggerClient: Error conectando productor: ${error.message}`
        );
      })
      .finally(() => {
        this.connecting = null;
      });
    await this.connecting;
    return this.connected;
  }

  async send(data: HttpLoggerApiRest): Promise<boolean> {
    try {
      const topic =
        process.env.LOG_KAFKA_TOPIC || "codetrace-execution-trace";
      await this.producer.send({
        topic,
        messages: [
          {
            key: data.body.uuid || data.body.functionName,
            value: JSON.stringify({
              ...data.body,
              sourceService: this.serviceName,
              deliveredVia: "kafka",
            }),
            headers: {
              "event-type": "ExecutionTraceEvent",
              "source-service": this.serviceName,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });
      return true;
    } catch (error: any) {
      logger.error(
        `KafkaLoggerClient: Error enviando traza: ${error.message}`
      );
      return false;
    }
  }

  /**
   * No desconecta realmente: singleton reutiliza la conexión.
   */
  async close(): Promise<boolean> {
    return true;
  }

  /**
   * Desconexión real del productor (para shutdown del módulo).
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await this.producer.disconnect();
      } catch (error: any) {
        logger.error(
          `KafkaLoggerClient: Error desconectando: ${error.message}`
        );
      }
      this.connected = false;
      KafkaLoggerClient.instance = null as any;
    }
  }
}
