import { hasPermission } from './permission-checker';

describe('permission-checker', () => {
  it('habilita una capacidad exacta sin abrir otras acciones del módulo', () => {
    const permissions = {
      modulos: ['documentacion', 'parametros'],
      acciones: ['leer', 'actualizar'],
      capacidades: ['parametros:leer'],
    };

    expect(hasPermission(permissions, 'parametros', 'leer')).toBe(true);
    expect(hasPermission(permissions, 'parametros', 'actualizar')).toBe(false);
    expect(hasPermission(permissions, 'documentacion', 'actualizar')).toBe(true);
  });

  it('mantiene compatibilidad con sesiones que todavía no tienen capacidades exactas', () => {
    expect(hasPermission({
      modulos: ['verificacion'],
      acciones: ['leer'],
    }, 'verificacion', 'leer')).toBe(true);
  });
});
