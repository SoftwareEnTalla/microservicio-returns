import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { metricsRegistry } from './metrics.registry';

@ApiExcludeController()
@Controller('metrics')
export class HorizontalMetricsController {
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
