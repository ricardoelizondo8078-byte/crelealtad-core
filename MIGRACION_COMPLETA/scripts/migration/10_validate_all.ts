import { query, closePool, DATA_PATHS, logger } from './config';
import { leerJSON, guardarJSON } from './utils';

async function validateAll() {
  logger.info('=== FASE 10: VALIDACIÓN FINAL ===');

  const resultados: any = {
    fecha: new Date().toISOString(),
    tablas: {},
    integridad: {},
    advertencias: [],
    errores: [],
  };

  try {
    // ========================================
    // CONTEOS
    // ========================================
    logger.info('Verificando conteos...');

    const tablas = ['personas', 'grupos', 'expedientes', 'integrantes', 'creditos'];

    for (const tabla of tablas) {
      const result = await query(`SELECT COUNT(*) as total FROM ${tabla}`);
      resultados.tablas[tabla] = parseInt(result.rows[0].total);
      logger.info(`  ${tabla}: ${result.rows[0].total}`);
    }

    // Tesoreras
    const tesorerasCount = await query(
      'SELECT COUNT(*) as total FROM integrantes WHERE es_tesorera = TRUE'
    );
    resultados.tablas.tesoreras = parseInt(tesorerasCount.rows[0].total);
    logger.info(`  tesoreras: ${tesorerasCount.rows[0].total}`);

    // ========================================
    // INTEGRIDAD REFERENCIAL
    // ========================================
    logger.info('');
    logger.info('Verificando integridad referencial...');

    // Integrantes sin persona
    const sinPersona = await query(`
      SELECT COUNT(*) as total
      FROM integrantes i
      LEFT JOIN personas p ON p.id = i.persona_id
      WHERE p.id IS NULL
    `);
    resultados.integridad.integrantes_sin_persona = parseInt(sinPersona.rows[0].total);

    if (parseInt(sinPersona.rows[0].total) > 0) {
      resultados.errores.push(`${sinPersona.rows[0].total} integrantes sin persona`);
      logger.error(`  ⛔ ${sinPersona.rows[0].total} integrantes sin persona`);
    } else {
      logger.info('  ✓ Todos los integrantes tienen persona');
    }

    // Integrantes sin expediente
    const sinExpediente = await query(`
      SELECT COUNT(*) as total
      FROM integrantes i
      LEFT JOIN expedientes e ON e.id = i.expediente_id
      WHERE e.id IS NULL
    `);
    resultados.integridad.integrantes_sin_expediente = parseInt(sinExpediente.rows[0].total);

    if (parseInt(sinExpediente.rows[0].total) > 0) {
      resultados.errores.push(`${sinExpediente.rows[0].total} integrantes sin expediente`);
      logger.error(`  ⛔ ${sinExpediente.rows[0].total} integrantes sin expediente`);
    } else {
      logger.info('  ✓ Todos los integrantes tienen expediente');
    }

    // Expedientes sin grupo
    const sinGrupo = await query(`
      SELECT COUNT(*) as total
      FROM expedientes e
      LEFT JOIN grupos g ON g.id = e.grupo_id
      WHERE g.id IS NULL
    `);
    resultados.integridad.expedientes_sin_grupo = parseInt(sinGrupo.rows[0].total);

    if (parseInt(sinGrupo.rows[0].total) > 0) {
      resultados.errores.push(`${sinGrupo.rows[0].total} expedientes sin grupo`);
      logger.error(`  ⛔ ${sinGrupo.rows[0].total} expedientes sin grupo`);
    } else {
      logger.info('  ✓ Todos los expedientes tienen grupo');
    }

    // ========================================
    // VALIDACIONES ADICIONALES
    // ========================================
    logger.info('');
    logger.info('Validaciones adicionales...');

    // Personas sin teléfono
    const sinTelefono = await query(
      'SELECT COUNT(*) as total FROM personas WHERE telefono IS NULL'
    );
    const pctSinTelefono = (parseInt(sinTelefono.rows[0].total) / resultados.tablas.personas) * 100;

    if (pctSinTelefono > 30) {
      resultados.advertencias.push(`${pctSinTelefono.toFixed(1)}% de personas sin teléfono`);
      logger.warn(`  ⚠ ${pctSinTelefono.toFixed(1)}% sin teléfono`);
    } else {
      logger.info(`  ✓ ${pctSinTelefono.toFixed(1)}% sin teléfono (aceptable)`);
    }

    // ========================================
    // COMPARAR CON ESPERADO
    // ========================================
    logger.info('');
    logger.info('Comparando con valores esperados...');

    const esperado = {
      personas: 8300,
      grupos: 500,
      expedientes: 500,
      integrantes: 8407,
      tesoreras: 6695,
    };

    for (const [tabla, valorEsperado] of Object.entries(esperado)) {
      const valorReal = resultados.tablas[tabla] || 0;
      const diferencia = valorReal - valorEsperado;
      const pctDiferencia = ((Math.abs(diferencia) / valorEsperado) * 100).toFixed(2);

      if (Math.abs(diferencia) > valorEsperado * 0.05) {
        // Más de 5% de diferencia
        resultados.advertencias.push(`${tabla}: ${pctDiferencia}% de diferencia con esperado`);
        logger.warn(`  ⚠ ${tabla}: ${valorReal} (esperado ~${valorEsperado}, diferencia: ${diferencia})`);
      } else {
        logger.info(`  ✓ ${tabla}: ${valorReal} (esperado ~${valorEsperado})`);
      }
    }

    // ========================================
    // GUARDAR REPORTE
    // ========================================
    guardarJSON(`${DATA_PATHS.logs}/validacion_final.json`, resultados);

    logger.success('');
    logger.success('=== VALIDACIÓN FINAL COMPLETADA ===');
    logger.info(`Errores críticos: ${resultados.errores.length}`);
    logger.info(`Advertencias: ${resultados.advertencias.length}`);

    if (resultados.errores.length > 0) {
      logger.error('');
      logger.error('⛔ ERRORES ENCONTRADOS:');
      resultados.errores.forEach((e: string) => logger.error(`  - ${e}`));
    }

    if (resultados.advertencias.length > 0) {
      logger.warn('');
      logger.warn('⚠ ADVERTENCIAS:');
      resultados.advertencias.forEach((a: string) => logger.warn(`  - ${a}`));
    }

    if (resultados.errores.length === 0) {
      logger.success('');
      logger.success('✅ MIGRACIÓN EXITOSA - SIN ERRORES CRÍTICOS');
    }

  } catch (error) {
    logger.error('Error en validación:', error);
    throw error;
  } finally {
    await closePool();
  }
}

validateAll()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
