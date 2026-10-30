import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import {
  FinancierasCompetidorasVerificacionController,
  ParametrosFinancierasController,
} from './parametros-financieras.controller';

describe('ParametrosFinancierasController', () => {
  const service = {
    listar: jest.fn(),
    listarHistorial: jest.fn(),
    listarVigentes: jest.fn(),
    publicarCambio: jest.fn(),
  };

  const controller = new ParametrosFinancierasController(service as never);
  const verificacionController = new FinancierasCompetidorasVerificacionController(
    service as never,
  );

  it.each([
    ['listar', 'leer'],
    ['listarHistorial', 'leer'],
    ['publicarCambio', 'registrar'],
  ] as const)('protege %s con parametros:%s', (metodo, accion) => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosFinancierasController.prototype[metodo],
    )).toEqual({ modulo: 'parametros', accion });
  });

  it('expone el catálogo operativo únicamente a Verificación', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      FinancierasCompetidorasVerificacionController.prototype.listarVigentes,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('entrega datos y actor autenticado en la publicación directa', async () => {
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    const dto = { financiera_id: '22222222-2222-4222-8222-222222222222' };
    service.publicarCambio.mockResolvedValue({ id: 'version' });
    await controller.publicarCambio(dto, { user } as never);
    expect(service.publicarCambio).toHaveBeenCalledWith(dto, user);
  });

  it('consulta la clasificación por fecha de captura', async () => {
    service.listarVigentes.mockResolvedValue({ fecha: '2026-10-08', items: [] });
    await verificacionController.listarVigentes('2026-10-08');
    expect(service.listarVigentes).toHaveBeenCalledWith('2026-10-08');
  });
});
