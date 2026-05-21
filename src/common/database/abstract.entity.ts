import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@ObjectType({ description: "Entidad abstracta base para todas las entidades" })
@Entity({ name: "abstract_entity" }) // Nombre de la tabla en la base de datos
export class AbstractEntity {
  @Field(() => ID, { description: "Identificador único de la entidad" })
  @PrimaryGeneratedColumn("uuid")
  id!: string; // Identificador único de la entidad

  @Field(() => String, {
    description: "Identificador del usuario que crea la entidad",
    nullable: true,
  })
  @Column({ nullable: true })
  userId?: string; // Identificador del usuario que crea la entidad

  @Field(() => Date, { description: "Nombre de la entidad", nullable: true })
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt?: Date; // Fecha de creación de la entidad
}
