import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { logger } from "@core/logs/logger";

@Injectable()
export class ServiceRegistry implements OnModuleInit {
  private static instance: ServiceRegistry;
  private readonly services: Map<string, OnModuleInit> = new Map();
  private moduleRef!: ModuleRef;
  // Constructor privado para evitar instanciación externa
  private constructor() {}

  async onModuleInit() {}

  //Método para devolver la cantidad de servicios registrados
  public getServiceCount(): number {
    return this.services.size;
  }

  // Método estático para obtener la instancia del singleton
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  // Método para setear ModuleRef al registro
  public setModuleRef(moduleRef: ModuleRef): ServiceRegistry {
    this.moduleRef = moduleRef;
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = this;
    }
    return this;
  }
  // Método para registrar un servicio
  public registry(service: OnModuleInit): void {
    const serviceName = service.constructor.name;
    if (this.services.has(serviceName)) {
      //throw new Error(`El servicio ${serviceName} ya está registrado.`);
      logger.info(`✅ El servicio ${serviceName} ya está registrado.`);
    }
    this.services.set(serviceName, service);
  }

  // Método para eliminar un registro
  public unRegistry(serviceName: string): void {
    if (!this.services.has(serviceName)) {
      //throw new Error(`El servicio ${serviceName} no está registrado.`);
      logger.info(`✅ El servicio ${serviceName} no está registrado.`);
    }
    this.services.delete(serviceName);
  }

  // Método para sobrescribir un registro
  public put(service: OnModuleInit): void {
    const serviceName = service.constructor.name;
    this.services.set(serviceName, service);
  }

  // Método para obtener un servicio registrado
  public get(serviceName: string): OnModuleInit | undefined {
    return this.services.get(serviceName);
  }

  // Método para verificar si un servicio está registrado
  public has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }
  // Método para crear un servicio, registrarlo y retornarlo
  public create(serviceName: string): OnModuleInit | undefined {
    const service = this.moduleRef.get(serviceName, {
      strict: false,
      each: false,
    });
    if (!this.has(serviceName)) this.registry(service);
    return service;
  }
  // Método para registrar una lista de servicios, registrarlos y retornarlos
  public registryAll(serviceNames: any[]): ServiceRegistry {
    serviceNames
      .filter((el) => el !== "" && el !== null) // Asegúrate de retornar la condición
      .map((el) => this.create(el)); // Llama a create para cada servicio válido
    return this;
  }
}
