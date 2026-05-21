// cache.decorator.ts
import { Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { v4 as uuidv4 } from "uuid";
import { CacheOptions, CacheableContext } from "src/interfaces/cacheable";

export function Cacheable(options: CacheOptions) {
  const injectCache = Inject(CACHE_MANAGER);
  const logger = new Logger("CacheDecorator");

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    // Inyección segura de CacheManager
    if (!target.cacheManager) {
      injectCache(target, "cacheManager");
    }

    descriptor.value = async function (...args: any[]) {
      const context = this as CacheableContext;

      if (!context.cacheManager) {
        logger.error("CacheManager no está disponible");
        return originalMethod.apply(context, args);
      }

      const generateKey = (): string => {
        try {
          let baseKey: string;

          if (typeof options.key === "function") {
            baseKey = options.key(args);
          } else if (options.key) {
            baseKey = options.key;
          } else {
            const argsHash = options.hashable
              ? require("object-hash")(args)
              : uuidv4();
            baseKey = argsHash;
          }

          return `${className}_${methodName}_${baseKey}`.replace(/\s/g, "_");
        } catch (error) {
          logger.error(
            `Error generating cache key: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          return `${className}_${methodName}_fallback_${uuidv4()}`;
        }
      };

      const cacheKey = generateKey();

      try {
        const cachedData = await context.cacheManager.get(cacheKey);
        if (cachedData) {
          logger.debug(`Cache HIT: ${cacheKey}`);
          return cachedData;
        }
      } catch (error) {
        logger.error(
          `Cache GET error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      try {
        const result = await originalMethod.apply(context, args);

        try {
          await context.cacheManager.set(
            cacheKey,
            result,
            options.ttl ? options.ttl * 1000 : 60_000
          );
          logger.debug(`Cache SET: ${cacheKey}`);
        } catch (error) {
          logger.error(
            `Cache SET error: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        return result;
      } catch (error) {
        if (options.fallback) {
          try {
            const fallbackData = await context.cacheManager.get(cacheKey);
            if (fallbackData) {
              logger.warn(`Using FALLBACK data for: ${cacheKey}`);
              return fallbackData;
            }
          } catch (fallbackError) {
            logger.error(
              `Fallback GET error: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`
            );
          }
        }

        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Unknown error occurred");
      }
    };

    return descriptor;
  };
}

