import { apiRequest } from '../services/api-client';
import {
  appendDocumentFile,
  uploadDocumentFiles,
} from '../services/document-upload';
import { OfflineOperation } from './offline-sync.types';

export const executeOfflineOperation = async (
  operation: OfflineOperation,
  onDocumentProgress: (progress: { cargaId: string; nextIndex: number }) => Promise<void>,
): Promise<unknown> => {
  if (operation.kind === 'JSON_REQUEST') {
    return apiRequest(operation.request.endpoint, {
      method: operation.request.method,
      body: operation.request.body,
      showProcessing: false,
    });
  }

  if (operation.kind === 'MULTIPART_REQUEST') {
    const formData = new FormData();
    for (const [key, value] of Object.entries(operation.request.fields)) {
      formData.append(key, value);
    }
    for (const file of operation.request.files) {
      await appendDocumentFile(formData, file.uri, file.name, file.fieldName);
    }
    return apiRequest(operation.request.endpoint, {
      method: operation.request.method,
      body: formData,
      timeoutMs: operation.request.timeoutMs,
      showProcessing: false,
    });
  }

  return uploadDocumentFiles(
    operation.request.integranteId,
    operation.request.tipo,
    operation.request.files.map((file) => file.uri),
    {
      cargaId: operation.request.progress.cargaId,
      nextIndex: operation.request.progress.nextIndex,
      onProgress: onDocumentProgress,
    },
  );
};
