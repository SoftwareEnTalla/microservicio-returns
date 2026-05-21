/*
 * Copyright (c) 2025 SoftwarEnTalla - Licencia: MIT
 */

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { logger } from "@core/logs/logger";

/**
 * Configuración genérica de Swagger. Con `include: []`, Swagger escaneará
 * automáticamente todos los módulos registrados en la aplicación.
 */
export function setupSwagger(
  app,
  apiDoc: string = "api-docs",
  title: string = "Microservice API",
  description: string = "API completa del microservicio con documentación automática",
  version: string = "1.0"
): string {
  try {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Ingrese el token JWT",
          in: "header",
        },
        "JWT-auth"
      )
      .addServer("https://api.production.com", "Production")
      .addServer("https://api.staging.com", "Staging")
      .addServer("http://localhost:3000", "Local Development")
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      include: [],
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
      extraModels: [],
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
    });

    SwaggerModule.setup(apiDoc, app, swaggerDocument, {
      customSiteTitle: `${title} Docs`,
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        docExpansion: "list",
        filter: true,
      },
    });

    logger?.info?.("✅ Swagger configurado correctamente");
    return apiDoc;
  } catch (err) {
    logger?.error?.("❌ Error al configurar swagger: " + (err as Error)?.message);
    return apiDoc;
  }
}
