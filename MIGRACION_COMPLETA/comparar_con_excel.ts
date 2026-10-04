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

interface ExcelColumn {
  tabla: string;
  columna: string;
  tipo: string;
  nullable: string;
  default: string;
}

async function getColumnsFromDB(tableName: string): Promise<Set<string>> {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);

  return new Set(result.rows.map(r => r.column_name.toLowerCase()));
}

async function comparar() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  COMPARACIÓN: EXCEL (ESQUEMA_CORE) vs PGADMIN');
  console.log('═══════════════════════════════════════════════════════\n');

  // Leer Excel
  const excelPath = '../TABLAS NUEVAS EN REVISION.xlsx';
  const workbook = XLSX.readFile(excelPath);
  const coreSheet = workbook.Sheets['ESQUEMA_CORE'];
  const data = XLSX.utils.sheet_to_json(coreSheet, { header: 1 }) as any[][];

  // Headers: ["#","TABLA","COLUMNA","TIPO_DATO","NULLABLE","DEFAULT","RELACION_FK","REGISTROS"]
  const excelByTable: Map<string, Set<string>> = new Map();

  // Procesar datos del Excel (empezar en fila 1, fila 0 son headers)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1] || !row[2]) continue;

    const tabla = String(row[1]).trim().toLowerCase();
    const columna = String(row[2]).trim().toLowerCase();

    if (!excelByTable.has(tabla)) {
      excelByTable.set(tabla, new Set());
    }
    excelByTable.get(tabla)!.add(columna);
  }

  console.log(`📊 Tablas encontradas en Excel:`);
  console.log(Array.from(excelByTable.keys()).join(', '));
  console.log('');

  // Tablas a comparar
  const tablasCore = ['personas', 'grupos', 'expedientes', 'integrantes'];
  const columnasExtra: Array<{tabla: string, columna: string}> = [];
  const columnasFaltantes: Array<{tabla: string, columna: string}> = [];

  for (const tabla of tablasCore) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 TABLA: ${tabla.toUpperCase()}`);
    console.log('='.repeat(70));

    const columnasExcel = excelByTable.get(tabla);
    if (!columnasExcel) {
      console.log(`⚠️  Tabla "${tabla}" no encontrada en ESQUEMA_CORE`);
      continue;
    }

    const columnasPgAdmin = await getColumnsFromDB(tabla);

    console.log(`\n✅ Columnas en Excel (${columnasExcel.size}):`);
    const excelSorted = Array.from(columnasExcel).sort();
    console.log('   ' + excelSorted.join(', '));

    console.log(`\n✅ Columnas en pgAdmin (${columnasPgAdmin.size}):`);
    const pgAdminSorted = Array.from(columnasPgAdmin).sort();
    console.log('   ' + pgAdminSorted.join(', '));

    // Columnas EXTRA en pgAdmin (NO están en Excel)
    const extraEnPgAdmin = Array.from(columnasPgAdmin).filter(
      col => !columnasExcel.has(col)
    );

    // Columnas FALTANTES en pgAdmin (SÍ están en Excel)
    const faltanEnPgAdmin = Array.from(columnasExcel).filter(
      col => !columnasPgAdmin.has(col)
    );

    if (extraEnPgAdmin.length > 0) {
      console.log(`\n❌ Columnas EXTRA en pgAdmin (${extraEnPgAdmin.length}):`);
      console.log('   (NO están en Excel - deberían eliminarse)');
      extraEnPgAdmin.forEach(col => {
        console.log(`   ❌ ${col}`);
        columnasExtra.push({ tabla, columna: col });
      });
    } else {
      console.log(`\n✅ No hay columnas extra en pgAdmin`);
    }

    if (faltanEnPgAdmin.length > 0) {
      console.log(`\n⚠️  Columnas FALTANTES en pgAdmin (${faltanEnPgAdmin.length}):`);
      console.log('   (SÍ están en Excel - podrían necesitarse)');
      faltanEnPgAdmin.forEach(col => {
        console.log(`   ⚠️  ${col}`);
        columnasFaltantes.push({ tabla, columna: col });
      });
    } else {
      console.log(`\n✅ No faltan columnas en pgAdmin`);
    }
  }

  // RESUMEN FINAL
  console.log('\n\n' + '═'.repeat(70));
  console.log('📋 RESUMEN FINAL - COMANDOS SQL NECESARIOS');
  console.log('═'.repeat(70));

  if (columnasExtra.length > 0) {
    console.log(`\n❌ COLUMNAS EXTRA EN PGADMIN (${columnasExtra.length}):`);
    console.log('   Ejecutar estos DROP en pgAdmin:\n');
    columnasExtra.forEach(({ tabla, columna }) => {
      console.log(`   ALTER TABLE ${tabla} DROP COLUMN IF EXISTS ${columna};`);
    });
  } else {
    console.log('\n✅ No hay columnas extra en pgAdmin - Schema correcto');
  }

  if (columnasFaltantes.length > 0) {
    console.log(`\n\n⚠️  COLUMNAS FALTANTES EN PGADMIN (${columnasFaltantes.length}):`);
    console.log('   (Estas están en Excel pero no en pgAdmin)\n');
    columnasFaltantes.forEach(({ tabla, columna }) => {
      console.log(`   ⚠️  ${tabla}.${columna}`);
    });
    console.log('\n   NOTA: Revisar si estas columnas son necesarias.');
  } else {
    console.log('\n✅ No faltan columnas - pgAdmin tiene todo lo del Excel');
  }

  console.log('\n' + '═'.repeat(70) + '\n');

  await pool.end();
}

comparar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
