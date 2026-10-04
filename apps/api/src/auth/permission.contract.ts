export const MODULOS_AUTORIZABLES = [
  'documentacion',
  'expedientes',
  'solicitudes',
  'verificacion',
  'analisis',
  'desembolso',
  'desembolsos',
  'creditos',
  'caja',
  'cobranza',
  'pagos',
  'recoleccion',
  'mora',
  'convenios',
  'reportes',
  'parametros',
  'administracion',
] as const;

export const ACCIONES_AUTORIZABLES = [
  'crear',
  'leer',
  'actualizar',
  'registrar',
  'aprobar',
  'rechazar',
  'exportar',
] as const;

export const PERMISO_TOTAL = '*' as const;

export type ModuloAutorizable = (typeof MODULOS_AUTORIZABLES)[number];
export type AccionAutorizable = (typeof ACCIONES_AUTORIZABLES)[number];

export interface PermisosRol {
  modulos: string[];
  acciones: string[];
}

const modulosConocidos = new Set<string>(MODULOS_AUTORIZABLES);
const accionesConocidas = new Set<string>(ACCIONES_AUTORIZABLES);

function normalizarLista(
  valores: unknown,
  catalogo: ReadonlySet<string>,
): string[] {
  if (!Array.isArray(valores)) return [];
  if (valores.includes(PERMISO_TOTAL)) return [PERMISO_TOTAL];

  return [...new Set(
    valores.filter(
      (valor): valor is string => typeof valor === 'string' && catalogo.has(valor),
    ),
  )];
}

export function normalizarContratoPermisos(permisos?: unknown): PermisosRol {
  if (!permisos || typeof permisos !== 'object' || Array.isArray(permisos)) {
    return { modulos: [], acciones: [] };
  }

  const candidato = permisos as Record<string, unknown>;
  return {
    modulos: normalizarLista(candidato.modulos, modulosConocidos),
    acciones: normalizarLista(candidato.acciones, accionesConocidas),
  };
}

export function tienePermiso(
  permisos: PermisosRol,
  modulo: ModuloAutorizable,
  accion: AccionAutorizable,
): boolean {
  const tieneModulo = permisos.modulos.includes(PERMISO_TOTAL)
    || permisos.modulos.includes(modulo);
  const tieneAccion = permisos.acciones.includes(PERMISO_TOTAL)
    || permisos.acciones.includes(accion);

  return tieneModulo && tieneAccion;
}
