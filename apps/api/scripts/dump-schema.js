/**
 * Genera dump del schema de producción (solo estructura, sin datos)
 * Ejecutar: node scripts/dump-schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function dumpSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad',
  });

  try {
    await client.connect();
    console.log('✓ Conectado a crelealtad');

    console.log('Generando DDL del schema...');

    // Método alternativo: generar DDL tabla por tabla
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n=== TABLAS ENCONTRADAS ===');
    tables.rows.forEach(t => console.log(`  ${t.tablename}`));

    let ddl = `-- Schema dump de crelealtad (estructura completa)
-- Generado: ${new Date().toISOString()}
-- Base: crelealtad (producción)

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

    // ENUMs
    const enums = await client.query(`
      SELECT
        t.typname,
        string_agg(e.enumlabel, ''', ''' ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    if (enums.rows.length > 0) {
      ddl += `-- Tipos ENUM\n`;
      enums.rows.forEach(e => {
        ddl += `CREATE TYPE ${e.typname} AS ENUM ('${e.values}');\n`;
      });
      ddl += '\n';
    }

    // Crear cada tabla
    for (const table of tables.rows) {
      const tableName = table.tablename;

      console.log(`\nGenerando DDL para ${tableName}...`);

      const columns = await client.query(`
        SELECT
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      ddl += `-- Tabla: ${tableName}\n`;
      ddl += `CREATE TABLE ${tableName} (\n`;

      const columnDefs = columns.rows.map((col, idx) => {
        let def = `  ${col.column_name}`;

        // Tipo
        if (col.data_type === 'USER-DEFINED') {
          def += ` ${col.udt_name}`;
        } else if (col.data_type === 'character varying') {
          def += ` VARCHAR`;
        } else if (col.data_type === 'timestamp with time zone') {
          def += ` TIMESTAMPTZ`;
        } else if (col.data_type === 'timestamp without time zone') {
          def += ` TIMESTAMP`;
        } else {
          def += ` ${col.data_type.toUpperCase()}`;
        }

        // NOT NULL
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }

        // DEFAULT
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }

        return def;
      });

      ddl += columnDefs.join(',\n');

      // Primary key
      const pk = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
          AND i.indisprimary
      `, [tableName]);

      if (pk.rows.length > 0) {
        const pkCols = pk.rows.map(r => r.attname).join(', ');
        ddl += `,\n  PRIMARY KEY (${pkCols})`;
      }

      ddl += '\n);\n\n';
    }

    // Foreign keys
    const fks = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);

    if (fks.rows.length > 0) {
      ddl += `-- Foreign Keys\n`;
      fks.rows.forEach(fk => {
        let onDelete = '';
        if (fk.delete_rule === 'RESTRICT') onDelete = ' ON DELETE RESTRICT';
        else if (fk.delete_rule === 'CASCADE') onDelete = ' ON DELETE CASCADE';
        else if (fk.delete_rule === 'SET NULL') onDelete = ' ON DELETE SET NULL';

        ddl += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name}\n`;
        ddl += `  FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})${onDelete};\n`;
      });
      ddl += '\n';
    }

    // Unique constraints
    const uniques = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);

    if (uniques.rows.length > 0) {
      ddl += `-- Unique Constraints\n`;
      uniques.rows.forEach(u => {
        ddl += `ALTER TABLE ${u.table_name} ADD CONSTRAINT ${u.constraint_name} UNIQUE (${u.columns});\n`;
      });
      ddl += '\n';
    }

    // Vistas
    const views = await client.query(`
      SELECT
        table_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (views.rows.length > 0) {
      ddl += `-- Vistas\n`;
      for (const view of views.rows) {
        ddl += `CREATE OR REPLACE VIEW ${view.table_name} AS\n${view.view_definition};\n\n`;
      }
    }

    // Guardar
    const outputPath = path.join(__dirname, '../../../database/schema-dump.sql');
    fs.writeFileSync(outputPath, ddl, 'utf8');

    console.log(`\n✅ Schema dump generado: ${outputPath}`);
    console.log(`   Tamaño: ${(ddl.length / 1024).toFixed(1)} KB`);

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dumpSchema();
