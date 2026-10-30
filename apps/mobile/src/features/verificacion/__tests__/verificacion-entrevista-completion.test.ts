import { describe, expect, it } from '@jest/globals';
import {
  evaluarCompletitudEntrevista,
  type EntrevistaCompletionContext,
} from '../verificacion-entrevista-completion';
import type { EntrevistaFormState } from '../verificacion-entrevista.mapper';

const entrevistaCompletaBase = (): EntrevistaFormState => ({
  conoceAsesora: 'No',
  comoConocioAsesora: '',
  conoceIntegrantes: 'No',
  tiempoConoceIntegrantes: '',
  sabeMontosCompaneras: 'No',
  acuerdoMontos: 'Sí',
  companerasMontoNoAcordadoIds: [],
  motivosDesacuerdoMontosPorIntegrante: {},
  conoceTesoreraDelGrupo: 'No',
  quienEsTesorera: '',
  domicilioRecoleccion: 'NO_SABE',
  tieneFamiliarGrupo: 'No',
  familiaresGrupoIds: [],
  tieneOtroCreditoGrupal: 'No',
  financieraCreditoGrupal: '',
  creditoGrupalAnteriorActivo: '',
  valorFichaCreditoGrupal: '',
  montoUltimoPrestamoCreditoGrupal: '',
  semanaActualCreditoGrupal: '',
  mesDesembolsoCreditoGrupal: '',
  mesUltimoPagoCreditoGrupal: '',
  anioUltimoPagoCreditoGrupal: '',
  numeroCiclosCreditoGrupal: '',
  tasaCreditoGrupal: '',
  nombreAsesoraCreditoGrupal: '',
  telefonoAsesoraCreditoGrupal: '',
  motivoNoRenovacionCreditoGrupal: '',
  viveEnDomicilioDeclarado: 'Sí',
  motivoNoViveEnDomicilio: '',
  tipoDomicilio: 'Dueña',
  familiarDomicilio: '',
  aniosEnDomicilio: '1-3 años',
  personasVivenCasa: '2',
  quienViveConUsted: ['Hijos'],
  quienesVivenConUstedSabenDelCredito: 'Sí',
  tieneOtroIngresoHogar: 'No',
  otroIngresoSemanal: '',
  capacidadPagoSemanal: '500',
  motivoCredito: 'Capital de trabajo',
  fuentesIngresoPersonal: ['Sueldo'],
  ingresosSemanalesDeclarados: '2500',
  lugarTrabajo: 'Comercio de prueba',
  antiguedadLaboral: '2 años',
  tipoNegocio: '',
  ingresoLibreSemanalNegocio: '',
  ubicacionNegocio: '',
  tieneControlPagos: '',
  motivoSinControl: '',
  asesoraAcudioSemanalmente: '',
  firmabanControlSemanalmente: '',
  tratoAsesoraTesorera: '',
  conocePremioTesorera: '',
  opinionCredito: '',
  tratoDesembolso: '',
  rapidezDesembolso: '',
  informacionCreditoClara: '',
  recomendaria: '',
  razonRecomendacion: '',
  motivoRecomendacion: '',
});

const contextoCompleto = (): EntrevistaCompletionContext => ({
  entrevistaCargada: true,
  entrevistaSincronizada: true,
  sinEvidenciasPendientes: true,
  imagenesDomicilioCompletadas: true,
  telefonoPrincipalConfirmado: true,
  mostrarControlTesorera: false,
  mostrarEncuestaServicio: false,
  fotoControlPagosConfirmada: false,
  fotoFolletoConfirmada: false,
});

describe('completitud de la Entrevista', () => {
  it('permite terminar sin contestar la oportunidad opcional de mejora', () => {
    const resultado = evaluarCompletitudEntrevista(
      entrevistaCompletaBase(),
      contextoCompleto(),
    );

    expect(resultado).toEqual({ completa: true, faltantes: [] });
  });

  it('explica que falta indicar cómo conoció a la asesora', () => {
    const entrevista = {
      ...entrevistaCompletaBase(),
      conoceAsesora: 'Sí',
      comoConocioAsesora: '',
    };

    expect(evaluarCompletitudEntrevista(entrevista, contextoCompleto()).faltantes).toContain(
      'Indicar cómo conoció a la asesora',
    );
  });

  it('exige el monto del último préstamo cuando existe otro crédito grupal', () => {
    const entrevista = {
      ...entrevistaCompletaBase(),
      tieneOtroCreditoGrupal: 'Sí',
      financieraCreditoGrupal: 'Financiera de prueba',
      creditoGrupalAnteriorActivo: 'Sí',
      valorFichaCreditoGrupal: '$ 500',
      montoUltimoPrestamoCreditoGrupal: '',
      semanaActualCreditoGrupal: '4',
      mesDesembolsoCreditoGrupal: 'Septiembre',
      numeroCiclosCreditoGrupal: '2',
      tasaCreditoGrupal: '70',
    };

    expect(evaluarCompletitudEntrevista(entrevista, contextoCompleto()).faltantes).toContain(
      'Capturar el monto del último préstamo en la otra financiera',
    );
  });

  it('permite terminar el historial externo sin capturar la tasa', () => {
    const entrevista = {
      ...entrevistaCompletaBase(),
      tieneOtroCreditoGrupal: 'Sí',
      financieraCreditoGrupal: 'Financiera de prueba',
      creditoGrupalAnteriorActivo: 'Sí',
      valorFichaCreditoGrupal: '$ 500',
      montoUltimoPrestamoCreditoGrupal: '$ 10,000',
      semanaActualCreditoGrupal: '4',
      mesDesembolsoCreditoGrupal: 'Septiembre',
      numeroCiclosCreditoGrupal: '2',
      tasaCreditoGrupal: '',
    };

    expect(evaluarCompletitudEntrevista(entrevista, contextoCompleto())).toEqual({
      completa: true,
      faltantes: [],
    });
  });

  it('exige la evidencia aplicable a la tesorera con historial', () => {
    const entrevista = {
      ...entrevistaCompletaBase(),
      tieneControlPagos: 'Sí',
      asesoraAcudioSemanalmente: 'Siempre',
      firmabanControlSemanalmente: 'Siempre',
      tratoAsesoraTesorera: 'Bueno',
      conocePremioTesorera: 'No',
      opinionCredito: 'Bueno',
      tratoDesembolso: 'Bueno',
      rapidezDesembolso: 'Rápido',
      informacionCreditoClara: 'Sí',
      recomendaria: 'Sí',
      razonRecomendacion: 'Buen servicio',
    };
    const context = {
      ...contextoCompleto(),
      mostrarControlTesorera: true,
      mostrarEncuestaServicio: true,
    };

    expect(evaluarCompletitudEntrevista(entrevista, context).faltantes).toEqual([
      'Guardar la fotografía del control de pagos',
      'Guardar la evidencia de entrega del folleto',
    ]);
    expect(evaluarCompletitudEntrevista(entrevista, {
      ...context,
      fotoControlPagosConfirmada: true,
      fotoFolletoConfirmada: true,
    }).completa).toBe(true);
  });

  it('no permite terminar mientras falte sincronizar la entrevista', () => {
    const resultado = evaluarCompletitudEntrevista(entrevistaCompletaBase(), {
      ...contextoCompleto(),
      entrevistaSincronizada: false,
    });

    expect(resultado.faltantes).toContain('Esperar a que la entrevista se guarde en el servidor');
  });
});
