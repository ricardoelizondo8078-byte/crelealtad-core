import { calcularEdad, EDAD_LIMITE_INTEGRANTE, superaLimiteEdad } from './edad.policy';

describe('Política de edad de integrantes', () => {
  const referencia = new Date(2026, 8, 1);

  it('calcula la edad respetando si el cumpleaños ya ocurrió', () => {
    expect(calcularEdad('2000-09-01', referencia)).toBe(26);
    expect(calcularEdad('2000-09-02', referencia)).toBe(25);
  });

  it('no marca advertencia exactamente a los 70 años', () => {
    const edad = calcularEdad('1956-09-01', referencia);

    expect(edad).toBe(EDAD_LIMITE_INTEGRANTE);
    expect(superaLimiteEdad(edad)).toBe(false);
  });

  it('marca advertencia cuando la edad sobrepasa los 70 años', () => {
    const edad = calcularEdad('1955-09-01', referencia);

    expect(edad).toBe(71);
    expect(superaLimiteEdad(edad)).toBe(true);
  });
});
