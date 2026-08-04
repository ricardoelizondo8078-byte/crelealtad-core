import * as XLSX from 'xlsx';

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ANÁLISIS RAW DE EXCEL SEM 364');
console.log('═══════════════════════════════════════════════════════\n');

const excelPath = '../BASE DE DATOS SEM 364.xlsm';
const workbook = XLSX.readFile(excelPath);

// Leer HOJA "BASE" primero (513 registros)
console.log('═══════════════════════════════════════════════════════');
console.log('  HOJA: BASE (513 registros)');
console.log('═══════════════════════════════════════════════════════\n');

const wsBase = workbook.Sheets['BASE'];
const dataBase = XLSX.utils.sheet_to_json(wsBase, { defval: '' });

console.log(`📊 Total de registros: ${dataBase.length}\n`);

if (dataBase.length > 0) {
  console.log('📋 Columnas encontradas:');
  const colsBase = Object.keys(dataBase[0] as any);
  colsBase.forEach((col, idx) => {
    console.log(`${String(idx + 1).padStart(2)}. ${col}`);
  });

  console.log('\n📋 Primer registro:');
  console.log(JSON.stringify(dataBase[0], null, 2).substring(0, 2000));

  // Buscar ciclo y grupo
  const colsCiclo = colsBase.filter(c =>
    c.toLowerCase().includes('ciclo') ||
    c.toLowerCase().includes('no') ||
    c.toLowerCase().includes('num')
  );

  const colsGrupo = colsBase.filter(c =>
    c.toLowerCase().includes('grupo')
  );

  console.log('\n\n🔍 Columnas potenciales:');
  console.log(`   CICLO: ${colsCiclo.join(', ') || 'NO ENCONTRADO'}`);
  console.log(`   GRUPO: ${colsGrupo.join(', ') || 'NO ENCONTRADO'}`);

  if (colsCiclo.length > 0 && colsGrupo.length > 0) {
    const colCiclo = colsCiclo[0];
    const colGrupo = colsGrupo[0];

    console.log(`\n✅ Usando: ${colGrupo} + ${colCiclo}\n`);

    // Mapear grupos → ciclos
    const gruposCiclos = new Map<string, Set<any>>();

    dataBase.forEach((row: any) => {
      const grupo = row[colGrupo];
      const ciclo = row[colCiclo];

      if (grupo && String(grupo).trim() !== '') {
        if (!gruposCiclos.has(grupo)) {
          gruposCiclos.set(grupo, new Set());
        }
        if (ciclo && String(ciclo).trim() !== '') {
          gruposCiclos.get(grupo)!.add(ciclo);
        }
      }
    });

    // Análisis
    const analisis: any[] = [];
    gruposCiclos.forEach((ciclos, grupo) => {
      analisis.push({
        grupo,
        ciclos: Array.from(ciclos).sort((a, b) => Number(a) - Number(b)),
        total: ciclos.size
      });
    });

    analisis.sort((a, b) => b.total - a.total);

    console.log('📊 RESULTADOS:');
    console.log(`   Total de grupos: ${analisis.length}`);
    console.log(`   Grupos con múltiples ciclos: ${analisis.filter(g => g.total > 1).length}`);

    if (analisis.length > 0) {
      console.log(`   Máximo de ciclos: ${Math.max(...analisis.map(a => a.total))}`);

      console.log('\n📋 Top 20 grupos con más ciclos:');
      analisis.slice(0, 20).forEach((g, idx) => {
        console.log(`${String(idx + 1).padStart(3)}. ${String(g.grupo).padEnd(40)} → ${g.ciclos.join(', ')} (${g.total})`);
      });

      // Total de ciclos
      let totalCiclos = 0;
      analisis.forEach(a => totalCiclos += a.total);

      console.log(`\n🎯 TOTAL DE CICLOS A CREAR: ${totalCiclos}`);
      console.log(`   Promedio por grupo: ${(totalCiclos / analisis.length).toFixed(2)}`);

      // Guardar
      const fs = require('fs');
      const output = {
        fuente: 'BASE DE DATOS SEM 364 - Hoja BASE',
        total_grupos: analisis.length,
        total_ciclos: totalCiclos,
        detalle: analisis
      };

      fs.writeFileSync('data/logs/ciclos_por_grupo.json', JSON.stringify(output, null, 2));
      console.log(`\n✅ Guardado en: data/logs/ciclos_por_grupo.json`);
    }
  }
}

// También revisar la hoja original "Hoja1" del otro Excel
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('  REVISANDO DATOS RAW DE EXTRACCIÓN ORIGINAL');
console.log('═══════════════════════════════════════════════════════\n');

const fs = require('fs');
const rawPath = 'data/staging/integrantes_raw.json';

if (fs.existsSync(rawPath)) {
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

  console.log(`📊 Total de integrantes en raw: ${rawData.length}\n`);

  if (rawData.length > 0) {
    console.log('📋 Campos del primer integrante:');
    const primerIntegrante = rawData[0];
    Object.keys(primerIntegrante).forEach((key, idx) => {
      const valor = primerIntegrante[key];
      console.log(`${String(idx + 1).padStart(2)}. ${key.padEnd(25)} = ${String(valor).substring(0, 50)}`);
    });

    // Buscar campo ciclo
    const camposCiclo = Object.keys(primerIntegrante).filter((k: string) =>
      k.toLowerCase().trim() === 'ciclo'
    );

    console.log(`\n🔍 Campos de ciclo: ${camposCiclo.join(', ') || 'NO ENCONTRADO'}`);

    if (camposCiclo.length > 0) {
      const campoCiclo = camposCiclo[0];
      const campoGrupo = Object.keys(primerIntegrante).find((k: string) =>
        k.toLowerCase().includes('grupo')
      );

      if (campoGrupo) {
        console.log(`✅ Usando: ${campoGrupo} + ${campoCiclo}\n`);

        // Mapear
        const gruposCiclosRaw = new Map<string, Set<any>>();

        rawData.forEach((row: any) => {
          const grupo = row[campoGrupo];
          const ciclo = row[campoCiclo];

          if (grupo) {
            if (!gruposCiclosRaw.has(grupo)) {
              gruposCiclosRaw.set(grupo, new Set());
            }
            if (ciclo) {
              gruposCiclosRaw.get(grupo)!.add(ciclo);
            }
          }
        });

        const analisisRaw: any[] = [];
        gruposCiclosRaw.forEach((ciclos, grupo) => {
          analisisRaw.push({
            grupo,
            ciclos: Array.from(ciclos).sort((a, b) => Number(a) - Number(b)),
            total: ciclos.size
          });
        });

        analisisRaw.sort((a, b) => b.total - a.total);

        let totalCiclosRaw = 0;
        analisisRaw.forEach(a => totalCiclosRaw += a.total);

        console.log('📊 RESULTADOS DE INTEGRANTES RAW:');
        console.log(`   Total de grupos: ${analisisRaw.length}`);
        console.log(`   Total de ciclos: ${totalCiclosRaw}`);
        console.log(`   Grupos con múltiples ciclos: ${analisisRaw.filter(g => g.total > 1).length}`);

        console.log('\n📋 Top 30 grupos con más ciclos:');
        analisisRaw.slice(0, 30).forEach((g, idx) => {
          console.log(`${String(idx + 1).padStart(3)}. ${String(g.grupo).padEnd(40)} → Ciclos: ${g.ciclos.join(', ')} (${g.total})`);
        });

        // Guardar
        fs.writeFileSync(
          'data/logs/ciclos_desde_integrantes_raw.json',
          JSON.stringify({
            fuente: 'integrantes_raw.json',
            total_grupos: analisisRaw.length,
            total_ciclos: totalCiclosRaw,
            detalle: analisisRaw
          }, null, 2)
        );

        console.log(`\n✅ Guardado en: data/logs/ciclos_desde_integrantes_raw.json`);
      }
    }
  }
} else {
  console.log('❌ No se encontró integrantes_raw.json');
}

console.log('\n═══════════════════════════════════════════════════════\n');
