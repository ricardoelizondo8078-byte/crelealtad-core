const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTestDb() {
  // Primero crear la BD (conectar a postgres default)
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('✓ Conectado a PostgreSQL');

    // Verificar si existe
    const checkDb = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'crelealtad_test'"
    );

    if (checkDb.rows.length === 0) {
      await adminClient.query('CREATE DATABASE crelealtad_test');
      console.log('✓ Base de datos crelealtad_test creada');
    } else {
      console.log('✓ Base de datos crelealtad_test ya existe');
    }

    await adminClient.end();

    // Ahora conectar a crelealtad_test y aplicar migraciones
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: 'crelealtad_test',
    });

    await testClient.connect();
    console.log('✓ Conectado a crelealtad_test');

    // Habilitar extensión uuid
    await testClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ Extensión uuid-ossp habilitada');

    // Crear tabla personas
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS personas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombres VARCHAR(150),
        apellido_pat VARCHAR(50),
        apellido_mat VARCHAR(50),
        nombre_completo VARCHAR(255),
        curp VARCHAR(18) UNIQUE,
        fecha_nac DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabla personas creada');

    // Crear tablas auxiliares
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(200),
        tesorera_id UUID,
        ciclo_numero INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabla grupos creada');

    await testClient.query(`
      CREATE TABLE IF NOT EXISTS expedientes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        grupo_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabla expedientes creada');

    await testClient.query(`
      CREATE TABLE IF NOT EXISTS integrantes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        expediente_id UUID,
        persona_id UUID,
        estado VARCHAR(50) DEFAULT 'DOCUMENTANDO',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Tabla integrantes creada');

    // Aplicar migración principal (solicitudes)
    const migrationPath = path.join(__dirname, '../src/migrations/crear-solicitudes-normalizadas.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    await testClient.query(migrationSql);
    console.log('✓ Migraciones de solicitudes aplicadas');

    await testClient.end();
    console.log('✓ Setup completo');
  } catch (error) {
    console.error('Error en setup:', error.message);
    process.exit(1);
  }
}

setupTestDb();
