import { TypeOrmModuleOptions } from '@nestjs/typeorm';

type DatabaseEnvironment = Record<string, string | undefined>;

function required(env: DatabaseEnvironment, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} es obligatorio`);
  return value;
}

export function getDatabaseConfig(
  env: DatabaseEnvironment = process.env,
): TypeOrmModuleOptions {
  const production = env.NODE_ENV === 'production';
  const databaseUrl = env.DATABASE_URL?.trim();
  const port = Number(env.DB_PORT || 5432);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto válido');
  }

  const connection = databaseUrl
    ? { url: databaseUrl }
    : {
        host: production ? required(env, 'DB_HOST') : env.DB_HOST || 'localhost',
        port,
        username: production
          ? required(env, 'DB_USERNAME')
          : env.DB_USERNAME || env.DB_USER || 'postgres',
        password: env.DB_PASSWORD || env.DB_PASS || required(env, 'DB_PASSWORD'),
        database: production ? required(env, 'DB_NAME') : env.DB_NAME || 'crelealtad',
      };

  const sslEnabled = production || env.DB_SSL === 'true';
  const rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

  return {
    type: 'postgres',
    ...connection,
    ssl: sslEnabled ? { rejectUnauthorized } : false,
    synchronize: false,
    autoLoadEntities: true,
    logging: !production,
    retryAttempts: 3,
    retryDelay: 3000,
  };
}
