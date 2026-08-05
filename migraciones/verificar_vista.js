const { Client } = require('../apps/api/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function verificarVista() {
  try {
    await client.connect();

    console.log('\n' + '='.repeat(80));
    console.log('VERIFICACIÓN: SELECT contra vista solicitudes_completo');
    console.log('='.repeat(80) + '\n');

    // Verificar estructura de la vista
    const estructura = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes_completo'
        AND column_name IN ('nombres', 'nombre_completo', 'primer_nombre', 'segundo_nombre', 'apellido_pat', 'apellido_mat')
      ORDER BY ordinal_position
    `);

    console.log('COLUMNAS DE NOMBRES EN LA VISTA:');
    console.table(estructura.rows);

    // Intentar hacer SELECT de datos
    const datos = await client.query(`
      SELECT
        solicitud_id,
        nombres as "nombres (NUEVO)",
        apellido_pat,
        apellido_mat,
        nombre_completo as "nombre_completo (GENERADO)",
        primer_nombre as "primer_nombre (LEGACY)",
        segundo_nombre as "segundo_nombre (LEGACY)"
      FROM solicitudes_completo
      WHERE nombres IS NOT NULL
      LIMIT 5
    `);

    console.log('\nDATOS DE LA VISTA (5 registros):');
    if (datos.rows.length > 0) {
      console.table(datos.rows);
      console.log('\n✅ La vista solicitudes_completo FUNCIONA CORRECTAMENTE');
      console.log('✅ Contiene los campos NUEVOS (nombres, nombre_completo)');
      console.log('✅ Mantiene los campos LEGACY (primer_nombre, segundo_nombre) para compatibilidad');
    } else {
      console.log('⚠️  La vista no contiene datos (tabla solicitudes vacía o sin datos personales)');
      console.log('✅ Pero la vista SÍ funciona (no hay error de SQL)');
    }

  } catch (error) {
    console.error('\n❌ ERROR AL CONSULTAR LA VISTA:', error.message);
  } finally {
    await client.end();
  }
}

verificarVista();
