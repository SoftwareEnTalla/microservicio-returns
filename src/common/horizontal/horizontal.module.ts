import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { HttpMetricsMiddleware } from './http-metrics.middleware';
import { HorizontalHealthController } from './health.controller';
import { HorizontalMetricsController } from './metrics.controller';
import { HorizontalLoginEventsSubscriber } from './login-events.subscriber';
import { getThrottlerConfig } from './throttler.config';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Módulo horizontal compartido por todos los microservicios.
 *
 * Aporta:
 *  - /health, /health/live, /health/ready  (liveness + readiness con probe DB)
 *  - /metrics                              (Prometheus text/plain)
 *  - Middleware x-correlation-id           (header IO + AsyncLocalStorage)
 *  - Middleware http metrics                (counter + histograma duración)
 *  - ThrottlerGuard global                  (rate-limit por IP)
 *  - Subscriber Kafka eventos transversales de login
 *
 * Helmet se aplica en main.ts (no es un módulo Nest).
 *
 * Importarlo UNA VEZ en el AppModule del microservicio.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: getThrottlerConfig().ttl,
        limit: getThrottlerConfig().limit,
      },
    ]),
  ],
  controllers: [HorizontalHealthController, HorizontalMetricsController],
  providers: [
    HorizontalLoginEventsSubscriber,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [HorizontalLoginEventsSubscriber],
})
export class HorizontalModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, HttpMetricsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
