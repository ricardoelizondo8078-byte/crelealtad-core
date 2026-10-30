import type {
  OfflineEnqueueResult,
  OfflineFileRef,
} from './offline-sync.types';

export const durableFileUrisForResult = (
  result: OfflineEnqueueResult,
  files: readonly OfflineFileRef[],
): string[] | undefined => (
  result.status === 'CONFIRMED'
    ? undefined
    : files.map((file) => file.uri)
);
