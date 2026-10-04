import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExpedienteEntity, ExpedienteEstado } from './expediente.entity';
import { IntegranteEntity, IntegranteEstado } from '../integrantes/integrante.entity';
import {
  AccessScope,
  assertExpedienteAccess,
  resolveEmpleadoId,
} from '../common/access-scope';

export interface GrupoEnVerificacionResumen {
  id: string;
  nombre: string;
  estado: string;
  expediente_id: string;
  estado_fecha: Date | null;
  integrantes_count: number;
  es_grupo_nuevo_ciclo_1: boolean;
  requiere_revision_documental: boolean;
}

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(ExpedienteEntity)
    private readonly expedienteRepository: Repository<ExpedienteEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listAll(scope: AccessScope): Promise<ExpedienteEntity[]> {
    const empleadoId = await resolveEmpleadoId(this.dataSource, scope);
    return this.expedienteRepository.find({
      where: empleadoId ? { asesora_id: empleadoId } : {},
    });
  }

  async listByGroup(groupId: string, scope: AccessScope): Promise<ExpedienteEntity[]> {
    const empleadoId = await resolveEmpleadoId(this.dataSource, scope);
    return this.expedienteRepository.find({
      where: {
        grupo_id: groupId,
        ...(empleadoId ? { asesora_id: empleadoId } : {}),
      },
    });
  }

  async getById(id: string, scope: AccessScope): Promise<ExpedienteEntity | null> {
    await assertExpedienteAccess(this.dataSource, id, scope);
    return this.expedienteRepository.findOne({
      where: { id },
      relations: { grupo: true },
    });
  }

  async listEnVerificacion(scope: AccessScope): Promise<GrupoEnVerificacionResumen[]> {
    const empleadoId = await resolveEmpleadoId(this.dataSource, scope);
    const query = this.expedienteRepository
      .createQueryBuilder('expediente')
      .innerJoin('expediente.grupo', 'grupo')
      .leftJoin(
        IntegranteEntity,
        'integrante',
        'integrante.expediente_id = expediente.id AND integrante.estado <> :retirada',
        { retirada: IntegranteEstado.RETIRADA },
      )
      .select('grupo.id', 'grupo_id')
      .addSelect('grupo.nombre', 'grupo_nombre')
      .addSelect('expediente.id', 'expediente_id')
      .addSelect('expediente.estado', 'expediente_estado')
      .addSelect('expediente.estado_fecha', 'estado_fecha')
      .addSelect('COUNT(integrante.id)', 'integrantes_count')
      .addSelect(
        'COUNT(integrante.id) FILTER (WHERE integrante.estado = :documentando) > 0',
        'requiere_revision_documental',
      )
      .where('expediente.estado = :estado', {
        estado: ExpedienteEstado.EN_VERIFICACION,
      });
    if (empleadoId) {
      query.andWhere('expediente.asesora_id = :empleadoId', { empleadoId });
    }
    const rows = await query
      .setParameter('documentando', IntegranteEstado.DOCUMENTANDO)
      .groupBy('grupo.id')
      .addGroupBy('grupo.nombre')
      .addGroupBy('expediente.id')
      .addGroupBy('expediente.estado')
      .addGroupBy('expediente.estado_fecha')
      .orderBy('expediente.estado_fecha', 'ASC')
      .getRawMany<{
        grupo_id: string;
        grupo_nombre: string;
        expediente_id: string;
        expediente_estado: string;
        estado_fecha: Date | null;
        integrantes_count: string;
        requiere_revision_documental: boolean | string;
      }>();

    const ciclosPorExpediente = await this.resolveCiclosPorExpediente(
      rows.map((row) => row.expediente_id),
    );

    return rows.map((row) => ({
      id: row.grupo_id,
      nombre: row.grupo_nombre,
      estado: row.expediente_estado,
      expediente_id: row.expediente_id,
      estado_fecha: row.estado_fecha,
      integrantes_count: Number(row.integrantes_count),
      es_grupo_nuevo_ciclo_1: ciclosPorExpediente.get(row.expediente_id) === 1,
      requiere_revision_documental: row.requiere_revision_documental === true
        || row.requiere_revision_documental === 'true',
    }));
  }

  private async resolveCiclosPorExpediente(
    expedienteIds: string[],
  ): Promise<Map<string, number>> {
    if (expedienteIds.length === 0) {
      return new Map();
    }

    // Mantiene la misma precedencia que la bandeja de Documentación: ciclo
    // transaccional, solicitud, auditoría de renovación y, por último, historial.
    const rows = await this.dataSource.query(
      `SELECT e.id AS expediente_id,
              COALESCE(
                (SELECT MAX(c.numero_ciclo) FROM ciclos c WHERE c.expediente_id = e.id),
                (SELECT MAX(s.ciclo_numero) FROM solicitudes s WHERE s.expediente_id = e.id),
                (SELECT MAX(NULLIF(a.datos_despues->>'ciclo_destino', '')::integer)
                   FROM audit_log a
                  WHERE a.tabla = 'expedientes'
                    AND a.registro_id = e.id
                    AND a.accion = 'INICIO_RENOVACION'),
                CASE
                  WHEN EXISTS (SELECT 1 FROM historial_grupos_ciclos h WHERE h.grupo_id = e.grupo_id)
                    THEN NULL
                  ELSE 1
                END
              ) AS numero_ciclo
         FROM expedientes e
        WHERE e.id = ANY($1::uuid[])`,
      [expedienteIds],
    );

    return new Map(
      (rows as Array<{ expediente_id: string; numero_ciclo: string | number | null }>)
        .filter((row) => row.numero_ciclo != null)
        .map((row) => [row.expediente_id, Number(row.numero_ciclo)]),
    );
  }

  async getIntegrantes(expedienteId: string, scope: AccessScope): Promise<any[]> {
    await assertExpedienteAccess(this.dataSource, expedienteId, scope);
    const rows = await this.dataSource.query(
      `SELECT i.id,
              p.nombre_completo AS nombre,
              p.nombres,
              p.apellido_pat,
              p.telefono,
              i.estado,
              (i.id = e.tesorera_integrante_id) AS es_tesorera,
              s.monto_solicitado,
              s.ciclo_numero AS ciclo
         FROM integrantes i
         INNER JOIN expedientes e ON e.id = i.expediente_id
         LEFT JOIN personas p ON p.id = i.persona_id
         LEFT JOIN solicitudes s ON s.integrante_id = i.id
        WHERE i.expediente_id = $1
          AND i.estado <> $2
        ORDER BY i.created_at ASC`,
      [expedienteId, IntegranteEstado.RETIRADA],
    ) as Array<{
      id: string;
      nombre: string | null;
      nombres: string | null;
      apellido_pat: string | null;
      telefono: string | null;
      estado: IntegranteEstado;
      es_tesorera: boolean;
      monto_solicitado: string | number | null;
      ciclo: string | number | null;
    }>;

    return rows.map((row) => ({
      ...row,
      nombre: row.nombre || 'Sin nombre',
      monto_solicitado: row.monto_solicitado == null ? null : Number(row.monto_solicitado),
      ciclo: row.ciclo == null ? null : Number(row.ciclo),
    }));
  }

  async seleccionarTesorera(
    expedienteId: string,
    integranteId: string,
    scope: AccessScope,
  ): Promise<ExpedienteEntity> {
    return this.dataSource.transaction(async (manager) => {
      await assertExpedienteAccess(manager, expedienteId, scope);
      const expedienteRepository = manager.getRepository(ExpedienteEntity);
      const integranteRepository = manager.getRepository(IntegranteEntity);
      const expediente = await expedienteRepository.findOne({
        where: { id: expedienteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!expediente) {
        throw new NotFoundException('Expediente no encontrado');
      }
      if (expediente.estado !== ExpedienteEstado.EN_DOCUMENTACION) {
        throw new ConflictException(
          'La tesorera sólo puede seleccionarse mientras el expediente está en documentación',
        );
      }

      const integrante = await integranteRepository.findOne({
        where: { id: integranteId, expediente_id: expedienteId },
        select: { id: true, estado: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!integrante) {
        throw new BadRequestException('Selecciona una integrante de este expediente');
      }
      if (integrante.estado !== IntegranteEstado.SUJETA_CREDITO) {
        throw new BadRequestException(
          'La tesorera debe tener su documentación completa y participar en este ciclo',
        );
      }
      if (expediente.tesorera_integrante_id === integrante.id) {
        return expediente;
      }

      const tesoreraAnterior = expediente.tesorera_integrante_id;
      expediente.tesorera_integrante_id = integrante.id;
      const actualizado = await expedienteRepository.save(expediente);
      await manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
         VALUES ('expedientes', $1, $2, $3::jsonb, $4::jsonb, $5)`,
        [
          expediente.id,
          tesoreraAnterior ? 'CAMBIA_TESORERA' : 'ASIGNA_TESORERA',
          JSON.stringify({ tesorera_integrante_id: tesoreraAnterior }),
          JSON.stringify({ tesorera_integrante_id: integrante.id }),
          scope.usuarioId,
        ],
      );
      return actualizado;
    });
  }

  async sendToVerification(id: string, scope: AccessScope): Promise<ExpedienteEntity | null> {
    return this.dataSource.transaction(async (manager) => {
      await assertExpedienteAccess(manager, id, scope);
      const expedienteRepository = manager.getRepository(ExpedienteEntity);
      const expediente = await expedienteRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!expediente) {
        return null;
      }

      if (expediente.estado === ExpedienteEstado.EN_VERIFICACION) {
        return expediente;
      }

      if (expediente.estado !== ExpedienteEstado.EN_DOCUMENTACION) {
        throw new ConflictException(
          `El expediente no puede enviarse a verificación desde el estado ${expediente.estado}`,
        );
      }

      const integrantes = await manager.getRepository(IntegranteEntity).find({
        where: { expediente_id: id },
        select: { id: true, estado: true },
      });
      if (integrantes.length === 0) {
        throw new BadRequestException('El expediente no tiene integrantes para verificar');
      }

      const participantes = integrantes.filter(
        (integrante) => integrante.estado === IntegranteEstado.SUJETA_CREDITO,
      );
      const retiradas = integrantes.filter(
        (integrante) => integrante.estado === IntegranteEstado.RETIRADA,
      );
      const incompletas = integrantes.filter(
        (integrante) => integrante.estado !== IntegranteEstado.SUJETA_CREDITO
          && integrante.estado !== IntegranteEstado.RETIRADA,
      );
      if (incompletas.length > 0) {
        throw new BadRequestException({
          message: 'El expediente conserva integrantes con documentación obligatoria pendiente',
          integrantes_incompletas: incompletas.length,
        });
      }
      if (participantes.length === 0) {
        throw new BadRequestException('Selecciona al menos una integrante completa para verificar');
      }
      if (!expediente.tesorera_integrante_id) {
        throw new BadRequestException('Selecciona la tesorera del grupo antes de enviar a Verificación');
      }
      const tesorera = participantes.find(
        (integrante) => integrante.id === expediente.tesorera_integrante_id,
      );
      if (!tesorera) {
        throw new BadRequestException(
          'La tesorera seleccionada debe tener su documentación completa y participar en este ciclo',
        );
      }

      const estadoAnterior = expediente.estado;
      expediente.estado = ExpedienteEstado.EN_VERIFICACION;
      expediente.estado_fecha = new Date();
      const actualizado = await expedienteRepository.save(expediente);
      await manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
         VALUES ('expedientes', $1, 'ENVIO_VERIFICACION', $2::jsonb, $3::jsonb, $4)`,
        [
          expediente.id,
          JSON.stringify({ estado: estadoAnterior }),
          JSON.stringify({
            estado: actualizado.estado,
            integrantes_enviadas: participantes.length,
            integrantes_retiradas: retiradas.length,
            tesorera_integrante_id: tesorera.id,
          }),
          scope.usuarioId,
        ],
      );
      return actualizado;
    });
  }
}
