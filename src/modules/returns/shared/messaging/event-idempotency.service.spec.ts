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

import { describe, expect, it } from '@jest/globals';
import { EventIdempotencyService } from './event-idempotency.service';

describe('EventIdempotencyService', () => {
  it('marca un evento como procesado y evita duplicados', () => {
    const service = new EventIdempotencyService();
    const key = service.buildKey('returns-created', 'aggregate-1', { eventId: 'evt-1' });

    expect(service.hasProcessed(key)).toBe(false);
    service.markProcessed(key);
    expect(service.hasProcessed(key)).toBe(true);
    service.release(key);
    expect(service.hasProcessed(key)).toBe(false);
    service.onModuleDestroy();
  });
});
