import type { EntrevistaFormState } from './verificacion-entrevista.mapper';

export interface EntrevistaCompletionContext {
  entrevistaCargada: boolean;
  entrevistaSincronizada: boolean;
  sinEvidenciasPendientes: boolean;
  imagenesDomicilioCompletadas: boolean;
  telefonoPrincipalConfirmado: boolean;
  mostrarControlTesorera: boolean;
  mostrarEncuestaServicio: boolean;
  fotoControlPagosConfirmada: boolean;
  fotoFolletoConfirmada: boolean;
}

export interface EntrevistaCompletionResult {
  completa: boolean;
  faltantes: string[];
}

const tieneTexto = (value: string): boolean => value.trim().length > 0;

export const evaluarCompletitudEntrevista = (
  state: EntrevistaFormState,
  context: EntrevistaCompletionContext,
): EntrevistaCompletionResult => {
  const faltantes: string[] = [];
  const requerirTexto = (value: string, label: string) => {
    if (!tieneTexto(value)) faltantes.push(label);
  };
  const requerirSeleccion = (value: readonly string[], label: string) => {
    if (value.length === 0) faltantes.push(label);
  };

  requerirTexto(state.conoceAsesora, 'Indicar si conoce a la asesora');
  if (state.conoceAsesora === 'Sí') {
    requerirTexto(state.comoConocioAsesora, 'Indicar cómo conoció a la asesora');
  }
  requerirTexto(state.conoceIntegrantes, 'Indicar si conoce a todas las integrantes');
  if (state.conoceIntegrantes === 'Si') {
    requerirTexto(state.tiempoConoceIntegrantes, 'Indicar desde hace cuánto conoce a las integrantes');
  }
  requerirTexto(state.sabeMontosCompaneras, 'Indicar si conoce los montos de sus compañeras');
  requerirTexto(state.acuerdoMontos, 'Indicar si está de acuerdo con los montos');
  if (state.acuerdoMontos === 'No') {
    requerirSeleccion(
      state.companerasMontoNoAcordadoIds,
      'Seleccionar las integrantes con cuyo monto no está de acuerdo',
    );
    state.companerasMontoNoAcordadoIds.forEach((integranteId) => {
      if (!tieneTexto(state.motivosDesacuerdoMontosPorIntegrante[integranteId] ?? '')) {
        faltantes.push('Registrar el motivo de cada desacuerdo de monto');
      }
    });
  }
  requerirTexto(state.conoceTesoreraDelGrupo, 'Indicar si conoce a la tesorera');
  if (state.conoceTesoreraDelGrupo === 'Sí') {
    requerirTexto(state.quienEsTesorera, 'Seleccionar quién es la tesorera');
  }
  requerirTexto(state.domicilioRecoleccion, 'Seleccionar el domicilio de recolección');
  requerirTexto(state.tieneFamiliarGrupo, 'Indicar si tiene familiares en el grupo');
  if (state.tieneFamiliarGrupo === 'Sí') {
    requerirSeleccion(state.familiaresGrupoIds, 'Seleccionar los familiares en el grupo');
  }

  requerirTexto(state.tieneOtroCreditoGrupal, 'Indicar si tuvo otro crédito grupal');
  if (state.tieneOtroCreditoGrupal === 'Sí') {
    requerirTexto(state.financieraCreditoGrupal, 'Seleccionar la otra financiera');
    requerirTexto(state.creditoGrupalAnteriorActivo, 'Indicar si el otro crédito sigue activo');
    if (state.creditoGrupalAnteriorActivo) {
      requerirTexto(state.valorFichaCreditoGrupal, 'Capturar el valor de la ficha del otro crédito');
      requerirTexto(
        state.montoUltimoPrestamoCreditoGrupal,
        'Capturar el monto del último préstamo en la otra financiera',
      );
      requerirTexto(state.numeroCiclosCreditoGrupal, 'Seleccionar los ciclos en la otra financiera');
    }
    if (state.creditoGrupalAnteriorActivo === 'Sí') {
      requerirTexto(state.semanaActualCreditoGrupal, 'Seleccionar la semana del otro crédito');
      requerirTexto(state.mesDesembolsoCreditoGrupal, 'Seleccionar el mes de desembolso del otro crédito');
    }
    if (state.creditoGrupalAnteriorActivo === 'No') {
      requerirTexto(state.mesUltimoPagoCreditoGrupal, 'Seleccionar el mes del último pago');
      requerirTexto(state.anioUltimoPagoCreditoGrupal, 'Seleccionar el año del último pago');
      requerirTexto(state.motivoNoRenovacionCreditoGrupal, 'Seleccionar por qué no renovó');
    }
    if (
      tieneTexto(state.telefonoAsesoraCreditoGrupal)
      && state.telefonoAsesoraCreditoGrupal.replace(/\D/g, '').length !== 10
    ) {
      faltantes.push('Corregir el teléfono de la asesora de otra financiera');
    }
  }

  requerirTexto(state.viveEnDomicilioDeclarado, 'Indicar si vive en el domicilio declarado');
  if (state.viveEnDomicilioDeclarado === 'No') {
    requerirTexto(state.motivoNoViveEnDomicilio, 'Seleccionar por qué no vive en el domicilio');
  }
  requerirTexto(state.tipoDomicilio, 'Seleccionar el tipo de domicilio');
  if (state.tipoDomicilio === 'Familiar') {
    requerirTexto(state.familiarDomicilio, 'Seleccionar de qué familiar es el domicilio');
  }
  requerirTexto(state.aniosEnDomicilio, 'Indicar cuántos años lleva en el domicilio');
  requerirTexto(state.personasVivenCasa, 'Indicar cuántas personas viven en casa');
  requerirSeleccion(state.quienViveConUsted, 'Seleccionar quién vive con la integrante');
  requerirTexto(
    state.quienesVivenConUstedSabenDelCredito,
    'Indicar si quienes viven ahí saben del crédito',
  );
  requerirTexto(state.tieneOtroIngresoHogar, 'Indicar si alguien más aporta ingresos al hogar');
  if (state.tieneOtroIngresoHogar === 'Sí') {
    requerirTexto(state.otroIngresoSemanal, 'Capturar la aportación semanal al hogar');
  }

  requerirTexto(state.capacidadPagoSemanal, 'Capturar cuánto puede pagar por semana');
  requerirTexto(state.motivoCredito, 'Capturar en qué utilizará el crédito');
  requerirSeleccion(state.fuentesIngresoPersonal, 'Seleccionar de dónde provienen sus ingresos');
  if (state.fuentesIngresoPersonal.includes('Sueldo')) {
    requerirTexto(state.ingresosSemanalesDeclarados, 'Capturar el sueldo semanal');
    requerirTexto(state.lugarTrabajo, 'Capturar dónde trabaja');
    requerirTexto(state.antiguedadLaboral, 'Seleccionar su antigüedad laboral');
  }
  if (state.fuentesIngresoPersonal.includes('Negocio')) {
    requerirTexto(state.tipoNegocio, 'Capturar el tipo de negocio');
    requerirTexto(state.ingresoLibreSemanalNegocio, 'Capturar el ingreso libre semanal del negocio');
  }

  if (context.mostrarControlTesorera) {
    requerirTexto(state.tieneControlPagos, 'Indicar si conserva el control de pagos');
    if (state.tieneControlPagos === 'Sí' && !context.fotoControlPagosConfirmada) {
      faltantes.push('Guardar la fotografía del control de pagos');
    }
    if (state.tieneControlPagos === 'No') {
      requerirTexto(state.motivoSinControl, 'Seleccionar qué pasó con el control de pagos');
    }
    requerirTexto(state.asesoraAcudioSemanalmente, 'Evaluar la asistencia semanal de la asesora');
    requerirTexto(state.firmabanControlSemanalmente, 'Indicar si firmaban el control semanalmente');
    requerirTexto(state.tratoAsesoraTesorera, 'Evaluar el trato de la asesora');
    requerirTexto(state.conocePremioTesorera, 'Indicar si conoce el premio para tesoreras');
    if (state.conocePremioTesorera === 'No' && !context.fotoFolletoConfirmada) {
      faltantes.push('Guardar la evidencia de entrega del folleto');
    }
  }

  if (context.mostrarEncuestaServicio) {
    requerirTexto(state.opinionCredito, 'Evaluar el crédito con CRELEALTAD');
    requerirTexto(state.tratoDesembolso, 'Evaluar el trato durante el desembolso');
    requerirTexto(state.rapidezDesembolso, 'Evaluar la rapidez del desembolso');
    requerirTexto(state.informacionCreditoClara, 'Indicar si la información del crédito fue clara');
    requerirTexto(state.recomendaria, 'Indicar si recomendaría a CRELEALTAD');
    if (state.recomendaria) {
      requerirTexto(state.razonRecomendacion, 'Seleccionar el motivo de la recomendación');
    }
  }

  if (!context.imagenesDomicilioCompletadas) {
    faltantes.push('Terminar las imágenes del domicilio');
  }
  if (!context.telefonoPrincipalConfirmado) {
    faltantes.push('Confirmar el teléfono principal');
  }
  if (!context.entrevistaCargada) {
    faltantes.push('Recuperar la entrevista guardada');
  } else if (!context.entrevistaSincronizada) {
    faltantes.push('Esperar a que la entrevista se guarde en el servidor');
  }
  if (!context.sinEvidenciasPendientes) {
    faltantes.push('Terminar de guardar las evidencias pendientes');
  }

  return {
    completa: faltantes.length === 0,
    faltantes: [...new Set(faltantes)],
  };
};
