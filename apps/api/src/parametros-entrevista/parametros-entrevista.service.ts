import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { registrarAuditoria } from '../common/audit-log';
import { exigirAdministradorParametros, normalizarTextoCatalogo } from '../parametros-financieras/parametros-financieras.policy';
import { ActualizarParametroEntrevistaDto, CambiarEstadoParametroEntrevistaDto, CrearParametroEntrevistaDto, ReordenarParametrosEntrevistaDto } from './dto/parametro-entrevista.dto';
import { FAMILIAS_ENTREVISTA_EXTENSIBLES, FamiliaParametroEntrevista, ParametroEntrevistaOpcion } from './parametros-entrevista.types';

const filas = <T>(resultado: unknown): T[] => Array.isArray(resultado)
  ? (Array.isArray(resultado[0]) ? resultado[0] as T[] : resultado as T[])
  : [];

@Injectable()
export class ParametrosEntrevistaService {
  constructor(private readonly dataSource: DataSource) {}

  async listar(familia?: FamiliaParametroEntrevista, incluirInactivos = true) {
    const items = await this.dataSource.query(
      `SELECT id, familia, codigo, etiqueta, orden, activo, created_at, updated_at
       FROM parametros_entrevista_opciones
       WHERE ($1::varchar IS NULL OR familia = $1)
         AND ($2::boolean = TRUE OR activo = TRUE)
       ORDER BY familia, orden, id`,
      [familia ?? null, incluirInactivos],
    ) as ParametroEntrevistaOpcion[];
    return { items };
  }

  listarActivos() { return this.listar(undefined, false); }

  async crear(dto: CrearParametroEntrevistaDto, usuario: Usuario) {
    exigirAdministradorParametros(usuario);
    if (!FAMILIAS_ENTREVISTA_EXTENSIBLES.includes(dto.familia)) {
      throw new BadRequestException('Este catálogo permite editar etiquetas y orden, pero no agregar códigos nuevos');
    }
    const etiqueta = dto.etiqueta.trim().replace(/\s+/g, ' ');
    const normalizada = normalizarTextoCatalogo(etiqueta);
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext('parametros_entrevista:' || $1))`, [dto.familia]);
      const duplicado = await manager.query(
        `SELECT id, activo FROM parametros_entrevista_opciones
         WHERE familia = $1 AND etiqueta_normalizada = $2 FOR UPDATE`,
        [dto.familia, normalizada],
      ) as { id: string; activo: boolean }[];
      if (duplicado[0]) throw new ConflictException(duplicado[0].activo
        ? 'Esa opción ya existe en el catálogo'
        : 'Esa opción ya existe y está inactiva; reactívala desde la lista');
      const orden = await manager.query(
        `SELECT COALESCE(MAX(orden), 0) + 1 AS orden FROM parametros_entrevista_opciones WHERE familia = $1`,
        [dto.familia],
      ) as { orden: number }[];
      const insertadas = filas<ParametroEntrevistaOpcion>(await manager.query(
        `INSERT INTO parametros_entrevista_opciones
           (familia, codigo, etiqueta, etiqueta_normalizada, orden, created_by)
         VALUES ($1, gen_random_uuid()::text, $2, $3, $4, $5)
         RETURNING id, familia, codigo, etiqueta, orden, activo, created_at, updated_at`,
        [dto.familia, etiqueta, normalizada, orden[0].orden, usuario.id],
      ));
      const opcion = insertadas[0];
      await registrarAuditoria(manager, { tabla: 'parametros_entrevista_opciones', registroId: opcion.id,
        accion: 'PAR_ENT_ALTA', usuarioId: usuario.id, datosDespues: { ...opcion } });
      return { opcion };
    });
  }

  async actualizar(id: string, dto: ActualizarParametroEntrevistaDto, usuario: Usuario) {
    exigirAdministradorParametros(usuario);
    const etiqueta = dto.etiqueta.trim().replace(/\s+/g, ' ');
    const normalizada = normalizarTextoCatalogo(etiqueta);
    return this.dataSource.transaction(async (manager) => {
      const actuales = await manager.query(
        `SELECT id, familia, codigo, etiqueta, orden, activo, created_at, updated_at
         FROM parametros_entrevista_opciones WHERE id = $1 FOR UPDATE`, [id],
      ) as ParametroEntrevistaOpcion[];
      const anterior = actuales[0];
      if (!anterior) throw new NotFoundException('Opción no encontrada');
      if (anterior.etiqueta === etiqueta) return { opcion: anterior };
      const duplicado = await manager.query(
        `SELECT id FROM parametros_entrevista_opciones
         WHERE familia = $1 AND etiqueta_normalizada = $2 AND id <> $3`,
        [anterior.familia, normalizada, id],
      ) as { id: string }[];
      if (duplicado[0]) throw new ConflictException('Esa opción ya existe en el catálogo');
      const actualizadas = filas<ParametroEntrevistaOpcion>(await manager.query(
        `UPDATE parametros_entrevista_opciones SET etiqueta = $2, etiqueta_normalizada = $3,
           updated_by = $4, updated_at = NOW() WHERE id = $1
         RETURNING id, familia, codigo, etiqueta, orden, activo, created_at, updated_at`,
        [id, etiqueta, normalizada, usuario.id],
      ));
      const opcion = actualizadas[0];
      await registrarAuditoria(manager, { tabla: 'parametros_entrevista_opciones', registroId: id,
        accion: 'PAR_ENT_EDITA', usuarioId: usuario.id,
        datosAntes: { etiqueta: anterior.etiqueta }, datosDespues: { etiqueta } });
      return { opcion };
    });
  }

  async cambiarEstado(id: string, dto: CambiarEstadoParametroEntrevistaDto, usuario: Usuario) {
    exigirAdministradorParametros(usuario);
    return this.dataSource.transaction(async (manager) => {
      const actuales = await manager.query(
        `SELECT id, familia, codigo, etiqueta, orden, activo, created_at, updated_at
         FROM parametros_entrevista_opciones WHERE id = $1 FOR UPDATE`, [id],
      ) as ParametroEntrevistaOpcion[];
      const anterior = actuales[0];
      if (!anterior) throw new NotFoundException('Opción no encontrada');
      if (anterior.activo === dto.activo) return { opcion: anterior };
      if (!dto.activo) {
        const activas = await manager.query(
          `SELECT COUNT(*)::integer AS total FROM parametros_entrevista_opciones WHERE familia = $1 AND activo = TRUE`,
          [anterior.familia],
        ) as { total: number }[];
        if (activas[0].total <= 1) throw new BadRequestException('Cada catálogo debe conservar al menos una opción activa');
      }
      const actualizadas = filas<ParametroEntrevistaOpcion>(await manager.query(
        `UPDATE parametros_entrevista_opciones SET activo = $2, updated_by = $3, updated_at = NOW()
         WHERE id = $1 RETURNING id, familia, codigo, etiqueta, orden, activo, created_at, updated_at`,
        [id, dto.activo, usuario.id],
      ));
      const opcion = actualizadas[0];
      await registrarAuditoria(manager, { tabla: 'parametros_entrevista_opciones', registroId: id,
        accion: 'PAR_ENT_ESTADO', usuarioId: usuario.id,
        datosAntes: { activo: anterior.activo }, datosDespues: { activo: opcion.activo } });
      return { opcion };
    });
  }

  async reordenar(dto: ReordenarParametrosEntrevistaDto, usuario: Usuario) {
    exigirAdministradorParametros(usuario);
    return this.dataSource.transaction(async (manager) => {
      const anteriores = await manager.query(
        `SELECT id, familia, codigo, etiqueta, orden, activo, created_at, updated_at
         FROM parametros_entrevista_opciones WHERE familia = $1 ORDER BY orden, id FOR UPDATE`,
        [dto.familia],
      ) as ParametroEntrevistaOpcion[];
      const ids = new Set(anteriores.map((item) => item.id));
      if (anteriores.length !== dto.opcion_ids.length || dto.opcion_ids.some((id) => !ids.has(id))) {
        throw new BadRequestException('El orden debe incluir una sola vez todas las opciones del catálogo');
      }
      const actualizadas = filas<ParametroEntrevistaOpcion>(await manager.query(
        `UPDATE parametros_entrevista_opciones AS opcion
         SET orden = solicitado.orden::integer, updated_by = $3, updated_at = NOW()
         FROM unnest($2::uuid[]) WITH ORDINALITY AS solicitado(id, orden)
         WHERE opcion.familia = $1 AND opcion.id = solicitado.id
         RETURNING opcion.id, opcion.familia, opcion.codigo, opcion.etiqueta, opcion.orden,
                   opcion.activo, opcion.created_at, opcion.updated_at`,
        [dto.familia, dto.opcion_ids, usuario.id],
      ));
      actualizadas.sort((a, b) => a.orden - b.orden);
      if (!actualizadas[0]) throw new BadRequestException('El catálogo no contiene opciones para ordenar');
      await registrarAuditoria(manager, { tabla: 'parametros_entrevista_opciones', registroId: actualizadas[0].id,
        accion: 'PAR_ENT_ORDEN', usuarioId: usuario.id,
        datosAntes: { familia: dto.familia, ids: anteriores.map((x) => x.id) },
        datosDespues: { familia: dto.familia, ids: dto.opcion_ids } });
      return { items: actualizadas };
    });
  }
}
