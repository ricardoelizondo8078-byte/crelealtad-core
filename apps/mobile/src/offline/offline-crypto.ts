import {
  AESKeySize,
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export interface OfflineEncryptedEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  ciphertext: string;
}

const KEY_PREFIX = 'crelealtad.offline.v1.';
const KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const keyPromises = new Map<string, Promise<AESEncryptionKey>>();

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const safeKeySegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, '_');

const secureStoreKey = (userId: string): string => `${KEY_PREFIX}${safeKeySegment(userId)}`;

const loadKey = async (
  userId: string,
  createIfMissing: boolean,
): Promise<AESEncryptionKey> => {
  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('El cifrado offline sólo está disponible en la app móvil instalada.');
  }

  const stored = await SecureStore.getItemAsync(secureStoreKey(userId), KEY_OPTIONS);
  if (stored) return AESEncryptionKey.import(stored, 'base64');
  if (!createIfMissing) {
    throw new Error(
      'No se encontró la llave local para recuperar la captura offline. No borres ni reemplaces los archivos pendientes.',
    );
  }

  const generated = await AESEncryptionKey.generate(AESKeySize.AES256);
  await SecureStore.setItemAsync(
    secureStoreKey(userId),
    await generated.encoded('base64'),
    KEY_OPTIONS,
  );
  return generated;
};

const getKey = (userId: string, createIfMissing: boolean): Promise<AESEncryptionKey> => {
  const cached = keyPromises.get(userId);
  if (cached) return cached;

  const pending = loadKey(userId, createIfMissing).catch((error) => {
    keyPromises.delete(userId);
    throw error;
  });
  keyPromises.set(userId, pending);
  return pending;
};

const aadBytes = (scope: string): Uint8Array => encoder.encode(scope);

export const encryptOfflineBytes = async (
  userId: string,
  scope: string,
  cleartext: Uint8Array,
): Promise<Uint8Array> => {
  const key = await getKey(userId, true);
  const sealed = await aesEncryptAsync(cleartext, key, {
    additionalData: aadBytes(scope),
  });
  return sealed.combined();
};

export const decryptOfflineBytes = async (
  userId: string,
  scope: string,
  ciphertext: Uint8Array,
): Promise<Uint8Array> => {
  const key = await getKey(userId, false);
  const sealed = AESSealedData.fromCombined(ciphertext);
  return aesDecryptAsync(sealed, key, {
    additionalData: aadBytes(scope),
    output: 'bytes',
  });
};

export const encryptOfflineJson = async (
  userId: string,
  scope: string,
  value: unknown,
): Promise<OfflineEncryptedEnvelope> => {
  const combined = await encryptOfflineBytes(userId, scope, encoder.encode(JSON.stringify(value)));
  const sealed = AESSealedData.fromCombined(combined);
  return {
    version: 1,
    algorithm: 'AES-256-GCM',
    ciphertext: await sealed.combined('base64'),
  };
};

export const decryptOfflineJson = async <T>(
  userId: string,
  scope: string,
  envelope: OfflineEncryptedEnvelope,
): Promise<T> => {
  if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM') {
    throw new Error('La versión del almacenamiento offline cifrado no es compatible.');
  }
  const combined = AESSealedData.fromCombined(envelope.ciphertext);
  const cleartext = await decryptOfflineBytes(
    userId,
    scope,
    await combined.combined(),
  );
  return JSON.parse(decoder.decode(cleartext)) as T;
};

export const isOfflineEncryptedEnvelope = (
  value: unknown,
): value is OfflineEncryptedEnvelope => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<OfflineEncryptedEnvelope>;
  return candidate.version === 1
    && candidate.algorithm === 'AES-256-GCM'
    && typeof candidate.ciphertext === 'string'
    && candidate.ciphertext.length > 0;
};
