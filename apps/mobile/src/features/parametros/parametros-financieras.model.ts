import type {
  SemanticChoiceOption,
  StatusBadgeTone,
} from '../../components/ui';

export type ClasificacionFinanciera = 'OBJETIVO' | 'REVISION' | 'NO_PRIORITARIA';

export interface PresentacionClasificacionFinanciera {
  label: string;
  shortLabel: string;
  choiceLabel: string;
  choiceDescription: string;
  tone: StatusBadgeTone;
  summaryTone: 'positive' | 'warning' | 'negative';
}

export const CLASIFICACIONES_FINANCIERA: Record<
  ClasificacionFinanciera,
  PresentacionClasificacionFinanciera
> = {
  OBJETIVO: {
    label: 'Cartera objetivo',
    shortLabel: 'OBJETIVO',
    choiceLabel: 'Óptima',
    choiceDescription: 'Nos interesa esta cartera',
    tone: 'success',
    summaryTone: 'positive',
  },
  REVISION: {
    label: 'Requiere revisión',
    shortLabel: 'REVISAR',
    choiceLabel: 'Atención',
    choiceDescription: 'Requiere atención antes de decidir',
    tone: 'pending',
    summaryTone: 'warning',
  },
  NO_PRIORITARIA: {
    label: 'Cartera no prioritaria',
    shortLabel: 'NO PRIORITARIA',
    choiceLabel: 'No interesa',
    choiceDescription: 'No nos interesa esta cartera',
    tone: 'error',
    summaryTone: 'negative',
  },
};

export const OPCIONES_SEMAFORO_FINANCIERA: readonly SemanticChoiceOption[] = [
  {
    value: 'OBJETIVO',
    label: CLASIFICACIONES_FINANCIERA.OBJETIVO.choiceLabel,
    description: CLASIFICACIONES_FINANCIERA.OBJETIVO.choiceDescription,
    symbol: '✓',
    tone: 'positive',
  },
  {
    value: 'REVISION',
    label: CLASIFICACIONES_FINANCIERA.REVISION.choiceLabel,
    description: CLASIFICACIONES_FINANCIERA.REVISION.choiceDescription,
    symbol: '!',
    tone: 'warning',
  },
  {
    value: 'NO_PRIORITARIA',
    label: CLASIFICACIONES_FINANCIERA.NO_PRIORITARIA.choiceLabel,
    description: CLASIFICACIONES_FINANCIERA.NO_PRIORITARIA.choiceDescription,
    symbol: '×',
    tone: 'negative',
  },
];

export const FINANCIERAS_COMPETIDORAS_INICIALES = [
  'Banco BanFeliz',
  'Came',
  'Compartamos Banco',
  'Credi Ok',
  'Crediclub',
  'CrediMujer',
  'Crédito Sí (Afirme)',
  'Exitus Contigo',
  'Mi Tandita',
  'Seamos Socios',
  'Solidar',
  'Todo Fácil',
  'Tuiio (Santander)',
] as const;

export const OTRA_FINANCIERA_OPTION = 'Otra';

export const OPCIONES_CLASIFICACION_FINANCIERA = Object.values(
  CLASIFICACIONES_FINANCIERA,
).map(({ label }) => label);

export const clasificacionDesdeEtiqueta = (
  label: string,
): ClasificacionFinanciera | null => (
  (Object.entries(CLASIFICACIONES_FINANCIERA).find(
    ([, presentation]) => presentation.label === label,
  )?.[0] as ClasificacionFinanciera | undefined) ?? null
);

export const normalizarNombreFinanciera = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toUpperCase();

export const financieraApareceEnPopup = (financiera: {
  catalogo_base: boolean;
  vigente: { activa: boolean } | null;
}): boolean => financiera.vigente?.activa ?? financiera.catalogo_base;

export const construirOpcionesFinancierasCreditoGrupal = (
  catalogo: readonly { nombre: string; alias_captura?: string | null }[],
  catalogoDisponible: boolean,
  seleccionActual = '',
): string[] => {
  const opciones = new Map<string, string>();
  const agregar = (nombre: string) => {
    if (nombre === OTRA_FINANCIERA_OPTION) return;
    const normalizado = normalizarNombreFinanciera(nombre);
    if (normalizado && !opciones.has(normalizado)) opciones.set(normalizado, nombre);
  };

  const fuente = catalogoDisponible
    ? catalogo.map(({ nombre, alias_captura }) => alias_captura?.trim() || nombre)
    : FINANCIERAS_COMPETIDORAS_INICIALES;
  fuente.forEach(agregar);
  if (seleccionActual.trim()) agregar(seleccionActual);

  return [
    ...[...opciones.values()].sort((a, b) => a.localeCompare(b, 'es')),
    OTRA_FINANCIERA_OPTION,
  ];
};
