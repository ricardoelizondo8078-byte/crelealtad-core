import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { registrarAuditoria } from '../common/audit-log';
import { exigirAdministradorParametros } from '../parametros-financieras/parametros-financieras.policy';
import { ActualizarIntegrantesVerificadasDto } from './dto/actualizar-integrantes-verificadas.dto';
import type { ParametroIntegrantesVerificadas } from './parametros-verificacion-cierre.types';

type ParametroRow = {
  version_id: string;
  revision: number | string;
  integrantes_verificadas_requeridas: number | string;
  publicada_at: Date | string;
};

@Injectable()
export class ParametrosVerificacionCierreService {
  constructor(private readonly dataSource: DataSource) {}

  async obtenerVigente(): Promise<ParametroIntegrantesVerificadas | null> {
    return this.obtenerVigenteCon(this.dataSource);
  }

  async actualizar(
    dto: ActualizarIntegrantesVerificadasDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroIntegrantesVerificadas }> {
    exigirAdministradorParametros(usuario);

    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('parametros_verificacion_cierre_grupo'))`,
      );
      const actual = await this.obtenerVigenteCon(manager, true);
      const revisionActual = actual?.revision ?? 0;
      if (revisionActual !== dto.expected_revision) {
        throw new ConflictException(
          'El parámetro cambió mientras estaba abierto. Actualiza la pantalla antes de publicar.',
        );
      }

      if (
        actual
        && actual.integrantes_verificadas_requeridas
          === dto.integrantes_verificadas_requeridas
      ) {
        return { parametro: actual };
      }

      const rows = await manager.query(
        `INSERT INTO parametros_verificacion_cierre_grupo_versiones
           (revision, integrantes_verificadas_requeridas, publicada_por)
         VALUES ($1, $2, $3)
         RETURNING id AS version_id, revision,
                   integrantes_verificadas_requeridas, publicada_at`,
        [
          revisionActual + 1,
          dto.integrantes_verificadas_requeridas,
          usuario.id,
        ],
      ) as ParametroRow[];
      const parametro = rows[0] ? this.mapear(rows[0]) : null;
      if (!parametro) {
        throw new ConflictException('No fue posible publicar el parámetro');
      }

      await registrarAuditoria(manager, {
        tabla: 'parametros_verificacion_cierre_grupo_versiones',
        registroId: parametro.version_id,
        accion: 'PAR_VER_CIERRE_PUB',
        usuarioId: usuario.id,
        datosAntes: actual ? { ...actual } : null,
        datosDespues: { ...parametro },
      });

      return { parametro };
    });
  }

  private async obtenerVigenteCon(
    executor: Pick<DataSource, 'query'> | { query: DataSource['query'] },
    bloquear = false,
  ): Promise<ParametroIntegrantesVerificadas | null> {
    const rows = await executor.query(
      `SELECT id AS version_id, revision,
              integrantes_verificadas_requeridas, publicada_at
         FROM parametros_verificacion_cierre_grupo_versiones
        ORDER BY revision DESC
        LIMIT 1${bloquear ? ' FOR UPDATE' : ''}`,
    ) as ParametroRow[];
    return rows[0] ? this.mapear(rows[0]) : null;
  }

  private mapear(row: ParametroRow): ParametroIntegrantesVerificadas {
    return {
      version_id: row.version_id,
      revision: Number(row.revision),
      integrantes_verificadas_requeridas: Number(
        row.integrantes_verificadas_requeridas,
      ),
      publicada_at: new Date(row.publicada_at).toISOString(),
    };
  }
}
