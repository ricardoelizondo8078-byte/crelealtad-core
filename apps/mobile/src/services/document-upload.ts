import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';
import { api, getDocumentUploadTimeoutMs } from './api-client';

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST = 12;

export interface DocumentoRemoto {
  id: string;
  ruta: string;
  archivos: Array<{ indice: number; mime_type: string; url: string }>;
}

interface ProgresoCargaDocumento {
  carga_id: string;
  recibidos: number;
  total_archivos: number;
  completado: false;
}

/**
 * Adjunta un archivo local con una representacion compatible con el fetch de Expo.
 * En SDK 57, el transporte nativo no acepta el descriptor historico
 * `{ uri, name, type }`; necesita un Blob/File que pueda leer sus bytes.
 */
export const appendDocumentFile = async (
  formData: FormData,
  uri: string,
  fileName: string,
  fieldName = 'archivos',
): Promise<void> => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('No se pudo preparar la imagen seleccionada. Elígela nuevamente.');
    }

    const blob = await response.blob();
    if (blob.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      throw new Error('La imagen supera el límite de 10 MB. Elige una versión más ligera.');
    }
    formData.append(fieldName, blob, fileName);
    return;
  }

  const file = new ExpoFile(uri);
  if (!file.exists || file.size <= 0) {
    throw new Error('La imagen ya no está disponible en el teléfono. Elígela nuevamente.');
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new Error('La imagen supera el límite de 10 MB. Elige una versión más ligera.');
  }

  formData.append(fieldName, file as unknown as Blob);
};

const extensionDocumento = (uri: string): 'jpg' | 'png' | 'pdf' => {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png' || extension === 'pdf') return extension;
  return 'jpg';
};

/**
 * Conserva un documento como una sola versión aunque el transporte deba
 * dividirlo en peticiones pequeñas para acotar memoria y tiempo de proceso.
 */
export const uploadDocumentFiles = async (
  integranteId: string,
  tipo: string,
  uris: readonly string[],
): Promise<DocumentoRemoto> => {
  if (uris.length === 0) {
    throw new Error('Selecciona al menos una imagen.');
  }

  let cargaId: string | undefined;
  for (
    let indiceInicio = 0;
    indiceInicio < uris.length;
    indiceInicio += MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST
  ) {
    const lote = uris.slice(
      indiceInicio,
      indiceInicio + MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
    );
    const finalizar = indiceInicio + lote.length === uris.length;
    const formData = new FormData();
    if (cargaId) formData.append('carga_id', cargaId);
    formData.append('indice_inicio', String(indiceInicio));
    formData.append('total_archivos', String(uris.length));
    formData.append('finalizar', String(finalizar));

    for (let index = 0; index < lote.length; index += 1) {
      const uri = lote[index];
      if (!uri) continue;
      const numeroPagina = indiceInicio + index + 1;
      await appendDocumentFile(
        formData,
        uri,
        `${tipo}-${numeroPagina}.${extensionDocumento(uri)}`,
      );
    }

    const respuesta = await api.post<DocumentoRemoto | ProgresoCargaDocumento>(
      `/solicitudes/integrante/${integranteId}/documentos/${tipo}`,
      formData,
      {
        timeoutMs: getDocumentUploadTimeoutMs(lote.length),
        showProcessing: false,
      },
    );

    if (finalizar) {
      if (!('ruta' in respuesta) || !respuesta.ruta) {
        throw new Error('El servidor no confirmó el documento completo. Intenta nuevamente.');
      }
      return respuesta;
    }

    if (!('carga_id' in respuesta) || !respuesta.carga_id || respuesta.completado !== false) {
      throw new Error('El servidor no confirmó el lote recibido. Intenta nuevamente.');
    }
    cargaId = respuesta.carga_id;
  }

  throw new Error('No se pudo completar la carga del documento.');
};
