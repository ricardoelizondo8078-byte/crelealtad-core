import type { CreditHistoryExtreme } from '../../components/ui';
import type {
  IntegranteData,
  TelefonoLlamadaDisponible,
  TipoDocumentoConsulta,
  TipoDocumentoRevision,
} from './verificacion-individual.types';
import { TIPOS_DOCUMENTO_REVISION } from './verificacion-individual.types';

export const CREDIT_HISTORY_VISUAL_PREVIEW: NonNullable<IntegranteData['historialCrediticioInterno']> = {
  totalCycles: 5,
  maximum: {
    authorizedAmount: 32000,
    cycleNumbers: [7],
  },
  minimum: {
    authorizedAmount: 18000,
    cycleNumbers: [3],
  },
  recentCycles: [
    { cycleNumber: 7, authorizedAmount: 32000 },
    { cycleNumber: 6, authorizedAmount: 28000 },
    { cycleNumber: 5, authorizedAmount: 25000 },
    { cycleNumber: 4, authorizedAmount: 22000 },
    { cycleNumber: 3, authorizedAmount: 18000 },
  ],
};

const recordFromUnknown = (value: unknown): Record<string, unknown> | null => (
  value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const positiveNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const cycleNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};

const mapCreditHistoryExtreme = (value: unknown): CreditHistoryExtreme | null => {
  const record = recordFromUnknown(value);
  const authorizedAmount = positiveNumber(record?.monto_autorizado);
  if (authorizedAmount == null) return null;

  const cycleNumbers = Array.isArray(record?.ciclos)
    ? record.ciclos.flatMap((item) => {
      const parsed = cycleNumber(item);
      return parsed == null ? [] : [parsed];
    })
    : [];

  return { authorizedAmount, cycleNumbers };
};

export const mapCreditHistory = (
  value: unknown,
): IntegranteData['historialCrediticioInterno'] => {
  const record = recordFromUnknown(value);
  if (!record) return null;

  const maximum = mapCreditHistoryExtreme(record.monto_maximo);
  const minimum = mapCreditHistoryExtreme(record.monto_minimo);
  const totalCycles = Number(record.total_ciclos);
  const recentCycles = Array.isArray(record.ultimos_ciclos)
    ? record.ultimos_ciclos.flatMap((item) => {
      const cycle = recordFromUnknown(item);
      const authorizedAmount = positiveNumber(cycle?.monto_autorizado);
      if (authorizedAmount == null) return [];
      return [{
        cycleNumber: cycleNumber(cycle?.ciclo_numero),
        authorizedAmount,
      }];
    })
    : [];

  if (!maximum || !minimum || !Number.isInteger(totalCycles) || totalCycles <= 0 || recentCycles.length === 0) {
    return null;
  }

  return {
    totalCycles,
    maximum,
    minimum,
    recentCycles,
  };
};

export const obtenerTelefonosLlamadaDisponibles = (
  integrante: IntegranteData | null,
): TelefonoLlamadaDisponible[] => {
  if (!integrante) return [];

  const candidatos: TelefonoLlamadaDisponible[] = [
    {
      tipo: 'PRINCIPAL',
      etiqueta: 'Principal',
      numero: integrante.telefono ?? '',
    },
    {
      tipo: 'SECUNDARIO',
      etiqueta: 'Secundario',
      numero: integrante.telefonoSecundario ?? '',
    },
  ];
  const numerosAgregados = new Set<string>();

  return candidatos.filter(({ numero }) => {
    const numeroNormalizado = numero.replace(/\D/g, '');
    if (numeroNormalizado.length !== 10 || numerosAgregados.has(numeroNormalizado)) {
      return false;
    }

    numerosAgregados.add(numeroNormalizado);
    return true;
  });
};

export const esTipoDocumentoRevision = (
  tipo: TipoDocumentoConsulta,
): tipo is TipoDocumentoRevision => (
  (TIPOS_DOCUMENTO_REVISION as readonly string[]).includes(tipo)
);

export const TIPO_DOCUMENTO_POR_CLAVE: Record<string, TipoDocumentoRevision> = {
  ine_integrante: 'ine',
  comprobante_domicilio: 'comprobante',
  solicitud_firmada: 'solicitud_firmada',
};
