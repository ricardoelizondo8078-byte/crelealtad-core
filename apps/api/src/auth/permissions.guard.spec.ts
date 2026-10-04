import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import {
  PERMISO_REQUERIDO_KEY,
  SOLO_AUTENTICADO_KEY,
} from './permissions.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PermisosRol } from '../catalogos/entities/rol.entity';

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector);

  const crearContexto = (
    handler: () => void,
    permisos?: PermisosRol,
    permisosPersonalizados?: PermisosRol | null,
  ) =>
    ({
      getHandler: () => handler,
      getClass: () => class ControladorPrueba {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: permisos
            ? {
              permisos_personalizados: permisosPersonalizados,
              rol: { permisos },
            }
            : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('permite una ruta pública', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);

    expect(guard.canActivate(crearContexto(handler))).toBe(true);
  });

  it('permite una ruta que solo requiere autenticación', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(SOLO_AUTENTICADO_KEY, true, handler);

    expect(guard.canActivate(crearContexto(handler))).toBe(true);
  });

  it('permite el módulo y la acción configurados', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(
      PERMISO_REQUERIDO_KEY,
      { modulo: 'expedientes', accion: 'leer' },
      handler,
    );

    expect(
      guard.canActivate(
        crearContexto(handler, {
          modulos: ['expedientes'],
          acciones: ['leer'],
        }),
      ),
    ).toBe(true);
  });

  it('acepta permisos globales', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(
      PERMISO_REQUERIDO_KEY,
      { modulo: 'expedientes', accion: 'actualizar' },
      handler,
    );

    expect(
      guard.canActivate(
        crearContexto(handler, { modulos: ['*'], acciones: ['*'] }),
      ),
    ).toBe(true);
  });

  it('bloquea cuando falta el permiso solicitado', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(
      PERMISO_REQUERIDO_KEY,
      { modulo: 'solicitudes', accion: 'actualizar' },
      handler,
    );

    expect(() =>
      guard.canActivate(
        crearContexto(handler, {
          modulos: ['solicitudes'],
          acciones: ['leer'],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('aplica permisos personalizados sin cambiar el rol operativo', () => {
    const handler = (): void => undefined;
    Reflect.defineMetadata(
      PERMISO_REQUERIDO_KEY,
      { modulo: 'verificacion', accion: 'leer' },
      handler,
    );

    expect(() =>
      guard.canActivate(
        crearContexto(
          handler,
          {
            modulos: ['documentacion', 'verificacion'],
            acciones: ['leer'],
          },
          {
            modulos: ['documentacion'],
            acciones: ['leer'],
          },
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('bloquea una ruta protegida sin permiso declarado', () => {
    const handler = (): void => undefined;

    expect(() => guard.canActivate(crearContexto(handler))).toThrow(
      ForbiddenException,
    );
  });
});
