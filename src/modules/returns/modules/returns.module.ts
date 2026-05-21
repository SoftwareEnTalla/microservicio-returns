/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 * CEOs: 
 *       Persy Morell Guerra      Email: pmorellpersi@gmail.com  Phone : +53-5336-4654 Linkedin: https://www.linkedin.com/in/persy-morell-guerra-288943357/
 *       Dailyn García Domínguez  Email: dailyngd@gmail.com      Phone : +53-5432-0312 Linkedin: https://www.linkedin.com/in/dailyn-dominguez-3150799b/
 *
 * CTO: Persy Morell Guerra
 * COO: Dailyn García Domínguez and Persy Morell Guerra
 * CFO: Dailyn García Domínguez and Persy Morell Guerra
 *
 * Repositories: 
 *               https://github.com/SoftwareEnTalla 
 *
 *               https://github.com/apokaliptolesamale?tab=repositories
 *
 *
 * Social Networks:
 *
 *              https://x.com/SoftwarEnTalla
 *
 *              https://www.facebook.com/profile.php?id=61572625716568
 *
 *              https://www.instagram.com/softwarentalla/
 *              
 *
 *
 */


import { Module } from "@nestjs/common";
import { ReturnsCommandController } from "../controllers/returnscommand.controller";
import { ReturnsQueryController } from "../controllers/returnsquery.controller";
import { ReturnsCommandService } from "../services/returnscommand.service";
import { ReturnsQueryService } from "../services/returnsquery.service";

import { ReturnsCommandRepository } from "../repositories/returnscommand.repository";
import { ReturnsQueryRepository } from "../repositories/returnsquery.repository";
import { ReturnsRepository } from "../repositories/returns.repository";
import { ReturnsResolver } from "../graphql/returns.resolver";
import { ReturnsAuthGuard } from "../guards/returnsauthguard.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Returns } from "../entities/returns.entity";
import { BaseEntity } from "../entities/base.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaModule } from "./kafka.module";
import { CreateReturnsHandler } from "../commands/handlers/createreturns.handler";
import { UpdateReturnsHandler } from "../commands/handlers/updatereturns.handler";
import { DeleteReturnsHandler } from "../commands/handlers/deletereturns.handler";
import { GetReturnsByIdHandler } from "../queries/handlers/getreturnsbyid.handler";
import { GetReturnsByFieldHandler } from "../queries/handlers/getreturnsbyfield.handler";
import { GetAllReturnsHandler } from "../queries/handlers/getallreturns.handler";
import { ReturnsCrudSaga } from "../sagas/returns-crud.saga";

import { EVENT_TOPICS } from "../events/event-registry";

//Interceptors
import { ReturnsInterceptor } from "../interceptors/returns.interceptor";
import { ReturnsLoggingInterceptor } from "../interceptors/returns.logging.interceptor";

//Event-Sourcing dependencies
import { EventStoreService } from "../shared/event-store/event-store.service";

@Module({
  imports: [
    CqrsModule,
    KafkaModule,
    TypeOrmModule.forFeature([BaseEntity, Returns]), // Incluir BaseEntity para herencia
    CacheModule.registerAsync({
      useFactory: async () => {
        try {
          const store = await redisStore({
            socket: { host: process.env.REDIS_HOST || "data-center-redis", port: parseInt(process.env.REDIS_PORT || "6379", 10) },
            ttl: parseInt(process.env.REDIS_TTL || "60", 10),
          });
          return { store: store as any, isGlobal: true };
        } catch {
          return { isGlobal: true }; // fallback in-memory
        }
      },
    }),
  ],
  controllers: [ReturnsCommandController, ReturnsQueryController],
  providers: [
    //Services
    EventStoreService,
    ReturnsQueryService,
    ReturnsCommandService,
  
    //Repositories
    ReturnsCommandRepository,
    ReturnsQueryRepository,
    ReturnsRepository,      
    //Resolvers
    ReturnsResolver,
    //Guards
    ReturnsAuthGuard,
    //Interceptors
    ReturnsInterceptor,
    ReturnsLoggingInterceptor,
    //CQRS Handlers
    CreateReturnsHandler,
    UpdateReturnsHandler,
    DeleteReturnsHandler,
    GetReturnsByIdHandler,
    GetReturnsByFieldHandler,
    GetAllReturnsHandler,
    ReturnsCrudSaga,
    //Configurations
    {
      provide: 'EVENT_SOURCING_CONFIG',
      useFactory: () => ({
        enabled: process.env.EVENT_SOURCING_ENABLED !== 'false',
        kafkaEnabled: process.env.KAFKA_ENABLED !== 'false',
        eventStoreEnabled: process.env.EVENT_STORE_ENABLED === 'true',
        publishEvents: true,
        useProjections: true,
        topics: EVENT_TOPICS
      })
    },
  ],
  exports: [
    CqrsModule,
    KafkaModule,
    //Services
    EventStoreService,
    ReturnsQueryService,
    ReturnsCommandService,
  
    //Repositories
    ReturnsCommandRepository,
    ReturnsQueryRepository,
    ReturnsRepository,      
    //Resolvers
    ReturnsResolver,
    //Guards
    ReturnsAuthGuard,
    //Interceptors
    ReturnsInterceptor,
    ReturnsLoggingInterceptor,
  ],
})
export class ReturnsModule {}

