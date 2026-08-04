const { Client } = require('pg');
const fs = require('fs');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  try {
    await client.connect();
    console.log('✅ Generando esquema de tablas CORE del sistema...\n');

    const tables = [
      'grupos',
      'ciclos',
      'expedientes',
      'personas',
      'integrantes',
      'documentos'
    ];

    const allData = [];

    for (const tableName of tables) {
      // Obtener columnas
      const columnsQuery = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Obtener foreign keys
      const fkQuery = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
      `, [tableName]);

      const fkMap = {};
      fkQuery.rows.forEach(fk => {
        fkMap[fk.column_name] = `FK → ${fk.foreign_table_name}.${fk.foreign_column_name}`;
      });

      // Contar registros
      const countQuery = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = countQuery.rows[0].count;

      console.log(`   ✓ ${tableName.padEnd(20)} ${String(columnsQuery.rows.length).padStart(2)} columnas, ${String(recordCount).padStart(3)} registros`);

      // Agregar datos al array
      columnsQuery.rows.forEach(col => {
        let typeInfo = col.data_type;

        if (col.character_maximum_length) {
          typeInfo = `${col.data_type}(${col.character_maximum_length})`;
        } else if (col.numeric_precision && col.numeric_scale) {
          typeInfo = `numeric(${col.numeric_precision},${col.numeric_scale})`;
        } else if (col.numeric_precision) {
          typeInfo = `numeric(${col.numeric_precision})`;
        }

        allData.push({
          tabla: tableName,
          columna: col.column_name,
          tipo: typeInfo,
          nullable: col.is_nullable,
          default: col.column_default || '',
          relacion: fkMap[col.column_name] || '',
          registros_en_tabla: recordCount
        });
      });
    }

    // Generar CSV
    const csvHeader = 'TABLA,COLUMNA,TIPO_DATO,NULLABLE,DEFAULT,RELACION_FK,REGISTROS_EN_TABLA\n';
    const csvRows = allData.map(row =>
      `${row.tabla},${row.columna},${row.tipo},${row.nullable},"${row.default.replace(/"/g, '""')}",${row.relacion},${row.registros_en_tabla}`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    fs.writeFileSync('../../ESQUEMA_TABLAS_CORE.csv', csvContent, 'utf8');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Generado: ESQUEMA_TABLAS_CORE.csv');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📊 Total de columnas documentadas: ${allData.length}`);
    console.log(`📋 Tablas incluidas: ${tables.length}\n`);

    // Resumen por tabla
    console.log('📊 RESUMEN POR TABLA:\n');
    for (const tableName of tables) {
      const cols = allData.filter(d => d.tabla === tableName).length;
      const regs = allData.find(d => d.tabla === tableName)?.registros_en_tabla || 0;
      console.log(`  • ${tableName.padEnd(20)} ${String(cols).padStart(2)} columnas, ${String(regs).padStart(3)} registros`);
    }

    // Análisis de relaciones
    console.log('\n📌 RELACIONES DETECTADAS:\n');
    const relaciones = allData.filter(d => d.relacion !== '');
    const relacionesPorTabla = {};

    relaciones.forEach(rel => {
      if (!relacionesPorTabla[rel.tabla]) {
        relacionesPorTabla[rel.tabla] = [];
      }
      relacionesPorTabla[rel.tabla].push(`${rel.columna} → ${rel.relacion}`);
    });

    for (const [tabla, rels] of Object.entries(relacionesPorTabla)) {
      console.log(`  ${tabla}:`);
      rels.forEach(r => console.log(`    • ${r}`));
    }

    console.log('\n✅ ARCHIVO LISTO PARA ABRIR EN EXCEL\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
})();
