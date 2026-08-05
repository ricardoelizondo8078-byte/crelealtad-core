const { Client } = require('../apps/api/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function testVista() {
  try {
    await client.connect();

    console.log('\n' + '='.repeat(80));
    console.log('PASO 1: Verificar si hay datos en solicitudes');
    console.log('='.repeat(80) + '\n');

    const countSolicitudes = await client.query(`
      SELECT COUNT(*) as total FROM solicitudes
    `);
    console.log(`Total de solicitudes: ${countSolicitudes.rows[0].total}`);

    const countDatosPersonales = await client.query(`
      SELECT COUNT(*) as total FROM solicitudes_datos_personales
    `);
    console.log(`Total de solicitudes_datos_personales: ${countDatosPersonales.rows[0].total}\n`);

    // Si no hay datos, intentar con datos de personas directamente
    console.log('='.repeat(80));
    console.log('PASO 2: SELECT DIRECTO contra la vista solicitudes_completo');
    console.log('='.repeat(80) + '\n');

    const vistaTest = await client.query(`
      SELECT
        solicitud_id,
        folio,
        persona_id,
        nombres,
        apellido_pat,
        apellido_mat,
        nombre_completo,
        primer_nombre,
        segundo_nombre
      FROM solicitudes_completo
      LIMIT 5
    `);

    if (vistaTest.rows.length > 0) {
      console.log('✅ DATOS ENCONTRADOS EN LA VISTA:\n');
      console.table(vistaTest.rows);
    } else {
      console.log('⚠️  La vista no tiene datos porque la tabla solicitudes está vacía.');
      console.log('Esto es normal si no se han creado solicitudes todavía.\n');

      console.log('='.repeat(80));
      console.log('PASO 3: Verificar estructura de la vista (sin datos)');
      console.log('='.repeat(80) + '\n');

      const estructura = await client.query(`
        SELECT
          column_name,
          data_type,
          CASE
            WHEN column_name IN ('nombres', 'nombre_completo') THEN '✅ NUEVO'
            WHEN column_name IN ('primer_nombre', 'segundo_nombre') THEN '⚠️  LEGACY'
            ELSE ''
          END as tipo
        FROM information_schema.columns
        WHERE table_name = 'solicitudes_completo'
          AND column_name IN ('nombres', 'nombre_completo', 'primer_nombre', 'segundo_nombre',
                              'apellido_pat', 'apellido_mat', 'folio', 'solicitud_id')
        ORDER BY
          CASE column_name
            WHEN 'solicitud_id' THEN 1
            WHEN 'folio' THEN 2
            WHEN 'nombres' THEN 3
            WHEN 'primer_nombre' THEN 4
            WHEN 'segundo_nombre' THEN 5
            WHEN 'apellido_pat' THEN 6
            WHEN 'apellido_mat' THEN 7
            WHEN 'nombre_completo' THEN 8
          END
      `);

      console.log('ESTRUCTURA DE LA VISTA:');
      console.table(estructura.rows);

      console.log('\n✅ La vista solicitudes_completo EXISTE y está bien definida');
      console.log('✅ Incluye los campos NUEVOS: nombres, nombre_completo');
      console.log('✅ Mantiene los campos LEGACY: primer_nombre, segundo_nombre');
      console.log('✅ NO hay errores de SQL al consultar la vista');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

testVista();
