import type {
  ParametroConclusionesCiclosCredito,
  ParametroConclusionesConcordanciaFicha,
  ParametroConclusionesConcordanciaPrestamo,
  ParametroConclusionesPromedioEvidencias,
  ParametroConclusionesSemanaCredito,
  ParametroConclusionesToleranciaSemanaDesembolso,
  RangoCiclosCreditoEditable,
  RangoConcordanciaFichaEditable,
  RangoConcordanciaPrestamoEditable,
  RangoPromedioEvidenciasEditable,
  RangoSemanaCreditoEditable,
  RangoToleranciaSemanaDesembolsoEditable,
} from './parametros-conclusiones.api';

export const RANGO_SEMANA_CREDITO_INICIAL: RangoSemanaCreditoEditable = {
  verde_desde: 1,
  verde_hasta: 10,
  amarillo_desde: 11,
  amarillo_hasta: 13,
  rojo_desde: 14,
  rojo_hasta: 16,
};

export const RANGO_CICLOS_CREDITO_INICIAL: RangoCiclosCreditoEditable = {
  ...RANGO_SEMANA_CREDITO_INICIAL,
};

export const RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL:
RangoToleranciaSemanaDesembolsoEditable = {
  verde_desde: 0,
  verde_hasta: 0,
  amarillo_desde: 1,
  amarillo_hasta: 3,
  rojo_desde: 4,
  rojo_hasta: 10,
};

export const RANGO_CONCORDANCIA_INICIAL: RangoConcordanciaFichaEditable = {
  verde_desde: 0,
  verde_hasta: 5,
  amarillo_desde: 6,
  amarillo_hasta: 10,
  rojo_desde: 11,
  rojo_hasta: 100,
};

export const RANGO_CONCORDANCIA_PRESTAMO_INICIAL: RangoConcordanciaPrestamoEditable = {
  ...RANGO_CONCORDANCIA_INICIAL,
};

export const RANGO_PROMEDIO_EVIDENCIAS_INICIAL: RangoPromedioEvidenciasEditable = {
  verde_desde: 67,
  verde_hasta: 100,
  amarillo_desde: 34,
  amarillo_hasta: 66,
  rojo_desde: 0,
  rojo_hasta: 33,
};

const esRangoCreditoValido = (
  rango: RangoSemanaCreditoEditable,
  minimo: number,
  maximo: number,
): boolean => {
  const rangos = [
    [rango.verde_desde, rango.verde_hasta],
    [rango.amarillo_desde, rango.amarillo_hasta],
    [rango.rojo_desde, rango.rojo_hasta],
  ];
  const limitesValidos = rangos.every(([desde, hasta]) => (
    Number.isInteger(desde)
    && Number.isInteger(hasta)
    && desde >= minimo
    && hasta <= maximo
    && desde <= hasta
  ));
  if (!limitesValidos) return false;

  return rangos.every(([desde, hasta], index) => rangos.slice(index + 1).every(
    ([otroDesde, otroHasta]) => hasta < otroDesde || otroHasta < desde,
  ));
};

export const esRangoSemanaCreditoValido = (
  rango: RangoSemanaCreditoEditable,
): boolean => esRangoCreditoValido(rango, 1, 16);

export const esRangoCiclosCreditoValido = (
  rango: RangoCiclosCreditoEditable,
): boolean => esRangoCreditoValido(rango, 1, 40);

export const esRangoToleranciaSemanaDesembolsoValido = (
  rango: RangoToleranciaSemanaDesembolsoEditable,
): boolean => esRangoCreditoValido(rango, 0, 10);

export const esRangoConcordanciaValido = (
  rango: RangoConcordanciaFichaEditable | RangoConcordanciaPrestamoEditable,
): boolean => esRangoCreditoValido(rango, 0, 100);

export const esRangoPromedioEvidenciasValido = (
  rango: RangoPromedioEvidenciasEditable,
): boolean => esRangoCreditoValido(rango, 0, 100);

export type TonoSemanaCredito = 'positive' | 'warning' | 'negative';

export const obtenerTonoSemanaCredito = (
  semana: number,
  parametro: ParametroConclusionesSemanaCredito | null,
): TonoSemanaCredito | undefined => {
  if (!parametro || !Number.isInteger(semana) || semana < 1 || semana > 16) return undefined;
  if (semana >= parametro.verde_desde && semana <= parametro.verde_hasta) return 'positive';
  if (semana >= parametro.amarillo_desde && semana <= parametro.amarillo_hasta) return 'warning';
  if (semana >= parametro.rojo_desde && semana <= parametro.rojo_hasta) return 'negative';
  return undefined;
};

export const obtenerTonoCiclosCredito = (
  ciclos: number,
  parametro: ParametroConclusionesCiclosCredito | null,
): TonoSemanaCredito | undefined => {
  if (!parametro || !Number.isInteger(ciclos) || ciclos < 1 || ciclos > 40) return undefined;
  if (ciclos >= parametro.verde_desde && ciclos <= parametro.verde_hasta) return 'positive';
  if (ciclos >= parametro.amarillo_desde && ciclos <= parametro.amarillo_hasta) return 'warning';
  if (ciclos >= parametro.rojo_desde && ciclos <= parametro.rojo_hasta) return 'negative';
  return undefined;
};

export const obtenerTonoToleranciaSemanaDesembolso = (
  tolerancia: number,
  parametro: ParametroConclusionesToleranciaSemanaDesembolso | null,
): TonoSemanaCredito | undefined => {
  if (!parametro || !Number.isInteger(tolerancia) || tolerancia < 0 || tolerancia > 10) {
    return undefined;
  }
  if (tolerancia >= parametro.verde_desde && tolerancia <= parametro.verde_hasta) return 'positive';
  if (
    tolerancia >= parametro.amarillo_desde
    && tolerancia <= parametro.amarillo_hasta
  ) return 'warning';
  if (tolerancia >= parametro.rojo_desde && tolerancia <= parametro.rojo_hasta) return 'negative';
  return undefined;
};

export const calcularToleranciaSemanaDesembolso = (
  semanaActual: number,
  limiteA: number,
  limiteB: number,
): number | null => {
  if (![semanaActual, limiteA, limiteB].every(Number.isInteger)) return null;
  const desde = Math.min(limiteA, limiteB);
  const hasta = Math.max(limiteA, limiteB);
  if (semanaActual >= desde && semanaActual <= hasta) return 0;
  const distancia = semanaActual < desde
    ? desde - semanaActual
    : semanaActual - hasta;
  return Math.min(10, distancia);
};

export const calcularPorcentajeDiferencia = (
  declarado: number,
  calculado: number,
): number | null => {
  if (![declarado, calculado].every(Number.isFinite) || declarado <= 0 || calculado <= 0) {
    return null;
  }
  return Math.min(100, Math.round((Math.abs(declarado - calculado) / declarado) * 100));
};

export const obtenerTonoConcordancia = (
  porcentajeDiferencia: number,
  parametro:
    | ParametroConclusionesConcordanciaFicha
    | ParametroConclusionesConcordanciaPrestamo
    | null,
): TonoSemanaCredito | undefined => {
  if (!parametro || !Number.isInteger(porcentajeDiferencia)
    || porcentajeDiferencia < 0 || porcentajeDiferencia > 100) return undefined;
  if (porcentajeDiferencia >= parametro.verde_desde
    && porcentajeDiferencia <= parametro.verde_hasta) return 'positive';
  if (porcentajeDiferencia >= parametro.amarillo_desde
    && porcentajeDiferencia <= parametro.amarillo_hasta) return 'warning';
  if (porcentajeDiferencia >= parametro.rojo_desde
    && porcentajeDiferencia <= parametro.rojo_hasta) return 'negative';
  return undefined;
};

export const obtenerTonoPromedioEvidencias = (
  promedio: number,
  parametro: ParametroConclusionesPromedioEvidencias | null,
): TonoSemanaCredito | undefined => obtenerTonoConcordancia(promedio, parametro);
