import { query, closePool, DATA_PATHS, MIGRATION_CONFIG, logger } from './config';
import { leerJSON, guardarJSON } from './utils';

async function migratePersonas() {
  logger.info('=== FASE 5: MIGRACIÓN DE PERSONAS ===');

  try {
    const personasClean = leerJSON(`${DATA_PATHS.staging}/personas_clean.json`);

    // Deduplicar por CURP
    const personasMap = new Map();
    personasClean.forEach((p: any) => {
      if (!personasMap.has(p.curp)) {
        personasMap.set(p.curp, p);
      }
    });

    const personasUnicas = Array.from(personasMap.values());

    logger.info(`Personas totales: ${personasClean.length}`);
    logger.info(`Personas únicas (por CURP): ${personasUnicas.length}`);

    const mapeoPersonas: Record<string, string> = {};
    let insertadas = 0;
    let saltadas = 0;
    const batchSize = MIGRATION_CONFIG.batchSize;

    // Insertar en lotes
    for (let i = 0; i < personasUnicas.length; i += batchSize) {
      const batch = personasUnicas.slice(i, i + batchSize);

      for (const persona of batch) {
        try {
          // Verificar si ya existe
          const existente = await query(
            'SELECT id FROM personas WHERE curp = $1',
            [persona.curp]
          );

          if (existente.rows.length > 0) {
            mapeoPersonas[persona.curp] = existente.rows[0].id;
            saltadas++;
            continue;
          }

          // Insertar
          const result = await query(
            `INSERT INTO personas (
              curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat,
              telefono, direccion_completa, monto_solicitado, fecha_nac, genero,
              estado, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING id`,
            [
              persona.curp,
              persona.primer_nombre,
              persona.segundo_nombre,
              persona.apellido_pat,
              persona.apellido_mat,
              persona.telefono,
              persona.direccion_completa,
              persona.monto_solicitado,
              persona.fecha_nac,
              persona.genero,
              'ACTIVA',
            ]
          );

          mapeoPersonas[persona.curp] = result.rows[0].id;
          insertadas++;

        } catch (error: any) {
          logger.error(`Error con CURP ${persona.curp}:`, error.message);
        }
      }

      logger.info(`Progreso: ${Math.min(i + batchSize, personasUnicas.length)}/${personasUnicas.length}`);
    }

    guardarJSON(`${DATA_PATHS.mapeo}/personas_curp_to_uuid.json`, mapeoPersonas);

    logger.success('=== MIGRACIÓN DE PERSONAS COMPLETADA ===');
    logger.info(`Personas insertadas: ${insertadas}`);
    logger.info(`Personas saltadas: ${saltadas}`);
    logger.info(`Total en mapeo: ${Object.keys(mapeoPersonas).length}`);

  } catch (error) {
    logger.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migratePersonas()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
