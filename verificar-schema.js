const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.cjpvpxnnjpnbkmemdpqy@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function verificarSchema() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS DE SCHEMA - CRELEALTAD CORE         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Verificar conexión
    console.log('📡 Conectando a Supabase...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Listar tablas existentes
    console.log('📋 TABLAS EXISTENTES:');
    console.log('─'.repeat(50));
    const tablas = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    tablas.rows.forEach(row => console.log(`  • ${row.table_name}`));
    console.log('');

    // 3. Verificar PERSONAS
    console.log('🔍 TABLA: personas');
    console.log('─'.repeat(50));
    const personasColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'personas'
      ORDER BY ordinal_position
    `);

    const tieneTelefono = personasColumns.rows.find(r => r.column_name === 'telefono');
    const tieneMontoSolicitado = personasColumns.rows.find(r => r.column_name === 'monto_solicitado');

    console.log(`  telefono:          ${tieneTelefono ? '✅ Existe' : '❌ FALTA'}`);
    console.log(`  monto_solicitado:  ${tieneMontoSolicitado ? '✅ Existe' : '❌ FALTA'}`);
    console.log('');

    // 4. Verificar DOCUMENTOS (camelCase)
    console.log('🔍 TABLA: documentos');
    console.log('─'.repeat(50));
    const documentosColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'documentos'
      ORDER BY ordinal_position
    `);

    const camelCaseColumns = documentosColumns.rows.filter(r => /[A-Z]/.test(r.column_name));
    if (camelCaseColumns.length > 0) {
      console.log('  ❌ COLUMNAS EN camelCase DETECTADAS:');
      camelCaseColumns.forEach(col => console.log(`     - ${col.column_name}`));
    } else {
      console.log('  ✅ Todas las columnas en snake_case');
    }
    console.log('');

    // 5. Verificar SOLICITUDES
    console.log('🔍 TABLA: solicitudes');
    console.log('─'.repeat(50));
    const solicitudesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND (column_name ~ '[A-Z]' OR column_name LIKE '%_nuevo')
      ORDER BY column_name
    `);

    if (solicitudesColumns.rows.length > 0) {
      console.log('  ❌ PROBLEMAS DETECTADOS:');
      solicitudesColumns.rows.forEach(col => {
        if (/[A-Z]/.test(col.column_name)) {
          console.log(`     - ${col.column_name} (camelCase)`);
        } else if (col.column_name.endsWith('_nuevo')) {
          console.log(`     - ${col.column_name} (sufijo temporal)`);
        }
      });
    } else {
      console.log('  ✅ Sin problemas de nomenclatura');
    }
    console.log('');

    // 6. Resumen
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  RESUMEN DE PROBLEMAS                          ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    const problemas = [];
    if (!tieneTelefono) problemas.push('❌ personas: falta columna "telefono"');
    if (!tieneMontoSolicitado) problemas.push('❌ personas: falta columna "monto_solicitado"');
    if (camelCaseColumns.length > 0) problemas.push(`❌ documentos: ${camelCaseColumns.length} columnas en camelCase`);
    if (solicitudesColumns.rows.length > 0) problemas.push(`❌ solicitudes: ${solicitudesColumns.rows.length} columnas con problemas`);

    if (problemas.length === 0) {
      console.log('  ✅ No se encontraron problemas críticos');
    } else {
      console.log(`  Total de problemas encontrados: ${problemas.length}\n`);
      problemas.forEach(p => console.log(`  ${p}`));
    }

    console.log('\n');
    client.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarSchema();
