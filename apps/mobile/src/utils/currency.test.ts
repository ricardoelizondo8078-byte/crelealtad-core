import {
  extractCurrencyValue,
  formatCurrency,
  normalizeCurrencyInput,
} from './currency';

describe('formato monetario de la app', () => {
  it.each([
    [18000, '$ 18,000'],
    [18000.99, '$ 18,000'],
    ['18000.99', '$ 18,000'],
    ['$ 18,000', '$ 18,000'],
    ['', '$ 0'],
  ])('presenta %p con signo, espacio, miles y sin centavos', (value, expected) => {
    expect(formatCurrency(value)).toBe(expected);
  });

  it('normaliza la captura monetaria con el mismo formato', () => {
    expect(normalizeCurrencyInput('18000')).toBe('$ 18,000');
    expect(extractCurrencyValue('$ 18,000')).toBe('18000');
  });
});
