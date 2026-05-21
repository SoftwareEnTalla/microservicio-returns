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


import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";

//Definición de entidades
import { Returns } from "../entities/returns.entity";

//Definición de comandos
import {
  CreateReturnsCommand,
  UpdateReturnsCommand,
  DeleteReturnsCommand,
} from "../commands/exporting.command";

import { CommandBus } from "@nestjs/cqrs";
import { ReturnsQueryService } from "../services/returnsquery.service";


import { ReturnsResponse, ReturnssResponse } from "../types/returns.types";
import { FindManyOptions } from "typeorm";
import { PaginationArgs } from "src/common/dto/args/pagination.args";
import { fromObject } from "src/utils/functions";

//Logger
import { LogExecutionTime } from "src/common/logger/loggers.functions";
import { LoggerClient } from "src/common/logger/logger.client";
import { logger } from '@core/logs/logger';

import { v4 as uuidv4 } from "uuid";

//Definición de tdos
import { UpdateReturnsDto, 
CreateOrUpdateReturnsDto, 
ReturnsValueInput, 
ReturnsDto, 
CreateReturnsDto } from "../dtos/all-dto";
 

//@UseGuards(JwtGraphQlAuthGuard)
@Resolver(() => Returns)
export class ReturnsResolver {

   //Constructor del resolver de Returns
  constructor(
    private readonly service: ReturnsQueryService,
    private readonly commandBus: CommandBus
  ) {}

  @LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  // Mutaciones
  @Mutation(() => ReturnsResponse<Returns>)
  async createReturns(
    @Args("input", { type: () => CreateReturnsDto }) input: CreateReturnsDto
  ): Promise<ReturnsResponse<Returns>> {
    return this.commandBus.execute(new CreateReturnsCommand(input));
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Mutation(() => ReturnsResponse<Returns>)
  async updateReturns(
    @Args("id", { type: () => String }) id: string,
    @Args("input") input: UpdateReturnsDto
  ): Promise<ReturnsResponse<Returns>> {
    const payLoad = input;
    return this.commandBus.execute(
      new UpdateReturnsCommand(payLoad, {
        instance: payLoad,
        metadata: {
          initiatedBy: payLoad.createdBy || 'system',
          correlationId: payLoad.id,
        },
      })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Mutation(() => ReturnsResponse<Returns>)
  async createOrUpdateReturns(
    @Args("data", { type: () => CreateOrUpdateReturnsDto })
    data: CreateOrUpdateReturnsDto
  ): Promise<ReturnsResponse<Returns>> {
    if (data.id) {
      const existingReturns = await this.service.findById(data.id);
      if (existingReturns) {
        return this.commandBus.execute(
          new UpdateReturnsCommand(data, {
            instance: data,
            metadata: {
              initiatedBy:
                (data.input as CreateReturnsDto | UpdateReturnsDto).createdBy ||
                'system',
              correlationId: data.id,
            },
          })
        );
      }
    }
    return this.commandBus.execute(
      new CreateReturnsCommand(data, {
        instance: data,
        metadata: {
          initiatedBy:
            (data.input as CreateReturnsDto | UpdateReturnsDto).createdBy ||
            'system',
          correlationId: data.id || uuidv4(),
        },
      })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Mutation(() => Boolean)
  async deleteReturns(
    @Args("id", { type: () => String }) id: string
  ): Promise<boolean> {
    return this.commandBus.execute(new DeleteReturnsCommand(id));
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  // Queries
  @Query(() => ReturnssResponse<Returns>)
  async returnss(
    options?: FindManyOptions<Returns>,
    paginationArgs?: PaginationArgs
  ): Promise<ReturnssResponse<Returns>> {
    return this.service.findAll(options, paginationArgs);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnssResponse<Returns>)
  async returns(
    @Args("id", { type: () => String }) id: string
  ): Promise<ReturnsResponse<Returns>> {
    return this.service.findById(id);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnssResponse<Returns>)
  async returnssByField(
    @Args("field", { type: () => String }) field: string,
    @Args("value", { type: () => ReturnsValueInput }) value: ReturnsValueInput,
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<ReturnssResponse<Returns>> {
    return this.service.findByField(
      field,
      value,
      fromObject.call(PaginationArgs, { page: page, limit: limit })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnssResponse<Returns>)
  async returnssWithPagination(
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<ReturnssResponse<Returns>> {
    const paginationArgs = fromObject.call(PaginationArgs, {
      page: page,
      limit: limit,
    });
    return this.service.findWithPagination({}, paginationArgs);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => Number)
  async totalReturnss(): Promise<number> {
    return this.service.count();
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnssResponse<Returns>)
  async searchReturnss(
    @Args("where", { type: () => ReturnsDto, nullable: false })
    where: Record<string, any>
  ): Promise<ReturnssResponse<Returns>> {
    const returnss = await this.service.findAndCount(where);
    return returnss;
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnsResponse<Returns>, { nullable: true })
  async findOneReturns(
    @Args("where", { type: () => ReturnsDto, nullable: false })
    where: Record<string, any>
  ): Promise<ReturnsResponse<Returns>> {
    return this.service.findOne(where);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(ReturnsResolver.name)

      .get(ReturnsResolver.name),
    })
  @Query(() => ReturnsResponse<Returns>)
  async findOneReturnsOrFail(
    @Args("where", { type: () => ReturnsDto, nullable: false })
    where: Record<string, any>
  ): Promise<ReturnsResponse<Returns> | Error> {
    return this.service.findOneOrFail(where);
  }
}

