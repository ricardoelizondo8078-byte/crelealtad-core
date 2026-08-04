import { query, closePool, DATA_PATHS, MIGRATION_CONFIG, logger } from './config';
import { leerJSON } from './utils';

async function migrateIntegrantes() {
  logger.info('=== FASE 7: MIGRACIÓN DE INTEGRANTES ===');

  try {
    const personasClean = leerJSON(`${DATA_PATHS.staging}/personas_clean.json`);
    const mapeoPersonas = leerJSON(`${DATA_PATHS.mapeo}/personas_curp_to_uuid.json`);
    const mapeoGrupos = leerJSON(`${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json`);
    const mapeoExpedientes = leerJSON(`${DATA_PATHS.mapeo}/expedientes_grupo_to_uuid.json`);

    logger.info(`Integrantes a migrar: ${personasClean.length}`);

    let insertados = 0;
    let saltados = 0;
    let errores = 0;

    const batchSize = MIGRATION_CONFIG.batchSize;

    for (let i = 0; i < personasClean.length; i += batchSize) {
      const batch = personasClean.slice(i, i + batchSize);

      for (const integrante of batch) {
        try {
          // Buscar persona_id
          const personaId = mapeoPersonas[integrante.curp];
          if (!personaId) {
            logger.warn(`Persona no encontrada para CURP: ${integrante.curp}`);
            errores++;
            continue;
          }

          // Buscar expediente_id a través del grupo
          const grupoId = mapeoGrupos[integrante.grupo];
          if (!grupoId) {
            logger.warn(`Grupo no encontrado: ${integrante.grupo}`);
            errores++;
            continue;
          }

          const expedienteId = mapeoExpedientes[grupoId];
          if (!expedienteId) {
            logger.warn(`Expediente no encontrado para grupo: ${integrante.grupo}`);
            errores++;
            continue;
          }

          // Verificar si ya existe
          const existente = await query(
            'SELECT id FROM integrantes WHERE persona_id = $1 AND expediente_id = $2',
            [personaId, expedienteId]
          );

          if (existente.rows.length > 0) {
            saltados++;
            continue;
          }

          // Insertar integrante
          await query(
            `INSERT INTO integrantes (
              persona_id, expediente_id, created_at, updated_at
            ) VALUES ($1, $2, NOW(), NOW())`,
            [personaId, expedienteId]
          );

          insertados++;

        } catch (error: any) {
          logger.error(`Error con integrante CURP ${integrante.curp}:`, error.message);
          errores++;
        }
      }

      logger.info(`Progreso: ${Math.min(i + batchSize, personasClean.length)}/${personasClean.length}`);
    }

    logger.success('=== MIGRACIÓN DE INTEGRANTES COMPLETADA ===');
    logger.info(`Integrantes insertados: ${insertados}`);
    logger.info(`Integrantes saltados: ${saltados}`);
    logger.info(`Errores: ${errores}`);

  } catch (error) {
    logger.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migrateIntegrantes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
