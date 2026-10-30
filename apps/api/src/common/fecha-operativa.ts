export const ZONA_HORARIA_OPERATIVA = 'America/Mexico_City';

const formateadorFechaOperativa = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA_OPERATIVA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const fechaOperativaISO = (fecha = new Date()): string => {
  const partes = formateadorFechaOperativa.formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string => (
    partes.find((parte) => parte.type === tipo)?.value ?? ''
  );

  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};
