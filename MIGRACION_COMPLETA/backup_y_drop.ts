import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

async function backupYDrop() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PASO 1: BACKUP DE TESORERAS');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Crear tabla de backup
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_tesoreras_20260802 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        integrante_id UUID,
        persona_id UUID,
        expediente_id UUID,
        curp VARCHAR(18),
        nombre_completo VARCHAR(200),
        grupo_nombre VARCHAR,
        telefono VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla backup_tesoreras_20260802 creada');

    // Insertar datos de tesoreras
    const insertResult = await pool.query(`
      INSERT INTO backup_tesoreras_20260802 (
        integrante_id, persona_id, expediente_id, curp, nombre_completo, grupo_nombre, telefono
      )
      SELECT
        i.id as integrante_id,
        i.persona_id,
        i.expediente_id,
        p.curp,
        CONCAT(p.primer_nombre, ' ', COALESCE(p.segundo_nombre, ''), ' ', p.apellido_pat, ' ', COALESCE(p.apellido_mat, '')) as nombre_completo,
        g.nombre as grupo_nombre,
        p.telefono
      FROM integrantes i
      JOIN personas p ON p.id = i.persona_id
      JOIN expedientes e ON e.id = i.expediente_id
      JOIN grupos g ON g.id = e.grupo_id
      WHERE i.es_tesorera = TRUE
    `);

    console.log(`✅ Backup completado: ${insertResult.rowCount} tesoreras guardadas`);

    // Verificar
    const count = await pool.query('SELECT COUNT(*) FROM backup_tesoreras_20260802');
    console.log(`✅ Verificado: ${count.rows[0].count} registros en backup\n`);

    // Mostrar muestra
    const sample = await pool.query('SELECT curp, nombre_completo, grupo_nombre FROM backup_tesoreras_20260802 LIMIT 5');
    console.log('📋 Muestra de tesoreras guardadas:');
    sample.rows.forEach(row => {
      console.log(`   - ${row.nombre_completo} (${row.curp}) - Grupo: ${row.grupo_nombre}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  PASO 2: ELIMINAR COLUMNAS EXTRA');
    console.log('═══════════════════════════════════════════════════════\n');

    // DROP personas.direccion_completa
    console.log('🗑️  Eliminando personas.direccion_completa...');
    await pool.query('ALTER TABLE personas DROP COLUMN IF EXISTS direccion_completa');
    console.log('✅ personas.direccion_completa eliminada');

    // DROP integrantes.es_tesorera
    console.log('🗑️  Eliminando integrantes.es_tesorera...');
    await pool.query('ALTER TABLE integrantes DROP COLUMN IF EXISTS es_tesorera');
    console.log('✅ integrantes.es_tesorera eliminada');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  PASO 3: VERIFICACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verificar personas
    const personasColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'personas' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('✅ Columnas actuales en PERSONAS:');
    console.log('   ' + personasColumns.rows.map(r => r.column_name).join(', '));

    // Verificar integrantes
    const integrantesColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'integrantes' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('\n✅ Columnas actuales en INTEGRANTES:');
    console.log('   ' + integrantesColumns.rows.map(r => r.column_name).join(', '));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 RESUMEN:');
    console.log(`   ✅ Backup de tesoreras: ${count.rows[0].count} registros`);
    console.log('   ✅ personas.direccion_completa: ELIMINADA');
    console.log('   ✅ integrantes.es_tesorera: ELIMINADA');
    console.log('\n📂 Backup guardado en tabla: backup_tesoreras_20260802');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

backupYDrop()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
