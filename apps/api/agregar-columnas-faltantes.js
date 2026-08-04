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

    // Primero listar tablas para ver qué hay
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 TABLAS DISPONIBLES:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log('');

    // 1. Agregar telefono_secundario a personas si no existe
    console.log('📝 Agregando telefono_secundario a tabla personas...');
    await client.query(`
      ALTER TABLE personas
      ADD COLUMN IF NOT EXISTS telefono_secundario VARCHAR;
    `);
    console.log('✅ Columna telefono_secundario agregada\n');

    // 2. Verificar que dom_cp_id existe en solicitudes
    const cpCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes' AND column_name = 'dom_cp_id'
    `);

    if (cpCheck.rows.length === 0) {
      console.log('📝 Agregando dom_cp_id a tabla solicitudes...');
      await client.query(`
        ALTER TABLE solicitudes
        ADD COLUMN IF NOT EXISTS dom_cp_id VARCHAR;
      `);
      console.log('✅ Columna dom_cp_id agregada\n');
    } else {
      console.log('✅ Columna dom_cp_id ya existe\n');
    }

    // 3. Verificar que negocio_cp_id existe en solicitudes
    const negocioCpCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes' AND column_name = 'negocio_cp_id'
    `);

    if (negocioCpCheck.rows.length === 0) {
      console.log('📝 Agregando negocio_cp_id a tabla solicitudes...');
      await client.query(`
        ALTER TABLE solicitudes
        ADD COLUMN IF NOT EXISTS negocio_cp_id VARCHAR;
      `);
      console.log('✅ Columna negocio_cp_id agregada\n');
    } else {
      console.log('✅ Columna negocio_cp_id ya existe\n');
    }

    console.log('✅ TODAS LAS COLUMNAS FALTANTES AGREGADAS');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

agregarColumnas();
