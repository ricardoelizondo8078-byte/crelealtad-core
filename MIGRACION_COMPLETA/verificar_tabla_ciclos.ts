import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

async function verificarTablaCiclos() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VERIFICANDO TABLA CICLOS');
  console.log('═══════════════════════════════════════════════════════\n');

  const result = await pool.query(`
    SELECT COUNT(*) as total FROM ciclos;
  `);

  console.log(`📊 Total de ciclos en la tabla: ${result.rows[0].total}\n`);

  if (parseInt(result.rows[0].total) > 0) {
    const muestra = await pool.query(`
      SELECT
        c.id,
        g.nombre as grupo_nombre,
        c.numero_ciclo,
        c.fecha_inicio,
        c.dia_pago,
        c.estado
      FROM ciclos c
      LEFT JOIN grupos g ON g.id = c.grupo_id
      LIMIT 10;
    `);

    console.log('📋 Muestra de ciclos en DB:\n');
    muestra.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.grupo_nombre} - Ciclo ${row.numero_ciclo}`);
      console.log(`   Fecha: ${row.fecha_inicio}`);
      console.log(`   Día: ${row.dia_pago}`);
      console.log(`   Estado: ${row.estado}\n`);
    });
  } else {
    console.log('❌ La tabla ciclos está VACÍA\n');
  }

  await pool.end();
}

verificarTablaCiclos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
