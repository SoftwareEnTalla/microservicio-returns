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


import { Injectable } from '@nestjs/common';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';
import { BaseEvent } from '../../events/base.event';

@Injectable()
export class EventStoreService {
  private returns: EventStoreDBClient;

  constructor() {
    this.returns = EventStoreDBClient.connectionString(
      'esdb://localhost:2113?tls=false'
    );
  }

  async appendEvent(stream: string, event: BaseEvent) {
    await this.returns.appendToStream(
      stream,
      jsonEvent({
        type: event.constructor.name,
        data: JSON.parse(JSON.stringify(event)),
      })
    );
  }

  async readEvents(stream: string) {
    return this.returns.readStream(stream);
  }
}
