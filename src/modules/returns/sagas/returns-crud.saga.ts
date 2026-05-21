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
import { Saga, CommandBus, EventBus, ofType } from '@nestjs/cqrs';
import { Observable, map, tap } from 'rxjs';
import {
  ReturnsCreatedEvent,
  ReturnsUpdatedEvent,
  ReturnsDeletedEvent,
  ReturnRequestedEvent,
  ReturnApprovedEvent,
  ReturnRejectedEvent,
  ReturnRestockedEvent,
  RefundRequestedEvent,
} from '../events/exporting.event';
import {
  SagaReturnsFailedEvent
} from '../events/returns-failed.event';
import {
  CreateReturnsCommand,
  UpdateReturnsCommand,
  DeleteReturnsCommand
} from '../commands/exporting.command';

//Logger - Codetrace
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';

@Injectable()
export class ReturnsCrudSaga {
  private readonly logger = new Logger(ReturnsCrudSaga.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus
  ) {}

  // Reacción a evento de creación
  @Saga()
  onReturnsCreated = ($events: Observable<ReturnsCreatedEvent>) => {
    return $events.pipe(
      ofType(ReturnsCreatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para creación de Returns: ${event.aggregateId}`);
        void this.handleReturnsCreated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de actualización
  @Saga()
  onReturnsUpdated = ($events: Observable<ReturnsUpdatedEvent>) => {
    return $events.pipe(
      ofType(ReturnsUpdatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para actualización de Returns: ${event.aggregateId}`);
        void this.handleReturnsUpdated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de eliminación
  @Saga()
  onReturnsDeleted = ($events: Observable<ReturnsDeletedEvent>) => {
    return $events.pipe(
      ofType(ReturnsDeletedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para eliminación de Returns: ${event.aggregateId}`);
        void this.handleReturnsDeleted(event);
      }),
      map(() => null)
    );
  };

  @Saga()
  onReturnRequested = ($events: Observable<ReturnRequestedEvent>) => {
    return $events.pipe(
      ofType(ReturnRequestedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio ReturnRequested: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onReturnApproved = ($events: Observable<ReturnApprovedEvent>) => {
    return $events.pipe(
      ofType(ReturnApprovedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio ReturnApproved: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onReturnRejected = ($events: Observable<ReturnRejectedEvent>) => {
    return $events.pipe(
      ofType(ReturnRejectedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio ReturnRejected: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onReturnRestocked = ($events: Observable<ReturnRestockedEvent>) => {
    return $events.pipe(
      ofType(ReturnRestockedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio ReturnRestocked: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onRefundRequested = ($events: Observable<RefundRequestedEvent>) => {
    return $events.pipe(
      ofType(RefundRequestedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio RefundRequested: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsCrudSaga.name)
      .get(ReturnsCrudSaga.name),
  })
  private async handleReturnsCreated(event: ReturnsCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Returns Created completada: ${event.aggregateId}`);
      // Lógica post-creación (ej: enviar notificación, ejecutar comandos adicionales)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsCrudSaga.name)
      .get(ReturnsCrudSaga.name),
  })
  private async handleReturnsUpdated(event: ReturnsUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Returns Updated completada: ${event.aggregateId}`);
      // Lógica post-actualización (ej: actualizar caché)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsCrudSaga.name)
      .get(ReturnsCrudSaga.name),
  })
  private async handleReturnsDeleted(event: ReturnsDeletedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Returns Deleted completada: ${event.aggregateId}`);
      // Lógica post-eliminación (ej: limpiar relaciones)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  // Método para manejo de errores en sagas
  private handleSagaError(error: Error, event: any) {
    this.logger.error(`Error en saga para evento ${event.constructor.name}: ${error.message}`);
    this.eventBus.publish(new SagaReturnsFailedEvent( error,event));
  }
}
