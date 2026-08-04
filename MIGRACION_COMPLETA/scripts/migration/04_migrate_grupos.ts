import { query, closePool, DATA_PATHS, logger } from './config';
import { leerJSON, guardarJSON } from './utils';

async function migrateGrupos() {
  logger.info('=== FASE 4: MIGRACIÓN DE GRUPOS ===');

  try {
    const gruposClean = leerJSON(`${DATA_PATHS.staging}/grupos_clean.json`);

    logger.info(`Grupos a migrar: ${gruposClean.length}`);

    // Verificar conexión
    const testQuery = await query('SELECT NOW()');
    logger.info('Conexión a BD exitosa ✓');

    // ========================================
    // INSERTAR GRUPOS
    // ========================================
    logger.info('Insertando grupos en BD...');

    const mapeoGrupos: Record<string, string> = {};
    let insertados = 0;
    let saltados = 0;

    for (const grupo of gruposClean) {
      try {
        // Verificar si ya existe
        const existente = await query(
          'SELECT id FROM grupos WHERE nombre = $1 AND deleted_at IS NULL',
          [grupo.nombre]
        );

        if (existente.rows.length > 0) {
          // Ya existe, usar el existente
          mapeoGrupos[grupo.nombre] = existente.rows[0].id;
          saltados++;
          logger.info(`⊘ Grupo ya existe: ${grupo.nombre}`);
          continue;
        }

        // Insertar nuevo grupo
        const result = await query(
          `INSERT INTO grupos (nombre, estado, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [grupo.nombre, 'AUTORIZADO']
        );

        const grupoId = result.rows[0].id;
        mapeoGrupos[grupo.nombre] = grupoId;
        insertados++;

        if (insertados % 50 === 0) {
          logger.info(`  Progreso: ${insertados}/${gruposClean.length}`);
        }

      } catch (error: any) {
        logger.error(`Error insertando grupo "${grupo.nombre}":`, error.message);
        throw error;
      }
    }

    // ========================================
    // GUARDAR MAPEO
    // ========================================
    guardarJSON(`${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json`, mapeoGrupos);

    logger.success('=== MIGRACIÓN DE GRUPOS COMPLETADA ===');
    logger.info(`Grupos insertados: ${insertados}`);
    logger.info(`Grupos saltados (ya existían): ${saltados}`);
    logger.info(`Total en mapeo: ${Object.keys(mapeoGrupos).length}`);
    logger.info('');
    logger.info('Archivo generado:');
    logger.info(`  - ${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json`);

    // Verificar en BD
    const count = await query('SELECT COUNT(*) as total FROM grupos WHERE deleted_at IS NULL');
    logger.info(`Total grupos en BD: ${count.rows[0].total}`);

  } catch (error) {
    logger.error('Error en migración de grupos:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Ejecutar
migrateGrupos()
  .then(() => {
    logger.success('Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script falló:', error);
    process.exit(1);
  });
