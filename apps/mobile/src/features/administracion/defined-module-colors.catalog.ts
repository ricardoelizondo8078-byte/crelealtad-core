import type { ModuleColorReviewItem } from './module-color-review.catalog';

export const ANALYSIS_DEFINED_COLOR = '#DAF2D0' as const;
export const ANALYSIS_DEFINED_ACCENT = '#8ED973' as const;

export const DEFINED_MODULE_COLOR_SAMPLES: readonly ModuleColorReviewItem[] = [
  {
    key: 'documentacion-definido',
    title: 'Documentación',
    description: 'Grupos, expedientes y solicitudes.',
    moduleTheme: 'documentation',
    actionLabel: 'Continuar',
    statusLabel: 'COLOR DEFINIDO',
    statusTone: 'success',
  },
  {
    key: 'verificacion-definido',
    title: 'Verificación',
    description: 'Revisión documental y de crédito.',
    moduleTheme: 'verification',
    actionLabel: 'Continuar',
    statusLabel: 'COLOR DEFINIDO',
    statusTone: 'success',
  },
  {
    key: 'analisis-definido',
    title: 'Análisis',
    description: 'Elegibilidad y capacidad.',
    moduleTheme: 'analysis',
    actionLabel: 'Continuar',
    statusLabel: 'COLOR DEFINIDO',
    statusTone: 'success',
  },
];
