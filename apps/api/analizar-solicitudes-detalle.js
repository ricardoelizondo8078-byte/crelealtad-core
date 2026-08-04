const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
});

async function analizarDetalle() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 ANÁLISIS DETALLADO DE TABLA SOLICITUDES\n');
    console.log('─'.repeat(70));

    // Obtener TODAS las columnas
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      ORDER BY column_name
    `);

    console.log('\n📋 TODAS LAS COLUMNAS (' + result.rows.length + ' total):\n');

    const camelCase = [];
    const snakeCase = [];
    const conNuevo = [];

    result.rows.forEach(row => {
      const col = row.column_name;

      if (col.includes('_nuevo')) {
        conNuevo.push(col);
      } else if (/[A-Z]/.test(col)) {
        camelCase.push(col);
      } else {
        snakeCase.push(col);
      }
    });

    console.log('✅ COLUMNAS CORRECTAS (snake_case): ' + snakeCase.length);
    console.log('❌ COLUMNAS EN camelCase: ' + camelCase.length);
    console.log('⚠️  COLUMNAS CON _nuevo: ' + conNuevo.length);
    console.log('');

    if (camelCase.length > 0) {
      console.log('❌ Columnas en camelCase que necesitan corrección:');
      console.log('─'.repeat(70));
      camelCase.forEach(col => console.log(`   ${col}`));
      console.log('');
    }

    if (conNuevo.length > 0) {
      console.log('⚠️  Columnas con sufijo _nuevo:');
      console.log('─'.repeat(70));
      conNuevo.forEach(col => console.log(`   ${col}`));
      console.log('');
    }

    console.log('✅ Columnas ya correctas (muestra):');
    console.log('─'.repeat(70));
    snakeCase.slice(0, 10).forEach(col => console.log(`   ${col}`));
    if (snakeCase.length > 10) {
      console.log(`   ... y ${snakeCase.length - 10} más`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analizarDetalle();
