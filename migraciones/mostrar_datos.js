const { Client } = require('../apps/api/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function mostrarDatos() {
  try {
    await client.connect();

    console.log('\n' + '='.repeat(80));
    console.log('TABLA: personas - 10 REGISTROS MIGRADOS');
    console.log('='.repeat(80) + '\n');

    const personas = await client.query(`
      SELECT
        folio,
        primer_nombre as "primer_nombre (VIEJO)",
        segundo_nombre as "segundo_nombre (VIEJO)",
        nombres as "nombres (NUEVO)",
        apellido_pat,
        apellido_mat,
        nombre_completo as "nombre_completo (GENERADO)"
      FROM personas
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.table(personas.rows);

    console.log('\n' + '='.repeat(80));
    console.log('TABLA: solicitudes_datos_personales - 10 REGISTROS MIGRADOS');
    console.log('='.repeat(80) + '\n');

    const solicitudes = await client.query(`
      SELECT
        primer_nombre as "primer_nombre (VIEJO)",
        segundo_nombre as "segundo_nombre (VIEJO)",
        nombres as "nombres (NUEVO)",
        apellido_pat,
        apellido_mat,
        nombre_completo as "nombre_completo (GENERADO)"
      FROM solicitudes_datos_personales
      WHERE nombres IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.table(solicitudes.rows);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await client.end();
  }
}

mostrarDatos();
