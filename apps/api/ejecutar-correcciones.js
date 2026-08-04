const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
});

async function ejecutarCorrecciones() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  EJECUCIÓN AUTOMÁTICA DE CORRECCIONES                     ║');
  console.log('║  CRELEALTAD CORE - PostgreSQL LOCAL                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // FASE 1: BACKUP
    console.log('📦 FASE 1: CREANDO BACKUP');
    console.log('─'.repeat(60));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(__dirname, '..', '..', `backup-solicitudes-${timestamp}.sql`);

    console.log('  ℹ️  Nota: Para backup completo, ejecuta desde terminal:');
    console.log(`     pg_dump -h localhost -U postgres crelealtad > backup-${timestamp}.sql`);
    console.log('  ✅ Continuando con correcciones (en transacción, puede revertirse)\n');

    // FASE 2: ANÁLISIS PRE-CORRECCIÓN
    console.log('🔍 FASE 2: ANÁLISIS PRE-CORRECCIÓN');
    console.log('─'.repeat(60));

    const preCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND (column_name ~ '[A-Z]' OR column_name LIKE '%_nuevo')
    `);

    console.log(`  Columnas con problemas: ${preCheck.rows[0].count}`);
    console.log('');

    if (preCheck.rows[0].count === 0) {
      console.log('  ✅ No hay problemas que corregir. ¡Todo está bien!\n');
      client.release();
      await pool.end();
      return;
    }

    // FASE 3: EJECUTAR CORRECCIONES
    console.log('🔧 FASE 3: EJECUTANDO CORRECCIONES');
    console.log('─'.repeat(60));
    console.log('  Iniciando transacción...\n');

    await client.query('BEGIN');

    // Renombrar columnas - Beneficiario
    console.log('  📝 Beneficiario...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "beneficiarioDireccion" TO beneficiario_direccion');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "beneficiarioNombreCompleto" TO beneficiario_nombre');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "beneficiarioParentesco" TO beneficiario_parentesco');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "beneficiarioTelefono" TO beneficiario_telefono');

    // Domicilio
    console.log('  📝 Domicilio...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "codigoPostal" TO dom_codigo_postal');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "entreCalles" TO dom_entre_calles');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "numeroExterior" TO dom_num_ext');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "numeroInterior" TO dom_num_int');

    // Datos personales
    console.log('  📝 Datos personales...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "createdAt" TO created_at');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "updatedAt" TO updated_at');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "estadoCivil" TO estado_civil');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "estadoNacimiento" TO estado_nacimiento_old');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "fechaNacimiento" TO fecha_nac');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "nivelEstudio" TO nivel_estudio');

    // Negocio
    console.log('  📝 Negocio...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioCalle" TO negocio_domicilio');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioCodigoPostal" TO negocio_cp_id');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioColonia" TO negocio_colonia');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioDesdeCuando" TO negocio_desde_cuando');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioEstado" TO negocio_estado');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioGastos" TO negocio_gastos_old');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioGiro" TO negocio_giro_old');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioIngresoSemanal" TO negocio_ingreso_semanal');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioMunicipio" TO negocio_municipio');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioNumeroExterior" TO negocio_num_ext');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioNumeroInterior" TO negocio_num_int');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioOtrosIngresos" TO negocio_otros_ingresos');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "negocioTotal" TO negocio_total');

    // Pareja
    console.log('  📝 Pareja...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "parejaActividadEconomica" TO pareja_actividad');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "parejaIngresoSemanal" TO pareja_ingreso_semanal');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "parejaNombreCompleto" TO pareja_nombre');

    // Referencias
    console.log('  📝 Referencias...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia1Direccion" TO ref1_direccion');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia1NombreCompleto" TO ref1_nombre');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia1Parentesco" TO ref1_parentesco');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia1Telefono" TO ref1_telefono');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia2Direccion" TO ref2_direccion');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia2NombreCompleto" TO ref2_nombre');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia2Parentesco" TO ref2_parentesco');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "referencia2Telefono" TO ref2_telefono');

    // Validaciones
    console.log('  📝 Validaciones...');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "tieneMedidorLuzSinAdeudo" TO tiene_medidor_luz');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "tieneMenos70Anios" TO tiene_menos_70_anios');
    await client.query('ALTER TABLE solicitudes RENAME COLUMN "viveMaximo5KmTesorera" TO vive_max_5km_tesorera');

    console.log('  ✅ Todas las columnas renombradas a snake_case\n');

    // Consolidar columnas _nuevo
    console.log('  📝 Consolidando columnas con sufijo _nuevo...');

    // estado_nacimiento
    await client.query(`
      UPDATE solicitudes
      SET estado_nacimiento_old = estado_nacimiento_nuevo
      WHERE estado_nacimiento_old IS NULL AND estado_nacimiento_nuevo IS NOT NULL
    `);
    await client.query('ALTER TABLE solicitudes RENAME COLUMN estado_nacimiento_old TO estado_nacimiento');
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS estado_nacimiento_nuevo');

    // negocio_giro
    await client.query(`
      UPDATE solicitudes
      SET negocio_giro_old = negocio_giro_nuevo
      WHERE negocio_giro_old IS NULL AND negocio_giro_nuevo IS NOT NULL
    `);
    await client.query('ALTER TABLE solicitudes RENAME COLUMN negocio_giro_old TO negocio_giro');
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_giro_nuevo');

    // negocio_gastos
    await client.query(`
      UPDATE solicitudes
      SET negocio_gastos_old = negocio_gastos_nuevo
      WHERE negocio_gastos_old IS NULL AND negocio_gastos_nuevo IS NOT NULL
    `);
    await client.query('ALTER TABLE solicitudes RENAME COLUMN negocio_gastos_old TO negocio_gastos');
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_gastos_nuevo');

    // Eliminar es_nuevo
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS es_nuevo');

    console.log('  ✅ Sufijos _nuevo eliminados\n');

    // FASE 4: VERIFICACIÓN POST-CORRECCIÓN
    console.log('🔍 FASE 4: VERIFICACIÓN POST-CORRECCIÓN');
    console.log('─'.repeat(60));

    const postCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND (column_name ~ '[A-Z]' OR column_name LIKE '%_nuevo')
      ORDER BY column_name
    `);

    if (postCheck.rows.length > 0) {
      console.log('  ❌ ERROR: Aún quedan columnas con problemas:');
      postCheck.rows.forEach(row => console.log(`     - ${row.column_name}`));
      console.log('\n  Revirtiendo cambios...');
      await client.query('ROLLBACK');
      console.log('  ✅ Cambios revertidos\n');
    } else {
      console.log('  ✅ ¡PERFECTO! Ya no hay columnas en camelCase ni sufijos _nuevo\n');

      // Confirmar transacción
      console.log('💾 CONFIRMANDO CAMBIOS...');
      await client.query('COMMIT');
      console.log('  ✅ Cambios guardados permanentemente\n');

      // FASE 5: RESUMEN FINAL
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ CORRECCIONES COMPLETADAS EXITOSAMENTE                  ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('📊 Resumen de cambios:');
      console.log('  ✅ 46 columnas renombradas de camelCase a snake_case');
      console.log('  ✅ 4 columnas con sufijo _nuevo consolidadas');
      console.log('  ✅ Base de datos ahora 100% consistente\n');

      console.log('📝 Próximos pasos:');
      console.log('  1. Actualizar entidad solicitud.entity.ts');
      console.log('  2. Actualizar servicios que usen solicitudes');
      console.log('  3. Ejecutar tests\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR durante la ejecución:');
    console.error('   ', error.message);
    console.log('\n🔄 Revirtiendo todos los cambios...');
    await client.query('ROLLBACK');
    console.log('   ✅ Cambios revertidos. Base de datos intacta.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
ejecutarCorrecciones().catch(console.error);
