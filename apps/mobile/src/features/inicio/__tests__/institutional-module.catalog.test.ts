import { describe, expect, it, jest } from '@jest/globals';
import {
  buildOperationalModuleOptions,
  PLANNED_MODULE_OPTIONS,
} from '../institutional-module.catalog';

describe('buildOperationalModuleOptions', () => {
  it('oculta Documentación sin acceso y conserva Verificación bloqueada', () => {
    const modules = buildOperationalModuleOptions(
      {
        canOpenDocumentation: false,
        canViewVerification: false,
        canOpenParameters: false,
        canReviewModuleColors: false,
      },
      {
        openDocumentation: jest.fn(),
        openVerification: jest.fn(),
        openParameters: jest.fn(),
        openModuleColorReview: jest.fn(),
        openDefinedModuleColors: jest.fn(),
      },
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
      {
        canOpenDocumentation: true,
        canViewVerification: true,
        canOpenParameters: false,
        canReviewModuleColors: false,
      },
      {
        openDocumentation,
        openVerification,
        openParameters: jest.fn(),
        openModuleColorReview: jest.fn(),
        openDefinedModuleColors: jest.fn(),
      },
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
      {
        canOpenDocumentation: false,
        canViewVerification: true,
        canOpenParameters: false,
        canReviewModuleColors: false,
      },
      {
        openDocumentation: jest.fn(),
        openVerification: jest.fn(),
        openParameters: jest.fn(),
        openModuleColorReview: jest.fn(),
        openDefinedModuleColors: jest.fn(),
      },
      true,
    );

    expect(modules).toHaveLength(2 + PLANNED_MODULE_OPTIONS.length);
    expect(modules.slice(2).every(({ disabled, statusLabel }) => (
      disabled === true && statusLabel === 'Próximamente'
    ))).toBe(true);
  });

  it('abre Parámetros únicamente con permiso efectivo', () => {
    const openParameters = jest.fn();
    const modules = buildOperationalModuleOptions(
      {
        canOpenDocumentation: false,
        canViewVerification: true,
        canOpenParameters: true,
        canReviewModuleColors: false,
      },
      {
        openDocumentation: jest.fn(),
        openVerification: jest.fn(),
        openParameters,
        openModuleColorReview: jest.fn(),
        openDefinedModuleColors: jest.fn(),
      },
      false,
    );

    expect(modules.map(({ key }) => key)).toEqual(['verification', 'parameters']);
    modules[1]?.onPress?.();
    expect(openParameters).toHaveBeenCalledTimes(1);
  });

  it('muestra la revisión de colores sólo con acceso de Administración', () => {
    const openModuleColorReview = jest.fn();
    const openDefinedModuleColors = jest.fn();
    const modules = buildOperationalModuleOptions(
      {
        canOpenDocumentation: false,
        canViewVerification: true,
        canOpenParameters: false,
        canReviewModuleColors: true,
      },
      {
        openDocumentation: jest.fn(),
        openVerification: jest.fn(),
        openParameters: jest.fn(),
        openModuleColorReview,
        openDefinedModuleColors,
      },
      false,
    );

    expect(modules.map(({ key }) => key)).toEqual([
      'verification',
      'module-color-review',
      'defined-module-colors',
    ]);
    modules[1]?.onPress?.();
    modules[2]?.onPress?.();
    expect(openModuleColorReview).toHaveBeenCalledTimes(1);
    expect(openDefinedModuleColors).toHaveBeenCalledTimes(1);
  });
});
