import type { SemanticChoiceOption } from '../../components/ui';
import { colors } from '../../theme/tokens';
import type { ClasificacionSemaforoEvidencia } from './verificacion-entrevista.api';

export interface PresentacionClasificacionEvidencia {
  label: string;
  color: string;
  tone: SemanticChoiceOption['tone'];
}

export const CLASIFICACIONES_SEMAFORO_EVIDENCIA: Record<
  ClasificacionSemaforoEvidencia,
  PresentacionClasificacionEvidencia
> = {
  VERDE: {
    label: 'VERDE',
    color: colors.success,
    tone: 'positive',
  },
  AMARILLO: {
    label: 'AMARILLO',
    color: colors.warning,
    tone: 'warning',
  },
  ROJO: {
    label: 'ROJO',
    color: colors.danger,
    tone: 'negative',
  },
};

export const OPCIONES_SEMAFORO_EVIDENCIA: readonly SemanticChoiceOption[] = (
  Object.entries(CLASIFICACIONES_SEMAFORO_EVIDENCIA) as [
    ClasificacionSemaforoEvidencia,
    PresentacionClasificacionEvidencia,
  ][]
).map(([value, presentation]) => ({
  value,
  label: presentation.label,
  description: `Mostrar esta fotografía con marco ${presentation.label.toLocaleLowerCase('es-MX')}`,
  symbol: '✓',
  tone: presentation.tone,
}));

export const obtenerPresentacionClasificacionEvidencia = (
  clasificacion: ClasificacionSemaforoEvidencia | null | undefined,
): PresentacionClasificacionEvidencia | null => (
  clasificacion ? CLASIFICACIONES_SEMAFORO_EVIDENCIA[clasificacion] : null
);
