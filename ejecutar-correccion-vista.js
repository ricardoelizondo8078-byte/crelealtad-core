/**
 * Aplicar corrección a la vista solicitudes_completo
 */

const { Client } = require('./apps/api/node_modules/pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function aplicarCorreccion() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    console.log('========================================');
    console.log('APLICANDO CORRECCIÓN A VISTA');
    console.log('========================================\n');

    const sql = fs.readFileSync(
      './apps/api/src/migrations/corregir-vista-solicitudes-completo.sql',
      'utf8'
    );

    await client.query(sql);

    console.log('✅ Vista solicitudes_completo corregida\n');

    // Verificar columnas
    console.log('========================================');
    console.log('VERIFICACIÓN');
    console.log('========================================\n');

    const result = await client.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes_completo'
        AND column_name IN ('nombres', 'nombre_completo', 'doc_comprobante_credito_ruta', 'doc_comprobante_credito_fecha')
      ORDER BY column_name
    `);

    console.log('Columnas agregadas a la vista:');
    console.table(result.rows);

    console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE\n');
    console.log('Ahora ejecuta: node test-paso1-guardado.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

aplicarCorreccion();
