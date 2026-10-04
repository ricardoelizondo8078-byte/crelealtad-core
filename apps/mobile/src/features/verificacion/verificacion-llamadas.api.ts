import { api, ApiError, DOCUMENT_UPLOAD_TIMEOUT_MS } from '../../services/api-client';
import { appendDocumentFile } from '../../services/document-upload';
import type { RespuestasContactoInicial } from './ContactoInicialStep';
import type { AccionPosteriorLlamada } from './EncuestaLlamadaStep';
import type { UbicacionLlamada } from '../../services/llamada-location';
import { createIdempotencyKey } from '../../services/idempotency-key';
import { VERIFICACION_READ_REQUEST_OPTIONS } from './verificacion-api-context';

export type CanalLlamadaVerificacion = 'TELEFONICA' | 'WHATSAPP';
export type ResultadoLlamadaVerificacion = 'CONTESTADA' | 'NO_CONTESTADA';

export interface ConteoLlamadasVerificacion {
  no_contestadas: number;
  contestadas: number;
}

export interface ResumenLlamadasVerificacion {
  telefonica: ConteoLlamadasVerificacion;
  whatsapp: ConteoLlamadasVerificacion;
  proceso: {
    completado: boolean;
    completado_at: string | null;
  };
  telefonos_confirmados: Record<'PRINCIPAL' | 'SECUNDARIO', {
    telefono: string;
    confirmada_at: string;
    llamada_id: string;
    evidencia_url: string;
  } | null>;
}

export interface RegistroLlamadaResponse {
  llamada: {
    id: string;
    canal: CanalLlamadaVerificacion;
    resultado: ResultadoLlamadaVerificacion;
    created_at: string;
  };
  resumen: ResumenLlamadasVerificacion;
}

export interface EvidenciaLlamadaSeleccionada {
  uri: string;
  nombre: string;
  mimeType: string;
}

interface RegistroEncuestaLlamadaResponse {
  encuesta: {
    id: string;
    llamada_id: string;
    accion_posterior: AccionPosteriorLlamadaApi;
    completada: boolean;
    completada_at: string | null;
    evidencia: {
      id: string;
      ruta: string;
      mime_type: string;
      tamano_bytes: number;
    };
  };
  resumen: ResumenLlamadasVerificacion;
}

interface RegistroConfirmacionTelefonoResponse {
  confirmacion: {
    id: string;
    llamada_id: string;
    tipo_telefono: 'PRINCIPAL' | 'SECUNDARIO';
    telefono: string;
    ruta: string;
    created_at: string;
  };
  resumen: ResumenLlamadasVerificacion;
}

interface ReemplazoEvidenciaTelefonoResponse {
  evidencia: {
    id: string;
    llamada_id: string;
    version: number;
    ruta: string;
    created_at: string;
  };
  resumen: ResumenLlamadasVerificacion;
}

type AccionPosteriorLlamadaApi =
  | 'AGENDO_VISITA'
  | 'ENTREVISTA_CORTA'
  | 'ENTREVISTA_LARGA'
  | 'LLAMAR_MAS_TARDE';

const ACCION_API: Record<AccionPosteriorLlamada, AccionPosteriorLlamadaApi> = {
  'agendo-visita': 'AGENDO_VISITA',
  'entrevista-corta': 'ENTREVISTA_CORTA',
  'entrevista-larga': 'ENTREVISTA_LARGA',
  'llamar-mas-tarde': 'LLAMAR_MAS_TARDE',
};

const respuestaApi = (value: 'si' | 'no' | null): 'SI' | 'NO' => {
  if (value === null) {
    throw new Error('Completa todas las respuestas antes de guardar la llamada.');
  }
  return value === 'si' ? 'SI' : 'NO';
};

export const crearClaveIdempotenciaLlamada = (): string => (
  createIdempotencyKey('call')
);

export const obtenerResumenLlamadas = (integranteId: string) => (
  api.get<ResumenLlamadasVerificacion>(
    `/verificacion/integrantes/${integranteId}/llamadas/resumen`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const registrarLlamada = async (
  integranteId: string,
  canal: CanalLlamadaVerificacion,
  resultado: ResultadoLlamadaVerificacion,
  idempotencyKey: string,
  ubicacion: UbicacionLlamada,
  tipoTelefono?: 'PRINCIPAL' | 'SECUNDARIO',
  telefono?: string,
) => {
  try {
    return await api.post<RegistroLlamadaResponse>(
      `/verificacion/integrantes/${integranteId}/llamadas`,
      {
        canal,
        resultado,
        tipo_telefono: tipoTelefono,
        telefono: telefono?.replace(/\D/g, ''),
        idempotency_key: idempotencyKey,
        ubicacion_latitud: ubicacion.latitud,
        ubicacion_longitud: ubicacion.longitud,
        ubicacion_precision_metros: ubicacion.precision_metros ?? undefined,
        ubicacion_capturada_at: ubicacion.capturada_at,
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      const message = typeof error.data === 'object'
        && error.data !== null
        && 'message' in error.data
        ? JSON.stringify((error.data as { message: unknown }).message)
        : '';
      if (/ubicacion_(latitud|longitud|precision_metros|capturada_at)/.test(message)) {
        throw new Error(
          'No se pudo validar la ubicación del teléfono. Obtén una nueva lectura e intenta nuevamente.',
        );
      }
    }
    throw error;
  }
};

export const registrarEncuestaLlamada = async (
  integranteId: string,
  llamadaId: string,
  respuestas: RespuestasContactoInicial,
  accionPosterior: AccionPosteriorLlamada,
  evidencia: EvidenciaLlamadaSeleccionada,
) => {
  const formData = new FormData();
  formData.append('identidad_coincide', respuestaApi(respuestas.identidadCoincide));
  formData.append('domicilio_coincide', respuestaApi(respuestas.domicilioCoincide));
  formData.append('numero_plantas', respuestaApi(respuestas.caracteristicasDomicilio.numeroPlantas));
  formData.append('color_domicilio', respuestaApi(respuestas.caracteristicasDomicilio.colorDomicilio));
  formData.append('cochera_entrada', respuestaApi(respuestas.caracteristicasDomicilio.cocheraEntrada));
  formData.append('banqueta_frente', respuestaApi(respuestas.caracteristicasDomicilio.banquetaFrente));
  formData.append('objeto_visible', respuestaApi(respuestas.caracteristicasDomicilio.objetoVisible));
  formData.append('referencia_exterior', respuestaApi(respuestas.caracteristicasDomicilio.referenciaExterior));
  formData.append('accion_posterior', ACCION_API[accionPosterior]);
  await appendDocumentFile(formData, evidencia.uri, evidencia.nombre, 'evidencia');

  return api.post<RegistroEncuestaLlamadaResponse>(
    `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/encuesta`,
    formData,
    { timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS },
  );
};

export const registrarConfirmacionTelefono = async (
  integranteId: string,
  llamadaId: string,
  tipoTelefono: 'PRINCIPAL' | 'SECUNDARIO',
  telefono: string,
  evidencia: EvidenciaLlamadaSeleccionada,
) => {
  const formData = new FormData();
  formData.append('tipo_telefono', tipoTelefono);
  formData.append('telefono', telefono.replace(/\D/g, ''));
  await appendDocumentFile(formData, evidencia.uri, evidencia.nombre, 'evidencia');

  return api.post<RegistroConfirmacionTelefonoResponse>(
    `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/confirmacion-telefono`,
    formData,
    { timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS },
  );
};

export const reemplazarEvidenciaTelefono = async (
  integranteId: string,
  llamadaId: string,
  tipoTelefono: 'PRINCIPAL' | 'SECUNDARIO',
  telefono: string,
  evidencia: EvidenciaLlamadaSeleccionada,
) => {
  const formData = new FormData();
  formData.append('tipo_telefono', tipoTelefono);
  formData.append('telefono', telefono.replace(/\D/g, ''));
  await appendDocumentFile(formData, evidencia.uri, evidencia.nombre, 'evidencia');

  return api.post<ReemplazoEvidenciaTelefonoResponse>(
    `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/confirmacion-telefono/reemplazo-evidencia`,
    formData,
    { timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS },
  );
};
