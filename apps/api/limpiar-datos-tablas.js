const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS
});

async function limpiarTodasLasTablas() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Obtener todas las tablas del schema public
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const tablas = result.rows.map(row => row.tablename);

    console.log('📋 TABLAS ENCONTRADAS:');
    console.log('═══════════════════════════════════════\n');
    tablas.forEach((tabla, i) => {
      console.log(`   ${i + 1}. ${tabla}`);
    });
    console.log('\n═══════════════════════════════════════\n');

    // Contar registros ANTES de limpiar
    console.log('📊 CONTEO DE REGISTROS (ANTES):');
    console.log('═══════════════════════════════════════\n');

    const conteoAntes = {};
    for (const tabla of tablas) {
      const count = await client.query(`SELECT COUNT(*) FROM "${tabla}"`);
      conteoAntes[tabla] = parseInt(count.rows[0].count);
      console.log(`   ${tabla.padEnd(30)} → ${conteoAntes[tabla]} registros`);
    }

    const totalAntes = Object.values(conteoAntes).reduce((a, b) => a + b, 0);
    console.log('\n   ' + '─'.repeat(45));
    console.log(`   TOTAL: ${totalAntes} registros\n`);
    console.log('═══════════════════════════════════════\n');

    // LIMPIAR DATOS (usando TRUNCATE CASCADE para manejar foreign keys)
    console.log('🧹 LIMPIANDO DATOS...\n');

    for (const tabla of tablas) {
      try {
        await client.query(`TRUNCATE TABLE "${tabla}" RESTART IDENTITY CASCADE`);
        console.log(`   ✅ ${tabla} - Limpiada`);
      } catch (err) {
        console.log(`   ⚠️  ${tabla} - Error: ${err.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════\n');

    // Verificar que se limpiaron
    console.log('📊 CONTEO DE REGISTROS (DESPUÉS):');
    console.log('═══════════════════════════════════════\n');

    for (const tabla of tablas) {
      const count = await client.query(`SELECT COUNT(*) FROM "${tabla}"`);
      const despues = parseInt(count.rows[0].count);
      const antes = conteoAntes[tabla];
      const estado = despues === 0 ? '✅' : '⚠️';
      console.log(`   ${estado} ${tabla.padEnd(30)} → ${antes} → ${despues}`);
    }

    console.log('\n═══════════════════════════════════════\n');

    // Verificar estructura (que las columnas sigan intactas)
    console.log('🔍 VERIFICANDO ESTRUCTURA DE TABLAS:');
    console.log('═══════════════════════════════════════\n');

    for (const tabla of tablas) {
      const columnas = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tabla]);

      console.log(`   📋 ${tabla} (${columnas.rows.length} columnas)`);
    }

    console.log('\n═══════════════════════════════════════\n');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log(`   → ${tablas.length} tablas procesadas`);
    console.log(`   → ${totalAntes} registros eliminados`);
    console.log('   → Estructura intacta (columnas, tipos, relaciones)\n');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

limpiarTodasLasTablas();
