import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

async function verificarDiasPagoExistentes() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VERIFICANDO DÍAS DE PAGO EXISTENTES');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Ver días_visita en expedientes
  console.log('📊 Consultando dias_visita en tabla expedientes...\n');

  const expedientes = await pool.query(`
    SELECT
      e.id,
      g.nombre as grupo_nombre,
      e.dias_visita
    FROM expedientes e
    JOIN grupos g ON g.id = e.grupo_id
    ORDER BY g.nombre
    LIMIT 50;
  `);

  console.log(`Total de expedientes consultados: ${expedientes.rows.length}`);

  const conDias = expedientes.rows.filter(e => e.dias_visita && e.dias_visita.trim() !== '');
  const sinDias = expedientes.rows.filter(e => !e.dias_visita || e.dias_visita.trim() === '');

  console.log(`   Con dias_visita: ${conDias.length}`);
  console.log(`   Sin dias_visita: ${sinDias.length}\n`);

  if (conDias.length > 0) {
    console.log('✅ GRUPOS CON DÍAS DE VISITA (muestra):');
    conDias.slice(0, 20).forEach((e, idx) => {
      console.log(`${String(idx + 1).padStart(3)}. ${e.grupo_nombre.padEnd(40)} → ${e.dias_visita}`);
    });

    // Ver valores únicos
    const valoresUnicos = new Set(conDias.map(e => e.dias_visita));
    console.log(`\n   Valores únicos de dias_visita: ${Array.from(valoresUnicos).join(', ')}`);
  }

  // 2. Ver créditos con fecha_desembolso
  console.log('\n\n📊 Consultando fecha_desembolso en tabla creditos...\n');

  const creditos = await pool.query(`
    SELECT COUNT(*) as total FROM creditos;
  `);

  console.log(`Total de créditos en DB: ${creditos.rows[0].total}`);

  if (parseInt(creditos.rows[0].total) > 0) {
    const creditosMuestra = await pool.query(`
      SELECT
        c.id,
        c.monto,
        c.fecha_desembolso,
        g.nombre as grupo_nombre
      FROM creditos c
      LEFT JOIN ciclos ci ON ci.id = c.ciclo_id
      LEFT JOIN grupos g ON g.id = ci.grupo_id
      LIMIT 20;
    `);

    console.log(`\nMuestra de créditos:`);
    creditosMuestra.rows.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.grupo_nombre || 'SIN GRUPO'} - Monto: ${c.monto} - Desembolso: ${c.fecha_desembolso || 'SIN FECHA'}`);
    });
  }

  // 3. Verificar si hay TODOS los expedientes
  console.log('\n\n📊 Verificando TODOS los expedientes...\n');

  const todosExpedientes = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN dias_visita IS NOT NULL AND dias_visita != '' THEN 1 END) as con_dias,
      COUNT(CASE WHEN dias_visita IS NULL OR dias_visita = '' THEN 1 END) as sin_dias
    FROM expedientes;
  `);

  const stats = todosExpedientes.rows[0];
  console.log(`Total de expedientes: ${stats.total}`);
  console.log(`   Con dias_visita: ${stats.con_dias} (${((stats.con_dias / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sin dias_visita: ${stats.sin_dias} (${((stats.sin_dias / stats.total) * 100).toFixed(1)}%)`);

  // 4. Si hay dias_visita, obtener mapeo grupo → dia
  if (parseInt(stats.con_dias) > 0) {
    console.log('\n\n📋 MAPEO COMPLETO: GRUPO → DÍA DE VISITA');
    console.log('═'.repeat(80));

    const mapeo = await pool.query(`
      SELECT
        g.id as grupo_id,
        g.nombre as grupo_nombre,
        e.dias_visita
      FROM expedientes e
      JOIN grupos g ON g.id = e.grupo_id
      WHERE e.dias_visita IS NOT NULL AND e.dias_visita != ''
      ORDER BY g.nombre;
    `);

    console.log(`\nTotal de grupos con día de visita: ${mapeo.rows.length}\n`);

    mapeo.rows.forEach((row, idx) => {
      if (idx < 50) {
        console.log(`${String(idx + 1).padStart(3)}. ${row.grupo_nombre.padEnd(40)} → ${row.dias_visita}`);
      }
    });

    if (mapeo.rows.length > 50) {
      console.log(`\n   ... y ${mapeo.rows.length - 50} más`);
    }

    // Guardar mapeo completo
    const fs = require('fs');
    const mapeoObj: any = {};

    mapeo.rows.forEach(row => {
      mapeoObj[row.grupo_nombre] = {
        grupo_id: row.grupo_id,
        dia_visita: row.dias_visita
      };
    });

    fs.writeFileSync(
      'data/logs/mapeo_grupos_dias_visita.json',
      JSON.stringify(mapeoObj, null, 2)
    );

    console.log(`\n✅ Mapeo guardado en: data/logs/mapeo_grupos_dias_visita.json`);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  await pool.end();
}

verificarDiasPagoExistentes()
  .then(() => {
    console.log('✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
