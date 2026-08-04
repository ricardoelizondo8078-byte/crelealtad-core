import { DATA_PATHS, logger } from './config';
import {
  leerJSON,
  guardarJSON,
  parsearNombre,
  extraerDatosCURP,
  limpiarTelefono,
  convertirMonto,
  normalizarGrupo,
  mapearEstadoPapeleria,
  validarCURP,
} from './utils';

interface PersonaClean {
  curp: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  apellido_pat: string | null;
  apellido_mat: string | null;
  telefono: string | null;
  direccion_completa: string | null;
  monto_solicitado: number | null;
  fecha_nac: string | null;
  genero: string | null;
  grupo: string;
  ciclo: number | null;
  asesora: string | null;
  papeleria_completa: string;
}

async function cleanAndTransform() {
  logger.info('=== FASE 2: LIMPIEZA Y TRANSFORMACIÓN ===');

  try {
    // Leer datos raw
    const integrantesRaw = leerJSON(`${DATA_PATHS.staging}/integrantes_raw.json`);
    const gruposRaw = leerJSON(`${DATA_PATHS.staging}/grupos_raw.json`);

    logger.info(`Integrantes raw: ${integrantesRaw.length}`);
    logger.info(`Grupos raw: ${gruposRaw.length}`);

    // ========================================
    // LIMPIAR PERSONAS
    // ========================================
    logger.info('Limpiando datos de personas...');

    const personasClean: PersonaClean[] = [];
    const errores: any[] = [];
    let sinTelefono = 0;
    let curpInvalido = 0;

    for (let i = 0; i < integrantesRaw.length; i++) {
      const row = integrantesRaw[i];

      try {
        // Validar CURP
        if (!row.CURP || !validarCURP(row.CURP)) {
          curpInvalido++;
          errores.push({
            fila: i + 2, // +2 porque Excel empieza en 1 y hay encabezados
            error: 'CURP_INVALIDO',
            curp: row.CURP,
            nombre: row.NOMBRE,
          });
          continue; // SKIP este registro
        }

        // Parsear nombre
        const nombreParseado = parsearNombre(row.NOMBRE);

        // Extraer datos de CURP
        const datosCURP = extraerDatosCURP(row.CURP);

        // Limpiar teléfono
        const telefonoLimpio = limpiarTelefono(row.TELEFONO);
        if (!telefonoLimpio) {
          sinTelefono++;
        }

        // Convertir monto
        const monto = convertirMonto(row.MONTO);

        // Normalizar grupo
        const grupoNormalizado = normalizarGrupo(row.GRUPO);

        // Mapear estado papelería
        const estadoPapeleria = mapearEstadoPapeleria(row['PAPELERIA COMP.']);

        personasClean.push({
          curp: row.CURP.toUpperCase().trim(),
          primer_nombre: nombreParseado.primer_nombre,
          segundo_nombre: nombreParseado.segundo_nombre,
          apellido_pat: nombreParseado.apellido_pat,
          apellido_mat: nombreParseado.apellido_mat,
          telefono: telefonoLimpio,
          direccion_completa: row.DIRECCION || null,
          monto_solicitado: monto,
          fecha_nac: datosCURP.fecha_nac,
          genero: datosCURP.genero,
          grupo: grupoNormalizado,
          ciclo: row.CICLO || null,
          asesora: row.LUPITA?.trim() || null,
          papeleria_completa: estadoPapeleria,
        });
      } catch (error: any) {
        errores.push({
          fila: i + 2,
          error: 'ERROR_PROCESAMIENTO',
          mensaje: error.message,
          datos: row,
        });
      }
    }

    logger.info(`✓ Personas limpiadas: ${personasClean.length}`);
    logger.warn(`⚠ CURPs inválidos (SKIP): ${curpInvalido}`);
    logger.warn(`⚠ Sin teléfono: ${sinTelefono}`);
    logger.warn(`⚠ Errores totales: ${errores.length}`);

    // ========================================
    // LIMPIAR GRUPOS
    // ========================================
    logger.info('Limpiando datos de grupos...');

    const gruposClean = gruposRaw.map((g: any) => ({
      nombre: normalizarGrupo(g.nombre),
    }));

    logger.info(`✓ Grupos limpiados: ${gruposClean.length}`);

    // ========================================
    // GUARDAR DATOS CLEAN
    // ========================================
    logger.info('Guardando datos limpios...');

    guardarJSON(`${DATA_PATHS.staging}/personas_clean.json`, personasClean);
    guardarJSON(`${DATA_PATHS.staging}/grupos_clean.json`, gruposClean);
    guardarJSON(`${DATA_PATHS.logs}/errores_limpieza.json`, errores);

    // ========================================
    // ESTADÍSTICAS
    // ========================================
    logger.success('=== LIMPIEZA COMPLETADA ===');
    logger.info(`Personas procesadas: ${personasClean.length} / ${integrantesRaw.length}`);
    logger.info(`Tasa de éxito: ${((personasClean.length / integrantesRaw.length) * 100).toFixed(2)}%`);
    logger.info('');
    logger.info('Advertencias:');
    logger.info(`  - CURPs inválidos: ${curpInvalido}`);
    logger.info(`  - Sin teléfono: ${sinTelefono}`);
    logger.info(`  - Errores de procesamiento: ${errores.length}`);
    logger.info('');
    logger.info('Archivos generados:');
    logger.info(`  - ${DATA_PATHS.staging}/personas_clean.json`);
    logger.info(`  - ${DATA_PATHS.staging}/grupos_clean.json`);
    logger.info(`  - ${DATA_PATHS.logs}/errores_limpieza.json`);

  } catch (error) {
    logger.error('Error en limpieza:', error);
    throw error;
  }
}

// Ejecutar
cleanAndTransform()
  .then(() => {
    logger.success('Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script falló:', error);
    process.exit(1);
  });
