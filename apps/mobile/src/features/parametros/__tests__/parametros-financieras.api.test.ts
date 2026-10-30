import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '../../../services/api-client';
import {
  listarFinancierasCompetidorasVigentes,
  publicarCambioFinanciera,
} from '../parametros-financieras.api';

jest.mock('../../../services/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('API de financieras competidoras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publica el cambio directamente sin rutas de aprobación intermedia', async () => {
    (api.post as jest.MockedFunction<typeof api.post>).mockResolvedValue({
      id: 'version-publicada',
      estado: 'PUBLICADA',
    });
    const input = {
      financiera_id: '33333333-3333-4333-8333-333333333333',
      clasificacion: 'OBJETIVO' as const,
    };

    await expect(publicarCambioFinanciera(input)).resolves.toMatchObject({
      estado: 'PUBLICADA',
    });
    expect(api.post).toHaveBeenCalledWith(
      '/parametros/financieras-competidoras/publicaciones',
      input,
    );
  });

  it('consulta para Verificación la clasificación vigente sin fijarla a la fecha de la entrevista', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({
      fecha: '2026-10-08',
      items: [],
    });

    await listarFinancierasCompetidorasVigentes();

    expect(api.get).toHaveBeenCalledWith('/verificacion/financieras-competidoras');
  });
});
