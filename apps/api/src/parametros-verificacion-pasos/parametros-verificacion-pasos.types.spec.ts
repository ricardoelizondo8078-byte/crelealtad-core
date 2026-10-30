import {
  determinarTipoIntegranteVerificacion,
  esEvidenciaOtraFinancieraConfirmada,
  esReglaObligatoriaSinHistorial,
} from './parametros-verificacion-pasos.types';

describe('tipo de integrante para Verificación', () => {
  it.each([
    [false, false, 'NUEVA'],
    [false, true, 'NUEVA_CON_EVIDENCIA'],
    [true, false, 'CICLO_2_MAS'],
    [true, true, 'CICLO_2_MAS_CON_EVIDENCIA'],
  ] as const)(
    'deriva historial=%s evidencia=%s como %s',
    (tieneHistorial, tieneEvidencia, esperado) => {
      expect(determinarTipoIntegranteVerificacion(tieneHistorial, tieneEvidencia)).toBe(esperado);
    },
  );
});

describe('modalidad condicional sin historial previo', () => {
  it.each([
    ['OBLIGATORIO', null, true],
    ['OPCIONAL', null, false],
    ['OBLIGATORIO_DESPUES_DIAS', 30, true],
  ] as const)('%s se evalúa como obligatorio=%s', (modalidad, dias, esperado) => {
    expect(esReglaObligatoriaSinHistorial({
      tipo_integrante: 'NUEVA',
      paso: 'LLAMADA',
      modalidad,
      dias_para_obligatorio: dias,
    })).toBe(esperado);
  });
});

describe('evidencia de otra financiera confirmada', () => {
  it.each([
    [null, false],
    ['', false],
    ['file:///captura.jpg', false],
    ['content://captura/1', false],
    ['storage:comprobante-pendiente', false],
    ['/solicitudes/documentos/comprobante_credito/version-1', true],
  ] as const)('evalúa %s como %s', (ruta, esperado) => {
    expect(esEvidenciaOtraFinancieraConfirmada(ruta)).toBe(esperado);
  });
});
