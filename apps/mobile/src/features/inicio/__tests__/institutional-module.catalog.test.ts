import { describe, expect, it, jest } from '@jest/globals';
import {
  buildOperationalModuleOptions,
  PLANNED_MODULE_OPTIONS,
} from '../institutional-module.catalog';

describe('buildOperationalModuleOptions', () => {
  it('oculta Documentación sin acceso y conserva Verificación bloqueada', () => {
    const modules = buildOperationalModuleOptions(
      { canOpenDocumentation: false, canViewVerification: false },
      { openDocumentation: jest.fn(), openVerification: jest.fn() },
      false,
    );

    expect(modules.map(({ key }) => key)).toEqual(['verification']);
    expect(modules[0]).toMatchObject({
      disabled: true,
      statusLabel: 'Requiere permiso',
      onPress: undefined,
    });
  });

  it('expone únicamente los manejadores de módulos autorizados', () => {
    const openDocumentation = jest.fn();
    const openVerification = jest.fn();
    const modules = buildOperationalModuleOptions(
      { canOpenDocumentation: true, canViewVerification: true },
      { openDocumentation, openVerification },
      false,
    );

    expect(modules.map(({ key }) => key)).toEqual(['documentation', 'verification']);
    modules[0]?.onPress?.();
    modules[1]?.onPress?.();
    expect(openDocumentation).toHaveBeenCalledTimes(1);
    expect(openVerification).toHaveBeenCalledTimes(1);
  });

  it('agrega prototipos sólo en desarrollo y siempre deshabilitados', () => {
    const modules = buildOperationalModuleOptions(
      { canOpenDocumentation: false, canViewVerification: true },
      { openDocumentation: jest.fn(), openVerification: jest.fn() },
      true,
    );

    expect(modules).toHaveLength(1 + PLANNED_MODULE_OPTIONS.length);
    expect(modules.slice(1).every(({ disabled, statusLabel }) => (
      disabled === true && statusLabel === 'Próximamente'
    ))).toBe(true);
  });
});
