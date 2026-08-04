const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cjpvpxnnjpnbkmemdpqy',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

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
  } finally {
    await client.end();
  }
})();
