import {
  normalizarContratoPermisos,
  tienePermiso,
} from './permission.contract';

describe('permission contract', () => {
  it('conserva únicamente módulos y acciones registrados, sin duplicados', () => {
    expect(normalizarContratoPermisos({
      modulos: ['documentacion', 'inventado', 'documentacion', 3],
      acciones: ['leer', 'inventada', 'leer', null],
    })).toEqual({
      modulos: ['documentacion'],
      acciones: ['leer'],
      capacidades: [],
    });
  });

  it('normaliza el permiso total sin combinarlo con valores parciales', () => {
    expect(normalizarContratoPermisos({
      modulos: ['documentacion', '*'],
      acciones: ['*', 'leer'],
    })).toEqual({
      modulos: ['*'],
      acciones: ['*'],
      capacidades: [],
    });
  });

  it('deniega por defecto cuando el contrato no es válido', () => {
    const permisos = normalizarContratoPermisos({ modulos: 'documentacion' });

    expect(tienePermiso(permisos, 'documentacion', 'leer')).toBe(false);
  });

  it('exige simultáneamente módulo y acción', () => {
    const permisos = normalizarContratoPermisos({
      modulos: ['verificacion'],
      acciones: ['leer'],
    });

    expect(tienePermiso(permisos, 'verificacion', 'leer')).toBe(true);
    expect(tienePermiso(permisos, 'verificacion', 'registrar')).toBe(false);
    expect(tienePermiso(permisos, 'expedientes', 'leer')).toBe(false);
  });

  it('acepta una capacidad exacta sin habilitar las demás acciones del módulo', () => {
    const permisos = normalizarContratoPermisos({
      modulos: ['documentacion', 'parametros'],
      acciones: ['leer', 'actualizar'],
      capacidades: ['parametros:leer', 'parametros:inventada', 'inventado:leer'],
    });

    expect(permisos.capacidades).toEqual(['parametros:leer']);
    expect(tienePermiso(permisos, 'parametros', 'leer')).toBe(true);
    expect(tienePermiso(permisos, 'parametros', 'actualizar')).toBe(false);
    expect(tienePermiso(permisos, 'documentacion', 'actualizar')).toBe(true);
  });
});
