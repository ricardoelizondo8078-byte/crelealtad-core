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

    // Buscar todas las columnas de negocio
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
        AND column_name LIKE '%negocio%'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Columnas de negocio en solicitudes:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
