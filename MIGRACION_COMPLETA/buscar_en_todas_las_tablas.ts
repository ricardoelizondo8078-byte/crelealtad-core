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

async function buscarDiasPagoEnTodasLasTablas() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  BUSCANDO DÍAS DE PAGO EN TODAS LAS TABLAS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Listar todas las tablas
  const tablas = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`📊 Total de tablas encontradas: ${tablas.rows.length}\n`);

  // 2. Buscar en cada tabla columnas con día, pago, fecha, desembolso
  for (const tabla of tablas.rows) {
    const nombreTabla = tabla.table_name;

    const columnas = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [nombreTabla]);

    // Filtrar columnas relevantes
    const columnasRelevantes = columnas.rows.filter(col =>
      col.column_name.toLowerCase().includes('dia') ||
      col.column_name.toLowerCase().includes('pago') ||
      col.column_name.toLowerCase().includes('fecha') ||
      col.column_name.toLowerCase().includes('desembolso') ||
      col.column_name.toLowerCase().includes('inicio') ||
      col.column_name.toLowerCase().includes('date')
    );

    if (columnasRelevantes.length > 0) {
      console.log(`\n🔍 Tabla: ${nombreTabla}`);
      console.log('═'.repeat(80));

      columnasRelevantes.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });

      // Ver datos de muestra
      try {
        const muestra = await pool.query(`
          SELECT * FROM ${nombreTabla} LIMIT 5;
        `);

        if (muestra.rows.length > 0) {
          console.log('\n   Muestra de datos:');

          muestra.rows.forEach((row, idx) => {
            console.log(`\n   Registro ${idx + 1}:`);

            columnasRelevantes.forEach(col => {
              const valor = row[col.column_name];
              if (valor !== null && valor !== undefined) {
                console.log(`      ${col.column_name}: ${valor}`);
              }
            });
          });
        }
      } catch (error: any) {
        console.log(`   ⚠️  Error consultando datos: ${error.message}`);
      }
    }
  }

  // 3. Buscar específicamente en tabla grupos
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  TABLA GRUPOS - DATOS COMPLETOS');
  console.log('═══════════════════════════════════════════════════════\n');

  const grupos = await pool.query(`
    SELECT * FROM grupos LIMIT 10;
  `);

  if (grupos.rows.length > 0) {
    console.log('Campos disponibles:');
    Object.keys(grupos.rows[0]).forEach((campo, idx) => {
      console.log(`${String(idx + 1).padStart(2)}. ${campo}`);
    });

    console.log('\n\nMuestra de 3 grupos:');
    grupos.rows.slice(0, 3).forEach((grupo, idx) => {
      console.log(`\n${idx + 1}. ${grupo.nombre}:`);
      Object.keys(grupo).forEach(campo => {
        if (grupo[campo] !== null && grupo[campo] !== undefined) {
          console.log(`   ${campo}: ${grupo[campo]}`);
        }
      });
    });
  }

  // 4. Buscar en tabla expedientes
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  TABLA EXPEDIENTES - DATOS COMPLETOS');
  console.log('═══════════════════════════════════════════════════════\n');

  const expedientes = await pool.query(`
    SELECT * FROM expedientes LIMIT 5;
  `);

  if (expedientes.rows.length > 0) {
    console.log('Campos disponibles:');
    Object.keys(expedientes.rows[0]).forEach((campo, idx) => {
      console.log(`${String(idx + 1).padStart(2)}. ${campo}`);
    });

    console.log('\n\nMuestra:');
    expedientes.rows.slice(0, 2).forEach((exp, idx) => {
      console.log(`\n${idx + 1}.:`);
      Object.keys(exp).forEach(campo => {
        if (exp[campo] !== null && exp[campo] !== undefined) {
          console.log(`   ${campo}: ${exp[campo]}`);
        }
      });
    });
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  await pool.end();
}

buscarDiasPagoEnTodasLasTablas()
  .then(() => {
    console.log('✅ Búsqueda completada\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
