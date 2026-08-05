/**
 * Setup correcto de crelealtad_test
 *
 * PRINCIPIO: Test debe correr contra el MISMO schema que producción.
 * NUNCA inventar DDL propio. SIEMPRE aplicar migraciones reales.
 *
 * Ejecutar: node scripts/setup-test-db-CORRECTO.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRACIONES = [
  // 1. Schema inicial (tablas legacy con solicitantes)
  '../../../database/migrations/001_initial_schema.sql',

  // 2. Schema v2: refactorización a estructura moderna
  '../src/migrations/schema-v2/01-crear-tablas-nuevas.sql',
  '../src/migrations/schema-v2/02-migrar-grupos.sql',
  '../src/migrations/schema-v2/03-migrar-expedientes.sql',
  '../src/migrations/schema-v2/04-migrar-integrantes.sql', // solicitantes -> integrantes
  '../src/migrations/schema-v2/05-migrar-solicitudes.sql',
  '../src/migrations/schema-v2/06-crear-creditos-cobranza.sql',
  // 07-seed-datos.sql NO aplicar en test (son datos de producción)
  // 08-verificacion.sql es visual, no modifica schema
  '../src/migrations/schema-v2/09-fix-personas-columns.sql',
  '../src/migrations/schema-v2/10-fix-documentos-naming.sql',
  '../src/migrations/schema-v2/11-fix-solicitudes-naming.sql',
  '../src/migrations/schema-v2/12-fix-negocio-desde-cuando.sql',

  // 3. Ajustes adicionales
  // migration_001_schema_updates crea campos legacy, NO aplicar después de v2
  // '../../../database/migrations/migration_001_schema_updates.sql',
  '../../../database/migrations/migration_003_performance_indexes.sql',
  // migration_004 es RLS (row level security), NO necesario en test

  // 4. Solicitudes normalizadas (8 tablas)
  '../src/migrations/crear-solicitudes-normalizadas.sql',
  '../src/migrations/permitir-null-columnas-legacy.sql',
  '../src/migrations/corregir-vista-solicitudes-completo.sql',
];

async function recrearTestDb() {
  // Conectar a postgres para crear/borrar BD
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('✓ Conectado a PostgreSQL');

    // 1. BORRAR base existente
    console.log('\n=== PASO 1: Borrar crelealtad_test si existe ===');
    await adminClient.query('DROP DATABASE IF EXISTS crelealtad_test');
    console.log('✓ Base borrada');

    // 2. CREAR base vacía
    console.log('\n=== PASO 2: Crear crelealtad_test vacía ===');
    await adminClient.query('CREATE DATABASE crelealtad_test');
    console.log('✓ Base creada');

    await adminClient.end();

    // 3. APLICAR MIGRACIONES
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: 'crelealtad_test',
    });

    await testClient.connect();
    console.log('\n=== PASO 3: Aplicar migraciones ===');

    // Habilitar extensión uuid ANTES de migraciones
    await testClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✓ Extensión uuid-ossp habilitada');

    for (const migracion of MIGRACIONES) {
      const rutaCompleta = path.join(__dirname, migracion);

      if (!fs.existsSync(rutaCompleta)) {
        console.warn(`⚠️  SKIP: ${migracion} no existe`);
        continue;
      }

      console.log(`\n  Aplicando: ${migracion}`);
      const sql = fs.readFileSync(rutaCompleta, 'utf8');

      try {
        await testClient.query(sql);
        console.log(`  ✓ Migración aplicada`);
      } catch (error) {
        console.error(`  ❌ ERROR en migración ${migracion}:`);
        console.error(`     ${error.message}`);
        throw error;
      }
    }

    await testClient.end();

    console.log('\n=== PASO 4: Verificación final ===');
    await verificarSchema();

    console.log('\n✅ Setup completo. crelealtad_test tiene schema correcto.');
  } catch (error) {
    console.error('\n❌ Error en setup:', error.message);
    process.exit(1);
  }
}

async function verificarSchema() {
  const testClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: 'crelealtad_test',
  });

  await testClient.connect();

  // Verificar columnas críticas
  const columnas = await testClient.query(`
    SELECT table_name, count(*) as num_columnas
    FROM information_schema.columns
    WHERE table_name IN ('grupos', 'integrantes', 'expedientes', 'personas')
    GROUP BY table_name
    ORDER BY table_name
  `);

  console.log('\n  Columnas por tabla:');
  columnas.rows.forEach(row => {
    console.log(`    ${row.table_name}: ${row.num_columnas} columnas`);
  });

  // Verificar que grupos NO tenga tesorera_id ni ciclo_numero
  const gruposExtras = await testClient.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'grupos'
      AND column_name IN ('tesorera_id', 'ciclo_numero')
  `);

  if (gruposExtras.rows.length > 0) {
    console.error('\n  ❌ ERROR: grupos tiene columnas inventadas:');
    gruposExtras.rows.forEach(row => console.error(`     - ${row.column_name}`));
    throw new Error('Schema test tiene columnas que contradicen arquitectura');
  }

  // Verificar que integrantes SÍ tenga folio
  const integrantesFolio = await testClient.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'integrantes'
      AND column_name = 'folio'
  `);

  if (integrantesFolio.rows.length === 0) {
    console.error('\n  ❌ ERROR: integrantes NO tiene columna folio');
    throw new Error('Schema test le falta columna folio en integrantes');
  }

  console.log('  ✓ Verificación OK: schema correcto');

  await testClient.end();
}

recrearTestDb();
