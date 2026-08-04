import { query, closePool, DATA_PATHS, logger } from './config';
import { leerJSON, convertirMonto, excelSerialToDate } from './utils';

async function migrateCreditos() {
  logger.info('=== FASE 9: MIGRACIÓN DE CRÉDITOS (OPCIONAL) ===');

  try {
    const creditosRaw = leerJSON(`${DATA_PATHS.staging}/creditos_raw.json`);
    const mapeoGrupos = leerJSON(`${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json`);
    const mapeoExpedientes = leerJSON(`${DATA_PATHS.mapeo}/expedientes_grupo_to_uuid.json`);

    logger.info(`Créditos a migrar: ${creditosRaw.length}`);

    let insertados = 0;
    let saltados = 0;
    let errores = 0;

    for (const credito of creditosRaw) {
      try {
        const nombreGrupo = credito['NOMBRE GRUPO']?.trim().toUpperCase();

        if (!nombreGrupo) {
          errores++;
          continue;
        }

        const grupoId = mapeoGrupos[nombreGrupo];
        if (!grupoId) {
          logger.warn(`Grupo no encontrado: ${nombreGrupo}`);
          errores++;
          continue;
        }

        const expedienteId = mapeoExpedientes[grupoId];
        if (!expedienteId) {
          errores++;
          continue;
        }

        // Verificar si ya existe
        const existente = await query(
          'SELECT id FROM creditos WHERE expediente_id = $1',
          [expedienteId]
        );

        if (existente.rows.length > 0) {
          saltados++;
          continue;
        }

        // Convertir fechas de Excel
        const fechaDesembolso = credito['FECHA DE DESEMBOLSO']
          ? excelSerialToDate(credito['FECHA DE DESEMBOLSO'])
          : null;

        const fechaVencimiento = credito['FECHA VENCIMIENTO']
          ? excelSerialToDate(credito['FECHA VENCIMIENTO'])
          : null;

        // Insertar crédito
        await query(
          `INSERT INTO creditos (
            expediente_id, monto_prestamo, monto_total, tasa, plazo_semanas,
            pago_semanal, fecha_desembolso, fecha_vencimiento,
            semana_desembolso, semana_vencimiento,
            retencion_inicial, costo_apertura,
            total_pagado, saldo_pendiente, estado,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
          [
            expedienteId,
            convertirMonto(credito.PRESTAMO) || 0,
            convertirMonto(credito['TOTAL DE LA CUENTA']) || 0,
            credito.TASA || 0,
            credito.PLAZO || 0,
            convertirMonto(credito['PAGO MINIMO']) || 0,
            fechaDesembolso,
            fechaVencimiento,
            credito['SEMANA DESEMBOLSO'],
            credito['SEM VENCIMIENTO'],
            convertirMonto(credito['RETENCION INICIAL']) || 0,
            convertirMonto(credito.APERTURA) || 0,
            convertirMonto(credito['TOTAL PAGADO']) || 0,
            convertirMonto(credito['SALDO X LIQUIDAR']) || 0,
            'VIGENTE',
          ]
        );

        insertados++;

        if (insertados % 50 === 0) {
          logger.info(`Progreso: ${insertados}/${creditosRaw.length}`);
        }

      } catch (error: any) {
        logger.error(`Error con crédito:`, error.message);
        errores++;
      }
    }

    logger.success('=== MIGRACIÓN DE CRÉDITOS COMPLETADA ===');
    logger.info(`Créditos insertados: ${insertados}`);
    logger.info(`Créditos saltados: ${saltados}`);
    logger.info(`Errores: ${errores}`);

  } catch (error) {
    logger.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migrateCreditos()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
