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

import { KafkaEventSubscriber } from './kafka-event-subscriber';
import { describe, expect, it, jest } from '@jest/globals';
import { EVENT_CONSUMER_TOPICS } from '../../events/event-registry';

describe('KafkaEventSubscriber', () => {
  it('se suscribe a los tópicos registrados', async () => {
    process.env.KAFKA_ENABLED = 'true';
    const subscribe = jest.fn(async () => undefined);
    const connect = jest.fn(async () => undefined);
    const publish = jest.fn();
    const subscriber = new KafkaEventSubscriber({ connect, subscribe } as any, { publish } as any, { hasProcessed: () => false, markProcessed: jest.fn(), buildKey: jest.fn(() => 'idempotency-key') } as any, { publish: jest.fn() } as any);

    await subscriber.initializeSubscriptions();

    expect(connect).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith(EVENT_CONSUMER_TOPICS, expect.any(Function));
  });
});
