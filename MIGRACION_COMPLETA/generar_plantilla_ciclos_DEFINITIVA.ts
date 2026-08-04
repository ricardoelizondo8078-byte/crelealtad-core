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

async function generarPlantillaDefinitiva() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO PLANTILLA DEFINITIVA DE CICLOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Cargar datos del Excel BASE DE DATOS 76
  console.log('📂 Cargando datos del Excel BASE DE DATOS 76...');
  const datosExcel = JSON.parse(fs.readFileSync('data/logs/grupo_ciclo_fecha_dia_FINAL.json', 'utf-8'));
  console.log(`   ✅ ${datosExcel.length} ciclos del Excel\n`);

  // 2. Cargar datos de integrantes_raw
  console.log('📂 Cargando datos de integrantes_raw...');
  const analisisCiclos = JSON.parse(fs.readFileSync('data/logs/ciclos_desde_integrantes_raw.json', 'utf-8'));
  console.log(`   ✅ ${analisisCiclos.total_ciclos} ciclos de integrantes_raw\n`);

  // 3. Obtener datos de la base de datos
  console.log('📊 Obteniendo datos de la base de datos...');

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
    // Normalizar nombre del grupo
    const nombreNormalizado = g.grupo_nombre.toUpperCase().trim();
    gruposMap.set(nombreNormalizado, g);
  });

  console.log(`   ✅ ${gruposResult.rows.length} grupos en DB`);

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
    const nombreNormalizado = t.grupo_nombre.toUpperCase().trim();
    if (!tesorerasMap.has(nombreNormalizado)) {
      tesorerasMap.set(nombreNormalizado, t);
    }
  });

  console.log(`   ✅ ${tesorerasResult.rows.length} tesoreras en DB\n`);

  // 4. Crear mapa de Excel por GRUPO + CICLO
  const excelMap = new Map<string, any>();
  datosExcel.forEach((d: any) => {
    const nombreNormalizado = String(d.grupo).toUpperCase().trim();
    const key = `${nombreNormalizado}|${d.ciclo}`;
    excelMap.set(key, d);
  });

  // 5. Generar ciclos combinando todas las fuentes
  console.log('🔧 Generando plantilla de ciclos...\n');

  const ciclos: any[] = [];
  const gruposNoEncontrados = new Set<string>();
  const ciclosGenerados = new Set<string>();

  // Recorrer los ciclos de integrantes_raw
  analisisCiclos.detalle.forEach((grupoData: any) => {
    const nombreGrupoOriginal = grupoData.grupo;
    const nombreNormalizado = nombreGrupoOriginal.toUpperCase().trim();

    const grupoDb = gruposMap.get(nombreNormalizado);

    if (!grupoDb) {
      gruposNoEncontrados.add(nombreGrupoOriginal);
      return;
    }

    const tesorera = tesorerasMap.get(nombreNormalizado);

    // Para cada ciclo del grupo
    grupoData.ciclos.forEach((numeroCiclo: number) => {
      const key = `${nombreNormalizado}|${numeroCiclo}`;

      // Evitar duplicados
      if (ciclosGenerados.has(key)) {
        return;
      }
      ciclosGenerados.add(key);

      // Buscar datos del Excel
      const datosExcelCiclo = excelMap.get(key);

      // Mapear día de pago abreviado a completo
      const mapearDia = (diaAbrev: string): string => {
        if (!diaAbrev) return '';
        const dia = diaAbrev.toUpperCase().trim();
        const mapeo: any = {
          'LUN': 'LUNES',
          'MAR': 'MARTES',
          'MIE': 'MIERCOLES',
          'JUE': 'JUEVES',
          'VIE': 'VIERNES',
          'SAB': 'SABADO',
          'DOM': 'DOMINGO',
        };
        return mapeo[dia] || dia;
      };

      // Convertir fecha de Excel a formato YYYY-MM-DD
      const convertirFecha = (fechaExcel: string): string => {
        if (!fechaExcel) return '';

        try {
          // Si ya está en formato DD-MMM-YY (ej: "8-Sep-23")
          if (fechaExcel.includes('-')) {
            const partes = fechaExcel.split('-');
            if (partes.length === 3) {
              const dia = partes[0].padStart(2, '0');
              const mesAbrev = partes[1];
              let anio = partes[2];

              // Convertir año de 2 dígitos a 4
              if (anio.length === 2) {
                const anioNum = parseInt(anio);
                anio = anioNum >= 50 ? `19${anio}` : `20${anio}`;
              }

              // Mapear mes
              const meses: any = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
              };

              const mes = meses[mesAbrev] || '01';

              return `${anio}-${mes}-${dia}`;
            }
          }

          return fechaExcel;
        } catch (e) {
          return fechaExcel;
        }
      };

      const fechaDesembolso = datosExcelCiclo?.fecha_desembolso
        ? convertirFecha(datosExcelCiclo.fecha_desembolso)
        : '';

      const diaPago = datosExcelCiclo?.dia_pago
        ? mapearDia(datosExcelCiclo.dia_pago)
        : '';

      // Determinar estado: ACTIVO si es el ciclo más alto, FINALIZADO si no
      const cicloMaximo = Math.max(...grupoData.ciclos);
      const estado = numeroCiclo === cicloMaximo ? 'ACTIVO' : 'FINALIZADO';

      ciclos.push({
        // IDs de base de datos
        grupo_id: grupoDb.grupo_id,
        grupo_nombre: nombreGrupoOriginal, // REFERENCIA
        expediente_id: grupoDb.expediente_id || '',

        // Datos del ciclo
        numero_ciclo: numeroCiclo,
        folio: '', // A completar manualmente si se desea

        // Tesorera
        tesorera_id: tesorera?.tesorera_id || '',
        tesorera_nombre: tesorera?.nombre_completo || '', // REFERENCIA
        tesorera_curp: tesorera?.curp || '', // REFERENCIA

        // Asesora (a completar)
        asesora_id: '', // COMPLETAR MANUALMENTE
        asesora_nombre: '', // COMPLETAR para referencia

        // Fechas y horarios
        fecha_inicio: fechaDesembolso, // YA COMPLETADO del Excel
        fecha_fin: '', // OPCIONAL
        dia_pago: diaPago, // YA COMPLETADO del Excel
        hora_pago: datosExcelCiclo?.hora_pago || '', // REFERENCIA

        // Estado
        estado: estado,

        // Campos auto-generados (dejar vacíos)
        id: '',
        created_at: '',
        updated_at: '',

        // Campos de ayuda
        notas: ''
      });
    });
  });

  console.log(`✅ Ciclos generados: ${ciclos.length}`);
  console.log(`   Grupos no encontrados en DB: ${gruposNoEncontrados.size}\n`);

  if (gruposNoEncontrados.size > 0 && gruposNoEncontrados.size < 20) {
    console.log('⚠️  Grupos no encontrados:');
    Array.from(gruposNoEncontrados).forEach(g => console.log(`   - ${g}`));
    console.log('');
  }

  // 6. Estadísticas
  const conFecha = ciclos.filter(c => c.fecha_inicio).length;
  const conDia = ciclos.filter(c => c.dia_pago).length;
  const conTesorera = ciclos.filter(c => c.tesorera_id).length;

  console.log('📊 ESTADÍSTICAS:');
  console.log(`   Total ciclos: ${ciclos.length}`);
  console.log(`   Con fecha_inicio: ${conFecha} (${((conFecha / ciclos.length) * 100).toFixed(1)}%)`);
  console.log(`   Con dia_pago: ${conDia} (${((conDia / ciclos.length) * 100).toFixed(1)}%)`);
  console.log(`   Con tesorera_id: ${conTesorera} (${((conTesorera / ciclos.length) * 100).toFixed(1)}%)`);

  // 7. Crear Excel
  console.log('\n📄 Creando archivo Excel...\n');

  const wb = XLSX.utils.book_new();

  // Hoja 1: CICLOS
  const ws1 = XLSX.utils.json_to_sheet(ciclos);
  ws1['!cols'] = [
    { wch: 36 }, // grupo_id
    { wch: 35 }, // grupo_nombre
    { wch: 36 }, // expediente_id
    { wch: 12 }, // numero_ciclo
    { wch: 15 }, // folio
    { wch: 36 }, // tesorera_id
    { wch: 35 }, // tesorera_nombre
    { wch: 18 }, // tesorera_curp
    { wch: 36 }, // asesora_id
    { wch: 30 }, // asesora_nombre
    { wch: 12 }, // fecha_inicio
    { wch: 12 }, // fecha_fin
    { wch: 15 }, // dia_pago
    { wch: 10 }, // hora_pago
    { wch: 12 }, // estado
    { wch: 10 }, // id
    { wch: 20 }, // created_at
    { wch: 20 }, // updated_at
    { wch: 40 }, // notas
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'CICLOS');

  // Hoja 2: INSTRUCCIONES
  const instrucciones = [
    { Paso: '✅ DATOS YA COMPLETADOS', Campo: 'grupo_id, grupo_nombre, numero_ciclo, expediente_id', Descripcion: 'No modificar - ya están correctos' },
    { Paso: '✅ DATOS YA COMPLETADOS', Campo: 'tesorera_id, tesorera_nombre', Descripcion: `${conTesorera} ciclos tienen tesorera asignada` },
    { Paso: '✅ DATOS YA COMPLETADOS', Campo: 'fecha_inicio', Descripcion: `${conFecha} ciclos tienen fecha (del Excel BASE 76)` },
    { Paso: '✅ DATOS YA COMPLETADOS', Campo: 'dia_pago', Descripcion: `${conDia} ciclos tienen día (del Excel BASE 76)` },
    { Paso: '✅ DATOS YA COMPLETADOS', Campo: 'estado', Descripcion: 'ACTIVO/FINALIZADO según último ciclo' },
    { Paso: '', Campo: '', Descripcion: '' },
    { Paso: '⚠️  COMPLETAR MANUALMENTE', Campo: 'asesora_id', Descripcion: `UUID de empleada - ${ciclos.length} ciclos` },
    { Paso: '⚠️  COMPLETAR SI FALTA', Campo: 'fecha_inicio', Descripcion: `${ciclos.length - conFecha} ciclos sin fecha` },
    { Paso: '⚠️  COMPLETAR SI FALTA', Campo: 'dia_pago', Descripcion: `${ciclos.length - conDia} ciclos sin día` },
    { Paso: '', Campo: '', Descripcion: '' },
    { Paso: '📝 OPCIONAL', Campo: 'folio, fecha_fin, notas', Descripcion: 'Completar si se desea' },
    { Paso: '🚫 NO TOCAR', Campo: 'id, created_at, updated_at', Descripcion: 'Se generan automáticamente' },
  ];
  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');

  // Hoja 3: ESTADÍSTICAS
  const stats = [
    { Metrica: 'Total de ciclos', Valor: ciclos.length },
    { Metrica: 'Grupos únicos', Valor: new Set(ciclos.map(c => c.grupo_nombre)).size },
    { Metrica: 'Con fecha_inicio', Valor: conFecha },
    { Metrica: 'Con dia_pago', Valor: conDia },
    { Metrica: 'Con tesorera', Valor: conTesorera },
    { Metrica: 'Sin asesora (completar)', Valor: ciclos.length },
    { Metrica: '', Valor: '' },
    { Metrica: 'Ciclos ACTIVOS', Valor: ciclos.filter(c => c.estado === 'ACTIVO').length },
    { Metrica: 'Ciclos FINALIZADOS', Valor: ciclos.filter(c => c.estado === 'FINALIZADO').length },
  ];
  const ws3 = XLSX.utils.json_to_sheet(stats);
  XLSX.utils.book_append_sheet(wb, ws3, 'ESTADISTICAS');

  // Hoja 4: VALORES PERMITIDOS
  const valores = [
    { Campo: 'dia_pago', Valores: 'LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO' },
    { Campo: 'estado', Valores: 'ACTIVO, FINALIZADO, CANCELADO, EN_PROCESO' },
    { Campo: 'fecha_inicio', Valores: 'Formato: YYYY-MM-DD (2023-09-08)' },
    { Campo: 'fecha_fin', Valores: 'Formato: YYYY-MM-DD (2024-03-08) - OPCIONAL' },
  ];
  const ws4 = XLSX.utils.json_to_sheet(valores);
  XLSX.utils.book_append_sheet(wb, ws4, 'VALORES_PERMITIDOS');

  // Guardar
  const excelPath = 'data/logs/PLANTILLA_CICLOS_DEFINITIVA.xlsx';
  XLSX.writeFile(wb, excelPath);

  console.log(`✅ Archivo Excel creado: ${excelPath}\n`);

  // Resumen final
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📊 COMPARACIÓN CON PLANTILLAS ANTERIORES:');
  console.log(`   Plantilla 1 (incorrecta): 493 ciclos (1 por grupo)`);
  console.log(`   Plantilla 2 (correcta): 1,460 ciclos (múltiples por grupo)`);
  console.log(`   Plantilla DEFINITIVA: ${ciclos.length} ciclos ✅\n`);

  console.log('✅ DATOS PRE-COMPLETADOS:');
  console.log(`   ✓ grupo_id, grupo_nombre, numero_ciclo`);
  console.log(`   ✓ expediente_id`);
  console.log(`   ✓ tesorera_id (${conTesorera} de ${ciclos.length})`);
  console.log(`   ✓ fecha_inicio (${conFecha} de ${ciclos.length}) - del Excel BASE 76`);
  console.log(`   ✓ dia_pago (${conDia} de ${ciclos.length}) - del Excel BASE 76`);
  console.log(`   ✓ estado (ACTIVO/FINALIZADO)\n`);

  console.log('⚠️  CAMPOS A COMPLETAR:');
  console.log(`   • asesora_id (${ciclos.length} ciclos)`);
  console.log(`   • fecha_inicio (${ciclos.length - conFecha} ciclos faltantes)`);
  console.log(`   • dia_pago (${ciclos.length - conDia} ciclos faltantes)\n`);

  console.log('📋 SIGUIENTE PASO:');
  console.log('   1. Abrir: PLANTILLA_CICLOS_DEFINITIVA.xlsx');
  console.log('   2. Completar: asesora_id (requiere tabla empleados)');
  console.log('   3. Revisar: fecha_inicio y dia_pago faltantes');
  console.log('   4. Guardar');
  console.log('   5. Ejecutar: npm run ciclos:migrar\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

generarPlantillaDefinitiva()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
