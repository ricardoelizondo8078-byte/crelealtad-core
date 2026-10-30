import {
  MODULE_COLOR_REVIEW_ITEMS,
} from '../module-color-review.catalog';
import {
  ANALYSIS_DEFINED_ACCENT,
  ANALYSIS_DEFINED_COLOR,
  DEFINED_MODULE_COLOR_SAMPLES,
} from '../defined-module-colors.catalog';
import { moduleThemes } from '../../../theme/tokens';

describe('MODULE_COLOR_REVIEW_ITEMS', () => {
  it('incluye el Menú principal y los once módulos institucionales una sola vez', () => {
    expect(MODULE_COLOR_REVIEW_ITEMS).toHaveLength(12);
    expect(MODULE_COLOR_REVIEW_ITEMS[0]).toMatchObject({
      key: 'menu-principal',
      moduleTheme: 'general',
    });
    expect(new Set(MODULE_COLOR_REVIEW_ITEMS.map(({ moduleTheme }) => moduleTheme)).size)
      .toBe(12);
  });

  it('conserva Documentación y Verificación como colores definidos', () => {
    expect(DEFINED_MODULE_COLOR_SAMPLES.slice(0, 2).map(({
      key,
      statusLabel,
      statusTone,
    }) => ({ key, statusLabel, statusTone })))
      .toEqual([
        {
          key: 'documentacion-definido',
          statusLabel: 'COLOR DEFINIDO',
          statusTone: 'success',
        },
        {
          key: 'verificacion-definido',
          statusLabel: 'COLOR DEFINIDO',
          statusTone: 'success',
        },
      ]);
  });

  it('mantiene la combinación definitiva de Análisis', () => {
    expect(ANALYSIS_DEFINED_COLOR).toBe('#DAF2D0');
    expect(moduleThemes.analysis).toMatchObject({
      headerBg: ANALYSIS_DEFINED_COLOR,
      titleBarBg: ANALYSIS_DEFINED_ACCENT,
      primary: ANALYSIS_DEFINED_ACCENT,
    });
    expect(ANALYSIS_DEFINED_ACCENT).toBe('#8ED973');
    expect(ANALYSIS_DEFINED_ACCENT).not.toBe(ANALYSIS_DEFINED_COLOR);
    expect(DEFINED_MODULE_COLOR_SAMPLES[2]).toMatchObject({
      key: 'analisis-definido',
      moduleTheme: 'analysis',
      statusLabel: 'COLOR DEFINIDO',
      statusTone: 'success',
    });
    expect(DEFINED_MODULE_COLOR_SAMPLES).toHaveLength(3);
  });
});
