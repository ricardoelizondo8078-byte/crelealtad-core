import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

interface MigrationDescriptor {
  version: string;
  sequence: number;
  checksum: string;
  path: string;
}

interface MigrationCatalogInstance {
  discover(): MigrationDescriptor[];
}

type MigrationCatalogConstructor = new (
  migrationsDirectory: string,
) => MigrationCatalogInstance;

const { MigrationCatalog } = require('../../scripts/migration-catalog') as {
  MigrationCatalog: MigrationCatalogConstructor;
};
const { registerMigrationBaseline } = require('../../scripts/setup-test-db') as {
  registerMigrationBaseline: (client: QueryClient) => Promise<number>;
};
const { MigrationLedger } = require('../../scripts/migration-ledger') as {
  MigrationLedger: new (databaseName: string) => {
    analyze(
      discovered: MigrationDescriptor[],
      entries: Array<{ version: string; checksum: string }>,
    ): {
      pending: string[];
      drift: string[];
      unknown: string[];
    };
  };
};

interface QueryResult {
  rows: Array<Record<string, unknown>>;
}

interface QueryClient {
  query(sql: string, parameters?: unknown[]): Promise<QueryResult>;
}

describe('MigrationCatalog', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'crelealtad-migrations-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('descubre únicamente migraciones directas y calcula su checksum', () => {
    const content = Buffer.from('BEGIN;\nSELECT 1;\nCOMMIT;\n');
    writeFileSync(join(directory, '001_inicial.sql'), content);
    writeFileSync(join(directory, '001_inicial.rollback.sql'), 'SELECT 1;');
    writeFileSync(join(directory, 'migration_002_legacy.sql'), 'SELECT 1;');

    const migrations = new MigrationCatalog(directory).discover();

    expect(migrations).toHaveLength(1);
    expect(migrations[0]).toMatchObject({
      version: '001_inicial.sql',
      sequence: 1,
      checksum: createHash('sha256').update(content).digest('hex'),
    });
  });

  it('ordena la cadena por nombre canónico', () => {
    writeFileSync(join(directory, '010_decima.sql'), 'BEGIN; COMMIT;');
    writeFileSync(join(directory, '005_quinta.sql'), 'BEGIN; COMMIT;');

    const migrations = new MigrationCatalog(directory).discover();

    expect(migrations.map((migration) => migration.sequence)).toEqual([5, 10]);
  });

  it('rechaza secuencias duplicadas', () => {
    writeFileSync(join(directory, '005_primera.sql'), 'BEGIN; COMMIT;');
    writeFileSync(join(directory, '005_segunda.sql'), 'BEGIN; COMMIT;');

    expect(() => new MigrationCatalog(directory).discover())
      .toThrow('Secuencia de migración duplicada: 005');
  });

  it('rechaza la secuencia cero', () => {
    writeFileSync(join(directory, '000_invalida.sql'), 'BEGIN; COMMIT;');

    expect(() => new MigrationCatalog(directory).discover())
      .toThrow('Secuencia de migración inválida: 000_invalida.sql');
  });

  it('rechaza un catálogo canónico vacío', () => {
    writeFileSync(join(directory, 'migration_001_legacy.sql'), 'SELECT 1;');

    expect(() => new MigrationCatalog(directory).discover())
      .toThrow('No se encontraron migraciones canónicas');
  });
});

describe('registerMigrationBaseline', () => {
  it('registra todo el catálogo vigente dentro de una transacción', async () => {
    const calls: Array<{ sql: string; parameters?: unknown[] }> = [];
    const client: QueryClient = {
      query: async (sql, parameters) => {
        calls.push({ sql, parameters });
        if (sql.includes('to_regclass')) return { rows: [{ exists: true }] };
        if (sql.includes('COUNT(*)')) return { rows: [{ total: 0 }] };
        return { rows: [] };
      },
    };
    const catalog = new MigrationCatalog(
      resolve(__dirname, '../../../../database/migrations'),
    ).discover();

    await expect(registerMigrationBaseline(client)).resolves.toBe(catalog.length);

    const inserts = calls.filter((call) => (
      call.sql.includes('INSERT INTO public.schema_migrations')
    ));
    expect(inserts).toHaveLength(catalog.length);
    expect(inserts[0].parameters).toEqual([catalog[0].version, catalog[0].checksum]);
    expect(calls.map((call) => call.sql.trim())).toContain('BEGIN');
    expect(calls.at(-1)?.sql.trim()).toBe('COMMIT');
  });

  it('rechaza un dump que ya contiene entradas de ledger', async () => {
    const client: QueryClient = {
      query: async (sql) => {
        if (sql.includes('to_regclass')) return { rows: [{ exists: true }] };
        if (sql.includes('COUNT(*)')) return { rows: [{ total: 1 }] };
        return { rows: [] };
      },
    };

    await expect(registerMigrationBaseline(client))
      .rejects.toThrow('El schema dump debe entregar un ledger vacío');
  });
});

describe('MigrationLedger', () => {
  it('clasifica pendientes, drift y entradas desconocidas', () => {
    const discovered: MigrationDescriptor[] = [
      { version: '001_inicial.sql', sequence: 1, checksum: 'a'.repeat(64), path: '' },
      { version: '005_segunda.sql', sequence: 5, checksum: 'b'.repeat(64), path: '' },
      { version: '006_pendiente.sql', sequence: 6, checksum: 'c'.repeat(64), path: '' },
    ];
    const entries = [
      { version: '001_inicial.sql', checksum: 'a'.repeat(64) },
      { version: '005_segunda.sql', checksum: 'd'.repeat(64) },
      { version: '004_desconocida.sql', checksum: 'e'.repeat(64) },
    ];

    const analysis = new MigrationLedger('crelealtad_test').analyze(discovered, entries);

    expect(analysis.pending).toEqual(['006_pendiente.sql']);
    expect(analysis.drift).toEqual(['005_segunda.sql']);
    expect(analysis.unknown).toEqual(['004_desconocida.sql']);
  });
});
