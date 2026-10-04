import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { Client, PoolClient } from 'pg';
import { CicloHistorico, SemanaHistorica } from './types';

interface Artefactos {
  manifest: any;
  ciclos: CicloHistorico[];
  semanas: SemanaHistorica[];
}

interface Mapeos {
  grupos: Map<string, string>;
  asesoras: Map<string, string>;
  grupos_faltantes: string[];
}

const normalizar = (valor: string): string => valor.trim().replace(/\s+/g, ' ').toUpperCase();

function leerArtefactos(directorio: string): Artefactos {
  const leer = (nombre: string) => JSON.parse(fs.readFileSync(path.join(directorio, nombre), 'utf8'));
  const artefactos = { manifest: leer('manifest.json'), ciclos: leer('ciclos.json'), semanas: leer('semanas.json') };
  if (artefactos.manifest.estado !== 'VALIDADO') throw new Error('El manifiesto no está VALIDADO. No se permite consultar ni cargar este corte.');
  if (artefactos.manifest.conteos.ciclos !== artefactos.ciclos.length || artefactos.manifest.conteos.filas_semanales !== artefactos.semanas.length) throw new Error('Los conteos del manifiesto no coinciden con los artefactos.');
  const hashJSON = (valor: unknown): string => crypto.createHash('sha256').update(JSON.stringify(valor)).digest('hex');
  const hashes = artefactos.manifest.artefactos_sha256;
  if (!hashes || hashes.ciclos !== hashJSON(artefactos.ciclos) || hashes.semanas !== hashJSON(artefactos.semanas)) throw new Error('Los artefactos no coinciden con las huellas del manifiesto. Vuelva a ejecutar la validación.');
  return artefactos;
}

function crearCliente(envPath: string, base?: string): Client {
  dotenv.config({ path: envPath });
  return new Client({
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres', password: process.env.DB_PASSWORD,
    database: base || process.env.DB_NAME || 'crelealtad',
  });
}

async function resolverMapeos(cliente: Client, ciclos: CicloHistorico[], permitirGruposFaltantes = false): Promise<{ mapeos: Mapeos; errores: string[]; advertencias: string[] }> {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const filasGrupos = await cliente.query('SELECT id, nombre FROM grupos WHERE deleted_at IS NULL');
  const candidatos = new Map<string, string[]>();
  filasGrupos.rows.forEach((fila) => candidatos.set(normalizar(fila.nombre), [...(candidatos.get(normalizar(fila.nombre)) || []), fila.id]));
  const grupos = new Map<string, string>();
  const gruposFaltantes: string[] = [];
  for (const nombre of new Set(ciclos.map((ciclo) => ciclo.nombre_grupo))) {
    const ids = candidatos.get(normalizar(nombre)) || [];
    if (ids.length === 1) grupos.set(nombre, ids[0]);
    else if (!ids.length && permitirGruposFaltantes) gruposFaltantes.push(nombre);
    else if (!ids.length) errores.push(`Grupo no encontrado: ${nombre}`);
    else errores.push(`Grupo ambiguo (${ids.length} coincidencias): ${nombre}`);
  }

  const filasAsesoras = await cliente.query(`
    SELECT e.id, u.abreviatura
    FROM empleados e JOIN usuarios u ON u.id = e.usuario_id
    WHERE u.abreviatura IS NOT NULL
  `);
  const asesoras = new Map<string, string>();
  filasAsesoras.rows.forEach((fila) => asesoras.set(normalizar(fila.abreviatura), fila.id));
  for (const codigo of new Set(ciclos.map((ciclo) => ciclo.asesora_normalizada).filter(Boolean) as string[])) {
    if (!asesoras.has(normalizar(codigo))) errores.push(`Asesora no encontrada: ${codigo}`);
  }
  const sinMapeo = ciclos.filter((ciclo) => !ciclo.asesora_normalizada).length;
  if (sinMapeo) advertencias.push(`${sinMapeo} ciclos tienen asesora de origen sin mapeo (por ejemplo OFNA); se guardarán con asesora_id NULL.`);
  if (gruposFaltantes.length) advertencias.push(`${gruposFaltantes.length} grupos no existen y se crearán desde el Excel si se confirma la carga.`);
  return { mapeos: { grupos, asesoras, grupos_faltantes: gruposFaltantes }, errores, advertencias };
}

async function verificarTablas(cliente: Client): Promise<void> {
  const resultado = await cliente.query(`
    SELECT COUNT(*)::int AS total FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('importaciones_excel', 'historial_grupos_ciclos', 'historial_grupos_ciclos_semanas')
  `);
  if (resultado.rows[0].total !== 3) throw new Error('Falta aplicar database/migrations/006_historial_grupos_excel.sql en esta base.');
}

export async function prevalidarBase(directorio: string, envPath: string, base?: string, crearGrupos = false): Promise<any> {
  const artefactos = leerArtefactos(directorio);
  const cliente = crearCliente(envPath, base);
  await cliente.connect();
  try {
    const baseActual = (await cliente.query('SELECT current_database() AS nombre')).rows[0].nombre;
    await verificarTablas(cliente);
    const resolucion = await resolverMapeos(cliente, artefactos.ciclos, crearGrupos);
    return {
      base: baseActual, archivo_sha256: artefactos.manifest.archivo_sha256,
      grupos_excel: new Set(artefactos.ciclos.map((ciclo) => ciclo.nombre_grupo)).size,
      grupos_resueltos: resolucion.mapeos.grupos.size,
      grupos_por_crear: resolucion.mapeos.grupos_faltantes.length,
      asesoras_resueltas: resolucion.mapeos.asesoras.size,
      errores: resolucion.errores, advertencias: resolucion.advertencias,
    };
  } finally { await cliente.end(); }
}

async function insertarCiclo(cliente: PoolClient | Client, importacionId: string, ciclo: CicloHistorico, mapeos: Mapeos): Promise<string> {
  const resultado = await cliente.query(`
    INSERT INTO historial_grupos_ciclos (
      importacion_id, grupo_id, asesora_id, clave_origen, numero_grupo_legacy, numero_ciclo,
      nombre_grupo_origen, asesora_origen, fecha_desembolso, fecha_vencimiento, dia_pago, hora_pago,
      numero_integrantes, plazo_semanas, prestamo, total_cuenta, vigente_en_corte, primera_semana,
      ultima_semana, total_semanas_registradas, ultima_fila_excel
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING id
  `, [
    importacionId, mapeos.grupos.get(ciclo.nombre_grupo), ciclo.asesora_normalizada ? mapeos.asesoras.get(normalizar(ciclo.asesora_normalizada)) : null,
    ciclo.clave_origen, ciclo.numero_grupo_legacy, ciclo.numero_ciclo, ciclo.nombre_grupo, ciclo.asesora_origen,
    ciclo.fecha_desembolso, ciclo.fecha_vencimiento, ciclo.dia_pago, ciclo.hora_pago, ciclo.numero_integrantes,
    ciclo.plazo_semanas, ciclo.prestamo, ciclo.total_cuenta, ciclo.vigente_en_corte, ciclo.primera_semana,
    ciclo.ultima_semana, ciclo.total_semanas_registradas, ciclo.ultima_fila_excel,
  ]);
  return resultado.rows[0].id;
}

async function insertarSemana(cliente: PoolClient | Client, cicloId: string, semana: SemanaHistorica): Promise<void> {
  await cliente.query(`
    INSERT INTO historial_grupos_ciclos_semanas (
      ciclo_historico_id, fila_excel, clave_fila_origen, semana, numero_documento, fecha_cobro, pago_minimo,
      total_pagado_semana, ficha_pagada_semana, ahorro_pagado_semana, seguro_pagado_semana, semanas_sin_pago,
      total_credito, credito_pagado_acumulado, porcentaje_pagado, saldo_por_liquidar, porcentaje_por_liquidar,
      capital_cobrado_semana, capital_cobrado_acumulado, capital_pendiente, utilidad_cobrada_semana,
      utilidad_cobrada_acumulada, seguro_cobrado_acumulado, hash_semantico
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
  `, [
    cicloId, semana.fila_excel, semana.clave_fila_origen, semana.semana, semana.numero_documento, semana.fecha_cobro,
    semana.pago_minimo, semana.total_pagado_semana, semana.ficha_pagada_semana, semana.ahorro_pagado_semana,
    semana.seguro_pagado_semana, semana.semanas_sin_pago, semana.total_credito, semana.credito_pagado_acumulado,
    semana.porcentaje_pagado, semana.saldo_por_liquidar, semana.porcentaje_por_liquidar, semana.capital_cobrado_semana,
    semana.capital_cobrado_acumulado, semana.capital_pendiente, semana.utilidad_cobrada_semana,
    semana.utilidad_cobrada_acumulada, semana.seguro_cobrado_acumulado, semana.hash_semantico,
  ]);
}

export async function cargarBase(directorio: string, envPath: string, base: string, activar: boolean, crearGrupos: boolean): Promise<any> {
  const artefactos = leerArtefactos(directorio);
  const cliente = crearCliente(envPath, base);
  await cliente.connect();
  try {
    const baseActual = (await cliente.query('SELECT current_database() AS nombre')).rows[0].nombre;
    if (baseActual !== base) throw new Error(`La conexión apunta a ${baseActual}, no a la base solicitada ${base}.`);
    await verificarTablas(cliente);
    const resolucion = await resolverMapeos(cliente, artefactos.ciclos, crearGrupos);
    if (resolucion.errores.length) throw new Error(`Prevalidación rechazada:\n- ${resolucion.errores.join('\n- ')}`);
    const existente = await cliente.query('SELECT id, estado, es_base_activa FROM importaciones_excel WHERE tipo_fuente=$1 AND archivo_sha256=$2', ['HISTORIAL_GRUPOS', artefactos.manifest.archivo_sha256]);
    if (existente.rowCount) {
      const importacionExistente = existente.rows[0];
      if (activar && !importacionExistente.es_base_activa) {
        await cliente.query('BEGIN');
        await cliente.query(`UPDATE importaciones_excel SET es_base_activa=FALSE, estado=CASE WHEN estado='ACTIVO' THEN 'CARGADO' ELSE estado END WHERE tipo_fuente='HISTORIAL_GRUPOS' AND es_base_activa=TRUE`);
        await cliente.query(`UPDATE importaciones_excel SET es_base_activa=TRUE, estado='ACTIVO', activated_at=NOW() WHERE id=$1`, [importacionExistente.id]);
        await cliente.query('COMMIT');
        importacionExistente.estado = 'ACTIVO';
        importacionExistente.es_base_activa = true;
      }
      return { base: baseActual, idempotente: true, importacion: importacionExistente };
    }

    await cliente.query('BEGIN');
    for (const nombre of resolucion.mapeos.grupos_faltantes) {
      const fechas = artefactos.ciclos.filter((ciclo) => ciclo.nombre_grupo === nombre).map((ciclo) => ciclo.fecha_desembolso).filter(Boolean) as string[];
      const fechaInicio = fechas.sort()[0];
      const creado = await cliente.query('INSERT INTO grupos (nombre, fecha_inicio) VALUES ($1,$2) RETURNING id', [nombre, fechaInicio]);
      resolucion.mapeos.grupos.set(nombre, creado.rows[0].id);
    }
    const importacion = await cliente.query(`
      INSERT INTO importaciones_excel (tipo_fuente, archivo_nombre, archivo_sha256, semana_corte, estado, manifest)
      VALUES ('HISTORIAL_GRUPOS',$1,$2,$3,'VALIDADO',$4) RETURNING id
    `, [artefactos.manifest.archivo_nombre, artefactos.manifest.archivo_sha256, Math.max(...artefactos.ciclos.map((ciclo) => ciclo.ultima_semana)), artefactos.manifest]);
    const importacionId = importacion.rows[0].id;
    const idsCiclo = new Map<string, string>();
    for (const ciclo of artefactos.ciclos) idsCiclo.set(ciclo.clave_origen, await insertarCiclo(cliente, importacionId, ciclo, resolucion.mapeos));
    for (const semana of artefactos.semanas) await insertarSemana(cliente, idsCiclo.get(semana.clave_origen) as string, semana);
    await cliente.query(`UPDATE importaciones_excel SET estado='CARGADO' WHERE id=$1`, [importacionId]);
    if (activar) {
      await cliente.query(`UPDATE importaciones_excel SET es_base_activa=FALSE, estado=CASE WHEN estado='ACTIVO' THEN 'CARGADO' ELSE estado END WHERE tipo_fuente='HISTORIAL_GRUPOS' AND es_base_activa=TRUE`);
      await cliente.query(`UPDATE importaciones_excel SET es_base_activa=TRUE, estado='ACTIVO', activated_at=NOW() WHERE id=$1`, [importacionId]);
    }
    await cliente.query('COMMIT');
    return { base: baseActual, idempotente: false, importacion_id: importacionId, grupos_creados: resolucion.mapeos.grupos_faltantes.length, ciclos: artefactos.ciclos.length, semanas: artefactos.semanas.length, activa: activar, advertencias: resolucion.advertencias };
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { await cliente.end(); }
}
