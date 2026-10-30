import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  CLASIFICACIONES_MOTIVO_EVIDENCIA,
  ClasificacionMotivoEvidencia,
} from '../parametros-evidencia-motivos.types';

export class ListarMotivosClasificacionEvidenciaDto {
  @IsOptional()
  @IsIn(CLASIFICACIONES_MOTIVO_EVIDENCIA)
  clasificacion?: ClasificacionMotivoEvidencia;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluir_inactivos?: boolean;
}
