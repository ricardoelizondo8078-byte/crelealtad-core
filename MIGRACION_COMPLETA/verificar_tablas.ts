import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'postgres',
});

async function verificarTablas() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 TABLAS EN LA BASE DE DATOS:\n');

    if (result.rows.length === 0) {
      console.log('⚠️  No hay tablas en el schema public');
    } else {
      result.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.table_name}`);
      });
      console.log(`\nTotal: ${result.rows.length} tablas`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTablas();
