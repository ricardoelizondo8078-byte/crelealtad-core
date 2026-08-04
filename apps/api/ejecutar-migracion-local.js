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

    // Ejecutar la migración
    const sql = `ALTER TABLE solicitudes ALTER COLUMN negocio_desde_cuando TYPE varchar;`;
    console.log('📝 Ejecutando:', sql);

    await client.query(sql);
    console.log('✅ Migración ejecutada correctamente');

    // Verificar el cambio
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'solicitudes' AND column_name = 'negocio_desde_cuando'
    `);

    console.log('\n📋 Columna negocio_desde_cuando:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
})();
