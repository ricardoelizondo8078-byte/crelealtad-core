import { EntrevistaGuardada, EntrevistaPayload } from './verificacion-entrevista.api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COMO_CONOCIO_ASESORA: Record<string, string> = {
  'Por otra integrante': 'OTRA_INTEGRANTE',
  'En otra financiera': 'OTRA_FINANCIERA',
  'A través de Facebook': 'FACEBOOK',
  Otro: 'OTRO',
};
const ANTIGUEDAD: Record<string, string> = {
  '0-1 años': '0_A_1',
  '1-3 años': '1_A_3',
  '3+ años': 'MAS_DE_3',
};
const TIPO_DOMICILIO: Record<string, string> = {
  Renta: 'RENTA',
  Dueña: 'PROPIA',
  Familiar: 'FAMILIAR',
};
const FAMILIAR_DOMICILIO: Record<string, string> = {
  Papás: 'PAPAS',
  Hijos: 'HIJOS',
  Abuelos: 'ABUELOS',
  'Otro familiar': 'OTRO_FAMILIAR',
};
const PERSONAS_CASA: Record<string, string> = { '≥6': '6_O_MAS' };
const CONVIVIENTES: Record<string, string> = {
  Conyuge: 'CONYUGE',
  Hijos: 'HIJOS',
  Padres: 'PADRES',
  Hermanos: 'HERMANOS',
  Otros: 'OTROS',
};
const FUENTES_INGRESO: Record<string, string> = { Sueldo: 'SUELDO', Negocio: 'NEGOCIO' };
const ANTIGUEDAD_LABORAL: Record<string, string> = {
  '1 año': '1_ANIO',
  '2 años': '2_ANIOS',
  '3 a 5 años': '3_A_5_ANIOS',
  '≥ 5 años': '5_O_MAS',
};
const FRECUENCIA: Record<string, string> = {
  Siempre: 'SIEMPRE',
  'A veces': 'A_VECES',
  Nunca: 'NUNCA',
};
const CALIFICACION: Record<string, string> = {
  Excelente: 'EXCELENTE',
  Bueno: 'BUENO',
  Regular: 'REGULAR',
  Malo: 'MALO',
};
const RAPIDEZ: Record<string, string> = {
  'Muy rápido': 'MUY_RAPIDO',
  Rápido: 'RAPIDO',
  Lento: 'LENTO',
  'Muy lento': 'MUY_LENTO',
};

const invertir = (mapa: Record<string, string>): Record<string, string> => (
  Object.fromEntries(Object.entries(mapa).map(([etiqueta, codigo]) => [codigo, etiqueta]))
);

const booleano = (valor: string): boolean | null => {
  if (valor === 'Sí' || valor === 'Si') return true;
  if (valor === 'No') return false;
  return null;
};
const etiquetaBooleano = (valor: boolean | null, acento = true): string => (
  valor == null ? '' : valor ? (acento ? 'Sí' : 'Si') : 'No'
);
const texto = (valor: string): string | null => valor.trim() || null;
const entero = (valor: string): number | null => {
  if (!valor.trim()) return null;
  const numero = Number(valor.replace(/\D/g, ''));
  return Number.isInteger(numero) ? numero : null;
};
const importe = (valor: string): number | null => {
  if (!valor.trim()) return null;
  const numero = Number(valor.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numero) ? numero : null;
};
const etiquetaImporte = (valor: number | null): string => (
  valor == null ? '' : String(valor)
);
const codigo = (mapa: Record<string, string>, valor: string): string | null => (
  valor ? mapa[valor] ?? null : null
);
const etiqueta = (mapa: Record<string, string>, valor: string | null): string => (
  valor ? invertir(mapa)[valor] ?? '' : ''
);

export interface EntrevistaFormState {
  conoceAsesora: string;
  comoConocioAsesora: string;
  conoceIntegrantes: string;
  tiempoConoceIntegrantes: string;
  sabeMontosCompaneras: string;
  acuerdoMontos: string;
  companerasMontoNoAcordadoIds: string[];
  motivosDesacuerdoMontosPorIntegrante: Record<string, string>;
  conoceTesoreraDelGrupo: string;
  quienEsTesorera: string;
  domicilioRecoleccion: string;
  tieneFamiliarGrupo: string;
  familiaresGrupoIds: string[];
  tieneOtroCreditoGrupal: string;
  financieraCreditoGrupal: string;
  creditoGrupalAnteriorActivo: string;
  valorFichaCreditoGrupal: string;
  semanaActualCreditoGrupal: string;
  mesDesembolsoCreditoGrupal: string;
  mesUltimoPagoCreditoGrupal: string;
  anioUltimoPagoCreditoGrupal: string;
  numeroCiclosCreditoGrupal: string;
  tasaCreditoGrupal: string;
  nombreAsesoraCreditoGrupal: string;
  telefonoAsesoraCreditoGrupal: string;
  motivoNoRenovacionCreditoGrupal: string;
  viveEnDomicilioDeclarado: string;
  motivoNoViveEnDomicilio: string;
  tipoDomicilio: string;
  familiarDomicilio: string;
  aniosEnDomicilio: string;
  personasVivenCasa: string;
  quienViveConUsted: string[];
  quienesVivenConUstedSabenDelCredito: string;
  tieneOtroIngresoHogar: string;
  otroIngresoSemanal: string;
  capacidadPagoSemanal: string;
  motivoCredito: string;
  fuentesIngresoPersonal: string[];
  ingresosSemanalesDeclarados: string;
  lugarTrabajo: string;
  antiguedadLaboral: string;
  tipoNegocio: string;
  ingresoLibreSemanalNegocio: string;
  ubicacionNegocio: string;
  tieneControlPagos: string;
  motivoSinControl: string;
  asesoraAcudioSemanalmente: string;
  firmabanControlSemanalmente: string;
  tratoAsesoraTesorera: string;
  conocePremioTesorera: string;
  opinionCredito: string;
  tratoDesembolso: string;
  rapidezDesembolso: string;
  informacionCreditoClara: string;
  recomendaria: string;
  razonRecomendacion: string;
  motivoRecomendacion: string;
}

export const crearEntrevistaPayload = (
  state: EntrevistaFormState,
  noSabeDomicilioValue: string,
): EntrevistaPayload => ({
  conoce_asesora: booleano(state.conoceAsesora),
  como_conocio_asesora: codigo(COMO_CONOCIO_ASESORA, state.comoConocioAsesora),
  conoce_integrantes: booleano(state.conoceIntegrantes),
  tiempo_conoce_integrantes: codigo(ANTIGUEDAD, state.tiempoConoceIntegrantes),
  sabe_montos_companeras: booleano(state.sabeMontosCompaneras),
  acuerdo_montos_companeras: booleano(state.acuerdoMontos),
  desacuerdos_montos: state.companerasMontoNoAcordadoIds.flatMap((integranteId) => {
    const motivo = state.motivosDesacuerdoMontosPorIntegrante[integranteId]?.trim();
    return motivo ? [{ integrante_id: integranteId, motivo }] : [];
  }),
  conoce_tesorera: booleano(state.conoceTesoreraDelGrupo),
  tesorera_reconocida_integrante_id: booleano(state.conoceTesoreraDelGrupo) === true
    ? texto(state.quienEsTesorera)
    : null,
  domicilio_recoleccion_integrante_id: state.domicilioRecoleccion
    && state.domicilioRecoleccion !== noSabeDomicilioValue
    ? state.domicilioRecoleccion
    : null,
  desconoce_domicilio_recoleccion: state.domicilioRecoleccion
    ? state.domicilioRecoleccion === noSabeDomicilioValue
    : null,
  tiene_familiares_grupo: booleano(state.tieneFamiliarGrupo),
  familiares_grupo_ids: state.familiaresGrupoIds,
  tiene_otro_credito_grupal: booleano(state.tieneOtroCreditoGrupal),
  financiera_credito_grupal: texto(state.financieraCreditoGrupal),
  credito_grupal_anterior_activo: booleano(state.creditoGrupalAnteriorActivo),
  valor_ficha_credito_grupal: importe(state.valorFichaCreditoGrupal),
  semana_actual_credito_grupal: entero(state.semanaActualCreditoGrupal),
  mes_desembolso_credito_grupal: state.mesDesembolsoCreditoGrupal
    ? MESES.indexOf(state.mesDesembolsoCreditoGrupal) + 1
    : null,
  mes_ultimo_pago_credito_grupal: state.mesUltimoPagoCreditoGrupal
    ? MESES.indexOf(state.mesUltimoPagoCreditoGrupal) + 1
    : null,
  anio_ultimo_pago_credito_grupal: entero(state.anioUltimoPagoCreditoGrupal),
  numero_ciclos_credito_grupal: entero(state.numeroCiclosCreditoGrupal),
  tasa_credito_grupal: entero(state.tasaCreditoGrupal),
  nombre_asesora_credito_grupal: texto(state.nombreAsesoraCreditoGrupal),
  telefono_asesora_credito_grupal: texto(state.telefonoAsesoraCreditoGrupal.replace(/\D/g, '')),
  motivo_no_renovacion_credito_grupal: texto(state.motivoNoRenovacionCreditoGrupal),
  vive_en_domicilio: booleano(state.viveEnDomicilioDeclarado),
  motivo_no_vive_domicilio: texto(state.motivoNoViveEnDomicilio),
  tipo_domicilio: codigo(TIPO_DOMICILIO, state.tipoDomicilio),
  familiar_domicilio: codigo(FAMILIAR_DOMICILIO, state.familiarDomicilio),
  antiguedad_domicilio: codigo(ANTIGUEDAD, state.aniosEnDomicilio),
  personas_viven_casa: state.personasVivenCasa
    ? PERSONAS_CASA[state.personasVivenCasa] ?? state.personasVivenCasa
    : null,
  convivientes: state.quienViveConUsted.flatMap((item) => CONVIVIENTES[item] ? [CONVIVIENTES[item]] : []),
  saben_del_credito: booleano(state.quienesVivenConUstedSabenDelCredito),
  otro_ingreso_hogar: booleano(state.tieneOtroIngresoHogar),
  otro_ingreso_semanal: importe(state.otroIngresoSemanal),
  capacidad_pago_semanal: importe(state.capacidadPagoSemanal),
  uso_credito: texto(state.motivoCredito),
  fuentes_ingreso: state.fuentesIngresoPersonal.flatMap((item) => FUENTES_INGRESO[item] ? [FUENTES_INGRESO[item]] : []),
  sueldo_semanal: importe(state.ingresosSemanalesDeclarados),
  lugar_trabajo: texto(state.lugarTrabajo),
  antiguedad_laboral: codigo(ANTIGUEDAD_LABORAL, state.antiguedadLaboral),
  tipo_negocio: texto(state.tipoNegocio),
  ingreso_libre_semanal_negocio: importe(state.ingresoLibreSemanalNegocio),
  ubicacion_negocio: texto(state.ubicacionNegocio),
  tiene_control_pagos: booleano(state.tieneControlPagos),
  motivo_sin_control_pagos: texto(state.motivoSinControl),
  asesora_acudio_semanalmente: codigo(FRECUENCIA, state.asesoraAcudioSemanalmente),
  firmaban_control_semanalmente: codigo(FRECUENCIA, state.firmabanControlSemanalmente),
  trato_asesora_tesorera: codigo(CALIFICACION, state.tratoAsesoraTesorera),
  conoce_premio_tesorera: booleano(state.conocePremioTesorera),
  opinion_credito: codigo(CALIFICACION, state.opinionCredito),
  trato_desembolso: codigo(CALIFICACION, state.tratoDesembolso),
  rapidez_desembolso: codigo(RAPIDEZ, state.rapidezDesembolso),
  informacion_credito_clara: booleano(state.informacionCreditoClara),
  recomendaria: booleano(state.recomendaria),
  motivo_recomendacion: texto(state.razonRecomendacion),
  oportunidad_mejora: texto(state.motivoRecomendacion),
});

export interface EntrevistaRestaurada extends EntrevistaFormState {}

export const restaurarEntrevista = (
  data: EntrevistaGuardada,
  noSabeDomicilioValue: string,
): EntrevistaRestaurada => ({
  conoceAsesora: etiquetaBooleano(data.conoce_asesora),
  comoConocioAsesora: etiqueta(COMO_CONOCIO_ASESORA, data.como_conocio_asesora),
  conoceIntegrantes: etiquetaBooleano(data.conoce_integrantes, false),
  tiempoConoceIntegrantes: etiqueta(ANTIGUEDAD, data.tiempo_conoce_integrantes),
  sabeMontosCompaneras: etiquetaBooleano(data.sabe_montos_companeras, false),
  acuerdoMontos: etiquetaBooleano(data.acuerdo_montos_companeras),
  companerasMontoNoAcordadoIds: data.desacuerdos_montos.map((item) => item.integrante_id),
  motivosDesacuerdoMontosPorIntegrante: Object.fromEntries(
    data.desacuerdos_montos.map((item) => [item.integrante_id, item.motivo]),
  ),
  conoceTesoreraDelGrupo: etiquetaBooleano(data.conoce_tesorera),
  quienEsTesorera: data.tesorera_reconocida_integrante_id ?? '',
  domicilioRecoleccion: data.desconoce_domicilio_recoleccion
    ? noSabeDomicilioValue
    : data.domicilio_recoleccion_integrante_id ?? '',
  tieneFamiliarGrupo: etiquetaBooleano(data.tiene_familiares_grupo),
  familiaresGrupoIds: data.familiares_grupo_ids,
  tieneOtroCreditoGrupal: etiquetaBooleano(data.tiene_otro_credito_grupal),
  financieraCreditoGrupal: data.financiera_credito_grupal ?? '',
  creditoGrupalAnteriorActivo: etiquetaBooleano(data.credito_grupal_anterior_activo),
  valorFichaCreditoGrupal: etiquetaImporte(data.valor_ficha_credito_grupal),
  semanaActualCreditoGrupal: data.semana_actual_credito_grupal?.toString() ?? '',
  mesDesembolsoCreditoGrupal: data.mes_desembolso_credito_grupal
    ? MESES[data.mes_desembolso_credito_grupal - 1] ?? ''
    : '',
  mesUltimoPagoCreditoGrupal: data.mes_ultimo_pago_credito_grupal
    ? MESES[data.mes_ultimo_pago_credito_grupal - 1] ?? ''
    : '',
  anioUltimoPagoCreditoGrupal: data.anio_ultimo_pago_credito_grupal?.toString() ?? '',
  numeroCiclosCreditoGrupal: data.numero_ciclos_credito_grupal?.toString() ?? '',
  tasaCreditoGrupal: data.tasa_credito_grupal?.toString() ?? '',
  nombreAsesoraCreditoGrupal: data.nombre_asesora_credito_grupal ?? '',
  telefonoAsesoraCreditoGrupal: data.telefono_asesora_credito_grupal ?? '',
  motivoNoRenovacionCreditoGrupal: data.motivo_no_renovacion_credito_grupal ?? '',
  viveEnDomicilioDeclarado: etiquetaBooleano(data.vive_en_domicilio),
  motivoNoViveEnDomicilio: data.motivo_no_vive_domicilio ?? '',
  tipoDomicilio: etiqueta(TIPO_DOMICILIO, data.tipo_domicilio),
  familiarDomicilio: etiqueta(FAMILIAR_DOMICILIO, data.familiar_domicilio),
  aniosEnDomicilio: etiqueta(ANTIGUEDAD, data.antiguedad_domicilio),
  personasVivenCasa: data.personas_viven_casa === '6_O_MAS'
    ? '≥6'
    : data.personas_viven_casa ?? '',
  quienViveConUsted: data.convivientes.map((item) => invertir(CONVIVIENTES)[item]).filter(Boolean),
  quienesVivenConUstedSabenDelCredito: etiquetaBooleano(data.saben_del_credito),
  tieneOtroIngresoHogar: etiquetaBooleano(data.otro_ingreso_hogar),
  otroIngresoSemanal: etiquetaImporte(data.otro_ingreso_semanal),
  capacidadPagoSemanal: etiquetaImporte(data.capacidad_pago_semanal),
  motivoCredito: data.uso_credito ?? '',
  fuentesIngresoPersonal: data.fuentes_ingreso.map((item) => invertir(FUENTES_INGRESO)[item]).filter(Boolean),
  ingresosSemanalesDeclarados: etiquetaImporte(data.sueldo_semanal),
  lugarTrabajo: data.lugar_trabajo ?? '',
  antiguedadLaboral: etiqueta(ANTIGUEDAD_LABORAL, data.antiguedad_laboral),
  tipoNegocio: data.tipo_negocio ?? '',
  ingresoLibreSemanalNegocio: etiquetaImporte(data.ingreso_libre_semanal_negocio),
  ubicacionNegocio: data.ubicacion_negocio ?? '',
  tieneControlPagos: etiquetaBooleano(data.tiene_control_pagos),
  motivoSinControl: data.motivo_sin_control_pagos ?? '',
  asesoraAcudioSemanalmente: etiqueta(FRECUENCIA, data.asesora_acudio_semanalmente),
  firmabanControlSemanalmente: etiqueta(FRECUENCIA, data.firmaban_control_semanalmente),
  tratoAsesoraTesorera: etiqueta(CALIFICACION, data.trato_asesora_tesorera),
  conocePremioTesorera: etiquetaBooleano(data.conoce_premio_tesorera),
  opinionCredito: etiqueta(CALIFICACION, data.opinion_credito),
  tratoDesembolso: etiqueta(CALIFICACION, data.trato_desembolso),
  rapidezDesembolso: etiqueta(RAPIDEZ, data.rapidez_desembolso),
  informacionCreditoClara: etiquetaBooleano(data.informacion_credito_clara),
  recomendaria: etiquetaBooleano(data.recomendaria),
  razonRecomendacion: data.motivo_recomendacion ?? '',
  motivoRecomendacion: data.oportunidad_mejora ?? '',
});
