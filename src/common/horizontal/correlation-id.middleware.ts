import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export interface HorizontalRequestContext {
  correlationId: string;
  requestId: string;
}

export const horizontalRequestContext =
  new AsyncLocalStorage<HorizontalRequestContext>();

export function getCorrelationId(): string | undefined {
  return horizontalRequestContext.getStore()?.correlationId;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const headerCid =
      (req.headers['x-correlation-id'] as string | undefined) ||
      (req.headers['x-request-id'] as string | undefined);
    const correlationId = headerCid && headerCid.trim() !== '' ? headerCid : randomUUID();
    const requestId = randomUUID();

    req.correlationId = correlationId;
    req.requestId = requestId;
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', requestId);

    horizontalRequestContext.run({ correlationId, requestId }, () => next());
  }
}
