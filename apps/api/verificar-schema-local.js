const { Pool } = require('pg');

// Conectar a PostgreSQL LOCAL (no Supabase)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS, // Contraseña por defecto, puede cambiar
  database: 'crelealtad', // Nombre correcto de la base de datos
});

async function verificarSchema() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS DE SCHEMA - PostgreSQL LOCAL        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    console.log('📡 Conectando a PostgreSQL local (localhost:5432)...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa\n');

    // Verificar qué base de datos estamos usando
    const dbInfo = await client.query('SELECT current_database(), current_user');
    console.log(`📊 Base de datos: ${dbInfo.rows[0].current_database}`);
    console.log(`👤 Usuario: ${dbInfo.rows[0].current_user}\n`);

    // 2. Listar todas las bases de datos
    console.log('💾 BASES DE DATOS DISPONIBLES:');
    console.log('─'.repeat(50));
    const databases = await client.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `);
    databases.rows.forEach(row => console.log(`  • ${row.datname}`));
    console.log('');

    // 3. Listar tablas existentes
    console.log('📋 TABLAS EXISTENTES EN ' + dbInfo.rows[0].current_database + ':');
    console.log('─'.repeat(50));
    const tablas = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablas.rows.length === 0) {
      console.log('  ⚠️  No se encontraron tablas en esta base de datos');
      console.log('  ℹ️  Puede que necesites crear la base de datos primero\n');
      client.release();
      await pool.end();
      return;
    }

    tablas.rows.forEach(row => console.log(`  • ${row.table_name}`));
    console.log('');

    // Verificar si existen las tablas que necesitamos
    const tablasEsperadas = ['personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos'];
    const tablasExistentes = tablas.rows.map(r => r.table_name);
    const tablasQueExisten = tablasEsperadas.filter(t => tablasExistentes.includes(t));

    if (tablasQueExisten.length === 0) {
      console.log('⚠️  No se encontró ninguna de las tablas esperadas');
      console.log('   Tablas esperadas:', tablasEsperadas.join(', '));
      console.log('\n   Parece que necesitas ejecutar las migraciones primero.\n');
      client.release();
      await pool.end();
      return;
    }

    // 4. Verificar PERSONAS (si existe)
    if (tablasExistentes.includes('personas')) {
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
    }

    // 5. Verificar DOCUMENTOS (si existe)
    if (tablasExistentes.includes('documentos')) {
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
    }

    // 6. Verificar SOLICITUDES (si existe)
    if (tablasExistentes.includes('solicitudes')) {
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
    }

    // 7. Resumen
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  RESUMEN                                       ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log(`  Tablas encontradas: ${tablasQueExisten.length}/${tablasEsperadas.length}`);
    console.log(`  Tablas: ${tablasQueExisten.join(', ')}\n`);

    client.release();

  } catch (error) {
    console.error('\n❌ Error al conectar:');
    console.error('   Mensaje:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Verifica usuario/contraseña (por defecto: postgres/postgres)');
    console.error('   3. Verifica que existe la base de datos "crelealtad_db"');
    console.error('\n   Para crear la base de datos, abre pgAdmin y ejecuta:');
    console.error('   CREATE DATABASE crelealtad_db;\n');
  } finally {
    await pool.end();
  }
}

verificarSchema();
