/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Módulo: catalog-client — endpoints REST de administración de sync.
 */

import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogClientService } from './catalog-client.service';
import { CatalogSyncService } from './catalog-sync.service';

@ApiTags('catalog-sync')
@Controller('catalog-sync')
export class CatalogSyncController {
  constructor(
    private readonly client: CatalogClientService,
    private readonly sync: CatalogSyncService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Estado global del cliente de catalog-service' })
  getStatus() {
    return this.sync.getStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Probar health de catalog-service (dispara probe)' })
  async health() {
    const state = await this.client.probeHealth();
    return { state, baseUrl: this.client.getBaseUrl(), at: new Date().toISOString() };
  }

  @Post('run')
  @ApiOperation({ summary: 'Dispara un ciclo de sync manual' })
  @ApiQuery({ name: 'categoryCode', required: false })
  @ApiQuery({ name: 'reason', required: false })
  async run(
    @Query('categoryCode') categoryCode?: string,
    @Query('reason') reason?: string,
  ) {
    const r = reason ?? 'manual-admin';
    if (categoryCode) {
      return this.sync.syncCategory(categoryCode, 'MANUAL', r);
    }
    return this.sync.syncAll('MANUAL', r);
  }
}
