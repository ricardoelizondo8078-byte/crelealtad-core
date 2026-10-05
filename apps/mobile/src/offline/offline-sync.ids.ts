export const createOfflineOperationId = (): string => {
  let seed = Date.now() + Math.floor(Math.random() * 0x100000000);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (seed + Math.random() * 16) % 16 | 0;
    seed = Math.floor(seed / 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const offlineDraftKey = (
  module: string,
  entityType: string,
  entityId: string,
): string => `${module}:${entityType}:${entityId}`;
