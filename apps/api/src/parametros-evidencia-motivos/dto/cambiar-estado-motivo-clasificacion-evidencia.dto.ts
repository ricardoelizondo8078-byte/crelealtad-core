import { IsBoolean } from 'class-validator';

export class CambiarEstadoMotivoClasificacionEvidenciaDto {
  @IsBoolean()
  activo: boolean;
}
