import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface PendienteRevisionDocumentalRow {
  expediente_id: string;
  grupo_id: string;
  grupo_nombre: string;
  integrantes_pendientes: string | number;
  solicitado_desde: Date | string;
}

export interface PendienteRevisionDocumental {
  expediente_id: string;
  grupo_id: string;
  grupo_nombre: string;
  integrantes_pendientes: number;
  solicitado_desde: string;
}

export interface BandejaRevisionDocumental {
  total_pendientes: number;
  grupos: PendienteRevisionDocumental[];
}

@Injectable()
export class PendientesService {
  constructor(private readonly dataSource: DataSource) {}

  async listRevisionDocumental(usuarioId: string): Promise<BandejaRevisionDocumental> {
    const rows = await this.dataSource.query<PendienteRevisionDocumentalRow[]>(
      `
        SELECT
          e.id AS expediente_id,
          g.id AS grupo_id,
          g.nombre AS grupo_nombre,
          COUNT(*)::int AS integrantes_pendientes,
          MIN(revision.created_at) AS solicitado_desde
        FROM integrantes i
        INNER JOIN expedientes e ON e.id = i.expediente_id
        INNER JOIN grupos g ON g.id = e.grupo_id
        INNER JOIN empleados asesora ON asesora.id = e.asesora_id
        INNER JOIN LATERAL (
          SELECT evento.created_at
          FROM audit_log evento
          WHERE evento.tabla = $2
            AND evento.registro_id = i.id
            AND evento.accion = $3
          ORDER BY evento.created_at DESC
          LIMIT 1
        ) revision ON TRUE
        WHERE asesora.usuario_id = $1
          AND e.estado = $4
          AND i.estado = $5
        GROUP BY e.id, g.id, g.nombre
        ORDER BY solicitado_desde ASC, g.nombre ASC
      `,
      [
        usuarioId,
        'integrantes',
        'REV_DOC_SOLICITADA',
        'EN_VERIFICACION',
        'DOCUMENTANDO',
      ],
    );

    const grupos = rows.map((row) => ({
      expediente_id: row.expediente_id,
      grupo_id: row.grupo_id,
      grupo_nombre: row.grupo_nombre,
      integrantes_pendientes: Number(row.integrantes_pendientes),
      solicitado_desde: row.solicitado_desde instanceof Date
        ? row.solicitado_desde.toISOString()
        : new Date(row.solicitado_desde).toISOString(),
    }));

    return {
      total_pendientes: grupos.reduce(
        (total, grupo) => total + grupo.integrantes_pendientes,
        0,
      ),
      grupos,
    };
  }
}
