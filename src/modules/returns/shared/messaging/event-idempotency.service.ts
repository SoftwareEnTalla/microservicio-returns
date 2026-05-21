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

import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class EventIdempotencyService implements OnModuleDestroy {
  private readonly processedEvents = new Map<string, number>();
  private readonly ttlMs = Number(process.env.KAFKA_IDEMPOTENCY_TTL_MS || '86400000');
  private readonly cleanupHandle: NodeJS.Timeout;

  constructor() {
    this.cleanupHandle = setInterval(() => this.cleanup(), Math.max(60000, Math.floor(this.ttlMs / 4)));
    this.cleanupHandle.unref?.();
  }

  hasProcessed(key: string): boolean {
    this.cleanup();
    return this.processedEvents.has(key);
  }

  markProcessed(key: string): void {
    this.processedEvents.set(key, Date.now() + this.ttlMs);
  }

  release(key: string): void {
    this.processedEvents.delete(key);
  }

  buildKey(topic: string, aggregateId: string, metadata?: Record<string, any>): string {
    return String(metadata?.idempotencyKey || metadata?.eventId || metadata?.correlationId || topic + ':' + aggregateId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, expiration] of this.processedEvents.entries()) {
      if (expiration <= now) {
        this.processedEvents.delete(key);
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupHandle);
  }
}
