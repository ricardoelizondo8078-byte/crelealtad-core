const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
});

async function listarColumnas() {
  const client = await pool.connect();

  try {
    console.log('✅ Conectado a la base de datos\n');

    // Listar TODAS las columnas de solicitudes
    const solicitudesResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      ORDER BY ordinal_position
    `);

    console.log('📋 COLUMNAS DE TABLA SOLICITUDES:');
    console.log('=====================================');
    solicitudesResult.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.column_name.padEnd(35)} | ${row.data_type.padEnd(20)} | NULL: ${row.is_nullable}`);
    });

    console.log('\n\n📋 COLUMNAS DE TABLA PERSONAS:');
    console.log('=====================================');

    const personasResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'personas'
      ORDER BY ordinal_position
    `);

    personasResult.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.column_name.padEnd(35)} | ${row.data_type.padEnd(20)} | NULL: ${row.is_nullable}`);
    });

    console.log('\n\n🔍 BUSCANDO COLUMNAS CRÍTICAS:');
    console.log('=====================================');

    const criticalColumns = [
      'dom_cp_id',
      'telefono_secundario',
      'negocio_cp_id',
      'dom_estado',
      'negocio_desde_cuando'
    ];

    for (const col of criticalColumns) {
      const solCheck = solicitudesResult.rows.find(r => r.column_name === col);
      const persCheck = personasResult.rows.find(r => r.column_name === col);

      if (solCheck) {
        console.log(`✅ ${col.padEnd(30)} → EXISTE en solicitudes (${solCheck.data_type})`);
      } else if (persCheck) {
        console.log(`✅ ${col.padEnd(30)} → EXISTE en personas (${persCheck.data_type})`);
      } else {
        console.log(`❌ ${col.padEnd(30)} → NO EXISTE en ninguna tabla`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listarColumnas();
