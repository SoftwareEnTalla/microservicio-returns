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

import { InputType, Field, Float, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';




@InputType()
export class BaseReturnsDto {
  @ApiProperty({
    type: () => String,
    description: 'Nombre de instancia CreateReturns',
    example: 'Nombre de instancia CreateReturns',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  name: string = '';

  // Propiedades predeterminadas de la clase CreateReturnsDto según especificación del sistema

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de creación de la instancia (CreateReturns).',
    example: 'Fecha de creación de la instancia (CreateReturns).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  creationDate: Date = new Date(); // Fecha de creación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de actualización de la instancia (CreateReturns).',
    example: 'Fecha de actualización de la instancia (CreateReturns).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  modificationDate: Date = new Date(); // Fecha de modificación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => String,
    description:
      'Usuario que realiza la creación de la instancia (CreateReturns).',
    example:
      'Usuario que realiza la creación de la instancia (CreateReturns).',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  createdBy?: string; // Usuario que crea el objeto

  @ApiProperty({
    type: () => Boolean,
    description: 'Estado de activación de la instancia (CreateReturns).',
    example: 'Estado de activación de la instancia (CreateReturns).',
    nullable: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  @Field(() => Boolean, { nullable: false })
  isActive: boolean = false; // Por defecto, el objeto no está activo

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código de la devolución', nullable: false })
  returnOrderCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Orden asociada',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Orden asociada', nullable: false })
  orderId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Shipment asociado',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Shipment asociado', nullable: false })
  shipmentId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Motivo de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Motivo de la devolución', nullable: false })
  reasonCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Estado global de la devolución',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Estado global de la devolución', nullable: false })
  status!: string;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    description: 'Indica si requiere recogida inversa',
  })
  @IsBoolean()
  @IsNotEmpty()
  @Field(() => Boolean, { description: 'Indica si requiere recogida inversa', nullable: false })
  pickupRequired!: boolean;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Resultado de inspección',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Resultado de inspección', nullable: true })
  inspectionOutcome?: string = '';

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Estado del refund',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Estado del refund', nullable: true })
  refundStatus?: string = '';

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Decisión sobre reposición',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Decisión sobre reposición', nullable: true })
  restockDecision?: string = '';

  @ApiProperty({
    type: () => Date,
    nullable: true,
    description: 'Recepción física',
  })
  @IsDate()
  @IsOptional()
  @Field(() => Date, { description: 'Recepción física', nullable: true })
  receivedAt?: Date = new Date();

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos de devolución',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos de devolución', nullable: true })
  metadata?: Record<string, any> = {};

  // Constructor
  constructor(partial: Partial<BaseReturnsDto>) {
    Object.assign(this, partial);
  }
}




@InputType()
export class ReturnsDto extends BaseReturnsDto {
  // Propiedades específicas de la clase ReturnsDto en cuestión

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Identificador único de la instancia',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<ReturnsDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<ReturnsDto>): ReturnsDto {
    const instance = new ReturnsDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 




@InputType()
export class ReturnsValueInput {
  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Campo de filtro',
  })
  @Field({ nullable: false })
  fieldName: string = 'id';

  @ApiProperty({
    type: () => ReturnsDto,
    nullable: false,
    description: 'Valor del filtro',
  })
  @Field(() => ReturnsDto, { nullable: false })
  fieldValue: any; // Permite cualquier tipo
} 




@ObjectType()
export class ReturnsOutPutDto extends BaseReturnsDto {
  // Propiedades específicas de la clase ReturnsOutPutDto en cuestión

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Identificador único de la instancia',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<ReturnsOutPutDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<ReturnsOutPutDto>): ReturnsOutPutDto {
    const instance = new ReturnsOutPutDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateReturnsDto extends BaseReturnsDto {
  // Propiedades específicas de la clase CreateReturnsDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a crear',
    example:
      'Se proporciona un identificador de CreateReturns a crear \(opcional\) ',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<CreateReturnsDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<CreateReturnsDto>): CreateReturnsDto {
    const instance = new CreateReturnsDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateOrUpdateReturnsDto {
  @ApiProperty({
    type: () => String,
    description: 'Identificador',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  @ApiProperty({
    type: () => CreateReturnsDto,
    description: 'Instancia CreateReturns o UpdateReturns',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Field(() => CreateReturnsDto, { nullable: true })
  input?: CreateReturnsDto | UpdateReturnsDto; // Asegúrate de que esto esté correcto
}



@InputType()
export class DeleteReturnsDto {
  // Propiedades específicas de la clase DeleteReturnsDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a eliminar',
    example: 'Se proporciona un identificador de DeleteReturns a eliminar',
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  id: string = '';

  @ApiProperty({
    type: () => String,
    description: 'Lista de identificadores de instancias a eliminar',
    example:
      'Se proporciona una lista de identificadores de DeleteReturns a eliminar',
    default: [],
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ids?: string[];
}



@InputType()
export class UpdateReturnsDto extends BaseReturnsDto {
  // Propiedades específicas de la clase UpdateReturnsDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a actualizar',
    example: 'Se proporciona un identificador de UpdateReturns a actualizar',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  id!: string;

  // Constructor
  constructor(partial: Partial<UpdateReturnsDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<UpdateReturnsDto>): UpdateReturnsDto {
    const instance = new UpdateReturnsDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 



