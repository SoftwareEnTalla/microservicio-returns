/**
 * Configuración por defecto de rate-limit. Un microservicio puede sobreescribir
 * estos valores con variables de entorno:
 *   THROTTLE_TTL_MS  (default 60000)
 *   THROTTLE_LIMIT   (default 120)
 */
export function getThrottlerConfig(): { ttl: number; limit: number } {
  const ttl = Number(process.env.THROTTLE_TTL_MS ?? 60_000);
  const limit = Number(process.env.THROTTLE_LIMIT ?? 120);
  return { ttl, limit };
}
