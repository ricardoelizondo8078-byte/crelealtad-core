import { classifyOfflineFailure, getOfflineBackoffMs } from './offline-sync.policy';

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

describe('offline-sync.policy', () => {
  it('reintenta fallos de red y servidor, pero bloquea rechazos funcionales', () => {
    expect(classifyOfflineFailure(httpError(0))).toBe('RETRY');
    expect(classifyOfflineFailure(httpError(503))).toBe('RETRY');
    expect(classifyOfflineFailure(httpError(409))).toBe('BLOCK');
    expect(classifyOfflineFailure(httpError(422))).toBe('BLOCK');
  });

  it('incrementa el backoff y lo limita a cinco minutos', () => {
    expect(getOfflineBackoffMs(1)).toBe(2_000);
    expect(getOfflineBackoffMs(2)).toBe(4_000);
    expect(getOfflineBackoffMs(20)).toBe(5 * 60_000);
  });
});
