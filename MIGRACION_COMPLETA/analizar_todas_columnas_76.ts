import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ANÁLISIS PROFUNDO: TODAS LAS COLUMNAS DE BASE 76');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS 76.xlsm';
const workbook = XLSX.readFile(excelPath);

const ws = workbook.Sheets['BASE DE DATOS'];
const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log(`Total de filas: ${dataArray.length}\n`);

if (dataArray.length > 0) {
  const encabezados: any = dataArray[0];

  console.log(`TODAS LAS ${encabezados.length} COLUMNAS:\n`);

  encabezados.forEach((col: any, idx: number) => {
    if (col && String(col).trim() !== '') {
      const colStr = String(col);

      // Tomar muestra de valores de esta columna
      const valoresMuestra = [];
      for (let i = 1; i < Math.min(20, dataArray.length); i++) {
        const fila: any = dataArray[i];
        if (Array.isArray(fila) && fila[idx]) {
          valoresMuestra.push(fila[idx]);
        }
      }

      const valoresUnicos = [...new Set(valoresMuestra)].filter(v => v && String(v).trim() !== '');

      if (valoresUnicos.length > 0) {
        console.log(`[${String(idx).padStart(3)}] ${colStr}`);
        console.log(`      Valores: ${valoresUnicos.slice(0, 5).map(v => String(v).substring(0, 30)).join(' | ')}`);
      } else {
        console.log(`[${String(idx).padStart(3)}] ${colStr} (vacío)`);
      }
    } else {
      console.log(`[${String(idx).padStart(3)}] (sin nombre)`);
    }
  });

  // Buscar específicamente columnas con patrones de día de pago
  console.log('\n\n═'.repeat(40));
  console.log('BÚSQUEDA ESPECÍFICA DE COLUMNAS IMPORTANTES:');
  console.log('═'.repeat(40));

  const patronesBuscar = [
    { patron: /dia.*pago/i, nombre: 'DÍA DE PAGO' },
    { patron: /dia.*visita/i, nombre: 'DÍA DE VISITA' },
    { patron: /fecha.*desembolso/i, nombre: 'FECHA DESEMBOLSO' },
    { patron: /fecha.*inicio/i, nombre: 'FECHA INICIO' },
    { patron: /lunes|martes|miercoles|jueves|viernes|sabado|domingo/i, nombre: 'DÍA SEMANA' },
    { patron: /grupo/i, nombre: 'GRUPO' },
    { patron: /ciclo/i, nombre: 'CICLO' },
    { patron: /nombre/i, nombre: 'NOMBRE' },
  ];

  patronesBuscar.forEach(p => {
    console.log(`\n🔍 Buscando: ${p.nombre}`);

    const columnasEncontradas: any[] = [];

    encabezados.forEach((col: any, idx: number) => {
      if (col && p.patron.test(String(col))) {
        // Obtener valores de muestra
        const valores = [];
        for (let i = 1; i < Math.min(10, dataArray.length); i++) {
          const fila: any = dataArray[i];
          if (Array.isArray(fila) && fila[idx]) {
            valores.push(fila[idx]);
          }
        }

        columnasEncontradas.push({
          indice: idx,
          nombre: col,
          valores: valores.filter(v => v && String(v).trim() !== '')
        });
      }
    });

    if (columnasEncontradas.length > 0) {
      columnasEncontradas.forEach(c => {
        console.log(`   ✅ [${c.indice}] ${c.nombre}`);
        if (c.valores.length > 0) {
          console.log(`      Valores: ${c.valores.slice(0, 5).join(', ')}`);
        }
      });
    } else {
      console.log(`   ❌ No encontrado`);
    }
  });
}

console.log('\n═══════════════════════════════════════════════════════\n');
