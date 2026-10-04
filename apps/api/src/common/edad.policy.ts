export const EDAD_LIMITE_INTEGRANTE = 70;

export const calcularEdad = (
  fechaNacimiento: string | Date | null | undefined,
  fechaReferencia = new Date(),
): number | null => {
  if (!fechaNacimiento) return null;

  let anioNacimiento: number;
  let mesNacimiento: number;
  let diaNacimiento: number;

  if (typeof fechaNacimiento === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNacimiento);
    if (!match) return null;
    anioNacimiento = Number(match[1]);
    mesNacimiento = Number(match[2]) - 1;
    diaNacimiento = Number(match[3]);
  } else {
    if (Number.isNaN(fechaNacimiento.getTime())) return null;
    anioNacimiento = fechaNacimiento.getUTCFullYear();
    mesNacimiento = fechaNacimiento.getUTCMonth();
    diaNacimiento = fechaNacimiento.getUTCDate();
  }

  let edad = fechaReferencia.getFullYear() - anioNacimiento;
  const aunNoCumple = fechaReferencia.getMonth() < mesNacimiento
    || (fechaReferencia.getMonth() === mesNacimiento
      && fechaReferencia.getDate() < diaNacimiento);

  if (aunNoCumple) edad -= 1;
  return edad >= 0 && edad <= 130 ? edad : null;
};

export const superaLimiteEdad = (edad: number | null): boolean => (
  edad !== null && edad > EDAD_LIMITE_INTEGRANTE
);
