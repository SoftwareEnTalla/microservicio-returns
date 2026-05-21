import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { handlePostgresError } from "../errors/postgres-error-handler";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    try {
      if (exception instanceof HttpException) {
        console.log("1");
        console.log({ exception });

        // Manejo de excepciones específicas de NestJS
        const status = exception.getStatus();
        const message = exception.getResponse();
        console.log({ message });

        // Logging
        // this.logger.error(`${request.method} ${request.url}`, exception.stack);

        response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
        });
      } else if (exception instanceof QueryFailedError) {
        console.log({ exception });

        // Manejo de errores específicos de PostgreSQL
        const nestException = handlePostgresError(exception);

        // Logging
        this.logger.error(
          `${request.method} ${request.url} - PostgreSQL Error`,
          exception.stack
        );

        response.status(nestException.getStatus()).json({
          statusCode: nestException.getStatus(),
          timestamp: new Date().toISOString(),
          path: request.url,
          message: nestException.getResponse(),
        });
      } else if (exception instanceof Error) {
        console.log({ exception });

        // Manejo de otros tipos de excepciones
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message || "Internal Server Error";

        // Logging
        this.logger.error(
          `${request.method} ${request.url} - Error`,
          exception.stack
        );

        response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
        });
      } else {
        // Manejo de otros tipos de excepciones
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = "Internal Server Error";

        // Logging
        this.logger.error(
          `${request.method} ${request.url} - Unexpected Error`,
          exception
        );

        response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
        });
      }
    } catch (error) {
      // Manejo de cualquier error que ocurra dentro del bloque try
      // Verificar si `error` es una instancia de `Error`
      if (error instanceof Error) {
        this.logger.error(
          `Error en el manejo de la excepción: ${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `Error inesperado en el manejo de la excepción:`,
          error
        );
      }

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: "Internal Server Error",
      });
    }
  }
}
