export interface ParametroConclusionesSemanaCredito {
  id: number;
  audit_id: string;
  verde_desde: number;
  verde_hasta: number;
  amarillo_desde: number;
  amarillo_hasta: number;
  rojo_desde: number;
  rojo_hasta: number;
  updated_at: string;
}

export type ParametroConclusionesCiclosCredito = ParametroConclusionesSemanaCredito;
export type ParametroConclusionesToleranciaSemanaDesembolso = ParametroConclusionesSemanaCredito;
export type ParametroConclusionesConcordanciaFicha = ParametroConclusionesSemanaCredito;
export type ParametroConclusionesConcordanciaPrestamo = ParametroConclusionesSemanaCredito;
export type ParametroConclusionesPromedioEvidencias = ParametroConclusionesSemanaCredito;
