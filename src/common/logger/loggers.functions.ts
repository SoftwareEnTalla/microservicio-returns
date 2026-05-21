import { performance } from "perf_hooks";
import {
  HttpLoggerApiRest,
  ILoggerClient,
  LogContext,
  LogExecutionTimeOptions,
} from "src/interfaces/log-context";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@core/logs/logger";
import { KafkaLoggerClient } from "./kafka-logger.client";

function getEnhancedContext(): LogContext {
  const error = new Error();
  const stack = error.stack?.split("\n") || [];

  if (stack.length > 2) {
    const match = stack[2].match(
      /at (?:(.+?)\.)?([^\.]+?) \(?(.+?):(\d+):\d+\)?/
    );
    if (match) {
      return {
        className: match[1] || "Global",
        functionName: match[2],
        filePath: match[3],
        lineNumber: parseInt(match[4]),
      };
    }
  }

  return { className: "Global", functionName: "anonymous" };
}

export function getRemoteApiLoggerUrl(): string {
  let createUrl: string = process.env.LOG_API_BASE_URL || "https://logs.api";
  createUrl += process.env.LOG_API_SCOPE
    ? `/${process.env.LOG_API_SCOPE}`
    : "/codetrace";
  createUrl += process.env.LOG_API_CREATE_ACTION
    ? `/${process.env.LOG_API_CREATE_ACTION}`
    : "/command";
  return createUrl;
}
export function LogExecutionTime(options: LogExecutionTimeOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const enabled =
      process.env.LOG_EXECUTION_TIME === "true" &&
      process.env.LOG_READY === "true";

    if (!enabled) return descriptor; // si no está habilitado

    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const uuid = uuidv4();
      const start = performance.now();
      const startTime = new Date().toISOString();
      const context = getEnhancedContext();

      const {
        layer = "default",
        refuuid,
        timeFormat = "ms",
        client, // ILoggerClient obligatorio
        callback, // Opcional
      } = options;

      logger.log(
        `[${layer}] [${target.constructor.name}.${propertyKey}] [${uuid}] Inicio ejecución` // Incluye el nombre de la clase
      );

      try {
        const result = await originalMethod.apply(this, args);

        const end = performance.now();
        const durationMs = end - start;
        const duration = calculateDuration(durationMs, timeFormat);

        logger.log(
          `[${layer}] [${target.constructor.name}.${propertyKey}] [${uuid}] Ejecución completada (${duration}${timeFormat})`
        );

        const logData: HttpLoggerApiRest = {
          endpoint: getRemoteApiLoggerUrl(),
          method: "POST",
          body: {
            layer,
            uuid,
            refuuid,
            className: target.constructor.name,
            functionName: `${target.constructor.name}.${propertyKey}`, // Nombre de la clase y método
            startTime,
            endTime: new Date().toISOString(),
            duration: durationMs,
            durationUnit: timeFormat,
            status: "success",
          },
        };

        if (client || (process.env.LOG_DELIVERY_MODE || "EVENT") === "EVENT") {
          await handleLogDelivery(client, logData, callback);
        }

        return result;
      } catch (error: any) {
        const end = performance.now();
        const durationMs = end - start;
        const duration = calculateDuration(durationMs, timeFormat);

        logger.error(
          `[${layer}] [${target.constructor.name}.${propertyKey}] [${uuid}] Error en ejecución (${duration}${timeFormat}): ${error.message}`,
          error.stack
        );

        const errorLogData: HttpLoggerApiRest = {
          endpoint: getRemoteApiLoggerUrl(),
          method: "POST",
          body: {
            layer,
            uuid,
            refuuid,
            className: target.constructor.name,
            functionName: `${target.constructor.name}.${propertyKey}`, // Nombre de la clase y método
            startTime,
            endTime: new Date().toISOString(),
            duration: durationMs,
            durationUnit: timeFormat,
            status: "error",
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        };

        if (client || (process.env.LOG_DELIVERY_MODE || "EVENT") === "EVENT") {
          await handleLogDelivery(client, errorLogData, callback);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

// Función para obtener información del archivo y línea
function getFileInfo(): [string, number] {
  const stack = new Error().stack;
  if (!stack) return ["No se pudo obtener información del archivo", -1];

  const stackLines = stack.split("\n");

  // Buscamos la línea que contiene el nombre del método decorado
  const methodCallIndex = 2; // Ajusta este índice según la posición en la pila
  const match = stackLines[methodCallIndex]?.match(/\s*at\s+(.*?):(\d+):\d+/); // Captura el archivo y la línea

  if (match) {
    const filePath = match[1]; // Nombre del archivo
    const lineNumber = parseInt(match[2], 10); // Número de línea
    return [filePath, lineNumber];
  }

  return ["No se pudo obtener información del archivo", -1];
}
// Función auxiliar para manejar el envío de logs
// Soporta dos modos de entrega controlados por LOG_DELIVERY_MODE:
//   EVENT (default) → Kafka producer al tópico codetrace-execution-trace
//   REST            → HTTP POST al endpoint de codetrace (comportamiento original)
async function handleLogDelivery(
  client: ILoggerClient | undefined,
  logData: HttpLoggerApiRest,
  callback:
    | ((data: HttpLoggerApiRest, client: ILoggerClient) => Promise<boolean>)
    | undefined
) {
  const deliveryMode = process.env.LOG_DELIVERY_MODE || "EVENT";

  // ── Modo EVENT: enviar vía Kafka (transparente, ignora client REST) ──
  if (deliveryMode === "EVENT") {
    const kafkaClient = KafkaLoggerClient.getInstance();
    try {
      const connected = await kafkaClient.connect();
      if (connected) {
        await kafkaClient.send(logData);
      }
    } catch (err: any) {
      logger.error(`Error en el envío del log vía Kafka: ${err.message}`);
    }
    return;
  }

  // ── Modo REST: comportamiento original vía HTTP ──
  if (!client) return;

  try {
    const connected = await client.connect();

    if (connected && callback) {
      // Si hay callback, usarlo como canal principal
      const success = await callback(logData, client);
      if (!success) {
        logger.warn("Callback ejecutado pero devolvió false");
      }
    } else {
      // Si no hay callback, usar el client directamente
      if (connected) {
        await client.send(logData);
        return client.close();
      }
      return false;
    }
  } catch (err: any | unknown) {
    logger.error(`Error en el envío del log: ${err.message}`);
  } finally {
    try {
      return await client.close();
    } catch (closeError: any | unknown) {
      logger.error(`Error cerrando conexión del logger: ${closeError.message}`);
    }
  }
}

function calculateDuration(
  durationMs: number,
  format: "s" | "ms" | "m"
): number {
  switch (format) {
    case "s":
      return parseFloat((durationMs / 1000).toFixed(3));
    case "m":
      return parseFloat((durationMs / 60000).toFixed(3));
    case "ms":
    default:
      return parseFloat(durationMs.toFixed(3));
  }
}

// Versión para funciones independientes (no métodos de clase)
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  contextName = "Global"
): T {
  const functionName = fn.name || "anonymous";

  return async function (...args: Parameters<T>) {
    const start = performance.now();

    logger.log(`[${functionName}] Inicio ejecución`);

    try {
      const result = await fn(...args);

      const end = performance.now();
      const duration = (end - start).toFixed(3);

      logger.log(`[${functionName}] Ejecución completada (${duration} ms)`);

      return result;
    } catch (error: any | unknown) {
      const end = performance.now();
      const duration = (end - start).toFixed(3);
      logger.error(
        `[${functionName}] Error en ejecución (${duration} ms): ${error.message}`,
        error.stack
      );
      throw error;
    }
  } as T;
}

/**
 * Decorador para trazar llamadas a funciones/métodos
 * Registra el archivo y línea donde se invoca la función
 */
export function FunctionTrace(contextName?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const enabled =
      process.env.LOG_EXECUTION_TIME === "true" &&
      process.env.LOG_READY === "true";
    // Guard clause para propiedades (no métodos)
    if (!descriptor || !descriptor.value || !enabled) {
      return;
    }

    const originalMethod = descriptor.value;
    const className = target.constructor?.name || "AnonymousClass";
    const methodName = String(propertyKey);

    descriptor.value = function (...args: any[]) {
      const [filePath, lineNumber] = getCallerInfo();
      const traceId = generateShortId();

      logger.debug(
        `[TRACE] ${className}.${methodName} called from ${filePath}:${lineNumber} (ID: ${traceId})`
      );

      try {
        const result = originalMethod.apply(this, args);

        // Manejar promesas para métodos async
        if (result instanceof Promise) {
          return result
            .then((res) => {
              logger.debug(
                `[TRACE] ${className}.${methodName} completed (ID: ${traceId})`
              );
              return res;
            })
            .catch((error) => {
              logger.error(
                `[TRACE] ${className}.${methodName} failed from ${filePath}:${lineNumber} (ID: ${traceId}): ${error.message}`
              );
              throw error;
            });
        }

        logger.debug(
          `[TRACE] ${className}.${methodName} completed (ID: ${traceId})`
        );
        return result;
      } catch (error: any) {
        logger.error(
          `[TRACE] ${className}.${methodName} failed from ${filePath}:${lineNumber} (ID: ${traceId}): ${error.message}`
        );
        throw error;
      }
    };

    return descriptor;
  };
}

// Función auxiliar para obtener información del llamador
function getCallerInfo(): [string, number] {
  const stack = new Error().stack?.split("\n") || [];

  // El índice 3 es donde está el llamador real (ajustar según necesidad)
  const callerLine = stack[3] || "";

  const match =
    callerLine.match(/\(?(.+):(\d+):\d+\)?/) ||
    callerLine.match(/\s+at\s+(.+):(\d+):\d+/);

  if (match) {
    return [match[1], parseInt(match[2])];
  }

  return ["unknown", 0];
}

// Genera un ID corto para trazar la llamada
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}
// Versión para funciones independientes
function traceFunction(fn: Function, contextName?: string) {
  const functionName = fn.name || "anonymous";

  return function (...args: any[]) {
    const [filePath, lineNumber] = getCallerInfo();
    const traceId = generateShortId();

    logger.debug(
      `[TRACE] ${functionName} called from ${filePath}:${lineNumber} (ID: ${traceId}) on contextName=[${contextName}]`
    );

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result
          .then((res) => {
            logger.debug(`[TRACE] ${functionName} completed (ID: ${traceId})`);
            return res;
          })
          .catch((error) => {
            logger.error(
              `[TRACE] ${functionName} failed from ${filePath}:${lineNumber} (ID: ${traceId}): ${error.message}`
            );
            throw error;
          });
      }

      logger.debug(`[TRACE] ${functionName} completed (ID: ${traceId})`);
      return result;
    } catch (error: any) {
      logger.error(
        `[TRACE] ${functionName} failed from ${filePath}:${lineNumber} (ID: ${traceId}): ${error.message}`
      );
      throw error;
    }
  };
}
