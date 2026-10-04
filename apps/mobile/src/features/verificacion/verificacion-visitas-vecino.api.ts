import type { UbicacionVisitaVecino } from '../../services/llamada-location';
import { api, ApiError, DOCUMENT_UPLOAD_TIMEOUT_MS } from '../../services/api-client';
import { appendDocumentFile } from '../../services/document-upload';
import { createIdempotencyKey } from '../../services/idempotency-key';
import {
  VERIFICACION_READ_REQUEST_OPTIONS,
  VERIFICACION_REQUEST_OPTIONS,
} from './verificacion-api-context';

export interface ResumenVisitaVecino {
  resultado: {
    visita_id: string;
    conoce_y_sabe_donde_vive: boolean;
    fachada_id: string | null;
    registrada_at: string;
  } | null;
}

export interface ResumenFachadaVisitaVecino {
  fachada: {
    id: string;
    archivo_url: string;
    mime_type: 'image/jpeg' | 'image/png';
    foto_capturada_at: string;
    registrada_at: string;
  } | null;
}

export interface ResumenEvidenciaVisitaVecino {
  evidencia: {
    id: string;
    visita_id: string;
    archivo_url: string;
    mime_type: 'image/jpeg' | 'image/png';
    foto_capturada_at: string;
    registrada_at: string;
  } | null;
}

export interface FotoGeolocalizadaVisitaPendiente {
  uri: string;
  idempotencyKey: string;
  fotoCapturadaAt: string;
  ubicacion: UbicacionVisitaVecino;
}

export type FachadaVisitaPendiente = FotoGeolocalizadaVisitaPendiente;
export type EvidenciaVisitaPendiente = FotoGeolocalizadaVisitaPendiente;

export interface RegistroVisitaVecinoResponse {
  visita: {
    id: string;
    conoce_y_sabe_donde_vive: boolean;
    created_at: string;
  };
  resumen: ResumenVisitaVecino;
}

export const crearClaveIdempotenciaVisitaVecino = (): string => (
  createIdempotencyKey('neighbor')
);

export const crearClaveIdempotenciaFachadaVisita = (): string => (
  createIdempotencyKey('facade')
);

export const crearClaveIdempotenciaEvidenciaVisita = (): string => (
  createIdempotencyKey('neighbor_evidence')
);

export const obtenerResumenVisitaVecino = (integranteId: string) => (
  api.get<ResumenVisitaVecino>(
    `/verificacion/integrantes/${integranteId}/visitas-vecino/resumen`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const obtenerResumenFachadaVisita = (integranteId: string) => (
  api.get<ResumenFachadaVisitaVecino>(
    `/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas/resumen`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const registrarFachadaVisita = async (
  integranteId: string,
  pendiente: FachadaVisitaPendiente,
) => {
  const formData = await crearFormDataFotoGeolocalizada(
    pendiente,
    `fachada-${pendiente.fotoCapturadaAt.replace(/[:.]/g, '-')}.jpg`,
  );

  return api.post<ResumenFachadaVisitaVecino>(
    `/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas`,
    formData,
    {
      ...VERIFICACION_REQUEST_OPTIONS,
      timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS,
    },
  );
};

const crearFormDataFotoGeolocalizada = async (
  pendiente: FotoGeolocalizadaVisitaPendiente,
  nombre: string,
): Promise<FormData> => {
  const formData = new FormData();
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
  await appendDocumentFile(
    formData,
    pendiente.uri,
    nombre,
    'foto',
  );
  return formData;
};

export const obtenerResumenEvidenciaVisita = (
  integranteId: string,
  visitaId: string,
) => api.get<ResumenEvidenciaVisitaVecino>(
  `/verificacion/integrantes/${integranteId}/visitas-vecino/${visitaId}/evidencias/resumen`,
  VERIFICACION_READ_REQUEST_OPTIONS,
);

export const registrarEvidenciaVisita = async (
  integranteId: string,
  visitaId: string,
  pendiente: EvidenciaVisitaPendiente,
) => {
  const formData = await crearFormDataFotoGeolocalizada(
    pendiente,
    `evidencia-vecino-${pendiente.fotoCapturadaAt.replace(/[:.]/g, '-')}.jpg`,
  );
  return api.post<ResumenEvidenciaVisitaVecino>(
    `/verificacion/integrantes/${integranteId}/visitas-vecino/${visitaId}/evidencias`,
    formData,
    {
      ...VERIFICACION_REQUEST_OPTIONS,
      timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS,
    },
  );
};

export const registrarVisitaVecino = async (
  integranteId: string,
  conoceYSabeDondeVive: boolean,
  fachadaId: string,
  idempotencyKey: string,
  ubicacion: UbicacionVisitaVecino,
) => {
  try {
    return await api.post<RegistroVisitaVecinoResponse>(
      `/verificacion/integrantes/${integranteId}/visitas-vecino`,
      {
        fachada_id: fachadaId,
        conoce_y_sabe_donde_vive: conoceYSabeDondeVive,
        idempotency_key: idempotencyKey,
        ubicacion_latitud: ubicacion.latitud,
        ubicacion_longitud: ubicacion.longitud,
        ubicacion_precision_metros: ubicacion.precision_metros ?? undefined,
        ubicacion_capturada_at: ubicacion.capturada_at,
      },
      VERIFICACION_REQUEST_OPTIONS,
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
