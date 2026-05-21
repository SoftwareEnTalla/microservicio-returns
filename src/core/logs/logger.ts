import { ServiceRegistry } from "@core/service-registry";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { FunctionTrace } from "src/common/logger/loggers.functions";
import { INestApplication } from "@nestjs/common";

@Injectable()
export class LoggerService implements OnModuleInit {
  private readonly environment: string = process.env.NODE_ENV || "development";
  private readonly level: string = process.env.LOG_LEVEL || "info";

  private readonly levels: { [key: string]: number } = {
    error: 0,
    warning: 1,
    info: 2,
    log: 3,
  };

  constructor() {
    console.info(
      `ℹ️ [${this.environment}] Logger level: ${process.env.LOG_LEVEL}`
    );
  }

  async onModuleInit() {
    ServiceRegistry.getInstance().registry(this);
  }

  private shouldLog(level: string): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  //@FunctionTrace("LoggerService")
  log(message: any, ...optionalParams: any[]): void {
    if (this.shouldLog("log")) {
      console.log(`🔊 [${this.environment}] ${message}`, optionalParams);
    }
  }

  //@FunctionTrace("LoggerService")
  debug(message: any, ...optionalParams: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`🔊 [${this.environment}] ${message}`, optionalParams);
    }
  }
  //@FunctionTrace("LoggerService")
  error(message: any, ...optionalParams: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`❌ [${this.environment}] ${message}`, optionalParams);
    }
  }
  //@FunctionTrace("LoggerService")
  warning(message: any, ...optionalParams: any[]): void {
    if (this.shouldLog("warning")) {
      console.warn(`⚠️ [${this.environment}] ${message}`, optionalParams);
    }
  }
  //@FunctionTrace("LoggerService")
  warn(message: any, ...optionalParams: any[]): void {
    this.warning(message, ...optionalParams);
  }
  //@FunctionTrace("LoggerService")
  info(message: any, ...optionalParams: any[]): void {
    if (this.shouldLog("info")) {
      console.info(`ℹ️ [${this.environment}] ${message}`, optionalParams);
    }
  }
  //@FunctionTrace("LoggerService")
  success(message: any, ...optionalParams: any[]): void {
    console.info(`✅ [${this.environment}] ${message}`, optionalParams);
  }
  //@FunctionTrace("LoggerService")
  print(message: any, ...optionalParams: any[]): void {
    console.info(`[${this.environment}] ${message}`, optionalParams);
  }
  //@FunctionTrace("LoggerService")
  notify(message: any, icon: string = "", ...optionalParams: any[]): void {
    console.info(`${icon} [${this.environment}] ${message}`, optionalParams);
  }
}
export default LoggerService;
export const logger = new LoggerService();
