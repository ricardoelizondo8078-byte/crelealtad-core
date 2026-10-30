import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '../../../services/api-client';
import { actualizarParametroEntrevista, cambiarEstadoParametroEntrevista, crearParametroEntrevista, listarParametrosEntrevista, listarParametrosEntrevistaActivos, reordenarParametrosEntrevista } from '../parametros-entrevista.api';

jest.mock('../../../services/api-client', () => ({ api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn() } }));

describe('API de parámetros de Entrevista', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('separa consulta administrativa y operativa y conserva los contratos de mutación', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ items: [] });
    (api.post as jest.MockedFunction<typeof api.post>).mockResolvedValue({ opcion: {} });
    (api.patch as jest.MockedFunction<typeof api.patch>).mockResolvedValue({ opcion: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ items: [] });
    await listarParametrosEntrevista('MOTIVO_NO_RENOVACION');
    await listarParametrosEntrevistaActivos();
    await crearParametroEntrevista('MOTIVO_NO_RENOVACION', 'Otra razón');
    await actualizarParametroEntrevista('opcion-1', 'Razón actualizada');
    await cambiarEstadoParametroEntrevista('opcion-1', false);
    await reordenarParametrosEntrevista('MOTIVO_NO_RENOVACION', ['opcion-2', 'opcion-1']);
    expect(api.get).toHaveBeenNthCalledWith(1, '/parametros/verificacion/entrevista?familia=MOTIVO_NO_RENOVACION&incluir_inactivos=true');
    expect(api.get).toHaveBeenNthCalledWith(2, '/verificacion/parametros/entrevista');
    expect(api.post).toHaveBeenCalledWith('/parametros/verificacion/entrevista', { familia: 'MOTIVO_NO_RENOVACION', etiqueta: 'Otra razón' });
    expect(api.patch).toHaveBeenNthCalledWith(1, '/parametros/verificacion/entrevista/opcion-1', { etiqueta: 'Razón actualizada' });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/parametros/verificacion/entrevista/opcion-1/estado', { activo: false });
    expect(api.put).toHaveBeenCalledWith('/parametros/verificacion/entrevista/orden', { familia: 'MOTIVO_NO_RENOVACION', opcion_ids: ['opcion-2', 'opcion-1'] });
  });
});
