export const CLASIFICACIONES_MOTIVO_EVIDENCIA = [
  'VERDE',
  'AMARILLO',
  'ROJO',
] as const;

export type ClasificacionMotivoEvidencia = (
  typeof CLASIFICACIONES_MOTIVO_EVIDENCIA
)[number];

export interface MotivoClasificacionEvidencia {
  id: string;
  clasificacion: ClasificacionMotivoEvidencia;
  concepto: string;
  orden: number;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}
