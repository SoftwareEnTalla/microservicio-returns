import { HttpStatus } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OkResponse {
  @ApiProperty({
    description: "Respuesta satisfactoria",
    type: Boolean,
    example: true,
    required: true,
    name: "ok",
  })
  ok: boolean = true;

  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 200,
    required: true,
    name: "status",
  })
  status: HttpStatus.OK = HttpStatus.OK;

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Operación realizada con éxito.",
    required: true,
    name: "message",
  })
  message: string = "Operación realizada con éxito.";

  @ApiPropertyOptional({
    name: "data",
    description:
      "Datos de la respuesta, este campo es de tipo genérico (T) y su valor dependerá el endpoint en que se use.",
    example: "....",
  })
  data: any = null;
}

export class BadRequestResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 400,
    required: true,
    name: "status",
  })
  status: HttpStatus.BAD_REQUEST = HttpStatus.BAD_REQUEST;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example: "Bad Request",
    required: true,
    name: "error",
  })
  error: string = "Bad Request";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Error en los datos de la transacción.",
    required: true,
    name: "message",
  })
  message: string = "Error en los datos de la transacción.";
}

export class UnauthorizedResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 401,
    required: true,
    name: "status",
  })
  status: HttpStatus.UNAUTHORIZED = HttpStatus.UNAUTHORIZED;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example:
      "Unauthorized, ocurre cuando la apiKey o el s/n del dispositivo no son válidos.",
    required: true,
    name: "error",
  })
  error: string = "Unauthorized";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "No autorizado.",
    required: true,
    name: "message",
  })
  message: string = "No autorizado.";
}

export class InternalServerErrorResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 500,
    required: true,
    name: "status",
  })
  status: HttpStatus.INTERNAL_SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example:
      "Internal Server Error, ocurre cuando hay un error en el funcionamiento en el servidor.",
    required: true,
    name: "error",
  })
  error: string = "Internal Server Error";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Error inesperado.",
    required: true,
    name: "message",
  })
  message: string = "Error inesperado.";
}

export class ForbiddenResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 403,
    required: true,
    name: "status",
  })
  status: HttpStatus.FORBIDDEN = HttpStatus.FORBIDDEN;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example:
      "Forbidden, ocurre cuando el usuario no tiene permisos para realizar la acción.",
    required: true,
    name: "error",
  })
  error: string = "Forbidden";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "No tiene permisos para realizar esta acción.",
    required: true,
    name: "message",
  })
  message: string = "No tiene permisos para realizar esta acción.";
}

export class ExpectationFailedResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 417,
    required: true,
    name: "status",
  })
  status: HttpStatus.EXPECTATION_FAILED = HttpStatus.EXPECTATION_FAILED;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example:
      "Expectation Failed, ocurre cuando la expectativa del número de serio no es cumplida.",
    required: true,
    name: "error",
  })
  error: string = "Expectation Failed";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Expectation Failed",
    required: true,
    name: "message",
  })
  message: string = "Expectation Failed";
}

export class NotFoundResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 404,
    required: true,
    name: "status",
  })
  status: HttpStatus.NOT_FOUND = HttpStatus.NOT_FOUND;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example: "Not Found, ocurre cuando el recurso no existe.",
    required: true,
    name: "error",
  })
  error: string = "Not Found";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Recurso no encontrado.",
    required: true,
    name: "message",
  })
  message: string = "Recurso no encontrado.";
}

export class NotAcceptableResponse {
  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 406,
    required: true,
    name: "status",
  })
  status: HttpStatus.NOT_ACCEPTABLE = HttpStatus.NOT_ACCEPTABLE;

  @ApiProperty({
    description: "Error de la respuesta",
    type: String,
    example: "No se puede realizar la operación con los datos suministrados",
    required: true,
    name: "error",
  })
  error: string = "Not Acceptable";

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Terminal no activo.",
    required: true,
    name: "message",
  })
  message: string = "Terminal no activo.";
}

export class RequestTimeoutResponse {
  @ApiProperty({
    description: "Respuesta satisfactoria",
    type: Boolean,
    example: true,
    required: true,
    name: "ok",
  })
  ok: boolean = true;

  @ApiProperty({
    description: "Estado de la respuesta",
    type: Number,
    example: 408,
    required: true,
    name: "status",
  })
  status: HttpStatus.REQUEST_TIMEOUT = HttpStatus.REQUEST_TIMEOUT;

  @ApiProperty({
    description: "Mensaje de la respuesta",
    type: String,
    example: "Terminal no activo.",
    required: true,
    name: "message",
  })
  message: string = "Terminal no activo.";

  @ApiPropertyOptional({
    name: "data",
    description: "Datos de la transacción sin incluir los datos de la tarjeta.",
  })
  data: any = null;
}
