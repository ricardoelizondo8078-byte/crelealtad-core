const { Client } = require('../apps/api/node_modules/pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function verificar() {
  try {
    await client.connect();
    const sql = fs.readFileSync('verificar_migracion.sql', 'utf8');
    const result = await client.query(sql);
    
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verificar();
