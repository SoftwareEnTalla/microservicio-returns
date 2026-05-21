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


import { IEvent } from '@nestjs/cqrs';

export interface EventMetadata {
  initiatedBy: string;
  correlationId: string;
  causationId?: string;
  eventId?: string;
  eventName?: string;
  eventVersion?: string;
  sourceService?: string;
  traceId?: string;
  retryCount?: number;
  occurredOn?: string;
  idempotencyKey?: string;
  originalTopic?: string;
  [key: string]: any;
}

export abstract class BaseEvent implements IEvent {
  //Constructor de BaseEvent
  constructor(
    public readonly aggregateId: string,
    public readonly timestamp: Date = new Date()
  ) {
    //Aquí coloca implementación escencial no más de BaseEvent
  }
}
export abstract class BaseFailedEvent implements IEvent {
  constructor(public readonly error:Error,public readonly event:any) {}
}

export interface PayloadEvent<T = any> {
  instance: T;
  metadata: EventMetadata;
}
