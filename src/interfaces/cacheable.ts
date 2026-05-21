import { Cache } from "cache-manager";
export type CacheKeyBuilder = (...args: any[]) => string;

export interface CacheOptions {
  key?: string | CacheKeyBuilder;
  ttl?: number;
  hashable?: boolean;
  fallback?: boolean;
}

export interface CacheableContext {
  cacheManager: Cache;
  [key: string]: any;
}
