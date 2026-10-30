import { IsIn } from 'class-validator';

export const CALIFICACIONES_REVISION_EVIDENCIA = [
  'TACHA',
  'AMARILLO',
  'PALOMITA',
] as const;

export type CalificacionRevisionEvidencia = (
  typeof CALIFICACIONES_REVISION_EVIDENCIA[number]
);

export class CalificarEvidenciaIntegranteDto {
  @IsIn(CALIFICACIONES_REVISION_EVIDENCIA)
  calificacion!: CalificacionRevisionEvidencia;
}
