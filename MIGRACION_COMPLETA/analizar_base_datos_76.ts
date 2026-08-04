import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ANALIZANDO BASE DE DATOS 76 (ARCHIVO ORIGINAL)');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS 76.xlsm';
const workbook = XLSX.readFile(excelPath);

console.log(`📂 Archivo: BASE DE DATOS 76.xlsm`);
console.log(`📋 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n`);

workbook.SheetNames.forEach(sheetName => {
  console.log('═'.repeat(80));
  console.log(`  HOJA: ${sheetName}`);
  console.log('═'.repeat(80));

  const ws = workbook.Sheets[sheetName];

  // Leer como array para ver encabezados reales
  const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log(`\nTotal de filas: ${dataArray.length}`);

  if (dataArray.length > 0) {
    const encabezados: any = dataArray[0];

    if (Array.isArray(encabezados) && encabezados.length > 0) {
      console.log(`\nENCEBEZADOS (${encabezados.length} columnas):`);

      encabezados.forEach((col: any, idx: number) => {
        if (col && String(col).trim() !== '') {
          const colStr = String(col).toLowerCase();

          // Marcar columnas importantes
          let marca = '   ';
          if (colStr.includes('dia') && (colStr.includes('pago') || colStr.includes('visita') ||
              colStr.includes('lunes') || colStr.includes('martes') || colStr.includes('miercoles') ||
              colStr.includes('jueves') || colStr.includes('viernes') || colStr.includes('sabado') ||
              colStr.includes('domingo'))) {
            marca = '🔵 ';
          } else if (colStr.includes('fecha') || colStr.includes('desembolso') || colStr.includes('inicio')) {
            marca = '🟢 ';
          } else if (colStr.includes('grupo')) {
            marca = '🟡 ';
          } else if (colStr.includes('ciclo')) {
            marca = '🟠 ';
          } else if (colStr.includes('asesor') || colStr.includes('lupita')) {
            marca = '🟣 ';
          }

          console.log(`${marca}[${String(idx).padStart(3)}] ${col}`);
        }
      });

      // Leer datos como JSON
      const dataJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (dataJson.length > 0) {
        console.log(`\n\nMUESTRA DE 5 REGISTROS:`);

        dataJson.slice(0, 5).forEach((row: any, idx) => {
          console.log(`\n--- Registro ${idx + 1} ---`);

          Object.keys(row).forEach(key => {
            const valor = row[key];
            if (valor && String(valor).trim() !== '') {
              const keyLower = key.toLowerCase();

              // Solo mostrar campos importantes
              if (keyLower.includes('grupo') || keyLower.includes('ciclo') ||
                  keyLower.includes('dia') || keyLower.includes('pago') ||
                  keyLower.includes('fecha') || keyLower.includes('desembolso') ||
                  keyLower.includes('inicio') || keyLower.includes('nombre') ||
                  keyLower.includes('asesor') || keyLower.includes('lupita')) {
                console.log(`   ${key}: ${String(valor).substring(0, 80)}`);
              }
            }
          });
        });

        // Buscar columnas clave
        const primerRegistro: any = dataJson[0];
        const columnas = Object.keys(primerRegistro);

        const colDiaPago = columnas.find(c => {
          const cl = c.toLowerCase();
          return (cl.includes('dia') && cl.includes('pago')) ||
                 cl.includes('dia pago') ||
                 (cl.includes('dia') && cl.includes('visita'));
        });

        const colFecha = columnas.find(c => {
          const cl = c.toLowerCase();
          return (cl.includes('fecha') && (cl.includes('desembolso') || cl.includes('inicio')));
        });

        const colGrupo = columnas.find(c => c.toLowerCase().includes('grupo'));
        const colCiclo = columnas.find(c => c.toLowerCase().includes('ciclo'));

        console.log('\n\n🔍 COLUMNAS CLAVE DETECTADAS:');
        console.log(`   GRUPO: ${colGrupo || 'NO ENCONTRADO'}`);
        console.log(`   CICLO: ${colCiclo || 'NO ENCONTRADO'}`);
        console.log(`   DÍA DE PAGO: ${colDiaPago || 'NO ENCONTRADO'}`);
        console.log(`   FECHA DESEMBOLSO: ${colFecha || 'NO ENCONTRADO'}`);

        if (colDiaPago) {
          const valoresUnicos = new Set();
          dataJson.forEach((r: any) => {
            if (r[colDiaPago]) valoresUnicos.add(r[colDiaPago]);
          });
          console.log(`\n   Valores de ${colDiaPago}: ${Array.from(valoresUnicos).slice(0, 20).join(', ')}`);
        }

        if (colFecha) {
          const valoresUnicos = new Set();
          dataJson.slice(0, 100).forEach((r: any) => {
            if (r[colFecha]) valoresUnicos.add(r[colFecha]);
          });
          console.log(`\n   Valores de ${colFecha} (muestra): ${Array.from(valoresUnicos).slice(0, 10).join(', ')}`);
        }
      }
    }
  }

  console.log('\n\n');
});

console.log('═'.repeat(80));
console.log('LEYENDA:');
console.log('  🔵 DÍA DE PAGO');
console.log('  🟢 FECHA/DESEMBOLSO');
console.log('  🟡 GRUPO');
console.log('  🟠 CICLO');
console.log('  🟣 ASESOR');
console.log('═'.repeat(80));
console.log('\n');
