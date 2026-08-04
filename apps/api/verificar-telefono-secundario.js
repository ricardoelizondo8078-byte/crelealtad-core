const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [],
  synchronize: false,
});

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida');

    // Verificar estructura de la tabla personas
    const result = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'personas'
      AND column_name IN ('telefono', 'telefono_secundario')
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Columnas de teléfono en tabla personas:');
    console.table(result);

    // Verificar un registro real
    const persona = await AppDataSource.query(`
      SELECT id, primer_nombre, telefono, telefono_secundario
      FROM personas
      WHERE telefono IS NOT NULL
      LIMIT 1;
    `);

    console.log('\n📄 Registro de ejemplo:');
    console.log(JSON.stringify(persona, null, 2));

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
