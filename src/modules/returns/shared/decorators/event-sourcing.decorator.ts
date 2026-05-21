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

import { SetMetadata, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const EVENT_SOURCING_CONFIG = 'event_sourcing_config';

export interface EventSourcingConfigOptions {
  enabled: boolean;
  kafkaEnabled?: boolean;
  eventStoreEnabled?: boolean;
  topics?: string[];
  publishEvents?: boolean;
  useProjections?: boolean;
}

export const EventSourcingConfig = (config: EventSourcingConfigOptions) =>
  SetMetadata(EVENT_SOURCING_CONFIG, config);

@Injectable()
export class EventSourcingInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const eventSourcingConfig = this.reflector.get(
      EVENT_SOURCING_CONFIG,
      context.getHandler()
    ) || { enabled: false };

    const request = context.switchToHttp().getRequest();
    request.eventSourcingConfig = eventSourcingConfig;

    return next.handle();
  }
}

export function shouldUseEventSourcing(config: any): boolean {
  return config && config.enabled === true;
}
