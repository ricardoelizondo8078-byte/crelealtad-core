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

async function generarPlantillaEmpleados() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA DE EMPLEADOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Obtener estructura completa de la tabla empleados
  console.log('📊 Obteniendo estructura de tabla empleados...');

  const estructura = await pool.query(`
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'empleados'
    ORDER BY ordinal_position;
  `);

  console.log(`   ✅ ${estructura.rows.length} columnas encontradas\n`);

  estructura.rows.forEach(col => {
    const requerido = col.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL';
    console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${requerido}`);
  });

  // 2. Verificar si hay otras tablas relacionadas
  console.log('\n\n📊 Verificando tablas relacionadas...');

  const tablasRelacionadas = [
    'empleados_contacto',
    'empleados_domicilios',
    'empleados_datos_laborales',
    'empleados_documentos'
  ];

  for (const tabla of tablasRelacionadas) {
    const existe = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      );
    `, [tabla]);

    if (existe.rows[0].exists) {
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tabla]);

      console.log(`\n   ✅ ${tabla} (${cols.rows.length} columnas)`);
      cols.rows.forEach(c => {
        const req = c.is_nullable === 'NO' ? 'REQ' : 'OPC';
        console.log(`      - ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} ${req}`);
      });
    }
  }

  // 3. Extraer nombres de asesoras del Excel original
  console.log('\n\n📂 Extrayendo nombres de asesoras del Excel original...');

  const rawData = JSON.parse(fs.readFileSync('data/staging/integrantes_raw.json', 'utf-8'));

  const asesorasSet = new Set<string>();
  rawData.forEach((row: any) => {
    const asesora = row['LUPITA'];
    if (asesora && String(asesora).trim() !== '') {
      asesorasSet.add(String(asesora).trim());
    }
  });

  const asesoras = Array.from(asesorasSet).sort();

  console.log(`   ✅ ${asesoras.length} asesoras únicas encontradas\n`);

  // Mostrar lista
  console.log('📋 ASESORAS ENCONTRADAS:');
  asesoras.forEach((a, idx) => {
    if (idx < 30) {
      console.log(`   ${String(idx + 1).padStart(3)}. ${a}`);
    }
  });
  if (asesoras.length > 30) {
    console.log(`   ... y ${asesoras.length - 30} más`);
  }

  // 4. Generar plantilla de empleados
  console.log('\n\n🔧 Generando plantilla de empleados...\n');

  const empleados: any[] = [];

  asesoras.forEach(nombreCompleto => {
    empleados.push({
      // Campos que se generarán automáticamente
      id: '', // UUID - se genera en DB

      // Campos requeridos - A COMPLETAR
      usuario_id: '', // UUID - COMPLETAR MANUALMENTE o NULL si no aplica
      tipo_empleado: 'ASESORA', // Pre-cargado

      // Datos personales
      nombre_completo: nombreCompleto, // YA COMPLETADO
      folio: '', // OPCIONAL
      zona_id: '', // UUID - OPCIONAL

      // Datos complementarios
      fecha_nacimiento: '', // OPCIONAL - formato YYYY-MM-DD
      genero: '', // OPCIONAL - M/F
      curp: '', // OPCIONAL
      rfc: '', // OPCIONAL
      fecha_ingreso: '', // OPCIONAL - formato YYYY-MM-DD

      // Campos auto-generados
      created_at: '', // Se genera automáticamente
      updated_at: '', // Se genera automáticamente

      // Campo de ayuda
      notas: ''
    });
  });

  console.log(`✅ ${empleados.length} registros de empleados generados\n`);

  // 5. Crear Excel
  console.log('📄 Creando archivo Excel...\n');

  const wb = XLSX.utils.book_new();

  // Hoja 1: EMPLEADOS
  const ws1 = XLSX.utils.json_to_sheet(empleados);
  ws1['!cols'] = [
    { wch: 10 },  // id
    { wch: 36 },  // usuario_id
    { wch: 15 },  // tipo_empleado
    { wch: 35 },  // nombre_completo
    { wch: 15 },  // folio
    { wch: 36 },  // zona_id
    { wch: 12 },  // fecha_nacimiento
    { wch: 8 },   // genero
    { wch: 18 },  // curp
    { wch: 13 },  // rfc
    { wch: 12 },  // fecha_ingreso
    { wch: 20 },  // created_at
    { wch: 20 },  // updated_at
    { wch: 40 },  // notas
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'EMPLEADOS');

  // Hoja 2: INSTRUCCIONES
  const instrucciones = [
    { Columna: 'id', Tipo: 'UUID', Accion: 'DEJAR VACÍO', Descripcion: 'Se genera automáticamente en DB con uuid_generate_v4()' },
    { Columna: '', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'CAMPOS REQUERIDOS', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'usuario_id', Tipo: 'UUID', Accion: 'COMPLETAR o NULL', Descripcion: 'UUID de usuario si la asesora tiene login, sino dejar vacío' },
    { Columna: 'tipo_empleado', Tipo: 'Texto', Accion: 'YA COMPLETADO', Descripcion: 'Pre-cargado como ASESORA' },
    { Columna: '', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'DATOS PRE-CARGADOS', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'nombre_completo', Tipo: 'Texto', Accion: 'YA COMPLETADO', Descripcion: 'Extraído del Excel (campo LUPITA)' },
    { Columna: '', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'CAMPOS OPCIONALES', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'folio', Tipo: 'Texto', Accion: 'OPCIONAL', Descripcion: 'Folio único del empleado' },
    { Columna: 'zona_id', Tipo: 'UUID', Accion: 'OPCIONAL', Descripcion: 'UUID de zona si aplica' },
    { Columna: 'fecha_nacimiento', Tipo: 'Fecha', Accion: 'OPCIONAL', Descripcion: 'Formato: YYYY-MM-DD (ej: 1985-03-15)' },
    { Columna: 'genero', Tipo: 'Texto', Accion: 'OPCIONAL', Descripcion: 'M (masculino) o F (femenino)' },
    { Columna: 'curp', Tipo: 'Texto', Accion: 'OPCIONAL', Descripcion: 'CURP de la asesora' },
    { Columna: 'rfc', Tipo: 'Texto', Accion: 'OPCIONAL', Descripcion: 'RFC de la asesora' },
    { Columna: 'fecha_ingreso', Tipo: 'Fecha', Accion: 'OPCIONAL', Descripcion: 'Formato: YYYY-MM-DD (ej: 2020-01-15)' },
    { Columna: '', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'CAMPOS AUTO-GENERADOS', Tipo: '', Accion: '', Descripcion: '' },
    { Columna: 'created_at', Tipo: 'Timestamp', Accion: 'DEJAR VACÍO', Descripcion: 'Se genera automáticamente con NOW()' },
    { Columna: 'updated_at', Tipo: 'Timestamp', Accion: 'DEJAR VACÍO', Descripcion: 'Se genera automáticamente con NOW()' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  ws2['!cols'] = [
    { wch: 20 },  // Columna
    { wch: 15 },  // Tipo
    { wch: 20 },  // Accion
    { wch: 60 },  // Descripcion
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: VALORES PERMITIDOS
  const valores = [
    { Campo: 'tipo_empleado', Valores: 'ASESORA, PROMOTORA, GERENTE, ADMINISTRADOR, COBRANZA, etc.' },
    { Campo: 'genero', Valores: 'M (masculino), F (femenino)' },
    { Campo: 'fecha_nacimiento', Valores: 'Formato: YYYY-MM-DD (2024-01-15)' },
    { Campo: 'fecha_ingreso', Valores: 'Formato: YYYY-MM-DD (2024-01-15)' },
  ];

  const ws3 = XLSX.utils.json_to_sheet(valores);
  XLSX.utils.book_append_sheet(wb, ws3, 'VALORES_PERMITIDOS');

  // Hoja 4: RESUMEN
  const resumen = [
    { Metrica: 'Total de asesoras', Valor: empleados.length },
    { Metrica: 'Nombres pre-cargados', Valor: empleados.length },
    { Metrica: 'Tipo pre-cargado', Valor: 'ASESORA' },
    { Metrica: '', Valor: '' },
    { Metrica: 'SIGUIENTE PASO:', Valor: '' },
    { Metrica: '1. Completar usuario_id', Valor: '(si las asesoras tienen login)' },
    { Metrica: '2. Completar datos opcionales', Valor: '(CURP, RFC, fechas, género)' },
    { Metrica: '3. Guardar Excel', Valor: '' },
    { Metrica: '4. Ejecutar migración', Valor: 'npm run empleados:migrar' },
  ];

  const ws4 = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, ws4, 'RESUMEN');

  // Hoja 5: LISTA DE ASESORAS (para referencia)
  const listaAsesoras = asesoras.map((a, idx) => ({
    numero: idx + 1,
    nombre: a
  }));

  const ws5 = XLSX.utils.json_to_sheet(listaAsesoras);
  XLSX.utils.book_append_sheet(wb, ws5, 'LISTA_ASESORAS');

  // Guardar
  const excelPath = 'data/logs/PLANTILLA_EMPLEADOS.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel creado: ${excelPath}\n`);

  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📊 TOTAL DE EMPLEADOS: ${empleados.length} asesoras\n`);

  console.log('✅ DATOS YA COMPLETADOS:');
  console.log('   - nombre_completo (todos)');
  console.log('   - tipo_empleado (ASESORA)\n');

  console.log('⚠️  CAMPOS A COMPLETAR:');
  console.log('   - usuario_id (REQUERIDO - UUID o NULL)');
  console.log('   - OPCIONALES: folio, curp, rfc, fechas, género, zona_id\n');

  console.log('📋 SIGUIENTE PASO:');
  console.log('   1. Abrir: PLANTILLA_EMPLEADOS.xlsx');
  console.log('   2. Completar usuario_id (o dejarlo vacío si no tienen login)');
  console.log('   3. Completar datos opcionales si los tienes');
  console.log('   4. Guardar');
  console.log('   5. Ejecutar migración de empleados\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

generarPlantillaEmpleados()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
