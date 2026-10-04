import { useState } from 'react';
import type { EntrevistaFormState } from './verificacion-entrevista.mapper';

/**
 * Mantiene en un solo punto el estado editable de Entrevista.
 *
 * La pantalla coordinadora conserva carga, autoguardado y efectos de red; las secciones reciben
 * únicamente valores y callbacks. Los setters se exponen con los nombres históricos para que la
 * extracción no cambie el orden ni la semántica del formulario.
 */
export const useEntrevistaForm = () => {
  const [conoceAsesora, setConoceAsesora] = useState('');
  const [comoConocioAsesora, setComoConocioAsesora] = useState('');
  const [conoceIntegrantes, setConoceIntegrantes] = useState('');
  const [tiempoConoceIntegrantes, setTiempoConoceIntegrantes] = useState('');
  const [sabeMontosCompaneras, setSabeMontosCompaneras] = useState('');
  const [acuerdoMontos, setAcuerdoMontos] = useState('');
  const [companerasMontoNoAcordadoIds, setCompanerasMontoNoAcordadoIds] = useState<string[]>([]);
  const [motivosDesacuerdoMontosPorIntegrante, setMotivosDesacuerdoMontosPorIntegrante] = useState<
    Record<string, string>
  >({});
  const [conoceTesoreraDelGrupo, setConoceTesoreraDelGrupo] = useState('');
  const [quienEsTesorera, setQuienEsTesorera] = useState('');
  const [domicilioRecoleccion, setDomicilioRecoleccion] = useState('');
  const [tieneFamiliarGrupo, setTieneFamiliarGrupo] = useState('');
  const [familiaresGrupoIds, setFamiliaresGrupoIds] = useState<string[]>([]);
  const [tieneOtroCreditoGrupal, setTieneOtroCreditoGrupal] = useState('');
  const [financieraCreditoGrupal, setFinancieraCreditoGrupal] = useState('');
  const [creditoGrupalAnteriorActivo, setCreditoGrupalAnteriorActivo] = useState('');
  const [valorFichaCreditoGrupal, setValorFichaCreditoGrupal] = useState('');
  const [semanaActualCreditoGrupal, setSemanaActualCreditoGrupal] = useState('');
  const [mesDesembolsoCreditoGrupal, setMesDesembolsoCreditoGrupal] = useState('');
  const [mesUltimoPagoCreditoGrupal, setMesUltimoPagoCreditoGrupal] = useState('');
  const [anioUltimoPagoCreditoGrupal, setAnioUltimoPagoCreditoGrupal] = useState('');
  const [numeroCiclosCreditoGrupal, setNumeroCiclosCreditoGrupal] = useState('');
  const [tasaCreditoGrupal, setTasaCreditoGrupal] = useState('');
  const [nombreAsesoraCreditoGrupal, setNombreAsesoraCreditoGrupal] = useState('');
  const [telefonoAsesoraCreditoGrupal, setTelefonoAsesoraCreditoGrupal] = useState('');
  const [motivoNoRenovacionCreditoGrupal, setMotivoNoRenovacionCreditoGrupal] = useState('');
  const [viveEnDomicilioDeclarado, setViveEnDomicilioDeclarado] = useState('');
  const [motivoNoViveEnDomicilio, setMotivoNoViveEnDomicilio] = useState('');
  const [tipoDomicilio, setTipoDomicilio] = useState('');
  const [familiarDomicilio, setFamiliarDomicilio] = useState('');
  const [aniosEnDomicilio, setAniosEnDomicilio] = useState('');
  const [personasVivenCasa, setPersonasVivenCasa] = useState('');
  const [quienViveConUsted, setQuienViveConUsted] = useState<string[]>([]);
  const [quienesVivenConUstedSabenDelCredito, setQuienesVivenConUstedSabenDelCredito] = useState('');
  const [tieneOtroIngresoHogar, setTieneOtroIngresoHogar] = useState('');
  const [otroIngresoSemanal, setOtroIngresoSemanal] = useState('');
  const [capacidadPagoSemanal, setCapacidadPagoSemanal] = useState('');
  const [motivoCredito, setMotivoCredito] = useState('');
  const [fuentesIngresoPersonal, setFuentesIngresoPersonal] = useState<string[]>([]);
  const [ingresosSemanalesDeclarados, setIngresosSemanalesDeclarados] = useState('');
  const [lugarTrabajo, setLugarTrabajo] = useState('');
  const [antiguedadLaboral, setAntiguedadLaboral] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [ingresoLibreSemanalNegocio, setIngresoLibreSemanalNegocio] = useState('');
  const [ubicacionNegocio, setUbicacionNegocio] = useState('');
  const [tieneControlPagos, setTieneControlPagos] = useState('');
  const [motivoSinControl, setMotivoSinControl] = useState('');
  const [asesoraAcudioSemanalmente, setAsesoraAcudioSemanalmente] = useState('');
  const [firmabanControlSemanalmente, setFirmabanControlSemanalmente] = useState('');
  const [tratoAsesoraTesorera, setTratoAsesoraTesorera] = useState('');
  const [conocePremioTesorera, setConocePremioTesorera] = useState('');
  const [opinionCredito, setOpinionCredito] = useState('');
  const [tratoDesembolso, setTratoDesembolso] = useState('');
  const [rapidezDesembolso, setRapidezDesembolso] = useState('');
  const [informacionCreditoClara, setInformacionCreditoClara] = useState('');
  const [recomendaria, setRecomendaria] = useState('');
  const [razonRecomendacion, setRazonRecomendacion] = useState('');
  const [motivoRecomendacion, setMotivoRecomendacion] = useState('');

  const values: EntrevistaFormState = {
    conoceAsesora,
    comoConocioAsesora,
    conoceIntegrantes,
    tiempoConoceIntegrantes,
    sabeMontosCompaneras,
    acuerdoMontos,
    companerasMontoNoAcordadoIds,
    motivosDesacuerdoMontosPorIntegrante,
    conoceTesoreraDelGrupo,
    quienEsTesorera,
    domicilioRecoleccion,
    tieneFamiliarGrupo,
    familiaresGrupoIds,
    tieneOtroCreditoGrupal,
    financieraCreditoGrupal,
    creditoGrupalAnteriorActivo,
    valorFichaCreditoGrupal,
    semanaActualCreditoGrupal,
    mesDesembolsoCreditoGrupal,
    mesUltimoPagoCreditoGrupal,
    anioUltimoPagoCreditoGrupal,
    numeroCiclosCreditoGrupal,
    tasaCreditoGrupal,
    nombreAsesoraCreditoGrupal,
    telefonoAsesoraCreditoGrupal,
    motivoNoRenovacionCreditoGrupal,
    viveEnDomicilioDeclarado,
    motivoNoViveEnDomicilio,
    tipoDomicilio,
    familiarDomicilio,
    aniosEnDomicilio,
    personasVivenCasa,
    quienViveConUsted,
    quienesVivenConUstedSabenDelCredito,
    tieneOtroIngresoHogar,
    otroIngresoSemanal,
    capacidadPagoSemanal,
    motivoCredito,
    fuentesIngresoPersonal,
    ingresosSemanalesDeclarados,
    lugarTrabajo,
    antiguedadLaboral,
    tipoNegocio,
    ingresoLibreSemanalNegocio,
    ubicacionNegocio,
    tieneControlPagos,
    motivoSinControl,
    asesoraAcudioSemanalmente,
    firmabanControlSemanalmente,
    tratoAsesoraTesorera,
    conocePremioTesorera,
    opinionCredito,
    tratoDesembolso,
    rapidezDesembolso,
    informacionCreditoClara,
    recomendaria,
    razonRecomendacion,
    motivoRecomendacion,
  };

  return {
    values,
    conoceAsesora, setConoceAsesora,
    comoConocioAsesora, setComoConocioAsesora,
    conoceIntegrantes, setConoceIntegrantes,
    tiempoConoceIntegrantes, setTiempoConoceIntegrantes,
    sabeMontosCompaneras, setSabeMontosCompaneras,
    acuerdoMontos, setAcuerdoMontos,
    companerasMontoNoAcordadoIds, setCompanerasMontoNoAcordadoIds,
    motivosDesacuerdoMontosPorIntegrante, setMotivosDesacuerdoMontosPorIntegrante,
    conoceTesoreraDelGrupo, setConoceTesoreraDelGrupo,
    quienEsTesorera, setQuienEsTesorera,
    domicilioRecoleccion, setDomicilioRecoleccion,
    tieneFamiliarGrupo, setTieneFamiliarGrupo,
    familiaresGrupoIds, setFamiliaresGrupoIds,
    tieneOtroCreditoGrupal, setTieneOtroCreditoGrupal,
    financieraCreditoGrupal, setFinancieraCreditoGrupal,
    creditoGrupalAnteriorActivo, setCreditoGrupalAnteriorActivo,
    valorFichaCreditoGrupal, setValorFichaCreditoGrupal,
    semanaActualCreditoGrupal, setSemanaActualCreditoGrupal,
    mesDesembolsoCreditoGrupal, setMesDesembolsoCreditoGrupal,
    mesUltimoPagoCreditoGrupal, setMesUltimoPagoCreditoGrupal,
    anioUltimoPagoCreditoGrupal, setAnioUltimoPagoCreditoGrupal,
    numeroCiclosCreditoGrupal, setNumeroCiclosCreditoGrupal,
    tasaCreditoGrupal, setTasaCreditoGrupal,
    nombreAsesoraCreditoGrupal, setNombreAsesoraCreditoGrupal,
    telefonoAsesoraCreditoGrupal, setTelefonoAsesoraCreditoGrupal,
    motivoNoRenovacionCreditoGrupal, setMotivoNoRenovacionCreditoGrupal,
    viveEnDomicilioDeclarado, setViveEnDomicilioDeclarado,
    motivoNoViveEnDomicilio, setMotivoNoViveEnDomicilio,
    tipoDomicilio, setTipoDomicilio,
    familiarDomicilio, setFamiliarDomicilio,
    aniosEnDomicilio, setAniosEnDomicilio,
    personasVivenCasa, setPersonasVivenCasa,
    quienViveConUsted, setQuienViveConUsted,
    quienesVivenConUstedSabenDelCredito, setQuienesVivenConUstedSabenDelCredito,
    tieneOtroIngresoHogar, setTieneOtroIngresoHogar,
    otroIngresoSemanal, setOtroIngresoSemanal,
    capacidadPagoSemanal, setCapacidadPagoSemanal,
    motivoCredito, setMotivoCredito,
    fuentesIngresoPersonal, setFuentesIngresoPersonal,
    ingresosSemanalesDeclarados, setIngresosSemanalesDeclarados,
    lugarTrabajo, setLugarTrabajo,
    antiguedadLaboral, setAntiguedadLaboral,
    tipoNegocio, setTipoNegocio,
    ingresoLibreSemanalNegocio, setIngresoLibreSemanalNegocio,
    ubicacionNegocio, setUbicacionNegocio,
    tieneControlPagos, setTieneControlPagos,
    motivoSinControl, setMotivoSinControl,
    asesoraAcudioSemanalmente, setAsesoraAcudioSemanalmente,
    firmabanControlSemanalmente, setFirmabanControlSemanalmente,
    tratoAsesoraTesorera, setTratoAsesoraTesorera,
    conocePremioTesorera, setConocePremioTesorera,
    opinionCredito, setOpinionCredito,
    tratoDesembolso, setTratoDesembolso,
    rapidezDesembolso, setRapidezDesembolso,
    informacionCreditoClara, setInformacionCreditoClara,
    recomendaria, setRecomendaria,
    razonRecomendacion, setRazonRecomendacion,
    motivoRecomendacion, setMotivoRecomendacion,
  };
};
