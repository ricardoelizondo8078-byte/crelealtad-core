import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

async function generarPlantillaCiclos() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA DE CICLOS EN EXCEL');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Obtener estructura de tabla ciclos
  console.log('📊 Obteniendo estructura de tabla ciclos...');
  const estructuraResult = await pool.query(`
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'ciclos'
      AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);

  console.log('✅ Columnas de tabla ciclos:');
  estructuraResult.rows.forEach(col => {
    console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL'}`);
  });

  // 2. Obtener datos existentes para pre-poblar
  console.log('\n📊 Obteniendo datos de grupos y tesoreras...');

  const gruposResult = await pool.query(`
    SELECT
      g.id as grupo_id,
      g.nombre as grupo_nombre,
      g.folio as grupo_folio,
      e.id as expediente_id,
      COUNT(i.id) as total_integrantes
    FROM grupos g
    LEFT JOIN expedientes e ON e.grupo_id = g.id
    LEFT JOIN integrantes i ON i.expediente_id = e.id
    GROUP BY g.id, g.nombre, g.folio, e.id
    ORDER BY g.nombre;
  `);

  console.log(`✅ Grupos encontrados: ${gruposResult.rows.length}`);

  // 3. Obtener tesoreras por grupo
  const tesorerasResult = await pool.query(`
    SELECT
      bt.grupo_nombre,
      bt.persona_id as tesorera_id,
      bt.curp,
      bt.nombre_completo
    FROM backup_tesoreras_20260802 bt
  `);

  console.log(`✅ Tesoreras encontradas: ${tesorerasResult.rows.length}`);

  // Crear mapeo de tesoreras por grupo
  const tesorerasPorGrupo = new Map<string, any>();
  tesorerasResult.rows.forEach(t => {
    if (!tesorerasPorGrupo.has(t.grupo_nombre)) {
      tesorerasPorGrupo.set(t.grupo_nombre, t);
    }
  });

  // 4. Generar registros de ciclos
  console.log('\n🔧 Generando plantilla de ciclos...');

  const ciclos: any[] = [];

  for (const grupo of gruposResult.rows) {
    const tesorera = tesorerasPorGrupo.get(grupo.grupo_nombre);

    // Crear un ciclo por grupo (ciclo 1)
    const ciclo = {
      // Columnas que se pueden pre-poblar
      id: '', // Se generará en DB con uuid_generate_v4()
      folio: '', // COMPLETAR MANUALMENTE
      grupo_id: grupo.grupo_id,
      grupo_nombre: grupo.grupo_nombre, // Para referencia
      numero_ciclo: 1, // Asumir ciclo 1
      expediente_id: grupo.expediente_id || '',
      asesora_id: '', // COMPLETAR MANUALMENTE (requiere tabla empleados)
      asesora_nombre: '', // COMPLETAR MANUALMENTE (para referencia)
      tesorera_id: tesorera?.tesorera_id || '', // Pre-poblado si existe
      tesorera_nombre: tesorera?.nombre_completo || '', // Para referencia
      tesorera_curp: tesorera?.curp || '', // Para referencia
      fecha_inicio: '', // COMPLETAR MANUALMENTE (formato: YYYY-MM-DD)
      fecha_fin: '', // COMPLETAR MANUALMENTE (formato: YYYY-MM-DD)
      dia_pago: '', // COMPLETAR MANUALMENTE (ej: LUNES, MARTES, etc.)
      estado: 'ACTIVO', // Por defecto ACTIVO
      created_at: '', // Se generará automáticamente con NOW()
      updated_at: '', // Se generará automáticamente con NOW()

      // Columnas adicionales para ayuda
      total_integrantes: grupo.total_integrantes,
      notas: '', // Para notas durante llenado
    };

    ciclos.push(ciclo);
  }

  console.log(`✅ Registros de ciclos generados: ${ciclos.length}`);

  // 5. Crear archivo Excel
  console.log('\n📄 Creando archivo Excel...');

  const wb = XLSX.utils.book_new();

  // Hoja 1: CICLOS (datos para llenar)
  const ws1 = XLSX.utils.json_to_sheet(ciclos);

  // Ajustar anchos de columna
  ws1['!cols'] = [
    { wch: 10 }, // id
    { wch: 15 }, // folio
    { wch: 36 }, // grupo_id
    { wch: 30 }, // grupo_nombre
    { wch: 12 }, // numero_ciclo
    { wch: 36 }, // expediente_id
    { wch: 36 }, // asesora_id
    { wch: 30 }, // asesora_nombre
    { wch: 36 }, // tesorera_id
    { wch: 30 }, // tesorera_nombre
    { wch: 18 }, // tesorera_curp
    { wch: 12 }, // fecha_inicio
    { wch: 12 }, // fecha_fin
    { wch: 15 }, // dia_pago
    { wch: 10 }, // estado
    { wch: 20 }, // created_at
    { wch: 20 }, // updated_at
    { wch: 15 }, // total_integrantes
    { wch: 40 }, // notas
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'CICLOS');

  // Hoja 2: INSTRUCCIONES
  const instrucciones = [
    { Columna: 'id', Descripcion: 'UUID del ciclo', Accion: 'DEJAR VACÍO - se generará automáticamente', Ejemplo: '' },
    { Columna: 'folio', Descripcion: 'Folio único del ciclo (opcional)', Accion: 'COMPLETAR si tienes folios', Ejemplo: 'CIC-001' },
    { Columna: 'grupo_id', Descripcion: 'ID del grupo (UUID)', Accion: 'YA COMPLETADO - no modificar', Ejemplo: '7baf4959-...' },
    { Columna: 'grupo_nombre', Descripcion: 'Nombre del grupo (referencia)', Accion: 'SOLO REFERENCIA - no se migra', Ejemplo: 'GABINAS VIP' },
    { Columna: 'numero_ciclo', Descripcion: 'Número del ciclo (1, 2, 3...)', Accion: 'COMPLETAR - por defecto es 1', Ejemplo: '1' },
    { Columna: 'expediente_id', Descripcion: 'ID del expediente (UUID)', Accion: 'YA COMPLETADO - no modificar', Ejemplo: '548a46aa-...' },
    { Columna: 'asesora_id', Descripcion: 'ID de la asesora (UUID)', Accion: 'COMPLETAR - requiere tabla empleados', Ejemplo: 'UUID de empleado' },
    { Columna: 'asesora_nombre', Descripcion: 'Nombre de la asesora (referencia)', Accion: 'COMPLETAR para referencia', Ejemplo: 'MARIA LOPEZ' },
    { Columna: 'tesorera_id', Descripcion: 'ID de la tesorera (UUID)', Accion: 'YA COMPLETADO si existe - verificar', Ejemplo: 'd1c082ad-...' },
    { Columna: 'tesorera_nombre', Descripcion: 'Nombre de la tesorera (referencia)', Accion: 'YA COMPLETADO - solo referencia', Ejemplo: 'JUANA URIBE' },
    { Columna: 'tesorera_curp', Descripcion: 'CURP de la tesorera (referencia)', Accion: 'YA COMPLETADO - solo referencia', Ejemplo: 'UIHJ671213...' },
    { Columna: 'fecha_inicio', Descripcion: 'Fecha inicio del ciclo', Accion: 'COMPLETAR - formato YYYY-MM-DD', Ejemplo: '2024-01-15' },
    { Columna: 'fecha_fin', Descripcion: 'Fecha fin del ciclo (opcional)', Accion: 'COMPLETAR si ya finalizó', Ejemplo: '2024-12-15' },
    { Columna: 'dia_pago', Descripcion: 'Día de pago del ciclo', Accion: 'COMPLETAR', Ejemplo: 'LUNES' },
    { Columna: 'estado', Descripcion: 'Estado del ciclo', Accion: 'YA COMPLETADO - cambiar si necesario', Ejemplo: 'ACTIVO, FINALIZADO' },
    { Columna: 'created_at', Descripcion: 'Fecha de creación', Accion: 'DEJAR VACÍO - se generará automáticamente', Ejemplo: '' },
    { Columna: 'updated_at', Descripcion: 'Fecha de actualización', Accion: 'DEJAR VACÍO - se generará automáticamente', Ejemplo: '' },
    { Columna: 'total_integrantes', Descripcion: 'Total de integrantes (referencia)', Accion: 'SOLO REFERENCIA - no se migra', Ejemplo: '11' },
    { Columna: 'notas', Descripcion: 'Notas para llenado', Accion: 'USAR para tus notas - no se migra', Ejemplo: 'Verificar fecha' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  ws2['!cols'] = [
    { wch: 20 }, // Columna
    { wch: 40 }, // Descripcion
    { wch: 50 }, // Accion
    { wch: 30 }, // Ejemplo
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: REFERENCIA - Grupos
  const wsGrupos = XLSX.utils.json_to_sheet(gruposResult.rows);
  XLSX.utils.book_append_sheet(wb, wsGrupos, 'REF_Grupos');

  // Hoja 4: REFERENCIA - Tesoreras
  const wsTesoreras = XLSX.utils.json_to_sheet(tesorerasResult.rows);
  XLSX.utils.book_append_sheet(wb, wsTesoreras, 'REF_Tesoreras');

  // Hoja 5: VALORES PERMITIDOS
  const valoresPermitidos = [
    { Campo: 'dia_pago', Valores_Permitidos: 'LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO' },
    { Campo: 'estado', Valores_Permitidos: 'ACTIVO, FINALIZADO, CANCELADO, EN_PROCESO' },
    { Campo: 'numero_ciclo', Valores_Permitidos: 'Número entero positivo (1, 2, 3, 4...)' },
    { Campo: 'fecha_inicio', Valores_Permitidos: 'Formato: YYYY-MM-DD (ejemplo: 2024-01-15)' },
    { Campo: 'fecha_fin', Valores_Permitidos: 'Formato: YYYY-MM-DD (ejemplo: 2024-12-15) - OPCIONAL' },
  ];

  const ws5 = XLSX.utils.json_to_sheet(valoresPermitidos);
  XLSX.utils.book_append_sheet(wb, ws5, 'VALORES_PERMITIDOS');

  // Guardar archivo
  const excelPath = 'data/logs/PLANTILLA_CICLOS_PARA_COMPLETAR.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel creado: ${excelPath}`);

  // Estadísticas
  console.log('\n📊 ESTADÍSTICAS:');
  console.log(`   Total de ciclos generados: ${ciclos.length}`);
  console.log(`   Con tesorera pre-asignada: ${ciclos.filter(c => c.tesorera_id).length}`);
  console.log(`   Sin tesorera: ${ciclos.filter(c => !c.tesorera_id).length}`);
  console.log(`   Con expediente: ${ciclos.filter(c => c.expediente_id).length}`);

  console.log('\n📋 COLUMNAS PRE-POBLADAS:');
  console.log('   ✅ grupo_id (UUID)');
  console.log('   ✅ grupo_nombre (referencia)');
  console.log('   ✅ numero_ciclo (1 por defecto)');
  console.log('   ✅ expediente_id (UUID)');
  console.log('   ✅ tesorera_id (donde existe)');
  console.log('   ✅ tesorera_nombre (referencia)');
  console.log('   ✅ estado (ACTIVO por defecto)');

  console.log('\n📝 COLUMNAS A COMPLETAR MANUALMENTE:');
  console.log('   ⚠️  folio (opcional)');
  console.log('   ⚠️  asesora_id (requiere datos de empleados)');
  console.log('   ⚠️  fecha_inicio (REQUERIDO)');
  console.log('   ⚠️  fecha_fin (opcional)');
  console.log('   ⚠️  dia_pago (REQUERIDO)');

  console.log('\n📄 HOJAS DEL EXCEL:');
  console.log('   1. CICLOS - Datos para completar');
  console.log('   2. INSTRUCCIONES - Guía columna por columna');
  console.log('   3. REF_Grupos - Referencia de grupos');
  console.log('   4. REF_Tesoreras - Referencia de tesoreras');
  console.log('   5. VALORES_PERMITIDOS - Valores válidos por campo');

  console.log('\n✅ SIGUIENTE PASO:');
  console.log('   1. Abre el archivo Excel');
  console.log('   2. Completa las columnas marcadas con ⚠️');
  console.log('   3. Guarda el archivo');
  console.log('   4. Ejecuta: npm run ciclos:migrar');

  await pool.end();
}

generarPlantillaCiclos()
  .then(() => {
    console.log('\n✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
