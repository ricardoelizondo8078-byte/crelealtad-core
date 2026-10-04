export const FINANCIERAS_CREDITO_GRUPAL_NUEVO_LEON = [
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
  'Otra',
];

export const SEMANAS_CREDITO_GRUPAL = Array.from(
  { length: 16 },
  (_, index) => String(index + 1),
);

export const MESES_CREDITO_GRUPAL = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ANIOS_CREDITO_GRUPAL = Array.from(
  { length: 101 },
  (_, index) => String(new Date().getFullYear() - index),
);

const MILISEGUNDOS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;

export const calcularSemanasTranscurridasDesdeMes = (
  mes: string,
  anio: string,
  fechaActual = new Date(),
): number | null => {
  const indiceMes = MESES_CREDITO_GRUPAL.indexOf(mes);
  const anioNumerico = Number(anio);

  if (indiceMes < 0 || !Number.isInteger(anioNumerico)) {
    return null;
  }

  const inicioMesSeleccionadoUtc = Date.UTC(anioNumerico, indiceMes, 1);
  const fechaActualUtc = Date.UTC(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    fechaActual.getDate(),
  );

  return Math.max(
    0,
    Math.floor((fechaActualUtc - inicioMesSeleccionadoUtc) / MILISEGUNDOS_POR_SEMANA),
  );
};

export const CICLOS_CREDITO_GRUPAL = Array.from(
  { length: 40 },
  (_, index) => String(index + 1),
);

export const TASAS_CREDITO_GRUPAL = Array.from(
  { length: 36 },
  (_, index) => String(index + 65),
);

export const FAMILIARES_DOMICILIO = [
  'Papás',
  'Hijos',
  'Abuelos',
  'Otro familiar',
];

export const MOTIVOS_DESACUERDO_MONTOS = [
  'Considera que los montos son muy altos',
  'Duda de la capacidad de pago',
  'No conoce bien a alguna integrante',
  'Ha tenido problemas previos con alguna integrante',
  'No conoce para qué usarán el crédito',
  'Otro motivo',
];

export const MOTIVOS_NO_RENOVACION = [
  'Terminó de pagar y ya no necesitó otro crédito',
  'No estuvo de acuerdo con la tasa o los costos',
  'El monto ofrecido no le convenía',
  'Tuvo problemas con la asesora',
  'Tuvo problemas con el grupo',
  'No pudo seguir pagando',
  'La financiera no le renovó',
  'Cambió a otra financiera',
  'Otro motivo',
];

export const MOTIVOS_SIN_CONTROL_PAGOS = [
  'Lo extravió',
  'Se dañó',
  'Lo conserva otra integrante',
  'Lo tiene la asesora',
  'Nunca se lo entregaron',
  'No sabe dónde está',
  'Otro motivo',
];

export const MOTIVOS_RECOMENDACION_SI = [
  'Buen trato de la asesora',
  'Crédito entregado a tiempo',
  'Pagos y condiciones claras',
  'Monto adecuado',
  'Facilidad del proceso',
  'Confianza en CRELEALTAD',
  'Otro motivo',
];

export const MOTIVOS_RECOMENDACION_NO = [
  'Mala atención',
  'Demora en el desembolso',
  'Información poco clara',
  'Monto insuficiente',
  'Pagos o condiciones no le convenían',
  'Problemas con el grupo',
  'Otro motivo',
];

export const MOTIVOS_NO_VIVE_EN_DOMICILIO = [
  'Se mudó a otro domicilio',
  'Vive temporalmente en otro lugar',
  'Sólo recibe correspondencia aquí',
  'El domicilio es de un familiar',
  'El domicilio fue proporcionado por error',
  'No quiso informar dónde vive',
  'Otro motivo',
];

export const NO_CONOCE_TESORERA_VALUE = 'NO_CONOCE_A_LA_TESORERA';
export const NO_CONOCE_TESORERA_LABEL = 'NO CONOZCO A LA TESORERA';
export const NO_SABE_DOMICILIO_RECOLECCION_VALUE = 'NO_SABE_DOMICILIO_RECOLECCION';
export const NO_SABE_DOMICILIO_RECOLECCION_LABEL = 'NO SÉ DÓNDE SE RECOLECTARÁ';

export const formatPorcentajeMontoGrupal = (
  montoSolicitado: number | null,
  montoTotalGrupo: number | null,
): string => {
  if (
    montoSolicitado == null
    || !Number.isFinite(montoSolicitado)
    || montoSolicitado <= 0
    || montoTotalGrupo == null
    || !Number.isFinite(montoTotalGrupo)
    || montoTotalGrupo <= 0
  ) {
    return 'N/D';
  }

  return `${((montoSolicitado / montoTotalGrupo) * 100).toFixed(1)}%`;
};
