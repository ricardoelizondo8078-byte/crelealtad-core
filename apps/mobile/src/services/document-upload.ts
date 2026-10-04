import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';

const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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
