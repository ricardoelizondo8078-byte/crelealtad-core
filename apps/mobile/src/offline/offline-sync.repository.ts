import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OfflineDraft,
  OfflineModule,
  OfflineOperation,
  OfflineSyncSummary,
  OfflineUserStore,
} from './offline-sync.types';

const STORAGE_PREFIX = 'crelealtad:offline-sync:v1:';
const locks = new Map<string, Promise<unknown>>();

const nowIso = (): string => new Date().toISOString();

const storageKey = (userId: string): string => `${STORAGE_PREFIX}${userId}`;

const createEmptyStore = (userId: string): OfflineUserStore => ({
  version: 1,
  userId,
  operations: [],
  drafts: {},
  serverVersions: {},
  updatedAt: nowIso(),
});

const normalizeStore = (userId: string, value: unknown): OfflineUserStore => {
  if (!value || typeof value !== 'object') return createEmptyStore(userId);
  const candidate = value as Partial<OfflineUserStore>;
  if (candidate.version !== 1 || candidate.userId !== userId) return createEmptyStore(userId);

  const operations = Array.isArray(candidate.operations) ? candidate.operations : [];

  return {
    version: 1,
    userId,
    operations,
    drafts: candidate.drafts && typeof candidate.drafts === 'object' ? candidate.drafts : {},
    serverVersions: candidate.serverVersions && typeof candidate.serverVersions === 'object'
      ? candidate.serverVersions
      : {},
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : nowIso(),
  };
};

const readPath = (value: unknown, path: string): unknown => (
  path.split('.').reduce<unknown>((current, segment) => (
    current && typeof current === 'object'
      ? (current as Record<string, unknown>)[segment]
      : undefined
  ), value)
);

const serialize = async <T>(userId: string, task: () => Promise<T>): Promise<T> => {
  const previous = locks.get(userId) ?? Promise.resolve();
  const next = previous.then(task, task);
  locks.set(userId, next.then(() => undefined, () => undefined));
  return next;
};

const readUnlocked = async (userId: string): Promise<OfflineUserStore> => {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return createEmptyStore(userId);
  try {
    return normalizeStore(userId, JSON.parse(raw));
  } catch {
    return createEmptyStore(userId);
  }
};

const writeUnlocked = async (store: OfflineUserStore): Promise<void> => {
  const next = { ...store, updatedAt: nowIso() };
  await AsyncStorage.setItem(storageKey(store.userId), JSON.stringify(next));
};

const mutateStore = async <T>(
  userId: string,
  mutation: (store: OfflineUserStore) => T,
): Promise<T> => serialize(userId, async () => {
  const store = await readUnlocked(userId);
  const result = mutation(store);
  await writeUnlocked(store);
  return result;
});

export const getOfflineStore = (userId: string): Promise<OfflineUserStore> => (
  serialize(userId, () => readUnlocked(userId))
);

export const recoverInterruptedOfflineOperations = async (userId: string): Promise<void> => (
  mutateStore(userId, (store) => {
    const current = nowIso();
    for (const operation of store.operations) {
      if (operation.status !== 'SYNCING') continue;
      operation.status = 'PENDING';
      operation.nextAttemptAt = current;
      operation.updatedAt = current;
      if (operation.draftKey && store.drafts[operation.draftKey]) {
        store.drafts[operation.draftKey] = {
          ...store.drafts[operation.draftKey],
          status: 'PENDING',
        };
      }
    }
  })
);

export const saveOfflineDraft = async <T>(input: {
  userId: string;
  key: string;
  module: OfflineModule;
  entityType: string;
  entityId: string;
  data: T;
  status?: OfflineDraft<T>['status'];
  lastError?: string;
}): Promise<OfflineDraft<T>> => mutateStore(input.userId, (store) => {
  const previous = store.drafts[input.key];
  const relatedOperations = store.operations.filter(
    (operation) => operation.draftKey === input.key,
  );
  const derivedStatus = relatedOperations.some((operation) => operation.status === 'BLOCKED')
    ? 'BLOCKED'
    : relatedOperations.some((operation) => operation.status === 'SYNCING')
      ? 'SYNCING'
      : relatedOperations.length > 0
        ? 'PENDING'
        : 'LOCAL';
  const draft: OfflineDraft<T> = {
    version: 1,
    key: input.key,
    userId: input.userId,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    data: input.data,
    status: input.status ?? derivedStatus,
    updatedAt: nowIso(),
    lastConfirmedAt: input.status === 'SYNCED' ? nowIso() : previous?.lastConfirmedAt,
    lastError: input.lastError,
  };
  store.drafts[input.key] = draft;
  return draft;
});

export const getOfflineDraft = async <T>(
  userId: string,
  key: string,
): Promise<OfflineDraft<T> | null> => {
  const store = await getOfflineStore(userId);
  return (store.drafts[key] as OfflineDraft<T> | undefined) ?? null;
};

export const setOfflineServerVersion = async (
  userId: string,
  key: string,
  version: string | number | null,
): Promise<void> => mutateStore(userId, (store) => {
  store.serverVersions[key] = version;
});

export const getOfflineServerVersion = async (
  userId: string,
  key: string,
): Promise<string | number | null | undefined> => {
  const store = await getOfflineStore(userId);
  return store.serverVersions[key];
};

export const enqueueOfflineOperation = async (
  operation: OfflineOperation,
): Promise<string> => mutateStore(operation.userId, (store) => {
  const existingIndex = store.operations.findIndex((candidate) => (
    candidate.dedupeKey === operation.dedupeKey
    && candidate.kind === operation.kind
    && candidate.status !== 'SYNCING'
  ));

  if (existingIndex >= 0 && operation.kind === 'JSON_REQUEST') {
    const existing = store.operations[existingIndex];
    store.operations[existingIndex] = {
      ...operation,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    if (operation.draftKey && store.drafts[operation.draftKey]) {
      store.drafts[operation.draftKey] = {
        ...store.drafts[operation.draftKey],
        status: 'PENDING',
        lastError: undefined,
      };
    }
    return existing.id;
  }

  const duplicate = operation.kind === 'JSON_REQUEST'
    ? undefined
    : store.operations.find((candidate) => (
        candidate.dedupeKey === operation.dedupeKey && candidate.kind === operation.kind
      ));
  if (duplicate) return duplicate.id;

  store.operations.push(operation);
  if (operation.draftKey && store.drafts[operation.draftKey]) {
    store.drafts[operation.draftKey] = {
      ...store.drafts[operation.draftKey],
      status: 'PENDING',
      lastError: undefined,
    };
  }
  return operation.id;
});

export const getOfflineOperation = async (
  userId: string,
  operationId: string,
): Promise<OfflineOperation | null> => {
  const store = await getOfflineStore(userId);
  return store.operations.find((operation) => operation.id === operationId) ?? null;
};

export const getNextOfflineOperation = async (
  userId: string,
  currentTime = Date.now(),
): Promise<OfflineOperation | null> => {
  const store = await getOfflineStore(userId);
  return [...store.operations]
    .filter((operation) => (
      operation.status === 'PENDING'
      && new Date(operation.nextAttemptAt).getTime() <= currentTime
    ))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0] ?? null;
};

export const markOfflineOperationSyncing = async (
  userId: string,
  operationId: string,
): Promise<OfflineOperation | null> => mutateStore(userId, (store) => {
  const index = store.operations.findIndex((operation) => operation.id === operationId);
  if (index < 0) return null;
  const current = store.operations[index];
  const updated: OfflineOperation = {
    ...current,
    status: 'SYNCING',
    updatedAt: nowIso(),
    lastError: undefined,
  };
  store.operations[index] = updated;
  if (updated.draftKey && store.drafts[updated.draftKey]) {
    store.drafts[updated.draftKey] = {
      ...store.drafts[updated.draftKey],
      status: 'SYNCING',
      lastError: undefined,
    };
  }
  return updated;
});

export const updateDocumentUploadProgress = async (
  userId: string,
  operationId: string,
  progress: { cargaId: string; nextIndex: number },
): Promise<void> => mutateStore(userId, (store) => {
  const operation = store.operations.find((candidate) => candidate.id === operationId);
  if (operation?.kind === 'DOCUMENT_UPLOAD') {
    operation.request.progress = progress;
    operation.updatedAt = nowIso();
  }
});

export const completeOfflineOperation = async (
  userId: string,
  operationId: string,
  response?: unknown,
): Promise<OfflineOperation | null> => mutateStore(userId, (store) => {
  const index = store.operations.findIndex((operation) => operation.id === operationId);
  if (index < 0) return null;
  const [completed] = store.operations.splice(index, 1);
  if (completed.kind === 'JSON_REQUEST' && completed.request.conflict) {
    const conflict = completed.request.conflict;
    const confirmedVersion = readPath(response, conflict.responsePath);
    if (
      confirmedVersion === null
      || typeof confirmedVersion === 'string'
      || typeof confirmedVersion === 'number'
    ) {
      store.serverVersions[conflict.key] = confirmedVersion;
      for (const pending of store.operations) {
        if (pending.kind !== 'JSON_REQUEST' || pending.request.conflict?.key !== conflict.key) {
          continue;
        }
        if (!pending.request.body || typeof pending.request.body !== 'object') continue;
        pending.request.body = {
          ...(pending.request.body as Record<string, unknown>),
          [conflict.requestField]: confirmedVersion,
        };
        pending.updatedAt = nowIso();
      }
    }
  }
  if (completed.draftKey && store.drafts[completed.draftKey]) {
    const hasNewerOperation = store.operations.some(
      (operation) => operation.draftKey === completed.draftKey,
    );
    store.drafts[completed.draftKey] = {
      ...store.drafts[completed.draftKey],
      status: hasNewerOperation ? 'PENDING' : 'SYNCED',
      lastConfirmedAt: hasNewerOperation
        ? store.drafts[completed.draftKey].lastConfirmedAt
        : nowIso(),
      lastError: undefined,
    };
  }
  return completed;
});

export const failOfflineOperation = async (
  userId: string,
  operationId: string,
  input: { status: 'PENDING' | 'BLOCKED'; nextAttemptAt: string; error: string },
): Promise<void> => mutateStore(userId, (store) => {
  const operation = store.operations.find((candidate) => candidate.id === operationId);
  if (!operation) return;
  operation.status = input.status;
  operation.attempts += 1;
  operation.nextAttemptAt = input.nextAttemptAt;
  operation.updatedAt = nowIso();
  operation.lastError = input.error;
  if (operation.draftKey && store.drafts[operation.draftKey]) {
    store.drafts[operation.draftKey] = {
      ...store.drafts[operation.draftKey],
      status: input.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING',
      lastError: input.error,
    };
  }
});

export const retryBlockedOfflineOperations = async (userId: string): Promise<void> => (
  mutateStore(userId, (store) => {
    const current = nowIso();
    for (const operation of store.operations) {
      if (operation.status !== 'BLOCKED') continue;
      operation.status = 'PENDING';
      operation.nextAttemptAt = current;
      operation.updatedAt = current;
      operation.lastError = undefined;
      if (operation.draftKey && store.drafts[operation.draftKey]) {
        store.drafts[operation.draftKey] = {
          ...store.drafts[operation.draftKey],
          status: 'PENDING',
          lastError: undefined,
        };
      }
    }
  })
);

export const hasOfflineOperationsForEntity = async (
  userId: string,
  entityType: string,
  entityId: string,
): Promise<boolean> => {
  const store = await getOfflineStore(userId);
  return store.operations.some((operation) => (
    operation.entityType === entityType && operation.entityId === entityId
  ));
};

export const getOfflineSyncSummary = async (userId: string): Promise<OfflineSyncSummary> => {
  const store = await getOfflineStore(userId);
  return store.operations.reduce<OfflineSyncSummary>((summary, operation) => {
    if (operation.status === 'PENDING') summary.pending += 1;
    if (operation.status === 'SYNCING') summary.syncing += 1;
    if (operation.status === 'BLOCKED') summary.blocked += 1;
    return summary;
  }, { pending: 0, syncing: 0, blocked: 0 });
};
