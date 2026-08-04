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

    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes_old'
      ORDER BY ordinal_position
    `);

    console.log('📊 Columnas en solicitudes_old:\n');
    result.rows.forEach((row, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. ${row.column_name.padEnd(35)} (${row.data_type})`);
    });
    console.log(`\nTotal: ${result.rows.length} columnas`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
