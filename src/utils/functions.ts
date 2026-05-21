import { createHash } from "crypto";
import { ClassConstructor, plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";

// Sobrecarga de la función
export function generateCacheKey<Type>(
  prefijo: string,
  id: string,
  partialEntity: Partial<Type>
): string;
export function generateCacheKey<Type>(prefijo: string, id: string): string;

// Implementación de la función
export function generateCacheKey<Type>(
  prefijo: string,
  id: string,
  partialEntity?: Partial<Type>
): string {
  if (partialEntity) {
    const hash = createHash("sha256")
      .update(JSON.stringify(partialEntity))
      .digest("hex");
    return `${prefijo}:${id}:${hash}`;
  }
  return `${prefijo}:${id}`;
}

// Sobrecarga 1: Cuando se pasa la clase explícitamente
export async function transformAndValidate<T extends object>(
  cls: ClassConstructor<T>,
  partialDto: Partial<T>
): Promise<T>;

// Sobrecarga 2: Cuando no se pasa la clase (menos type-safe)
export async function transformAndValidate<T extends object>(
  partialDto: Partial<T>
): Promise<T>;

// Implementación real
/**
 * 
 * @param firstArg 
 * @param secondArg 
 * @returns 
 * 
 * 
    import { IsString, IsEmail } from 'class-validator';

    class UserDto {
      @IsString()
      name: string;

      @IsEmail()
      email: string;
    }

    // Uso con clase explícita (recomendado)
    async function example1() {
      const data = { name: 'John', email: 'john@example.com' };
      const validated = await transformAndValidate(UserDto, data);
      // validated es de tipo UserDto
    }

    // Uso sin clase (menos type-safe)
    async function example2() {
      const data = { name: 'Jane', email: 'jane@example.com' };
      const validated = await transformAndValidate<UserDto>(data);
      // validated es de tipo UserDto (pero menos seguro en tiempo de compilación)
    }
 * 
 */
export async function transformAndValidate<T extends object>(
  firstArg: ClassConstructor<T> | Partial<T>,
  secondArg?: Partial<T>
): Promise<T> {
  let cls: ClassConstructor<T> | undefined;
  let partialDto: Partial<T>;

  // Determinar qué sobrecarga se está usando
  if (typeof firstArg === "function") {
    cls = firstArg as ClassConstructor<T>;
    partialDto = secondArg as Partial<T>;
  } else {
    partialDto = firstArg as Partial<T>;
    cls = Object as unknown as ClassConstructor<T>; // Versión menos type-safe
  }

  const dto = plainToClass(cls, partialDto);
  await validateOrReject(dto as object);
  return dto;
}

// Método genérico para construir una instancia a partir de un objeto
export function fromObject<T extends object>(
  this: new () => T,
  obj: Partial<T>
): T {
  const instance = new this();
  Object.assign(instance, obj);
  return instance;
}
