import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  it('falla cerrado en producción cuando faltan credenciales', () => {
    expect(() => getDatabaseConfig({ NODE_ENV: 'production' }))
      .toThrow('DB_HOST es obligatorio');
  });

  it('acepta DATABASE_URL y valida TLS por defecto en producción', () => {
    const config = getDatabaseConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user@db.example/crelealtad',
    });

    expect(config).toEqual(expect.objectContaining({
      url: 'postgresql://user@db.example/crelealtad',
      ssl: { rejectUnauthorized: true },
      synchronize: false,
    }));
  });

  it('requiere una decisión explícita para desactivar la validación del certificado', () => {
    const config = getDatabaseConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user@db.example/crelealtad',
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    });

    expect((config as { ssl?: unknown }).ssl).toEqual({ rejectUnauthorized: false });
  });

  it('conserva valores locales sólo fuera de producción', () => {
    const config = getDatabaseConfig({
      NODE_ENV: 'test',
      DB_PASSWORD: 'test-fixture',
    });
    expect(config).toEqual(expect.objectContaining({
      host: 'localhost',
      username: 'postgres',
      database: 'crelealtad',
      ssl: false,
    }));
  });
});
