// Nest Modules
import { InputType, Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

// Third's Modules
import { IsBase64, IsDateString, IsNotEmpty } from "class-validator";

@InputType({ description: "Tipado para el objeto encriptado a recibir" })
export class EncryptedDataInput {
  @ApiProperty()
  @Field(() => Date, { description: "Fecha actual en el cliente" })
  @IsDateString()
  date: Date = new Date();

  @ApiProperty()
  @Field(() => String, { description: "Datos encriptados" })
  @IsNotEmpty({ message: "Los datos encriptados son obligatorios" })
  @IsBase64()
  data: string = "e30="; //{}
}
