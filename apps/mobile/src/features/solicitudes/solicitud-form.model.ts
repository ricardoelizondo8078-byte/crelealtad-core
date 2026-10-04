import { formatCurrency } from '../../utils/currency';

export type SelectValue = string;

export type SelectorFieldKey =
  | 'nacionalidad'
  | 'estado_nacimiento'
  | 'genero'
  | 'estado_civil'
  | 'nivel_estudio'
  | 'colonia'
  | 'municipio'
  | 'negocio_colonia'
  | 'negocio_municipio'
  | 'negocioDesdeCuando'
  | 'referencia1Parentesco'
  | 'referencia2Parentesco'
  | 'beneficiario_parentesco'
  | 'tieneMedidorLuzSinAdeudo'
  | 'viveMaximo5KmTesorera';

export interface SolicitudErrors {
  [key: string]: string | undefined;
}

export type MontoReferencia = {
  origen: 'CICLO_ANTERIOR' | 'PROSPECCION';
  monto: number | null;
};

export type ComparacionMontoPaso6 = {
  tendencia: 'AUMENTA' | 'DISMINUYE';
  diferencia: number;
} | null;

export const getMontoSolicitadoError = (
  value: string,
  montoMaximo: number,
  required = true,
): string | undefined => {
  if (!value.trim()) {
    return required ? 'Campo obligatorio' : undefined;
  }

  const monto = Number(value);
  if (!Number.isFinite(monto) || monto <= 0) {
    return 'Captura un monto mayor a $0';
  }
  if (monto > montoMaximo) {
    return `El monto máximo permitido es ${formatCurrency(montoMaximo)}`;
  }

  return undefined;
};

export const yesNoOptions = ['SI', 'NO'] as const;

export const normalizeCurpInput = (value: string): string => (
  value.replace(/\s+/g, '').toUpperCase().slice(0, 18)
);

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'INFORMACIÓN PERSONAL',
    shortTitle: 'Info Personal',
  },
  {
    id: 2,
    title: 'DOMICILIO PARTICULAR',
    shortTitle: 'Domicilio',
  },
  {
    id: 3,
    title: 'REFERENCIAS',
    shortTitle: 'Referencias',
  },
  {
    id: 4,
    title: 'NEGOCIO O TRABAJO',
    shortTitle: 'Negocio',
  },
  {
    id: 5,
    title: 'BENEFICIARIO',
    shortTitle: 'Beneficiario',
  },
  {
    id: 6,
    title: 'VALIDACIONES Y MONTO',
    shortTitle: 'Validaciones',
  },
  {
    id: 7,
    title: 'DOCUMENTACIÓN',
    shortTitle: 'Documentación',
  },
] as const;
