/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger, NotFoundException, Injectable } from "@nestjs/common";
import { AbstractEntity } from "./abstract.entity";
//import { Helper } from '../helpers/helpers';
import { Repository, FindOneOptions, FindManyOptions } from "typeorm";

@Injectable()
export class AbstractRepository extends Repository<AbstractEntity> {
  protected readonly logger = new Logger(AbstractRepository.name);

  // Método para crear y guardar una nueva entidad
  public async createEntity(
    data: Partial<AbstractEntity>
  ): Promise<AbstractEntity> {
    const entity = this.create(data);
    return this.save(entity);
  }

  // Método para encontrar una entidad por un filtro y lanzar una excepción si no se encuentra
  public async findOneEntity(
    filterQuery: Partial<AbstractEntity>,
    options?: FindOneOptions<AbstractEntity>
  ): Promise<AbstractEntity> {
    const entity = await this.findOne({ where: filterQuery, ...options });
    if (!entity) {
      this.logger.warn(`Entity not found with filterQuery:`, filterQuery);
      throw new NotFoundException("Entity not found.");
    }
    return entity;
  }

  // Método para encontrar y actualizar una entidad
  public async findOneAndUpdate(
    filterQuery: Partial<AbstractEntity>,
    update: Partial<AbstractEntity>
  ): Promise<AbstractEntity> {
    const entity = await this.findOne({ where: filterQuery });
    if (!entity) {
      this.logger.warn(`Entity not found with filterQuery:`, filterQuery);
      throw new NotFoundException("Entity not found.");
    }
    Object.assign(entity, update);
    return this.save(entity);
  }
  // Método para insertar o actualizar una entidad
  public async upsertEntity(
    filterQuery: Partial<AbstractEntity>,
    update: Partial<AbstractEntity>
  ): Promise<AbstractEntity> {
    let entity = await this.findOne({ where: filterQuery });
    if (entity) {
      Object.assign(entity, update);
    } else {
      entity = this.create(update);
    }
    return this.save(entity);
  }
  // Método para encontrar múltiples entidades por un filtro
  public async findEntities(
    filterQuery: Partial<AbstractEntity>,
    options?: FindManyOptions<AbstractEntity>
  ): Promise<AbstractEntity[]> {
    return this.find({ where: filterQuery, ...options });
  }
}
