import { IsIn, IsString, Length } from 'class-validator';
import {
  CLASIFICACIONES_MOTIVO_EVIDENCIA,
  ClasificacionMotivoEvidencia,
} from '../parametros-evidencia-motivos.types';

export class CrearMotivoClasificacionEvidenciaDto {
  @IsIn(CLASIFICACIONES_MOTIVO_EVIDENCIA)
  clasificacion: ClasificacionMotivoEvidencia;

  @IsString()
  @Length(2, 120)
  concepto: string;
}
