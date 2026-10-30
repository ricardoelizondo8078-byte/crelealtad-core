import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  completeOfflineOperation,
  discardBlockedOfflineOperationsByDedupe,
  enqueueOfflineOperation,
  getNextOfflineOperation,
  getOfflineDraft,
  getOfflineOperation,
  getOfflineServerVersion,
  markOfflineOperationSyncing,
  recoverInterruptedOfflineOperations,
  saveOfflineDraft,
  setOfflineServerVersion,
} from './offline-sync.repository';
import { OfflineDocumentOperation, OfflineJsonOperation } from './offline-sync.types';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('./offline-crypto', () => ({
  encryptOfflineJson: async (_userId: string, _scope: string, value: unknown) => ({
    version: 1,
    algorithm: 'AES-256-GCM',
    ciphertext: Buffer.from(JSON.stringify(value), 'utf8').toString('base64'),
  }),
  decryptOfflineJson: async <T,>(
    _userId: string,
    _scope: string,
    envelope: { ciphertext: string },
  ): Promise<T> => JSON.parse(Buffer.from(envelope.ciphertext, 'base64').toString('utf8')) as T,
  isOfflineEncryptedEnvelope: (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return candidate.version === 1
      && candidate.algorithm === 'AES-256-GCM'
      && typeof candidate.ciphertext === 'string';
  },
}));

jest.mock('./offline-file-store', () => ({
  migrateLegacyOfflineFiles: async (
    _userId: string,
    _operationId: string,
    files: Record<string, unknown>[],
  ) => ({
    changed: files.some((file) => !file.encryption),
    files: files.map((file) => file.encryption ? file : ({
      ...file,
      uri: `${file.uri}.clenc`,
      encryption: { version: 1, algorithm: 'AES-256-GCM' },
    })),
  }),
  cleanupLegacyOfflineFiles: jest.fn(),
}));

const userId = 'usuario-prueba';
const draftKey = 'DOCUMENTACION:integrante:integrante-1';

const createOperation = (
  id: string,
  body: Record<string, unknown>,
): OfflineJsonOperation => ({
  version: 1,
  id,
  userId,
  module: 'DOCUMENTACION',
  entityType: 'integrante',
  entityId: 'integrante-1',
  dedupeKey: 'solicitud:integrante-1:datos',
  draftKey,
  kind: 'JSON_REQUEST',
  status: 'PENDING',
  attempts: 0,
  nextAttemptAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  request: {
    endpoint: '/solicitudes/integrante/integrante-1',
    method: 'PATCH',
    body,
  },
});

describe('offline-sync.repository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('consolida autoguardados pendientes por clave sin duplicar operaciones', async () => {
    await saveOfflineDraft({
      userId,
      key: draftKey,
      module: 'DOCUMENTACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      data: { calle: 'Inicial' },
    });
    const firstId = await enqueueOfflineOperation(createOperation('operacion-1', { calle: 'A' }));
    const secondId = await enqueueOfflineOperation(createOperation('operacion-2', { calle: 'B' }));

    expect(secondId).toBe(firstId);
    await expect(getOfflineOperation(userId, firstId)).resolves.toMatchObject({
      request: { body: { calle: 'B' } },
    });
  });

  it('recupera una operación interrumpida como pendiente después de reiniciar', async () => {
    await enqueueOfflineOperation(createOperation('operacion-1', { calle: 'A' }));
    await markOfflineOperationSyncing(userId, 'operacion-1');
    await recoverInterruptedOfflineOperations(userId);

    await expect(getNextOfflineOperation(userId, Date.now() + 1_000))
      .resolves.toMatchObject({ id: 'operacion-1', status: 'PENDING' });
  });

  it('conserva un cambio nuevo cuando la versión anterior ya está en vuelo', async () => {
    await enqueueOfflineOperation(createOperation('operacion-1', { calle: 'A' }));
    await markOfflineOperationSyncing(userId, 'operacion-1');
    const nextId = await enqueueOfflineOperation(createOperation('operacion-2', { calle: 'B' }));

    expect(nextId).toBe('operacion-2');
    await completeOfflineOperation(userId, 'operacion-1');
    await expect(getOfflineOperation(userId, 'operacion-2')).resolves.toMatchObject({
      status: 'PENDING',
      request: { body: { calle: 'B' } },
    });
  });

  it('marca el borrador sincronizado sólo cuando ya no hay otra escritura para él', async () => {
    await saveOfflineDraft({
      userId,
      key: draftKey,
      module: 'DOCUMENTACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      data: { calle: 'A' },
    });
    await enqueueOfflineOperation(createOperation('operacion-1', { calle: 'A' }));
    await completeOfflineOperation(userId, 'operacion-1');

    await expect(getOfflineDraft(userId, draftKey)).resolves.toMatchObject({ status: 'SYNCED' });
  });

  it('encadena la versión confirmada en la siguiente escritura pendiente', async () => {
    await setOfflineServerVersion(userId, 'solicitud-version', '2026-01-01T00:00:00.000Z');
    const primera = createOperation('operacion-1', {
      calle: 'A',
      expected_updated_at: '2026-01-01T00:00:00.000Z',
    });
    primera.request.conflict = {
      key: 'solicitud-version',
      requestField: 'expected_updated_at',
      responsePath: 'updated_at',
    };
    await enqueueOfflineOperation(primera);
    await markOfflineOperationSyncing(userId, primera.id);

    const segunda = createOperation('operacion-2', {
      calle: 'B',
      expected_updated_at: '2026-01-01T00:00:00.000Z',
    });
    segunda.request.conflict = primera.request.conflict;
    await enqueueOfflineOperation(segunda);

    await completeOfflineOperation(userId, primera.id, {
      updated_at: '2026-01-02T00:00:00.000Z',
    });

    await expect(getOfflineServerVersion(userId, 'solicitud-version'))
      .resolves.toBe('2026-01-02T00:00:00.000Z');
    await expect(getOfflineOperation(userId, segunda.id)).resolves.toMatchObject({
      request: {
        body: {
          calle: 'B',
          expected_updated_at: '2026-01-02T00:00:00.000Z',
        },
      },
    });
  });

  it('no deja el contenido del borrador visible en AsyncStorage', async () => {
    await saveOfflineDraft({
      userId,
      key: draftKey,
      module: 'DOCUMENTACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      data: { calle: 'DOMICILIO_DE_PRUEBA_SENSIBLE' },
    });

    const raw = await AsyncStorage.getItem(`crelealtad:offline-sync:v2:${userId}`);
    expect(raw).toContain('AES-256-GCM');
    expect(raw).not.toContain('DOMICILIO_DE_PRUEBA_SENSIBLE');
  });

  it('migra el almacén v1 sólo después de verificar el contenedor cifrado', async () => {
    const legacyUri = 'file:///crelealtad-offline/usuario-prueba/operacion-archivo/1-ine.jpg';
    await AsyncStorage.setItem(`crelealtad:offline-sync:v1:${userId}`, JSON.stringify({
      version: 1,
      userId,
      operations: [{
        version: 1,
        id: 'operacion-archivo',
        userId,
        module: 'DOCUMENTACION',
        entityType: 'integrante',
        entityId: 'integrante-1',
        dedupeKey: 'documento:integrante-1:ine',
        draftKey,
        kind: 'DOCUMENT_UPLOAD',
        status: 'PENDING',
        attempts: 0,
        nextAttemptAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        request: {
          integranteId: 'integrante-1',
          tipo: 'ine',
          files: [{
            uri: legacyUri,
            name: 'ine.jpg',
            fieldName: 'archivos',
            size: 128,
          }],
          progress: { cargaId: 'operacion-archivo', nextIndex: 0 },
        },
      }],
      drafts: {
        [draftKey]: {
          version: 1,
          key: draftKey,
          userId,
          module: 'DOCUMENTACION',
          entityType: 'integrante',
          entityId: 'integrante-1',
          data: { calle: 'LEGADO_DE_PRUEBA', urisLocales: [legacyUri] },
          status: 'LOCAL',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      serverVersions: {},
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));

    await expect(getOfflineDraft(userId, draftKey)).resolves.toMatchObject({
      data: {
        calle: 'LEGADO_DE_PRUEBA',
        urisLocales: [`${legacyUri}.clenc`],
      },
    });
    await expect(AsyncStorage.getItem(`crelealtad:offline-sync:v1:${userId}`)).resolves.toBeNull();
    const encrypted = await AsyncStorage.getItem(`crelealtad:offline-sync:v2:${userId}`);
    expect(encrypted).not.toContain('LEGADO_DE_PRUEBA');
  });

  it('no reemplaza por un almacén vacío un contenedor cifrado dañado', async () => {
    const key = `crelealtad:offline-sync:v2:${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      version: 1,
      algorithm: 'AES-256-GCM',
      ciphertext: 'contenido-invalido',
    }));

    await expect(getOfflineDraft(userId, draftKey)).rejects.toThrow(
      'No se pudo recuperar la captura offline cifrada',
    );
    await expect(AsyncStorage.getItem(key)).resolves.toContain('contenido-invalido');
  });

  it('descarta una carga documental bloqueada para permitir elegir archivos nuevos', async () => {
    const operation: OfflineDocumentOperation = {
      version: 1,
      id: 'operacion-documento-bloqueada',
      userId,
      module: 'DOCUMENTACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      dedupeKey: 'documento:integrante-1:control_pagos',
      draftKey,
      kind: 'DOCUMENT_UPLOAD',
      status: 'BLOCKED',
      attempts: 1,
      nextAttemptAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lastError: 'La evidencia cifrada ya no existe',
      request: {
        integranteId: 'integrante-1',
        tipo: 'control_pagos',
        files: [{
          uri: 'file:///document/operacion-documento-bloqueada/1-control.png.clenc',
          name: 'control.png',
          fieldName: 'archivos',
          size: 128,
          encryption: { version: 1, algorithm: 'AES-256-GCM' },
        }],
        progress: { cargaId: 'operacion-documento-bloqueada', nextIndex: 0 },
      },
    };
    await enqueueOfflineOperation(operation);

    await expect(discardBlockedOfflineOperationsByDedupe(
      userId,
      operation.dedupeKey,
      operation.kind,
    )).resolves.toEqual([operation.id]);
    await expect(getOfflineOperation(userId, operation.id)).resolves.toBeNull();
  });
});
