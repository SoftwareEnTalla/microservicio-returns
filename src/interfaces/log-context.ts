export interface LogContext {
  className: string;
  functionName: string;
  filePath?: string;
  lineNumber?: number;
}

export interface HttpLoggerApiRest {
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  body: {
    layer?: string;
    uuid?: string;
    refuuid?: string;
    className?: string;
    functionName: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    durationUnit?: string;
    status: "success" | "error";
    error?: {
      message: string;
      stack?: string;
    };
  };
}

export interface LogExecutionTimeOptions {
  layer?: string;
  refuuid?: string;
  timeFormat?: "s" | "ms" | "m";
  client: ILoggerClient | undefined;
  callback?: (
    data: HttpLoggerApiRest,
    client: ILoggerClient
  ) => Promise<boolean>;
}

export interface ILoggerClient {
  connect(): Promise<boolean>;
  send(data: HttpLoggerApiRest): Promise<boolean>;
  close(): Promise<boolean>;
}
