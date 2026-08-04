import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

async function extraerDiasPagoYFechas() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EXTRAYENDO DÍAS DE PAGO Y FECHAS DE DESEMBOLSO');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Verificar si hay campo dia_pago en tabla grupos
  console.log('🔍 Verificando estructura de tabla grupos...');

  const columnasGrupos = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'grupos'
    ORDER BY ordinal_position;
  `);

  console.log('Columnas de tabla grupos:');
  columnasGrupos.rows.forEach(col => {
    console.log(`   - ${col.column_name} (${col.data_type})`);
  });

  const tieneDiaPago = columnasGrupos.rows.some(col =>
    col.column_name.toLowerCase().includes('dia') ||
    col.column_name.toLowerCase().includes('pago')
  );

  console.log(`\n¿Tiene campo de día de pago? ${tieneDiaPago ? 'SI' : 'NO'}\n`);

  // 2. Ver datos de grupos
  console.log('📊 Consultando datos de grupos...');

  const grupos = await pool.query(`
    SELECT * FROM grupos LIMIT 5;
  `);

  if (grupos.rows.length > 0) {
    console.log('\nMuestra de datos de grupos:');
    console.log(JSON.stringify(grupos.rows[0], null, 2));
  }

  // 3. Buscar en datos raw del Excel
  console.log('\n\n🔍 Buscando en integrantes_raw.json...');

  const rawPath = 'data/staging/integrantes_raw.json';
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

  console.log(`Total de registros: ${rawData.length}`);

  const primerRegistro = rawData[0];
  console.log('\nCampos disponibles en integrantes_raw:');
  Object.keys(primerRegistro).forEach((key, idx) => {
    console.log(`${String(idx + 1).padStart(2)}. ${key}`);
  });

  // Buscar campos relacionados con día de pago
  const camposDiaPago = Object.keys(primerRegistro).filter(k =>
    k.toLowerCase().includes('dia') ||
    k.toLowerCase().includes('pago') ||
    k.toLowerCase().includes('lunes') ||
    k.toLowerCase().includes('martes')
  );

  console.log(`\n🔍 Campos de día de pago: ${camposDiaPago.join(', ') || 'NO ENCONTRADO'}`);

  if (camposDiaPago.length > 0) {
    camposDiaPago.forEach(campo => {
      const valoresUnicos = new Set();
      rawData.slice(0, 500).forEach((r: any) => {
        if (r[campo]) valoresUnicos.add(r[campo]);
      });

      console.log(`\n   Campo: ${campo}`);
      console.log(`   Valores: ${Array.from(valoresUnicos).slice(0, 10).join(', ')}`);
    });
  }

  // Buscar campos relacionados con fechas
  const camposFecha = Object.keys(primerRegistro).filter(k =>
    k.toLowerCase().includes('fecha') ||
    k.toLowerCase().includes('desembolso') ||
    k.toLowerCase().includes('inicio') ||
    k.toLowerCase().includes('date')
  );

  console.log(`\n🔍 Campos de fecha: ${camposFecha.join(', ') || 'NO ENCONTRADO'}`);

  if (camposFecha.length > 0) {
    camposFecha.forEach(campo => {
      const valoresUnicos = new Set();
      rawData.slice(0, 100).forEach((r: any) => {
        if (r[campo]) valoresUnicos.add(r[campo]);
      });

      console.log(`\n   Campo: ${campo}`);
      console.log(`   Valores muestra: ${Array.from(valoresUnicos).slice(0, 10).join(', ')}`);
    });
  }

  // 4. Buscar campos con nombres del asesor (LUPITA, etc)
  console.log('\n\n🔍 Buscando campo de asesor...');

  const camposAsesor = Object.keys(primerRegistro).filter(k =>
    k.toLowerCase().includes('lupita') ||
    k.toLowerCase().includes('asesor') ||
    k.toLowerCase().includes('promotor')
  );

  console.log(`Campos de asesor: ${camposAsesor.join(', ') || 'NO ENCONTRADO'}`);

  if (camposAsesor.length > 0) {
    const campo = camposAsesor[0];
    const valoresUnicos = new Set();
    rawData.forEach((r: any) => {
      if (r[campo]) valoresUnicos.add(r[campo]);
    });

    console.log(`\nAsesores encontrados (${valoresUnicos.size}):`);
    Array.from(valoresUnicos).forEach(a => console.log(`   - ${a}`));
  }

  // 5. Analizar por GRUPO + CICLO para ver qué datos tenemos
  console.log('\n\n📊 ANÁLISIS POR GRUPO Y CICLO:');
  console.log('═'.repeat(80));

  const gruposCiclos = new Map<string, any>();

  rawData.forEach((row: any) => {
    const grupo = row.GRUPO;
    const ciclo = row['CICLO'] || row['CICLO '] || row[' CICLO'] || row['CICLO  '];

    if (grupo && ciclo) {
      const key = `${grupo}|${ciclo}`;

      if (!gruposCiclos.has(key)) {
        gruposCiclos.set(key, {
          grupo,
          ciclo,
          registros: [],
          campos_unicos: {}
        });
      }

      gruposCiclos.get(key).registros.push(row);
    }
  });

  console.log(`\nTotal de combinaciones GRUPO + CICLO: ${gruposCiclos.size}`);

  // Mostrar muestra
  console.log('\nMuestra de primeros 10 GRUPO + CICLO:');
  console.log('═'.repeat(80));

  let contador = 0;
  for (const [key, data] of gruposCiclos) {
    if (contador >= 10) break;

    const primerReg = data.registros[0];

    console.log(`\n${contador + 1}. ${data.grupo} - Ciclo ${data.ciclo} (${data.registros.length} integrantes)`);

    // Mostrar todos los campos del primer registro
    Object.keys(primerReg).forEach(campo => {
      const valor = primerReg[campo];
      if (valor && String(valor).trim() !== '') {
        console.log(`   ${campo}: ${String(valor).substring(0, 50)}`);
      }
    });

    contador++;
  }

  // 6. Crear mapeo de GRUPO + CICLO → datos
  console.log('\n\n📄 Creando mapeo de datos...');

  const mapeo: any[] = [];

  gruposCiclos.forEach((data, key) => {
    const primerReg = data.registros[0];

    mapeo.push({
      grupo: data.grupo,
      ciclo: data.ciclo,
      total_integrantes: data.registros.length,
      // Todos los campos disponibles
      datos: primerReg
    });
  });

  const mapeoPath = 'data/logs/mapeo_grupo_ciclo_datos.json';
  fs.writeFileSync(mapeoPath, JSON.stringify(mapeo, null, 2));

  console.log(`✅ Mapeo guardado: ${mapeoPath}`);
  console.log(`   Total de registros: ${mapeo.length}`);

  console.log('\n═══════════════════════════════════════════════════════\n');

  await pool.end();
}

extraerDiasPagoYFechas()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
