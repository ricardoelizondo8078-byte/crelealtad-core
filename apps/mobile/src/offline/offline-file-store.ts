import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { OfflineFileInput, OfflineFileRef } from './offline-sync.types';

const safeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, '_');

const operationDirectory = (userId: string, operationId: string): Directory => (
  new Directory(
    Paths.document,
    'crelealtad-offline',
    safeSegment(userId),
    safeSegment(operationId),
  )
);

export const persistOfflineFiles = async (
  userId: string,
  operationId: string,
  files: readonly OfflineFileInput[],
): Promise<OfflineFileRef[]> => {
  if (Platform.OS === 'web') {
    throw new Error('La cola durable de archivos está disponible únicamente en la app móvil.');
  }

  const directory = operationDirectory(userId, operationId);
  directory.create({ intermediates: true, idempotent: true });

  const persisted: OfflineFileRef[] = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const input = files[index];
      const source = new File(input.uri);
      if (!source.exists || source.size <= 0) {
        throw new Error(`El archivo ${input.name} ya no está disponible en el teléfono.`);
      }
      const extension = source.extension || '.bin';
      const destination = new File(directory, `${index + 1}-${safeSegment(input.name)}${input.name.endsWith(extension) ? '' : extension}`);
      await source.copy(destination, { overwrite: false });
      persisted.push({
        fieldName: input.fieldName,
        name: input.name,
        mimeType: input.mimeType,
        uri: destination.uri,
        size: destination.size,
      });
    }
    return persisted;
  } catch (error) {
    if (directory.exists) directory.delete();
    throw error;
  }
};

export const removeOfflineFiles = async (
  userId: string,
  operationId: string,
): Promise<void> => {
  const directory = operationDirectory(userId, operationId);
  if (directory.exists) directory.delete();
};
