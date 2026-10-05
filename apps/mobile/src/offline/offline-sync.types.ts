export type OfflineModule = 'DOCUMENTACION' | 'VERIFICACION';

export type OfflineOperationStatus = 'PENDING' | 'SYNCING' | 'BLOCKED';
export type OfflineDraftStatus = 'LOCAL' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'BLOCKED';

export interface OfflineFileInput {
  uri: string;
  name: string;
  fieldName: string;
  mimeType?: string;
}

export interface OfflineFileRef extends Omit<OfflineFileInput, 'uri'> {
  uri: string;
  size: number;
}

interface OfflineOperationBase {
  version: 1;
  id: string;
  userId: string;
  module: OfflineModule;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  draftKey?: string;
  status: OfflineOperationStatus;
  attempts: number;
  nextAttemptAt: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export interface OfflineJsonOperation extends OfflineOperationBase {
  kind: 'JSON_REQUEST';
  request: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH';
    body: unknown;
    conflict?: {
      key: string;
      requestField: string;
      responsePath: string;
    };
  };
}

export interface OfflineMultipartOperation extends OfflineOperationBase {
  kind: 'MULTIPART_REQUEST';
  request: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH';
    fields: Record<string, string>;
    files: OfflineFileRef[];
    timeoutMs?: number;
  };
}

export interface OfflineDocumentOperation extends OfflineOperationBase {
  kind: 'DOCUMENT_UPLOAD';
  request: {
    integranteId: string;
    tipo: string;
    files: OfflineFileRef[];
    progress: {
      cargaId: string;
      nextIndex: number;
    };
  };
}

export type OfflineOperation =
  | OfflineJsonOperation
  | OfflineMultipartOperation
  | OfflineDocumentOperation;

export interface OfflineDraft<T = unknown> {
  version: 1;
  key: string;
  userId: string;
  module: OfflineModule;
  entityType: string;
  entityId: string;
  data: T;
  status: OfflineDraftStatus;
  updatedAt: string;
  lastConfirmedAt?: string;
  lastError?: string;
}

export interface OfflineUserStore {
  version: 1;
  userId: string;
  operations: OfflineOperation[];
  drafts: Record<string, OfflineDraft>;
  serverVersions: Record<string, string | number | null>;
  updatedAt: string;
}

export interface OfflineSyncSummary {
  pending: number;
  syncing: number;
  blocked: number;
}

export interface OfflineEnqueueResult {
  operationId: string;
  status: 'CONFIRMED' | OfflineOperationStatus;
  error?: string;
  durableFileUris?: string[];
}
