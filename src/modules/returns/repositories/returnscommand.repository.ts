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
import { Injectable, NotFoundException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  Repository,
  UpdateResult,
} from 'typeorm';


import { BaseEntity } from '../entities/base.entity';
import { Returns } from '../entities/returns.entity';
import { ReturnsQueryRepository } from './returnsquery.repository';
import { generateCacheKey } from 'src/utils/functions';
import { Cacheable } from '../decorators/cache.decorator';
import {ReturnsRepository} from './returns.repository';

//Logger
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';

//Events and EventHandlers
import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import { ReturnsCreatedEvent } from '../events/returnscreated.event';
import { ReturnsUpdatedEvent } from '../events/returnsupdated.event';
import { ReturnsDeletedEvent } from '../events/returnsdeleted.event';
import { ReturnRequestedEvent } from "../events/returnrequested.event";
import { ReturnApprovedEvent } from "../events/returnapproved.event";
import { ReturnRejectedEvent } from "../events/returnrejected.event";
import { ReturnRestockedEvent } from "../events/returnrestocked.event";
import { RefundRequestedEvent } from "../events/refundrequested.event";

//Enfoque Event Sourcing
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { EventStoreService } from '../shared/event-store/event-store.service';
import { KafkaEventPublisher } from '../shared/adapters/kafka-event-publisher';
import { BaseEvent } from '../events/base.event';

//Event Sourcing Config
import { EventSourcingHelper } from '../shared/decorators/event-sourcing.helper';
import { EventSourcingConfigOptions } from '../shared/decorators/event-sourcing.decorator';


@EventsHandler(ReturnsCreatedEvent, ReturnsUpdatedEvent, ReturnsDeletedEvent, ReturnRequestedEvent, ReturnApprovedEvent, ReturnRejectedEvent, ReturnRestockedEvent, RefundRequestedEvent)
@Injectable()
export class ReturnsCommandRepository implements IEventHandler<BaseEvent>{

  //Constructor del repositorio de datos: ReturnsCommandRepository
  constructor(
    @InjectRepository(Returns)
    private readonly repository: Repository<Returns>,
    private readonly returnsRepository: ReturnsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly eventStore: EventStoreService,
    private readonly eventPublisher: KafkaEventPublisher,
    private readonly eventBus: EventBus,
    @Optional() @Inject('EVENT_SOURCING_CONFIG') 
    private readonly eventSourcingConfig: EventSourcingConfigOptions = EventSourcingHelper.getDefaultConfig()
  ) {
    this.validate();
  }

  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  private validate(): void {
    const entityInstance = Object.create(Returns.prototype);

    if (!(entityInstance instanceof BaseEntity)) {
      throw new Error(
        `El tipo ${Returns.name} no extiende de BaseEntity. Asegúrate de que todas las entidades hereden correctamente.`
      );
    }
  }

  // Helper para determinar si usar Event Sourcing
  private shouldPublishEvent(): boolean {
    return EventSourcingHelper.shouldPublishEvents(this.eventSourcingConfig);
  }

  private shouldUseProjections(): boolean {
    return EventSourcingHelper.shouldUseProjections(this.eventSourcingConfig);
  }


  // ----------------------------
  // MÉTODOS DE PROYECCIÓN (Event Handlers) para enfoque Event Sourcing
  // ----------------------------

  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  async handle(event: any) {
    // Solo manejar eventos si las proyecciones están habilitadas
    if (!this.shouldUseProjections()) {
      logger.debug('Projections are disabled, skipping event handling');
      return false;
    }
    
    logger.info('Ready to handle Returns event on repository:', event);
    switch (event.constructor.name) {
      case 'ReturnsCreatedEvent':
        return await this.onReturnsCreated(event);
      case 'ReturnsUpdatedEvent':
        return await this.onReturnsUpdated(event);
      case 'ReturnsDeletedEvent':
        return await this.onReturnsDeleted(event);
      case 'ReturnRequestedEvent':
        return await this.onReturnRequested(event);
      case 'ReturnApprovedEvent':
        return await this.onReturnApproved(event);
      case 'ReturnRejectedEvent':
        return await this.onReturnRejected(event);
      case 'ReturnRestockedEvent':
        return await this.onReturnRestocked(event);
      case 'RefundRequestedEvent':
        return await this.onRefundRequested(event);
    }
    return false;
  }

  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({
    key: (args) => generateCacheKey<Returns>('createReturns', args[0], args[1]),
    ttl: 60,
  })
  private async onReturnsCreated(event: ReturnsCreatedEvent) {
    logger.info('Ready to handle onReturnsCreated event on repository:', event);
    const entity = new Returns();
    entity.id = event.aggregateId;
    Object.assign(entity, event.payload.instance);
    // Asegurar que el tipo discriminador esté establecido
    if (!entity.type) {
      entity.type = 'returns';
    }
    logger.info('Ready to save entity from event\'s payload:', entity);
    return await this.repository.save(entity);
  }

  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({
    key: (args) => generateCacheKey<Returns>('updateReturns', args[0], args[1]),
    ttl: 60,
  })
  private async onReturnsUpdated(event: ReturnsUpdatedEvent) {
    logger.info('Ready to handle onReturnsUpdated event on repository:', event);
    return await this.repository.update(
      event.aggregateId,
      event.payload.instance
    );
  }

  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({
    key: (args) => generateCacheKey<Returns>('deleteReturns', args[0], args[1]),
    ttl: 60,
  })
  private async onReturnsDeleted(event: ReturnsDeletedEvent) {
    logger.info('Ready to handle onReturnsDeleted event on repository:', event);
    return await this.repository.delete(event.aggregateId);
  }

  private async onReturnRequested(event: ReturnRequestedEvent) {
    logger.info('Ready to handle onReturnRequested event on repository:', event);
    const payloadInstance = (event as any).payload?.instance;
    if (payloadInstance) {
      const projectedEntity = this.repository.create({
        ...(payloadInstance as any),
        id: event.aggregateId,
        type: 'returns'
      } as Partial<Returns>);
      return await this.repository.save(projectedEntity as Returns);
    }
    return true;
  }

  private async onReturnApproved(event: ReturnApprovedEvent) {
    logger.info('Ready to handle onReturnApproved event on repository:', event);
    const payloadInstance = (event as any).payload?.instance;
    if (payloadInstance) {
      const projectedEntity = this.repository.create({
        ...(payloadInstance as any),
        id: event.aggregateId,
        type: 'returns'
      } as Partial<Returns>);
      return await this.repository.save(projectedEntity as Returns);
    }
    return true;
  }

  private async onReturnRejected(event: ReturnRejectedEvent) {
    logger.info('Ready to handle onReturnRejected event on repository:', event);
    const payloadInstance = (event as any).payload?.instance;
    if (payloadInstance) {
      const projectedEntity = this.repository.create({
        ...(payloadInstance as any),
        id: event.aggregateId,
        type: 'returns'
      } as Partial<Returns>);
      return await this.repository.save(projectedEntity as Returns);
    }
    return true;
  }

  private async onReturnRestocked(event: ReturnRestockedEvent) {
    logger.info('Ready to handle onReturnRestocked event on repository:', event);
    const payloadInstance = (event as any).payload?.instance;
    if (payloadInstance) {
      const projectedEntity = this.repository.create({
        ...(payloadInstance as any),
        id: event.aggregateId,
        type: 'returns'
      } as Partial<Returns>);
      return await this.repository.save(projectedEntity as Returns);
    }
    return true;
  }

  private async onRefundRequested(event: RefundRequestedEvent) {
    logger.info('Ready to handle onRefundRequested event on repository:', event);
    const payloadInstance = (event as any).payload?.instance;
    if (payloadInstance) {
      const projectedEntity = this.repository.create({
        ...(payloadInstance as any),
        id: event.aggregateId,
        type: 'returns'
      } as Partial<Returns>);
      return await this.repository.save(projectedEntity as Returns);
    }
    return true;
  }


  // ----------------------------
  // MÉTODOS CRUD TRADICIONALES (Compatibilidad)
  // ----------------------------
 
  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<Returns>('createReturns',args[0], args[1]), ttl: 60 })
  async create(entity: Returns): Promise<Returns> {
    logger.info('Ready to create Returns on repository:', entity);
    
    // Asegurar que el tipo discriminador esté establecido antes de guardar
    if (!entity.type) {
      entity.type = 'returns';
    }
    
    const result = await this.repository.save(entity);
    logger.info('New instance of Returns was created with id:'+ result.id+' on repository:', result);
    
    // Publicar evento al EventBus local (sagas) y a Kafka si está habilitado
    if (this.shouldPublishEvent()) {
      const event = new ReturnsCreatedEvent(result.id, {
        instance: result,
        metadata: {
          initiatedBy: result.creator,
          correlationId: result.id,
        },
      });
      this.eventBus.publish(event);
      this.eventPublisher.publish(event);
    }
    return result;
  }


  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<Returns[]>('createReturnss',args[0], args[1]), ttl: 60 })
  async bulkCreate(entities: Returns[]): Promise<Returns[]> {
    logger.info('Ready to create Returns on repository:', entities);
    
    // Asegurar que el tipo discriminador esté establecido para todas las entidades
    entities.forEach(entity => {
      if (!entity.type) {
        entity.type = 'returns';
      }
    });
    
    const result = await this.repository.save(entities);
    logger.info('New '+entities.length+' instances of Returns was created on repository:', result);
    
    // Publicar eventos al EventBus local (sagas) y a Kafka si está habilitado
    if (this.shouldPublishEvent()) {
      const events = result.map((el) => new ReturnsCreatedEvent(el.id, {
        instance: el,
        metadata: {
          initiatedBy: el.creator,
          correlationId: el.id,
        },
      }));
      events.forEach(event => this.eventBus.publish(event));
      this.eventPublisher.publishAll(events);
    }
    return result;
  }

  
  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<Returns>('updateReturns',args[0], args[1]), ttl: 60 })
  async update(
    id: string,
    partialEntity: Partial<Returns>
  ): Promise<Returns | null> {
    logger.info('Ready to update Returns on repository:', partialEntity);
    let result = await this.repository.update(id, partialEntity);
    logger.info('update Returns on repository was successfully :', partialEntity);
    let instance=await this.returnsRepository.findById(id);
    logger.info('Updated instance of Returns with id: ${id} was finded on repository:', instance);
    
    if(instance && this.shouldPublishEvent()) {
      logger.info('Ready to publish or fire event ReturnsUpdatedEvent on repository:', instance);
      const event = new ReturnsUpdatedEvent(instance.id, {
          instance: instance,
          metadata: {
            initiatedBy: instance.createdBy || 'system',
            correlationId: id,
          },
        });
      this.eventBus.publish(event);
      this.eventPublisher.publish(event);
    }   
    return instance;
  }


  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<Returns[]>('updateReturnss',args[0], args[1]), ttl: 60 })
  async bulkUpdate(entities: Partial<Returns>[]): Promise<Returns[]> {
    const updatedEntities: Returns[] = [];
    logger.info('Ready to update '+entities.length+' entities on repository:', entities);
    
    for (const entity of entities) {
      if (entity.id) {
        const updatedEntity = await this.update(entity.id, entity);
        if (updatedEntity) {
          updatedEntities.push(updatedEntity);
          if (this.shouldPublishEvent()) {
            const updateEvent = new ReturnsUpdatedEvent(updatedEntity.id, {
                instance: updatedEntity,
                metadata: {
                  initiatedBy: updatedEntity.createdBy || 'system',
                  correlationId: entity.id,
                },
              });
            this.eventBus.publish(updateEvent);
            this.eventPublisher.publish(updateEvent);
          }
        }
      }
    }
    logger.info('Already updated '+updatedEntities.length+' entities on repository:', updatedEntities);
    return updatedEntities;
  }


  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<string>('deleteReturns',args[0]), ttl: 60 })
  async delete(id: string): Promise<DeleteResult> {
     logger.info('Ready to delete entity with id: ${id} on repository:', id);
     const entity = await this.returnsRepository.findOne({ id });
     if(!entity){
      throw new NotFoundException(`No se encontro el id: ${id}`);
     }
     const result = await this.repository.delete({ id });
     logger.info('Entity deleted with id: ${id} on repository:', result);
     
     if (this.shouldPublishEvent()) {
       logger.info('Ready to publish/fire ReturnsDeletedEvent on repository:', result);
       const event = new ReturnsDeletedEvent(id, {
        instance: entity,
        metadata: {
          initiatedBy: entity.createdBy || 'system',
          correlationId: entity.id,
        },
      });
       this.eventBus.publish(event);
       this.eventPublisher.publish(event);
     }
     return result;
  }


  @LogExecutionTime({
    layer: 'repository',
    callback: async (logData, client) => {
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsRepository.name)
      .get(ReturnsRepository.name),
  })
  @Cacheable({ key: (args) => generateCacheKey<string[]>('deleteReturnss',args[0]), ttl: 60 })
  async bulkDelete(ids: string[]): Promise<DeleteResult> {
    logger.info('Ready to delete '+ids.length+' entities on repository:', ids);
    const result = await this.repository.delete(ids);
    logger.info('Already deleted '+ids.length+' entities on repository:', result);
    
    if (this.shouldPublishEvent()) {
      logger.info('Ready to publish/fire ReturnsDeletedEvent on repository:', result);
      const deleteEvents = await Promise.all(ids.map(async (id) => {
          const entity = await this.returnsRepository.findOne({ id });
          if(!entity){
            throw new NotFoundException(`No se encontro el id: ${id}`);
          }
          return new ReturnsDeletedEvent(id, {
            instance: entity,
            metadata: {
              initiatedBy: entity.createdBy || 'system',
              correlationId: entity.id,
            },
          });
        }));
      deleteEvents.forEach(event => this.eventBus.publish(event));
      this.eventPublisher.publishAll(deleteEvents);
    }
    return result;
  }
}


