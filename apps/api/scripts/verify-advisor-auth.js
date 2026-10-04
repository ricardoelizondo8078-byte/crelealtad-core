/** Verifica la carga de asesores sin imprimir PIN, hashes ni datos personales. */

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

async function main() {
  loadEnv(path.resolve(__dirname, '../.env'));
  const database = readArg('database') || process.env.DB_NAME || 'crelealtad';
  const inputPath = readArg('input');
  const temporaryPin = process.env.ADVISOR_TEMP_PIN;
  if (!inputPath) throw new Error('Falta --input=<ruta JSON>');
  if (!/^\d{4}$/.test(temporaryPin || '')) throw new Error('PIN de verificacion invalido');

  const source = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  const abbreviations = source.map((row) => row.abreviatura.trim().toUpperCase());
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
    const result = await client.query(
      `SELECT u.abreviatura, u.password_hash, u.estado, u.email,
              u.requiere_cambio_pin, r.nombre AS rol, s.nombre AS sucursal,
              e.id AS empleado_id, e.zona_id, edl.id AS datos_laborales_id
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       JOIN sucursales s ON s.id = u.sucursal_id
       LEFT JOIN empleados e ON e.usuario_id = u.id
       LEFT JOIN empleados_datos_laborales edl ON edl.empleado_id = e.id
       WHERE UPPER(u.abreviatura) = ANY($1::text[])`,
      [abbreviations],
    );

    let validHashes = 0;
    for (const row of result.rows) {
      if (await bcrypt.compare(temporaryPin, row.password_hash)) validHashes += 1;
    }

    const summary = {
      source: abbreviations.length,
      users: result.rowCount,
      uniqueAbbreviations: new Set(result.rows.map((row) => row.abreviatura.toUpperCase())).size,
      active: result.rows.filter((row) => row.estado === 'ACTIVO').length,
      advisorRole: result.rows.filter((row) => row.rol === 'ASESOR').length,
      matrix: result.rows.filter((row) => row.sucursal === 'MATRIZ').length,
      withoutZone: result.rows.filter((row) => row.zona_id === null).length,
      employees: result.rows.filter((row) => row.empleado_id).length,
      laborRows: result.rows.filter((row) => row.datos_laborales_id).length,
      withoutEmail: result.rows.filter((row) => row.email === null).length,
      temporaryPin: result.rows.filter((row) => row.requiere_cambio_pin).length,
      validHashes,
      plaintextPins: result.rows.filter((row) => /^\d{4}$/.test(row.password_hash)).length,
    };

    const expected = abbreviations.length;
    const expectedKeys = [
      'source', 'users', 'uniqueAbbreviations', 'active', 'advisorRole',
      'matrix', 'withoutZone', 'employees', 'laborRows', 'withoutEmail',
      'temporaryPin', 'validHashes',
    ];
    if (
      expectedKeys.some((key) => Number(summary[key]) !== expected)
      || summary.plaintextPins !== 0
    ) {
      throw new Error(`Verificacion inconsistente: ${JSON.stringify(summary)}`);
    }
    console.log(`Verificacion correcta en ${database}: ${JSON.stringify(summary)}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Verificacion fallida: ${error.message}`);
  process.exitCode = 1;
});
