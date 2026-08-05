const { Client } = require('./apps/api/node_modules/pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function ejecutarMigracion() {
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');

    // Leer el archivo SQL
    const sql = fs.readFileSync(
      './apps/api/src/migrations/permitir-null-columnas-legacy.sql',
      'utf8'
    );

    console.log('========================================');
    console.log('EJECUTANDO MIGRACIÓN');
    console.log('========================================\n');

    // Ejecutar la migración
    const result = await client.query(sql);

    console.log('✅ MIGRACIÓN EJECUTADA EXITOSAMENTE\n');

    // Verificar el resultado
    console.log('========================================');
    console.log('VERIFICACIÓN: Estado de columnas');
    console.log('========================================\n');

    const verification = await client.query(`
      SELECT
        table_name,
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('personas', 'solicitudes_datos_personales')
        AND column_name IN ('primer_nombre', 'segundo_nombre', 'nombres', 'nombre_completo')
      ORDER BY table_name,
        CASE
          WHEN column_name = 'nombres' THEN 1
          WHEN column_name = 'primer_nombre' THEN 2
          WHEN column_name = 'segundo_nombre' THEN 3
          WHEN column_name = 'nombre_completo' THEN 4
        END
    `);

    console.table(verification.rows);

    console.log('\n========================================');
    console.log('RESUMEN');
    console.log('========================================\n');

    verification.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '✅ NULL' : '❌ NOT NULL';
      console.log(`${row.table_name}.${row.column_name}: ${nullable}`);
    });

    console.log('\n✅ MIGRACIÓN COMPLETADA\n');
    console.log('Ahora puedes crear integrantes sin error.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

ejecutarMigracion();
