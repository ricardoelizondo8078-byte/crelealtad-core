import { query, closePool, DATA_PATHS, logger } from './config';
import { leerJSON } from './utils';

async function markTesoreras() {
  logger.info('=== FASE 8: MARCAR TESORERAS ===');

  try {
    const tesorerasRaw = leerJSON(`${DATA_PATHS.staging}/tesoreras_raw.json`);
    const mapeoPersonas = leerJSON(`${DATA_PATHS.mapeo}/personas_curp_to_uuid.json`);

    logger.info(`Tesoreras a marcar: ${tesorerasRaw.length}`);

    let marcadas = 0;
    let noEncontradas = 0;

    for (const tesorera of tesorerasRaw) {
      try {
        const curp = tesorera.curp?.toUpperCase().trim();

        if (!curp) {
          noEncontradas++;
          continue;
        }

        const personaId = mapeoPersonas[curp];

        if (!personaId) {
          logger.warn(`Persona no encontrada para CURP: ${curp}`);
          noEncontradas++;
          continue;
        }

        // Actualizar integrantes con es_tesorera = TRUE
        const result = await query(
          `UPDATE integrantes
           SET es_tesorera = TRUE
           WHERE persona_id = $1`,
          [personaId]
        );

        if (result.rowCount && result.rowCount > 0) {
          marcadas += result.rowCount;
        } else {
          noEncontradas++;
        }

      } catch (error: any) {
        logger.error(`Error con tesorera CURP ${tesorera.curp}:`, error.message);
      }
    }

    logger.success('=== MARCADO DE TESORERAS COMPLETADO ===');
    logger.info(`Integrantes marcados como tesoreras: ${marcadas}`);
    logger.info(`No encontrados: ${noEncontradas}`);

    // Verificar
    const count = await query('SELECT COUNT(*) as total FROM integrantes WHERE es_tesorera = TRUE');
    logger.info(`Total tesoreras en BD: ${count.rows[0].total}`);

  } catch (error) {
    logger.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

markTesoreras()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
