import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import { ParametrosEntrevistaController, ParametrosEntrevistaVerificacionController } from './parametros-entrevista.controller';

describe('ParametrosEntrevistaController', () => {
  const service = { listar: jest.fn(), listarActivos: jest.fn(), crear: jest.fn(), actualizar: jest.fn(), cambiarEstado: jest.fn(), reordenar: jest.fn() };
  const controller = new ParametrosEntrevistaController(service as never);

  it.each([
    ['listar', 'leer'], ['crear', 'registrar'], ['actualizar', 'actualizar'],
    ['estado', 'actualizar'], ['reordenar', 'actualizar'],
  ] as const)('protege %s con parametros:%s', (metodo, accion) => {
    expect(Reflect.getMetadata(PERMISO_REQUERIDO_KEY, ParametrosEntrevistaController.prototype[metodo]))
      .toEqual({ modulo: 'parametros', accion });
  });

  it('protege la consulta operativa con verificacion:leer', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosEntrevistaVerificacionController.prototype.listar,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('entrega sólo opciones activas a Verificación', async () => {
    const operativo = new ParametrosEntrevistaVerificacionController(service as never);
    await operativo.listar();
    expect(service.listarActivos).toHaveBeenCalled();
  });

  it('entrega el actor autenticado en todas las mutaciones', async () => {
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    const id = '22222222-2222-4222-8222-222222222222';
    await controller.crear({ familia: 'MOTIVO_NO_RENOVACION', etiqueta: 'Otro caso' }, { user } as never);
    await controller.actualizar(id, { etiqueta: 'Caso actualizado' }, { user } as never);
    await controller.estado(id, { activo: false }, { user } as never);
    await controller.reordenar({ familia: 'MOTIVO_NO_RENOVACION', opcion_ids: [id] }, { user } as never);
    expect(service.crear).toHaveBeenCalledWith({ familia: 'MOTIVO_NO_RENOVACION', etiqueta: 'Otro caso' }, user);
    expect(service.actualizar).toHaveBeenCalledWith(id, { etiqueta: 'Caso actualizado' }, user);
    expect(service.cambiarEstado).toHaveBeenCalledWith(id, { activo: false }, user);
    expect(service.reordenar).toHaveBeenCalledWith({ familia: 'MOTIVO_NO_RENOVACION', opcion_ids: [id] }, user);
  });
});
