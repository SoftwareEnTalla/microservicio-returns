import * as https from "https";
import * as http from "http";
import { URL } from "url";
import { HttpLoggerApiRest, ILoggerClient } from "src/interfaces/log-context";
import { logger } from "@core/logs/logger";
import { HttpsProxyAgent } from "https-proxy-agent";

export enum HttpLoggerClientStatus {
  connected = "connected",
  disconnected = "disconnected",
}

/**
 * Cliente HTTP para enviar logs a un servicio remoto
 * Implementa ILoggerClient para garantizar compatibilidad
 */
export class HttpLoggerClient implements ILoggerClient {
  private agent: http.Agent | https.Agent | HttpsProxyAgent<string>;
  private status: HttpLoggerClientStatus;
  private baseUrlParsed: URL;

  /**
   * Constructor del cliente HTTP logger
   * @param baseUrl URL base del servicio de logs (debe incluir protocolo http/https)
   * @param strictSSL Si es true, valida certificados SSL (usar false solo en desarrollo)
   */
  constructor(
    private readonly baseUrl: string,
    private strictSSL: boolean = true
  ) {
    this.status = HttpLoggerClientStatus.disconnected;
    this.baseUrlParsed = this.validateBaseUrl(this.baseUrl);
    this.agent = this.initAgent();
  }

  private initAgent(): http.Agent | https.Agent | HttpsProxyAgent<string> {
    // Si hay proxy, usamos HttpsProxyAgent independientemente del protocolo
    if (process.env.HTTPS_PROXY) {
      return new HttpsProxyAgent(process.env.HTTPS_PROXY);
    }

    const protocol = this.getProtocol();
    const isHttps = protocol === https;
    const isProduction = process.env.NODE_ENV === "production";

    // Configuración común para todos los agentes
    const commonAgentOptions = {
      keepAlive: true,
      keepAliveMsecs: 60000, // 1 minuto para mantener conexiones vivas
      maxSockets: 50, // Máximo de sockets concurrentes
      maxFreeSockets: 10, // Sockets libres a mantener
      timeout: 30000, // Timeout de 30 segundos
    };

    if (isProduction) {
      if (isHttps) {
        // Configuración segura para HTTPS en producción
        return new https.Agent({
          ...commonAgentOptions,
          rejectUnauthorized: this.strictSSL,
          minVersion: "TLSv1.2",
          maxVersion: "TLSv1.3",
          ciphers: [
            "TLS_AES_256_GCM_SHA384",
            "TLS_CHACHA20_POLY1305_SHA256",
            "TLS_AES_128_GCM_SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
          ].join(":"),
          honorCipherOrder: true,
        });
      } else {
        // Configuración para HTTP en producción
        return new http.Agent({
          ...commonAgentOptions,
          // Opciones adicionales específicas para HTTP si las hay
        });
      }
    } else {
      if (isHttps) {
        // Configuración menos estricta para HTTPS en desarrollo
        return new https.Agent({
          ...commonAgentOptions,
          rejectUnauthorized: false,
          secureProtocol: "TLS_method",
          ciphers: "ALL",
        });
      } else {
        // Configuración para HTTP en desarrollo
        return new http.Agent({
          ...commonAgentOptions,
          // Opciones adicionales específicas para HTTP en desarrollo si las hay
        });
      }
    }
  }

  private validateBaseUrl(url: string): URL {
    try {
      if (!url.toLowerCase().startsWith("http")) {
        //throw new Error("URL debe usar protocolo HTTP/HTTPS");
        logger.error(`URL debe usar protocolo HTTP/HTTPS`);
      }
      return new URL(url);
    } catch (error) {
      logger.error("URL base inválida", { url, error });
      throw new Error(`URL base inválida: ${url}`);
    }
  }
  get isConnected(): boolean {
    return this.status === HttpLoggerClientStatus.connected;
  }
  private async checkHostReachable(): Promise<boolean> {
    return new Promise((resolve) => {
      const protocol = this.getProtocol();
      const req = protocol.request({
        hostname: this.baseUrlParsed.hostname,
        port:
          this.baseUrlParsed.port ||
          (this.baseUrlParsed.protocol === "https:" ? 443 : 80),
        path: "/",
        method: "HEAD",
        timeout: 5000,
        agent: this.agent,
      });

      req.on("response", (res) => {
        res.destroy(); // No necesitamos el cuerpo de la respuesta
        resolve(res.statusCode !== undefined);
      });

      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }
  /**
   * Establece conexión con el servicio de logs
   * @returns Promise<boolean> True si la conexión es exitosa
   */
  async connect(): Promise<boolean> {
    try {
      // Verificamos conectividad con el host (sin path)
      const isReachable = await this.checkHostReachable();

      if (!isReachable) {
        /*throw new Error(
          `No se puede conectar al host ${this.baseUrlParsed.hostname}`
        );*/
        logger.error(
          `No se puede conectar al host ${this.baseUrlParsed.hostname}`
        );
      }

      logger.log(`Conectado a HTTP Logger en ${this.baseUrl}`);
      this.status = HttpLoggerClientStatus.connected;
      return true;
    } catch (error) {
      logger.error("Error al conectar", { error });
      this.status = HttpLoggerClientStatus.disconnected;
      throw error;
    }
  }

  /**
   * Envía datos de log al servicio remoto
   * @param data Objeto con la información del log
   * @returns Promise<boolean> True si el envío fue exitoso
   */
  async send(data: HttpLoggerApiRest): Promise<boolean> {
    if (!this.isConnected)
      throw new Error("No se puede enviar logs sin conexión");
    this.validateLogData(data);
    const requestData = this.prepareRequestData(data);

    try {
      return requestData ? await this.executeRequest(data, requestData) : false;
    } catch (error) {
      logger.error("Error en send()", { error });
      return false;
    }
  }

  private validateLogData(data: HttpLoggerApiRest): void {
    if (!data?.endpoint) throw new Error("Endpoint es requerido");
    if (!data?.body?.functionName)
      throw new Error("functionName en body es requerido");
    if (!data?.body?.startTime)
      throw new Error("startTime en body es requerido");
    if (!data?.body?.status) throw new Error("status en body es requerido");
  }

  private prepareRequestData(data: HttpLoggerApiRest): string | null {
    try {
      return JSON.stringify(data.body);
    } catch (error) {
      logger.error("Error al serializar los datos del log", error);
      //throw new Error("Error al serializar los datos del log");
    }
    return null;
  }

  private getProtocol(): typeof https | typeof http {
    return this.baseUrlParsed.protocol === "https:" ? https : http;
  }
  private async executeRequest(
    data: HttpLoggerApiRest,
    requestData: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const url = new URL(data.endpoint, this.baseUrl);
      const options = this.getRequestOptions(url, data, requestData);

      logger.debug("Enviando log", {
        url: url.href,
        options: { ...options, agent: undefined },
      });

      const protocol = this.getProtocol();
      const req = protocol.request(options, (res) => {
        let responseBody = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            logger.debug("Respuesta exitosa", { statusCode: res.statusCode });
            resolve(true);
          } else {
            logger.error("Error en respuesta", {
              statusCode: res.statusCode,
              body: responseBody,
            });
            resolve(false);
          }
        });
      });

      req.on("error", (error) => {
        logger.error("Error en solicitud HTTP", { error, req });
        reject(false);
      });

      req.on("timeout", () => {
        logger.error("Timeout en solicitud HTTP");
        req.destroy();
        reject(false);
      });

      req.write(requestData);
      req.end();
    });
  }

  private getRequestOptions(
    url: URL,
    data: HttpLoggerApiRest,
    requestData: string
  ): https.RequestOptions | http.RequestOptions {
    return {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: `${url.pathname}${url.search || ""}`,
      method: data.method || "POST",
      agent: this.agent,
      headers: {
        ...data.headers,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData),
        Accept: "application/json",
        "User-Agent": "HttpLoggerClient/1.0",
      },
      timeout: 30000, // Aumenta el timeout a 30 segundos
    };
  }

  /**
   * Cierra la conexión con el servicio de logs
   * @returns Promise<boolean> True si se cerró correctamente
   */
  async close(): Promise<boolean> {
    logger.log("Cerrando conexión HTTP Logger");
    this.agent.destroy();
    this.status = HttpLoggerClientStatus.disconnected;
    return true;
  }
}
