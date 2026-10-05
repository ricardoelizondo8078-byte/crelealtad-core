import {
  completeOfflineOperation,
  failOfflineOperation,
  getNextOfflineOperation,
  markOfflineOperationSyncing,
  updateDocumentUploadProgress,
} from './offline-sync.repository';
import { executeOfflineOperation } from './offline-sync.executor';
import { removeOfflineFiles } from './offline-file-store';
import {
  classifyOfflineFailure,
  getOfflineBackoffMs,
  offlineFailureMessage,
} from './offline-sync.policy';

const activeSyncs = new Map<string, Promise<void>>();

const runSync = async (
  userId: string,
  onChange?: () => void | Promise<void>,
): Promise<void> => {
  while (true) {
    const next = await getNextOfflineOperation(userId);
    if (!next) return;

    const operation = await markOfflineOperationSyncing(userId, next.id);
    if (!operation) continue;
    await onChange?.();

    try {
      const response = await executeOfflineOperation(operation, async (progress) => {
        await updateDocumentUploadProgress(userId, operation.id, progress);
        await onChange?.();
      });
      const completed = await completeOfflineOperation(userId, operation.id, response);
      if (completed && completed.kind !== 'JSON_REQUEST') {
        await removeOfflineFiles(userId, completed.id);
      }
      await onChange?.();
    } catch (error) {
      const disposition = classifyOfflineFailure(error);
      const attempts = operation.attempts + 1;
      const nextAttemptAt = disposition === 'RETRY'
        ? new Date(Date.now() + getOfflineBackoffMs(attempts)).toISOString()
        : operation.nextAttemptAt;
      await failOfflineOperation(userId, operation.id, {
        status: disposition === 'RETRY' ? 'PENDING' : 'BLOCKED',
        nextAttemptAt,
        error: offlineFailureMessage(error),
      });
      await onChange?.();
      return;
    }
  }
};

export const syncOfflineOperations = (
  userId: string,
  onChange?: () => void | Promise<void>,
): Promise<void> => {
  const current = activeSyncs.get(userId);
  if (current) return current;

  const sync = runSync(userId, onChange).finally(() => {
    if (activeSyncs.get(userId) === sync) activeSyncs.delete(userId);
  });
  activeSyncs.set(userId, sync);
  return sync;
};
