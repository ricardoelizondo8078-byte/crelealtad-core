const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export function formatPendingAge(isoDate: string, now = new Date()): string {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) return 'hace poco';

  const elapsed = Math.max(0, now.getTime() - createdAt.getTime());
  if (elapsed < HOUR_IN_MS) return 'hace menos de 1 h';

  if (elapsed < DAY_IN_MS) {
    const hours = Math.floor(elapsed / HOUR_IN_MS);
    return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  const days = Math.floor(elapsed / DAY_IN_MS);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
}
