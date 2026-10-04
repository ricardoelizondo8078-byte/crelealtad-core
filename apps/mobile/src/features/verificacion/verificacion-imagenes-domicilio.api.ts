import type { UbicacionImagenDomicilio } from '../../services/llamada-location';
import { api, DOCUMENT_UPLOAD_TIMEOUT_MS } from '../../services/api-client';
import { appendDocumentFile } from '../../services/document-upload';
import { createIdempotencyKey } from '../../services/idempotency-key';
import {
  VERIFICACION_READ_REQUEST_OPTIONS,
  VERIFICACION_REQUEST_OPTIONS,
} from './verificacion-api-context';

export const TIPOS_IMAGEN_DOMICILIO = [
  'NOMENCLATURAS_CALLES',
  'FACHADA',
  'MEDIDOR_LUZ',
  'FACHADA_CON_INTEGRANTE',
] as const;

export type TipoImagenDomicilio = (typeof TIPOS_IMAGEN_DOMICILIO)[number];

export const MOTIVOS_SIN_MEDIDOR_LUZ = [
  {
    codigo: 'SIN_SERVICIO_ELECTRICO',
    etiqueta: 'El domicilio no cuenta con servicio de energía eléctrica',
  },
  {
    codigo: 'SERVICIO_COMPARTIDO',
    etiqueta: 'El servicio de luz está compartido con otro domicilio',
  },
  {
    codigo: 'MEDIDOR_EN_OTRO_DOMICILIO',
    etiqueta: 'El medidor se encuentra dentro de otro domicilio',
  },
  {
    codigo: 'MEDIDOR_RETIRADO_O_PENDIENTE',
    etiqueta: 'El medidor fue retirado o está pendiente de instalación',
  },
  {
    codigo: 'UBICACION_DESCONOCIDA',
    etiqueta: 'No sabe dónde está ubicado el medidor',
  },
] as const;

export type MotivoSinMedidorLuz = (typeof MOTIVOS_SIN_MEDIDOR_LUZ)[number]['codigo'];

export interface ImagenDomicilioGuardada {
  id: string;
  tipo: TipoImagenDomicilio;
  archivo_url: string;
  mime_type: 'image/jpeg' | 'image/png';
  foto_capturada_at: string;
  registrada_at: string;
}

export interface ResumenImagenesDomicilio {
  imagenes: Record<TipoImagenDomicilio, ImagenDomicilioGuardada | null>;
  medidor_luz: {
    respuesta_id: string | null;
    fachada_id: string;
    tiene_medidor: boolean;
    motivo: MotivoSinMedidorLuz | null;
    fuente: 'RESPUESTA' | 'IMAGEN_EXISTENTE';
    registrada_at: string;
  } | null;
  proceso: {
    puede_terminar: boolean;
  };
}

export interface ImagenDomicilioPendiente {
  tipo: TipoImagenDomicilio;
  uri: string;
  idempotencyKey: string;
  fotoCapturadaAt: string;
  ubicacion: UbicacionImagenDomicilio;
}

interface RegistroImagenDomicilioResponse {
  imagen: ImagenDomicilioGuardada;
  resumen: ResumenImagenesDomicilio;
}

interface RegistroRespuestaMedidorLuzResponse {
  respuesta: NonNullable<ResumenImagenesDomicilio['medidor_luz']>;
  resumen: ResumenImagenesDomicilio;
}

export const crearClaveIdempotenciaImagenDomicilio = (): string => (
  createIdempotencyKey('home_image')
);

export const crearClaveIdempotenciaRespuestaMedidorLuz = (): string => (
  createIdempotencyKey('meter_answer')
);

export const obtenerResumenImagenesDomicilio = (integranteId: string) => (
  api.get<ResumenImagenesDomicilio>(
    `/verificacion/integrantes/${integranteId}/imagenes-domicilio/resumen`,
    VERIFICACION_READ_REQUEST_OPTIONS,
  )
);

export const registrarRespuestaMedidorLuz = (
  integranteId: string,
  input: {
    fachadaId: string;
    tieneMedidor: boolean;
    motivo?: MotivoSinMedidorLuz;
    idempotencyKey: string;
  },
) => api.post<RegistroRespuestaMedidorLuzResponse>(
  `/verificacion/integrantes/${integranteId}/imagenes-domicilio/medidor-luz/respuesta`,
  {
    fachada_id: input.fachadaId,
    tiene_medidor: input.tieneMedidor,
    motivo: input.motivo,
    idempotency_key: input.idempotencyKey,
  },
  VERIFICACION_REQUEST_OPTIONS,
);

export const registrarImagenDomicilio = async (
  integranteId: string,
  pendiente: ImagenDomicilioPendiente,
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
  await appendDocumentFile(
    formData,
    pendiente.uri,
    `domicilio-${pendiente.tipo.toLowerCase()}-${pendiente.fotoCapturadaAt.replace(/[:.]/g, '-')}.jpg`,
    'foto',
  );

  return api.post<RegistroImagenDomicilioResponse>(
    `/verificacion/integrantes/${integranteId}/imagenes-domicilio`,
    formData,
    {
      ...VERIFICACION_REQUEST_OPTIONS,
      timeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS,
    },
  );
};
