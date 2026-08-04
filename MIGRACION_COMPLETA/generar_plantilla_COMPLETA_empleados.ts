import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

async function generarPlantillaCompletaEmpleados() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA COMPLETA DE EMPLEADOS');
  console.log('  (Usuarios + Empleados + Contacto + Domicilio + Datos Laborales)');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Obtener rol ASESOR
  const rolAsesor = await pool.query(`SELECT id FROM roles WHERE nombre = 'ASESOR';`);
  const ROL_ASESOR_ID = rolAsesor.rows[0].id;

  // 2. Obtener sucursales
  const sucursales = await pool.query(`SELECT id, nombre FROM sucursales ORDER BY nombre;`);
  const SUCURSAL_DEFAULT_ID = sucursales.rows.length > 0 ? sucursales.rows[0].id : '';

  console.log(`✅ Rol ASESOR: ${ROL_ASESOR_ID}`);
  console.log(`✅ Sucursal default: ${sucursales.rows.length > 0 ? sucursales.rows[0].nombre : 'NINGUNA'}\n`);

  // 3. Extraer nombres de asesoras
  const rawData = JSON.parse(fs.readFileSync('data/staging/integrantes_raw.json', 'utf-8'));
  const asesorasSet = new Set<string>();
  rawData.forEach((row: any) => {
    const asesora = row['LUPITA'];
    if (asesora && String(asesora).trim() !== '') {
      asesorasSet.add(String(asesora).trim());
    }
  });
  const asesoras = Array.from(asesorasSet).sort();

  console.log(`✅ ${asesoras.length} asesoras encontradas\n`);

  // 4. Generar registros COMPLETOS
  console.log('🔧 Generando plantilla completa...\n');

  const registros: any[] = [];

  asesoras.forEach((nombreCompleto, idx) => {
    // Generar email
    const nombreLimpio = nombreCompleto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .join('.');

    const emailSugerido = `${nombreLimpio}@crelealtad.com`;

    registros.push({
      // ========== USUARIO ==========
      usuario_id: '',
      usuario_folio: '',
      usuario_email: emailSugerido,
      usuario_password: process.env.TEMP_USER_PIN,
      usuario_rol_id: ROL_ASESOR_ID,
      usuario_sucursal_id: SUCURSAL_DEFAULT_ID,
      usuario_estado: 'ACTIVO',
      usuario_nombre: '', // Opcional
      usuario_apellido_paterno: '', // Opcional
      usuario_apellido_materno: '', // Opcional

      separador_1: '---',

      // ========== EMPLEADO ==========
      empleado_id: '',
      empleado_folio: '',
      empleado_tipo_empleado: 'ASESORA',
      empleado_zona_id: '',
      empleado_fecha_nacimiento: '', // YYYY-MM-DD
      empleado_genero: '', // M/F
      empleado_curp: '',
      empleado_rfc: '',
      empleado_fecha_ingreso: '', // YYYY-MM-DD

      separador_2: '---',

      // ========== EMPLEADO_CONTACTO ==========
      contacto_id: '',
      contacto_telefono_celular: '', // REQUERIDO
      contacto_telefono_casa: '',
      contacto_telefono_emergencia: '',
      contacto_emergencia_nombre: '',
      contacto_emergencia_parentesco: '',

      separador_3: '---',

      // ========== EMPLEADO_DOMICILIO ==========
      domicilio_id: '',
      domicilio_calle: '',
      domicilio_numero_ext: '',
      domicilio_numero_int: '',
      domicilio_colonia: '',
      domicilio_municipio: '',
      domicilio_estado: '',
      domicilio_codigo_postal: '',
      domicilio_referencias: '',
      domicilio_latitud: '',
      domicilio_longitud: '',
      domicilio_coordenadas_google_maps: '',

      separador_4: '---',

      // ========== EMPLEADO_DATOS_LABORALES ==========
      datos_laborales_id: '',
      datos_laborales_sucursal_id: SUCURSAL_DEFAULT_ID,
      datos_laborales_jefe_inmediato_id: '', // UUID de otro empleado
      datos_laborales_tipo_contrato: '', // PLANTA, HONORARIOS, etc.
      datos_laborales_nivel: '', // JR, SR, etc.
      datos_laborales_meta_mensual_grupos: '', // Número entero
      datos_laborales_meta_mensual_monto: '', // Decimal
      datos_laborales_observaciones: '',

      separador_5: '---',

      // ========== REFERENCIAS ==========
      ref_nombre_completo: nombreCompleto, // REFERENCIA - no se migra
      ref_usuario_sucursal_nombre: sucursales.rows.length > 0 ? sucursales.rows[0].nombre : '',
      ref_usuario_rol_nombre: 'ASESOR',

      // Campos auto-generados
      created_at: '',
      updated_at: '',

      // Notas
      notas: ''
    });
  });

  console.log(`✅ ${registros.length} registros completos generados\n`);

  // 5. Crear Excel
  console.log('📄 Creando archivo Excel...\n');

  const wb = XLSX.utils.book_new();

  // Hoja 1: DATOS COMPLETOS
  const ws1 = XLSX.utils.json_to_sheet(registros);

  // Configurar anchos de columna
  const columnas = Object.keys(registros[0]);
  ws1['!cols'] = columnas.map(col => {
    if (col.includes('id')) return { wch: 36 };
    if (col.includes('email')) return { wch: 35 };
    if (col.includes('password')) return { wch: 20 };
    if (col.includes('nombre')) return { wch: 35 };
    if (col.includes('direccion') || col.includes('calle') || col.includes('referencias')) return { wch: 50 };
    if (col.includes('separador')) return { wch: 5 };
    if (col.includes('observaciones')) return { wch: 40 };
    return { wch: 20 };
  });

  XLSX.utils.book_append_sheet(wb, ws1, 'EMPLEADOS_COMPLETO');

  // Hoja 2: INSTRUCCIONES GENERALES
  const instrucciones = [
    { Seccion: 'IMPORTANTE', Descripcion: 'Este Excel crea 5 tablas relacionadas en un solo paso' },
    { Seccion: '', Descripcion: '' },
    { Seccion: '📋 TABLAS QUE SE CREARÁN:', Descripcion: '' },
    { Seccion: '1. usuarios', Descripcion: 'Login y acceso al sistema' },
    { Seccion: '2. empleados', Descripcion: 'Datos personales del empleado' },
    { Seccion: '3. empleados_contacto', Descripcion: 'Teléfonos y contactos de emergencia' },
    { Seccion: '4. empleados_domicilios', Descripcion: 'Dirección física' },
    { Seccion: '5. empleados_datos_laborales', Descripcion: 'Sucursal, metas, tipo de contrato' },
    { Seccion: '', Descripcion: '' },
    { Seccion: '✅ CAMPOS YA COMPLETADOS:', Descripcion: '' },
    { Seccion: '- usuario_email', Descripcion: 'Generado automáticamente - REVISAR' },
    { Seccion: '- usuario_rol_id', Descripcion: 'ASESOR' },
    { Seccion: '- usuario_estado', Descripcion: 'ACTIVO' },
    { Seccion: '- usuario_password', Descripcion: 'Crelealtad2024! - CAMBIAR' },
    { Seccion: '- empleado_tipo_empleado', Descripcion: 'ASESORA' },
    { Seccion: '- ref_nombre_completo', Descripcion: 'Nombre extraído del Excel' },
    { Seccion: '', Descripcion: '' },
    { Seccion: '⚠️  CAMPOS REQUERIDOS A COMPLETAR:', Descripcion: '' },
    { Seccion: '- contacto_telefono_celular', Descripcion: 'REQUERIDO para tabla empleados_contacto' },
    { Seccion: '', Descripcion: '' },
    { Seccion: '📝 CAMPOS OPCIONALES:', Descripcion: '' },
    { Seccion: '- Todos los demás campos son opcionales', Descripcion: 'Completar lo que se tenga disponible' },
    { Seccion: '', Descripcion: '' },
    { Seccion: '🚫 NO TOCAR:', Descripcion: '' },
    { Seccion: '- Campos con _id vacíos', Descripcion: 'Se generan automáticamente' },
    { Seccion: '- created_at, updated_at', Descripcion: 'Se generan automáticamente' },
    { Seccion: '- Campos separador_', Descripcion: 'Solo visuales, no se migran' },
    { Seccion: '- Campos ref_', Descripcion: 'Solo referencias, no se migran' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: CAMPOS POR TABLA
  const camposPorTabla = [
    { Tabla: 'USUARIOS', Campo: 'usuario_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Auto-generado' },
    { Tabla: 'USUARIOS', Campo: 'usuario_folio', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'USUARIOS', Campo: 'usuario_email', Tipo: 'Email', Requerido: 'SI', Accion: 'REVISAR - ya generado' },
    { Tabla: 'USUARIOS', Campo: 'usuario_password', Tipo: 'Texto', Requerido: 'SI', Accion: 'CAMBIAR password' },
    { Tabla: 'USUARIOS', Campo: 'usuario_rol_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'Ya completado (ASESOR)' },
    { Tabla: 'USUARIOS', Campo: 'usuario_sucursal_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'Ya completado - ajustar si necesario' },
    { Tabla: 'USUARIOS', Campo: 'usuario_estado', Tipo: 'Texto', Requerido: 'SI', Accion: 'Ya completado (ACTIVO)' },
    { Tabla: 'USUARIOS', Campo: 'usuario_nombre', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'USUARIOS', Campo: 'usuario_apellido_paterno', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'USUARIOS', Campo: 'usuario_apellido_materno', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: '', Campo: '', Tipo: '', Requerido: '', Accion: '' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Auto-generado' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_folio', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_tipo_empleado', Tipo: 'Texto', Requerido: 'SI', Accion: 'Ya completado (ASESORA)' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_zona_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_fecha_nacimiento', Tipo: 'Fecha', Requerido: 'NO', Accion: 'Opcional (YYYY-MM-DD)' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_genero', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional (M/F)' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_curp', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_rfc', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS', Campo: 'empleado_fecha_ingreso', Tipo: 'Fecha', Requerido: 'NO', Accion: 'Opcional (YYYY-MM-DD)' },
    { Tabla: '', Campo: '', Tipo: '', Requerido: '', Accion: '' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Auto-generado' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_telefono_celular', Tipo: 'Texto', Requerido: 'SI', Accion: 'COMPLETAR' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_telefono_casa', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_telefono_emergencia', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_emergencia_nombre', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_CONTACTO', Campo: 'contacto_emergencia_parentesco', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: '', Campo: '', Tipo: '', Requerido: '', Accion: '' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Auto-generado' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_calle', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_numero_ext', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_numero_int', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_colonia', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_municipio', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_estado', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_codigo_postal', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_referencias', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_latitud', Tipo: 'Decimal', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_longitud', Tipo: 'Decimal', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DOMICILIOS', Campo: 'domicilio_coordenadas_google_maps', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: '', Campo: '', Tipo: '', Requerido: '', Accion: '' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Auto-generado' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_sucursal_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Ya completado - ajustar si necesario' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_jefe_inmediato_id', Tipo: 'UUID', Requerido: 'NO', Accion: 'Opcional (UUID de otro empleado)' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_tipo_contrato', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional (PLANTA, HONORARIOS, etc.)' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_nivel', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional (JR, SR, etc.)' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_meta_mensual_grupos', Tipo: 'Entero', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_meta_mensual_monto', Tipo: 'Decimal', Requerido: 'NO', Accion: 'Opcional' },
    { Tabla: 'EMPLEADOS_DATOS_LABORALES', Campo: 'datos_laborales_observaciones', Tipo: 'Texto', Requerido: 'NO', Accion: 'Opcional' },
  ];

  const ws3 = XLSX.utils.json_to_sheet(camposPorTabla);
  XLSX.utils.book_append_sheet(wb, ws3, 'DETALLE_CAMPOS');

  // Hoja 4: SUCURSALES
  if (sucursales.rows.length > 0) {
    const sucursalesData = sucursales.rows.map((s, idx) => ({
      numero: idx + 1,
      id: s.id,
      nombre: s.nombre
    }));
    const ws4 = XLSX.utils.json_to_sheet(sucursalesData);
    XLSX.utils.book_append_sheet(wb, ws4, 'REF_SUCURSALES');
  }

  // Hoja 5: RESUMEN
  const resumen = [
    { Metrica: 'Total de asesoras', Valor: registros.length },
    { Metrica: 'Tablas a crear', Valor: '5 (usuarios + 4 tablas de empleados)' },
    { Metrica: '', Valor: '' },
    { Metrica: 'CAMPOS REQUERIDOS:', Valor: '' },
    { Metrica: '- usuario_email', Valor: 'Ya generado - REVISAR' },
    { Metrica: '- usuario_password', Valor: 'Cambiar de Crelealtad2024!' },
    { Metrica: '- contacto_telefono_celular', Valor: 'COMPLETAR' },
    { Metrica: '', Valor: '' },
    { Metrica: 'SIGUIENTE PASO:', Valor: '' },
    { Metrica: '1. Revisar emails', Valor: '' },
    { Metrica: '2. Cambiar passwords', Valor: '' },
    { Metrica: '3. Completar teléfonos', Valor: '' },
    { Metrica: '4. Completar datos opcionales', Valor: '' },
    { Metrica: '5. Guardar', Valor: '' },
    { Metrica: '6. Ejecutar migración', Valor: '' },
  ];

  const ws5 = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, ws5, 'RESUMEN');

  // Guardar
  const excelPath = 'data/logs/PLANTILLA_EMPLEADOS_COMPLETA.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel creado: ${excelPath}\n`);

  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📊 TOTAL: ${registros.length} asesoras\n`);

  console.log('📋 TABLAS INCLUIDAS:');
  console.log('   1. usuarios');
  console.log('   2. empleados');
  console.log('   3. empleados_contacto');
  console.log('   4. empleados_domicilios');
  console.log('   5. empleados_datos_laborales\n');

  console.log('✅ CAMPOS PRE-COMPLETADOS:');
  console.log('   • Nombre completo (referencia)');
  console.log('   • Email (generado - REVISAR)');
  console.log('   • Rol (ASESOR)');
  console.log('   • Sucursal (MATRIZ)');
  console.log('   • Password (Crelealtad2024! - CAMBIAR)');
  console.log('   • Tipo empleado (ASESORA)\n');

  console.log('⚠️  CAMPO REQUERIDO A COMPLETAR:');
  console.log('   • contacto_telefono_celular (REQUERIDO)\n');

  console.log('📝 CAMPOS OPCIONALES:');
  console.log('   • Todos los demás campos pueden quedar vacíos\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

generarPlantillaCompletaEmpleados()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
