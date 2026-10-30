import { api } from '../../services/api-client';

export interface ParametroConclusionesSemanaCredito {
  id: number;
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

export type RangoSemanaCreditoEditable = Omit<
  ParametroConclusionesSemanaCredito,
  'id' | 'updated_at'
>;

export type RangoCiclosCreditoEditable = RangoSemanaCreditoEditable;
export type RangoToleranciaSemanaDesembolsoEditable = RangoSemanaCreditoEditable;
export type RangoConcordanciaFichaEditable = RangoSemanaCreditoEditable;
export type RangoConcordanciaPrestamoEditable = RangoSemanaCreditoEditable;
export type RangoPromedioEvidenciasEditable = RangoSemanaCreditoEditable;

export const obtenerParametroSemanaCredito = () => api.get<{
  parametro: ParametroConclusionesSemanaCredito;
}>(
  `/parametros/verificacion/conclusiones/calificacion-semana-credito?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroSemanaCredito = (
  rango: RangoSemanaCreditoEditable,
) => api.put<{ parametro: ParametroConclusionesSemanaCredito }>(
  '/parametros/verificacion/conclusiones/calificacion-semana-credito',
  rango,
);

export const obtenerCalificacionSemanaCreditoVerificacion = () => api.get<{
  parametro: ParametroConclusionesSemanaCredito;
}>('/verificacion/parametros/conclusiones/calificacion-semana-credito', {
  showProcessing: false,
});

export const obtenerParametroCiclosCredito = () => api.get<{
  parametro: ParametroConclusionesCiclosCredito;
}>(
  `/parametros/verificacion/conclusiones/calificacion-ciclos-credito?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroCiclosCredito = (
  rango: RangoCiclosCreditoEditable,
) => api.put<{ parametro: ParametroConclusionesCiclosCredito }>(
  '/parametros/verificacion/conclusiones/calificacion-ciclos-credito',
  rango,
);

export const obtenerCalificacionCiclosCreditoVerificacion = () => api.get<{
  parametro: ParametroConclusionesCiclosCredito;
}>('/verificacion/parametros/conclusiones/calificacion-ciclos-credito', {
  showProcessing: false,
});

export const obtenerParametroToleranciaSemanaDesembolso = () => api.get<{
  parametro: ParametroConclusionesToleranciaSemanaDesembolso;
}>(
  `/parametros/verificacion/conclusiones/tolerancia-semana-desembolso?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroToleranciaSemanaDesembolso = (
  rango: RangoToleranciaSemanaDesembolsoEditable,
) => api.put<{ parametro: ParametroConclusionesToleranciaSemanaDesembolso }>(
  '/parametros/verificacion/conclusiones/tolerancia-semana-desembolso',
  rango,
);

export const obtenerToleranciaSemanaDesembolsoVerificacion = () => api.get<{
  parametro: ParametroConclusionesToleranciaSemanaDesembolso;
}>('/verificacion/parametros/conclusiones/tolerancia-semana-desembolso', {
  showProcessing: false,
});

export const obtenerParametroConcordanciaFicha = () => api.get<{
  parametro: ParametroConclusionesConcordanciaFicha;
}>(
  `/parametros/verificacion/conclusiones/concordancia-ficha?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroConcordanciaFicha = (
  rango: RangoConcordanciaFichaEditable,
) => api.put<{ parametro: ParametroConclusionesConcordanciaFicha }>(
  '/parametros/verificacion/conclusiones/concordancia-ficha',
  rango,
);

export const obtenerConcordanciaFichaVerificacion = () => api.get<{
  parametro: ParametroConclusionesConcordanciaFicha;
}>('/verificacion/parametros/conclusiones/concordancia-ficha', {
  showProcessing: false,
});

export const obtenerParametroConcordanciaPrestamo = () => api.get<{
  parametro: ParametroConclusionesConcordanciaPrestamo;
}>(
  `/parametros/verificacion/conclusiones/concordancia-prestamo?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroConcordanciaPrestamo = (
  rango: RangoConcordanciaPrestamoEditable,
) => api.put<{ parametro: ParametroConclusionesConcordanciaPrestamo }>(
  '/parametros/verificacion/conclusiones/concordancia-prestamo',
  rango,
);

export const obtenerConcordanciaPrestamoVerificacion = () => api.get<{
  parametro: ParametroConclusionesConcordanciaPrestamo;
}>('/verificacion/parametros/conclusiones/concordancia-prestamo', {
  showProcessing: false,
});

export const obtenerParametroPromedioEvidencias = () => api.get<{
  parametro: ParametroConclusionesPromedioEvidencias;
}>(
  `/parametros/verificacion/conclusiones/calificacion-promedio-evidencias?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const actualizarParametroPromedioEvidencias = (
  rango: RangoPromedioEvidenciasEditable,
) => api.put<{ parametro: ParametroConclusionesPromedioEvidencias }>(
  '/parametros/verificacion/conclusiones/calificacion-promedio-evidencias',
  rango,
);

export const obtenerPromedioEvidenciasVerificacion = () => api.get<{
  parametro: ParametroConclusionesPromedioEvidencias;
}>('/verificacion/parametros/conclusiones/calificacion-promedio-evidencias', {
  showProcessing: false,
});
