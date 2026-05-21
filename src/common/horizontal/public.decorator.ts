/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 */
import { SetMetadata } from '@nestjs/common';

/**
 * Marca un endpoint (o controlador completo) como público,
 * excluyéndolo del JwtAuthGuard global.
 *
 * Uso:
 *   @Public()
 *   @Get('health')
 *   public health() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
