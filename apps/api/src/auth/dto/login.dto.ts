import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  // ⚠️ TEMPORAL: MinLength reducido a 4 para aceptar PIN 1234 en desarrollo
  // TODO: Restaurar a 6+ cuando se implemente PIN por usuario en producción
  password: string;
}
