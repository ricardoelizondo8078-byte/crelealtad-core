import { getResponsiveColumnCount } from '../ResponsiveContent';

describe('responsive desktop layout', () => {
  it('keeps a single content column on phones', () => {
    expect(getResponsiveColumnCount(390)).toBe(1);
  });

  it('uses the configured tablet and desktop grids', () => {
    const options = { mobile: 1, tablet: 2, desktop: 3, wide: 4 };

    expect(getResponsiveColumnCount(768, options)).toBe(2);
    expect(getResponsiveColumnCount(1024, options)).toBe(3);
    expect(getResponsiveColumnCount(1440, options)).toBe(4);
  });
});
