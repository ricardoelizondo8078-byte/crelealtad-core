import * as XLSX from 'xlsx';

const excelPath = '../TABLAS NUEVAS EN REVISION.xlsx';
console.log(`\n📂 Leyendo Excel: ${excelPath}\n`);

const workbook = XLSX.readFile(excelPath);
console.log(`📋 Hojas en el Excel:\n`);

workbook.SheetNames.forEach((sheetName, idx) => {
  console.log(`${idx + 1}. ${sheetName}`);

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`   Filas: ${data.length}`);

  if (data.length > 0) {
    console.log(`   Primera fila (headers):`);
    console.log(`   ${JSON.stringify(data[0])}`);

    if (data.length > 1) {
      console.log(`   Segunda fila (ejemplo):`);
      console.log(`   ${JSON.stringify(data[1])}`);
    }
  }

  console.log('');
});

// Buscar específicamente la hoja ESQUEMA_CORE
console.log('\n═══════════════════════════════════════════════════════');
console.log('DETALLE DE HOJA: ESQUEMA_CORE');
console.log('═══════════════════════════════════════════════════════\n');

const coreSheet = workbook.Sheets['ESQUEMA_CORE'];
if (coreSheet) {
  const coreData = XLSX.utils.sheet_to_json(coreSheet, { header: 1 });

  console.log(`Total de filas: ${coreData.length}\n`);

  // Mostrar primeras 30 filas
  for (let i = 0; i < Math.min(30, coreData.length); i++) {
    console.log(`Fila ${i}: ${JSON.stringify(coreData[i])}`);
  }
}
