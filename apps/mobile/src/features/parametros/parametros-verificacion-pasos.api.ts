import { api } from '../../services/api-client';
import { VERIFICACION_READ_REQUEST_OPTIONS } from '../verificacion/verificacion-api-context';

export const TIPOS_INTEGRANTE_VERIFICACION = [
  'NUEVA',
  'NUEVA_CON_EVIDENCIA',
  'CICLO_2_MAS',
  'CICLO_2_MAS_CON_EVIDENCIA',
] as const;

export const PASOS_VERIFICACION_CONFIGURABLES = [
  'DOCUMENTOS',
  'LLAMADA',
  'VISITA_VECINO',
  'IMAGENES_DOMICILIO',
  'ENTREVISTA',
  'CONCLUSIONES',
] as const;

export type TipoIntegranteVerificacion = (typeof TIPOS_INTEGRANTE_VERIFICACION)[number];
export type PasoVerificacionConfigurable = (typeof PASOS_VERIFICACION_CONFIGURABLES)[number];
export type ModalidadPasoVerificacion =
  | 'OBLIGATORIO'
  | 'OPCIONAL'
  | 'OBLIGATORIO_DESPUES_DIAS';

export interface ReglaPasoVerificacion {
  tipo_integrante: TipoIntegranteVerificacion;
  paso: PasoVerificacionConfigurable;
  modalidad: ModalidadPasoVerificacion;
  dias_para_obligatorio: number | null;
}

export interface MatrizPasosVerificacion {
  version_id: string;
  revision: number;
  publicada_at: string;
  reglas: ReglaPasoVerificacion[];
}

export interface RequisitosVerificacionIntegrante {
  tipo_integrante: TipoIntegranteVerificacion;
  tiene_historial_crelealtad: boolean;
  tiene_evidencia_otra_financiera: boolean;
  matriz_revision: number;
  pasos: ReglaPasoVerificacion[];
}

export const obtenerMatrizPasosVerificacion = () => api.get<{ matriz: MatrizPasosVerificacion }>(
  `/parametros/verificacion/pasos?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const publicarMatrizPasosVerificacion = (
  expectedRevision: number,
  reglas: ReglaPasoVerificacion[],
) => api.put<{ matriz: MatrizPasosVerificacion }>(
  '/parametros/verificacion/pasos',
  { expected_revision: expectedRevision, reglas },
);

export const obtenerRequisitosVerificacionIntegrante = (integranteId: string) => (
  api.get<RequisitosVerificacionIntegrante>(
    `/verificacion/parametros/pasos/integrantes/${integranteId}/requisitos`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);
