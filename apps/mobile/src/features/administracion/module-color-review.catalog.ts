import type { ModuleTheme, ModuleThemeKey } from '../../theme/tokens';

export interface ModuleColorReviewItem {
  key: string;
  title: string;
  description: string;
  moduleTheme: ModuleThemeKey;
  actionLabel: string;
  statusLabel?: string;
  statusTone?: 'success' | 'progress';
  themeOverride?: ModuleTheme;
}

export const MODULE_COLOR_REVIEW_ITEMS: readonly ModuleColorReviewItem[] = [
  {
    key: 'menu-principal',
    title: 'Menú principal',
    description: 'Referencia visual del inicio de la aplicación.',
    moduleTheme: 'general',
    actionLabel: 'Abrir módulo',
  },
  {
    key: 'documentacion',
    title: 'Documentación',
    description: 'Grupos, expedientes y solicitudes.',
    moduleTheme: 'documentation',
    actionLabel: 'Continuar',
  },
  {
    key: 'verificacion',
    title: 'Verificación',
    description: 'Revisión documental y de crédito.',
    moduleTheme: 'verification',
    actionLabel: 'Continuar',
  },
  {
    key: 'analisis',
    title: 'Análisis',
    description: 'Elegibilidad y capacidad.',
    moduleTheme: 'analysis',
    actionLabel: 'Continuar',
  },
  {
    key: 'desembolsos',
    title: 'Desembolsos',
    description: 'Entrega de créditos.',
    moduleTheme: 'disbursement',
    actionLabel: 'Continuar',
  },
  {
    key: 'cobranza',
    title: 'Cobranza',
    description: 'Pagos y seguimiento.',
    moduleTheme: 'collections',
    actionLabel: 'Continuar',
  },
  {
    key: 'recoleccion',
    title: 'Recolección',
    description: 'Efectivo y entregas.',
    moduleTheme: 'fieldCollection',
    actionLabel: 'Continuar',
  },
  {
    key: 'mora',
    title: 'Mora',
    description: 'Cartera vencida.',
    moduleTheme: 'delinquency',
    actionLabel: 'Continuar',
  },
  {
    key: 'convenios',
    title: 'Convenios',
    description: 'Acuerdos y reestructuras.',
    moduleTheme: 'agreements',
    actionLabel: 'Continuar',
  },
  {
    key: 'reportes',
    title: 'Reportes',
    description: 'Indicadores y resultados.',
    moduleTheme: 'reports',
    actionLabel: 'Continuar',
  },
  {
    key: 'parametros',
    title: 'Parámetros',
    description: 'Políticas y catálogos.',
    moduleTheme: 'parameters',
    actionLabel: 'Abrir catálogo',
  },
  {
    key: 'administracion',
    title: 'Administración',
    description: 'Usuarios, roles y permisos.',
    moduleTheme: 'administration',
    actionLabel: 'Continuar',
  },
] as const;
