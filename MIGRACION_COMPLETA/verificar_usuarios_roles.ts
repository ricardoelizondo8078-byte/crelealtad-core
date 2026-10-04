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

async function verificarUsuariosRoles() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VERIFICANDO TABLAS: USUARIOS Y ROLES');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Estructura de tabla USUARIOS
  console.log('📊 TABLA: usuarios\n');

  const estructuraUsuarios = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'usuarios'
    ORDER BY ordinal_position;
  `);

  estructuraUsuarios.rows.forEach(col => {
    const req = col.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL';
    console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${req}`);
  });

  // Contar usuarios existentes
  const countUsuarios = await pool.query(`SELECT COUNT(*) as total FROM usuarios;`);
  console.log(`\n   Total usuarios actuales: ${countUsuarios.rows[0].total}\n`);

  // 2. Estructura de tabla ROLES
  console.log('\n📊 TABLA: roles\n');

  const estructuraRoles = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_name = 'roles'
    ORDER BY ordinal_position;
  `);

  estructuraRoles.rows.forEach(col => {
    const req = col.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL';
    console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${req}`);
  });

  // Ver roles existentes
  const roles = await pool.query(`
    SELECT id, nombre, descripcion
    FROM roles
    ORDER BY nombre;
  `);

  console.log(`\n   📋 ROLES EXISTENTES (${roles.rows.length}):\n`);

  if (roles.rows.length > 0) {
    roles.rows.forEach((rol, idx) => {
      console.log(`   ${String(idx + 1).padStart(2)}. ${rol.nombre.padEnd(30)} (${rol.id})`);
      if (rol.descripcion) {
        console.log(`       ${rol.descripcion}`);
      }
    });
  } else {
    console.log('   ❌ No hay roles en la tabla\n');
  }

  // 3. Verificar relación usuarios-roles
  console.log('\n\n📊 RELACIÓN: usuarios ↔ roles\n');

  const relacionColumnas = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'usuarios'
      AND column_name LIKE '%rol%'
    ORDER BY ordinal_position;
  `);

  if (relacionColumnas.rows.length > 0) {
    console.log('   ✅ Columnas relacionadas con roles en usuarios:');
    relacionColumnas.rows.forEach(col => {
      console.log(`      - ${col.column_name} (${col.data_type})`);
    });
  } else {
    console.log('   ⚠️  No se encontró columna rol_id directa en usuarios');
    console.log('   Verificando tabla intermedia usuarios_roles...\n');

    const tablaIntermedia = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'usuarios_roles'
      );
    `);

    if (tablaIntermedia.rows[0].exists) {
      console.log('   ✅ Tabla usuarios_roles existe (relación many-to-many)');

      const estructuraUR = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'usuarios_roles'
        ORDER BY ordinal_position;
      `);

      estructuraUR.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type})`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  await pool.end();
}

verificarUsuariosRoles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
