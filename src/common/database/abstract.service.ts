import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from './abstract.repository';
import { AbstractEntity } from './abstract.entity';

@Injectable()
export class AbstractService {
    constructor(
        @InjectRepository(AbstractRepository)
        private readonly abstractRepository: AbstractRepository,
    ) {}

    // Método para crear una nueva entidad
    async create(data: Partial<AbstractEntity>): Promise<AbstractEntity> {
        return this.abstractRepository.createEntity(data);
    }

    // Método para encontrar una entidad por un filtro
    async findOne(filterQuery: Partial<AbstractEntity>): Promise<AbstractEntity> {
        return this.abstractRepository.findOneEntity(filterQuery);
    }

    // Método para encontrar y actualizar una entidad
    async findOneAndUpdate(filterQuery: Partial<AbstractEntity>, update: Partial<AbstractEntity>): Promise<AbstractEntity> {
        return this.abstractRepository.findOneAndUpdate(filterQuery, update);
    }

    // Método para insertar o actualizar una entidad
    async upsert(filterQuery: Partial<AbstractEntity>, update: Partial<AbstractEntity>): Promise<AbstractEntity> {
        return this.abstractRepository.upsertEntity(filterQuery, update);
    }

    // Método para encontrar múltiples entidades por un filtro
    async find(filterQuery: Partial<AbstractEntity>): Promise<AbstractEntity[]> {
        return this.abstractRepository.findEntities(filterQuery);
    }

}
