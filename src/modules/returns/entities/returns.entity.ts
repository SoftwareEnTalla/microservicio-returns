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

import { Column, Entity, OneToOne, JoinColumn, ChildEntity, ManyToOne, OneToMany, ManyToMany, JoinTable, Index, Check, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CreateReturnsDto, UpdateReturnsDto, DeleteReturnsDto } from '../dtos/all-dto';
import { IsArray, IsBoolean, IsDate, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from 'graphql-type-json';
import { plainToInstance } from 'class-transformer';



@ChildEntity('returns')
@ObjectType()
export class Returns extends BaseEntity {
  @ApiProperty({
    type: String,
    nullable: false,
    description: "Nombre de la instancia de Returns",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Nombre de la instancia de Returns", nullable: false })
  @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Este es un campo para nombrar la instancia Returns' })
  private name!: string;

  @ApiProperty({
    type: String,
    description: "Descripción de la instancia de Returns",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Descripción de la instancia de Returns", nullable: false })
  @Column({ type: 'varchar', length: 255, nullable: false, default: "Sin descripción", comment: 'Este es un campo para describir la instancia Returns' })
  private description!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código de la devolución', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 80, unique: true, comment: 'Código de la devolución' })
  returnOrderCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Orden asociada',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Orden asociada', nullable: false })
  @Column({ type: 'uuid', nullable: false, comment: 'Orden asociada' })
  orderId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Shipment asociado',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Shipment asociado', nullable: false })
  @Column({ type: 'uuid', nullable: false, comment: 'Shipment asociado' })
  shipmentId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Motivo de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Motivo de la devolución', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 40, comment: 'Motivo de la devolución' })
  reasonCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Estado global de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Estado global de la devolución', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 40, comment: 'Estado global de la devolución' })
  status!: string;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    description: 'Indica si requiere recogida inversa',
  })
  @IsBoolean()
  @IsNotEmpty()
  @Field(() => Boolean, { description: 'Indica si requiere recogida inversa', nullable: false })
  @Column({ type: 'boolean', nullable: false, default: false, comment: 'Indica si requiere recogida inversa' })
  pickupRequired!: boolean;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Resultado de inspección',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Resultado de inspección', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 40, comment: 'Resultado de inspección' })
  inspectionOutcome?: string = '';

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Estado del refund',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Estado del refund', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 40, comment: 'Estado del refund' })
  refundStatus?: string = '';

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Decisión sobre reposición',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Decisión sobre reposición', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 40, comment: 'Decisión sobre reposición' })
  restockDecision?: string = '';

  @ApiProperty({
    type: () => Date,
    nullable: true,
    description: 'Recepción física',
  })
  @IsDate()
  @IsOptional()
  @Field(() => Date, { description: 'Recepción física', nullable: true })
  @Column({ type: 'timestamp', nullable: true, comment: 'Recepción física' })
  receivedAt?: Date = new Date();

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos de devolución',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos de devolución', nullable: true })
  @Column({ type: 'json', nullable: true, comment: 'Metadatos de devolución' })
  metadata?: Record<string, any> = {};

  protected executeDslLifecycle(): void {
    // No se definieron business-rules en el DSL.
  }

  // Relación con BaseEntity (opcional, si aplica)
  // @OneToOne(() => BaseEntity, { cascade: true })
  // @JoinColumn()
  // base!: BaseEntity;

  constructor() {
    super();
    this.type = 'returns';
  }

  // Getters y Setters
  get getName(): string {
    return this.name;
  }
  set setName(value: string) {
    this.name = value;
  }
  get getDescription(): string {
    return this.description;
  }

  // Métodos abstractos implementados
  async create(data: any): Promise<BaseEntity> {
    Object.assign(this, data);
    this.executeDslLifecycle();
    this.modificationDate = new Date();
    return this;
  }
  async update(data: any): Promise<BaseEntity> {
    Object.assign(this, data);
    this.executeDslLifecycle();
    this.modificationDate = new Date();
    return this;
  }
  async delete(id: string): Promise<BaseEntity> {
    this.id = id;
    return this;
  }

  // Método estático para convertir DTOs a entidad con sobrecarga
  static fromDto(dto: CreateReturnsDto): Returns;
  static fromDto(dto: UpdateReturnsDto): Returns;
  static fromDto(dto: DeleteReturnsDto): Returns;
  static fromDto(dto: any): Returns {
    // plainToInstance soporta todos los DTOs
    return plainToInstance(Returns, dto);
  }
}
