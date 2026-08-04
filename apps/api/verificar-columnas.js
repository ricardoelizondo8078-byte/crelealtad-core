const { Client } = require('pg');

async function verificarColumnas() {
  const client = new Client({
    connectionString: 'postgresql://postgres.cjpvpxnnjpnbkmemdpqy@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar columnas de personas
    const personasResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'personas'
      ORDER BY ordinal_position
    `);

    console.log('📋 COLUMNAS DE TABLA PERSONAS:');
    personasResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Verificar columnas de solicitudes
    const solicitudesResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND column_name LIKE '%telefono%' OR column_name LIKE '%cp%'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 COLUMNAS TELEFONO/CP DE TABLA SOLICITUDES:');
    solicitudesResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verificarColumnas();
