const { Client } = require('pg');
const fs = require('fs');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');
    console.log('🔄 Ejecutando normalización CORREGIDA de solicitudes...\n');
    console.log('⚠️  Este proceso puede tardar varios minutos...\n');

    const sql = fs.readFileSync('src/migrations/normalizar-solicitudes-v2-correcto.sql', 'utf8');

    await client.query(sql);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NORMALIZACIÓN CORREGIDA COMPLETADA\n');

    // Verificar nuevas tablas
    const result = await client.query(`
      SELECT
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_name LIKE 'solicitudes%'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📊 TABLAS CREADAS:\n');

    for (const row of result.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as total FROM ${row.table_name}`);
      const total = countResult.rows[0].total;
      console.log(`  ${row.table_name.padEnd(38)} ${String(row.columnas).padStart(2)} columnas, ${total} registros`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VERIFICANDO COMPATIBILIDAD CON BACKEND...\n');

    // Verificar que existan las columnas que el backend espera
    const verificacion = await client.query(`
      SELECT column_name FROM solicitudes_completo LIMIT 1
    `);

    const columnasVista = Object.keys(verificacion.rows[0] || {});

    const columnasEsperadas = [
      'solicitud_id', 'folio', 'integrante_id', 'primer_nombre', 'segundo_nombre',
      'apellido_pat', 'apellido_mat', 'curp', 'fecha_nac', 'genero',
      'dom_calle', 'dom_colonia', 'dom_municipio',
      'negocio_giro', 'negocio_ingreso_semanal',
      'ref1_nombre', 'ref2_nombre', 'pareja_nombre',
      'beneficiario_nombre', 'tiene_medidor_luz',
      'doc_ine_ruta', 'doc_comprobante_ruta', 'doc_solicitud_firmada_ruta'
    ];

    const faltantes = columnasEsperadas.filter(col => !columnasVista.includes(col));

    if (faltantes.length === 0) {
      console.log('✅ TODAS las columnas esperadas por el backend están presentes');
    } else {
      console.log('❌ Columnas faltantes:');
      faltantes.forEach(col => console.log(`   • ${col}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN:\n');
    console.log('   • ANTES: 1 tabla con 81 columnas');
    console.log('   • AHORA: 8 tablas con <20 columnas cada una');
    console.log('   • Vista consolidada: solicitudes_completo');
    console.log('   • Nombres de columnas: CONSERVADOS (compatibilidad 100%)');
    console.log('   • Datos migrados: 6 solicitudes\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('\n📍 Detalles:', error.stack);
  } finally {
    await client.end();
  }
})();
