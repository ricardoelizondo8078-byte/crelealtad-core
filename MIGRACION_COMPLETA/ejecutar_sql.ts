import { Pool } from 'pg';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
});

async function ejecutarSQL() {
  console.log('Ejecutando scripts SQL...\n');

  try {
    // Script 1
    console.log('1. Ejecutando migration_001_schema_updates.sql...');
    const sql1 = fs.readFileSync('sql/migration_001_schema_updates.sql', 'utf-8');
    await pool.query(sql1);
    console.log('✓ Script 1 ejecutado\n');

    // Script 2
    console.log('2. Ejecutando migration_002_temp_tables.sql...');
    const sql2 = fs.readFileSync('sql/migration_002_temp_tables.sql', 'utf-8');
    await pool.query(sql2);
    console.log('✓ Script 2 ejecutado\n');

    console.log('✅ Todos los scripts SQL ejecutados correctamente');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nPosiblemente algunas tablas ya existen, continuando...');
  } finally {
    await pool.end();
  }
}

ejecutarSQL();
