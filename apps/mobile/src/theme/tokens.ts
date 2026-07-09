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
  white: '#FFFFFF',
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
    headerBg: '#B45309',
    titleBarBg: '#92400E',
    headerAccent: '#FDE68A',
    headerText: '#FFFFFF',
    primary: '#B45309',
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
