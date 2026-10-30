import { apiRequest } from '../services/api-client';
import {
  appendDocumentFile,
  uploadDocumentFiles,
} from '../services/document-upload';
import { materializeOfflineFiles } from './offline-file-store';
import { executeOfflineOperation } from './offline-sync.executor';
import {
  OfflineDocumentOperation,
  OfflineJsonOperation,
  OfflineMultipartOperation,
} from './offline-sync.types';

jest.mock('../services/api-client', () => ({ apiRequest: jest.fn() }));
jest.mock('../services/document-upload', () => ({
  appendDocumentFile: jest.fn(),
  uploadDocumentFiles: jest.fn(),
}));
jest.mock('./offline-file-store', () => ({ materializeOfflineFiles: jest.fn() }));

const cleanup = jest.fn(async () => undefined);
const encryptedFile = {
  uri: 'file:///document/1-ine.jpg.clenc',
  name: 'ine.jpg',
  fieldName: 'archivos',
  size: 128,
  encryption: { version: 1 as const, algorithm: 'AES-256-GCM' as const },
};
const clearFile = { ...encryptedFile, uri: 'file:///cache/1-ine.jpg' };

describe('offline-sync.executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(materializeOfflineFiles).mockResolvedValue({
      files: [clearFile],
      cleanup,
    });
  });

  it('conserva el contexto de Verificación al sincronizar una operación JSON', async () => {
    const operation: OfflineJsonOperation = {
      version: 1,
      id: 'operacion-entrevista-1',
      userId: 'usuario-prueba',
      module: 'VERIFICACION',
      entityType: 'entrevista',
      entityId: 'integrante-1',
      dedupeKey: 'entrevista:integrante-1',
      kind: 'JSON_REQUEST',
      status: 'BLOCKED',
      attempts: 1,
      nextAttemptAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      request: {
        endpoint: '/verificacion/integrantes/integrante-1/entrevista',
        method: 'PUT',
        body: { conoce_asesora: true },
      },
    };
    jest.mocked(apiRequest).mockResolvedValueOnce({ entrevista: { revision: 2 } });

    await expect(executeOfflineOperation(operation, async () => undefined))
      .resolves.toMatchObject({ entrevista: { revision: 2 } });
    expect(apiRequest).toHaveBeenCalledWith(
      '/verificacion/integrantes/integrante-1/entrevista',
      expect.objectContaining({
        method: 'PUT',
        body: { conoce_asesora: true },
        headers: { 'X-Crelealtad-Context': 'verificacion' },
        showProcessing: false,
      }),
    );
  });

  it('no amplía el contexto de las operaciones de Documentación', async () => {
    const operation: OfflineJsonOperation = {
      version: 1,
      id: 'operacion-solicitud-1',
      userId: 'usuario-prueba',
      module: 'DOCUMENTACION',
      entityType: 'solicitud',
      entityId: 'integrante-1',
      dedupeKey: 'solicitud:integrante-1',
      kind: 'JSON_REQUEST',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      request: {
        endpoint: '/solicitudes/integrante/integrante-1',
        method: 'PUT',
        body: { monto_solicitado: 18000 },
      },
    };
    jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'solicitud-1' });

    await executeOfflineOperation(operation, async () => undefined);

    expect(apiRequest).toHaveBeenCalledWith(
      '/solicitudes/integrante/integrante-1',
      expect.objectContaining({ headers: undefined }),
    );
  });

  it('usa la copia temporal para multipart y la limpia aunque la API falle', async () => {
    const operation: OfflineMultipartOperation = {
      version: 1,
      id: 'operacion-1',
      userId: 'usuario-prueba',
      module: 'VERIFICACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      dedupeKey: 'evidencia-1',
      kind: 'MULTIPART_REQUEST',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      request: {
        endpoint: '/verificacion/evidencia',
        method: 'POST',
        fields: { tipo: 'PRUEBA' },
        files: [encryptedFile],
      },
    };
    jest.mocked(apiRequest).mockRejectedValueOnce(new Error('sin conexión'));

    await expect(executeOfflineOperation(operation, async () => undefined))
      .rejects.toThrow('sin conexión');
    expect(appendDocumentFile).toHaveBeenCalledWith(
      expect.any(FormData),
      clearFile.uri,
      clearFile.name,
      clearFile.fieldName,
    );
    expect(apiRequest).toHaveBeenCalledWith(
      '/verificacion/evidencia',
      expect.objectContaining({
        headers: { 'X-Crelealtad-Context': 'verificacion' },
      }),
    );
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('limpia la copia temporal después de completar una carga documental', async () => {
    const operation: OfflineDocumentOperation = {
      version: 1,
      id: 'operacion-2',
      userId: 'usuario-prueba',
      module: 'DOCUMENTACION',
      entityType: 'integrante',
      entityId: 'integrante-1',
      dedupeKey: 'documento-1',
      kind: 'DOCUMENT_UPLOAD',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      request: {
        integranteId: 'integrante-1',
        tipo: 'ine',
        files: [encryptedFile],
        progress: { cargaId: 'operacion-2', nextIndex: 0 },
      },
    };
    jest.mocked(uploadDocumentFiles).mockResolvedValueOnce({
      id: 'documento-1',
      ruta: '/documentos/documento-1',
      archivos: [],
    });

    await expect(executeOfflineOperation(operation, async () => undefined))
      .resolves.toMatchObject({ id: 'documento-1' });
    expect(uploadDocumentFiles).toHaveBeenCalledWith(
      'integrante-1',
      'ine',
      [clearFile.uri],
      expect.objectContaining({ cargaId: 'operacion-2', nextIndex: 0 }),
    );
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
