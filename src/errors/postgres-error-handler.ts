import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function handlePostgresError(error: QueryFailedError): BadRequestException | ConflictException | InternalServerErrorException {
    const pgError = error as any;
    switch (pgError.code) {
        case '23505': // Unique violation
            return new ConflictException('Conflicto de datos: clave duplicada encontrada.');
        case '23503': // Foreign key violation
            return new BadRequestException('Error de clave foránea: la clave foránea no es válida.');
        case '23502': // Not null violation
            return new BadRequestException('Error de restricción: un campo requerido está vacío.');
        case '22P02': // Invalid text representation
            return new BadRequestException('Error de formato: representación de texto no válida.');
        case '23514': // Check violation
            return new BadRequestException('Error de restricción: violación de check.');
        case '23508': // Exclusion violation
            return new BadRequestException('Error de restricción: violación de exclusión.');
        case '22001': // String data, right truncation
            return new BadRequestException('Error de datos: truncamiento de cadena.');
        case '22003': // Numeric value out of range
            return new BadRequestException('Error de datos: valor numérico fuera de rango.');
        case '22012': // Division by zero
            return new BadRequestException('Error de datos: división por cero.');
        case '22023': // Invalid parameter value
            return new BadRequestException('Error de datos: valor de parámetro no válido.');
        case '42601': // Syntax error
            return new BadRequestException('Error de sintaxis en la consulta SQL.');
        case '42703': // Undefined column
            return new BadRequestException('Error de columna: columna no definida.');
        case '42883': // Undefined function
            return new BadRequestException('Error de función: función no definida.');
        case '42P01': // Undefined table
            return new BadRequestException('Error de tabla: tabla no definida.');
        default:
            return new InternalServerErrorException('Error interno del servidor: se ha producido un error inesperado.');
    }
}