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
    });
  });

  it('normaliza el permiso total sin combinarlo con valores parciales', () => {
    expect(normalizarContratoPermisos({
      modulos: ['documentacion', '*'],
      acciones: ['*', 'leer'],
    })).toEqual({
      modulos: ['*'],
      acciones: ['*'],
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
});
