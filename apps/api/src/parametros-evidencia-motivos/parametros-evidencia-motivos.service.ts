import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { registrarAuditoria } from '../common/audit-log';
import {
  exigirAdministradorParametros,
  normalizarTextoCatalogo,
} from '../parametros-financieras/parametros-financieras.policy';
import { ActualizarMotivoClasificacionEvidenciaDto } from './dto/actualizar-motivo-clasificacion-evidencia.dto';
import { CambiarEstadoMotivoClasificacionEvidenciaDto } from './dto/cambiar-estado-motivo-clasificacion-evidencia.dto';
import { CrearMotivoClasificacionEvidenciaDto } from './dto/crear-motivo-clasificacion-evidencia.dto';
import { ReordenarMotivosClasificacionEvidenciaDto } from './dto/reordenar-motivos-clasificacion-evidencia.dto';
import {
  ClasificacionMotivoEvidencia,
  MotivoClasificacionEvidencia,
} from './parametros-evidencia-motivos.types';

const extraerFilasMutacion = <T>(resultado: unknown): T[] => {
  if (!Array.isArray(resultado)) return [];
  return Array.isArray(resultado[0]) ? resultado[0] as T[] : resultado as T[];
};

@Injectable()
export class ParametrosEvidenciaMotivosService {
  constructor(private readonly dataSource: DataSource) {}

  async listar(
    clasificacion?: ClasificacionMotivoEvidencia,
    incluirInactivos = true,
  ): Promise<{ items: MotivoClasificacionEvidencia[] }> {
    const items = await this.dataSource.query(
      `SELECT id, clasificacion, concepto, orden, activo, created_at, updated_at
       FROM motivos_clasificacion_evidencia
       WHERE ($1::varchar IS NULL OR clasificacion = $1)
         AND ($2::boolean = TRUE OR activo = TRUE)
       ORDER BY clasificacion, orden, id`,
      [clasificacion ?? null, incluirInactivos],
    ) as MotivoClasificacionEvidencia[];
    return { items };
  }

  listarActivos(): Promise<{ items: MotivoClasificacionEvidencia[] }> {
    return this.listar(undefined, false);
  }

  async crear(
    dto: CrearMotivoClasificacionEvidenciaDto,
    usuario: Usuario,
  ): Promise<{ motivo: MotivoClasificacionEvidencia }> {
    exigirAdministradorParametros(usuario);
    const concepto = dto.concepto.trim().replace(/\s+/g, ' ');
    const conceptoNormalizado = normalizarTextoCatalogo(concepto);
    if (concepto.length < 2) {
      throw new BadRequestException('Escribe un concepto de al menos 2 caracteres');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('motivos_clasificacion_evidencia:' || $1))`,
        [dto.clasificacion],
      );
      const duplicado = await manager.query(
        `SELECT id, activo
         FROM motivos_clasificacion_evidencia
         WHERE clasificacion = $1
           AND concepto_normalizado = $2
         FOR UPDATE`,
        [dto.clasificacion, conceptoNormalizado],
      ) as { id: string; activo: boolean }[];
      if (duplicado[0]) {
        throw new ConflictException(
          duplicado[0].activo
            ? 'Ese concepto ya existe para este color'
            : 'Ese concepto ya existe y está inactivo; reactívalo desde la lista',
        );
      }

      const siguienteOrden = await manager.query(
        `SELECT COALESCE(MAX(orden), 0) + 1 AS orden
         FROM motivos_clasificacion_evidencia
         WHERE clasificacion = $1`,
        [dto.clasificacion],
      ) as { orden: number }[];

      const insertados = extraerFilasMutacion<MotivoClasificacionEvidencia>(await manager.query(
        `INSERT INTO motivos_clasificacion_evidencia
           (clasificacion, concepto, concepto_normalizado, orden, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, clasificacion, concepto, orden, activo, created_at, updated_at`,
        [dto.clasificacion, concepto, conceptoNormalizado, siguienteOrden[0].orden, usuario.id],
      ));
      const motivo = insertados[0];

      await registrarAuditoria(manager, {
        tabla: 'motivos_clasificacion_evidencia',
        registroId: motivo.id,
        accion: 'MOT_EVI_ALTA',
        usuarioId: usuario.id,
        datosDespues: {
          clasificacion: motivo.clasificacion,
          concepto: motivo.concepto,
          orden: motivo.orden,
          activo: true,
        },
      });

      return { motivo };
    });
  }

  async reordenar(
    dto: ReordenarMotivosClasificacionEvidenciaDto,
    usuario: Usuario,
  ): Promise<{ items: MotivoClasificacionEvidencia[] }> {
    exigirAdministradorParametros(usuario);
    return this.dataSource.transaction(async (manager) => {
      const anteriores = await manager.query(
        `SELECT id, clasificacion, concepto, orden, activo, created_at, updated_at
         FROM motivos_clasificacion_evidencia
         WHERE clasificacion = $1
         ORDER BY orden, id
         FOR UPDATE`,
        [dto.clasificacion],
      ) as MotivoClasificacionEvidencia[];

      const idsExistentes = new Set(anteriores.map((item) => item.id));
      if (
        anteriores.length !== dto.motivo_ids.length
        || dto.motivo_ids.some((id) => !idsExistentes.has(id))
      ) {
        throw new BadRequestException(
          'El orden debe incluir una sola vez todos los motivos de esta clasificación',
        );
      }

      if (anteriores.every((item, index) => item.id === dto.motivo_ids[index])) {
        return { items: anteriores };
      }

      const actualizados = extraerFilasMutacion<MotivoClasificacionEvidencia>(await manager.query(
        `UPDATE motivos_clasificacion_evidencia AS motivo
         SET orden = solicitado.orden::integer,
             updated_by = $3,
             updated_at = NOW()
         FROM unnest($2::uuid[]) WITH ORDINALITY AS solicitado(id, orden)
         WHERE motivo.clasificacion = $1
           AND motivo.id = solicitado.id
         RETURNING motivo.id, motivo.clasificacion, motivo.concepto, motivo.orden,
                   motivo.activo, motivo.created_at, motivo.updated_at`,
        [dto.clasificacion, dto.motivo_ids, usuario.id],
      ));
      actualizados.sort((a, b) => a.orden - b.orden);

      const ordenAnterior = new Map(anteriores.map((item) => [item.id, item.orden]));
      for (const motivo of actualizados) {
        if (ordenAnterior.get(motivo.id) === motivo.orden) continue;
        await registrarAuditoria(manager, {
          tabla: 'motivos_clasificacion_evidencia',
          registroId: motivo.id,
          accion: 'MOT_EVI_ORDEN',
          usuarioId: usuario.id,
          datosAntes: { clasificacion: motivo.clasificacion, orden: ordenAnterior.get(motivo.id) },
          datosDespues: { clasificacion: motivo.clasificacion, orden: motivo.orden },
        });
      }

      return { items: actualizados };
    });
  }

  async cambiarEstado(
    motivoId: string,
    dto: CambiarEstadoMotivoClasificacionEvidenciaDto,
    usuario: Usuario,
  ): Promise<{ motivo: MotivoClasificacionEvidencia }> {
    exigirAdministradorParametros(usuario);
    return this.dataSource.transaction(async (manager) => {
      const existentes = await manager.query(
        `SELECT id, clasificacion, concepto, orden, activo, created_at, updated_at
         FROM motivos_clasificacion_evidencia
         WHERE id = $1
         FOR UPDATE`,
        [motivoId],
      ) as MotivoClasificacionEvidencia[];
      const anterior = existentes[0];
      if (!anterior) throw new NotFoundException('Motivo de clasificación no encontrado');
      if (anterior.activo === dto.activo) return { motivo: anterior };

      const actualizados = extraerFilasMutacion<MotivoClasificacionEvidencia>(await manager.query(
        `UPDATE motivos_clasificacion_evidencia
         SET activo = $2,
             updated_by = $3,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, clasificacion, concepto, orden, activo, created_at, updated_at`,
        [motivoId, dto.activo, usuario.id],
      ));
      const motivo = actualizados[0];

      await registrarAuditoria(manager, {
        tabla: 'motivos_clasificacion_evidencia',
        registroId: motivo.id,
        accion: 'MOT_EVI_ESTADO',
        usuarioId: usuario.id,
        datosAntes: { activo: anterior.activo },
        datosDespues: { activo: motivo.activo },
      });

      return { motivo };
    });
  }

  async actualizarConcepto(
    motivoId: string,
    dto: ActualizarMotivoClasificacionEvidenciaDto,
    usuario: Usuario,
  ): Promise<{ motivo: MotivoClasificacionEvidencia }> {
    exigirAdministradorParametros(usuario);
    const concepto = dto.concepto.trim().replace(/\s+/g, ' ');
    const conceptoNormalizado = normalizarTextoCatalogo(concepto);
    if (concepto.length < 2) {
      throw new BadRequestException('Escribe un concepto de al menos 2 caracteres');
    }

    return this.dataSource.transaction(async (manager) => {
      const existentes = await manager.query(
        `SELECT motivo.id, motivo.clasificacion, motivo.concepto, motivo.orden, motivo.activo,
                motivo.created_at, motivo.updated_at,
                EXISTS (
                  SELECT 1
                  FROM verificacion_entrevista_evidencias AS evidencia
                  WHERE evidencia.motivo_clasificacion_id = motivo.id
                ) AS utilizado
         FROM motivos_clasificacion_evidencia AS motivo
         WHERE motivo.id = $1
         FOR UPDATE`,
        [motivoId],
      ) as (MotivoClasificacionEvidencia & { utilizado: boolean })[];
      const anterior = existentes[0];
      if (!anterior) throw new NotFoundException('Motivo de clasificación no encontrado');
      if (anterior.concepto === concepto) return { motivo: anterior };
      if (anterior.utilizado) {
        throw new ConflictException(
          'Este motivo ya fue utilizado; desactívalo y crea uno nuevo para conservar el historial',
        );
      }

      const duplicados = await manager.query(
        `SELECT id
         FROM motivos_clasificacion_evidencia
         WHERE clasificacion = $1
           AND concepto_normalizado = $2
           AND id <> $3
         FOR UPDATE`,
        [anterior.clasificacion, conceptoNormalizado, motivoId],
      ) as { id: string }[];
      if (duplicados[0]) {
        throw new ConflictException('Ese concepto ya existe para este color');
      }

      const actualizados = extraerFilasMutacion<MotivoClasificacionEvidencia>(await manager.query(
        `UPDATE motivos_clasificacion_evidencia
         SET concepto = $2,
             concepto_normalizado = $3,
             updated_by = $4,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, clasificacion, concepto, orden, activo, created_at, updated_at`,
        [motivoId, concepto, conceptoNormalizado, usuario.id],
      ));
      const motivo = actualizados[0];

      await registrarAuditoria(manager, {
        tabla: 'motivos_clasificacion_evidencia',
        registroId: motivo.id,
        accion: 'MOT_EVI_EDITA',
        usuarioId: usuario.id,
        datosAntes: { concepto: anterior.concepto },
        datosDespues: { concepto: motivo.concepto },
      });

      return { motivo };
    });
  }

  async obtenerActivo(
    motivoId: string,
    clasificacion: ClasificacionMotivoEvidencia,
    permitirInactivo = false,
  ): Promise<MotivoClasificacionEvidencia> {
    const motivos = await this.dataSource.query(
      `SELECT id, clasificacion, concepto, orden, activo, created_at, updated_at
       FROM motivos_clasificacion_evidencia
       WHERE id = $1
         AND clasificacion = $2
         AND ($3::boolean = TRUE OR activo = TRUE)`,
      [motivoId, clasificacion, permitirInactivo],
    ) as MotivoClasificacionEvidencia[];
    if (!motivos[0]) {
      throw new BadRequestException(
        'El motivo seleccionado no corresponde al color o ya no está disponible',
      );
    }
    return motivos[0];
  }
}
