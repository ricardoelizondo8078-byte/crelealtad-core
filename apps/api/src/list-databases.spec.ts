import { DataSource } from 'typeorm';

describe('Listar bases de datos', () => {
  it('debe mostrar todas las bases disponibles', async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
      database: 'postgres',
    });

    await dataSource.initialize();

    const dbs = await dataSource.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `);

    console.log('\n=== BASES DE DATOS DISPONIBLES ===');
    dbs.forEach((db: any) => {
      console.log(db.datname);
    });

    await dataSource.destroy();
  });
});
