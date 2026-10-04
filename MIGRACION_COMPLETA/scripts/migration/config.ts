import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as path from 'path';

dotenv.config();

// Configuración de base de datos
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'postgres',
};

// Pool de conexiones
export const pool = new Pool(dbConfig);

// Rutas de archivos Excel
export const EXCEL_PATHS = {
  integrantes: process.env.EXCEL_INTEGRANTES || path.join(__dirname, '../../BASEDATOS CRELEALTAD (1) (1).xlsx'),
  sem364: process.env.EXCEL_SEM364 || path.join(__dirname, '../../BASE DE DATOS SEM 364.xlsm'),
};

// Rutas de datos staging
export const DATA_PATHS = {
  staging: path.join(__dirname, '../../data/staging'),
  mapeo: path.join(__dirname, '../../data/mapeo'),
  logs: path.join(__dirname, '../../data/logs'),
};

// Configuración de migración
export const MIGRATION_CONFIG = {
  batchSize: parseInt(process.env.BATCH_SIZE || '500'),
  logLevel: process.env.LOG_LEVEL || 'info',
  dryRun: process.env.DRY_RUN === 'true',
};

// Helper para cerrar conexión
export async function closePool() {
  await pool.end();
}

// Helper para ejecutar queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Logger simple
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  },
};
