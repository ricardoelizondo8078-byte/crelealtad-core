/**
 * Script para ejecutar migraciones SQL
 */
const { Client } = require('../apps/api/node_modules/pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
};

async function ejecutarMigracion(archivo) {
  const client = new Client(config);

  try {
    await client.connect();
    console.log(`✓ Conectado a PostgreSQL`);

    const sql = fs.readFileSync(archivo, 'utf8');
    console.log(`\n📝 Ejecutando: ${path.basename(archivo)}`);
    console.log('='.repeat(60));

    await client.query(sql);

    console.log(`✓ Migración completada exitosamente\n`);
  } catch (error) {
    console.error(`❌ ERROR:`, error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function ejecutarBackupYMigraciones() {
  console.log('='.repeat(60));
  console.log('REFACTORIZACIÓN DE NOMBRES - EJECUCIÓN HASTA PAUSA');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Paso 0: Backup/Snapshot
    console.log('PASO 0: SNAPSHOT DEL ESTADO ACTUAL');
    await ejecutarMigracion('00_crear_backup_manual.sql');

    const continuar = true; // En producción, aquí iría un prompt
    if (!continuar) {
      console.log('Abortado por el usuario.');
      return;
    }

    // Fase 1A: personas - Agregar nombres
    console.log('\nFASE 1A: personas - Agregar columna "nombres"');
    await ejecutarMigracion('01_personas_fase_A_agregar_nombres_SOLO_MIGRACION.sql');

    // Fase 1B: personas - nombre_completo
    console.log('\nFASE 1B: personas - Columna generada "nombre_completo"');
    await ejecutarMigracion('02_personas_fase_B_nombre_completo_SOLO_MIGRACION.sql');

    // Fase 2A: solicitudes_datos_personales - Agregar nombres
    console.log('\nFASE 2A: solicitudes_datos_personales - Agregar "nombres"');
    await ejecutarMigracion('03_solicitudes_datos_personales_fase_A_SOLO_MIGRACION.sql');

    // Fase 2B: solicitudes_datos_personales - nombre_completo
    console.log('\nFASE 2B: solicitudes_datos_personales - Columna "nombre_completo"');
    await ejecutarMigracion('04_solicitudes_datos_personales_fase_B_SOLO_MIGRACION.sql');

    // Fase 3: Redefinir vista
    console.log('\nFASE 3: Redefinir vista solicitudes_completo');
    await ejecutarMigracion('05_redefinir_vista_solicitudes_completo.sql');

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRACIONES EJECUTADAS HASTA PAUSA');
    console.log('='.repeat(60));
    console.log('');
    console.log('⏸️  PAUSA - NO SE HAN ELIMINADO COLUMNAS VIEJAS');
    console.log('');
    console.log('Ejecuta verificacion_datos_migrados.sql para revisar');
    console.log('');

  } catch (error) {
    console.error('\n❌ LA MIGRACIÓN FALLÓ');
    console.error('No se realizaron cambios destructivos.');
    process.exit(1);
  }
}

// Ejecutar
ejecutarBackupYMigraciones();
