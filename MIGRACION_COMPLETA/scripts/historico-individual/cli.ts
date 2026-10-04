import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { buildHistoricalIndividualContract, HistoricalCandidate, HistoricalCycleInput } from './contract';

const repoRoot = path.resolve(__dirname, '../../..');
const migrationRoot = path.join(repoRoot, 'MIGRACION_COMPLETA');
const sourceFile = path.join(repoRoot, 'BASEDATOS CRELEALTAD (1) (1).xlsx');
const rawFile = path.join(migrationRoot, 'data/staging/integrantes_raw.json');
const groupMapFile = path.join(migrationRoot, 'data/mapeo/grupos_legacy_to_uuid.json');
const personMapFile = path.join(migrationRoot, 'data/mapeo/personas_curp_to_uuid.json');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function sourceHash(): string {
  return crypto.createHash('sha256').update(fs.readFileSync(sourceFile)).digest('hex');
}

async function existingPersonMap(client: Client, source: Record<string, string>) {
  const ids = [...new Set(Object.values(source))];
  const result = await client.query<{ id: string }>('SELECT id FROM personas WHERE id = ANY($1::uuid[])', [ids]);
  const existing = new Set(result.rows.map((row) => row.id));
  return Object.fromEntries(Object.entries(source).filter(([, id]) => existing.has(id)));
}

async function loadLatestCycles(client: Client): Promise<HistoricalCycleInput[]> {
  const result = await client.query<HistoricalCycleInput>(
    `WITH ranked AS (
       SELECT h.*,
              COUNT(*) OVER (PARTITION BY h.grupo_id, h.numero_ciclo)::int AS key_count,
              ROW_NUMBER() OVER (
                PARTITION BY h.grupo_id
                ORDER BY h.numero_ciclo DESC, h.fecha_desembolso DESC, h.id DESC
              ) AS posicion
       FROM historial_grupos_ciclos h
       JOIN importaciones_excel imp ON imp.id = h.importacion_id
       WHERE imp.tipo_fuente = 'HISTORIAL_GRUPOS' AND imp.es_base_activa = TRUE
     )
     SELECT id, grupo_id, numero_ciclo, numero_integrantes, prestamo, key_count
     FROM ranked WHERE posicion = 1
     ORDER BY grupo_id`,
  );
  return result.rows;
}

async function validateLoadedExpediente(client: Client, candidate: HistoricalCandidate, expedienteId: string) {
  const result = await client.query(
    `SELECT COUNT(*)::int integrantes,
            COUNT(*) FILTER (WHERE s.monto_autorizado IS NOT NULL)::int montos,
            COALESCE(SUM(s.monto_autorizado), 0)::numeric AS total
     FROM integrantes i
     JOIN solicitudes s ON s.integrante_id = i.id
     WHERE i.expediente_id = $1 AND s.ciclo_numero = $2`,
    [expedienteId, candidate.ciclo.numero_ciclo],
  );
  const expectedTotal = candidate.integrantes.reduce((sum, item) => sum + item.monto_autorizado, 0);
  const row = result.rows[0];
  if (Number(row.integrantes) !== candidate.integrantes.length
      || Number(row.montos) !== candidate.integrantes.length
      || Number(row.total) !== expectedTotal) {
    throw new Error(`El expediente histórico de ciclo ${candidate.ciclo.id} no coincide con el contrato validado`);
  }
}

async function repairMissingRequests(
  client: Client,
  candidate: HistoricalCandidate,
  expedienteId: string,
): Promise<number> {
  const result = await client.query<{
    integrante_id: string;
    persona_id: string;
    solicitud_id: string | null;
    ciclo_numero: number | null;
    monto_autorizado: string | null;
  }>(
    `SELECT i.id AS integrante_id, i.persona_id, s.id AS solicitud_id,
            s.ciclo_numero, s.monto_autorizado
     FROM integrantes i
     LEFT JOIN solicitudes s ON s.integrante_id = i.id
     WHERE i.expediente_id = $1
     ORDER BY i.persona_id, s.id`,
    [expedienteId],
  );
  if (result.rowCount !== candidate.integrantes.length) {
    throw new Error(`No se puede reparar el ciclo ${candidate.ciclo.id}: el conjunto de integrantes cambió`);
  }

  const expected = new Map(candidate.integrantes.map((member) => [member.persona_id, member]));
  let repaired = 0;
  for (const row of result.rows) {
    const member = expected.get(row.persona_id);
    if (!member) throw new Error(`No se puede reparar el ciclo ${candidate.ciclo.id}: existe una persona fuera del contrato`);
    if (row.solicitud_id) {
      if (Number(row.ciclo_numero) !== candidate.ciclo.numero_ciclo
          || Number(row.monto_autorizado) !== member.monto_autorizado) {
        throw new Error(`No se puede reparar el ciclo ${candidate.ciclo.id}: una solicitud existente difiere del contrato`);
      }
      expected.delete(row.persona_id);
      continue;
    }
    await client.query(
      `INSERT INTO solicitudes (
         integrante_id, persona_id, expediente_id, grupo_id, ciclo_numero, monto_autorizado
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [row.integrante_id, row.persona_id, expedienteId, candidate.ciclo.grupo_id,
        candidate.ciclo.numero_ciclo, member.monto_autorizado],
    );
    expected.delete(row.persona_id);
    repaired += 1;
  }
  if (expected.size) throw new Error(`No se puede reparar el ciclo ${candidate.ciclo.id}: faltan integrantes del contrato`);
  return repaired;
}

async function main() {
  const command = process.argv[2] ?? 'analizar';
  const dryRun = process.argv.includes('--dry-run');
  if (!['analizar', 'cargar'].includes(command)) throw new Error('Uso: analizar | cargar [--dry-run]');

  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'crelealtad',
  });
  await client.connect();
  try {
    const raw = readJson<Array<Record<string, unknown>>>(rawFile);
    const groupMap = readJson<Record<string, string>>(groupMapFile);
    const mappedPeople = readJson<Record<string, string>>(personMapFile);
    const personMap = await existingPersonMap(client, mappedPeople);
    const cycles = await loadLatestCycles(client);
    const contract = buildHistoricalIndividualContract(raw, groupMap, personMap, cycles);

    console.log(JSON.stringify({
      base: process.env.DB_NAME ?? 'crelealtad',
      ciclos_ultimos: cycles.length,
      ciclos_elegibles: contract.elegibles.length,
      ciclos_bloqueados: contract.rechazados.length,
      motivos_bloqueo: contract.resumen_rechazos,
      filas_fuente: raw.length,
      personas_mapeadas_existentes: Object.keys(personMap).length,
    }, null, 2));
    if (command === 'analizar') return;

    const schema = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'expedientes'
           AND column_name = 'ciclo_historico_origen_id'
       ) AS listo`,
    );
    if (!schema.rows[0].listo) throw new Error('Primero debe aplicarse la migración 008');
    if (contract.elegibles.length === 0) throw new Error('La carga no tiene ciclos elegibles; no se escribió información');

    const activeGroupImport = await client.query(
      `SELECT semana_corte FROM importaciones_excel
       WHERE tipo_fuente = 'HISTORIAL_GRUPOS' AND es_base_activa = TRUE LIMIT 1`,
    );
    if (!activeGroupImport.rowCount) throw new Error('No existe una importación grupal activa');

    await client.query('BEGIN');
    try {
      const hash = sourceHash();
      const manifest = {
        contrato: 'HISTORIAL_INDIVIDUAL_V1',
        significado_monto: 'solicitudes.monto_autorizado',
        archivo_filas: raw.length,
        ciclos_ultimos: cycles.length,
        ciclos_elegibles: contract.elegibles.length,
        ciclos_bloqueados: contract.rechazados.length,
        motivos_bloqueo: contract.resumen_rechazos,
        reglas: ['ciclo_inequivoco', 'persona_existente', 'sin_duplicados', 'conteo_exacto', 'suma_exacta'],
      };
      await client.query(
        `INSERT INTO importaciones_excel (
           tipo_fuente, archivo_nombre, archivo_sha256, semana_corte, estado, es_base_activa, manifest
         ) VALUES ('HISTORIAL_INTEGRANTES', $1, $2, $3, 'VALIDADO', FALSE, $4::jsonb)
         ON CONFLICT (tipo_fuente, archivo_sha256) DO NOTHING`,
        [path.basename(sourceFile), hash, activeGroupImport.rows[0].semana_corte, JSON.stringify(manifest)],
      );
      const importResult = await client.query<{ id: string }>(
        `SELECT id FROM importaciones_excel
         WHERE tipo_fuente = 'HISTORIAL_INTEGRANTES' AND archivo_sha256 = $1`,
        [hash],
      );
      const importId = importResult.rows[0]?.id;
      if (!importId) throw new Error('No se pudo resolver la importación individual');

      let created = 0;
      let reused = 0;
      let members = 0;
      let repairedRequests = 0;
      for (const candidate of contract.elegibles) {
        const existing = await client.query<{ id: string }>(
          'SELECT id FROM expedientes WHERE ciclo_historico_origen_id = $1',
          [candidate.ciclo.id],
        );
        if (existing.rowCount) {
          const repaired = await repairMissingRequests(client, candidate, existing.rows[0].id);
          await validateLoadedExpediente(client, candidate, existing.rows[0].id);
          if (repaired) {
            await client.query(
              `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues)
               VALUES ('expedientes', $1, 'REPARA_HIST_INDIV', $2::jsonb)`,
              [existing.rows[0].id, JSON.stringify({ solicitudes_reparadas: repaired })],
            );
          }
          repairedRequests += repaired;
          reused += 1;
          continue;
        }

        const expediente = await client.query<{ id: string }>(
          `INSERT INTO expedientes (
             grupo_id, estado, estado_fecha, ciclo_historico_origen_id, importacion_integrantes_id
           ) VALUES ($1, 'DESEMBOLSADO', NOW(), $2, $3) RETURNING id`,
          [candidate.ciclo.grupo_id, candidate.ciclo.id, importId],
        );
        const expedienteId = expediente.rows[0].id;
        for (const member of candidate.integrantes) {
          const integrante = await client.query<{ id: string }>(
            `INSERT INTO integrantes (expediente_id, persona_id, estado)
             VALUES ($1, $2, 'AUTORIZADA') RETURNING id`,
            [expedienteId, member.persona_id],
          );
          await client.query(
            `INSERT INTO solicitudes (
               integrante_id, persona_id, expediente_id, grupo_id, ciclo_numero, monto_autorizado
             ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [integrante.rows[0].id, member.persona_id, expedienteId, candidate.ciclo.grupo_id,
              candidate.ciclo.numero_ciclo, member.monto_autorizado],
          );
          members += 1;
        }
        await validateLoadedExpediente(client, candidate, expedienteId);
        await client.query(
          `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues)
           VALUES ('expedientes', $1, 'IMPORT_HIST_INDIV', $2::jsonb)`,
          [expedienteId, JSON.stringify({
            grupo_id: candidate.ciclo.grupo_id,
            ciclo_historico_origen_id: candidate.ciclo.id,
            numero_ciclo: candidate.ciclo.numero_ciclo,
            integrantes: candidate.integrantes.length,
            importacion_integrantes_id: importId,
          })],
        );
        created += 1;
      }

      await client.query(
        `UPDATE importaciones_excel SET es_base_activa = FALSE
         WHERE tipo_fuente = 'HISTORIAL_INTEGRANTES' AND id <> $1 AND es_base_activa = TRUE`,
        [importId],
      );
      await client.query(
        `UPDATE importaciones_excel
         SET estado = 'ACTIVO', es_base_activa = TRUE, activated_at = COALESCE(activated_at, NOW())
         WHERE id = $1`,
        [importId],
      );

      if (dryRun) await client.query('ROLLBACK');
      else await client.query('COMMIT');
      console.log(JSON.stringify({
        resultado: dryRun ? 'SIMULADO_Y_REVERTIDO' : 'CARGADO',
        expedientes_creados: created,
        expedientes_reutilizados: reused,
        integrantes_creadas: members,
        solicitudes_reparadas: repairedRequests,
      }, null, 2));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
