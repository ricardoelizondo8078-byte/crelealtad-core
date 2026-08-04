const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos local');

    // Buscar todas las columnas de documentos
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
        AND column_name LIKE 'doc_%'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Columnas de documentos en solicitudes:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
