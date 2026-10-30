import {
  esRangoCiclosCreditoValido,
  esRangoConcordanciaValido,
  esRangoPromedioEvidenciasValido,
  esRangoSemanaCreditoValido,
  esRangoToleranciaSemanaDesembolsoValido,
  calcularToleranciaSemanaDesembolso,
  calcularPorcentajeDiferencia,
  obtenerTonoCiclosCredito,
  obtenerTonoConcordancia,
  obtenerTonoPromedioEvidencias,
  obtenerTonoSemanaCredito,
  obtenerTonoToleranciaSemanaDesembolso,
  RANGO_CICLOS_CREDITO_INICIAL,
  RANGO_CONCORDANCIA_INICIAL,
  RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
  RANGO_SEMANA_CREDITO_INICIAL,
  RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
} from '../parametros-conclusiones.model';

const parametro = {
  id: 1,
  ...RANGO_SEMANA_CREDITO_INICIAL,
  updated_at: '2026-10-11T12:00:00.000Z',
};

describe('parámetro de semana del crédito en Conclusiones', () => {
  it('acepta cualquier orden y espacios entre rangos', () => {
    expect(esRangoSemanaCreditoValido(RANGO_SEMANA_CREDITO_INICIAL)).toBe(true);
    expect(esRangoSemanaCreditoValido({
      verde_desde: 13,
      verde_hasta: 16,
      amarillo_desde: 9,
      amarillo_hasta: 11,
      rojo_desde: 1,
      rojo_hasta: 7,
    })).toBe(true);
  });

  it('rechaza rangos invertidos o semanas compartidas por dos colores', () => {
    expect(esRangoSemanaCreditoValido({
      ...RANGO_SEMANA_CREDITO_INICIAL,
      verde_desde: 11,
    })).toBe(false);
    expect(esRangoSemanaCreditoValido({
      ...RANGO_SEMANA_CREDITO_INICIAL,
      amarillo_desde: 10,
    })).toBe(false);
  });

  it('califica las semanas con los tres rangos publicados', () => {
    expect(obtenerTonoSemanaCredito(1, parametro)).toBe('positive');
    expect(obtenerTonoSemanaCredito(10, parametro)).toBe('positive');
    expect(obtenerTonoSemanaCredito(11, parametro)).toBe('warning');
    expect(obtenerTonoSemanaCredito(13, parametro)).toBe('warning');
    expect(obtenerTonoSemanaCredito(14, parametro)).toBe('negative');
    expect(obtenerTonoSemanaCredito(16, parametro)).toBe('negative');
    expect(obtenerTonoSemanaCredito(17, parametro)).toBeUndefined();
    expect(obtenerTonoSemanaCredito(8, null)).toBeUndefined();
  });

  it('valida y califica ciclos con el mismo patrón entre 1 y 40', () => {
    const ciclos = {
      id: 1,
      audit_id: '33333333-3333-4333-8333-333333333333',
      verde_desde: 8,
      verde_hasta: 40,
      amarillo_desde: 4,
      amarillo_hasta: 7,
      rojo_desde: 1,
      rojo_hasta: 3,
      updated_at: '2026-10-11T12:00:00.000Z',
    };
    expect(esRangoCiclosCreditoValido(RANGO_CICLOS_CREDITO_INICIAL)).toBe(true);
    expect(esRangoCiclosCreditoValido({
      ...RANGO_CICLOS_CREDITO_INICIAL,
      verde_desde: 17,
      verde_hasta: 40,
    }))
      .toBe(true);
    expect(esRangoCiclosCreditoValido({ ...RANGO_CICLOS_CREDITO_INICIAL, rojo_hasta: 41 }))
      .toBe(false);
    expect(obtenerTonoCiclosCredito(2, ciclos)).toBe('negative');
    expect(obtenerTonoCiclosCredito(5, ciclos)).toBe('warning');
    expect(obtenerTonoCiclosCredito(40, ciclos)).toBe('positive');
    expect(obtenerTonoCiclosCredito(41, ciclos)).toBeUndefined();
  });

  it('calcula y califica la tolerancia de semana de desembolso entre 0 y 10', () => {
    const tolerancia = {
      id: 1,
      ...RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
      updated_at: '2026-10-11T12:00:00.000Z',
    };
    expect(esRangoToleranciaSemanaDesembolsoValido(
      RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
    )).toBe(true);
    expect(calcularToleranciaSemanaDesembolso(12, 9, 14)).toBe(0);
    expect(calcularToleranciaSemanaDesembolso(8, 9, 14)).toBe(1);
    expect(calcularToleranciaSemanaDesembolso(17, 9, 14)).toBe(3);
    expect(calcularToleranciaSemanaDesembolso(30, 9, 14)).toBe(10);
    expect(obtenerTonoToleranciaSemanaDesembolso(0, tolerancia)).toBe('positive');
    expect(obtenerTonoToleranciaSemanaDesembolso(2, tolerancia)).toBe('warning');
    expect(obtenerTonoToleranciaSemanaDesembolso(8, tolerancia)).toBe('negative');
  });

  it('calcula la diferencia porcentual y la califica para ficha o préstamo', () => {
    const concordancia = {
      id: 1,
      ...RANGO_CONCORDANCIA_INICIAL,
      updated_at: '2026-10-11T12:00:00.000Z',
    };
    expect(esRangoConcordanciaValido(RANGO_CONCORDANCIA_INICIAL)).toBe(true);
    expect(calcularPorcentajeDiferencia(1000, 1000)).toBe(0);
    expect(calcularPorcentajeDiferencia(1050, 1000)).toBe(5);
    expect(calcularPorcentajeDiferencia(1090, 1000)).toBe(8);
    expect(calcularPorcentajeDiferencia(1300, 1000)).toBe(23);
    expect(calcularPorcentajeDiferencia(2500, 1000)).toBe(60);
    expect(calcularPorcentajeDiferencia(1000, 2500)).toBe(100);
    expect(calcularPorcentajeDiferencia(0, 1000)).toBeNull();
    expect(obtenerTonoConcordancia(5, concordancia)).toBe('positive');
    expect(obtenerTonoConcordancia(6, concordancia)).toBe('warning');
    expect(obtenerTonoConcordancia(11, concordancia)).toBe('negative');
  });

  it('valida y califica el promedio de fotografías de 0 a 100', () => {
    const promedio = {
      id: 1,
      ...RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
      updated_at: '2026-10-12T12:00:00.000Z',
    };
    expect(esRangoPromedioEvidenciasValido(RANGO_PROMEDIO_EVIDENCIAS_INICIAL)).toBe(true);
    expect(esRangoPromedioEvidenciasValido({
      ...RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
      amarillo_hasta: 67,
    })).toBe(false);
    expect(esRangoPromedioEvidenciasValido({
      ...RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
      rojo_desde: -1,
    })).toBe(false);
    expect(obtenerTonoPromedioEvidencias(0, promedio)).toBe('negative');
    expect(obtenerTonoPromedioEvidencias(33, promedio)).toBe('negative');
    expect(obtenerTonoPromedioEvidencias(34, promedio)).toBe('warning');
    expect(obtenerTonoPromedioEvidencias(66, promedio)).toBe('warning');
    expect(obtenerTonoPromedioEvidencias(67, promedio)).toBe('positive');
    expect(obtenerTonoPromedioEvidencias(100, promedio)).toBe('positive');
    expect(obtenerTonoPromedioEvidencias(101, promedio)).toBeUndefined();
  });
});
