import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { createOfflineOperationId } from '../offline/offline-sync.ids';
import { persistOfflineFiles, removeOfflineFiles } from '../offline/offline-file-store';
import {
  enqueueOfflineOperation,
  getOfflineDraft,
  getOfflineOperation,
  getOfflineServerVersion,
  getOfflineSyncSummary,
  hasOfflineOperationsForEntity,
  recoverInterruptedOfflineOperations,
  retryBlockedOfflineOperations,
  saveOfflineDraft,
  setOfflineServerVersion,
} from '../offline/offline-sync.repository';
import { syncOfflineOperations } from '../offline/offline-sync.engine';
import {
  OfflineDocumentOperation,
  OfflineDraft,
  OfflineEnqueueResult,
  OfflineFileInput,
  OfflineJsonOperation,
  OfflineModule,
  OfflineMultipartOperation,
  OfflineSyncSummary,
} from '../offline/offline-sync.types';

interface JsonEnqueueInput {
  module: OfflineModule;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  draftKey?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  body: unknown;
  conflict?: {
    key: string;
    requestField: string;
    responsePath: string;
  };
}

interface MultipartEnqueueInput {
  module: OfflineModule;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  draftKey?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  fields: Record<string, string>;
  files: OfflineFileInput[];
  timeoutMs?: number;
}

interface DocumentEnqueueInput {
  module: 'DOCUMENTACION';
  entityType: string;
  entityId: string;
  dedupeKey: string;
  draftKey?: string;
  integranteId: string;
  tipo: string;
  files: OfflineFileInput[];
}

interface DraftInput<T> {
  key: string;
  module: OfflineModule;
  entityType: string;
  entityId: string;
  data: T;
  status?: OfflineDraft<T>['status'];
  lastError?: string;
}

interface OfflineSyncContextData {
  summary: OfflineSyncSummary;
  saveDraft: <T>(input: DraftInput<T>) => Promise<OfflineDraft<T>>;
  getDraft: <T>(key: string) => Promise<OfflineDraft<T> | null>;
  enqueueJson: (input: JsonEnqueueInput) => Promise<OfflineEnqueueResult>;
  enqueueMultipart: (input: MultipartEnqueueInput) => Promise<OfflineEnqueueResult>;
  enqueueDocument: (input: DocumentEnqueueInput) => Promise<OfflineEnqueueResult>;
  hasPendingForEntity: (entityType: string, entityId: string) => Promise<boolean>;
  syncNow: () => Promise<void>;
  retryBlocked: () => Promise<void>;
  setServerVersion: (key: string, version: string | number | null) => Promise<void>;
}

const EMPTY_SUMMARY: OfflineSyncSummary = { pending: 0, syncing: 0, blocked: 0 };
const OfflineSyncContext = createContext<OfflineSyncContextData | null>(null);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const userId = usuario?.id ?? null;
  const [summary, setSummary] = useState<OfflineSyncSummary>(EMPTY_SUMMARY);

  const refreshSummary = useCallback(async () => {
    if (!userId) {
      setSummary(EMPTY_SUMMARY);
      return;
    }
    setSummary(await getOfflineSyncSummary(userId));
  }, [userId]);

  const syncNow = useCallback(async () => {
    if (!userId) return;
    await syncOfflineOperations(userId, refreshSummary);
    await refreshSummary();
  }, [refreshSummary, userId]);

  useEffect(() => {
    if (!userId || usuario?.requiere_cambio_pin) {
      return undefined;
    }
    const initialSync = setTimeout(() => {
      void recoverInterruptedOfflineOperations(userId).then(syncNow);
    }, 0);

    const interval = setInterval(() => void syncNow(), 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => {
      clearTimeout(initialSync);
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshSummary, syncNow, userId, usuario?.requiere_cambio_pin]);

  const resolveEnqueueResult = useCallback(async (
    operationId: string,
  ): Promise<OfflineEnqueueResult> => {
    if (!userId) throw new Error('Se requiere una sesión para guardar sin conexión.');
    await refreshSummary();
    await syncNow();
    const operation = await getOfflineOperation(userId, operationId);
    if (!operation) return { operationId, status: 'CONFIRMED' };
    return { operationId, status: operation.status, error: operation.lastError };
  }, [refreshSummary, syncNow, userId]);

  const saveDraft = useCallback(async <T,>(input: DraftInput<T>): Promise<OfflineDraft<T>> => {
    if (!userId) throw new Error('Se requiere una sesión para guardar el borrador.');
    const draft = await saveOfflineDraft({ ...input, userId });
    await refreshSummary();
    return draft;
  }, [refreshSummary, userId]);

  const getDraft = useCallback(async <T,>(key: string): Promise<OfflineDraft<T> | null> => {
    if (!userId) return null;
    return getOfflineDraft<T>(userId, key);
  }, [userId]);

  const enqueueJson = useCallback(async (
    input: JsonEnqueueInput,
  ): Promise<OfflineEnqueueResult> => {
    if (!userId) throw new Error('Se requiere una sesión para sincronizar.');
    const storedVersion = input.conflict
      ? await getOfflineServerVersion(userId, input.conflict.key)
      : undefined;
    if (input.conflict && storedVersion === undefined) {
      throw new Error('Falta la versión base del servidor; vuelve a abrir el registro antes de sincronizar.');
    }
    const body = input.conflict && input.body && typeof input.body === 'object'
      ? {
          ...(input.body as Record<string, unknown>),
          [input.conflict.requestField]: storedVersion,
        }
      : input.body;
    const current = new Date().toISOString();
    const operation: OfflineJsonOperation = {
      version: 1,
      id: createOfflineOperationId(),
      userId,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      dedupeKey: input.dedupeKey,
      draftKey: input.draftKey,
      kind: 'JSON_REQUEST',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: current,
      createdAt: current,
      updatedAt: current,
      request: {
        endpoint: input.endpoint,
        method: input.method,
        body,
        conflict: input.conflict,
      },
    };
    const operationId = await enqueueOfflineOperation(operation);
    return resolveEnqueueResult(operationId);
  }, [resolveEnqueueResult, userId]);

  const enqueueMultipart = useCallback(async (
    input: MultipartEnqueueInput,
  ): Promise<OfflineEnqueueResult> => {
    if (!userId) throw new Error('Se requiere una sesión para sincronizar.');
    const operationId = createOfflineOperationId();
    const files = await persistOfflineFiles(userId, operationId, input.files);
    const current = new Date().toISOString();
    const operation: OfflineMultipartOperation = {
      version: 1,
      id: operationId,
      userId,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      dedupeKey: input.dedupeKey,
      draftKey: input.draftKey,
      kind: 'MULTIPART_REQUEST',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: current,
      createdAt: current,
      updatedAt: current,
      request: {
        endpoint: input.endpoint,
        method: input.method,
        fields: input.fields,
        files,
        timeoutMs: input.timeoutMs,
      },
    };
    try {
      const storedId = await enqueueOfflineOperation(operation);
      if (storedId !== operationId) {
        await removeOfflineFiles(userId, operationId);
        const existing = await getOfflineOperation(userId, storedId);
        const result = await resolveEnqueueResult(storedId);
        return {
          ...result,
          durableFileUris: existing?.kind === 'MULTIPART_REQUEST'
            ? existing.request.files.map((file) => file.uri)
            : undefined,
        };
      }
      const result = await resolveEnqueueResult(storedId);
      return { ...result, durableFileUris: files.map((file) => file.uri) };
    } catch (error) {
      await removeOfflineFiles(userId, operationId);
      throw error;
    }
  }, [resolveEnqueueResult, userId]);

  const enqueueDocument = useCallback(async (
    input: DocumentEnqueueInput,
  ): Promise<OfflineEnqueueResult> => {
    if (!userId) throw new Error('Se requiere una sesión para sincronizar.');
    const operationId = createOfflineOperationId();
    const files = await persistOfflineFiles(userId, operationId, input.files);
    const current = new Date().toISOString();
    const operation: OfflineDocumentOperation = {
      version: 1,
      id: operationId,
      userId,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      dedupeKey: input.dedupeKey,
      draftKey: input.draftKey,
      kind: 'DOCUMENT_UPLOAD',
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: current,
      createdAt: current,
      updatedAt: current,
      request: {
        integranteId: input.integranteId,
        tipo: input.tipo,
        files,
        progress: { cargaId: operationId, nextIndex: 0 },
      },
    };
    try {
      const storedId = await enqueueOfflineOperation(operation);
      if (storedId !== operationId) {
        await removeOfflineFiles(userId, operationId);
        const existing = await getOfflineOperation(userId, storedId);
        const result = await resolveEnqueueResult(storedId);
        return {
          ...result,
          durableFileUris: existing?.kind === 'DOCUMENT_UPLOAD'
            ? existing.request.files.map((file) => file.uri)
            : undefined,
        };
      }
      const result = await resolveEnqueueResult(storedId);
      return { ...result, durableFileUris: files.map((file) => file.uri) };
    } catch (error) {
      await removeOfflineFiles(userId, operationId);
      throw error;
    }
  }, [resolveEnqueueResult, userId]);

  const hasPendingForEntity = useCallback(async (
    entityType: string,
    entityId: string,
  ): Promise<boolean> => (
    userId ? hasOfflineOperationsForEntity(userId, entityType, entityId) : false
  ), [userId]);

  const retryBlocked = useCallback(async () => {
    if (!userId) return;
    await retryBlockedOfflineOperations(userId);
    await syncNow();
  }, [syncNow, userId]);

  const setServerVersion = useCallback(async (
    key: string,
    version: string | number | null,
  ) => {
    if (!userId) throw new Error('Se requiere una sesión para registrar la versión del servidor.');
    await setOfflineServerVersion(userId, key, version);
  }, [userId]);

  const value = useMemo<OfflineSyncContextData>(() => ({
    summary: userId ? summary : EMPTY_SUMMARY,
    saveDraft,
    getDraft,
    enqueueJson,
    enqueueMultipart,
    enqueueDocument,
    hasPendingForEntity,
    syncNow,
    retryBlocked,
    setServerVersion,
  }), [
    enqueueDocument,
    enqueueJson,
    enqueueMultipart,
    getDraft,
    hasPendingForEntity,
    retryBlocked,
    saveDraft,
    setServerVersion,
    summary,
    syncNow,
    userId,
  ]);

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync(): OfflineSyncContextData {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  return context;
}
