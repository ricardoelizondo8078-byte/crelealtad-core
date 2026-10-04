export type ModuleThemeKey =
  | 'general'
  | 'documentation'
  | 'verification'
  | 'analysis'
  | 'disbursement'
  | 'collections'
  | 'fieldCollection'
  | 'delinquency'
  | 'agreements'
  | 'reports'
  | 'parameters'
  | 'administration';

export type StatusKey =
  | 'neutral'
  | 'newGroup'
  | 'newMember'
  | 'needsDocumentation'
  | 'needsDocumentationGroup'
  | 'documentation'
  | 'readyForVerification'
  | 'inVerification'
  | 'verificationObservations'
  | 'verified'
  | 'analysis'
  | 'authorized'
  | 'waitingForThreshold'
  | 'readyForDisbursement'
  | 'disbursed'
  | 'pending'
  | 'completed'
  | 'withdrawn'
  | 'cancelled'
  | 'rejected'
  | 'unknown';

export const colors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  border: '#D1D5DB',
  borderSoft: '#E5E7EB',
  successSoft: '#DCFCE7',
  dangerSoft: '#FEE2E2',
  danger: '#EF4444', // Color de error/peligro para textos
  white: '#FFFFFF',
  overlay: 'rgba(17, 24, 39, 0.82)',
  // Colores principales
  primary: '#0F5A35', // Verde principal CRELEALTAD
  brandYellow: '#FDE047', // Acento institucional para encabezados contextuales
  withdrawnHeaderText: '#FECACA', // Rojo claro legible sobre el verde institucional
  success: '#10B981', // Verde éxito
  error: '#EF4444', // Rojo error
  warning: '#F59E0B', // Naranja advertencia
  warningLight: '#FEF3C7', // Fondo amarillo claro para advertencias
  info: '#2563EB', // Azul informativo con contraste sobre fondos celestes
  infoSoft: '#EFF6FF', // Celeste claro para datos de contacto e importes informativos
  whatsapp: '#25D366', // Verde oficial para identificar acciones de WhatsApp
  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const moduleThemes: Record<ModuleThemeKey, {
  headerBg: string;
  titleBarBg: string;
  headerAccent: string;
  headerAccentText?: string;
  headerSecondaryText?: string;
  headerText: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  primary: string;
  primaryText: string;
}> = {
  general: {
    headerBg: colors.gray[400],
    titleBarBg: colors.gray[500],
    headerAccent: colors.gray[100],
    headerAccentText: colors.gray[700],
    headerSecondaryText: colors.gray[900],
    headerText: colors.gray[900],
    statusBarStyle: 'dark-content',
    primary: colors.gray[500],
    primaryText: colors.white,
  },
  documentation: {
    headerBg: '#0F5A35',
    titleBarBg: '#0B472A',
    headerAccent: '#DCFCE7',
    headerText: '#FFFFFF',
    primary: '#0F5A35',
    primaryText: '#FFFFFF',
  },
  verification: {
    headerBg: '#9F7410', // Amarillo profundo
    titleBarBg: '#C89B1F', // Amarillo principal
    headerAccent: '#FFF8E6', // Fondo amarillo muy claro
    headerText: '#FFFFFF',
    primary: '#9F7410',
    primaryText: '#FFFFFF',
  },
  analysis: {
    headerBg: '#1D4ED8',
    titleBarBg: '#1E40AF',
    headerAccent: '#DBEAFE',
    headerText: '#FFFFFF',
    primary: '#1D4ED8',
    primaryText: '#FFFFFF',
  },
  disbursement: {
    headerBg: '#6D28D9',
    titleBarBg: '#5B21B6',
    headerAccent: '#DDD6FE',
    headerText: '#FFFFFF',
    primary: '#6D28D9',
    primaryText: '#FFFFFF',
  },
  collections: {
    headerBg: '#0E7490',
    titleBarBg: '#155E75',
    headerAccent: '#CFFAFE',
    headerText: '#FFFFFF',
    primary: '#0E7490',
    primaryText: '#FFFFFF',
  },
  fieldCollection: {
    headerBg: '#047857',
    titleBarBg: '#065F46',
    headerAccent: '#D1FAE5',
    headerText: '#FFFFFF',
    primary: '#047857',
    primaryText: '#FFFFFF',
  },
  delinquency: {
    headerBg: '#B45309',
    titleBarBg: '#92400E',
    headerAccent: '#FEF3C7',
    headerText: '#FFFFFF',
    primary: '#B45309',
    primaryText: '#FFFFFF',
  },
  agreements: {
    headerBg: '#4338CA',
    titleBarBg: '#3730A3',
    headerAccent: '#E0E7FF',
    headerText: '#FFFFFF',
    primary: '#4338CA',
    primaryText: '#FFFFFF',
  },
  reports: {
    headerBg: '#0369A1',
    titleBarBg: '#075985',
    headerAccent: '#E0F2FE',
    headerText: '#FFFFFF',
    primary: '#0369A1',
    primaryText: '#FFFFFF',
  },
  parameters: {
    headerBg: '#475569',
    titleBarBg: '#334155',
    headerAccent: '#E2E8F0',
    headerText: '#FFFFFF',
    primary: '#475569',
    primaryText: '#FFFFFF',
  },
  administration: {
    headerBg: '#9F1239',
    titleBarBg: '#881337',
    headerAccent: '#FFE4E6',
    headerText: '#FFFFFF',
    primary: '#9F1239',
    primaryText: '#FFFFFF',
  },
};

export const fonts = {
  // Montserrat — títulos, números, botones, labels
  bold: 'Montserrat_700Bold',
  extraBold: 'Montserrat_800ExtraBold',
  black: 'Montserrat_900Black',
  // Inter — cuerpo, inputs, texto secundario
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
};

export const typography = {
  title: { fontSize: 20, fontWeight: '700' as const },
  contextTitle: { fontSize: 18, fontWeight: '700' as const },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  metricValue: { fontSize: 28, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  captionStrong: { fontSize: 12, fontWeight: '700' as const },
  notificationBadge: { fontSize: 9, lineHeight: 11, fontWeight: '700' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stickyHeader: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 4,
  },
};

export const zIndex = {
  stickyHeader: 10,
};

export const statusColors: Record<StatusKey, {
  background: string;
  foreground: string;
}> = {
  neutral: { background: colors.gray[200], foreground: colors.gray[700] },
  newGroup: { background: colors.gray[200], foreground: colors.gray[700] },
  newMember: { background: colors.gray[200], foreground: colors.textPrimary },
  needsDocumentation: {
    background: moduleThemes.verification.headerBg,
    foreground: moduleThemes.verification.headerText,
  },
  needsDocumentationGroup: {
    background: moduleThemes.verification.headerBg,
    foreground: moduleThemes.verification.headerText,
  },
  documentation: { background: colors.gray[600], foreground: colors.white },
  readyForVerification: { background: '#15803D', foreground: colors.white },
  inVerification: { background: '#A16207', foreground: colors.white },
  verificationObservations: { background: '#C2410C', foreground: colors.white },
  verified: { background: '#0F766E', foreground: colors.white },
  analysis: { background: '#1D4ED8', foreground: colors.white },
  authorized: { background: '#6D28D9', foreground: colors.white },
  waitingForThreshold: { background: '#B45309', foreground: colors.white },
  readyForDisbursement: { background: '#1E40AF', foreground: colors.white },
  disbursed: { background: '#047857', foreground: colors.white },
  pending: { background: '#B45309', foreground: colors.white },
  completed: { background: '#15803D', foreground: colors.white },
  withdrawn: { background: colors.gray[600], foreground: colors.white },
  cancelled: { background: colors.gray[700], foreground: colors.white },
  rejected: { background: '#B91C1C', foreground: colors.white },
  unknown: { background: colors.gray[700], foreground: colors.white },
};

export const touchTargets = {
  minimum: 44,
  primary: 48,
  largeAction: 64,
};

export const layout = {
  moduleCardMinHeight: 184,
  statusCardMinHeight: 128,
  statusStripeWidth: 36,
  statusStripeNarrowWidth: 30,
  statusStripeLabelLength: 190,
  statusTabMinWidth: 72,
  statusCardBorderWidth: 2,
  notificationBadgeSize: 18,
  notificationCountPillMinSize: 28,
  buttonTrailingIndicatorWidth: 96,
  documentPreviewHeight: 320,
  processingPanelMaxWidth: 320,
};

export const iconSizes = {
  action: 20,
  largeAction: 24,
  module: 48,
};
