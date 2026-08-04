import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

interface EmpleadoCompleto {
  // Usuario
  usuario_email: string;
  usuario_password: string;
  usuario_rol_id: string;
  usuario_sucursal_id: string;
  usuario_estado: string;
  usuario_folio?: string;
  usuario_nombre?: string;
  usuario_apellido_paterno?: string;
  usuario_apellido_materno?: string;

  // Empleado
  empleado_tipo_empleado: string;
  empleado_folio?: string;
  empleado_zona_id?: string;
  empleado_fecha_nacimiento?: string;
  empleado_genero?: string;
  empleado_curp?: string;
  empleado_rfc?: string;
  empleado_fecha_ingreso?: string;

  // Contacto
  contacto_telefono_celular: string;
  contacto_telefono_casa?: string;
  contacto_telefono_emergencia?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_parentesco?: string;

  // Domicilio
  domicilio_calle?: string;
  domicilio_numero_ext?: string;
  domicilio_numero_int?: string;
  domicilio_colonia?: string;
  domicilio_municipio?: string;
  domicilio_estado?: string;
  domicilio_codigo_postal?: string;
  domicilio_referencias?: string;
  domicilio_latitud?: string;
  domicilio_longitud?: string;
  domicilio_coordenadas_google_maps?: string;

  // Datos laborales
  datos_laborales_sucursal_id?: string;
  datos_laborales_jefe_inmediato_id?: string;
  datos_laborales_tipo_contrato?: string;
  datos_laborales_nivel?: string;
  datos_laborales_meta_mensual_grupos?: string;
  datos_laborales_meta_mensual_monto?: string;
  datos_laborales_observaciones?: string;

  // Referencia
  ref_nombre_completo?: string;
  notas?: string;
}

async function migrarEmpleadosCompleto() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN DE EMPLEADOS COMPLETA');
  console.log('  (5 Tablas: Usuarios + Empleados + Contacto + Domicilio + Datos Laborales)');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Leer Excel
  const excelPath = 'data/logs/PLANTILLA_EMPLEADOS_COMPLETA.xlsx';

  console.log(`📂 Leyendo archivo: ${excelPath}\n`);

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: No se encuentra el archivo ${excelPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const ws = workbook.Sheets['EMPLEADOS_COMPLETO'];
  const datos: EmpleadoCompleto[] = XLSX.utils.sheet_to_json(ws);

  console.log(`📊 Registros leídos: ${datos.length}\n`);

  // 2. Validar datos requeridos
  console.log('🔍 Validando datos requeridos...\n');

  const errores: string[] = [];
  const registrosValidos: EmpleadoCompleto[] = [];

  datos.forEach((registro, idx) => {
    const erroresRegistro: string[] = [];

    // Validar campos requeridos de USUARIO
    if (!registro.usuario_email || String(registro.usuario_email).trim() === '') {
      erroresRegistro.push('usuario_email requerido');
    }
    if (!registro.usuario_password || String(registro.usuario_password).trim() === '') {
      erroresRegistro.push('usuario_password requerido');
    }
    if (!registro.usuario_rol_id || String(registro.usuario_rol_id).trim() === '') {
      erroresRegistro.push('usuario_rol_id requerido');
    }
    if (!registro.usuario_sucursal_id || String(registro.usuario_sucursal_id).trim() === '') {
      erroresRegistro.push('usuario_sucursal_id requerido');
    }
    if (!registro.usuario_estado || String(registro.usuario_estado).trim() === '') {
      erroresRegistro.push('usuario_estado requerido');
    }

    // Validar campos requeridos de EMPLEADO
    if (!registro.empleado_tipo_empleado || String(registro.empleado_tipo_empleado).trim() === '') {
      erroresRegistro.push('empleado_tipo_empleado requerido');
    }

    // Validar campos requeridos de CONTACTO
    if (!registro.contacto_telefono_celular || String(registro.contacto_telefono_celular).trim() === '') {
      erroresRegistro.push('contacto_telefono_celular requerido');
    }

    if (erroresRegistro.length > 0) {
      const nombre = registro.ref_nombre_completo || `Fila ${idx + 2}`;
      errores.push(`${nombre}: ${erroresRegistro.join(', ')}`);
    } else {
      registrosValidos.push(registro);
    }
  });

  if (errores.length > 0) {
    console.log(`\n⚠️  ERRORES DE VALIDACIÓN (${errores.length}):\n`);
    errores.slice(0, 20).forEach(err => console.log(`   ❌ ${err}`));
    if (errores.length > 20) {
      console.log(`   ... y ${errores.length - 20} más\n`);
    }
    console.log(`\n❌ Se encontraron ${errores.length} registros con errores.`);
    console.log('   Corrige los errores en el Excel y vuelve a ejecutar.\n');
    await pool.end();
    process.exit(1);
  }

  console.log(`✅ Todos los registros válidos (${registrosValidos.length})\n`);

  // 3. Confirmar inserción
  console.log('⚠️  ADVERTENCIA: Se insertarán los siguientes registros:\n');
  console.log(`   ${registrosValidos.length} USUARIOS`);
  console.log(`   ${registrosValidos.length} EMPLEADOS`);
  console.log(`   ${registrosValidos.length} CONTACTOS`);
  console.log(`   ${registrosValidos.filter(r => r.domicilio_calle).length} DOMICILIOS (con datos)`);
  console.log(`   ${registrosValidos.filter(r => r.datos_laborales_tipo_contrato).length} DATOS LABORALES (con datos)\n`);

  console.log('   Presiona Ctrl+C para cancelar en los próximos 5 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. Migrar datos
  console.log('🔧 Iniciando migración...\n');

  const resultados = {
    usuarios_insertados: 0,
    empleados_insertados: 0,
    contactos_insertados: 0,
    domicilios_insertados: 0,
    datos_laborales_insertados: 0,
    errores: 0,
    detalles_errores: [] as any[]
  };

  const mapeoEmpleados: Map<string, string> = new Map(); // email -> empleado_id

  for (const registro of registrosValidos) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const nombre = registro.ref_nombre_completo || registro.usuario_email;

      // 1. Insertar USUARIO
      const passwordHash = await bcrypt.hash(registro.usuario_password, 10);

      const usuarioResult = await client.query(`
        INSERT INTO usuarios (
          folio,
          email,
          password_hash,
          rol_id,
          sucursal_id,
          estado,
          nombre,
          apellido_paterno,
          apellido_materno,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING id;
      `, [
        registro.usuario_folio || null,
        registro.usuario_email,
        passwordHash,
        registro.usuario_rol_id,
        registro.usuario_sucursal_id,
        registro.usuario_estado,
        registro.usuario_nombre || null,
        registro.usuario_apellido_paterno || null,
        registro.usuario_apellido_materno || null
      ]);

      const usuarioId = usuarioResult.rows[0].id;
      resultados.usuarios_insertados++;

      // 2. Insertar EMPLEADO
      const empleadoResult = await client.query(`
        INSERT INTO empleados (
          folio,
          usuario_id,
          zona_id,
          fecha_nacimiento,
          genero,
          curp,
          rfc,
          fecha_ingreso,
          tipo_empleado,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING id;
      `, [
        registro.empleado_folio || null,
        usuarioId,
        registro.empleado_zona_id || null,
        registro.empleado_fecha_nacimiento || null,
        registro.empleado_genero || null,
        registro.empleado_curp || null,
        registro.empleado_rfc || null,
        registro.empleado_fecha_ingreso || null,
        registro.empleado_tipo_empleado
      ]);

      const empleadoId = empleadoResult.rows[0].id;
      resultados.empleados_insertados++;
      mapeoEmpleados.set(registro.usuario_email, empleadoId);

      // 3. Insertar EMPLEADO_CONTACTO
      await client.query(`
        INSERT INTO empleados_contacto (
          empleado_id,
          telefono_celular,
          telefono_casa,
          telefono_emergencia,
          emergencia_nombre,
          emergencia_parentesco,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        );
      `, [
        empleadoId,
        registro.contacto_telefono_celular,
        registro.contacto_telefono_casa || null,
        registro.contacto_telefono_emergencia || null,
        registro.contacto_emergencia_nombre || null,
        registro.contacto_emergencia_parentesco || null
      ]);

      resultados.contactos_insertados++;

      // 4. Insertar EMPLEADO_DOMICILIO (si tiene datos)
      if (registro.domicilio_calle || registro.domicilio_colonia || registro.domicilio_municipio) {
        await client.query(`
          INSERT INTO empleados_domicilios (
            empleado_id,
            calle,
            numero_ext,
            numero_int,
            colonia,
            municipio,
            estado,
            codigo_postal,
            referencias,
            latitud,
            longitud,
            coordenadas_google_maps,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
          );
        `, [
          empleadoId,
          registro.domicilio_calle || null,
          registro.domicilio_numero_ext || null,
          registro.domicilio_numero_int || null,
          registro.domicilio_colonia || null,
          registro.domicilio_municipio || null,
          registro.domicilio_estado || null,
          registro.domicilio_codigo_postal || null,
          registro.domicilio_referencias || null,
          registro.domicilio_latitud ? parseFloat(registro.domicilio_latitud) : null,
          registro.domicilio_longitud ? parseFloat(registro.domicilio_longitud) : null,
          registro.domicilio_coordenadas_google_maps || null
        ]);

        resultados.domicilios_insertados++;
      }

      // 5. Insertar EMPLEADO_DATOS_LABORALES (si tiene datos)
      if (registro.datos_laborales_tipo_contrato || registro.datos_laborales_sucursal_id) {
        await client.query(`
          INSERT INTO empleados_datos_laborales (
            empleado_id,
            sucursal_id,
            jefe_inmediato_id,
            tipo_contrato,
            nivel,
            meta_mensual_grupos,
            meta_mensual_monto,
            observaciones,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          );
        `, [
          empleadoId,
          registro.datos_laborales_sucursal_id || null,
          registro.datos_laborales_jefe_inmediato_id || null,
          registro.datos_laborales_tipo_contrato || null,
          registro.datos_laborales_nivel || null,
          registro.datos_laborales_meta_mensual_grupos ? parseInt(registro.datos_laborales_meta_mensual_grupos) : null,
          registro.datos_laborales_meta_mensual_monto ? parseFloat(registro.datos_laborales_meta_mensual_monto) : null,
          registro.datos_laborales_observaciones || null
        ]);

        resultados.datos_laborales_insertados++;
      }

      await client.query('COMMIT');

      console.log(`   ✅ ${nombre} - Usuario + Empleado + Contacto creados`);

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`   ❌ Error con ${registro.ref_nombre_completo || registro.usuario_email}: ${error.message}`);
      resultados.errores++;
      resultados.detalles_errores.push({
        nombre: registro.ref_nombre_completo || registro.usuario_email,
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // 6. Guardar mapeo de empleados
  const mapeoArray: any[] = [];
  mapeoEmpleados.forEach((empleadoId, email) => {
    mapeoArray.push({ email, empleado_id: empleadoId });
  });

  const mapeoPath = 'data/logs/mapeo_email_empleado_id.json';
  fs.writeFileSync(mapeoPath, JSON.stringify(mapeoArray, null, 2));

  // 7. Generar reporte
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  RESUMEN DE MIGRACIÓN');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 RESULTADOS:\n');
  console.log(`   ✅ Usuarios insertados: ${resultados.usuarios_insertados}`);
  console.log(`   ✅ Empleados insertados: ${resultados.empleados_insertados}`);
  console.log(`   ✅ Contactos insertados: ${resultados.contactos_insertados}`);
  console.log(`   ✅ Domicilios insertados: ${resultados.domicilios_insertados}`);
  console.log(`   ✅ Datos laborales insertados: ${resultados.datos_laborales_insertados}`);
  console.log(`   ❌ Errores: ${resultados.errores}\n`);

  if (resultados.errores > 0) {
    console.log('⚠️  ERRORES DETALLADOS:\n');
    resultados.detalles_errores.forEach(e => {
      console.log(`   - ${e.nombre}: ${e.error}`);
    });
    console.log('');
  }

  console.log(`📄 Mapeo guardado: ${mapeoPath}`);
  console.log(`   (email → empleado_id para usar en ciclos)\n`);

  // Guardar reporte
  const reportePath = `data/logs/reporte_migracion_empleados_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportePath, JSON.stringify({
    fecha: new Date().toISOString(),
    resultados,
    mapeo: mapeoArray
  }, null, 2));

  console.log(`📄 Reporte completo: ${reportePath}\n`);

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

migrarEmpleadosCompleto()
  .then(() => {
    console.log('✅ Migración completada\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
