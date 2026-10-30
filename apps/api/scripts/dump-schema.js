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
          col.column_name,
          col.is_nullable,
          col.column_default,
          pg_catalog.format_type(attr.atttypid, attr.atttypmod) AS formatted_type
        FROM information_schema.columns AS col
        JOIN pg_catalog.pg_class AS cls
          ON cls.relname = col.table_name
        JOIN pg_catalog.pg_namespace AS ns
          ON ns.oid = cls.relnamespace
         AND ns.nspname = col.table_schema
        JOIN pg_catalog.pg_attribute AS attr
          ON attr.attrelid = cls.oid
         AND attr.attname = col.column_name
        WHERE col.table_schema = 'public'
          AND col.table_name = $1
        ORDER BY col.ordinal_position
      `, [tableName]);

      ddl += `-- Tabla: ${tableName}\n`;
      ddl += `CREATE TABLE ${tableName} (\n`;

      const columnDefs = columns.rows.map((col, idx) => {
        let def = `  ${col.column_name}`;

        // Tipo exacto de PostgreSQL, incluidos arreglos y precisiones.
        def += ` ${col.formatted_type}`;

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

    // Funciones propias requeridas por triggers o reglas de integridad.
    // Se excluyen las funciones pertenecientes a extensiones, que se recrean con CREATE EXTENSION.
    const functions = await client.query(`
      SELECT pg_get_functiondef(proc.oid) AS definition
      FROM pg_proc proc
      JOIN pg_namespace ns ON ns.oid = proc.pronamespace
      WHERE ns.nspname = 'public'
        AND proc.prokind = 'f'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend dep
          JOIN pg_extension ext ON ext.oid = dep.refobjid
          WHERE dep.classid = 'pg_proc'::regclass
            AND dep.objid = proc.oid
            AND dep.deptype = 'e'
        )
      ORDER BY proc.proname, proc.oid
    `);

    if (functions.rows.length > 0) {
      ddl += `-- Funciones\n`;
      functions.rows.forEach(fn => {
        const definition = fn.definition.trim();
        ddl += `${definition.endsWith(';') ? definition : `${definition};`}\n\n`;
      });
    }

    // Unique constraints deben existir antes de las llaves foráneas que las referencian.
    const uniques = await client.query(`
      SELECT
        cls.relname AS table_name,
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE con.contype = 'u'
        AND ns.nspname = 'public'
      ORDER BY cls.relname, con.conname
    `);

    if (uniques.rows.length > 0) {
      ddl += `-- Unique Constraints\n`;
      uniques.rows.forEach(u => {
        ddl += `ALTER TABLE ${u.table_name} ADD CONSTRAINT ${u.constraint_name} ${u.definition};\n`;
      });
      ddl += '\n';
    }

    // Índices no respaldados por constraints, incluidos únicos parciales de idempotencia.
    const indexes = await client.query(`
      SELECT
        table_cls.relname AS table_name,
        index_cls.relname AS index_name,
        pg_get_indexdef(index_rel.indexrelid) AS definition
      FROM pg_index index_rel
      JOIN pg_class table_cls ON table_cls.oid = index_rel.indrelid
      JOIN pg_class index_cls ON index_cls.oid = index_rel.indexrelid
      JOIN pg_namespace ns ON ns.oid = table_cls.relnamespace
      LEFT JOIN pg_constraint con ON con.conindid = index_rel.indexrelid
      WHERE ns.nspname = 'public'
        AND NOT index_rel.indisprimary
        AND con.oid IS NULL
      ORDER BY table_cls.relname, index_cls.relname
    `);

    if (indexes.rows.length > 0) {
      ddl += `-- Indexes\n`;
      indexes.rows.forEach(index => {
        ddl += `${index.definition};\n`;
      });
      ddl += '\n';
    }

    // Foreign keys
    const fks = await client.query(`
      SELECT
        cls.relname AS table_name,
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE con.contype = 'f'
        AND ns.nspname = 'public'
      ORDER BY cls.relname, con.conname
    `);

    if (fks.rows.length > 0) {
      ddl += `-- Foreign Keys\n`;
      fks.rows.forEach(fk => {
        ddl += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name}\n`;
        ddl += `  ${fk.definition};\n`;
      });
      ddl += '\n';
    }

    // Check constraints
    const checks = await client.query(`
      SELECT
        cls.relname AS table_name,
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid, true) AS definition
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE con.contype = 'c'
        AND ns.nspname = 'public'
      ORDER BY cls.relname, con.conname
    `);

    if (checks.rows.length > 0) {
      ddl += `-- Check Constraints\n`;
      checks.rows.forEach(check => {
        ddl += `ALTER TABLE ${check.table_name} ADD CONSTRAINT ${check.constraint_name} ${check.definition};\n`;
      });
      ddl += '\n';
    }

    // Triggers propios; los triggers internos de constraints se recrean con sus constraints.
    const triggers = await client.query(`
      SELECT pg_get_triggerdef(trigger.oid, true) AS definition
      FROM pg_trigger trigger
      JOIN pg_class cls ON cls.oid = trigger.tgrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = 'public'
        AND NOT trigger.tgisinternal
      ORDER BY cls.relname, trigger.tgname
    `);

    if (triggers.rows.length > 0) {
      ddl += `-- Triggers\n`;
      triggers.rows.forEach(trigger => {
        ddl += `${trigger.definition};\n`;
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
