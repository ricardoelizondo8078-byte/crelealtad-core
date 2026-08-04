import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { EXCEL_PATHS, DATA_PATHS, logger } from './config';
import { guardarJSON } from './utils';

interface IntegranteRaw {
  NOMBRE: string;
  CURP: string;
  TELEFONO: string;
  DIRECCION: string;
  GRUPO: string;
  CICLO: number;
  MONTO: string;
  LUPITA: string;
  'PAPELERIA COMP.': string;
}

interface TesoreraRaw {
  nombre: string;
  curp: string;
  telefono: string;
  direccion: string;
  grupo: string;
  ciclo: number;
  monto: string;
  asesora: string;
  documentos: string;
}

interface CreditoRaw {
  '# GPO': string;
  CICLO: number;
  'NOMBRE GRUPO': string;
  'FECHA DE DESEMBOLSO': any;
  'SEMANA DESEMBOLSO': number;
  TASA: number;
  'RETENCION INICIAL': any;
  APERTURA: any;
  PLAZO: number;
  PRESTAMO: any;
  'TOTAL DE LA CUENTA': any;
  'SEM VENCIMIENTO': number;
  'FECHA VENCIMIENTO': any;
  'PAGO MINIMO': any;
  'TOTAL PAGADO': any;
  'SALDO X LIQUIDAR': any;
}

async function extractFromExcel() {
  logger.info('=== FASE 1: EXTRACCIÓN DE EXCEL ===');

  try {
    // Verificar que archivos existan
    if (!fs.existsSync(EXCEL_PATHS.integrantes)) {
      throw new Error(`Archivo no encontrado: ${EXCEL_PATHS.integrantes}`);
    }

    if (!fs.existsSync(EXCEL_PATHS.sem364)) {
      throw new Error(`Archivo no encontrado: ${EXCEL_PATHS.sem364}`);
    }

    logger.info('Archivos Excel encontrados ✓');

    // ========================================
    // ARCHIVO 1: BASEDATOS CRELEALTAD
    // ========================================
    logger.info('Leyendo BASEDATOS CRELEALTAD...');

    const workbook1 = XLSX.readFile(EXCEL_PATHS.integrantes);

    // Verificar hojas
    if (!workbook1.SheetNames.includes('Hoja1')) {
      throw new Error('Hoja "Hoja1" no encontrada en archivo de integrantes');
    }

    if (!workbook1.SheetNames.includes('TESORERAS')) {
      throw new Error('Hoja "TESORERAS" no encontrada en archivo de integrantes');
    }

    // Leer Hoja1 (integrantes)
    const hoja1 = XLSX.utils.sheet_to_json<IntegranteRaw>(
      workbook1.Sheets['Hoja1']
    );

    logger.info(`✓ Hoja1: ${hoja1.length} registros`);

    // Leer TESORERAS
    const tesoreras = XLSX.utils.sheet_to_json<TesoreraRaw>(
      workbook1.Sheets['TESORERAS'],
      { header: ['nombre', 'curp', 'telefono', 'direccion', 'grupo', 'ciclo', 'monto', 'asesora', 'documentos'] }
    );

    logger.info(`✓ TESORERAS: ${tesoreras.length} registros`);

    // ========================================
    // ARCHIVO 2: SEM 364
    // ========================================
    logger.info('Leyendo BASE DE DATOS SEM 364...');

    const workbook2 = XLSX.readFile(EXCEL_PATHS.sem364);

    // Verificar hoja
    if (!workbook2.SheetNames.includes('BASE DE DATOS')) {
      throw new Error('Hoja "BASE DE DATOS" no encontrada en archivo SEM 364');
    }

    // Leer desde fila 11 (row 10 en índice 0)
    const sem364Sheet = workbook2.Sheets['BASE DE DATOS'];
    const sem364Data = XLSX.utils.sheet_to_json<CreditoRaw>(sem364Sheet, {
      range: 10, // Empezar desde fila 11 (índice 10)
    });

    logger.info(`✓ SEM 364: ${sem364Data.length} registros`);

    // ========================================
    // GUARDAR DATOS RAW
    // ========================================
    logger.info('Guardando datos en staging...');

    guardarJSON(`${DATA_PATHS.staging}/integrantes_raw.json`, hoja1);
    guardarJSON(`${DATA_PATHS.staging}/tesoreras_raw.json`, tesoreras);
    guardarJSON(`${DATA_PATHS.staging}/creditos_raw.json`, sem364Data);

    // Extraer grupos únicos
    const gruposSet = new Set<string>();
    hoja1.forEach((row) => {
      if (row.GRUPO) {
        gruposSet.add(row.GRUPO.trim().toUpperCase());
      }
    });

    const grupos = Array.from(gruposSet).map((nombre) => ({ nombre }));
    guardarJSON(`${DATA_PATHS.staging}/grupos_raw.json`, grupos);

    logger.info(`✓ Grupos únicos extraídos: ${grupos.length}`);

    // ========================================
    // RESUMEN
    // ========================================
    logger.success('=== EXTRACCIÓN COMPLETADA ===');
    logger.info(`Total integrantes: ${hoja1.length}`);
    logger.info(`Total tesoreras: ${tesoreras.length}`);
    logger.info(`Total grupos: ${grupos.length}`);
    logger.info(`Total créditos (SEM 364): ${sem364Data.length}`);
    logger.info('');
    logger.info('Archivos generados:');
    logger.info(`  - ${DATA_PATHS.staging}/integrantes_raw.json`);
    logger.info(`  - ${DATA_PATHS.staging}/tesoreras_raw.json`);
    logger.info(`  - ${DATA_PATHS.staging}/grupos_raw.json`);
    logger.info(`  - ${DATA_PATHS.staging}/creditos_raw.json`);

  } catch (error) {
    logger.error('Error en extracción:', error);
    throw error;
  }
}

// Ejecutar
extractFromExcel()
  .then(() => {
    logger.success('Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script falló:', error);
    process.exit(1);
  });
