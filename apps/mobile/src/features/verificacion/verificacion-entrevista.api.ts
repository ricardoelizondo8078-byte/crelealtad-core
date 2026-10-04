import { api, DOCUMENT_UPLOAD_TIMEOUT_MS } from '../../services/api-client';
import { UbicacionEntrevista } from '../../services/llamada-location';
import { appendDocumentFile } from '../../services/document-upload';
import { createIdempotencyKey } from '../../services/idempotency-key';
import {
  VERIFICACION_READ_REQUEST_OPTIONS,
  VERIFICACION_REQUEST_OPTIONS,
} from './verificacion-api-context';

export type TipoEvidenciaEntrevista =
  | 'NEGOCIO'
  | 'HISTORIAL_CREDITO_ACTIVO'
  | 'HISTORIAL_CREDITO_INACTIVO'
  | 'CONTROL_PAGOS'
  | 'FOLLETO_PREMIO_TESORERA';

export interface DesacuerdoMontoEntrevista {
  integrante_id: string;
  motivo: string;
}

export interface EntrevistaPayload {
  conoce_asesora: boolean | null;
  como_conocio_asesora: string | null;
  conoce_integrantes: boolean | null;
  tiempo_conoce_integrantes: string | null;
  sabe_montos_companeras: boolean | null;
  acuerdo_montos_companeras: boolean | null;
  desacuerdos_montos: DesacuerdoMontoEntrevista[];
  conoce_tesorera: boolean | null;
  tesorera_reconocida_integrante_id: string | null;
  domicilio_recoleccion_integrante_id: string | null;
  desconoce_domicilio_recoleccion: boolean | null;
  tiene_familiares_grupo: boolean | null;
  familiares_grupo_ids: string[];
  tiene_otro_credito_grupal: boolean | null;
  financiera_credito_grupal: string | null;
  credito_grupal_anterior_activo: boolean | null;
  valor_ficha_credito_grupal: number | null;
  semana_actual_credito_grupal: number | null;
  mes_desembolso_credito_grupal: number | null;
  mes_ultimo_pago_credito_grupal: number | null;
  anio_ultimo_pago_credito_grupal: number | null;
  numero_ciclos_credito_grupal: number | null;
  tasa_credito_grupal: number | null;
  nombre_asesora_credito_grupal: string | null;
  telefono_asesora_credito_grupal: string | null;
  motivo_no_renovacion_credito_grupal: string | null;
  vive_en_domicilio: boolean | null;
  motivo_no_vive_domicilio: string | null;
  tipo_domicilio: string | null;
  familiar_domicilio: string | null;
  antiguedad_domicilio: string | null;
  personas_viven_casa: string | null;
  convivientes: string[];
  saben_del_credito: boolean | null;
  otro_ingreso_hogar: boolean | null;
  otro_ingreso_semanal: number | null;
  capacidad_pago_semanal: number | null;
  uso_credito: string | null;
  fuentes_ingreso: string[];
  sueldo_semanal: number | null;
  lugar_trabajo: string | null;
  antiguedad_laboral: string | null;
  tipo_negocio: string | null;
  ingreso_libre_semanal_negocio: number | null;
  ubicacion_negocio: string | null;
  tiene_control_pagos: boolean | null;
  motivo_sin_control_pagos: string | null;
  asesora_acudio_semanalmente: string | null;
  firmaban_control_semanalmente: string | null;
  trato_asesora_tesorera: string | null;
  conoce_premio_tesorera: boolean | null;
  opinion_credito: string | null;
  trato_desembolso: string | null;
  rapidez_desembolso: string | null;
  informacion_credito_clara: boolean | null;
  recomendaria: boolean | null;
  motivo_recomendacion: string | null;
  oportunidad_mejora: string | null;
}

export interface EntrevistaGuardada extends EntrevistaPayload {
  id: string;
  integrante_id: string;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface EvidenciaEntrevistaGuardada {
  id: string;
  tipo: TipoEvidenciaEntrevista;
  archivo_url: string;
  mime_type: 'image/jpeg' | 'image/png';
  foto_capturada_at: string | null;
  registrada_at: string;
}

export interface EvidenciaEntrevistaPendiente {
  tipo: TipoEvidenciaEntrevista;
  uri: string;
  nombre: string;
  mimeType: 'image/jpeg' | 'image/png';
  idempotencyKey: string;
  fotoCapturadaAt: string;
  ubicacion: UbicacionEntrevista;
}

export type EvidenciaNegocioPendiente = EvidenciaEntrevistaPendiente & { tipo: 'NEGOCIO' };
export type EvidenciaNegocioGuardada = EvidenciaEntrevistaGuardada & { tipo: 'NEGOCIO' };

export const crearClaveIdempotenciaEvidenciaEntrevista = (
  tipo: TipoEvidenciaEntrevista,
): string => createIdempotencyKey(`interview_${tipo.toLowerCase()}`);

export const crearClaveIdempotenciaEvidenciaNegocio = (): string => (
  crearClaveIdempotenciaEvidenciaEntrevista('NEGOCIO')
);

export const obtenerEntrevista = async (integranteId: string) => (
  api.get<{ entrevista: EntrevistaGuardada | null }>(
    `/verificacion/integrantes/${integranteId}/entrevista`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const guardarEntrevista = async (
  integranteId: string,
  payload: EntrevistaPayload,
) => (
  api.put<{ entrevista: EntrevistaGuardada }>(
    `/verificacion/integrantes/${integranteId}/entrevista`,
    payload,
    VERIFICACION_REQUEST_OPTIONS,
  )
);

export const obtenerEvidenciasEntrevista = async (integranteId: string) => (
  api.get<{ evidencias: EvidenciaEntrevistaGuardada[] }>(
    `/verificacion/integrantes/${integranteId}/entrevista/evidencias`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const obtenerEvidenciasNegocio = async (integranteId: string) => {
  const resumen = await obtenerEvidenciasEntrevista(integranteId);
  return {
    evidencias: resumen.evidencias.filter(
      (evidencia): evidencia is EvidenciaNegocioGuardada => evidencia.tipo === 'NEGOCIO',
    ),
  };
};

export const registrarEvidenciaEntrevista = async (
  integranteId: string,
  pendiente: EvidenciaEntrevistaPendiente,
) => {
  const formData = new FormData();
  formData.append('tipo', pendiente.tipo);
  formData.append('idempotency_key', pendiente.idempotencyKey);
  formData.append('foto_capturada_at', pendiente.fotoCapturadaAt);
  formData.append('ubicacion_latitud', String(pendiente.ubicacion.latitud));
  formData.append('ubicacion_longitud', String(pendiente.ubicacion.longitud));
  if (pendiente.ubicacion.precision_metros != null) {
    formData.append(
      'ubicacion_precision_metros',
      String(pendiente.ubicacion.precision_metros),
    );
  }
  formData.append('ubicacion_capturada_at', pendiente.ubicacion.capturada_at);
  await appendDocumentFile(formData, pendiente.uri, pendiente.nombre, 'foto');

  return api.post<{
    evidencia: EvidenciaEntrevistaGuardada;
    evidencias: EvidenciaEntrevistaGuardada[];
  }>(
    `/verificacion/integrantes/${integranteId}/entrevista/evidencias`,
    formData,
    {
      ...VERIFICACION_REQUEST_OPTIONS,
      timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS,
    },
  );
};

export const registrarEvidenciaNegocio = (
  integranteId: string,
  pendiente: EvidenciaNegocioPendiente,
) => registrarEvidenciaEntrevista(integranteId, pendiente);
