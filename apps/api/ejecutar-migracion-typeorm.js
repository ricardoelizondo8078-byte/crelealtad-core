const { DataSource } = require('typeorm');

(async () => {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    username: 'postgres.cjpvpxnnjpnbkmemdpqy',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    // Ejecutar la migración
    const sql = `ALTER TABLE solicitudes ALTER COLUMN negocio_desde_cuando TYPE varchar;`;
    console.log('📝 Ejecutando:', sql);

    await AppDataSource.query(sql);
    console.log('✅ Migración ejecutada correctamente');

    // Verificar el cambio
    const result = await AppDataSource.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'solicitudes' AND column_name = 'negocio_desde_cuando'
    `);

    console.log('\n📋 Columna negocio_desde_cuando:');
    console.table(result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await AppDataSource.destroy();
  }
})();
