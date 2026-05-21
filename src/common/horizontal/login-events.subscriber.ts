import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { metricsRegistry } from './metrics.registry';

/**
 * Suscriptor transversal de los 5 eventos de login que cualquier microservicio
 * protegido debe considerar. Los eventos llegan como tópicos Kafka separados:
 *   - login-federated-started
 *   - login-failed
 *   - login-logged-out
 *   - login-refreshed
 *   - login-succeeded
 *
 * El subscriber NO realiza lógica de negocio: sólo registra el evento en métricas
 * y log para que cada microservicio pueda extender con handlers locales (ej.
 * invalidar caché de usuario en LoginLoggedOut).
 *
 * Para extender, exportar un servicio que implemente
 * `HorizontalLoginEventHandler` y registrarlo en el módulo del microservicio,
 * el HorizontalModule lo recogerá vía DI opcional (futuro).
 */
@Injectable()
export class HorizontalLoginEventsSubscriber
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(HorizontalLoginEventsSubscriber.name);
  private kafka?: Kafka;
  private consumer?: Consumer;
  private readonly topics = [
    'login-federated-started',
    'login-failed',
    'login-logged-out',
    'login-refreshed',
    'login-succeeded',
  ];

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.KAFKA_ENABLED !== 'true') {
      this.logger.log(
        'KAFKA_ENABLED!=true, login-events subscriber deshabilitado',
      );
      return;
    }
    const brokers = (process.env.KAFKA_BROKERS ?? 'kafka:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
    const clientId =
      (process.env.KAFKA_CLIENT_ID ?? 'nestjs-client') + '-login-events';
    const groupId =
      (process.env.KAFKA_GROUP_ID ?? 'nestjs-group') +
      '-' +
      (process.env.APP_NAME ?? 'svc') +
      '-login-events';

    try {
      this.kafka = new Kafka({ brokers, clientId, logLevel: logLevel.NOTHING });
      this.consumer = this.kafka.consumer({ groupId, allowAutoTopicCreation: true });
      await this.consumer.connect();
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }
      await this.consumer.run({
        autoCommit: true,
        eachMessage: (payload) => this.handleMessage(payload),
      });
      this.logger.log(
        `Login events subscriber escuchando topics ${this.topics.join(', ')}`,
      );
    } catch (err: any) {
      this.logger.warn(
        `No se pudo iniciar login-events subscriber (continuando sin él): ${err?.message ?? err}`,
      );
      this.consumer = undefined;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      if (this.consumer) await this.consumer.disconnect();
    } catch {
      // noop
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic } = payload;
    metricsRegistry.incCounter('horizontal_login_events_received_total', { topic });
    try {
      const raw = payload.message.value?.toString('utf8');
      if (!raw) return;
      const evt = JSON.parse(raw);
      const userId =
        evt?.payload?.instance?.userId ??
        evt?.payload?.userId ??
        evt?.aggregateId ??
        'unknown';
      this.logger.debug(`[login-event] topic=${topic} userId=${userId}`);
    } catch (err: any) {
      this.logger.warn(
        `Mensaje login-event inválido en topic=${topic}: ${err?.message ?? err}`,
      );
    }
  }
}
