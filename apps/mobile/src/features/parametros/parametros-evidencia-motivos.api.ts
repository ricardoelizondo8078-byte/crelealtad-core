import { api } from '../../services/api-client';

export type ClasificacionMotivoEvidencia = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface MotivoClasificacionEvidencia {
  id: string;
  clasificacion: ClasificacionMotivoEvidencia;
  concepto: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const listarMotivosClasificacionEvidencia = (
  clasificacion: ClasificacionMotivoEvidencia,
) => api.get<{ items: MotivoClasificacionEvidencia[] }>(
  `/parametros/evidencia/motivos-clasificacion?clasificacion=${clasificacion}&incluir_inactivos=true`,
);

export const crearMotivoClasificacionEvidencia = (
  clasificacion: ClasificacionMotivoEvidencia,
  concepto: string,
) => api.post<{ motivo: MotivoClasificacionEvidencia }>(
  '/parametros/evidencia/motivos-clasificacion',
  { clasificacion, concepto },
);

export const cambiarEstadoMotivoClasificacionEvidencia = (
  motivoId: string,
  activo: boolean,
) => api.patch<{ motivo: MotivoClasificacionEvidencia }>(
  `/parametros/evidencia/motivos-clasificacion/${motivoId}/estado`,
  { activo },
);

export const actualizarMotivoClasificacionEvidencia = (
  motivoId: string,
  concepto: string,
) => api.patch<{ motivo: MotivoClasificacionEvidencia }>(
  `/parametros/evidencia/motivos-clasificacion/${motivoId}`,
  { concepto },
);

export const reordenarMotivosClasificacionEvidencia = (
  clasificacion: ClasificacionMotivoEvidencia,
  motivoIds: string[],
) => api.put<{ items: MotivoClasificacionEvidencia[] }>(
  '/parametros/evidencia/motivos-clasificacion/orden',
  { clasificacion, motivo_ids: motivoIds },
);

export const listarMotivosClasificacionEvidenciaVigentes = () => api.get<{
  items: MotivoClasificacionEvidencia[];
}>('/verificacion/evidencia/motivos-clasificacion', { showProcessing: false });
