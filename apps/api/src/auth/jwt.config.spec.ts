import { getJwtSecret } from './jwt.config';

describe('getJwtSecret', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('usa el secreto configurado', () => {
    process.env.JWT_SECRET = 'secreto-configurado';
    process.env.NODE_ENV = 'production';

    expect(getJwtSecret()).toBe('secreto-configurado');
  });

  it('impide iniciar producción sin secreto', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    expect(() => getJwtSecret()).toThrow('JWT_SECRET es obligatorio fuera de pruebas');
  });

  it('impide iniciar desarrollo sin secreto', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';

    expect(() => getJwtSecret()).toThrow('JWT_SECRET es obligatorio fuera de pruebas');
  });

  it('usa una credencial determinista aislada sólo durante pruebas', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';

    expect(getJwtSecret()).toMatch(/^[0-9a-f]{64}$/);
  });
});
