import { query, closePool, DATA_PATHS, logger } from './config';
import { leerJSON, guardarJSON } from './utils';

async function migrateExpedientes() {
  logger.info('=== FASE 6: MIGRACIÓN DE EXPEDIENTES ===');

  try {
    const mapeoGrupos = leerJSON(`${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json`);

    logger.info(`Grupos en mapeo: ${Object.keys(mapeoGrupos).length}`);

    const mapeoExpedientes: Record<string, string> = {};
    let insertados = 0;
    let saltados = 0;

    // Crear 1 expediente por cada grupo
    for (const [nombreGrupo, grupoId] of Object.entries(mapeoGrupos)) {
      try {
        // Verificar si ya existe expediente para este grupo
        const existente = await query(
          'SELECT id FROM expedientes WHERE grupo_id = $1',
          [grupoId]
        );

        if (existente.rows.length > 0) {
          mapeoExpedientes[grupoId as string] = existente.rows[0].id;
          saltados++;
          continue;
        }

        // Insertar expediente
        const result = await query(
          `INSERT INTO expedientes (
            grupo_id, created_at, updated_at
          ) VALUES ($1, NOW(), NOW())
          RETURNING id`,
          [grupoId]
        );

        const expedienteId = result.rows[0].id;
        mapeoExpedientes[grupoId as string] = expedienteId;
        insertados++;

        if (insertados % 50 === 0) {
          logger.info(`Progreso: ${insertados}/${Object.keys(mapeoGrupos).length}`);
        }

      } catch (error: any) {
        logger.error(`Error con grupo "${nombreGrupo}":`, error.message);
      }
    }

    guardarJSON(`${DATA_PATHS.mapeo}/expedientes_grupo_to_uuid.json`, mapeoExpedientes);

    logger.success('=== MIGRACIÓN DE EXPEDIENTES COMPLETADA ===');
    logger.info(`Expedientes insertados: ${insertados}`);
    logger.info(`Expedientes saltados: ${saltados}`);

  } catch (error) {
    logger.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migrateExpedientes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
