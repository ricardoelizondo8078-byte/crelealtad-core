import * as fs from 'fs';
import { DATA_PATHS, logger } from './config';
import { leerJSON, getTimestamp } from './utils';

async function generateReport() {
  logger.info('=== FASE 11: GENERACIÓN DE REPORTE ===');

  try {
    const validacionFinal = leerJSON(`${DATA_PATHS.logs}/validacion_final.json`);
    const erroresLimpieza = fs.existsSync(`${DATA_PATHS.logs}/errores_limpieza.json`)
      ? leerJSON(`${DATA_PATHS.logs}/errores_limpieza.json`)
      : [];

    const timestamp = getTimestamp();
    const reportPath = `${DATA_PATHS.logs}/REPORTE_MIGRACION_${timestamp}.md`;

    let report = `# REPORTE DE MIGRACIÓN - CRELEALTAD\n\n`;
    report += `**Fecha**: ${new Date().toISOString().split('T')[0]}\n`;
    report += `**Hora**: ${new Date().toTimeString().split(' ')[0]}\n\n`;

    report += `---\n\n`;

    // RESUMEN
    report += `## 📊 RESUMEN EJECUTIVO\n\n`;

    const totalErrores = validacionFinal.errores.length;
    const totalAdvertencias = validacionFinal.advertencias.length;

    if (totalErrores === 0) {
      report += `✅ **MIGRACIÓN EXITOSA**\n\n`;
    } else {
      report += `⛔ **MIGRACIÓN CON ERRORES**\n\n`;
    }

    report += `- Errores críticos: ${totalErrores}\n`;
    report += `- Advertencias: ${totalAdvertencias}\n`;
    report += `- Errores de limpieza: ${erroresLimpieza.length}\n\n`;

    // DATOS MIGRADOS
    report += `---\n\n`;
    report += `## 📈 DATOS MIGRADOS\n\n`;
    report += `| Tabla | Cantidad |\n`;
    report += `|-------|----------|\n`;

    for (const [tabla, cantidad] of Object.entries(validacionFinal.tablas)) {
      report += `| ${tabla} | ${cantidad} |\n`;
    }

    report += `\n`;

    // COMPARACIÓN CON ESPERADO
    report += `---\n\n`;
    report += `## 🎯 COMPARACIÓN CON VALORES ESPERADOS\n\n`;

    const esperado: Record<string, number> = {
      personas: 8300,
      grupos: 500,
      expedientes: 500,
      integrantes: 8407,
      tesoreras: 6695,
    };

    report += `| Tabla | Esperado | Obtenido | Diferencia | % |\n`;
    report += `|-------|----------|----------|------------|---|\n`;

    for (const [tabla, valorEsperado] of Object.entries(esperado)) {
      const valorReal = validacionFinal.tablas[tabla] || 0;
      const diferencia = valorReal - valorEsperado;
      const pct = ((diferencia / valorEsperado) * 100).toFixed(2);
      const icono = Math.abs(diferencia) < valorEsperado * 0.05 ? '✅' : '⚠️';

      report += `| ${tabla} | ${valorEsperado} | ${valorReal} | ${diferencia > 0 ? '+' : ''}${diferencia} | ${pct}% ${icono} |\n`;
    }

    report += `\n`;

    // INTEGRIDAD REFERENCIAL
    report += `---\n\n`;
    report += `## 🔗 INTEGRIDAD REFERENCIAL\n\n`;

    if (validacionFinal.integridad.integrantes_sin_persona === 0) {
      report += `✅ Todos los integrantes tienen persona\n`;
    } else {
      report += `⛔ ${validacionFinal.integridad.integrantes_sin_persona} integrantes sin persona\n`;
    }

    if (validacionFinal.integridad.integrantes_sin_expediente === 0) {
      report += `✅ Todos los integrantes tienen expediente\n`;
    } else {
      report += `⛔ ${validacionFinal.integridad.integrantes_sin_expediente} integrantes sin expediente\n`;
    }

    if (validacionFinal.integridad.expedientes_sin_grupo === 0) {
      report += `✅ Todos los expedientes tienen grupo\n`;
    } else {
      report += `⛔ ${validacionFinal.integridad.expedientes_sin_grupo} expedientes sin grupo\n`;
    }

    report += `\n`;

    // ERRORES
    if (validacionFinal.errores.length > 0) {
      report += `---\n\n`;
      report += `## ⛔ ERRORES CRÍTICOS\n\n`;

      validacionFinal.errores.forEach((error: string) => {
        report += `- ${error}\n`;
      });

      report += `\n`;
    }

    // ADVERTENCIAS
    if (validacionFinal.advertencias.length > 0) {
      report += `---\n\n`;
      report += `## ⚠️ ADVERTENCIAS\n\n`;

      validacionFinal.advertencias.forEach((adv: string) => {
        report += `- ${adv}\n`;
      });

      report += `\n`;
    }

    // ERRORES DE LIMPIEZA
    if (erroresLimpieza.length > 0) {
      report += `---\n\n`;
      report += `## 📝 ERRORES DE LIMPIEZA\n\n`;

      const errorPorTipo: Record<string, number> = {};
      erroresLimpieza.forEach((e: any) => {
        errorPorTipo[e.error] = (errorPorTipo[e.error] || 0) + 1;
      });

      report += `| Tipo de Error | Cantidad |\n`;
      report += `|---------------|----------|\n`;

      for (const [tipo, cantidad] of Object.entries(errorPorTipo)) {
        report += `| ${tipo} | ${cantidad} |\n`;
      }

      report += `\n`;
      report += `Ver detalles en: \`${DATA_PATHS.logs}/errores_limpieza.json\`\n\n`;
    }

    // ARCHIVOS GENERADOS
    report += `---\n\n`;
    report += `## 📁 ARCHIVOS GENERADOS\n\n`;
    report += `### Datos staging:\n`;
    report += `- ${DATA_PATHS.staging}/integrantes_raw.json\n`;
    report += `- ${DATA_PATHS.staging}/personas_clean.json\n`;
    report += `- ${DATA_PATHS.staging}/grupos_clean.json\n\n`;

    report += `### Mapeos:\n`;
    report += `- ${DATA_PATHS.mapeo}/grupos_legacy_to_uuid.json\n`;
    report += `- ${DATA_PATHS.mapeo}/personas_curp_to_uuid.json\n`;
    report += `- ${DATA_PATHS.mapeo}/expedientes_grupo_to_uuid.json\n\n`;

    report += `### Logs:\n`;
    report += `- ${DATA_PATHS.logs}/errores_limpieza.json\n`;
    report += `- ${DATA_PATHS.logs}/validacion_final.json\n`;
    report += `- ${reportPath}\n\n`;

    // PRÓXIMOS PASOS
    report += `---\n\n`;
    report += `## 🚀 PRÓXIMOS PASOS\n\n`;

    if (totalErrores > 0) {
      report += `1. ⛔ **REVISAR ERRORES CRÍTICOS** antes de continuar\n`;
      report += `2. Corregir integridad referencial\n`;
      report += `3. Re-ejecutar validación: \`npm run migration:validate-all\`\n\n`;
    } else {
      report += `1. ✅ Revisar advertencias (si las hay)\n`;
      report += `2. ✅ Verificar datos en la aplicación\n`;
      report += `3. ✅ Limpiar archivos staging (opcional)\n`;
      report += `4. ✅ Migración COMPLETA\n\n`;
    }

    // Escribir reporte
    fs.writeFileSync(reportPath, report, 'utf-8');

    logger.success('=== REPORTE GENERADO ===');
    logger.info(`Archivo: ${reportPath}`);
    logger.info('');
    logger.info('RESUMEN:');
    logger.info(`  Errores: ${totalErrores}`);
    logger.info(`  Advertencias: ${totalAdvertencias}`);
    logger.info(`  Personas: ${validacionFinal.tablas.personas}`);
    logger.info(`  Grupos: ${validacionFinal.tablas.grupos}`);
    logger.info(`  Integrantes: ${validacionFinal.tablas.integrantes}`);
    logger.info(`  Tesoreras: ${validacionFinal.tablas.tesoreras}`);

  } catch (error) {
    logger.error('Error generando reporte:', error);
    throw error;
  }
}

generateReport()
  .then(() => {
    logger.success('Script completado exitosamente');
    process.exit(0);
  })
  .catch(() => process.exit(1));
