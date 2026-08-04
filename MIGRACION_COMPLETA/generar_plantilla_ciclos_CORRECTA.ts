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

async function generarPlantillaCiclosCorrecta() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA DE CICLOS CORRECTA');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Leer el análisis de ciclos real
  console.log('📂 Leyendo análisis de ciclos desde integrantes_raw...');

  const analisisPath = 'data/logs/ciclos_desde_integrantes_raw.json';
  if (!fs.existsSync(analisisPath)) {
    console.error('❌ Error: No se encuentra el archivo de análisis');
    process.exit(1);
  }

  const analisis = JSON.parse(fs.readFileSync(analisisPath, 'utf-8'));

  console.log(`✅ Análisis cargado:`);
  console.log(`   Grupos: ${analisis.total_grupos}`);
  console.log(`   Ciclos totales: ${analisis.total_ciclos}\n`);

  // 2. Obtener datos de base de datos para relacionar
  console.log('📊 Obteniendo datos de grupos y tesoreras desde DB...');

  const gruposResult = await pool.query(`
    SELECT
      g.id as grupo_id,
      g.nombre as grupo_nombre,
      g.folio as grupo_folio,
      e.id as expediente_id
    FROM grupos g
    LEFT JOIN expedientes e ON e.grupo_id = g.id
    ORDER BY g.nombre;
  `);

  const gruposMap = new Map<string, any>();
  gruposResult.rows.forEach(g => {
    gruposMap.set(g.grupo_nombre, g);
  });

  console.log(`✅ Grupos en DB: ${gruposResult.rows.length}`);

  // Tesoreras
  const tesorerasResult = await pool.query(`
    SELECT
      bt.grupo_nombre,
      bt.persona_id as tesorera_id,
      bt.curp,
      bt.nombre_completo
    FROM backup_tesoreras_20260802 bt
  `);

  const tesorerasMap = new Map<string, any>();
  tesorerasResult.rows.forEach(t => {
    if (!tesorerasMap.has(t.grupo_nombre)) {
      tesorerasMap.set(t.grupo_nombre, t);
    }
  });

  console.log(`✅ Tesoreras en DB: ${tesorerasResult.rows.length}\n`);

  // 3. Generar plantilla de ciclos
  console.log('🔧 Generando plantilla de ciclos...\n');

  const ciclos: any[] = [];
  let gruposEncontrados = 0;
  let gruposNoEncontrados = 0;
  const gruposFaltantes: string[] = [];

  analisis.detalle.forEach((grupoAnalisis: any) => {
    const nombreGrupo = grupoAnalisis.grupo;
    const grupoDb = gruposMap.get(nombreGrupo);

    if (!grupoDb) {
      gruposNoEncontrados++;
      if (gruposFaltantes.length < 20) {
        gruposFaltantes.push(nombreGrupo);
      }
      return;
    }

    gruposEncontrados++;

    // Obtener tesorera del grupo
    const tesorera = tesorerasMap.get(nombreGrupo);

    // Crear un ciclo por cada numero_ciclo encontrado
    grupoAnalisis.ciclos.forEach((numeroCiclo: number) => {
      ciclos.push({
        // IDs relacionales
        grupo_id: grupoDb.grupo_id,
        grupo_nombre: nombreGrupo, // REFERENCIA
        grupo_folio: grupoDb.grupo_folio || '', // REFERENCIA

        // Número de ciclo (DATO REAL DEL EXCEL)
        numero_ciclo: numeroCiclo,

        // Expediente
        expediente_id: grupoDb.expediente_id || '',

        // Tesorera (pre-poblada si existe)
        tesorera_id: tesorera?.tesorera_id || '',
        tesorera_nombre: tesorera?.nombre_completo || '', // REFERENCIA
        tesorera_curp: tesorera?.curp || '', // REFERENCIA

        // Asesora (a completar manualmente)
        asesora_id: '',
        asesora_nombre: '',

        // Folio (opcional)
        folio: '',

        // Fechas (a completar manualmente)
        fecha_inicio: '',
        fecha_fin: '',

        // Día de pago (a completar manualmente)
        dia_pago: '',

        // Estado (por defecto ACTIVO si es el ciclo más alto, FINALIZADO si no)
        estado: numeroCiclo === Math.max(...grupoAnalisis.ciclos) ? 'ACTIVO' : 'FINALIZADO',

        // Auto-generados (dejar vacíos)
        id: '',
        created_at: '',
        updated_at: '',

        // Campos auxiliares
        notas: ''
      });
    });
  });

  console.log('✅ Plantilla generada:');
  console.log(`   Ciclos totales: ${ciclos.length}`);
  console.log(`   Grupos encontrados en DB: ${gruposEncontrados}`);
  console.log(`   Grupos NO encontrados en DB: ${gruposNoEncontrados}`);

  if (gruposFaltantes.length > 0) {
    console.log(`\n⚠️  Grupos no encontrados en DB (muestra):`);
    gruposFaltantes.forEach(g => console.log(`   - ${g}`));
  }

  // 4. Crear Excel
  console.log('\n📄 Creando archivo Excel...\n');

  const wb = XLSX.utils.book_new();

  // Hoja 1: CICLOS
  const ws1 = XLSX.utils.json_to_sheet(ciclos);
  ws1['!cols'] = [
    { wch: 36 }, // grupo_id
    { wch: 35 }, // grupo_nombre
    { wch: 15 }, // grupo_folio
    { wch: 12 }, // numero_ciclo
    { wch: 36 }, // expediente_id
    { wch: 36 }, // tesorera_id
    { wch: 35 }, // tesorera_nombre
    { wch: 18 }, // tesorera_curp
    { wch: 36 }, // asesora_id
    { wch: 30 }, // asesora_nombre
    { wch: 15 }, // folio
    { wch: 12 }, // fecha_inicio
    { wch: 12 }, // fecha_fin
    { wch: 15 }, // dia_pago
    { wch: 12 }, // estado
    { wch: 10 }, // id
    { wch: 20 }, // created_at
    { wch: 20 }, // updated_at
    { wch: 40 }, // notas
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'CICLOS');

  // Hoja 2: INSTRUCCIONES
  const instrucciones = [
    { Paso: '1', Accion: 'VERIFICAR', Descripcion: 'Los ciclos se han pre-cargado desde el Excel original con los números reales de ciclo por grupo' },
    { Paso: '2', Accion: 'COMPLETAR', Descripcion: 'Llenar las columnas REQUERIDAS: asesora_id, fecha_inicio, dia_pago' },
    { Paso: '3', Accion: 'OPCIONAL', Descripcion: 'Completar: folio, fecha_fin (si el ciclo ya finalizó), ajustar estado si necesario' },
    { Paso: '4', Accion: 'NO MODIFICAR', Descripcion: 'grupo_id, grupo_nombre, numero_ciclo, expediente_id, tesorera_id (ya están correctos)' },
    { Paso: '5', Accion: 'DEJAR VACIO', Descripcion: 'id, created_at, updated_at (se generan automáticamente en DB)' },
  ];
  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: DETALLES DE COLUMNAS
  const detalles = [
    { Columna: 'grupo_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'YA COMPLETADO', Ejemplo: '7baf4959-...' },
    { Columna: 'grupo_nombre', Tipo: 'Texto', Requerido: 'NO', Accion: 'REFERENCIA - no se migra', Ejemplo: 'GABINAS VIP' },
    { Columna: 'numero_ciclo', Tipo: 'Entero', Requerido: 'SI', Accion: 'YA COMPLETADO desde Excel', Ejemplo: '1, 2, 3...' },
    { Columna: 'expediente_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'YA COMPLETADO', Ejemplo: '548a46aa-...' },
    { Columna: 'tesorera_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'YA COMPLETADO (verificar)', Ejemplo: 'd1c082ad-...' },
    { Columna: 'asesora_id', Tipo: 'UUID', Requerido: 'SI', Accion: 'COMPLETAR MANUALMENTE', Ejemplo: 'UUID empleado' },
    { Columna: 'asesora_nombre', Tipo: 'Texto', Requerido: 'NO', Accion: 'COMPLETAR para referencia', Ejemplo: 'MARIA LOPEZ' },
    { Columna: 'folio', Tipo: 'Texto', Requerido: 'NO', Accion: 'OPCIONAL', Ejemplo: 'CIC-001' },
    { Columna: 'fecha_inicio', Tipo: 'Fecha', Requerido: 'SI', Accion: 'COMPLETAR (YYYY-MM-DD)', Ejemplo: '2024-01-15' },
    { Columna: 'fecha_fin', Tipo: 'Fecha', Requerido: 'NO', Accion: 'OPCIONAL (si finalizó)', Ejemplo: '2024-12-15' },
    { Columna: 'dia_pago', Tipo: 'Enum', Requerido: 'SI', Accion: 'COMPLETAR', Ejemplo: 'LUNES, MARTES...' },
    { Columna: 'estado', Tipo: 'Enum', Requerido: 'SI', Accion: 'YA COMPLETADO (ajustar si necesario)', Ejemplo: 'ACTIVO, FINALIZADO' },
  ];
  const ws3 = XLSX.utils.json_to_sheet(detalles);
  XLSX.utils.book_append_sheet(wb, ws3, 'DETALLES_COLUMNAS');

  // Hoja 4: ESTADISTICAS
  const distribucion = new Map<number, number>();
  ciclos.forEach(c => {
    const numCiclos = ciclos.filter(x => x.grupo_id === c.grupo_id).length;
    distribucion.set(numCiclos, (distribucion.get(numCiclos) || 0) + 1);
  });

  const estadisticas: any[] = [
    { Metrica: 'Total de ciclos', Valor: ciclos.length },
    { Metrica: 'Total de grupos', Valor: gruposEncontrados },
    { Metrica: 'Grupos con múltiples ciclos', Valor: ciclos.length - gruposEncontrados },
    { Metrica: 'Promedio ciclos por grupo', Valor: (ciclos.length / gruposEncontrados).toFixed(2) },
    { Metrica: 'Máximo ciclos en un grupo', Valor: Math.max(...Array.from(distribucion.keys())) },
  ];

  const distribArray: any[] = [];
  Array.from(distribucion.keys()).sort((a, b) => a - b).forEach(numCiclos => {
    const cantidad = distribucion.get(numCiclos)!;
    distribArray.push({
      'Num Ciclos': numCiclos,
      'Cantidad Grupos': cantidad
    });
  });

  const ws4 = XLSX.utils.json_to_sheet([
    ...estadisticas,
    {},
    { Metrica: 'DISTRIBUCIÓN POR NÚMERO DE CICLOS' },
    ...distribArray
  ]);
  XLSX.utils.book_append_sheet(wb, ws4, 'ESTADISTICAS');

  // Hoja 5: VALORES PERMITIDOS
  const valoresPermitidos = [
    { Campo: 'dia_pago', Valores: 'LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO' },
    { Campo: 'estado', Valores: 'ACTIVO, FINALIZADO, CANCELADO, EN_PROCESO' },
  ];
  const ws5 = XLSX.utils.json_to_sheet(valoresPermitidos);
  XLSX.utils.book_append_sheet(wb, ws5, 'VALORES_PERMITIDOS');

  // Guardar
  const excelPath = 'data/logs/PLANTILLA_CICLOS_CORRECTA.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel generado: ${excelPath}\n`);

  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 COMPARACIÓN:');
  console.log(`   Plantilla ANTERIOR (incorrecta): 493 ciclos (1 por grupo)`);
  console.log(`   Plantilla CORRECTA (esta): ${ciclos.length} ciclos (múltiples por grupo)\n`);

  console.log('✅ DATOS PRE-COMPLETADOS:');
  console.log(`   - grupo_id (${ciclos.length} ciclos)`);
  console.log(`   - numero_ciclo (desde Excel original)`);
  console.log(`   - expediente_id (${ciclos.filter(c => c.expediente_id).length} ciclos)`);
  console.log(`   - tesorera_id (${ciclos.filter(c => c.tesorera_id).length} ciclos)`);
  console.log(`   - estado (predeterminado ACTIVO/FINALIZADO)\n`);

  console.log('⚠️  CAMPOS A COMPLETAR:');
  console.log(`   - asesora_id (${ciclos.length} ciclos)`);
  console.log(`   - fecha_inicio (${ciclos.length} ciclos)`);
  console.log(`   - dia_pago (${ciclos.length} ciclos)\n`);

  console.log('📋 SIGUIENTE PASO:');
  console.log('   1. Abrir PLANTILLA_CICLOS_CORRECTA.xlsx');
  console.log('   2. Completar: asesora_id, fecha_inicio, dia_pago');
  console.log('   3. Guardar');
  console.log('   4. Ejecutar: npm run ciclos:migrar\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

generarPlantillaCiclosCorrecta()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
