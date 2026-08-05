/**
 * Setup de crelealtad_test desde schema dump de producción
 *
 * PRINCIPIO: Test debe correr contra el MISMO schema que producción.
 * Aplica el schema-dump.sql que es el dump completo de la base real.
 *
 * Ejecutar: node scripts/setup-test-db.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTestDb() {
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

    // 3. APLICAR SCHEMA DUMP
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: 'crelealtad_test',
    });

    await testClient.connect();
    console.log('\n=== PASO 3: Aplicar schema dump ===');

    const schemaDump = path.join(__dirname, '../../../database/schema-dump.sql');

    if (!fs.existsSync(schemaDump)) {
      throw new Error(`Schema dump no encontrado: ${schemaDump}`);
    }

    const sql = fs.readFileSync(schemaDump, 'utf8');
    await testClient.query(sql);
    console.log('✓ Schema aplicado');

    await testClient.end();

    console.log('\n=== PASO 4: Verificación final ===');
    await verificarSchema();

    console.log('\n✅ Setup completo. crelealtad_test es copia exacta de producción.');
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

  console.log('  ✓ grupos NO tiene tesorera_id ni ciclo_numero');

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

  console.log('  ✓ integrantes SÍ tiene folio');

  // Verificar las 5 FK de solicitudes con RESTRICT
  const fksRestrict = await testClient.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'solicitudes'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name IN ('persona_id', 'integrante_id', 'expediente_id', 'grupo_id', 'credito_id')
  `);

  const restricts = fksRestrict.rows.filter(r => r.delete_rule === 'RESTRICT');
  if (restricts.length !== 5) {
    console.error(`\n  ❌ ERROR: Solo ${restricts.length}/5 FK tienen RESTRICT`);
    throw new Error('Faltan FK con RESTRICT en solicitudes');
  }

  console.log('  ✓ 5 FK de solicitudes con ON DELETE RESTRICT');

  console.log('  ✓ Verificación OK: schema correcto');

  await testClient.end();
}

setupTestDb();
