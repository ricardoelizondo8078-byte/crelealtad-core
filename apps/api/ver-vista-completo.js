const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: process.env.DB_PASSWORD || process.env.DB_PASS, database: 'crelealtad' });
  try {
    await client.connect();
    const result = await client.query("SELECT COUNT(*) as cols FROM information_schema.columns WHERE table_name = 'solicitudes_completo'");
    console.log('📊 Vista solicitudes_completo tiene', result.rows[0].cols, 'columnas\n');
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'solicitudes_completo' ORDER BY ordinal_position");
    console.log('✅ Todas las columnas:\n');
    cols.rows.forEach((r, i) => console.log(`  ${String(i+1).padStart(2)}. ${r.column_name}`));
  } catch (e) { console.error(e.message); } finally { await client.end(); }
})();
