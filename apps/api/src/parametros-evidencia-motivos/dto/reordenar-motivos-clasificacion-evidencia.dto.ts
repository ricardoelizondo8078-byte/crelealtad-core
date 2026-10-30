import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsUUID } from 'class-validator';
import {
  CLASIFICACIONES_MOTIVO_EVIDENCIA,
  ClasificacionMotivoEvidencia,
} from '../parametros-evidencia-motivos.types';

export class ReordenarMotivosClasificacionEvidenciaDto {
  @IsIn(CLASIFICACIONES_MOTIVO_EVIDENCIA)
  clasificacion: ClasificacionMotivoEvidencia;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  motivo_ids: string[];
}
