const { Client } = require('pg');

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

    console.log('🔍 VERIFICANDO COMPATIBILIDAD BACKEND/BD\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Ver qué columnas tiene la tabla solicitudes ACTUAL en BD
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      ORDER BY ordinal_position
    `);

    console.log('📊 TABLA solicitudes EN BD (estructura NUEVA):\n');
    console.log('Total columnas:', result.rows.length, '\n');

    const columnasEnBD = result.rows.map(r => r.column_name);

    result.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(30)} (${col.data_type})`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⚠️  ANÁLISIS:\n');

    // Columnas que el backend espera (de solicitud.entity.ts)
    const columnasBackend = [
      'id', 'folio', 'integrante_id', 'integrante_id_old', 'persona_id', 'expediente_id',
      'grupo_id', 'ciclo_numero', 'numero_credito', 'credito_id',
      'primer_nombre', 'segundo_nombre', 'apellido_pat', 'apellido_mat',
      'curp', 'fecha_nac', 'nacionalidad', 'estado_nacimiento', 'genero', 'estado_civil',
      'ocupacion', 'nivel_estudio',
      'dom_calle', 'dom_num_ext', 'dom_num_int', 'dom_entre_calles', 'dom_cp_id',
      'dom_codigo_postal', 'dom_colonia', 'dom_municipio', 'dom_estado', 'dom_telefono',
      'ref1_nombre', 'ref1_parentesco', 'ref1_telefono', 'ref1_direccion',
      'ref2_nombre', 'ref2_parentesco', 'ref2_telefono', 'ref2_direccion',
      'pareja_nombre', 'pareja_actividad', 'pareja_ingreso_semanal',
      'negocio_domicilio', 'negocio_num_ext', 'negocio_num_int', 'negocio_estado',
      'negocio_cp_id', 'negocio_codigo_postal', 'negocio_colonia', 'negocio_municipio',
      'negocio_desde_cuando', 'negocio_giro', 'negocio_ingreso_semanal',
      'negocio_otros_ingresos', 'negocio_gastos', 'negocio_total',
      'beneficiario_nombre', 'beneficiario_parentesco', 'beneficiario_telefono',
      'beneficiario_direccion',
      'tiene_medidor_luz', 'vive_max_5km_tesorera', 'tiene_menos_70_anios',
      'doc_ine_ruta', 'doc_ine_fecha', 'doc_comprobante_ruta', 'doc_comprobante_fecha',
      'doc_ine_beneficiario_ruta', 'doc_ine_beneficiario_fecha',
      'doc_solicitud_firmada_ruta', 'doc_solicitud_firmada_fecha',
      'monto_autorizado', 'created_at', 'updated_at'
    ];

    const columnasFaltantes = columnasBackend.filter(col => !columnasEnBD.includes(col));
    const columnasExtra = columnasEnBD.filter(col => !columnasBackend.includes(col));

    console.log('❌ Backend espera columnas que NO existen en BD:\n');
    columnasFaltantes.slice(0, 20).forEach(col => {
      console.log(`   • ${col}`);
    });
    if (columnasFaltantes.length > 20) {
      console.log(`   ... y ${columnasFaltantes.length - 20} más\n`);
    }

    console.log(`\n📊 Total columnas faltantes: ${columnasFaltantes.length}`);
    console.log(`📊 Total columnas en entity: ${columnasBackend.length}`);
    console.log(`📊 Total columnas en BD: ${columnasEnBD.length}`);

    console.log('\n🚨 CONCLUSIÓN: ❌ NO ES COMPATIBLE');
    console.log('   • Backend intentará escribir en columnas que NO existen');
    console.log('   • App móvil fallará al guardar solicitudes');
    console.log('   • Se requiere actualizar entities + service + DTOs\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
