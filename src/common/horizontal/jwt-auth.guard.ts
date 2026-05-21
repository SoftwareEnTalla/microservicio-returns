/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 *
 * JwtAuthGuard global, alineado con security-service.
 *
 * Comportamiento:
 *   - Si AUTH_ENABLED !== 'true', deja pasar (modo dev/local).
 *   - Si el handler/clase tiene @Public(), deja pasar.
 *   - Permite SIEMPRE rutas /health*, /metrics, /api-docs* (operacional).
 *   - Verifica JWT (HS256/HS512/RS256) con la clave compartida JWT_SECRET
 *     o la pública JWT_PUBLIC_KEY contra security-service.
 *   - Adjunta el payload decodificado en request.user para uso downstream.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './public.decorator';

const PUBLIC_PATH_PREFIXES = ['/health', '/metrics', '/api-docs', '/api/health', '/api/metrics'];
const TRACE_SOURCE_HEADER = 'x-trace-source';
const TRACE_PUBLIC_PATH_HEADER = 'x-trace-public-path';
const SECURITY_PUBLIC_TRACE_PATHS: RegExp[] = [
  /^\/api\/logins\/command(?:$|[/?])/i,
  /^\/api\/users\/command\/signup(?:$|[/?])/i,
  /^\/api\/.*(?:forgot|recover|reset|activate|verify|confirm|pin|mfa|totp|password)(?:$|[/?-])/i,
];

function isAllowedSecurityPublicTrace(path: string | undefined): boolean {
  if (!path) {
    return false;
  }

  return SECURITY_PUBLIC_TRACE_PATHS.some((pattern) => pattern.test(path));
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if ((process.env.AUTH_ENABLED || 'true').toLowerCase() !== 'true') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const url = (request.originalUrl || request.url || '').toLowerCase();
    if (PUBLIC_PATH_PREFIXES.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'))) {
      return true;
    }

    const authHeader = request.headers['authorization'] || request.headers['Authorization' as any];
    const token =
      typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.substring(7).trim()
        : undefined;

    const traceSourceHeader = request.headers[TRACE_SOURCE_HEADER] as string | undefined;
    const tracePublicPathHeader = request.headers[TRACE_PUBLIC_PATH_HEADER] as string | undefined;
    if (
      !token &&
      traceSourceHeader?.toLowerCase() === 'security-service' &&
      isAllowedSecurityPublicTrace(tracePublicPathHeader) &&
      (url === '/api/codetraces/command' || url.startsWith('/api/codetraces/command?'))
    ) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const secret = process.env.JWT_PUBLIC_KEY || process.env.JWT_SECRET;
      if (!secret) {
        this.logger.error('JWT_SECRET / JWT_PUBLIC_KEY no definido — token no puede validarse');
        throw new UnauthorizedException('JWT secret not configured');
      }
      const payload = jwt.verify(token, secret, {
        algorithms: ['HS256', 'HS512', 'RS256'],
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
      });
      (request as any).user = payload;
      return true;
    } catch (err: any) {
      this.logger.warn('Invalid JWT: ' + (err?.message || String(err)));
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
