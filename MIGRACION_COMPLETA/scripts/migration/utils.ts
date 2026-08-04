import * as fs from 'fs';
import * as path from 'path';
import { logger } from './config';

/**
 * Parsear nombre completo a partes
 */
export function parsearNombre(nombreCompleto: string): {
  primer_nombre: string | null;
  segundo_nombre: string | null;
  apellido_pat: string | null;
  apellido_mat: string | null;
} {
  if (!nombreCompleto) {
    return {
      primer_nombre: null,
      segundo_nombre: null,
      apellido_pat: null,
      apellido_mat: null,
    };
  }

  const partes = nombreCompleto.trim().toUpperCase().split(/\s+/);

  if (partes.length === 2) {
    return {
      primer_nombre: partes[0],
      segundo_nombre: null,
      apellido_pat: partes[1],
      apellido_mat: null,
    };
  }

  if (partes.length === 3) {
    return {
      primer_nombre: partes[0],
      segundo_nombre: null,
      apellido_pat: partes[1],
      apellido_mat: partes[2],
    };
  }

  if (partes.length === 4) {
    return {
      primer_nombre: partes[0],
      segundo_nombre: partes[1],
      apellido_pat: partes[2],
      apellido_mat: partes[3],
    };
  }

  // Más de 4 partes
  return {
    primer_nombre: partes[0],
    segundo_nombre: partes.slice(1, -2).join(' '),
    apellido_pat: partes[partes.length - 2],
    apellido_mat: partes[partes.length - 1],
  };
}

/**
 * Extraer fecha de nacimiento y género de CURP
 */
export function extraerDatosCURP(curp: string): {
  fecha_nac: string | null;
  genero: string | null;
} {
  if (!curp || curp.length !== 18) {
    return { fecha_nac: null, genero: null };
  }

  try {
    const año = curp.substring(4, 6);
    const mes = curp.substring(6, 8);
    const dia = curp.substring(8, 10);
    const letraGenero = curp.charAt(10);

    // Determinar siglo
    const añoNum = parseInt(año);
    const añoCompleto = añoNum <= 30 ? `20${año}` : `19${año}`;

    // Validar fecha
    const fecha = new Date(`${añoCompleto}-${mes}-${dia}`);
    if (isNaN(fecha.getTime())) {
      return { fecha_nac: null, genero: null };
    }

    const genero = letraGenero === 'H' ? 'MASCULINO' : 'FEMENINO';

    return {
      fecha_nac: `${añoCompleto}-${mes}-${dia}`,
      genero,
    };
  } catch (error) {
    logger.warn(`Error extrayendo datos de CURP: ${curp}`, error);
    return { fecha_nac: null, genero: null };
  }
}

/**
 * Validar CURP
 */
export function validarCURP(curp: string): boolean {
  if (!curp || curp.length !== 18) return false;

  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  if (!regex.test(curp)) return false;

  // Validar fecha
  const mes = parseInt(curp.substring(6, 8));
  const dia = parseInt(curp.substring(8, 10));

  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;

  return true;
}

/**
 * Limpiar teléfono
 */
export function limpiarTelefono(telefono: string | number): string | null {
  if (!telefono) return null;

  const telefonoStr = telefono.toString();
  const soloDigitos = telefonoStr.replace(/\D/g, '');

  // México: 10 dígitos
  if (soloDigitos.length === 10) {
    return soloDigitos;
  }

  // Quitar prefijos internacionales
  if (soloDigitos.length === 11 && soloDigitos.startsWith('1')) {
    return soloDigitos.substring(1);
  }

  if (soloDigitos.length === 12 && soloDigitos.startsWith('52')) {
    return soloDigitos.substring(2);
  }

  // Muy corto
  if (soloDigitos.length < 10) {
    return null;
  }

  // Muy largo, tomar últimos 10
  return soloDigitos.slice(-10);
}

/**
 * Convertir monto de texto a decimal
 */
export function convertirMonto(montoTexto: string | number): number | null {
  if (!montoTexto) return null;

  let limpio: string;

  if (typeof montoTexto === 'number') {
    return montoTexto;
  }

  limpio = montoTexto
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .trim();

  const numero = parseFloat(limpio);

  if (isNaN(numero) || numero <= 0) {
    return null;
  }

  return Math.round(numero * 100) / 100;
}

/**
 * Normalizar nombre de grupo
 */
export function normalizarGrupo(nombreGrupo: string): string {
  if (!nombreGrupo) return '';

  return nombreGrupo
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/**
 * Guardar JSON
 */
export function guardarJSON(filePath: string, data: any): void {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  logger.info(`JSON guardado: ${filePath}`);
}

/**
 * Leer JSON
 */
export function leerJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Mapear estado de papelería
 */
export function mapearEstadoPapeleria(papeleria: string): string {
  if (!papeleria) return 'DOCUMENTANDO';

  const valor = papeleria.trim().toUpperCase();

  if (valor === 'SI' || valor === 'SÍ' || valor === 'S') {
    return 'DOCUMENTADO';
  }

  return 'DOCUMENTANDO';
}

/**
 * Generar timestamp para archivos
 */
export function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Convertir fecha de Excel (serial) a Date
 */
export function excelSerialToDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null;

  // Excel serial date: días desde 1899-12-30
  const excelEpoch = new Date(1899, 11, 30);
  const msPerDay = 24 * 60 * 60 * 1000;

  return new Date(excelEpoch.getTime() + serial * msPerDay);
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
