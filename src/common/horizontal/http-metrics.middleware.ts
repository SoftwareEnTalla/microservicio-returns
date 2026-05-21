import { Injectable, NestMiddleware } from '@nestjs/common';
import { metricsRegistry } from './metrics.registry';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const route = (req.route?.path ?? req.path ?? 'unknown') as string;
      const labels = {
        method: String(req.method ?? 'GET'),
        status: String(res.statusCode ?? 0),
      };
      metricsRegistry.incCounter('horizontal_http_requests_total', labels);
      metricsRegistry.observeHistogram(
        'horizontal_http_request_duration_seconds',
        durationSec,
        { route, method: labels.method },
      );
    });
    next();
  }
}
