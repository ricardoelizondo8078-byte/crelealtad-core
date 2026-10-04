import { ForbiddenException } from '@nestjs/common';
import {
  accessScopeFromContext,
  assertExpedienteAccess,
  assertIntegranteAccess,
  resolveEmpleadoId,
} from './access-scope';

describe('access-scope', () => {
  const asesor = { usuarioId: 'usuario-1', rolNombre: 'ASESOR' };
  const verificador = { usuarioId: 'usuario-2', rolNombre: 'VERIFICADOR' };

  it('resuelve el empleado del asesor y falla cerrado si no existe', async () => {
    const executor = { query: jest.fn().mockResolvedValue([{ id: 'empleado-1' }]) };
    await expect(resolveEmpleadoId(executor, asesor)).resolves.toBe('empleado-1');

    executor.query.mockResolvedValueOnce([]);
    await expect(resolveEmpleadoId(executor, asesor)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('restringe expedientes e integrantes ajenos para el rol ASESOR', async () => {
    const executor = { query: jest.fn().mockResolvedValue([]) };

    await expect(assertExpedienteAccess(executor, 'expediente-1', asesor))
      .rejects.toBeInstanceOf(ForbiddenException);
    await expect(assertIntegranteAccess(executor, 'integrante-1', asesor))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('no inventa alcance territorial para roles cuya matriz sigue pendiente', async () => {
    const executor = { query: jest.fn() };

    await expect(assertExpedienteAccess(executor, 'expediente-1', verificador)).resolves.toBeUndefined();
    await expect(assertIntegranteAccess(executor, 'integrante-1', verificador)).resolves.toBeUndefined();
    expect(executor.query).not.toHaveBeenCalled();
  });

  it('abre el alcance institucional de Verificación sólo con permiso efectivo', async () => {
    const usuario = {
      id: 'usuario-asesor-verificador',
      permisos_personalizados: null,
      rol: {
        nombre: 'ASESOR',
        permisos: {
          modulos: ['expedientes', 'verificacion'],
          acciones: ['leer', 'registrar'],
        },
      },
    } as never;
    const executor = { query: jest.fn() };
    const scope = accessScopeFromContext(usuario, 'verificacion');

    expect(scope).toEqual({
      usuarioId: 'usuario-asesor-verificador',
      rolNombre: 'ASESOR',
      mode: 'INSTITUCIONAL',
    });
    await expect(assertExpedienteAccess(executor, 'expediente-ajeno', scope))
      .resolves.toBeUndefined();
    expect(executor.query).not.toHaveBeenCalled();
  });

  it('no permite usar el contexto de Verificación sin el módulo autorizado', () => {
    const usuario = {
      id: 'usuario-sin-verificacion',
      permisos_personalizados: {
        modulos: ['expedientes'],
        acciones: ['leer'],
      },
      rol: {
        nombre: 'ASESOR',
        permisos: {
          modulos: ['expedientes', 'verificacion'],
          acciones: ['leer'],
        },
      },
    } as never;

    expect(() => accessScopeFromContext(usuario, 'verificacion'))
      .toThrow(ForbiddenException);
  });
});
