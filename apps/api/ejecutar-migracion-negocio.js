const { Client } = require('pg');
const fs = require('fs');

(async () => {
  const connectionString = 'postgresql://postgres.cjpvpxnnjpnbkmemdpqy@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Leer y ejecutar la migración
    const sql = fs.readFileSync('src/migrations/schema-v2/12-fix-negocio-desde-cuando.sql', 'utf8');
    console.log('📝 Ejecutando migración:');
    console.log(sql);

    await client.query(sql);
    console.log('✅ Migración ejecutada correctamente');

    // Verificar el cambio
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'solicitudes' AND column_name = 'negocio_desde_cuando'
    `);

    console.log('\n📋 Resultado:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
