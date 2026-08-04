const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: process.env.DB_PASSWORD || process.env.DB_PASS, database: 'crelealtad' });
  try {
    await client.connect();
    const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`);
    console.log('📋 Tablas en la BD:\n');
    result.rows.forEach(r => console.log(`  • ${r.table_name}`));
  } catch (error) { console.error(error.message); } finally { await client.end(); }
})();
