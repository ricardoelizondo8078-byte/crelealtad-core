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
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
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
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
      database: 'crelealtad_test',
    });

    await testClient.connect();
    console.log('\n=== PASO 3: Aplicar schema dump ===');

    const schemaDump = path.join(__dirname, '../../../database/schema-dump.sql');

    if (!fs.existsSync(schemaDump)) {
      throw new Error(`Schema dump no encontrado: ${schemaDump}`);
    }

    const sql = fs.readFileSync(schemaDump, 'utf8')
      // pg_dump 17 agrega metacomandos exclusivos de psql; el cliente pg sólo acepta SQL.
      .replace(/^\\(?:un)?restrict\b.*$/gm, '');
    await testClient.query(sql);
    console.log('✓ Schema aplicado');

    // El dump termina con search_path vacío para evitar resoluciones implícitas.
    // Las migraciones revisadas del proyecto crean objetos en el schema public.
    await testClient.query('SET search_path TO public');

    const postDumpMigrations = [
      '026_confirmacion_telefonos_entrevista.sql',
      '027_telefono_utilizado_llamadas_verificacion.sql',
      '028_historial_unificado_evidencias_llamada.sql',
      '029_sincronizar_telefonos_confirmados_personas.sql',
      '030_respuesta_medidor_luz_verificacion.sql',
      '031_persistencia_general_entrevista.sql',
      '032_evidencias_historial_crediticio_entrevista.sql',
    ];
    for (const migrationName of postDumpMigrations) {
      const migrationPath = path.join(
        __dirname,
        '../../../database/migrations',
        migrationName,
      );
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migración posterior al dump no encontrada: ${migrationPath}`);
      }
      await testClient.query(fs.readFileSync(migrationPath, 'utf8'));
      console.log(`✓ Migración aplicada: ${migrationName}`);
    }

    await seedTechnicalTestIdentity(testClient);
    console.log('✓ Identidad técnica de pruebas creada');

    await testClient.end();

    console.log('\n=== PASO 4: Verificación final ===');
    await verificarSchema();

    console.log('\n✅ Setup completo. crelealtad_test es copia exacta de producción.');
  } catch (error) {
    console.error('\n❌ Error en setup:', error.message);
    process.exit(1);
  }
}

async function seedTechnicalTestIdentity(client) {
  await client.query(`
    INSERT INTO public.roles (id, folio, nombre, descripcion, permisos, estado)
    VALUES (
      '00000000-0000-4000-8000-000000000101',
      'ROL-TEST',
      'PRUEBAS_AUTOMATIZADAS',
      'Identidad técnica exclusiva de crelealtad_test',
      '{"modulos":[],"acciones":[]}'::jsonb,
      'ACTIVO'
    );

    INSERT INTO public.sucursales (id, folio, nombre, estado)
    VALUES (
      '00000000-0000-4000-8000-000000000102',
      'SUC-TEST',
      'SUCURSAL PRUEBAS AUTOMATIZADAS',
      'ACTIVA'
    );

    INSERT INTO public.usuarios (
      id,
      folio,
      nombre,
      password_hash,
      rol_id,
      sucursal_id,
      estado,
      abreviatura
    ) VALUES (
      '00000000-0000-4000-8000-000000000103',
      'USR-TEST',
      'USUARIO PRUEBAS',
      'NO_ES_CREDENCIAL_DE_LOGIN',
      '00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000102',
      'ACTIVO',
      'TEST_AUTOMATION'
    );

    INSERT INTO public.empleados (id, folio, usuario_id, tipo_empleado)
    VALUES (
      '00000000-0000-4000-8000-000000000104',
      'EMP-TEST',
      '00000000-0000-4000-8000-000000000103',
      'ASESOR'
    );
  `);
}

async function verificarSchema() {
  const testClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
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

  const llamadasVerificacion = await testClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'verificacion_llamadas'
  `);

  if (llamadasVerificacion.rows.length !== 1) {
    throw new Error('Schema test no contiene verificacion_llamadas');
  }

  console.log('  ✓ verificacion_llamadas existe');

  const imagenesDomicilioVerificacion = await testClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'verificacion_imagenes_domicilio'
  `);

  if (imagenesDomicilioVerificacion.rows.length !== 1) {
    throw new Error('Schema test no contiene verificacion_imagenes_domicilio');
  }

  console.log('  ✓ verificacion_imagenes_domicilio existe');

  const evidenciasNegocioEntrevista = await testClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'verificacion_entrevista_evidencias'
  `);

  if (evidenciasNegocioEntrevista.rows.length !== 1) {
    throw new Error('Schema test no contiene verificacion_entrevista_evidencias');
  }

  console.log('  ✓ verificacion_entrevista_evidencias existe');

  const origenEvidenciaNegocio = await testClient.query(`
    SELECT pg_get_constraintdef(oid) AS definicion
    FROM pg_constraint
    WHERE conrelid = 'verificacion_entrevista_evidencias'::regclass
      AND conname = 'verificacion_entrevista_evidencias_fuente_check'
  `);

  const definicionOrigen = origenEvidenciaNegocio.rows[0]?.definicion || '';
  if (!definicionOrigen.includes('CAMARA')) {
    throw new Error('Schema test no permite origen CAMARA para evidencias del negocio');
  }

  console.log('  ✓ evidencias del negocio permiten nuevas capturas CAMARA');

  const tiposEvidenciaEntrevista = await testClient.query(`
    SELECT pg_get_constraintdef(oid) AS definicion
    FROM pg_constraint
    WHERE conrelid = 'verificacion_entrevista_evidencias'::regclass
      AND conname = 'verificacion_entrevista_evidencias_tipo_check'
  `);

  const definicionTiposEvidencia = tiposEvidenciaEntrevista.rows[0]?.definicion || '';
  if (
    !definicionTiposEvidencia.includes('HISTORIAL_CREDITO_ACTIVO')
    || !definicionTiposEvidencia.includes('HISTORIAL_CREDITO_INACTIVO')
  ) {
    throw new Error('Schema test no permite las evidencias del historial crediticio');
  }

  console.log('  ✓ evidencias de Entrevista incluyen ambos estados del historial crediticio');

  const tablasEntrevista = await testClient.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'verificacion_entrevistas',
        'verificacion_entrevista_familiares',
        'verificacion_entrevista_desacuerdos_montos',
        'verificacion_entrevista_evidencias'
      )
  `);

  if (tablasEntrevista.rows.length !== 4) {
    throw new Error('Schema test no contiene la persistencia general de Entrevista');
  }

  console.log('  ✓ persistencia general de Entrevista contiene sus 4 tablas');

  const columnasUbicacionEntrevista = await testClient.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'verificacion_entrevista_evidencias'
      AND column_name IN (
        'registrada_por',
        'foto_capturada_at',
        'ubicacion_latitud',
        'ubicacion_longitud',
        'ubicacion_precision_metros',
        'ubicacion_capturada_at',
        'ubicacion_fuente'
      )
  `);

  if (columnasUbicacionEntrevista.rows.length !== 7) {
    throw new Error('Evidencias de Entrevista no conservan actor, fecha y ubicación completos');
  }

  console.log('  ✓ evidencias de Entrevista conservan actor, fecha y ubicación');

  const columnasGeocodificacion = await testClient.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'solicitudes_domicilios'
      AND column_name IN (
        'dom_latitud',
        'dom_longitud',
        'dom_geocodificacion_fuente',
        'dom_geocodificacion_fecha'
      )
  `);

  if (columnasGeocodificacion.rows.length !== 4) {
    throw new Error('Schema test no contiene la geocodificacion vigente de domicilios');
  }

  console.log('  ✓ solicitudes_domicilios conserva las 4 columnas de geocodificación');

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
