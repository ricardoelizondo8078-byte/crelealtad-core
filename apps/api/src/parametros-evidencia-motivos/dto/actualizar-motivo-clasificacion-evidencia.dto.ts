import { IsString, Length } from 'class-validator';

export class ActualizarMotivoClasificacionEvidenciaDto {
  @IsString()
  @Length(2, 120)
  concepto: string;
}
