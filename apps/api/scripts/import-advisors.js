/**
 * Importa asesores validados a usuarios/empleados.
 *
 * Requisitos:
 * - ADVISOR_TEMP_PIN en el entorno (exactamente 4 digitos).
 * - --input=<ruta JSON generada desde la tabla autorizada>.
 * - --database=<base objetivo>.
 * - --apply-schema para aplicar 005_advisor_login_abbreviation.sql.
 * - --seed-test-prerequisites solo para una base terminada en _test.
 *
 * El PIN nunca se imprime ni se almacena en texto plano.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

function loadEnv(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function validateSource(rows) {
  if (!Array.isArray(rows) || rows.length !== 49) {
    throw new Error(`La fuente debe contener exactamente 49 asesores; recibidos: ${rows?.length ?? 0}`);
  }

  const abbreviations = new Set();
  const legacyIds = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row.nombre !== 'string' || !row.nombre.trim()) {
      throw new Error(`Nombre invalido en la posicion ${index + 1}`);
    }
    if (typeof row.abreviatura !== 'string' || !/^[\p{L}\p{N}_]+$/u.test(row.abreviatura)) {
      throw new Error(`Abreviatura invalida en la posicion ${index + 1}`);
    }

    const abbreviation = row.abreviatura.trim().toUpperCase();
    if (abbreviation === 'OFNA') {
      throw new Error('OFNA es una fila administrativa y no puede importarse como asesor');
    }
    if (abbreviations.has(abbreviation)) {
      throw new Error(`Abreviatura duplicada: ${abbreviation}`);
    }
    if (legacyIds.has(row.identificador_legacy)) {
      throw new Error(`Identificador legacy duplicado en la posicion ${index + 1}`);
    }
    abbreviations.add(abbreviation);
    legacyIds.add(row.identificador_legacy);
  }
}

async function main() {
  loadEnv(path.resolve(__dirname, '../.env'));

  const inputPath = readArg('input');
  const database = readArg('database') || process.env.DB_NAME || 'crelealtad';
  const temporaryPin = process.env.ADVISOR_TEMP_PIN;
  const applySchema = hasFlag('apply-schema');
  const seedTestPrerequisites = hasFlag('seed-test-prerequisites');

  if (!inputPath) throw new Error('Falta --input=<ruta JSON>');
  if (!/^\d{4}$/.test(temporaryPin || '')) {
    throw new Error('ADVISOR_TEMP_PIN debe contener exactamente 4 digitos');
  }
  if (seedTestPrerequisites && !database.endsWith('_test')) {
    throw new Error('--seed-test-prerequisites solo se permite en bases terminadas en _test');
  }

  const rows = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  validateSource(rows);

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database,
    ssl: String(process.env.DB_SSL).toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false,
  });

  await client.connect();
  try {
    if (applySchema) {
      const migrationPath = path.resolve(
        __dirname,
        '../../../database/migrations/005_advisor_login_abbreviation.sql',
      );
      await client.query(fs.readFileSync(migrationPath, 'utf8'));
      console.log(`Esquema de autenticacion aplicado en ${database}.`);
    }

    await client.query('BEGIN');

    if (seedTestPrerequisites) {
      await client.query(`
        INSERT INTO roles (nombre, descripcion, permisos, estado)
        VALUES (
          'ASESOR',
          'Rol de prueba para importacion',
          '{"modulos":["documentacion","expedientes","solicitudes","verificacion"],"acciones":["crear","leer","actualizar"]}'::jsonb,
          'ACTIVO'
        )
        ON CONFLICT (nombre) DO NOTHING
      `);
      await client.query(`
        INSERT INTO sucursales (nombre, estado)
        SELECT 'MATRIZ', 'ACTIVA'
        WHERE NOT EXISTS (SELECT 1 FROM sucursales WHERE UPPER(nombre) = 'MATRIZ')
      `);
    }

    const roleResult = await client.query(`
      SELECT id FROM roles
      WHERE UPPER(nombre) = 'ASESOR' AND estado = 'ACTIVO'
    `);
    const branchResult = await client.query(`
      SELECT id FROM sucursales
      WHERE UPPER(nombre) = 'MATRIZ' AND estado = 'ACTIVA'
    `);
    if (roleResult.rowCount !== 1) throw new Error('Se requiere exactamente un rol ASESOR activo');
    if (branchResult.rowCount !== 1) throw new Error('Se requiere exactamente una sucursal MATRIZ activa');

    const abbreviations = rows.map((row) => row.abreviatura.trim().toUpperCase());
    const existing = await client.query(
      'SELECT COUNT(*)::int AS total FROM usuarios WHERE UPPER(abreviatura) = ANY($1::text[])',
      [abbreviations],
    );
    if (existing.rows[0].total !== 0) {
      throw new Error(`Carga cancelada: ya existen ${existing.rows[0].total} abreviaturas de la fuente`);
    }

    const roleId = roleResult.rows[0].id;
    const branchId = branchResult.rows[0].id;
    const hashes = [];
    for (let index = 0; index < rows.length; index += 1) {
      hashes.push(await bcrypt.hash(temporaryPin, 10));
    }

    for (const [index, row] of rows.entries()) {
      const userResult = await client.query(
        `INSERT INTO usuarios (
          nombre, email, abreviatura, password_hash, requiere_cambio_pin,
          rol_id, sucursal_id, estado
        ) VALUES ($1, NULL, $2, $3, TRUE, $4, $5, 'ACTIVO')
        RETURNING id`,
        [row.nombre.trim(), abbreviations[index], hashes[index], roleId, branchId],
      );

      const employeeResult = await client.query(
        `INSERT INTO empleados (usuario_id, zona_id, tipo_empleado)
         VALUES ($1, NULL, 'ASESOR')
         RETURNING id`,
        [userResult.rows[0].id],
      );

      await client.query(
        `INSERT INTO empleados_datos_laborales (empleado_id, sucursal_id, nivel)
         VALUES ($1, $2, 'ASESOR')`,
        [employeeResult.rows[0].id, branchId],
      );
    }

    const verification = await client.query(
      `SELECT
        COUNT(*)::int AS usuarios,
        COUNT(e.id)::int AS empleados,
        COUNT(edl.id)::int AS datos_laborales,
        COUNT(*) FILTER (WHERE u.estado = 'ACTIVO')::int AS activos,
        COUNT(*) FILTER (WHERE u.sucursal_id = $2)::int AS matriz,
        COUNT(*) FILTER (WHERE e.zona_id IS NULL)::int AS sin_zona,
        COUNT(*) FILTER (WHERE u.requiere_cambio_pin)::int AS pin_temporal
       FROM usuarios u
       LEFT JOIN empleados e ON e.usuario_id = u.id
       LEFT JOIN empleados_datos_laborales edl ON edl.empleado_id = e.id
       WHERE UPPER(u.abreviatura) = ANY($1::text[])`,
      [abbreviations, branchId],
    );
    const totals = verification.rows[0];
    if (Object.values(totals).some((value) => Number(value) !== rows.length)) {
      throw new Error(`Verificacion de carga inconsistente: ${JSON.stringify(totals)}`);
    }

    const sample = await client.query(
      'SELECT password_hash FROM usuarios WHERE UPPER(abreviatura) = $1',
      [abbreviations[0]],
    );
    if (!sample.rowCount || !(await bcrypt.compare(temporaryPin, sample.rows[0].password_hash))) {
      throw new Error('La verificacion bcrypt del PIN temporal fallo');
    }

    await client.query('COMMIT');
    console.log(`Carga completada en ${database}: ${rows.length} usuarios y empleados.`);
    console.log(`Validacion: activos=${totals.activos}, matriz=${totals.matriz}, sin_zona=${totals.sin_zona}, pin_temporal=${totals.pin_temporal}.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Importacion cancelada: ${error.message}`);
  process.exitCode = 1;
});
