const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { MigrationLedger } = require('./migration-ledger');
const { registerMigrationBaseline } = require('./setup-test-db');

function databaseClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const sslEnabled = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
  const ssl = sslEnabled
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

  if (databaseUrl) {
    return new Client({ connectionString: databaseUrl, ssl });
  }

  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl,
  });
}

async function initializeEmptyDatabase(databaseName) {
  const client = databaseClient();
  await client.connect();

  try {
    const tableCountResult = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);
    const tableCount = tableCountResult.rows[0].total;

    if (tableCount > 0) {
      console.log(`Base ${databaseName}: esquema existente; no se reinicializa.`);
      return;
    }

    if (process.env.PRODUCTION_DB_BOOTSTRAP_CONFIRM !== databaseName) {
      throw new Error(
        `PRODUCTION_DB_BOOTSTRAP_CONFIRM debe ser exactamente ${databaseName} para inicializar una base vacía`,
      );
    }

    const schemaPath = path.resolve(__dirname, '../../../database/schema-dump.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      .replace(/^\\(?:un)?restrict\b.*$/gm, '');

    await client.query('BEGIN');
    try {
      await client.query(schemaSql);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    const baselineCount = await registerMigrationBaseline(client);
    console.log(`Base ${databaseName}: esquema inicial y ${baselineCount} migraciones registradas.`);
  } finally {
    await client.end();
  }
}

async function applyPendingMigrations(databaseName) {
  if (process.env.MIGRATION_APPLY_CONFIRM !== databaseName) {
    throw new Error(`MIGRATION_APPLY_CONFIRM debe ser exactamente ${databaseName}`);
  }

  const ledger = new MigrationLedger(databaseName);
  await ledger.connect();
  try {
    const migrations = ledger.discover();
    const latest = migrations.at(-1);
    if (!latest) throw new Error('No se encontraron migraciones canónicas');
    await ledger.apply(latest.sequence);
  } finally {
    await ledger.close();
  }
}

async function main() {
  const databaseName = process.env.DB_NAME?.trim();
  if (!databaseName) throw new Error('DB_NAME es obligatorio');
  if (!process.env.DATABASE_URL?.trim() && !process.env.DB_HOST?.trim()) {
    throw new Error('DATABASE_URL o DB_HOST es obligatorio');
  }

  await initializeEmptyDatabase(databaseName);
  await applyPendingMigrations(databaseName);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  applyPendingMigrations,
  databaseClient,
  initializeEmptyDatabase,
  main,
};
