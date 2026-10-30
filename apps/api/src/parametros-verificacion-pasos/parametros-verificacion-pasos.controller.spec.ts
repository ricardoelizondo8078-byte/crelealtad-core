import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import {
  ParametrosVerificacionPasosController,
  PasosVerificacionController,
} from './parametros-verificacion-pasos.controller';

describe('controladores de parámetros de pasos de Verificación', () => {
  it('protege lectura y publicación administrativa', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosVerificacionPasosController.prototype.obtener,
    )).toEqual({ modulo: 'parametros', accion: 'leer' });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosVerificacionPasosController.prototype.actualizar,
    )).toEqual({ modulo: 'parametros', accion: 'actualizar' });
  });

  it('protege el consumo operativo con verificacion:leer', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      PasosVerificacionController.prototype.obtenerRequisitosIntegrante,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });
});
