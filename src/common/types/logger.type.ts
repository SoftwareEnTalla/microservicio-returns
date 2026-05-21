import { HttpLoggerApiRest, ILoggerClient } from "src/interfaces/log-context";

export type LoggerCallback = (
  logData: HttpLoggerApiRest,
  client: ILoggerClient
) => Promise<boolean>;
