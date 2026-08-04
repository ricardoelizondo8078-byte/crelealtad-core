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

async function generarPlantillaUsuariosEmpleados() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA: USUARIOS + EMPLEADOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Obtener UUID del rol ASESOR
  const rolAsesor = await pool.query(`
    SELECT id, nombre FROM roles WHERE nombre = 'ASESOR';
  `);

  if (rolAsesor.rows.length === 0) {
    console.error('❌ No se encontró el rol ASESOR en la base de datos');
    await pool.end();
    process.exit(1);
  }

  const ROL_ASESOR_ID = rolAsesor.rows[0].id;
  console.log(`✅ Rol ASESOR encontrado: ${ROL_ASESOR_ID}\n`);

  // 2. Obtener sucursales disponibles
  const sucursales = await pool.query(`
    SELECT id, nombre FROM sucursales ORDER BY nombre;
  `);

  console.log(`📊 Sucursales disponibles: ${sucursales.rows.length}\n`);
  sucursales.rows.forEach((s, idx) => {
    if (idx < 10) {
      console.log(`   ${String(idx + 1).padStart(2)}. ${s.nombre} (${s.id})`);
    }
  });
  if (sucursales.rows.length > 10) {
    console.log(`   ... y ${sucursales.rows.length - 10} más`);
  }

  const SUCURSAL_DEFAULT_ID = sucursales.rows.length > 0 ? sucursales.rows[0].id : '';

  console.log(`\n✅ Sucursal por defecto: ${sucursales.rows.length > 0 ? sucursales.rows[0].nombre : 'NINGUNA'}\n`);

  // 3. Extraer nombres de asesoras
  console.log('📂 Extrayendo nombres de asesoras...');

  const rawData = JSON.parse(fs.readFileSync('data/staging/integrantes_raw.json', 'utf-8'));

  const asesorasSet = new Set<string>();
  rawData.forEach((row: any) => {
    const asesora = row['LUPITA'];
    if (asesora && String(asesora).trim() !== '') {
      asesorasSet.add(String(asesora).trim());
    }
  });

  const asesoras = Array.from(asesorasSet).sort();

  console.log(`   ✅ ${asesoras.length} asesoras encontradas\n`);

  // 4. Generar registros combinados
  console.log('🔧 Generando plantilla...\n');

  const registros: any[] = [];

  asesoras.forEach((nombreCompleto, idx) => {
    // Generar email sugerido
    const nombreLimpio = nombreCompleto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .join('.');

    const emailSugerido = `${nombreLimpio}@crelealtad.com`;

    registros.push({
      // ===== DATOS DEL USUARIO =====
      usuario_id: '', // UUID - se genera en DB
      usuario_email: emailSugerido, // COMPLETAR/MODIFICAR
      usuario_password: process.env.TEMP_USER_PIN, // CAMBIAR - password por defecto
      usuario_rol_id: ROL_ASESOR_ID, // YA COMPLETADO
      usuario_rol_nombre: 'ASESOR', // REFERENCIA
      usuario_sucursal_id: SUCURSAL_DEFAULT_ID, // COMPLETAR si hay varias sucursales
      usuario_sucursal_nombre: sucursales.rows.length > 0 ? sucursales.rows[0].nombre : '', // REFERENCIA
      usuario_estado: 'ACTIVO', // YA COMPLETADO
      usuario_folio: '', // OPCIONAL

      // Separador visual
      separador_1: '---',

      // ===== DATOS DEL EMPLEADO =====
      empleado_id: '', // UUID - se genera en DB
      empleado_nombre_completo: nombreCompleto, // YA COMPLETADO
      empleado_tipo: 'ASESORA', // YA COMPLETADO
      empleado_folio: '', // OPCIONAL
      empleado_zona_id: '', // OPCIONAL

      // Datos personales
      empleado_fecha_nacimiento: '', // OPCIONAL - YYYY-MM-DD
      empleado_genero: '', // OPCIONAL - M/F
      empleado_curp: '', // OPCIONAL
      empleado_rfc: '', // OPCIONAL
      empleado_fecha_ingreso: '', // OPCIONAL - YYYY-MM-DD

      // Campos auto-generados
      created_at: '',
      updated_at: '',

      // Campo de ayuda
      notas: ''
    });
  });

  console.log(`✅ ${registros.length} registros generados\n`);

  // 5. Crear Excel
  console.log('📄 Creando archivo Excel...\n');

  const wb = XLSX.utils.book_new();

  // Hoja 1: USUARIOS Y EMPLEADOS
  const ws1 = XLSX.utils.json_to_sheet(registros);
  ws1['!cols'] = [
    // Usuario
    { wch: 10 },  // usuario_id
    { wch: 35 },  // usuario_email
    { wch: 20 },  // usuario_password
    { wch: 36 },  // usuario_rol_id
    { wch: 15 },  // usuario_rol_nombre
    { wch: 36 },  // usuario_sucursal_id
    { wch: 25 },  // usuario_sucursal_nombre
    { wch: 10 },  // usuario_estado
    { wch: 15 },  // usuario_folio
    { wch: 5 },   // separador
    // Empleado
    { wch: 10 },  // empleado_id
    { wch: 35 },  // empleado_nombre_completo
    { wch: 15 },  // empleado_tipo
    { wch: 15 },  // empleado_folio
    { wch: 36 },  // empleado_zona_id
    { wch: 12 },  // empleado_fecha_nacimiento
    { wch: 8 },   // empleado_genero
    { wch: 18 },  // empleado_curp
    { wch: 13 },  // empleado_rfc
    { wch: 12 },  // empleado_fecha_ingreso
    { wch: 20 },  // created_at
    { wch: 20 },  // updated_at
    { wch: 40 },  // notas
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'USUARIOS_EMPLEADOS');

  // Hoja 2: INSTRUCCIONES
  const instrucciones = [
    { Seccion: 'IMPORTANTE', Campo: '', Descripcion: 'Este Excel crea USUARIOS (login) + EMPLEADOS (datos personales) en un solo paso' },
    { Seccion: '', Campo: '', Descripcion: '' },
    { Seccion: '===== USUARIO =====', Campo: '', Descripcion: '' },
    { Seccion: 'YA COMPLETADO', Campo: 'usuario_rol_id', Descripcion: `Rol ASESOR (${ROL_ASESOR_ID})` },
    { Seccion: 'YA COMPLETADO', Campo: 'usuario_estado', Descripcion: 'ACTIVO' },
    { Seccion: 'YA COMPLETADO', Campo: 'usuario_sucursal_id', Descripcion: `${sucursales.rows.length > 0 ? sucursales.rows[0].nombre : 'NINGUNA'}` },
    { Seccion: '', Campo: '', Descripcion: '' },
    { Seccion: 'REVISAR/MODIFICAR', Campo: 'usuario_email', Descripcion: 'Email generado automáticamente - REVISAR Y AJUSTAR si necesario' },
    { Seccion: 'CAMBIAR', Campo: 'usuario_password', Descripcion: 'Password por defecto: Crelealtad2024! - CAMBIAR por uno real' },
    { Seccion: 'OPCIONAL', Campo: 'usuario_sucursal_id', Descripcion: 'Cambiar si la asesora pertenece a otra sucursal' },
    { Seccion: '', Campo: '', Descripcion: '' },
    { Seccion: '===== EMPLEADO =====', Campo: '', Descripcion: '' },
    { Seccion: 'YA COMPLETADO', Campo: 'empleado_nombre_completo', Descripcion: 'Extraído del Excel (campo LUPITA)' },
    { Seccion: 'YA COMPLETADO', Campo: 'empleado_tipo', Descripcion: 'ASESORA' },
    { Seccion: '', Campo: '', Descripcion: '' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_curp', Descripcion: 'CURP de la asesora' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_rfc', Descripcion: 'RFC de la asesora' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_fecha_nacimiento', Descripcion: 'Formato: YYYY-MM-DD' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_genero', Descripcion: 'M o F' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_fecha_ingreso', Descripcion: 'Formato: YYYY-MM-DD' },
    { Seccion: 'OPCIONAL', Campo: 'empleado_zona_id', Descripcion: 'UUID de zona si aplica' },
    { Seccion: '', Campo: '', Descripcion: '' },
    { Seccion: 'NO TOCAR', Campo: 'usuario_id, empleado_id, created_at, updated_at', Descripcion: 'Se generan automáticamente' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: SUCURSALES (referencia)
  if (sucursales.rows.length > 0) {
    const sucursalesData = sucursales.rows.map((s, idx) => ({
      numero: idx + 1,
      id: s.id,
      nombre: s.nombre
    }));

    const ws3 = XLSX.utils.json_to_sheet(sucursalesData);
    XLSX.utils.book_append_sheet(wb, ws3, 'REF_SUCURSALES');
  }

  // Hoja 4: RESUMEN
  const resumen = [
    { Metrica: 'Total de asesoras', Valor: registros.length },
    { Metrica: '', Valor: '' },
    { Metrica: 'DATOS PRE-COMPLETADOS:', Valor: '' },
    { Metrica: '- Nombre completo', Valor: `${registros.length} asesoras` },
    { Metrica: '- Email (sugerido)', Valor: 'REVISAR' },
    { Metrica: '- Rol', Valor: 'ASESOR' },
    { Metrica: '- Sucursal', Valor: sucursales.rows.length > 0 ? sucursales.rows[0].nombre : 'NINGUNA' },
    { Metrica: '- Password por defecto', Valor: 'Crelealtad2024!' },
    { Metrica: '', Valor: '' },
    { Metrica: 'SIGUIENTE PASO:', Valor: '' },
    { Metrica: '1. Revisar emails', Valor: 'Ajustar si hay duplicados o errores' },
    { Metrica: '2. Cambiar passwords', Valor: 'Usar passwords reales o generar aleatorios' },
    { Metrica: '3. Ajustar sucursales', Valor: 'Si las asesoras están en diferentes sucursales' },
    { Metrica: '4. Completar datos opcionales', Valor: 'CURP, RFC, fechas' },
    { Metrica: '5. Guardar', Valor: '' },
    { Metrica: '6. Ejecutar migración', Valor: 'npm run usuarios-empleados:migrar' },
  ];

  const ws4 = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, ws4, 'RESUMEN');

  // Guardar
  const excelPath = 'data/logs/PLANTILLA_USUARIOS_EMPLEADOS.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel creado: ${excelPath}\n`);

  // Resumen final
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📊 TOTAL: ${registros.length} ASESORAS\n`);

  console.log('✅ DATOS PRE-COMPLETADOS:');
  console.log(`   • nombre_completo (${registros.length})`);
  console.log(`   • email sugerido (${registros.length}) - REVISAR`);
  console.log(`   • rol_id = ASESOR`);
  console.log(`   • sucursal_id = ${sucursales.rows.length > 0 ? sucursales.rows[0].nombre : 'NINGUNA'}`);
  console.log(`   • password = Crelealtad2024! (por defecto)\n`);

  console.log('⚠️  CAMPOS A REVISAR/COMPLETAR:');
  console.log('   • usuario_email (verificar que no haya duplicados)');
  console.log('   • usuario_password (cambiar por passwords reales)');
  console.log('   • usuario_sucursal_id (ajustar si aplica)');
  console.log('   • OPCIONALES: CURP, RFC, fechas, género\n');

  console.log('📋 SIGUIENTE PASO:');
  console.log('   1. Abrir: PLANTILLA_USUARIOS_EMPLEADOS.xlsx');
  console.log('   2. Revisar y ajustar emails');
  console.log('   3. Cambiar passwords');
  console.log('   4. Guardar');
  console.log('   5. Ejecutar migración (creará usuarios Y empleados)\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

generarPlantillaUsuariosEmpleados()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
