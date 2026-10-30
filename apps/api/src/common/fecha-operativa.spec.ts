import { fechaOperativaISO } from './fecha-operativa';

describe('fechaOperativaISO', () => {
  it('conserva el día calendario de México cuando UTC ya avanzó al día siguiente', () => {
    expect(fechaOperativaISO(new Date('2026-10-09T04:44:00.000Z'))).toBe('2026-10-08');
  });

  it('avanza el día al llegar la medianoche en la zona operativa', () => {
    expect(fechaOperativaISO(new Date('2026-10-09T06:00:00.000Z'))).toBe('2026-10-09');
  });
});
