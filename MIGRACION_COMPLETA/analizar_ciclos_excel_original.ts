import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ANALIZANDO CICLOS EN EXCEL ORIGINAL');
console.log('═══════════════════════════════════════════════════════\n');

// Leer Excel original (están en la raíz del proyecto)
const excelPath1 = '../BASEDATOS CRELEALTAD (1) (1).xlsx';
const excelPath2 = '../BASE DE DATOS SEM 364.xlsm';

console.log('📂 Archivo 1: BASEDATOS CRELEALTAD (1) (1).xlsx\n');

const workbook1 = XLSX.readFile(excelPath1);
console.log(`Hojas encontradas: ${workbook1.SheetNames.join(', ')}\n`);

// Leer Hoja1
const ws1 = workbook1.Sheets[workbook1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(ws1);

console.log(`Total de registros en Hoja1: ${data1.length}\n`);

// Ver estructura de primeros registros
console.log('📋 Estructura del primer registro:');
console.log(JSON.stringify(data1[0], null, 2));

// Buscar columna de ciclo
const primerRegistro: any = data1[0];
const columnas = Object.keys(primerRegistro);

console.log('\n📋 Todas las columnas encontradas:');
columnas.forEach((col, idx) => {
  console.log(`${idx + 1}. ${col}`);
});

// Buscar columnas que contengan "ciclo"
const columnasCiclo = columnas.filter(c =>
  c.toLowerCase().includes('ciclo') ||
  c.toLowerCase().includes('cycle')
);

console.log(`\n🔍 Columnas relacionadas con CICLO: ${columnasCiclo.length}`);
columnasCiclo.forEach(col => {
  console.log(`   - ${col}`);

  // Mostrar muestra de valores
  const valores = data1.slice(0, 20).map((r: any) => r[col]).filter(Boolean);
  console.log(`     Valores muestra: ${valores.slice(0, 10).join(', ')}`);
});

// Analizar ciclos por grupo
console.log('\n📊 ANÁLISIS DE CICLOS POR GRUPO:\n');

const ciclosPorGrupo = new Map<string, Set<any>>();

data1.forEach((row: any) => {
  const grupo = row.GRUPO || row.Grupo || row.grupo;

  // Buscar el campo de ciclo
  let ciclo = null;
  for (const col of columnasCiclo) {
    if (row[col]) {
      ciclo = row[col];
      break;
    }
  }

  if (grupo) {
    if (!ciclosPorGrupo.has(grupo)) {
      ciclosPorGrupo.set(grupo, new Set());
    }
    if (ciclo) {
      ciclosPorGrupo.get(grupo)!.add(ciclo);
    }
  }
});

// Mostrar grupos con múltiples ciclos
const gruposConMultiplesCiclos: any[] = [];

ciclosPorGrupo.forEach((ciclos, grupo) => {
  if (ciclos.size > 0) {
    gruposConMultiplesCiclos.push({
      grupo,
      ciclos: Array.from(ciclos).sort(),
      total: ciclos.size
    });
  }
});

gruposConMultiplesCiclos.sort((a, b) => b.total - a.total);

console.log(`Grupos con ciclos: ${gruposConMultiplesCiclos.length}`);
console.log('\nGrupos con MÚLTIPLES ciclos (top 30):');
console.log('═'.repeat(80));

gruposConMultiplesCiclos
  .filter(g => g.total > 1)
  .slice(0, 30)
  .forEach((g, idx) => {
    console.log(`${idx + 1}. ${g.grupo}: Ciclos ${g.ciclos.join(', ')} (Total: ${g.total})`);
  });

console.log('\n📊 ESTADÍSTICAS:');
console.log(`   Grupos con 1 ciclo: ${gruposConMultiplesCiclos.filter(g => g.total === 1).length}`);
console.log(`   Grupos con 2+ ciclos: ${gruposConMultiplesCiclos.filter(g => g.total > 1).length}`);
console.log(`   Máximo ciclos: ${Math.max(...gruposConMultiplesCiclos.map(g => g.total))}`);

// Ahora analizar el segundo Excel
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('📂 Archivo 2: BASE DE DATOS SEM 364.xlsm\n');

try {
  const workbook2 = XLSX.readFile(excelPath2);
  console.log(`Hojas encontradas: ${workbook2.SheetNames.join(', ')}\n`);

  workbook2.SheetNames.forEach(sheetName => {
    const ws = workbook2.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws);

    if (data.length > 0) {
      console.log(`\nHoja: ${sheetName} (${data.length} registros)`);
      const cols = Object.keys(data[0] as any);
      const colsCiclo = cols.filter(c =>
        c.toLowerCase().includes('ciclo') ||
        c.toLowerCase().includes('cycle')
      );

      if (colsCiclo.length > 0) {
        console.log(`   ✅ Columnas de ciclo: ${colsCiclo.join(', ')}`);
      }
    }
  });
} catch (error) {
  console.log('⚠️  No se pudo leer el segundo Excel');
}

console.log('\n═══════════════════════════════════════════════════════\n');
