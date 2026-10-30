import {
  formatISODateToDDMMMYYYY,
  toISODateFromDDMMMYYYY,
} from './input';

describe('fechas DD-MMM-AAAA', () => {
  it('presenta una fecha ISO con el mes abreviado en español', () => {
    expect(formatISODateToDDMMMYYYY('2026-10-08')).toBe('08-OCT-2026');
  });

  it('convierte la fecha visible al contrato ISO de la API', () => {
    expect(toISODateFromDDMMMYYYY('08-oct-2026')).toBe('2026-10-08');
  });

  it('rechaza días inexistentes', () => {
    expect(toISODateFromDDMMMYYYY('31-FEB-2026')).toBe('');
  });
});
