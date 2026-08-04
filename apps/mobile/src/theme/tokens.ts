export type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

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
  // Colores principales
  primary: '#0F5A35', // Verde principal CRELEALTAD
  success: '#10B981', // Verde éxito
  error: '#EF4444', // Rojo error
  warning: '#F59E0B', // Naranja advertencia
  warningLight: '#FEF3C7', // Fondo amarillo claro para advertencias
  // Degradado verde para login (derivados del verde principal #0F5A35)
  greenGradientTop: '#0F5A35', // Verde principal CRELEALTAD
  greenGradientBottom: '#083D24', // Verde más oscuro para degradado
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
  headerText: string;
  primary: string;
  primaryText: string;
}> = {
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
  disbursement: {
    headerBg: '#6D28D9',
    titleBarBg: '#5B21B6',
    headerAccent: '#DDD6FE',
    headerText: '#FFFFFF',
    primary: '#6D28D9',
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
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
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
};
