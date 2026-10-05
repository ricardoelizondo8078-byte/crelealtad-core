export type OfflineFailureDisposition = 'RETRY' | 'BLOCK';

const RETRYABLE_HTTP_STATUSES = new Set([0, 408, 425, 429]);

export const classifyOfflineFailure = (error: unknown): OfflineFailureDisposition => {
  const status = error && typeof error === 'object' && 'status' in error
    ? Number(error.status)
    : Number.NaN;
  if (!Number.isFinite(status)) return 'RETRY';
  if (RETRYABLE_HTTP_STATUSES.has(status) || status >= 500) return 'RETRY';
  return 'BLOCK';
};

export const offlineFailureMessage = (error: unknown): string => (
  error instanceof Error ? error.message : 'No se pudo sincronizar la operación.'
);

export const getOfflineBackoffMs = (attempts: number): number => {
  const normalizedAttempts = Math.max(1, Math.floor(attempts));
  return Math.min(5 * 60_000, 2_000 * (2 ** Math.min(normalizedAttempts - 1, 8)));
};
