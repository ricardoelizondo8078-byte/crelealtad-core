import type { ModuleMenuOption } from './ModuleMenuScreen';

export type InstitutionalModuleId =
  | 'login'
  | 'documentacion'
  | 'verificacion'
  | 'analisis'
  | 'desembolsos'
  | 'cobranza'
  | 'recoleccion'
  | 'mora'
  | 'convenios'
  | 'reportes'
  | 'parametros'
  | 'administracion';

interface OperationalModuleAccess {
  canOpenDocumentation: boolean;
  canViewVerification: boolean;
}

interface OperationalModuleHandlers {
  openDocumentation: () => void;
  openVerification: () => void;
}

export const PLANNED_MODULE_OPTIONS = [
  {
    key: 'analisis',
    title: 'Análisis',
    description: 'Elegibilidad y capacidad',
    iconLabel: 'AN',
    moduleTheme: 'analysis',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'desembolsos',
    title: 'Desembolsos',
    description: 'Entrega de créditos',
    iconLabel: 'DE',
    moduleTheme: 'disbursement',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'cobranza',
    title: 'Cobranza',
    description: 'Pagos y seguimiento',
    iconLabel: 'CO',
    moduleTheme: 'collections',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'recoleccion',
    title: 'Recolección',
    description: 'Efectivo y entregas',
    iconLabel: 'RE',
    moduleTheme: 'fieldCollection',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'mora',
    title: 'Mora',
    description: 'Cartera vencida',
    iconLabel: 'MO',
    moduleTheme: 'delinquency',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'convenios',
    title: 'Convenios',
    description: 'Acuerdos y reestructuras',
    iconLabel: 'CV',
    moduleTheme: 'agreements',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'reportes',
    title: 'Reportes',
    description: 'Indicadores y resultados',
    iconLabel: 'RP',
    moduleTheme: 'reports',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'parametros',
    title: 'Parámetros',
    description: 'Políticas y productos',
    iconLabel: 'PA',
    moduleTheme: 'parameters',
    disabled: true,
    statusLabel: 'Próximamente',
  },
  {
    key: 'administracion',
    title: 'Administración',
    description: 'Usuarios, roles y permisos',
    iconLabel: 'AD',
    moduleTheme: 'administration',
    disabled: true,
    statusLabel: 'Próximamente',
  },
] as const satisfies readonly (ModuleMenuOption & { key: InstitutionalModuleId })[];

export function buildOperationalModuleOptions(
  access: OperationalModuleAccess,
  handlers: OperationalModuleHandlers,
  includePlannedModules: boolean,
): ModuleMenuOption[] {
  const modules: ModuleMenuOption[] = [];

  if (access.canOpenDocumentation) {
    modules.push({
      key: 'documentation',
      title: 'Documentación',
      description: 'Grupos, expedientes y solicitudes',
      iconLabel: 'DO',
      moduleTheme: 'documentation',
      onPress: handlers.openDocumentation,
    });
  }

  modules.push({
    key: 'verification',
    title: 'Verificación',
    description: 'Revisión documental y de crédito',
    iconLabel: 'VE',
    moduleTheme: 'verification',
    onPress: access.canViewVerification ? handlers.openVerification : undefined,
    disabled: !access.canViewVerification,
    statusLabel: access.canViewVerification ? undefined : 'Requiere permiso',
  });

  if (includePlannedModules) modules.push(...PLANNED_MODULE_OPTIONS);

  return modules;
}
