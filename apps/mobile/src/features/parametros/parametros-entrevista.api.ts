import { api } from '../../services/api-client';

export type FamiliaParametroEntrevista =
  | 'COMO_CONOCIO_ASESORA' | 'ANTIGUEDAD_CONOCE_GRUPO' | 'MOTIVO_DESACUERDO_MONTOS'
  | 'MOTIVO_NO_RENOVACION' | 'MOTIVO_NO_VIVE_DOMICILIO' | 'TIPO_DOMICILIO'
  | 'FAMILIAR_DOMICILIO' | 'ANTIGUEDAD_DOMICILIO' | 'PERSONAS_VIVEN_CASA'
  | 'CONVIVIENTES' | 'FUENTES_INGRESO' | 'ANTIGUEDAD_LABORAL'
  | 'MOTIVO_SIN_CONTROL_PAGOS' | 'FRECUENCIA_SERVICIO' | 'CALIFICACION_SERVICIO'
  | 'RAPIDEZ_DESEMBOLSO' | 'MOTIVO_RECOMENDACION_SI' | 'MOTIVO_RECOMENDACION_NO'
  | 'VISITA_VECINO_RESPUESTA_SI' | 'VISITA_VECINO_RESPUESTA_NO';

export interface ParametroEntrevistaOpcion {
  id: string;
  familia: FamiliaParametroEntrevista;
  codigo: string;
  etiqueta: string;
  orden: number;
  activo: boolean;
}

export const listarParametrosEntrevista = (familia: FamiliaParametroEntrevista) => api.get<{
  items: ParametroEntrevistaOpcion[];
}>(`/parametros/verificacion/entrevista?familia=${familia}&incluir_inactivos=true`);

export const listarParametrosEntrevistaActivos = () => api.get<{
  items: ParametroEntrevistaOpcion[];
}>('/verificacion/parametros/entrevista');

export const crearParametroEntrevista = (familia: FamiliaParametroEntrevista, etiqueta: string) => api.post<{
  opcion: ParametroEntrevistaOpcion;
}>('/parametros/verificacion/entrevista', { familia, etiqueta });

export const actualizarParametroEntrevista = (id: string, etiqueta: string) => api.patch<{
  opcion: ParametroEntrevistaOpcion;
}>(`/parametros/verificacion/entrevista/${id}`, { etiqueta });

export const cambiarEstadoParametroEntrevista = (id: string, activo: boolean) => api.patch<{
  opcion: ParametroEntrevistaOpcion;
}>(`/parametros/verificacion/entrevista/${id}/estado`, { activo });

export const reordenarParametrosEntrevista = (
  familia: FamiliaParametroEntrevista,
  opcionIds: string[],
) => api.put<{ items: ParametroEntrevistaOpcion[] }>(
  '/parametros/verificacion/entrevista/orden',
  { familia, opcion_ids: opcionIds },
);
