import { IsString, Matches, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'La abreviatura debe ser texto' })
  @MaxLength(100, { message: 'La abreviatura es demasiado larga' })
  @Matches(/^[\p{L}\p{N}_]+$/u, {
    message: 'La abreviatura solo puede contener letras, números y guion bajo',
  })
  abreviatura: string;

  @IsString({ message: 'El PIN debe ser texto' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe tener exactamente 4 dígitos' })
  pin: string;
}
