import * as XLSX from 'xlsx';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

interface ColumnInfo {
  tabla: string;
  columna: string;
  tipo: string;
  nullable: string;
  default: string;
}

async function getColumnsFromDB(tableName: string): Promise<ColumnInfo[]> {
  const result = await pool.query(`
    SELECT
      table_name as tabla,
      column_name as columna,
      data_type as tipo,
      is_nullable as nullable,
      column_default as "default"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);

  return result.rows;
}

async function comparar() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  COMPARACIÓN SCHEMA: EXCEL vs PGADMIN');
  console.log('═══════════════════════════════════════════════════════\n');

  // Leer Excel
  const excelPath = '../TABLAS NUEVAS EN REVISION.xlsx';
  console.log(`📂 Leyendo Excel: ${excelPath}\n`);

  const workbook = XLSX.readFile(excelPath);
  console.log(`📋 Hojas encontradas: ${workbook.SheetNames.join(', ')}\n`);

  const discrepancias: string[] = [];
  const columnasExtra: string[] = [];

  // Tablas a revisar
  const tablasARevisar = ['personas', 'grupos', 'expedientes', 'integrantes'];

  for (const tabla of tablasARevisar) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 TABLA: ${tabla.toUpperCase()}`);
    console.log('='.repeat(60));

    // Buscar hoja en Excel (puede estar con mayúsculas o minúsculas)
    const sheetName = workbook.SheetNames.find(
      s => s.toLowerCase() === tabla.toLowerCase()
    );

    if (!sheetName) {
      console.log(`⚠️  Hoja "${tabla}" no encontrada en Excel`);
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // La primera fila son headers
    const headers = excelData[0] as string[];
    const columnasExcel = new Set<string>();

    // Extraer nombres de columnas del Excel
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i] as any[];
      if (row && row[0]) {
        const columna = String(row[0]).trim().toLowerCase();
        if (columna) {
          columnasExcel.add(columna);
        }
      }
    }

    console.log(`\n✅ Columnas en Excel (${columnasExcel.size}):`);
    console.log(Array.from(columnasExcel).sort().join(', '));

    // Obtener columnas de pgAdmin
    const columnasPgAdmin = await getColumnsFromDB(tabla);
    const columnasPgAdminSet = new Set(
      columnasPgAdmin.map(c => c.columna.toLowerCase())
    );

    console.log(`\n✅ Columnas en pgAdmin (${columnasPgAdminSet.size}):`);
    console.log(Array.from(columnasPgAdminSet).sort().join(', '));

    // Comparar: columnas en pgAdmin que NO están en Excel
    console.log(`\n🔍 Análisis de diferencias:`);

    const extraEnPgAdmin = Array.from(columnasPgAdminSet).filter(
      col => !columnasExcel.has(col)
    );

    const faltanEnPgAdmin = Array.from(columnasExcel).filter(
      col => !columnasPgAdminSet.has(col)
    );

    if (extraEnPgAdmin.length > 0) {
      console.log(`\n⚠️  Columnas EXTRA en pgAdmin (NO están en Excel):`);
      extraEnPgAdmin.forEach(col => {
        console.log(`   ❌ ${tabla}.${col}`);
        columnasExtra.push(`${tabla}.${col}`);
      });
    } else {
      console.log(`\n✅ No hay columnas extra en pgAdmin`);
    }

    if (faltanEnPgAdmin.length > 0) {
      console.log(`\n⚠️  Columnas que FALTAN en pgAdmin (SÍ están en Excel):`);
      faltanEnPgAdmin.forEach(col => {
        console.log(`   ⚠️  ${tabla}.${col}`);
        discrepancias.push(`${tabla}.${col} falta en pgAdmin`);
      });
    } else {
      console.log(`\n✅ No faltan columnas en pgAdmin`);
    }
  }

  // Resumen final
  console.log('\n\n' + '═'.repeat(60));
  console.log('📋 RESUMEN FINAL');
  console.log('═'.repeat(60));

  if (columnasExtra.length > 0) {
    console.log(`\n❌ COLUMNAS EXTRA EN PGADMIN (${columnasExtra.length}):`);
    console.log('   (Estas deberían eliminarse con DROP)\n');
    columnasExtra.forEach(col => {
      const [tabla, columna] = col.split('.');
      console.log(`   ALTER TABLE ${tabla} DROP COLUMN IF EXISTS ${columna};`);
    });
  } else {
    console.log('\n✅ No hay columnas extra en pgAdmin');
  }

  if (discrepancias.length > 0) {
    console.log(`\n⚠️  COLUMNAS FALTANTES EN PGADMIN (${discrepancias.length}):`);
    discrepancias.forEach(d => console.log(`   - ${d}`));
  } else {
    console.log('\n✅ No faltan columnas en pgAdmin');
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  await pool.end();
}

comparar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
