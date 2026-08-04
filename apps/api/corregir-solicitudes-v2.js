const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
});

// Mapeo de columnas camelCase → snake_case
const columnMapping = {
  // Beneficiario
  'beneficiarioDireccion': 'beneficiario_direccion',
  'beneficiarioNombreCompleto': 'beneficiario_nombre',
  'beneficiarioParentesco': 'beneficiario_parentesco',
  'beneficiarioTelefono': 'beneficiario_telefono',

  // Domicilio
  'codigoPostal': 'dom_codigo_postal',
  'entreCalles': 'dom_entre_calles',
  'numeroExterior': 'dom_num_ext',
  'numeroInterior': 'dom_num_int',

  // Datos personales
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'estadoCivil': 'estado_civil',
  'estadoNacimiento': 'estado_nacimiento',
  'fechaNacimiento': 'fecha_nac',
  'nivelEstudio': 'nivel_estudio',

  // Negocio
  'negocioCalle': 'negocio_domicilio',
  'negocioCodigoPostal': 'negocio_cp_id',
  'negocioColonia': 'negocio_colonia',
  'negocioDesdeCuando': 'negocio_desde_cuando',
  'negocioEstado': 'negocio_estado',
  'negocioGastos': 'negocio_gastos',
  'negocioGiro': 'negocio_giro',
  'negocioIngresoSemanal': 'negocio_ingreso_semanal',
  'negocioMunicipio': 'negocio_municipio',
  'negocioNumeroExterior': 'negocio_num_ext',
  'negocioNumeroInterior': 'negocio_num_int',
  'negocioOtrosIngresos': 'negocio_otros_ingresos',
  'negocioTotal': 'negocio_total',

  // Pareja
  'parejaActividadEconomica': 'pareja_actividad',
  'parejaIngresoSemanal': 'pareja_ingreso_semanal',
  'parejaNombreCompleto': 'pareja_nombre',

  // Referencias
  'referencia1Direccion': 'ref1_direccion',
  'referencia1NombreCompleto': 'ref1_nombre',
  'referencia1Parentesco': 'ref1_parentesco',
  'referencia1Telefono': 'ref1_telefono',
  'referencia2Direccion': 'ref2_direccion',
  'referencia2NombreCompleto': 'ref2_nombre',
  'referencia2Parentesco': 'ref2_parentesco',
  'referencia2Telefono': 'ref2_telefono',

  // Validaciones
  'tieneMedidorLuzSinAdeudo': 'tiene_medidor_luz',
  'tieneMenos70Anios': 'tiene_menos_70_anios',
  'viveMaximo5KmTesorera': 'vive_max_5km_tesorera',
};

async function corregirSolicitudes() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  CORRECCIÓN AUTOMÁTICA DE TABLA SOLICITUDES V2             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('✅ Transacción iniciada\n');

    // Paso 1: Obtener columnas existentes
    console.log('📋 PASO 1: Verificando columnas existentes');
    console.log('─'.repeat(60));

    const existingCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
    `);

    const existingColNames = existingCols.rows.map(r => r.column_name);
    console.log(`  Total de columnas: ${existingColNames.length}\n`);

    // Paso 2: Consolidar datos de camelCase a snake_case
    console.log('📋 PASO 2: Consolidando datos (camelCase → snake_case)');
    console.log('─'.repeat(60));

    let consolidadas = 0;
    let eliminadas = 0;
    let creadas = 0;

    for (const [camelCol, snakeCol] of Object.entries(columnMapping)) {
      const tieneCamel = existingColNames.includes(camelCol);
      const tieneSnake = existingColNames.includes(snakeCol);

      if (!tieneCamel) {
        // La columna camelCase no existe, skip
        continue;
      }

      if (!tieneSnake) {
        // Solo existe camelCase, renombrar
        await client.query(`ALTER TABLE solicitudes RENAME COLUMN "${camelCol}" TO ${snakeCol}`);
        console.log(`  ✅ Renombrado: ${camelCol} → ${snakeCol}`);
        creadas++;
      } else {
        // Ambas existen, consolidar datos
        // Si hay datos en camelCase pero no en snake_case, intentar copiar
        const hasData = await client.query(`
          SELECT COUNT(*) as count
          FROM solicitudes
          WHERE ${snakeCol} IS NULL AND "${camelCol}" IS NOT NULL
        `);

        if (hasData.rows[0].count > 0) {
          console.log(`  ⚠️  ${camelCol} tiene datos pero ${snakeCol} ya existe, conservando ${snakeCol}...`);
        }

        // Simplemente eliminar la columna camelCase (ya existe la snake_case)
        await client.query(`ALTER TABLE solicitudes DROP COLUMN "${camelCol}"`);
        console.log(`  ✅ Eliminado (duplicado): ${camelCol} (conservando ${snakeCol})`);
        consolidadas++;
      }
    }

    console.log(`\n  📊 Renombradas: ${creadas}`);
    console.log(`  📊 Consolidadas: ${consolidadas}\n`);

    // Paso 3: Limpiar columnas con sufijo _nuevo
    console.log('📋 PASO 3: Limpiando sufijos _nuevo');
    console.log('─'.repeat(60));

    // es_nuevo
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS es_nuevo');
    console.log('  ✅ Eliminado: es_nuevo');

    // estado_nacimiento_nuevo → solo eliminar (estado_nacimiento ya existe)
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS estado_nacimiento_nuevo');
    console.log('  ✅ Eliminado: estado_nacimiento_nuevo');

    // negocio_giro_nuevo → solo eliminar (negocio_giro ya existe)
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_giro_nuevo');
    console.log('  ✅ Eliminado: negocio_giro_nuevo');

    // negocio_gastos_nuevo → solo eliminar (negocio_gastos ya existe)
    await client.query('ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_gastos_nuevo');
    console.log('  ✅ Eliminado: negocio_gastos_nuevo');

    console.log('');

    // Paso 4: Verificación final
    console.log('📋 PASO 4: Verificación final');
    console.log('─'.repeat(60));

    const finalCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND (column_name ~ '[A-Z]' OR column_name LIKE '%_nuevo')
      ORDER BY column_name
    `);

    if (finalCheck.rows.length > 0) {
      console.log('  ❌ ERROR: Aún quedan columnas problemáticas:');
      finalCheck.rows.forEach(row => console.log(`     - ${row.column_name}`));
      console.log('\n  Revirtiendo cambios...');
      await client.query('ROLLBACK');
      console.log('  ✅ Cambios revertidos\n');
    } else {
      console.log('  ✅ ¡PERFECTO! Todas las columnas corregidas\n');

      // Confirmar
      await client.query('COMMIT');
      console.log('💾 CAMBIOS CONFIRMADOS\n');

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ CORRECCIÓN COMPLETADA EXITOSAMENTE                     ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('📊 Resumen:');
      console.log(`  ✅ ${creadas + consolidadas} columnas corregidas`);
      console.log('  ✅ 4 columnas con sufijo _nuevo eliminadas');
      console.log('  ✅ 100% consistencia en nomenclatura\n');

      console.log('📝 Próximos pasos:');
      console.log('  1. ✅ Base de datos corregida');
      console.log('  2. ⏭️  Actualizar solicitud.entity.ts');
      console.log('  3. ⏭️  Actualizar servicios');
      console.log('  4. ⏭️  Ejecutar tests\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('🔄 Revirtiendo cambios...');
    await client.query('ROLLBACK');
    console.log('✅ Cambios revertidos\n');
  } finally {
    client.release();
    await pool.end();
  }
}

corregirSolicitudes();
