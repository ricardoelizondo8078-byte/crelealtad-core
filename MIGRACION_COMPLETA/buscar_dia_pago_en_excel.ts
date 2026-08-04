import * as XLSX from 'xlsx';
import * as fs from 'fs';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  BUSCANDO DÍA DE PAGO Y FECHA DESEMBOLSO EN EXCEL');
console.log('═══════════════════════════════════════════════════════\n');

// Leer TODOS los Excel disponibles
const excels = [
  { nombre: 'BASEDATOS CRELEALTAD (1) (1).xlsx', path: '../BASEDATOS CRELEALTAD (1) (1).xlsx' },
  { nombre: 'BASE DE DATOS SEM 364.xlsm', path: '../BASE DE DATOS SEM 364.xlsm' }
];

excels.forEach(excelInfo => {
  console.log('═'.repeat(80));
  console.log(`  ARCHIVO: ${excelInfo.nombre}`);
  console.log('═'.repeat(80));

  try {
    const workbook = XLSX.readFile(excelInfo.path);

    console.log(`\nHojas: ${workbook.SheetNames.join(', ')}\n`);

    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n--- HOJA: ${sheetName} ---`);

      const ws = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

      if (data.length === 0) {
        console.log('   (vacía)');
        return;
      }

      console.log(`   Registros: ${data.length}`);

      // Tomar primera fila (encabezados)
      const encabezados: any = data[0];

      if (Array.isArray(encabezados)) {
        console.log(`\n   Columnas (${encabezados.length}):`);

        encabezados.forEach((col: any, idx: number) => {
          if (col && String(col).trim() !== '') {
            const colStr = String(col).toLowerCase();

            // Resaltar columnas importantes
            let marca = '   ';
            if (colStr.includes('dia') || colStr.includes('pago') ||
                colStr.includes('lunes') || colStr.includes('martes') ||
                colStr.includes('miercoles') || colStr.includes('jueves') ||
                colStr.includes('viernes') || colStr.includes('sabado') ||
                colStr.includes('domingo')) {
              marca = '🔵 ';
            } else if (colStr.includes('fecha') || colStr.includes('desembolso') ||
                       colStr.includes('date') || colStr.includes('inicio')) {
              marca = '🟢 ';
            } else if (colStr.includes('grupo')) {
              marca = '🟡 ';
            } else if (colStr.includes('ciclo')) {
              marca = '🟠 ';
            }

            console.log(`   ${marca}[${idx}] ${col}`);
          }
        });

        // Mostrar muestra de datos de columnas importantes
        const columnasImportantes: number[] = [];

        encabezados.forEach((col: any, idx: number) => {
          if (col) {
            const colStr = String(col).toLowerCase();
            if (colStr.includes('dia') || colStr.includes('pago') ||
                colStr.includes('fecha') || colStr.includes('desembolso') ||
                colStr.includes('grupo') || colStr.includes('ciclo')) {
              columnasImportantes.push(idx);
            }
          }
        });

        if (columnasImportantes.length > 0 && data.length > 1) {
          console.log(`\n   Muestra de datos (primeras 10 filas):`);

          for (let i = 1; i < Math.min(11, data.length); i++) {
            const fila: any = data[i];
            if (Array.isArray(fila)) {
              const valores = columnasImportantes
                .map(idx => `${encabezados[idx]}: ${fila[idx] || ''}`)
                .join(' | ');

              if (valores.trim() !== '') {
                console.log(`   Fila ${i}: ${valores.substring(0, 120)}`);
              }
            }
          }
        }
      }
    });

  } catch (error: any) {
    console.log(`❌ Error leyendo ${excelInfo.nombre}: ${error.message}`);
  }

  console.log('\n');
});

console.log('═'.repeat(80));
console.log('LEYENDA:');
console.log('  🔵 DÍA/PAGO');
console.log('  🟢 FECHA/DESEMBOLSO');
console.log('  🟡 GRUPO');
console.log('  🟠 CICLO');
console.log('═'.repeat(80));
console.log('\n');
