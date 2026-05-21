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


import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

const TRACE_WHITELIST_PATTERNS: RegExp[] = [
  /login/i, /register/i, /activate/i, /password-reset/i,
  /validate/i, /onModuleInit/i, /auth/i, /signup/i,
  /forgot-password/i, /reset-password/i, /verify/i,
  /confirm/i, /token/i, /refresh/i, /logout/i,
  /health/i, /ping/i,
];

const TRACE_SOURCE_HEADER = 'x-trace-source';

const TRUSTED_TRACE_SOURCES: string[] = [
  'security-service', 'customer-service', 'client-service',
  'crm-service', 'hrms-service',
  'merchant-service', 'payment-service', 'invoice-service',
  'organization-service',
  'orders-service', 'product-service', 'salesmanager-service',
  'catalog-service', 'codetrace-service',
];

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    // 1. Bearer token auth (primary)
    const token = request.headers.authorization?.split(' ')[1];
    if (token && this.validateToken(token)) return true;

    // 2. Trusted trace source header
    const traceSource = request.headers[TRACE_SOURCE_HEADER] as string;
    if (traceSource && TRUSTED_TRACE_SOURCES.includes(traceSource)) {
      this.logger.debug(`Trusted trace source: ${traceSource}`);
      return true;
    }

    // 3. Whitelist pattern matching on body
    if (request.body && this.isWhitelistedTrace(request.body)) {
      this.logger.debug('Whitelisted trace pattern matched');
      return true;
    }

    return false;
  }

  private validateToken(token: string): boolean {
    // Validación REAL contra JWT_SECRET / JWT_PUBLIC_KEY (compartido con security-service).
    // En dev/local con AUTH_ENABLED=false deja pasar; sin secreto definido falla cerrado.
    try {
      if ((process.env.AUTH_ENABLED || 'true').toLowerCase() !== 'true') return true;
      const secret = process.env.JWT_PUBLIC_KEY || process.env.JWT_SECRET;
      if (!secret) return false;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const jwt = require('jsonwebtoken');
      jwt.verify(token, secret, {
        algorithms: ['HS256', 'HS512', 'RS256'],
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
      });
      return true;
    } catch {
      return false;
    }
  }

  private isWhitelistedTrace(body: any): boolean {
    const name = body?.name || body?.data?.name || '';
    const description = body?.description || body?.data?.description || '';
    const text = `${name} ${description}`;
    return TRACE_WHITELIST_PATTERNS.some((p) => p.test(text));
  }
}
