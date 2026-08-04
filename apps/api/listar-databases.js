const { Pool } = require('pg');

// Conectar a la base de datos por defecto 'postgres'
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'postgres', // Base de datos por defecto
});

async function listarDatabases() {
  console.log('\n📊 LISTANDO BASES DE DATOS EN PostgreSQL LOCAL\n');
  console.log('─'.repeat(50));

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `);

    console.log('\n💾 Bases de datos disponibles:\n');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.datname} (${row.size})`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log('\n💡 Para conectarte a alguna, actualiza el archivo');
    console.log('   verificar-schema-local.js con el nombre correcto\n');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listarDatabases();
