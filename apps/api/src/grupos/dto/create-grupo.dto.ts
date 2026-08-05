import { IsString, IsUUID, IsDateString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateGrupoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre: string;

  @IsOptional()
  @IsUUID('4', { message: 'zona_id debe ser un UUID válido' })
  zona_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'sucursal_id debe ser un UUID válido' })
  sucursal_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida' })
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  created_by?: string;
}
