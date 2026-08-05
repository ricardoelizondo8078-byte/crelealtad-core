import { DataSource } from 'typeorm';

describe('Verificación de Schema Real', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // COMPARAR DESARROLLO vs TEST
    const dbName = process.env.COMPARE_DEV === 'true' ? 'crelealtad' : 'crelealtad_test';
    console.log(`\n>>> CONECTANDO A: ${dbName} <<<\n`);

    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('debe mostrar columnas reales de grupos', async () => {
    const columnas = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'grupos'
      ORDER BY ordinal_position
    `);
    console.log('\n=== COLUMNAS DE GRUPOS ===');
    columnas.forEach((col: any) => {
      console.log(`${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
    });
  });

  it('debe mostrar columnas reales de integrantes', async () => {
    const columnas = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'integrantes'
      ORDER BY ordinal_position
    `);
    console.log('\n=== COLUMNAS DE INTEGRANTES ===');
    columnas.forEach((col: any) => {
      console.log(`${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
    });
  });

  it('debe mostrar columnas reales de expedientes', async () => {
    const columnas = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expedientes'
      ORDER BY ordinal_position
    `);
    console.log('\n=== COLUMNAS DE EXPEDIENTES ===');
    columnas.forEach((col: any) => {
      console.log(`${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
    });
  });

  it('debe mostrar columnas reales de personas', async () => {
    const columnas = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'personas'
      ORDER BY ordinal_position
    `);
    console.log('\n=== COLUMNAS DE PERSONAS ===');
    columnas.forEach((col: any) => {
      console.log(`${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
    });
  });
});
