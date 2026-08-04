const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
});

async function agregarColumnas() {
  const client = await pool.connect();

  try {
    console.log('✅ Conectado a la base de datos\n');

    // 1. Agregar dom_codigo_postal VARCHAR
    console.log('📝 Agregando dom_codigo_postal a tabla solicitudes...');
    await client.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS dom_codigo_postal VARCHAR(5);
    `);
    console.log('✅ Columna dom_codigo_postal agregada\n');

    // 2. Agregar negocio_codigo_postal VARCHAR
    console.log('📝 Agregando negocio_codigo_postal a tabla solicitudes...');
    await client.query(`
      ALTER TABLE solicitudes
      ADD COLUMN IF NOT EXISTS negocio_codigo_postal VARCHAR(5);
    `);
    console.log('✅ Columna negocio_codigo_postal agregada\n');

    console.log('✅✅✅ TODAS LAS COLUMNAS AGREGADAS EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

agregarColumnas();
