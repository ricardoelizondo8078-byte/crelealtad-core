import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ANALIZANDO CICLOS EN BASE DE DATOS SEM 364');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS SEM 364.xlsm';
const workbook = XLSX.readFile(excelPath);

console.log(`📂 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n`);

// Analizar hoja "BASE DE DATOS" (la que tiene 24,272 registros)
console.log('═══════════════════════════════════════════════════════');
console.log('  HOJA: BASE DE DATOS');
console.log('═══════════════════════════════════════════════════════\n');

const ws = workbook.Sheets['BASE DE DATOS'];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`📊 Total de registros: ${data.length}\n`);

// Ver estructura del primer registro
console.log('📋 ESTRUCTURA DEL PRIMER REGISTRO:');
console.log('═'.repeat(80));

const primerRegistro: any = data[0];
const columnas = Object.keys(primerRegistro);

columnas.forEach((col, idx) => {
  const valor = primerRegistro[col];
  const tipo = typeof valor;
  const preview = String(valor).substring(0, 50);
  console.log(`${String(idx + 1).padStart(2)}. ${col.padEnd(30)} = ${preview} (${tipo})`);
});

// Buscar columnas relacionadas con CICLO
console.log('\n\n🔍 COLUMNAS RELACIONADAS CON CICLO:');
console.log('═'.repeat(80));

const columnasCiclo = columnas.filter(c =>
  c.toLowerCase().includes('ciclo') ||
  c.toLowerCase().includes('cycle') ||
  c.toLowerCase().includes('no.') ||
  c.toLowerCase().includes('numero')
);

if (columnasCiclo.length === 0) {
  console.log('❌ No se encontraron columnas con "ciclo" en el nombre\n');
  console.log('📋 Mostrando todas las columnas para análisis manual:\n');
  columnas.forEach((col, idx) => {
    console.log(`${String(idx + 1).padStart(2)}. ${col}`);
  });
} else {
  columnasCiclo.forEach(col => {
    console.log(`\n✅ Columna: ${col}`);

    // Mostrar valores únicos
    const valoresUnicos = new Set<any>();
    data.slice(0, 1000).forEach((r: any) => {
      if (r[col] !== null && r[col] !== undefined && r[col] !== '') {
        valoresUnicos.add(r[col]);
      }
    });

    const valores = Array.from(valoresUnicos).slice(0, 30);
    console.log(`   Valores únicos (muestra): ${valores.sort().join(', ')}`);
    console.log(`   Total valores únicos en muestra: ${valoresUnicos.size}`);
  });
}

// Buscar columna de GRUPO
console.log('\n\n🔍 COLUMNAS RELACIONADAS CON GRUPO:');
console.log('═'.repeat(80));

const columnasGrupo = columnas.filter(c =>
  c.toLowerCase().includes('grupo') ||
  c.toLowerCase().includes('group')
);

columnasGrupo.forEach(col => {
  console.log(`\n✅ Columna: ${col}`);

  const valoresUnicos = new Set<any>();
  data.forEach((r: any) => {
    if (r[col]) valoresUnicos.add(r[col]);
  });

  console.log(`   Total grupos únicos: ${valoresUnicos.size}`);
  console.log(`   Muestra de grupos: ${Array.from(valoresUnicos).slice(0, 10).join(', ')}`);
});

// ANÁLISIS CLAVE: Agrupar por GRUPO y CICLO
console.log('\n\n📊 ANÁLISIS: CICLOS POR GRUPO');
console.log('═'.repeat(80));

// Identificar las columnas clave
let colGrupo = columnasGrupo[0] || columnas.find(c => c.toUpperCase() === 'GRUPO');
let colCiclo = columnasCiclo[0];

console.log(`\nUsando columnas:`);
console.log(`   Grupo: ${colGrupo || 'NO ENCONTRADO'}`);
console.log(`   Ciclo: ${colCiclo || 'NO ENCONTRADO'}\n`);

if (colGrupo && colCiclo) {
  // Mapear grupos → ciclos
  const gruposCiclos = new Map<string, Set<any>>();

  data.forEach((row: any) => {
    const grupo = row[colGrupo];
    const ciclo = row[colCiclo];

    if (grupo) {
      if (!gruposCiclos.has(grupo)) {
        gruposCiclos.set(grupo, new Set());
      }
      if (ciclo) {
        gruposCiclos.get(grupo)!.add(ciclo);
      }
    }
  });

  // Convertir a array y ordenar
  const analisis: any[] = [];
  gruposCiclos.forEach((ciclos, grupo) => {
    analisis.push({
      grupo,
      ciclos: Array.from(ciclos).sort((a, b) => Number(a) - Number(b)),
      total: ciclos.size
    });
  });

  analisis.sort((a, b) => b.total - a.total);

  console.log(`✅ Total de grupos encontrados: ${analisis.length}`);
  console.log(`✅ Grupos con múltiples ciclos: ${analisis.filter(g => g.total > 1).length}`);
  console.log(`✅ Máximo de ciclos en un grupo: ${Math.max(...analisis.map(a => a.total))}\n`);

  console.log('📊 ESTADÍSTICAS DE DISTRIBUCIÓN:');
  console.log('═'.repeat(80));

  const distribucion = new Map<number, number>();
  analisis.forEach(a => {
    distribucion.set(a.total, (distribucion.get(a.total) || 0) + 1);
  });

  Array.from(distribucion.keys()).sort((a, b) => a - b).forEach(numCiclos => {
    const cantidad = distribucion.get(numCiclos)!;
    const porcentaje = ((cantidad / analisis.length) * 100).toFixed(1);
    console.log(`   ${numCiclos} ciclo(s): ${cantidad} grupos (${porcentaje}%)`);
  });

  console.log('\n\n📋 GRUPOS CON MÚLTIPLES CICLOS (top 30):');
  console.log('═'.repeat(80));

  analisis
    .filter(g => g.total > 1)
    .slice(0, 30)
    .forEach((g, idx) => {
      console.log(`${String(idx + 1).padStart(3)}. ${g.grupo.padEnd(40)} → Ciclos: ${g.ciclos.join(', ')} (Total: ${g.total})`);
    });

  // CALCULAR TOTAL DE CICLOS A CREAR
  let totalCiclosACrear = 0;
  analisis.forEach(a => {
    totalCiclosACrear += a.total;
  });

  console.log('\n\n🎯 RESULTADO FINAL:');
  console.log('═'.repeat(80));
  console.log(`   Grupos únicos: ${analisis.length}`);
  console.log(`   Total de ciclos a crear: ${totalCiclosACrear}`);
  console.log(`   Promedio de ciclos por grupo: ${(totalCiclosACrear / analisis.length).toFixed(2)}`);

  console.log('\n\n⚠️  COMPARACIÓN:');
  console.log('═'.repeat(80));
  console.log(`   Plantilla anterior generada: 493 ciclos (1 por grupo)`);
  console.log(`   Ciclos reales en Excel: ${totalCiclosACrear} ciclos`);
  console.log(`   Diferencia: ${totalCiclosACrear - 493} ciclos faltantes`);

  // Guardar el análisis completo
  const fs = require('fs');
  const analisisCompleto = {
    fecha: new Date().toISOString(),
    total_grupos: analisis.length,
    total_ciclos: totalCiclosACrear,
    grupos_con_multiples_ciclos: analisis.filter(g => g.total > 1).length,
    detalle: analisis.map(a => ({
      grupo: a.grupo,
      ciclos: a.ciclos,
      total: a.total
    }))
  };

  const outputPath = 'data/logs/analisis_ciclos_real.json';
  fs.writeFileSync(outputPath, JSON.stringify(analisisCompleto, null, 2));
  console.log(`\n📄 Análisis completo guardado en: ${outputPath}`);

} else {
  console.log('\n❌ No se pudieron identificar las columnas de GRUPO y CICLO');
  console.log('   Revisa manualmente el Excel para identificar las columnas correctas.\n');
}

console.log('\n═══════════════════════════════════════════════════════\n');
