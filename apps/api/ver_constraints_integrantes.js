const { DataSource } = require('typeorm');

async function verConstraintsIntegrantes() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  await ds.initialize();

  const r = await ds.query(`
    SELECT conname, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'integrantes'::regclass
    ORDER BY conname
  `);

  console.log('\n=== CONSTRAINTS EN TABLA integrantes ===\n');
  r.forEach(c => {
    console.log(`${c.conname}:`);
    console.log(`  ${c.definition}\n`);
  });

  await ds.destroy();
}

verConstraintsIntegrantes().catch(console.error);
