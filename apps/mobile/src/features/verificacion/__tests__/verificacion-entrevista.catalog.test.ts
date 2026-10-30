import { describe, expect, it } from '@jest/globals';
import { calcularRangoSemanasDesdeMes } from '../verificacion-entrevista.catalog';

describe('rango de semanas desde el mes de desembolso', () => {
  it('calcula semanas completas desde el primero y el último día del mes', () => {
    expect(calcularRangoSemanasDesdeMes(
      'Julio',
      '2026-10-08T18:00:00.000Z',
    )).toEqual({
      desdePrimerDia: 14,
      desdeUltimoDia: 9,
    });
  });

  it('usa la ocurrencia anterior cuando el mes aún no sucede en el año de captura', () => {
    expect(calcularRangoSemanasDesdeMes(
      'Diciembre',
      '2026-01-15T18:00:00.000Z',
    )).toEqual({
      desdePrimerDia: 6,
      desdeUltimoDia: 2,
    });
  });

  it('limita el extremo final a la fecha de captura cuando corresponde al mismo mes', () => {
    expect(calcularRangoSemanasDesdeMes(
      'Octubre',
      '2026-10-08T18:00:00.000Z',
    )).toEqual({
      desdePrimerDia: 1,
      desdeUltimoDia: 0,
    });
  });

  it('no inventa un rango cuando falta un mes o una fecha válidos', () => {
    expect(calcularRangoSemanasDesdeMes('', '2026-10-08T18:00:00.000Z')).toBeNull();
    expect(calcularRangoSemanasDesdeMes('Julio', null)).toBeNull();
    expect(calcularRangoSemanasDesdeMes('Julio', 'fecha-invalida')).toBeNull();
  });
});
