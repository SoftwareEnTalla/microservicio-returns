// Nest Modules
import { ArgsType, Field } from "@nestjs/graphql";

// Third's Modules
import { IsDate, IsOptional } from "class-validator";

@ArgsType()
export class DateRangeArgs {
  @Field(() => Date, {
    description: "Fecha inicial del rango",
    nullable: true,
  })
  @IsOptional()
  @IsDate({
    message: "La fecha inicial del rango no posee un formato válido",
  })
  initDate?: Date;

  @Field(() => Date, {
    description: "Fecha final del rango",
    nullable: true,
  })
  @IsOptional()
  @IsDate({ message: "La fecha final del rango no posee un formato válido" })
  endDate?: Date;

  @Field(() => String, {
    description: "Moneda de las facturas",
    nullable: true,
  })
  @IsOptional()
  currencyId?: string;
}
