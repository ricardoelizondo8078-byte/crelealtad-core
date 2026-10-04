export const DEFAULT_PROCESSING_MESSAGE = 'Procesando…';

export interface ProcessingSnapshot {
  active: boolean;
  count: number;
  message: string;
  revision: number;
}

interface RunWithProcessingOptions {
  exclusive?: boolean;
}

type ProcessingListener = () => void;

const listeners = new Set<ProcessingListener>();
const operations = new Map<number, string>();

let nextOperationId = 1;
let revision = 0;
let snapshot: ProcessingSnapshot = {
  active: false,
  count: 0,
  message: DEFAULT_PROCESSING_MESSAGE,
  revision,
};

const emit = () => {
  let message = DEFAULT_PROCESSING_MESSAGE;
  for (const operationMessage of operations.values()) {
    message = operationMessage;
  }

  revision += 1;
  snapshot = {
    active: operations.size > 0,
    count: operations.size,
    message,
    revision,
  };

  listeners.forEach((listener) => listener());
};

const isPromiseLike = <T,>(value: T | PromiseLike<T>): value is PromiseLike<T> => (
  value !== null
  && (typeof value === 'object' || typeof value === 'function')
  && typeof (value as PromiseLike<T>).then === 'function'
);

export const getProcessingSnapshot = (): ProcessingSnapshot => snapshot;

export const subscribeToProcessing = (listener: ProcessingListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const isProcessing = (): boolean => operations.size > 0;

export const beginProcessing = (
  message = DEFAULT_PROCESSING_MESSAGE,
): (() => void) => {
  const operationId = nextOperationId;
  nextOperationId += 1;
  operations.set(operationId, message.trim() || DEFAULT_PROCESSING_MESSAGE);
  emit();

  let completed = false;
  return () => {
    if (completed) return;
    completed = true;
    operations.delete(operationId);
    emit();
  };
};

export function runWithProcessing<T>(
  operation: () => T | PromiseLike<T>,
  message = DEFAULT_PROCESSING_MESSAGE,
  options: RunWithProcessingOptions = {},
): T | Promise<T> | undefined {
  if (options.exclusive !== false && isProcessing()) {
    return undefined;
  }

  const complete = beginProcessing(message);

  try {
    const result = operation();
    if (isPromiseLike(result)) {
      return Promise.resolve(result).finally(complete);
    }

    complete();
    return result;
  } catch (error) {
    complete();
    throw error;
  }
}
