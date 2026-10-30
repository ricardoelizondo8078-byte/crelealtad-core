import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import {
  ParametrosConclusionesController,
  ParametrosConclusionesVerificacionController,
} from './parametros-conclusiones.controller';

describe('ParametrosConclusionesController', () => {
  const service = {
    obtenerSemanaCredito: jest.fn(),
    actualizarSemanaCredito: jest.fn(),
    obtenerCiclosCredito: jest.fn(),
    actualizarCiclosCredito: jest.fn(),
    obtenerToleranciaSemanaDesembolso: jest.fn(),
    actualizarToleranciaSemanaDesembolso: jest.fn(),
    obtenerConcordanciaFicha: jest.fn(),
    actualizarConcordanciaFicha: jest.fn(),
    obtenerConcordanciaPrestamo: jest.fn(),
    actualizarConcordanciaPrestamo: jest.fn(),
    obtenerPromedioEvidencias: jest.fn(),
    actualizarPromedioEvidencias: jest.fn(),
  };
  const controller = new ParametrosConclusionesController(service as never);

  it('protege la lectura administrativa con parametros:leer', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype.obtenerSemanaCredito,
    )).toEqual({ modulo: 'parametros', accion: 'leer' });
  });

  it('protege la publicación con parametros:actualizar', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype.actualizarSemanaCredito,
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
  });

  it('protege el consumo operativo con verificacion:leer', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesVerificacionController.prototype.obtenerSemanaCredito,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('entrega el actor autenticado al servicio', async () => {
    const dto = {
      verde_desde: 1,
      verde_hasta: 10,
      amarillo_desde: 11,
      amarillo_hasta: 13,
      rojo_desde: 14,
      rojo_hasta: 16,
    };
    const user = { id: '11111111-1111-4111-8111-111111111111' };

    await controller.actualizarSemanaCredito(dto, { user } as never);

    expect(service.actualizarSemanaCredito).toHaveBeenCalledWith(dto, user);
  });

  it('protege y entrega el actor al publicar ciclos', async () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype.actualizarCiclosCredito,
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesVerificacionController.prototype.obtenerCiclosCredito,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });

    const dto = {
      verde_desde: 8,
      verde_hasta: 40,
      amarillo_desde: 4,
      amarillo_hasta: 7,
      rojo_desde: 1,
      rojo_hasta: 3,
    };
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    await controller.actualizarCiclosCredito(dto, { user } as never);
    expect(service.actualizarCiclosCredito).toHaveBeenCalledWith(dto, user);
  });

  it('protege la tolerancia de semana de desembolso', async () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype.actualizarToleranciaSemanaDesembolso,
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesVerificacionController.prototype.obtenerToleranciaSemanaDesembolso,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });

    const dto = {
      verde_desde: 0,
      verde_hasta: 0,
      amarillo_desde: 1,
      amarillo_hasta: 3,
      rojo_desde: 4,
      rojo_hasta: 10,
    };
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    await controller.actualizarToleranciaSemanaDesembolso(dto, { user } as never);
    expect(service.actualizarToleranciaSemanaDesembolso).toHaveBeenCalledWith(dto, user);
  });

  it.each([
    ['Ficha', 'actualizarConcordanciaFicha', 'obtenerConcordanciaFicha'],
    ['Prestamo', 'actualizarConcordanciaPrestamo', 'obtenerConcordanciaPrestamo'],
  ] as const)('protege y entrega el actor para concordancia de %s', async (
    _nombre,
    metodoActualizar,
    metodoObtener,
  ) => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype[metodoActualizar],
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesVerificacionController.prototype[metodoObtener],
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
    const dto = {
      verde_desde: 0,
      verde_hasta: 5,
      amarillo_desde: 6,
      amarillo_hasta: 10,
      rojo_desde: 11,
      rojo_hasta: 100,
    };
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    await controller[metodoActualizar](dto, { user } as never);
    expect(service[metodoActualizar]).toHaveBeenCalledWith(dto, user);
  });

  it('protege y entrega el actor al publicar el promedio de evidencias', async () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesController.prototype.actualizarPromedioEvidencias,
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosConclusionesVerificacionController.prototype.obtenerPromedioEvidencias,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
    const dto = {
      verde_desde: 67,
      verde_hasta: 100,
      amarillo_desde: 34,
      amarillo_hasta: 66,
      rojo_desde: 0,
      rojo_hasta: 33,
    };
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    await controller.actualizarPromedioEvidencias(dto, { user } as never);
    expect(service.actualizarPromedioEvidencias).toHaveBeenCalledWith(dto, user);
  });
});
