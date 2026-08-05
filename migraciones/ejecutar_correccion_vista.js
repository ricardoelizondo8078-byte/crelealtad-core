const { Client } = require('../apps/api/node_modules/pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function corregirVista() {
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');

    console.log('='.repeat(60));
    console.log('CORRIGIENDO VISTA solicitudes_completo');
    console.log('='.repeat(60));
    console.log('');

    const sql = fs.readFileSync('05_CORREGIR_vista_solicitudes_completo.sql', 'utf8');
    await client.query(sql);

    console.log('✅ Vista recreada exitosamente\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

corregirVista();
