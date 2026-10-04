import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { CicloHistorico, Incidencia, ResultadoExtraccion, SemanaHistorica, ValorCelda } from './types';

const HOJA = 'BASE DE DATOS';
const FILA_ENCABEZADO = 11;
const COLUMNAS_REQUERIDAS = ['#', 'SEM', '# GPO', 'CICLO', 'NOMBRE GRUPO', 'ASESOR', 'FECHA DE DESEMBOLSO', 'GRUPO VIGENTE', 'TOTAL DEL CREDITO', 'CREDITO PAGADO ACUM', 'SALDO X LIQUIDAR'];
const ALIAS_ASESORAS: Record<string, string | null> = { ANA_VAZ: 'ANA_VAZQUEZ', OFNA: null };

const texto = (valor: ValorCelda): string => valor == null ? '' : String(valor).trim();
const normalizarTexto = (valor: ValorCelda): string => texto(valor).replace(/\s+/g, ' ').toUpperCase();

function numeroDecimal(valor: ValorCelda): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  const limpio = String(valor).replace(/[$,%\s]/g, '').replace(/^\((.*)\)$/, '-$1').replace(/,/g, '');
  if (!limpio || limpio === '-') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

function entero(valor: ValorCelda): number | null {
  const numero = numeroDecimal(valor);
  return numero == null || !Number.isInteger(numero) ? null : numero;
}

function fechaISO(valor: ValorCelda): string | null {
  if (valor == null || valor === '') return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  if (typeof valor === 'number') {
    const partes = XLSX.SSF.parse_date_code(valor);
    if (partes) return `${partes.y}-${String(partes.m).padStart(2, '0')}-${String(partes.d).padStart(2, '0')}`;
  }
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
}

function hora(valor: ValorCelda): string | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number' && valor >= 0 && valor < 1) {
    const minutos = Math.round(valor * 24 * 60);
    return `${String(Math.floor(minutos / 60) % 24).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
  }
  const valorTexto = texto(valor);
  const coincidencia = valorTexto.match(/^(\d{1,2}):(\d{2})/);
  return coincidencia ? `${coincidencia[1].padStart(2, '0')}:${coincidencia[2]}` : valorTexto || null;
}

const hashJSON = (valor: unknown): string => crypto.createHash('sha256').update(JSON.stringify(valor)).digest('hex');

function crearMapaEncabezados(fila: ValorCelda[], inicio: number, fin: number): Map<string, number> {
  const mapa = new Map<string, number>();
  for (let indice = inicio; indice < fin; indice += 1) {
    const nombre = normalizarTexto(fila[indice]);
    if (nombre && !mapa.has(nombre)) mapa.set(nombre, indice);
  }
  return mapa;
}

function celda(fila: ValorCelda[], mapa: Map<string, number>, nombre: string): ValorCelda {
  const indice = mapa.get(nombre);
  return indice == null ? null : fila[indice];
}

function normalizarAsesora(valor: ValorCelda): string | null {
  const codigo = normalizarTexto(valor).replace(/\s+/g, '_');
  if (!codigo) return null;
  return Object.prototype.hasOwnProperty.call(ALIAS_ASESORAS, codigo) ? ALIAS_ASESORAS[codigo] : codigo;
}

function convertirFila(fila: ValorCelda[], mapa: Map<string, number>, filaExcel: number): SemanaHistorica | null {
  const numeroGrupo = entero(celda(fila, mapa, '# GPO'));
  const ciclo = entero(celda(fila, mapa, 'CICLO'));
  const semana = entero(celda(fila, mapa, 'SEM'));
  const nombreGrupo = normalizarTexto(celda(fila, mapa, 'NOMBRE GRUPO'));
  if (numeroGrupo == null && ciclo == null && semana == null && !nombreGrupo) return null;
  if (numeroGrupo == null || ciclo == null || semana == null || !nombreGrupo) return null;
  const asesoraOrigen = normalizarTexto(celda(fila, mapa, 'ASESOR'));
  const base = {
    fila_excel: filaExcel, clave_fila_origen: texto(celda(fila, mapa, '#')) || null,
    clave_origen: `${numeroGrupo}|${ciclo}`, semana, numero_grupo_legacy: numeroGrupo,
    numero_ciclo: ciclo, nombre_grupo: nombreGrupo, asesora_origen: asesoraOrigen,
    asesora_normalizada: normalizarAsesora(asesoraOrigen), numero_integrantes: entero(celda(fila, mapa, 'SRAS')),
    fecha_desembolso: fechaISO(celda(fila, mapa, 'FECHA DE DESEMBOLSO')), semana_desembolso: entero(celda(fila, mapa, 'SEMANA DESEMBOLSO')),
    tasa: numeroDecimal(celda(fila, mapa, 'TASA')), retencion_inicial: numeroDecimal(celda(fila, mapa, 'RETENCION INICIAL')),
    apertura: numeroDecimal(celda(fila, mapa, 'APERTURA')), seguro_por_persona: numeroDecimal(celda(fila, mapa, 'SEGURO X PERSONA')),
    plazo_semanas: entero(celda(fila, mapa, 'PLAZO')), numero_documento: entero(celda(fila, mapa, 'DOC')),
    prestamo: numeroDecimal(celda(fila, mapa, 'PRESTAMO')), total_cuenta: numeroDecimal(celda(fila, mapa, 'TOTAL DE LA CUENTA')),
    semana_vencimiento: entero(celda(fila, mapa, 'SEM VENCIMIENTO')), fecha_vencimiento: fechaISO(celda(fila, mapa, 'FECHA VENCIMIENTO')),
    dia_pago: normalizarTexto(celda(fila, mapa, 'DIA PAGO')) || null, hora_pago: hora(celda(fila, mapa, 'HORA PAGO')),
    pago_minimo: numeroDecimal(celda(fila, mapa, 'PAGO MINIMO')), fecha_cobro: fechaISO(celda(fila, mapa, 'FECHA DE COBRO')),
    total_pagado_semana: numeroDecimal(celda(fila, mapa, 'TOTAL PAGADO')), ficha_pagada_semana: numeroDecimal(celda(fila, mapa, 'FICHA PAGADA SEM')),
    ahorro_pagado_semana: numeroDecimal(celda(fila, mapa, 'AHORRO PAGADO')), seguro_pagado_semana: numeroDecimal(celda(fila, mapa, 'SEGURO PAGADO')),
    semanas_sin_pago: entero(celda(fila, mapa, 'SEM SIN PAGO')), vigente_en_corte: numeroDecimal(celda(fila, mapa, 'GRUPO VIGENTE')) === 1,
    total_credito: numeroDecimal(celda(fila, mapa, 'TOTAL DEL CREDITO')), credito_pagado_acumulado: numeroDecimal(celda(fila, mapa, 'CREDITO PAGADO ACUM')),
    porcentaje_pagado: numeroDecimal(celda(fila, mapa, '% PAGADO')), saldo_por_liquidar: numeroDecimal(celda(fila, mapa, 'SALDO X LIQUIDAR')),
    porcentaje_por_liquidar: numeroDecimal(celda(fila, mapa, '% POR LIQUIDAR')), capital_cobrado_semana: numeroDecimal(celda(fila, mapa, 'CAPITAL COBRADO SEM')),
    capital_cobrado_acumulado: numeroDecimal(celda(fila, mapa, 'CAPITAL COBRADO ACUM')), capital_pendiente: numeroDecimal(celda(fila, mapa, 'CAPITAL PEND')),
    utilidad_cobrada_semana: numeroDecimal(celda(fila, mapa, 'UTILIDAD COBRADA SEM')), utilidad_cobrada_acumulada: numeroDecimal(celda(fila, mapa, 'UTILIDAD COBRADA ACUM')),
    seguro_cobrado_acumulado: numeroDecimal(celda(fila, mapa, 'SEGURO COBRADO ACUM')),
  };
  return { ...base, hash_semantico: hashJSON(base) };
}

function consolidarCiclos(semanas: SemanaHistorica[], incidencias: Incidencia[]): CicloHistorico[] {
  const porClave = new Map<string, SemanaHistorica[]>();
  semanas.forEach((semana) => porClave.set(semana.clave_origen, [...(porClave.get(semana.clave_origen) || []), semana]));
  return [...porClave.entries()].map(([clave, filas]) => {
    const nombres = new Set(filas.map((fila) => fila.nombre_grupo));
    const asesoras = new Set(filas.map((fila) => fila.asesora_origen));
    if (nombres.size > 1) incidencias.push({ nivel: 'ERROR', codigo: 'GRUPO_CONFLICTIVO', mensaje: `La llave ${clave} tiene varios nombres: ${[...nombres].join(', ')}`, clave_origen: clave });
    if (asesoras.size > 1) incidencias.push({ nivel: 'ERROR', codigo: 'ASESORA_CONFLICTIVA', mensaje: `La llave ${clave} tiene varias asesoras: ${[...asesoras].join(', ')}`, clave_origen: clave });
    const ordenadas = [...filas].sort((a, b) => a.semana - b.semana || a.fila_excel - b.fila_excel);
    const ultima = ordenadas[ordenadas.length - 1];
    return {
      clave_origen: clave, numero_grupo_legacy: ultima.numero_grupo_legacy, numero_ciclo: ultima.numero_ciclo,
      nombre_grupo: ultima.nombre_grupo, asesora_origen: ultima.asesora_origen, asesora_normalizada: ultima.asesora_normalizada,
      fecha_desembolso: ultima.fecha_desembolso, fecha_vencimiento: ultima.fecha_vencimiento, dia_pago: ultima.dia_pago,
      hora_pago: ultima.hora_pago, numero_integrantes: ultima.numero_integrantes, plazo_semanas: ultima.plazo_semanas,
      prestamo: ultima.prestamo, total_cuenta: ultima.total_cuenta, vigente_en_corte: filas.some((fila) => fila.vigente_en_corte),
      primera_semana: ordenadas[0].semana, ultima_semana: ultima.semana, total_semanas_registradas: filas.length,
      ultima_fila_excel: ultima.fila_excel,
    };
  }).sort((a, b) => a.numero_grupo_legacy - b.numero_grupo_legacy || a.numero_ciclo - b.numero_ciclo);
}

export function extraerHistoricoExcel(rutaArchivo: string): ResultadoExtraccion {
  const archivo = path.resolve(rutaArchivo);
  if (!fs.existsSync(archivo)) throw new Error(`No existe el archivo: ${archivo}`);
  const archivoSha256 = crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex');
  // Mantener seriales nativos: Excel representa las horas como fracciones de día.
  // cellDates=true las convierte en fechas de 1899 con offsets históricos inválidos.
  const workbook = XLSX.readFile(archivo, { cellDates: false });
  if (!workbook.SheetNames.includes(HOJA)) throw new Error(`No existe la hoja obligatoria "${HOJA}".`);
  const filas = XLSX.utils.sheet_to_json<ValorCelda[]>(workbook.Sheets[HOJA], { header: 1, range: FILA_ENCABEZADO - 1, defval: null, raw: true });
  if (filas.length < 2) throw new Error('La hoja no contiene datos debajo del encabezado.');
  const encabezado = filas[0];
  const inicios = encabezado.map((valor, indice) => normalizarTexto(valor) === '#' ? indice : -1).filter((indice) => indice >= 0);
  const bloques = inicios.map((inicio, indice) => ({ inicio, fin: inicios[indice + 1] ?? encabezado.length, mapa: crearMapaEncabezados(encabezado, inicio, inicios[indice + 1] ?? encabezado.length) }));
  const bloquesConDatos = bloques.filter((bloque) => filas.slice(1).some((fila) => texto(fila[bloque.inicio])));
  if (bloquesConDatos.length < 2) throw new Error('Se requieren el bloque histórico y el resumen de vigentes en la misma hoja.');
  for (const columna of COLUMNAS_REQUERIDAS) if (!bloquesConDatos[0].mapa.has(columna)) throw new Error(`Falta la columna obligatoria "${columna}" en el bloque histórico.`);

  const incidencias: Incidencia[] = [];
  const semanas: SemanaHistorica[] = [];
  for (let indice = 1; indice < filas.length; indice += 1) {
    const convertida = convertirFila(filas[indice], bloquesConDatos[0].mapa, FILA_ENCABEZADO + indice);
    if (convertida) semanas.push(convertida);
    else if (texto(filas[indice][bloquesConDatos[0].inicio])) incidencias.push({ nivel: 'ERROR', codigo: 'FILA_INCOMPLETA', mensaje: 'La fila no contiene SEM, # GPO, CICLO y NOMBRE GRUPO válidos.', fila_excel: FILA_ENCABEZADO + indice });
  }
  const resumenVigentes = new Map<string, SemanaHistorica>();
  for (let indice = 1; indice < filas.length; indice += 1) {
    const convertida = convertirFila(filas[indice], bloquesConDatos[1].mapa, FILA_ENCABEZADO + indice);
    if (!convertida) continue;
    if (resumenVigentes.has(convertida.clave_origen)) incidencias.push({ nivel: 'ERROR', codigo: 'VIGENTE_DUPLICADO', mensaje: `La llave ${convertida.clave_origen} está duplicada en el resumen vigente.`, fila_excel: convertida.fila_excel, clave_origen: convertida.clave_origen });
    resumenVigentes.set(convertida.clave_origen, convertida);
  }
  const ciclos = consolidarCiclos(semanas, incidencias);
  const vigentesHistoria = new Set(ciclos.filter((ciclo) => ciclo.vigente_en_corte).map((ciclo) => ciclo.clave_origen));
  for (const clave of vigentesHistoria) if (!resumenVigentes.has(clave)) incidencias.push({ nivel: 'ERROR', codigo: 'VIGENTE_FALTA_EN_RESUMEN', mensaje: `La llave vigente ${clave} no aparece en el resumen.`, clave_origen: clave });
  for (const clave of resumenVigentes.keys()) if (!vigentesHistoria.has(clave)) incidencias.push({ nivel: 'ERROR', codigo: 'RESUMEN_NO_MARCADO_VIGENTE', mensaje: `La llave ${clave} aparece en el resumen pero no está marcada vigente en la historia.`, clave_origen: clave });
  for (const ciclo of ciclos) {
    if (!ciclo.asesora_normalizada) incidencias.push({ nivel: 'ADVERTENCIA', codigo: 'ASESORA_SIN_MAPEO', mensaje: `La asesora "${ciclo.asesora_origen}" no se asociará automáticamente.`, clave_origen: ciclo.clave_origen });
    if (!ciclo.fecha_desembolso) incidencias.push({ nivel: 'ERROR', codigo: 'FECHA_DESEMBOLSO_INVALIDA', mensaje: 'Falta una fecha de desembolso válida.', clave_origen: ciclo.clave_origen });
  }
  return { archivo, archivo_sha256: archivoSha256, hoja: HOJA, fila_encabezado: FILA_ENCABEZADO, semanas, ciclos, resumen_vigentes: resumenVigentes, incidencias };
}
