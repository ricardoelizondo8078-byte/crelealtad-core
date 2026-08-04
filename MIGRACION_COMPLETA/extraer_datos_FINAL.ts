import * as XLSX from 'xlsx';
import * as fs from 'fs';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  EXTRACCIÓN FINAL: GRUPO + CICLO + FECHA + DÍA');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS 76.xlsm';
const workbook = XLSX.readFile(excelPath);
const ws = workbook.Sheets['BASE DE DATOS'];

// Leer como array
const dataArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

console.log(`Total de filas: ${dataArray.length}\n`);

// Columnas identificadas:
const COL_D_CICLO = 3;          // Columna D = índice 3
const COL_E_GRUPO = 4;          // Columna E = índice 4
const COL_J_FECHA = 9;          // Columna J = índice 9
const COL_W_DIA = 22;           // Columna W = índice 22
const COL_X_HORA = 23;          // Columna X = índice 23

console.log('Columnas a extraer:');
console.log(`   D [${COL_D_CICLO}]: CICLO`);
console.log(`   E [${COL_E_GRUPO}]: NOMBRE GRUPO`);
console.log(`   J [${COL_J_FECHA}]: FECHA DESEMBOLSO`);
console.log(`   W [${COL_W_DIA}]: DÍA PAGO`);
console.log(`   X [${COL_X_HORA}]: HORA PAGO\n`);

// Extraer datos (saltando fila 11 que son encabezados)
const registros: any[] = [];

for (let i = 11; i < dataArray.length; i++) {  // Empezar en fila 12 (índice 11)
  const fila: any = dataArray[i];

  if (Array.isArray(fila)) {
    const ciclo = fila[COL_D_CICLO];
    const grupo = fila[COL_E_GRUPO];
    const fecha = fila[COL_J_FECHA];
    const dia = fila[COL_W_DIA];
    const hora = fila[COL_X_HORA];

    // Solo guardar si tiene grupo y ciclo
    if (grupo && ciclo) {
      registros.push({
        grupo: String(grupo).trim(),
        ciclo: parseInt(String(ciclo)) || String(ciclo),
        fecha_desembolso: fecha || null,
        dia_pago: dia || null,
        hora_pago: hora || null
      });
    }
  }
}

console.log(`✅ Registros extraídos: ${registros.length}\n`);

// Estadísticas
const conFecha = registros.filter(r => r.fecha_desembolso);
const conDia = registros.filter(r => r.dia_pago);
const conHora = registros.filter(r => r.hora_pago);

console.log('📊 ESTADÍSTICAS:');
console.log(`   Con GRUPO y CICLO: ${registros.length}`);
console.log(`   Con FECHA: ${conFecha.length}`);
console.log(`   Con DÍA PAGO: ${conDia.length}`);
console.log(`   Con HORA PAGO: ${conHora.length}\n`);

// Agrupar por GRUPO + CICLO
const grupoCicloMap = new Map<string, any>();

registros.forEach(r => {
  const key = `${r.grupo}|${r.ciclo}`;

  if (!grupoCicloMap.has(key)) {
    grupoCicloMap.set(key, {
      grupo: r.grupo,
      ciclo: r.ciclo,
      fecha_desembolso: r.fecha_desembolso,
      dia_pago: r.dia_pago,
      hora_pago: r.hora_pago,
      total_registros: 1
    });
  } else {
    // Si ya existe, actualizar si tiene más datos
    const existing = grupoCicloMap.get(key);
    existing.total_registros++;

    if (r.dia_pago && !existing.dia_pago) {
      existing.dia_pago = r.dia_pago;
    }
    if (r.hora_pago && !existing.hora_pago) {
      existing.hora_pago = r.hora_pago;
    }
  }
});

const datosUnicos = Array.from(grupoCicloMap.values());

console.log(`📦 GRUPO + CICLO únicos: ${datosUnicos.length}\n`);

// Guardar datos únicos
const outputPath = 'data/logs/grupo_ciclo_fecha_dia_FINAL.json';
fs.writeFileSync(outputPath, JSON.stringify(datosUnicos, null, 2));
console.log(`✅ Datos guardados en: ${outputPath}\n`);

// Mostrar muestra
console.log('📋 MUESTRA DE 30 PRIMEROS REGISTROS:');
console.log('═'.repeat(100));

datosUnicos.slice(0, 30).forEach((r, idx) => {
  console.log(`\n${String(idx + 1).padStart(3)}. ${r.grupo} - Ciclo ${r.ciclo}`);
  console.log(`     Fecha: ${r.fecha_desembolso || 'N/A'}`);
  console.log(`     Día: ${r.dia_pago || 'N/A'}`);
  console.log(`     Hora: ${r.hora_pago || 'N/A'}`);
  console.log(`     Registros: ${r.total_registros}`);
});

// Analizar días de pago únicos
const diasUnicos = new Set();
datosUnicos.forEach(r => {
  if (r.dia_pago) diasUnicos.add(r.dia_pago);
});

console.log('\n\n🔍 DÍAS DE PAGO ENCONTRADOS:');
console.log(Array.from(diasUnicos).sort().join(', '));

console.log('\n═══════════════════════════════════════════════════════\n');
