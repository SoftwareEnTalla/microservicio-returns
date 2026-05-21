import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

interface ProbeResult {
  status: 'up' | 'down';
  details?: Record<string, unknown>;
  error?: string;
}

@ApiTags('horizontal/health')
@Controller('health')
export class HorizontalHealthController {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness: el proceso responde' })
  liveness() {
    return {
      status: 'ok',
      service: process.env.APP_NAME || 'unknown',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness alias k8s' })
  live() {
    return this.liveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness: dependencias críticas (DB) responden' })
  async readiness() {
    const checks: Record<string, ProbeResult> = {};
    checks.process = { status: 'up' };

    if (process.env.INCLUDING_DATA_BASE_SYSTEM === 'true' && this.dataSource) {
      checks.database = await this.probeDatabase();
    }

    const allUp = Object.values(checks).every((c) => c.status === 'up');
    return {
      status: allUp ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async probeDatabase(): Promise<ProbeResult> {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return { status: 'down', error: 'datasource-not-initialized' };
      }
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (err: any) {
      return { status: 'down', error: err?.message ?? String(err) };
    }
  }
}
