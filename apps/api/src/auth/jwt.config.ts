import { createHash } from 'node:crypto';

function testOnlyJwtSecret(): string {
  return createHash('sha256')
    .update('crelealtad-jwt-test-fixture')
    .digest('hex');
}

export function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'test') {
    return testOnlyJwtSecret();
  }

  throw new Error('JWT_SECRET es obligatorio fuera de pruebas');
}
