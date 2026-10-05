import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  completeOfflineOperation,
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
import { OfflineJsonOperation } from './offline-sync.types';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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
});
