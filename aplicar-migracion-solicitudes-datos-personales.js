/**
 * Migración: Quitar NOT NULL de primer_nombre y segundo_nombre
 * en la tabla solicitudes_datos_personales
 */

const { Client } = require('./apps/api/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function aplicarMigracion() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    console.log('========================================');
    console.log('APLICANDO MIGRACIÓN');
    console.log('========================================\n');

    // Quitar NOT NULL de primer_nombre
    console.log('1. Quitando NOT NULL de primer_nombre...');
    await client.query(`
      ALTER TABLE solicitudes_datos_personales
        ALTER COLUMN primer_nombre DROP NOT NULL
    `);
    console.log('   ✅ primer_nombre ahora permite NULL\n');

    // Quitar NOT NULL de segundo_nombre
    console.log('2. Quitando NOT NULL de segundo_nombre...');
    await client.query(`
      ALTER TABLE solicitudes_datos_personales
        ALTER COLUMN segundo_nombre DROP NOT NULL
    `);
    console.log('   ✅ segundo_nombre ahora permite NULL\n');

    // Agregar comentarios
    console.log('3. Agregando comentarios...');
    await client.query(`
      COMMENT ON COLUMN solicitudes_datos_personales.primer_nombre
        IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.'
    `);
    await client.query(`
      COMMENT ON COLUMN solicitudes_datos_personales.segundo_nombre
        IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.'
    `);
    console.log('   ✅ Comentarios agregados\n');

    // Verificar
    console.log('========================================');
    console.log('VERIFICACIÓN');
    console.log('========================================\n');

    const result = await client.query(`
      SELECT
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes_datos_personales'
        AND column_name IN ('primer_nombre', 'segundo_nombre', 'nombres', 'apellido_pat', 'apellido_mat')
      ORDER BY
        CASE column_name
          WHEN 'nombres' THEN 1
          WHEN 'apellido_pat' THEN 2
          WHEN 'apellido_mat' THEN 3
          WHEN 'primer_nombre' THEN 4
          WHEN 'segundo_nombre' THEN 5
        END
    `);

    console.log('Estado de columnas:');
    console.table(result.rows);

    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('Ahora ejecuta: node test-paso1-guardado.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

aplicarMigracion();
