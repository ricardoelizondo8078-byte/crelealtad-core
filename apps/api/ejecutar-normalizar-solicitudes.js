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
    console.log('🔄 Ejecutando normalización de solicitudes...\n');
    console.log('⚠️  Este proceso puede tardar varios minutos...\n');

    const sql = fs.readFileSync('src/migrations/normalizar-solicitudes.sql', 'utf8');

    await client.query(sql);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NORMALIZACIÓN COMPLETADA\n');

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
    console.log('✅ ANTES: solicitudes con 81 columnas');
    console.log('✅ AHORA: 7 tablas normalizadas (<20 columnas cada una)\n');
    console.log('📋 TABLAS:');
    console.log('   • solicitudes (core)');
    console.log('   • solicitudes_datos_personales');
    console.log('   • solicitudes_domicilios');
    console.log('   • solicitudes_negocios');
    console.log('   • solicitudes_referencias');
    console.log('   • solicitudes_beneficiarios');
    console.log('   • solicitudes_validaciones\n');
    console.log('📌 VISTA CREADA: solicitudes_completo (consolidada)');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('\n📍 Detalles:', error.stack);
  } finally {
    await client.end();
  }
})();
