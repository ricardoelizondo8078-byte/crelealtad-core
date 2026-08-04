const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS
});

async function crearTablaDocumentos() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Crear tabla documentos
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS documentos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "solicitanteId" UUID,
        tipo VARCHAR(50),
        estado VARCHAR(50) DEFAULT 'PENDIENTE',
        "archivoBase64" TEXT,
        "archivoNombre" VARCHAR(255),
        "fechaCarga" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('🔨 Creando tabla documentos...\n');
    await client.query(createTableSQL);
    console.log('✅ Tabla documentos creada\n');

    // Verificar estructura
    const verifySQL = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'documentos'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(verifySQL);

    console.log('📋 ESTRUCTURA DE LA TABLA documentos:');
    console.log('═══════════════════════════════════════════════\n');

    result.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(20)} → ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
    });

    console.log('\n═══════════════════════════════════════════════');
    console.log(`✅ Tabla creada con ${result.rows.length} columnas\n`);

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

crearTablaDocumentos();
