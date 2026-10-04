const RANDOM_SEGMENT_LENGTH = 16;

export function createIdempotencyKey(prefix: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(prefix)) {
    throw new Error('El prefijo de idempotencia no es válido');
  }

  const timestamp = Date.now().toString(36);
  const random = (
    Math.random().toString(36).slice(2)
    + Math.random().toString(36).slice(2)
  ).padEnd(RANDOM_SEGMENT_LENGTH, '0').slice(0, RANDOM_SEGMENT_LENGTH);

  return `${prefix}_${timestamp}_${random}`;
}
