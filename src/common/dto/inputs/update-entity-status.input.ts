// Nest Modules
import { InputType, Field, ID } from "@nestjs/graphql";

// Third's Modules
import { IsBoolean, isNotEmpty, IsUUID } from "class-validator";

@InputType({
  description:
    "Tipado para el objeto a recibir para actualizar del estado de una entidad",
})
export class UpdateEntityStatusInput {
  @Field(() => ID, { description: "Identificador del entidad" })
  @IsUUID("4", {
    message: "El identificador de la entidad no presenta un patrón válido.",
  })
  id: string = "";

  @Field(() => Boolean, { description: "Estado del entidad" })
  @IsBoolean({
    message: "El estado del entidad debe ser un booleano.",
  })
  active: boolean = false;
}
