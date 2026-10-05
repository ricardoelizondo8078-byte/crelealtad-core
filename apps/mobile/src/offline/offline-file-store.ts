import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { decryptOfflineBytes, encryptOfflineBytes } from './offline-crypto';
import { OfflineFileInput, OfflineFileRef } from './offline-sync.types';

const ENCRYPTED_EXTENSION = '.clenc';
const TEMPORARY_ROOT_NAME = 'crelealtad-offline-clear';

const safeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, '_');

const operationDirectory = (userId: string, operationId: string): Directory => (
  new Directory(
    Paths.document,
    'crelealtad-offline',
    safeSegment(userId),
    safeSegment(operationId),
  )
);

const encryptedFileScope = (
  userId: string,
  operationId: string,
  encryptedFileName: string,
): string => `crelealtad:offline-file:v1:${userId}:${operationId}:${encryptedFileName}`;

const operationIdFromEncryptedUri = (uri: string): string => (
  Paths.basename(Paths.dirname(uri))
);

const decryptFile = async (
  userId: string,
  encryptedUri: string,
): Promise<Uint8Array> => {
  const encrypted = new File(encryptedUri);
  if (!encrypted.exists || encrypted.size <= 0) {
    throw new Error('La evidencia offline cifrada ya no está disponible en el teléfono.');
  }
  const operationId = operationIdFromEncryptedUri(encryptedUri);
  return decryptOfflineBytes(
    userId,
    encryptedFileScope(userId, operationId, encrypted.name),
    await encrypted.bytes(),
  );
};

const writeEncryptedFile = async (
  userId: string,
  operationId: string,
  source: File,
  destination: File,
): Promise<void> => {
  const cleartext = await source.bytes();
  const encrypted = await encryptOfflineBytes(
    userId,
    encryptedFileScope(userId, operationId, destination.name),
    cleartext,
  );
  destination.create({ intermediates: true, overwrite: false });
  destination.write(encrypted);

  const verified = await decryptFile(userId, destination.uri);
  if (verified.byteLength !== cleartext.byteLength) {
    destination.delete();
    throw new Error('No se pudo verificar la copia cifrada de la evidencia.');
  }
};

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
      const clearName = `${index + 1}-${safeSegment(input.name)}${input.name.endsWith(extension) ? '' : extension}`;
      const destination = new File(directory, `${clearName}${ENCRYPTED_EXTENSION}`);
      await writeEncryptedFile(userId, operationId, source, destination);
      persisted.push({
        fieldName: input.fieldName,
        name: input.name,
        mimeType: input.mimeType,
        uri: destination.uri,
        size: source.size,
        encryption: {
          version: 1,
          algorithm: 'AES-256-GCM',
        },
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

export const clearOfflineTemporaryFiles = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  const temporaryRoot = new Directory(Paths.cache, TEMPORARY_ROOT_NAME);
  try {
    if (temporaryRoot.exists) temporaryRoot.delete();
  } catch {
    // La siguiente materialización vuelve a intentar la limpieza de su directorio acotado.
  }
};

export const migrateLegacyOfflineFiles = async (
  userId: string,
  operationId: string,
  files: readonly OfflineFileRef[],
): Promise<{ files: OfflineFileRef[]; changed: boolean }> => {
  let changed = false;
  const migrated: OfflineFileRef[] = [];
  const expectedDirectory = operationDirectory(userId, operationId);
  const expectedPrefix = expectedDirectory.uri.endsWith('/')
    ? expectedDirectory.uri
    : `${expectedDirectory.uri}/`;

  for (const reference of files) {
    if (reference.encryption) {
      migrated.push(reference);
      continue;
    }

    const source = new File(reference.uri);
    if (!source.uri.startsWith(expectedPrefix) || !source.exists || source.size <= 0) {
      throw new Error('Una evidencia pendiente requiere revisión antes de migrar el almacenamiento seguro.');
    }
    const destination = new File(`${source.uri}${ENCRYPTED_EXTENSION}`);
    if (!destination.exists) {
      await writeEncryptedFile(userId, operationId, source, destination);
    } else {
      await decryptFile(userId, destination.uri);
    }
    migrated.push({
      ...reference,
      uri: destination.uri,
      size: source.size,
      encryption: { version: 1, algorithm: 'AES-256-GCM' },
    });
    changed = true;
  }

  return { files: migrated, changed };
};

export const cleanupLegacyOfflineFiles = (
  userId: string,
  operationId: string,
  files: readonly OfflineFileRef[],
): void => {
  const expectedDirectory = operationDirectory(userId, operationId);
  const expectedPrefix = expectedDirectory.uri.endsWith('/')
    ? expectedDirectory.uri
    : `${expectedDirectory.uri}/`;
  for (const reference of files) {
    if (!reference.encryption || !reference.uri.endsWith(ENCRYPTED_EXTENSION)) continue;
    const legacyUri = reference.uri.slice(0, -ENCRYPTED_EXTENSION.length);
    if (!legacyUri.startsWith(expectedPrefix)) continue;
    const legacy = new File(legacyUri);
    if (legacy.exists) legacy.delete();
  }
};

export interface MaterializedOfflineFiles {
  files: OfflineFileRef[];
  cleanup: () => Promise<void>;
}

export const materializeOfflineFiles = async (
  userId: string,
  purpose: 'upload' | 'preview',
  operationId: string,
  files: readonly OfflineFileRef[],
): Promise<MaterializedOfflineFiles> => {
  const encryptedFiles = files.filter((file) => file.encryption);
  if (encryptedFiles.length === 0) {
    return { files: [...files], cleanup: async () => undefined };
  }

  const directory = new Directory(
    Paths.cache,
    TEMPORARY_ROOT_NAME,
    purpose,
    safeSegment(userId),
    safeSegment(operationId),
  );
  if (directory.exists) directory.delete();
  directory.create({ intermediates: true, idempotent: true });

  try {
    const materialized: OfflineFileRef[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const reference = files[index];
      if (!reference.encryption) {
        materialized.push(reference);
        continue;
      }
      const destination = new File(directory, `${index + 1}-${safeSegment(reference.name)}`);
      destination.create({ intermediates: true, overwrite: false });
      destination.write(await decryptFile(userId, reference.uri));
      materialized.push({ ...reference, uri: destination.uri });
    }
    return {
      files: materialized,
      cleanup: async () => {
        try {
          if (directory.exists) directory.delete();
        } catch {
          // No se convierte una escritura ya confirmada en reintento por un fallo de caché.
        }
      },
    };
  } catch (error) {
    if (directory.exists) directory.delete();
    throw error;
  }
};

export const materializeOfflineUrisForPreview = async (
  userId: string,
  uris: readonly string[],
): Promise<{ uris: string[]; cleanup: () => Promise<void> }> => {
  const encryptedUris = uris.filter((uri) => uri.endsWith(ENCRYPTED_EXTENSION));
  if (encryptedUris.length === 0) {
    return { uris: [...uris], cleanup: async () => undefined };
  }

  const operationId = operationIdFromEncryptedUri(encryptedUris[0]);
  const references: OfflineFileRef[] = uris.map((uri, index) => ({
    uri,
    name: uri.endsWith(ENCRYPTED_EXTENSION)
      ? Paths.basename(uri).slice(0, -ENCRYPTED_EXTENSION.length).replace(/^\d+-/, '')
      : Paths.basename(uri),
    fieldName: `preview-${index}`,
    size: new File(uri).size,
    encryption: uri.endsWith(ENCRYPTED_EXTENSION)
      ? { version: 1, algorithm: 'AES-256-GCM' }
      : undefined,
  }));
  const result = await materializeOfflineFiles(
    userId,
    'preview',
    operationId,
    references,
  );
  return {
    uris: result.files.map((file) => file.uri),
    cleanup: result.cleanup,
  };
};
