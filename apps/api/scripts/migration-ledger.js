const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

class MigrationLedger {
  constructor(databaseName) {
    this.databaseName = databaseName;
    this.migrationsDirectory = path.resolve(__dirname, '../../../database/migrations');
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
      database: databaseName,
    });
  }

  discover() {
    return fs.readdirSync(this.migrationsDirectory)
      .filter((fileName) => /^\d{3}_.+\.sql$/.test(fileName) && !fileName.endsWith('.rollback.sql'))
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => {
        const migrationPath = path.join(this.migrationsDirectory, fileName);
        const content = fs.readFileSync(migrationPath);
        return {
          version: fileName,
          sequence: Number(fileName.slice(0, 3)),
          checksum: createHash('sha256').update(content).digest('hex'),
          path: migrationPath,
        };
      });
  }

  async connect() {
    await this.client.connect();
    const result = await this.client.query('SELECT current_database() AS database_name');
    if (result.rows[0].database_name !== this.databaseName) {
      throw new Error('La conexión no apunta a la base solicitada');
    }
  }

  async tableExists() {
    const result = await this.client.query(
      "SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists",
    );
    return result.rows[0].exists;
  }

  async status() {
    const discovered = this.discover();
    if (!(await this.tableExists())) {
      throw new Error('schema_migrations no existe; aplica primero la migración 034');
    }

    const result = await this.client.query(
      'SELECT version, checksum, source, applied_at FROM public.schema_migrations ORDER BY version',
    );
    const applied = new Map(result.rows.map((row) => [row.version, row]));
    const drift = [];
    const pending = [];

    for (const migration of discovered) {
      const ledgerEntry = applied.get(migration.version);
      if (!ledgerEntry) {
        pending.push(migration.version);
      } else if (ledgerEntry.checksum !== migration.checksum) {
        drift.push(migration.version);
      }
    }

    const unknown = result.rows
      .filter((row) => !discovered.some((migration) => migration.version === row.version))
      .map((row) => row.version);

    console.log(JSON.stringify({
      database: this.databaseName,
      discovered: discovered.length,
      applied: result.rowCount,
      pending,
      drift,
      unknown,
    }, null, 2));

    if (drift.length || unknown.length) process.exitCode = 2;
  }

  async baseline(throughSequence) {
    if (process.env.MIGRATION_BASELINE_CONFIRM !== this.databaseName) {
      throw new Error(`MIGRATION_BASELINE_CONFIRM debe ser exactamente ${this.databaseName}`);
    }
    if (!(await this.tableExists())) {
      throw new Error('schema_migrations no existe; aplica primero la migración 034');
    }

    const selected = this.discover().filter((migration) => migration.sequence <= throughSequence);
    if (!selected.length || selected.at(-1).sequence !== throughSequence) {
      throw new Error(`No existe una migración canónica con secuencia ${throughSequence}`);
    }

    await this.client.query('BEGIN');
    try {
      for (const migration of selected) {
        const existing = await this.client.query(
          'SELECT checksum FROM public.schema_migrations WHERE version = $1',
          [migration.version],
        );
        if (existing.rowCount && existing.rows[0].checksum !== migration.checksum) {
          throw new Error(`Checksum distinto para ${migration.version}`);
        }
        if (!existing.rowCount) {
          await this.client.query(
            `INSERT INTO public.schema_migrations (version, checksum, source)
             VALUES ($1, $2, 'BASELINE')`,
            [migration.version, migration.checksum],
          );
        }
      }
      await this.client.query('COMMIT');
      console.log(`Baseline registrado hasta ${String(throughSequence).padStart(3, '0')} en ${this.databaseName}`);
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  async apply(throughSequence) {
    if (process.env.MIGRATION_APPLY_CONFIRM !== this.databaseName) {
      throw new Error(`MIGRATION_APPLY_CONFIRM debe ser exactamente ${this.databaseName}`);
    }
    if (!(await this.tableExists())) {
      throw new Error('schema_migrations no existe; aplica primero la migración 034');
    }

    const discovered = this.discover();
    const target = discovered.find((migration) => migration.sequence === throughSequence);
    if (!target) {
      throw new Error(`No existe una migración canónica con secuencia ${throughSequence}`);
    }

    const result = await this.client.query(
      'SELECT version, checksum FROM public.schema_migrations ORDER BY version',
    );
    const applied = new Map(result.rows.map((row) => [row.version, row.checksum]));
    const unknown = result.rows
      .filter((row) => !discovered.some((migration) => migration.version === row.version))
      .map((row) => row.version);
    const drift = discovered
      .filter((migration) => (
        applied.has(migration.version)
        && applied.get(migration.version) !== migration.checksum
      ))
      .map((migration) => migration.version);

    if (unknown.length || drift.length) {
      throw new Error(`Ledger inconsistente; unknown=${unknown.join(',')}; drift=${drift.join(',')}`);
    }

    const pending = discovered.filter((migration) => (
      migration.sequence <= throughSequence && !applied.has(migration.version)
    ));

    for (const migration of pending) {
      const sql = fs.readFileSync(migration.path, 'utf8');
      const transactionWrapper = sql.match(/^\s*BEGIN;\s*([\s\S]*?)\s*COMMIT;\s*$/i);
      if (!transactionWrapper) {
        throw new Error(`${migration.version} debe estar envuelta por BEGIN/COMMIT`);
      }

      const startedAt = Date.now();
      await this.client.query('BEGIN');
      try {
        await this.client.query(transactionWrapper[1]);
        await this.client.query(
          `INSERT INTO public.schema_migrations
            (version, checksum, source, execution_ms)
           VALUES ($1, $2, 'MIGRATION', $3)`,
          [migration.version, migration.checksum, Date.now() - startedAt],
        );
        await this.client.query('COMMIT');
        console.log(`Aplicada ${migration.version} en ${this.databaseName}`);
      } catch (error) {
        await this.client.query('ROLLBACK');
        throw error;
      }
    }

    if (!pending.length) {
      console.log(`No hay migraciones pendientes hasta ${target.version} en ${this.databaseName}`);
    }
  }

  async close() {
    await this.client.end();
  }
}

function argumentValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const command = process.argv[2] || 'status';
  const databaseName = argumentValue('database') || process.env.DB_NAME;
  if (!databaseName) throw new Error('DB_NAME o --database es obligatorio');

  const ledger = new MigrationLedger(databaseName);
  await ledger.connect();
  try {
    if (command === 'status') {
      await ledger.status();
      return;
    }
    if (command === 'baseline') {
      const through = Number(argumentValue('through'));
      if (!Number.isInteger(through) || through <= 0) {
        throw new Error('--through debe ser una secuencia positiva');
      }
      await ledger.baseline(through);
      return;
    }
    if (command === 'apply') {
      const through = Number(argumentValue('through'));
      if (!Number.isInteger(through) || through <= 0) {
        throw new Error('--through debe ser una secuencia positiva');
      }
      await ledger.apply(through);
      return;
    }
    throw new Error(`Comando no soportado: ${command}`);
  } finally {
    await ledger.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
