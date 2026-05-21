// Nest Modules
import { InputType, Field, ID } from "@nestjs/graphql";

// Third's Modules
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

@InputType({
  description:
    "Tipado para el objeto a recibir para actualizar la imagen de una entidad",
})
export class UpdateEntityImageInput {
  @Field(() => ID, {
    description: "Identificador del entidad",
    nullable: false,
  })
  @IsNotEmpty({ message: "El identificador del entidad es requerido" })
  @IsUUID("4", {
    message: "El identificador del entidad no presenta un patrón válido.",
  })
  id: string = "";

  @Field(() => String, {
    description: "Imagen de perfil del usuario",
    nullable: true,
  })
  @IsOptional()
  @MaxLength(1000, {
    message: "La Url de la imagen no debe superar los 1000 caracteres.",
  })
  imageUrl?: string;

  @Field(() => String, {
    description: "Código de la imagen de Cloudinary",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  imageCode?: string;
}
