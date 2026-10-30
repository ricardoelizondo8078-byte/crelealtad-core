import { describe, expect, it } from '@jest/globals';
import { colors } from '../../../theme/tokens';
import {
  OPCIONES_SEMAFORO_EVIDENCIA,
  obtenerPresentacionClasificacionEvidencia,
} from '../verificacion-evidencia-semaforo.model';

describe('semáforo de evidencia de otra financiera', () => {
  it('mantiene el orden verde, amarillo y rojo con tokens semánticos', () => {
    expect(OPCIONES_SEMAFORO_EVIDENCIA.map(({ value }) => value)).toEqual([
      'VERDE',
      'AMARILLO',
      'ROJO',
    ]);
    expect(obtenerPresentacionClasificacionEvidencia('VERDE')?.color).toBe(colors.success);
    expect(obtenerPresentacionClasificacionEvidencia('AMARILLO')?.color).toBe(colors.warning);
    expect(obtenerPresentacionClasificacionEvidencia('ROJO')?.color).toBe(colors.danger);
  });

  it('conserva sin marco una evidencia histórica no clasificada', () => {
    expect(obtenerPresentacionClasificacionEvidencia(null)).toBeNull();
  });
});
