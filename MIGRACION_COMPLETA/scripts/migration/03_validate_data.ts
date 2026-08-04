import { DATA_PATHS, logger } from './config';
import { leerJSON, guardarJSON } from './utils';

async function validateData() {
  logger.info('=== FASE 3: VALIDACIÓN DE DATOS ===');

  try {
    const personasClean = leerJSON(`${DATA_PATHS.staging}/personas_clean.json`);
    const gruposClean = leerJSON(`${DATA_PATHS.staging}/grupos_clean.json`);

    const validaciones: any[] = [];
    let erroresCriticos = 0;
    let advertencias = 0;

    // ========================================
    // VALIDAR PERSONAS
    // ========================================
    logger.info('Validando personas...');

    const curpsVistos = new Set<string>();
    const curpsDuplicados = new Set<string>();

    personasClean.forEach((p: any, idx: number) => {
      // CURP duplicado
      if (curpsVistos.has(p.curp)) {
        curpsDuplicados.add(p.curp);
        advertencias++;
        validaciones.push({
          tipo: 'ADVERTENCIA',
          mensaje: 'CURP duplicado',
          curp: p.curp,
          registro: idx,
        });
      }
      curpsVistos.add(p.curp);

      // Campos requeridos
      if (!p.primer_nombre || !p.apellido_pat) {
        advertencias++;
        validaciones.push({
          tipo: 'ADVERTENCIA',
          mensaje: 'Falta nombre o apellido',
          curp: p.curp,
          registro: idx,
        });
      }

      // Fecha de nacimiento válida
      if (p.fecha_nac) {
        const fecha = new Date(p.fecha_nac);
        const ahora = new Date();
        const hace150años = new Date(ahora.getFullYear() - 150, 0, 1);

        if (fecha > ahora || fecha < hace150años) {
          advertencias++;
          validaciones.push({
            tipo: 'ADVERTENCIA',
            mensaje: 'Fecha de nacimiento fuera de rango',
            curp: p.curp,
            fecha_nac: p.fecha_nac,
            registro: idx,
          });
        }
      }

      // Monto válido
      if (p.monto_solicitado !== null && p.monto_solicitado <= 0) {
        advertencias++;
        validaciones.push({
          tipo: 'ADVERTENCIA',
          mensaje: 'Monto inválido',
          curp: p.curp,
          monto: p.monto_solicitado,
          registro: idx,
        });
      }
    });

    logger.info(`✓ Personas validadas: ${personasClean.length}`);
    logger.warn(`⚠ CURPs duplicados: ${curpsDuplicados.size}`);

    // ========================================
    // VALIDAR GRUPOS
    // ========================================
    logger.info('Validando grupos...');

    const gruposVistos = new Set<string>();
    const gruposDuplicados: string[] = [];

    gruposClean.forEach((g: any, idx: number) => {
      if (!g.nombre) {
        erroresCriticos++;
        validaciones.push({
          tipo: 'ERROR',
          mensaje: 'Grupo sin nombre',
          registro: idx,
        });
      }

      if (gruposVistos.has(g.nombre)) {
        gruposDuplicados.push(g.nombre);
        advertencias++;
      }
      gruposVistos.add(g.nombre);
    });

    logger.info(`✓ Grupos validados: ${gruposClean.length}`);
    logger.warn(`⚠ Grupos duplicados: ${gruposDuplicados.length}`);

    // ========================================
    // RESUMEN
    // ========================================
    guardarJSON(`${DATA_PATHS.logs}/validaciones.json`, validaciones);

    logger.success('=== VALIDACIÓN COMPLETADA ===');
    logger.info(`Errores críticos: ${erroresCriticos}`);
    logger.info(`Advertencias: ${advertencias}`);
    logger.info('');

    if (erroresCriticos > 0) {
      logger.error(`⛔ HAY ${erroresCriticos} ERRORES CRÍTICOS`);
      logger.error('NO SE PUEDE CONTINUAR CON LA MIGRACIÓN');
      logger.error('Revisar archivo: ' + DATA_PATHS.logs + '/validaciones.json');
      process.exit(1);
    }

    if (advertencias > 0) {
      logger.warn(`⚠ HAY ${advertencias} ADVERTENCIAS`);
      logger.warn('Se puede continuar pero revisar el archivo de validaciones');
    } else {
      logger.success('✓ DATOS VÁLIDOS - SE PUEDE CONTINUAR CON MIGRACIÓN');
    }

  } catch (error) {
    logger.error('Error en validación:', error);
    throw error;
  }
}

// Ejecutar
validateData()
  .then(() => {
    logger.success('Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script falló:', error);
    process.exit(1);
  });
