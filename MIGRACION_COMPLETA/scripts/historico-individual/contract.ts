export type RejectionReason =
  | 'CICLO_AMBIGUO'
  | 'SIN_FUENTE'
  | 'PERSONA_O_MONTO_NO_RESUELTO'
  | 'INTEGRANTE_DUPLICADA'
  | 'CONTEO_DIFERENTE'
  | 'SUMA_DIFERENTE';

export interface HistoricalCycleInput {
  id: string;
  grupo_id: string;
  numero_ciclo: number;
  numero_integrantes: number | null;
  prestamo: string | number | null;
  key_count: number;
}

export interface HistoricalMember {
  persona_id: string;
  monto_autorizado: number;
  fila_origen: number;
}

export interface HistoricalCandidate {
  ciclo: HistoricalCycleInput;
  integrantes: HistoricalMember[];
}

export interface ContractResult {
  elegibles: HistoricalCandidate[];
  rechazados: Array<{ ciclo_id: string; grupo_id: string; motivo: RejectionReason }>;
  resumen_rechazos: Record<RejectionReason, number>;
}

const REASONS: RejectionReason[] = [
  'CICLO_AMBIGUO',
  'SIN_FUENTE',
  'PERSONA_O_MONTO_NO_RESUELTO',
  'INTEGRANTE_DUPLICADA',
  'CONTEO_DIFERENTE',
  'SUMA_DIFERENTE',
];

function normalize(value: unknown): string {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function amountToCents(value: unknown): number | null {
  const parsed = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}

function trimmedRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value]));
}

export function buildHistoricalIndividualContract(
  rawRows: Array<Record<string, unknown>>,
  groupMap: Record<string, string>,
  personMap: Record<string, string>,
  cycles: HistoricalCycleInput[],
): ContractResult {
  const buckets = new Map<string, Array<{ persona_id?: string; monto_centavos: number | null; fila: number }>>();

  rawRows.forEach((original, index) => {
    const row = trimmedRow(original);
    const grupoId = groupMap[normalize(row.GRUPO)];
    const ciclo = Number(row.CICLO);
    if (!grupoId || !Number.isInteger(ciclo) || ciclo < 1) return;
    const key = `${grupoId}|${ciclo}`;
    const current = buckets.get(key) ?? [];
    current.push({
      persona_id: personMap[normalize(row.CURP)],
      monto_centavos: amountToCents(row.MONTO),
      fila: index + 2,
    });
    buckets.set(key, current);
  });

  const resumen = Object.fromEntries(REASONS.map((reason) => [reason, 0])) as Record<RejectionReason, number>;
  const elegibles: HistoricalCandidate[] = [];
  const rechazados: ContractResult['rechazados'] = [];

  const reject = (cycle: HistoricalCycleInput, motivo: RejectionReason) => {
    resumen[motivo] += 1;
    rechazados.push({ ciclo_id: cycle.id, grupo_id: cycle.grupo_id, motivo });
  };

  for (const cycle of cycles) {
    if (Number(cycle.key_count) !== 1) {
      reject(cycle, 'CICLO_AMBIGUO');
      continue;
    }

    const rows = buckets.get(`${cycle.grupo_id}|${cycle.numero_ciclo}`) ?? [];
    if (rows.length === 0) {
      reject(cycle, 'SIN_FUENTE');
      continue;
    }
    if (rows.some((row) => !row.persona_id || row.monto_centavos == null)) {
      reject(cycle, 'PERSONA_O_MONTO_NO_RESUELTO');
      continue;
    }

    const uniquePeople = new Set(rows.map((row) => row.persona_id));
    if (uniquePeople.size !== rows.length) {
      reject(cycle, 'INTEGRANTE_DUPLICADA');
      continue;
    }
    if (cycle.numero_integrantes == null || rows.length !== Number(cycle.numero_integrantes)) {
      reject(cycle, 'CONTEO_DIFERENTE');
      continue;
    }

    const totalCents = rows.reduce((sum, row) => sum + (row.monto_centavos ?? 0), 0);
    const loanCents = amountToCents(cycle.prestamo);
    if (loanCents == null || totalCents !== loanCents) {
      reject(cycle, 'SUMA_DIFERENTE');
      continue;
    }

    elegibles.push({
      ciclo: cycle,
      integrantes: rows.map((row) => ({
        persona_id: row.persona_id as string,
        monto_autorizado: (row.monto_centavos as number) / 100,
        fila_origen: row.fila,
      })),
    });
  }

  return { elegibles, rechazados, resumen_rechazos: resumen };
}
