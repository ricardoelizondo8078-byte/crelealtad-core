const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const database = process.env.DB_TEST_NAME || 'crelealtad_test';
if (!database.toLowerCase().endsWith('_test')) {
  throw new Error(`La verificación sólo puede ejecutarse en una base *_test; recibida: ${database}`);
}

const migrationPath = path.join(
  __dirname,
  '../../../database/migrations/013_tesorera_por_expediente.sql',
);
const rollbackPath = path.join(
  __dirname,
  '../../../database/migrations/013_tesorera_por_expediente.rollback.sql',
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');
const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database,
});

async function fieldExists() {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'expedientes'
         AND column_name = 'tesorera_integrante_id'
     ) AS exists`,
  );
  return result.rows[0].exists === true;
}

async function verifyIntegrity() {
  await client.query('BEGIN');
  try {
    const group = await client.query(
      `INSERT INTO grupos (nombre)
       VALUES ('PRUEBA MIGRACION TESORERA')
       RETURNING id`,
    );
    const expedientes = await client.query(
      `INSERT INTO expedientes (grupo_id, estado)
       VALUES ($1, 'EN_DOCUMENTACION'), ($1, 'EN_DOCUMENTACION')
       RETURNING id`,
      [group.rows[0].id],
    );
    const integrantePropia = await client.query(
      `INSERT INTO integrantes (expediente_id, estado)
       VALUES ($1, 'SUJETA_CREDITO')
       RETURNING id`,
      [expedientes.rows[0].id],
    );
    const integranteAjena = await client.query(
      `INSERT INTO integrantes (expediente_id, estado)
       VALUES ($1, 'SUJETA_CREDITO')
       RETURNING id`,
      [expedientes.rows[1].id],
    );

    await client.query(
      `UPDATE expedientes
       SET tesorera_integrante_id = $1
       WHERE id = $2`,
      [integrantePropia.rows[0].id, expedientes.rows[0].id],
    );

    await client.query('SAVEPOINT tesorera_ajena');
    let rejected = false;
    try {
      await client.query(
        `UPDATE expedientes
         SET tesorera_integrante_id = $1
         WHERE id = $2`,
        [integranteAjena.rows[0].id, expedientes.rows[0].id],
      );
    } catch (error) {
      rejected = error.code === '23503';
      await client.query('ROLLBACK TO SAVEPOINT tesorera_ajena');
    }
    if (!rejected) {
      throw new Error('La FK no rechazó una tesorera perteneciente a otro expediente');
    }
  } finally {
    await client.query('ROLLBACK');
  }
}

async function run() {
  await client.connect();

  await client.query(rollbackSql);
  if (await fieldExists()) throw new Error('El rollback no retiró el campo de tesorera');

  await client.query(migrationSql);
  if (!(await fieldExists())) throw new Error('La migración no creó el campo de tesorera');
  await verifyIntegrity();

  await client.query(rollbackSql);
  if (await fieldExists()) throw new Error('La segunda prueba de rollback falló');

  await client.query(migrationSql);
  if (!(await fieldExists())) throw new Error('La migración final no quedó aplicada');

  console.log('✓ Migración 013, rollback e integridad entre expediente e integrante verificados');
}

run()
  .catch((error) => {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
