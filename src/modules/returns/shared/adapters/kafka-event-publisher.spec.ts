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

import { KafkaEventPublisher } from './kafka-event-publisher';
import { describe, expect, it, jest } from '@jest/globals';
import { ReturnsCreatedEvent } from '../../events/returnscreated.event';
import { resolveEventDefinition } from '../../events/event-registry';

describe('KafkaEventPublisher', () => {
  it('resuelve el tópico a partir del nombre del evento', async () => {
    process.env.KAFKA_ENABLED = 'true';
    const sendMessage = jest.fn(async () => undefined);
    const publisher = new KafkaEventPublisher({ sendMessage } as any);
    const event = new ReturnsCreatedEvent('agg-1', {
      instance: { id: 'agg-1' } as any,
      metadata: { initiatedBy: 'test', correlationId: 'agg-1' },
    });

    await publisher.publish(event);

    const eventDefinition = resolveEventDefinition('returns-created');
    expect(sendMessage).toHaveBeenCalledWith(
      'returns-created',
      event,
      expect.objectContaining({
        key: 'agg-1',
        headers: expect.objectContaining({
          'event-version': eventDefinition?.version,
          'event-id': expect.any(String),
          'trace-id': 'agg-1',
        }),
      }),
    );
  });
});
