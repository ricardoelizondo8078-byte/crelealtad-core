import { DataSource } from 'typeorm';
import { AddCreditHistoryIntegrityConstraints1785956582554 } from './src/migrations/1785956582554-AddCreditHistoryIntegrityConstraints';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
  entities: [],
  migrations: [],
});

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('✅ DataSource inicializado');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('\n🚀 Ejecutando migración AddCreditHistoryIntegrityConstraints...\n');

    const migration = new AddCreditHistoryIntegrityConstraints1785956582554();
    await migration.up(queryRunner);

    console.log('\n✅ Migración completada exitosamente');

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('\n❌ ERROR durante la migración:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
