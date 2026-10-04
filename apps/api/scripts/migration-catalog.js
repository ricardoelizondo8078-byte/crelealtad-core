const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const FORWARD_MIGRATION_PATTERN = /^(\d{3})_.+\.sql$/;

class MigrationCatalog {
  constructor(migrationsDirectory) {
    this.migrationsDirectory = migrationsDirectory;
  }

  discover() {
    const migrations = fs.readdirSync(this.migrationsDirectory)
      .filter((fileName) => (
        FORWARD_MIGRATION_PATTERN.test(fileName)
        && !fileName.endsWith('.rollback.sql')
      ))
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

    this.validate(migrations);
    return migrations;
  }

  validate(migrations) {
    if (!migrations.length) {
      throw new Error(`No se encontraron migraciones canónicas en ${this.migrationsDirectory}`);
    }

    const versions = new Set();
    const sequences = new Set();
    for (const migration of migrations) {
      if (!Number.isInteger(migration.sequence) || migration.sequence <= 0) {
        throw new Error(`Secuencia de migración inválida: ${migration.version}`);
      }
      if (versions.has(migration.version)) {
        throw new Error(`Versión de migración duplicada: ${migration.version}`);
      }
      if (sequences.has(migration.sequence)) {
        throw new Error(
          `Secuencia de migración duplicada: ${String(migration.sequence).padStart(3, '0')}`,
        );
      }
      versions.add(migration.version);
      sequences.add(migration.sequence);
    }
  }
}

module.exports = {
  FORWARD_MIGRATION_PATTERN,
  MigrationCatalog,
};
