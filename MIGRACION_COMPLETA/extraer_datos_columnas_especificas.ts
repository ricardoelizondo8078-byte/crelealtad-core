import * as XLSX from 'xlsx';
import * as fs from 'fs';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  EXTRAYENDO DATOS DE COLUMNAS ESPECÍFICAS');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS 76.xlsm';
const workbook = XLSX.readFile(excelPath);

console.log(`📂 Archivo: BASE DE DATOS 76.xlsm`);
console.log(`📋 Hojas: ${workbook.SheetNames.join(', ')}\n`);

// Probar todas las hojas
workbook.SheetNames.forEach(sheetName => {
  console.log('═'.repeat(80));
  console.log(`  HOJA: ${sheetName}`);
  console.log('═'.repeat(80));

  const ws = workbook.Sheets[sheetName];
  const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (dataArray.length === 0) {
    console.log('   (vacía)\n');
    return;
  }

  console.log(`\nTotal de filas: ${dataArray.length}`);

  const encabezados: any = dataArray[0];

  // W = columna 22 (índice 22)
  // X = columna 23 (índice 23)
  // J = columna 9 (índice 9)
  const indiceJ = 9;   // Columna J
  const indiceW = 22;  // Columna W
  const indiceX = 23;  // Columna X

  console.log(`\nEncabezados de columnas específicas:`);
  console.log(`   Columna J [${indiceJ}]: ${encabezados[indiceJ] || '(sin nombre)'}`);
  console.log(`   Columna W [${indiceW}]: ${encabezados[indiceW] || '(sin nombre)'}`);
  console.log(`   Columna X [${indiceX}]: ${encabezados[indiceX] || '(sin nombre)'}`);

  // Ver si tienen datos
  const muestraJ: any[] = [];
  const muestraW: any[] = [];
  const muestraX: any[] = [];

  for (let i = 1; i < Math.min(50, dataArray.length); i++) {
    const fila: any = dataArray[i];
    if (Array.isArray(fila)) {
      if (fila[indiceJ]) muestraJ.push(fila[indiceJ]);
      if (fila[indiceW]) muestraW.push(fila[indiceW]);
      if (fila[indiceX]) muestraX.push(fila[indiceX]);
    }
  }

  console.log(`\nMuestra de valores (primeras filas con datos):`);
  console.log(`   Columna J (FECHA DESEMBOLSO): ${muestraJ.slice(0, 10).join(', ')}`);
  console.log(`   Columna W (DÍA DE PAGO): ${muestraW.slice(0, 10).join(', ')}`);
  console.log(`   Columna X (HORA DE PAGO): ${muestraX.slice(0, 10).join(', ')}`);

  // Si encontramos datos, extraer toda la información
  if (muestraJ.length > 0 || muestraW.length > 0) {
    console.log('\n✅ DATOS ENCONTRADOS! Extrayendo toda la información...\n');

    // Leer como JSON para tener acceso a todas las columnas
    const dataJson = XLSX.utils.sheet_to_json(ws);

    console.log(`Total de registros JSON: ${dataJson.length}`);

    // Ver las primeras columnas para identificar GRUPO, NOMBRE, etc.
    if (dataJson.length > 0) {
      const primerRegistro: any = dataJson[0];
      const todasLasColumnas = Object.keys(primerRegistro);

      console.log(`\nTodas las columnas (${todasLasColumnas.length}):`);
      todasLasColumnas.forEach((col, idx) => {
        if (idx < 30) { // Mostrar primeras 30
          const valor = primerRegistro[col];
          if (valor && String(valor).trim() !== '') {
            console.log(`   [${String(idx).padStart(2)}] ${col}: ${String(valor).substring(0, 60)}`);
          }
        }
      });

      // Extraer mapeo completo
      console.log('\n\n📊 Extrayendo mapeo completo de datos...');

      const registrosExtraidos: any[] = [];

      dataJson.forEach((row: any) => {
        const columnas = Object.keys(row);

        // Intentar identificar columnas importantes por posición o nombre
        const colJ = columnas[indiceJ] || null;
        const colW = columnas[indiceW] || null;
        const colX = columnas[indiceX] || null;

        const fechaDesembolso = colJ ? row[colJ] : null;
        const diaPago = colW ? row[colW] : null;
        const horaPago = colX ? row[colX] : null;

        // Buscar columnas de GRUPO, NOMBRE, CICLO
        let grupo: any = null;
        let nombre: any = null;
        let ciclo: any = null;

        columnas.forEach(col => {
          const colLower = col.toLowerCase();
          if (colLower.includes('grupo') && !grupo) {
            grupo = row[col];
          }
          if (colLower.includes('nombre') && !nombre) {
            nombre = row[col];
          }
          if (colLower.includes('ciclo') && !ciclo) {
            ciclo = row[col];
          }
        });

        if (fechaDesembolso || diaPago || grupo) {
          registrosExtraidos.push({
            grupo,
            nombre,
            ciclo,
            fecha_desembolso: fechaDesembolso,
            dia_pago: diaPago,
            hora_pago: horaPago,
            // Incluir primeras 10 columnas para debug
            col_0: row[columnas[0]],
            col_1: row[columnas[1]],
            col_2: row[columnas[2]],
            col_3: row[columnas[3]],
            col_4: row[columnas[4]],
          });
        }
      });

      console.log(`\nRegistros extraídos: ${registrosExtraidos.length}`);

      if (registrosExtraidos.length > 0) {
        console.log('\nMuestra de registros extraídos (primeros 10):');
        registrosExtraidos.slice(0, 10).forEach((r, idx) => {
          console.log(`\n${idx + 1}.`);
          console.log(`   Grupo: ${r.grupo || 'N/A'}`);
          console.log(`   Nombre: ${r.nombre || 'N/A'}`);
          console.log(`   Ciclo: ${r.ciclo || 'N/A'}`);
          console.log(`   Fecha Desembolso: ${r.fecha_desembolso || 'N/A'}`);
          console.log(`   Día Pago: ${r.dia_pago || 'N/A'}`);
          console.log(`   Hora Pago: ${r.hora_pago || 'N/A'}`);
        });

        // Guardar datos extraídos
        const outputPath = `data/logs/datos_extraidos_${sheetName.replace(/\s/g, '_')}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(registrosExtraidos, null, 2));
        console.log(`\n✅ Datos guardados en: ${outputPath}`);
      }
    }
  } else {
    console.log('\n⚠️  No se encontraron datos en estas columnas en esta hoja\n');
  }
});

console.log('\n═══════════════════════════════════════════════════════\n');
