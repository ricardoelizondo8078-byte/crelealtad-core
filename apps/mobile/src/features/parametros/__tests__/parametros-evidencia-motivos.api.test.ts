import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '../../../services/api-client';
import {
  actualizarMotivoClasificacionEvidencia,
  cambiarEstadoMotivoClasificacionEvidencia,
  crearMotivoClasificacionEvidencia,
  listarMotivosClasificacionEvidencia,
  listarMotivosClasificacionEvidenciaVigentes,
  reordenarMotivosClasificacionEvidencia,
} from '../parametros-evidencia-motivos.api';

jest.mock('../../../services/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
  },
}));

describe('API de motivos para clasificar evidencias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('separa las rutas administrativas de la consulta operativa', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ items: [] });
    (api.post as jest.MockedFunction<typeof api.post>).mockResolvedValue({ motivo: {} });
    (api.patch as jest.MockedFunction<typeof api.patch>).mockResolvedValue({ motivo: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ items: [] });

    await listarMotivosClasificacionEvidencia('AMARILLO');
    await crearMotivoClasificacionEvidencia('AMARILLO', 'Requiere seguimiento');
    await actualizarMotivoClasificacionEvidencia('motivo-1', 'Seguimiento requerido');
    await cambiarEstadoMotivoClasificacionEvidencia('motivo-1', false);
    await reordenarMotivosClasificacionEvidencia('AMARILLO', ['motivo-2', 'motivo-1']);
    await listarMotivosClasificacionEvidenciaVigentes();

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      '/parametros/evidencia/motivos-clasificacion?clasificacion=AMARILLO&incluir_inactivos=true',
    );
    expect(api.put).toHaveBeenCalledWith(
      '/parametros/evidencia/motivos-clasificacion/orden',
      { clasificacion: 'AMARILLO', motivo_ids: ['motivo-2', 'motivo-1'] },
    );
    expect(api.post).toHaveBeenCalledWith(
      '/parametros/evidencia/motivos-clasificacion',
      { clasificacion: 'AMARILLO', concepto: 'Requiere seguimiento' },
    );
    expect(api.patch).toHaveBeenNthCalledWith(
      1,
      '/parametros/evidencia/motivos-clasificacion/motivo-1',
      { concepto: 'Seguimiento requerido' },
    );
    expect(api.patch).toHaveBeenNthCalledWith(
      2,
      '/parametros/evidencia/motivos-clasificacion/motivo-1/estado',
      { activo: false },
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/verificacion/evidencia/motivos-clasificacion',
      { showProcessing: false },
    );
  });
});
