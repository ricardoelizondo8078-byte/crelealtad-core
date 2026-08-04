import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  REVISIÓN COMPLETA DEL EXCEL ORIGINAL');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASEDATOS CRELEALTAD (1) (1).xlsx';
const workbook = XLSX.readFile(excelPath);

console.log(`📂 Archivo: BASEDATOS CRELEALTAD (1) (1).xlsx`);
console.log(`📋 Hojas: ${workbook.SheetNames.join(', ')}\n`);

workbook.SheetNames.forEach(sheetName => {
  console.log('═'.repeat(80));
  console.log(`  HOJA: ${sheetName}`);
  console.log('═'.repeat(80));

  const ws = workbook.Sheets[sheetName];

  // Leer como array de arrays para ver estructura real
  const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log(`\nTotal de filas: ${dataArray.length}`);

  if (dataArray.length > 0) {
    const primeraFila: any = dataArray[0];

    console.log(`\nENCABEZADOS (${primeraFila.length} columnas):`);
    primeraFila.forEach((col: any, idx: number) => {
      if (col && String(col).trim() !== '') {
        console.log(`${String(idx + 1).padStart(3)}. ${col}`);
      }
    });

    // Leer como JSON para ver datos
    const dataJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (dataJson.length > 0) {
      console.log(`\n\nPRIMER REGISTRO (JSON):`);
      const primerRegistro: any = dataJson[0];
      Object.keys(primerRegistro).forEach((key, idx) => {
        const valor = primerRegistro[key];
        console.log(`${String(idx + 1).padStart(3)}. ${key.padEnd(30)} = ${String(valor).substring(0, 60)}`);
      });

      console.log(`\n\nMUESTRA DE 5 REGISTROS:`);
      dataJson.slice(0, 5).forEach((row: any, idx) => {
        console.log(`\nRegistro ${idx + 1}:`);
        Object.keys(row).forEach(key => {
          const valor = row[key];
          if (valor && String(valor).trim() !== '') {
            console.log(`   ${key}: ${String(valor).substring(0, 80)}`);
          }
        });
      });
    }
  }

  console.log('\n\n');
});

console.log('═'.repeat(80));
console.log('FIN DE LA REVISIÓN');
console.log('═'.repeat(80));
console.log('\n');
