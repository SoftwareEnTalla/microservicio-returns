// Nest Modules
import { ArgsType, Field, Int, registerEnumType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { OrderBy } from "src/common/types/common.types";
// Third's Modules
import { IsDate, IsOptional, IsString, Min } from "class-validator";

@ArgsType()
export class PaginationArgs {
  static readonly maxPageSize: number = 10000;

  @Field(() => Int, {
    description: "Cantidad de valores a omitir",
    nullable: true,
    defaultValue: 0,
  })
  @IsOptional()
  @Min(0, {
    message: "El cantidad mínima de registros a omitir es de 0",
  })
  offset = 0;

  @Field(() => Int, {
    description: "Posición del paginado",
    nullable: true,
    defaultValue: 0,
  })
  @IsOptional()
  @Min(0, {
    message: "La posición mínima del paginado es 0",
  })
  page: number = 0;

  @Field(() => Int, {
    description: "Cantidad de registros a obtener",
    nullable: true,
    defaultValue: 10,
  })
  @IsOptional()
  @Min(1, {
    message: "El cantidad mínima de registros a omitir es de 1",
  })
  limit = 10;

  @Field(() => Int, {
    description: "Cantidad de registros a obtener",
    defaultValue: 10,
  })
  @Min(1, {
    message: "El cantidad mínima de registros a omitir es de 1",
  })
  @Transform(({ value }) =>
    value > PaginationArgs.maxPageSize ? PaginationArgs.maxPageSize : value
  )
  size: number = 1;

  @Field(() => String, {
    description: "Propiedad por la que se quiere ordenar",
    nullable: true,
    defaultValue: "createdAt",
  })
  @IsOptional()
  @IsString({
    message: "La propiedad por la que se quiere ordenar debe ser un string",
  })
  sort: string = "createdAt";

  @Field(() => OrderBy, {
    description: "Orden de los datos",
    nullable: true,
    defaultValue: "asc",
  })
  @IsOptional()
  order: OrderBy = OrderBy.asc;

  @Field(() => String, { description: "Término de búsqueda", nullable: true })
  @IsOptional()
  @IsString({
    message: "El término de búsqueda debe ser un string",
  })
  @Transform(({ value }) => (value ? value : ""))
  search: string = "";

  @Field(() => Date, {
    description: "Fecha del mes para el cual se solicita el kardex",
    nullable: true,
  })
  @IsOptional()
  @IsDate({
    message: "La fecha no posee un formato válido",
  })
  date?: Date;

  @Field(() => Date, {
    description: "Fecha de inicio del período",
    nullable: true,
  })
  @IsOptional()
  @IsDate({
    message: "La fecha no posee un formato válido",
  })
  initDate?: Date;

  @Field(() => Date, {
    description: "Fecha de fin del período",
    nullable: true,
  })
  @IsOptional()
  @IsDate({
    message: "La fecha no posee un formato válido",
  })
  endDate?: Date;

  public static createPaginator(
    page?: number,
    size?: number,
    sort?: string,
    order?: OrderBy,
    search?: string,
    initDate?: Date,
    endDate?: Date
  ): PaginationArgs {
    const paginationArgs = new PaginationArgs();

    paginationArgs.page = page || 1; // Asigna valor por defecto
    paginationArgs.size = size || 25; // Asigna valor por defecto
    paginationArgs.sort = sort || "createdAt"; // Asigna valor por defecto
    paginationArgs.order = order || OrderBy.asc; // Asigna valor por defecto
    paginationArgs.search = search || ""; // Asigna valor por defecto
    paginationArgs.initDate = initDate; // Puede ser undefined si no se proporciona
    paginationArgs.endDate = endDate; // Puede ser undefined si no se proporciona
    paginationArgs.offset = (paginationArgs.page - 1) * paginationArgs.size; // Calcula el offset
    paginationArgs.limit = paginationArgs.size; // Establece el límite

    return paginationArgs;
  }
}

@ArgsType()
export class FilterArgs {
  @Field(() => Int, { description: "Página", nullable: true, defaultValue: 1 })
  @IsOptional()
  @Min(1, {
    message: "El cantidad mínima de registros a omitir es de 0",
  })
  page = 1;

  @Field(() => Int, {
    description: "Cantidad de registros a obtener",
    nullable: true,
    defaultValue: 10,
  })
  @IsOptional()
  @Min(1, {
    message: "El cantidad mínima de registros a omitir es de 1",
  })
  size = 10;

  @Field(() => String, {
    description: "Propiedad por la que se quiere ordenar",
    nullable: true,
    defaultValue: "createdAt",
  })
  @IsOptional()
  @IsString({
    message: "La propiedad por la que se quiere ordenar debe ser un string",
  })
  sort: string = "createdAt";

  @Field(() => OrderBy, {
    description: "Orden de los datos",
    nullable: true,
    defaultValue: "asc",
  })
  @IsOptional()
  order: string = OrderBy.asc;

  @Field(() => String, {
    description: "Término de búsqueda",
    nullable: true,
    defaultValue: "",
  })
  @IsOptional()
  @IsString({
    message: "El término de búsqueda debe ser un string",
  })
  search?: string;
}
