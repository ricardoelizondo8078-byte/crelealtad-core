import * as XLSX from 'xlsx';
import * as fs from 'fs';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  EXTRAYENDO DE HOJA: BASE DE DATOS');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS 76.xlsm';
const workbook = XLSX.readFile(excelPath);

const ws = workbook.Sheets['BASE DE DATOS'];

// Leer como array para ver estructura exacta
const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

console.log(`Total de filas: ${dataArray.length}\n`);

// Índices de columnas (base 0)
// J = columna 9
// W = columna 22
// X = columna 23
const COL_J = 9;
const COL_W = 22;
const COL_X = 23;

// Ver encabezados de TODAS las columnas primeras
console.log('PRIMERAS 30 COLUMNAS (fila 1 - encabezados):');
const encabezados: any = dataArray[0];

for (let i = 0; i < Math.min(30, encabezados.length); i++) {
  const col = encabezados[i];
  const letra = String.fromCharCode(65 + i); // A=65
  console.log(`[${letra}] col[${String(i).padStart(2)}]: ${col || '(vacío)'}`);
}

console.log('\n\nVALORES DE LAS COLUMNAS ESPECÍFICAS:');
console.log(`Columna J [${COL_J}]: ${encabezados[COL_J]}`);
console.log(`Columna W [${COL_W}]: ${encabezados[COL_W]}`);
console.log(`Columna X [${COL_X}]: ${encabezados[COL_X]}`);

// Ver primeras 20 filas de datos
console.log('\n\nMUESTRA DE PRIMERAS 20 FILAS:');
console.log('═'.repeat(120));

for (let i = 1; i < Math.min(21, dataArray.length); i++) {
  const fila: any = dataArray[i];

  if (Array.isArray(fila)) {
    // Mostrar columnas importantes
    const colA = fila[0] || '';
    const colB = fila[1] || '';
    const colC = fila[2] || '';
    const colJ = fila[COL_J] || '';
    const colW = fila[COL_W] || '';
    const colX = fila[COL_X] || '';

    // Solo mostrar si tiene algún dato
    if (colA || colB || colC || colJ || colW || colX) {
      console.log(`\nFila ${String(i).padStart(3)}:`);
      console.log(`   [A] ${String(colA).substring(0, 40)}`);
      console.log(`   [B] ${String(colB).substring(0, 40)}`);
      console.log(`   [C] ${String(colC).substring(0, 40)}`);
      console.log(`   [J] Fecha: ${colJ}`);
      console.log(`   [W] Día: ${colW}`);
      console.log(`   [X] Hora: ${colX}`);
    }
  }
}

// Buscar en qué columnas están GRUPO, NOMBRE, CICLO
console.log('\n\n🔍 BUSCANDO COLUMNAS DE GRUPO, NOMBRE, CICLO:');
console.log('═'.repeat(80));

let colGrupo = -1;
let colNombre = -1;
let colCiclo = -1;

for (let i = 0; i < encabezados.length; i++) {
  const col = String(encabezados[i]).toLowerCase();

  if (col.includes('grupo') && colGrupo === -1) {
    colGrupo = i;
    const letra = i < 26 ? String.fromCharCode(65 + i) : `col${i}`;
    console.log(`✅ GRUPO encontrado en columna [${letra}] índice ${i}: ${encabezados[i]}`);
  }

  if (col.includes('nombre') && colNombre === -1) {
    colNombre = i;
    const letra = i < 26 ? String.fromCharCode(65 + i) : `col${i}`;
    console.log(`✅ NOMBRE encontrado en columna [${letra}] índice ${i}: ${encabezados[i]}`);
  }

  if (col.includes('ciclo') && colCiclo === -1) {
    colCiclo = i;
    const letra = i < 26 ? String.fromCharCode(65 + i) : `col${i}`;
    console.log(`✅ CICLO encontrado en columna [${letra}] índice ${i}: ${encabezados[i]}`);
  }
}

if (colGrupo === -1) console.log('❌ GRUPO no encontrado en encabezados');
if (colNombre === -1) console.log('❌ NOMBRE no encontrado en encabezados');
if (colCiclo === -1) console.log('❌ CICLO no encontrado en encabezados');

// Extraer TODOS los datos
console.log('\n\n📊 EXTRAYENDO TODOS LOS DATOS:');
console.log('═'.repeat(80));

const registros: any[] = [];

for (let i = 1; i < dataArray.length; i++) {
  const fila: any = dataArray[i];

  if (Array.isArray(fila)) {
    const grupo = colGrupo >= 0 ? fila[colGrupo] : null;
    const nombre = colNombre >= 0 ? fila[colNombre] : null;
    const ciclo = colCiclo >= 0 ? fila[colCiclo] : null;
    const fechaDesembolso = fila[COL_J];
    const diaPago = fila[COL_W];
    const horaPago = fila[COL_X];

    // Guardar si tiene algún dato relevante
    if (grupo || nombre || fechaDesembolso || diaPago) {
      registros.push({
        fila_num: i + 1, // +1 porque Excel empieza en 1
        grupo: grupo || null,
        nombre: nombre || null,
        ciclo: ciclo || null,
        fecha_desembolso: fechaDesembolso || null,
        dia_pago: diaPago || null,
        hora_pago: horaPago || null,
        // Primeras 5 columnas para referencia
        col_A: fila[0] || null,
        col_B: fila[1] || null,
        col_C: fila[2] || null,
        col_D: fila[3] || null,
        col_E: fila[4] || null,
      });
    }
  }
}

console.log(`\nTotal de registros extraídos: ${registros.length}`);

// Guardar
const outputPath = 'data/logs/datos_base_datos_76_COMPLETO.json';
fs.writeFileSync(outputPath, JSON.stringify(registros, null, 2));
console.log(`✅ Datos guardados en: ${outputPath}`);

// Analizar
const conGrupo = registros.filter(r => r.grupo && String(r.grupo).trim() !== '');
const conFecha = registros.filter(r => r.fecha_desembolso && String(r.fecha_desembolso).trim() !== '');
const conDia = registros.filter(r => r.dia_pago && String(r.dia_pago).trim() !== '');

console.log('\n📈 ESTADÍSTICAS:');
console.log(`   Registros con GRUPO: ${conGrupo.length}`);
console.log(`   Registros con FECHA: ${conFecha.length}`);
console.log(`   Registros con DÍA PAGO: ${conDia.length}`);

// Mostrar muestra
console.log('\n\n📋 MUESTRA DE REGISTROS CON DATOS (primeros 20):');
console.log('═'.repeat(120));

registros
  .filter(r => (r.grupo || r.nombre || r.dia_pago || r.fecha_desembolso))
  .slice(0, 20)
  .forEach((r, idx) => {
    console.log(`\n${idx + 1}. Fila Excel ${r.fila_num}:`);
    if (r.grupo) console.log(`   Grupo: ${r.grupo}`);
    if (r.nombre) console.log(`   Nombre: ${r.nombre}`);
    if (r.ciclo) console.log(`   Ciclo: ${r.ciclo}`);
    if (r.fecha_desembolso) console.log(`   Fecha Desembolso: ${r.fecha_desembolso}`);
    if (r.dia_pago) console.log(`   Día Pago: ${r.dia_pago}`);
    if (r.hora_pago) console.log(`   Hora Pago: ${r.hora_pago}`);
  });

console.log('\n═══════════════════════════════════════════════════════\n');
