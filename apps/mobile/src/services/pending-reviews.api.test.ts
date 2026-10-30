import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from './api-client';
import { getPendingReviews } from './pending-reviews.api';

jest.mock('./api-client', () => ({
  api: { get: jest.fn() },
}));

describe('API de pendientes de revisión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('actualiza la bandeja en segundo plano sin bloquear toda la aplicación', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({
      total_pendientes: 0,
      grupos: [],
    });

    await getPendingReviews();

    expect(api.get).toHaveBeenCalledWith(
      '/pendientes/revision-documental',
      { showProcessing: false },
    );
  });
});
