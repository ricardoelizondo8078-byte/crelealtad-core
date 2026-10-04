import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

interface RenewalScope {
  usuarioId: string;
  rolNombre: string;
}

interface HistoricalGroupRow {
  grupo_id: string;
  nombre: string;
  numero_ciclo: number;
  vigente_en_corte: boolean;
  fecha_desembolso: string;
  fecha_vencimiento: string | null;
  numero_integrantes: number | null;
  prestamo: string | null;
  porcentaje_pagado: string | null;
  source_integrantes: number;
  source_montos: number;
}

@Injectable()
export class RenovacionesService {
  constructor(private readonly dataSource: DataSource) {}

  async listGrupos(scope: RenewalScope) {
    this.assertAsesor(scope);
    const empleadoId = await this.resolveEmpleadoId(this.dataSource.manager, scope.usuarioId);
    const rows: HistoricalGroupRow[] = await this.dataSource.query(
      `WITH ciclos AS (
         SELECT h.*,
                ROW_NUMBER() OVER (PARTITION BY h.grupo_id ORDER BY h.numero_ciclo DESC, h.fecha_desembolso DESC, h.id DESC) AS posicion
         FROM historial_grupos_ciclos h
         JOIN importaciones_excel imp ON imp.id = h.importacion_id
         WHERE imp.tipo_fuente = 'HISTORIAL_GRUPOS' AND imp.es_base_activa = TRUE
       ), ultimo AS (
         SELECT * FROM ciclos WHERE posicion = 1 AND asesora_id = $1
       ), ultima_semana AS (
         SELECT DISTINCT ON (s.ciclo_historico_id) s.ciclo_historico_id, s.porcentaje_pagado
         FROM historial_grupos_ciclos_semanas s
         ORDER BY s.ciclo_historico_id, s.semana DESC, s.fila_excel DESC
       ), expediente_fuente AS (
         SELECT u.grupo_id, e.id expediente_id
         FROM ultimo u
         LEFT JOIN expedientes e ON e.ciclo_historico_origen_id = u.id AND e.grupo_id = u.grupo_id
       ), fuente AS (
         SELECT u.grupo_id,
                COUNT(s.id)::int AS source_integrantes,
                COUNT(*) FILTER (WHERE s.monto_autorizado IS NOT NULL)::int AS source_montos
         FROM ultimo u
         LEFT JOIN expediente_fuente ef ON ef.grupo_id = u.grupo_id
         LEFT JOIN integrantes i ON i.expediente_id = ef.expediente_id
         LEFT JOIN solicitudes s ON s.integrante_id = i.id AND s.ciclo_numero = u.numero_ciclo
         GROUP BY u.grupo_id
       )
       SELECT u.grupo_id, g.nombre, u.numero_ciclo, u.vigente_en_corte, u.fecha_desembolso,
              u.fecha_vencimiento, u.numero_integrantes, u.prestamo, us.porcentaje_pagado,
              COALESCE(f.source_integrantes, 0)::int AS source_integrantes,
              COALESCE(f.source_montos, 0)::int AS source_montos
       FROM ultimo u
       JOIN grupos g ON g.id = u.grupo_id
       LEFT JOIN ultima_semana us ON us.ciclo_historico_id = u.id
       LEFT JOIN fuente f ON f.grupo_id = u.grupo_id
       ORDER BY u.vigente_en_corte DESC, g.nombre ASC`,
      [empleadoId],
    );

    return rows.map((row) => {
      const esperado = Number(row.numero_integrantes ?? 0);
      const disponibles = esperado > 0
        && Number(row.source_integrantes) === esperado
        && Number(row.source_montos) === esperado;
      return {
        grupo_id: row.grupo_id,
        nombre: row.nombre,
        ultimo_ciclo: Number(row.numero_ciclo),
        vigente_en_corte: row.vigente_en_corte,
        fecha_desembolso: row.fecha_desembolso,
        fecha_vencimiento: row.fecha_vencimiento,
        numero_integrantes: row.numero_integrantes == null ? null : Number(row.numero_integrantes),
        prestamo_grupal: row.prestamo == null ? null : Number(row.prestamo),
        porcentaje_pagado: row.porcentaje_pagado == null ? null : Number(row.porcentaje_pagado),
        puede_renovar: disponibles,
        motivo_bloqueo: disponibles ? null : 'Falta migrar el historial individual de integrantes y montos de este ciclo.',
      };
    });
  }

  async create(grupoId: string, scope: RenewalScope) {
    this.assertAsesor(scope);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const empleadoId = await this.resolveEmpleadoId(runner.manager, scope.usuarioId);
      await runner.manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [grupoId]);

      const [grupo] = await runner.manager.query(
        `WITH ciclos AS (
           SELECT h.*, ROW_NUMBER() OVER (PARTITION BY h.grupo_id ORDER BY h.numero_ciclo DESC, h.fecha_desembolso DESC, h.id DESC) posicion
           FROM historial_grupos_ciclos h
           JOIN importaciones_excel imp ON imp.id = h.importacion_id
           WHERE imp.tipo_fuente = 'HISTORIAL_GRUPOS' AND imp.es_base_activa = TRUE
         )
         SELECT c.*, g.nombre
         FROM ciclos c JOIN grupos g ON g.id = c.grupo_id
         WHERE c.posicion = 1 AND c.grupo_id = $1 AND c.asesora_id = $2`,
        [grupoId, empleadoId],
      );
      if (!grupo) throw new NotFoundException('El grupo no pertenece a la cartera vigente del asesor.');

      const [existente] = await runner.manager.query(
        `SELECT e.id AS expediente_id
         FROM audit_log a JOIN expedientes e ON e.id = a.registro_id
         WHERE a.accion = 'INICIO_RENOVACION'
           AND a.datos_despues->>'grupo_id' = $1
           AND a.datos_despues->>'ciclo_origen' = $2
         ORDER BY a.created_at DESC LIMIT 1`,
        [grupoId, String(grupo.numero_ciclo)],
      );
      if (existente) {
        await runner.commitTransaction();
        return { expediente_id: existente.expediente_id, ya_existia: true };
      }

      const [fuente] = await runner.manager.query(
        `SELECT e.id
         FROM expedientes e
         WHERE e.grupo_id = $1 AND e.ciclo_historico_origen_id = $2
         LIMIT 1`,
        [grupoId, grupo.id],
      );
      if (!fuente) throw new ConflictException('Falta migrar el historial individual del último ciclo antes de renovarlo.');

      const integrantes = await runner.manager.query(
        `SELECT i.persona_id, s.monto_autorizado AS monto
         FROM integrantes i JOIN solicitudes s ON s.integrante_id = i.id
         WHERE i.expediente_id = $1 AND s.ciclo_numero = $2 AND i.persona_id IS NOT NULL`,
        [fuente.id, grupo.numero_ciclo],
      );
      const esperados = Number(grupo.numero_integrantes ?? 0);
      if (esperados < 1 || integrantes.length !== esperados || integrantes.some((item: { monto: string | null }) => item.monto == null)) {
        throw new ConflictException('Los integrantes o montos del último ciclo están incompletos; no se creó el expediente.');
      }

      const [expediente] = await runner.manager.query(
        `INSERT INTO expedientes (grupo_id, asesora_id, estado, estado_fecha)
         VALUES ($1, $2, 'EN_DOCUMENTACION', NOW()) RETURNING id`,
        [grupoId, empleadoId],
      );
      for (const item of integrantes as Array<{ persona_id: string; monto: string }>) {
        const [integrante] = await runner.manager.query(
          `INSERT INTO integrantes (expediente_id, persona_id, estado)
           VALUES ($1, $2, 'DOCUMENTANDO') RETURNING id`,
          [expediente.id, item.persona_id],
        );
        await runner.manager.query(
          `INSERT INTO solicitudes (integrante_id, persona_id, expediente_id, grupo_id, ciclo_numero, monto_solicitado)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [integrante.id, item.persona_id, expediente.id, grupoId, Number(grupo.numero_ciclo) + 1, item.monto],
        );
      }

      const auditData = JSON.stringify({
        grupo_id: grupoId,
        ciclo_origen: Number(grupo.numero_ciclo),
        ciclo_destino: Number(grupo.numero_ciclo) + 1,
        integrantes_precargadas: integrantes.length,
      });
      await runner.manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues, usuario_id)
         VALUES ('expedientes', $1, 'INICIO_RENOVACION', $2::jsonb, $3)`,
        [expediente.id, auditData, scope.usuarioId],
      );
      await runner.commitTransaction();
      return { expediente_id: expediente.id, ya_existia: false, integrantes_precargadas: integrantes.length };
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private assertAsesor(scope: RenewalScope) {
    if (scope.rolNombre !== 'ASESOR') throw new ForbiddenException('La renovación está disponible únicamente para asesores.');
  }

  private async resolveEmpleadoId(manager: EntityManager, usuarioId: string): Promise<string> {
    const [empleado] = await manager.query('SELECT id FROM empleados WHERE usuario_id = $1 LIMIT 1', [usuarioId]);
    if (!empleado?.id) throw new ForbiddenException('La cuenta no tiene un registro laboral de asesor asociado.');
    return empleado.id;
  }
}
