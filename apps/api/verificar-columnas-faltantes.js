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

    console.log('🔍 VERIFICANDO COLUMNAS FALTANTES EN NORMALIZACIÓN\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Columnas que tenía la tabla VIEJA (solicitud.entity.ts)
    const columnasViejas = {
      // Core
      'id': 'CORE',
      'folio': 'CORE',
      'integrante_id': 'CORE',
      'integrante_id_old': 'CORE',
      'persona_id': 'CORE',
      'expediente_id': 'CORE',
      'grupo_id': 'CORE',
      'ciclo_numero': 'CORE',
      'numero_credito': 'CORE',
      'credito_id': 'CORE',
      'monto_autorizado': 'CORE',

      // Datos personales (snapshot)
      'primer_nombre': 'DATOS_PERSONALES',
      'segundo_nombre': 'DATOS_PERSONALES',
      'apellido_pat': 'DATOS_PERSONALES',
      'apellido_mat': 'DATOS_PERSONALES',
      'curp': 'DATOS_PERSONALES',
      'fecha_nac': 'DATOS_PERSONALES',
      'nacionalidad': 'DATOS_PERSONALES',
      'estado_nacimiento': 'DATOS_PERSONALES',
      'genero': 'DATOS_PERSONALES',
      'estado_civil': 'DATOS_PERSONALES',
      'ocupacion': 'DATOS_PERSONALES',
      'nivel_estudio': 'DATOS_PERSONALES',
      'telefono': 'DATOS_PERSONALES',  // ⚠️ PUEDE SER FALTANTE

      // Domicilio
      'dom_calle': 'DOMICILIO',
      'dom_num_ext': 'DOMICILIO',
      'dom_num_int': 'DOMICILIO',
      'dom_entre_calles': 'DOMICILIO',
      'dom_cp_id': 'DOMICILIO',
      'dom_codigo_postal': 'DOMICILIO',
      'dom_colonia': 'DOMICILIO',
      'dom_municipio': 'DOMICILIO',
      'dom_estado': 'DOMICILIO',
      'dom_telefono': 'DOMICILIO',

      // Referencias
      'ref1_nombre': 'REFERENCIAS',
      'ref1_parentesco': 'REFERENCIAS',
      'ref1_telefono': 'REFERENCIAS',
      'ref1_direccion': 'REFERENCIAS',
      'ref2_nombre': 'REFERENCIAS',
      'ref2_parentesco': 'REFERENCIAS',
      'ref2_telefono': 'REFERENCIAS',
      'ref2_direccion': 'REFERENCIAS',

      // Pareja
      'pareja_nombre': 'REFERENCIAS',
      'pareja_actividad': 'REFERENCIAS',
      'pareja_ingreso_semanal': 'REFERENCIAS',

      // Negocio
      'negocio_domicilio': 'NEGOCIO',
      'negocio_num_ext': 'NEGOCIO',
      'negocio_num_int': 'NEGOCIO',
      'negocio_estado': 'NEGOCIO',
      'negocio_cp_id': 'NEGOCIO',
      'negocio_codigo_postal': 'NEGOCIO',
      'negocio_colonia': 'NEGOCIO',
      'negocio_municipio': 'NEGOCIO',
      'negocio_desde_cuando': 'NEGOCIO',
      'negocio_giro': 'NEGOCIO',
      'negocio_ingreso_semanal': 'NEGOCIO',
      'negocio_otros_ingresos': 'NEGOCIO',
      'negocio_gastos': 'NEGOCIO',
      'negocio_total': 'NEGOCIO',

      // Beneficiario
      'beneficiario_nombre': 'BENEFICIARIO',
      'beneficiario_parentesco': 'BENEFICIARIO',
      'beneficiario_telefono': 'BENEFICIARIO',
      'beneficiario_direccion': 'BENEFICIARIO',

      // Validaciones
      'tiene_medidor_luz': 'VALIDACIONES',
      'vive_max_5km_tesorera': 'VALIDACIONES',
      'tiene_menos_70_anios': 'VALIDACIONES',

      // Documentos
      'doc_ine_ruta': 'DOCUMENTOS',
      'doc_ine_fecha': 'DOCUMENTOS',
      'doc_comprobante_ruta': 'DOCUMENTOS',
      'doc_comprobante_fecha': 'DOCUMENTOS',
      'doc_ine_beneficiario_ruta': 'DOCUMENTOS',
      'doc_ine_beneficiario_fecha': 'DOCUMENTOS',
      'doc_solicitud_firmada_ruta': 'DOCUMENTOS',
      'doc_solicitud_firmada_fecha': 'DOCUMENTOS',

      // Timestamps
      'created_at': 'TIMESTAMPS',
      'updated_at': 'TIMESTAMPS'
    };

    // Obtener columnas NUEVAS de TODAS las tablas normalizadas
    const tablas = [
      'solicitudes',
      'solicitudes_datos_personales',
      'solicitudes_domicilios',
      'solicitudes_negocios',
      'solicitudes_referencias',
      'solicitudes_beneficiarios',
      'solicitudes_validaciones'
    ];

    const columnasNuevas = [];

    for (const tabla of tablas) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
      `, [tabla]);

      result.rows.forEach(row => {
        if (!['id', 'solicitud_id', 'created_at', 'updated_at', 'tipo'].includes(row.column_name)) {
          columnasNuevas.push(row.column_name);
        }
      });
    }

    // Detectar columnas FALTANTES
    const columnasFaltantes = [];

    for (const [columna, grupo] of Object.entries(columnasViejas)) {
      if (!['id', 'created_at', 'updated_at'].includes(columna)) {
        if (!columnasNuevas.includes(columna)) {
          columnasFaltantes.push({ columna, grupo });
        }
      }
    }

    console.log('📊 COLUMNAS FALTANTES EN LA NORMALIZACIÓN:\n');

    if (columnasFaltantes.length === 0) {
      console.log('✅ No hay columnas faltantes\n');
    } else {
      const grupos = {};
      columnasFaltantes.forEach(item => {
        if (!grupos[item.grupo]) grupos[item.grupo] = [];
        grupos[item.grupo].push(item.columna);
      });

      for (const [grupo, cols] of Object.entries(grupos)) {
        console.log(`❌ GRUPO: ${grupo}`);
        cols.forEach(col => {
          console.log(`   • ${col}`);
        });
        console.log('');
      }

      console.log(`\n🚨 TOTAL COLUMNAS FALTANTES: ${columnasFaltantes.length}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE COLUMNAS NUEVAS:\n');

    for (const tabla of tablas) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tabla]);

      console.log(`${tabla}:`);
      result.rows.forEach(row => {
        console.log(`   • ${row.column_name}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
