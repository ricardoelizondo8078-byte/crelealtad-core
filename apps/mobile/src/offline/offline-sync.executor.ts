import { apiRequest } from '../services/api-client';
import { VERIFICACION_CONTEXT_HEADERS } from '../services/api-request-context';
import {
  appendDocumentFile,
  uploadDocumentFiles,
} from '../services/document-upload';
import { materializeOfflineFiles } from './offline-file-store';
import { OfflineOperation } from './offline-sync.types';

const getRequestContextHeaders = (operation: OfflineOperation) => (
  operation.module === 'VERIFICACION'
    ? VERIFICACION_CONTEXT_HEADERS
    : undefined
);

export const executeOfflineOperation = async (
  operation: OfflineOperation,
  onDocumentProgress: (progress: { cargaId: string; nextIndex: number }) => Promise<void>,
): Promise<unknown> => {
  if (operation.kind === 'JSON_REQUEST') {
    return apiRequest(operation.request.endpoint, {
      method: operation.request.method,
      body: operation.request.body,
      headers: getRequestContextHeaders(operation),
      showProcessing: false,
    });
  }

  if (operation.kind === 'MULTIPART_REQUEST') {
    const materialized = await materializeOfflineFiles(
      operation.userId,
      'upload',
      operation.id,
      operation.request.files,
    );
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(operation.request.fields)) {
        formData.append(key, value);
      }
      for (const file of materialized.files) {
        await appendDocumentFile(formData, file.uri, file.name, file.fieldName);
      }
      return await apiRequest(operation.request.endpoint, {
        method: operation.request.method,
        body: formData,
        headers: getRequestContextHeaders(operation),
        timeoutMs: operation.request.timeoutMs,
        showProcessing: false,
      });
    } finally {
      await materialized.cleanup();
    }
  }

  const materialized = await materializeOfflineFiles(
    operation.userId,
    'upload',
    operation.id,
    operation.request.files,
  );
  try {
    return await uploadDocumentFiles(
      operation.request.integranteId,
      operation.request.tipo,
      materialized.files.map((file) => file.uri),
      {
        cargaId: operation.request.progress.cargaId,
        nextIndex: operation.request.progress.nextIndex,
        onProgress: onDocumentProgress,
      },
    );
  } finally {
    await materialized.cleanup();
  }
};
