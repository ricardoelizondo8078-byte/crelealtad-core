import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { registrarAuditoria } from '../common/audit-log';
import { fechaOperativaISO } from '../common/fecha-operativa';
import { PublicarCambioFinancieraDto } from './dto/publicar-cambio-financiera.dto';
import {
  depurarAliases,
  exigirAdministradorParametros,
  normalizarTextoCatalogo,
} from './parametros-financieras.policy';

const limpiarTextoOpcional = (value?: string): string | null => (
  value?.trim().replace(/\s+/g, ' ') || null
);

const limpiarTextoLibreOpcional = (value?: string): string | null => value?.trim() || null;

@Injectable()
export class ParametrosFinancierasService {
  constructor(private readonly dataSource: DataSource) {}

  async listar() {
    const hoy = fechaOperativaISO();
    const rows = await this.dataSource.query(`
      SELECT
        f.id,
        f.nombre_oficial,
        f.catalogo_base,
        f.created_at,
        COALESCE((
          SELECT MAX(version.revision)
          FROM public.financieras_competidoras_versiones AS version
          WHERE version.financiera_id = f.id
        ), 0)::integer AS ultima_revision,
        vigente.id AS vigente_id,
        vigente.revision AS vigente_revision,
        vigente.nombre_oficial AS vigente_nombre_oficial,
        vigente.clasificacion AS vigente_clasificacion,
        vigente.motivo AS vigente_motivo,
        vigente.aliases AS vigente_aliases,
        vigente.activa AS vigente_activa,
        vigente.vigencia_desde AS vigente_desde,
        vigente.vigencia_hasta AS vigente_hasta,
        vigente.semanas AS vigente_semanas,
        vigente.tasa AS vigente_tasa,
        vigente.seguro AS vigente_seguro,
        vigente.apertura AS vigente_apertura,
        vigente.retencion AS vigente_retencion,
        vigente.base AS vigente_base,
        vigente.refinanciamiento AS vigente_refinanciamiento,
        vigente.descripcion AS vigente_descripcion,
        COALESCE((
          SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
            'orden', sucursal.orden,
            'zona', sucursal.zona,
            'direccion', sucursal.direccion,
            'numero_asesoras', sucursal.numero_asesoras,
            'valor_sucursal', sucursal.valor_sucursal
          ) ORDER BY sucursal.orden)
          FROM public.financieras_competidoras_sucursales_version AS sucursal
          WHERE sucursal.version_id = vigente.id
        ), '[]'::JSONB) AS vigente_sucursales,
        programada.id AS programada_id,
        programada.revision AS programada_revision,
        programada.nombre_oficial AS programada_nombre_oficial,
        programada.clasificacion AS programada_clasificacion,
        programada.motivo AS programada_motivo,
        programada.aliases AS programada_aliases,
        programada.activa AS programada_activa,
        programada.vigencia_desde AS programada_desde,
        programada.vigencia_hasta AS programada_hasta,
        programada.semanas AS programada_semanas,
        programada.tasa AS programada_tasa,
        programada.seguro AS programada_seguro,
        programada.apertura AS programada_apertura,
        programada.retencion AS programada_retencion,
        programada.base AS programada_base,
        programada.refinanciamiento AS programada_refinanciamiento,
        programada.descripcion AS programada_descripcion,
        COALESCE((
          SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
            'orden', sucursal.orden,
            'zona', sucursal.zona,
            'direccion', sucursal.direccion,
            'numero_asesoras', sucursal.numero_asesoras,
            'valor_sucursal', sucursal.valor_sucursal
          ) ORDER BY sucursal.orden)
          FROM public.financieras_competidoras_sucursales_version AS sucursal
          WHERE sucursal.version_id = programada.id
        ), '[]'::JSONB) AS programada_sucursales,
        propuesta.id AS propuesta_id,
        propuesta.revision AS propuesta_revision,
        propuesta.nombre_oficial AS propuesta_nombre_oficial,
        propuesta.clasificacion AS propuesta_clasificacion,
        propuesta.motivo AS propuesta_motivo,
        propuesta.aliases AS propuesta_aliases,
        propuesta.activa AS propuesta_activa,
        propuesta.vigencia_desde AS propuesta_vigencia_desde,
        propuesta.semanas AS propuesta_semanas,
        propuesta.tasa AS propuesta_tasa,
        propuesta.seguro AS propuesta_seguro,
        propuesta.apertura AS propuesta_apertura,
        propuesta.retencion AS propuesta_retencion,
        propuesta.base AS propuesta_base,
        propuesta.refinanciamiento AS propuesta_refinanciamiento,
        propuesta.descripcion AS propuesta_descripcion,
        COALESCE((
          SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
            'orden', sucursal.orden,
            'zona', sucursal.zona,
            'direccion', sucursal.direccion,
            'numero_asesoras', sucursal.numero_asesoras,
            'valor_sucursal', sucursal.valor_sucursal
          ) ORDER BY sucursal.orden)
          FROM public.financieras_competidoras_sucursales_version AS sucursal
          WHERE sucursal.version_id = propuesta.id
        ), '[]'::JSONB) AS propuesta_sucursales,
        propuesta.estado AS propuesta_estado,
        propuesta.propuesta_at,
        propuesta.decidida_at
      FROM public.financieras_competidoras AS f
      LEFT JOIN LATERAL (
        SELECT version.*
        FROM public.financieras_competidoras_versiones AS version
        WHERE version.financiera_id = f.id
          AND version.estado = 'PUBLICADA'
          AND version.vigencia_desde <= $1::date
          AND (version.vigencia_hasta IS NULL OR version.vigencia_hasta >= $1::date)
        ORDER BY version.vigencia_desde DESC, version.revision DESC
        LIMIT 1
      ) AS vigente ON TRUE
      LEFT JOIN LATERAL (
        SELECT version.*
        FROM public.financieras_competidoras_versiones AS version
        WHERE version.financiera_id = f.id
          AND version.estado = 'PUBLICADA'
          AND version.vigencia_desde > $1::date
        ORDER BY version.vigencia_desde ASC, version.revision ASC
        LIMIT 1
      ) AS programada ON TRUE
      LEFT JOIN LATERAL (
        SELECT version.*
        FROM public.financieras_competidoras_versiones AS version
        WHERE version.financiera_id = f.id
          AND version.estado IN ('PENDIENTE_APROBACION', 'APROBADA')
        ORDER BY version.revision DESC
        LIMIT 1
      ) AS propuesta ON TRUE
      ORDER BY f.nombre_oficial ASC
    `, [hoy]) as Record<string, unknown>[];

    return {
      items: rows.map((row) => ({
        id: row.id,
        nombre: row.nombre_oficial,
        catalogo_base: row.catalogo_base,
        created_at: row.created_at,
        ultima_revision: Number(row.ultima_revision ?? 0),
        vigente: row.vigente_id ? {
          id: row.vigente_id,
          revision: Number(row.vigente_revision),
          nombre_oficial: row.vigente_nombre_oficial,
          clasificacion: row.vigente_clasificacion,
          motivo: row.vigente_motivo,
          aliases: row.vigente_aliases ?? [],
          activa: row.vigente_activa,
          vigencia_desde: row.vigente_desde,
          vigencia_hasta: row.vigente_hasta,
          semanas: row.vigente_semanas,
          tasa: row.vigente_tasa,
          seguro: row.vigente_seguro,
          apertura: row.vigente_apertura,
          retencion: row.vigente_retencion,
          base: row.vigente_base,
          refinanciamiento: row.vigente_refinanciamiento,
          descripcion: row.vigente_descripcion,
          sucursales: row.vigente_sucursales ?? [],
        } : null,
        programada: row.programada_id ? {
          id: row.programada_id,
          revision: Number(row.programada_revision),
          nombre_oficial: row.programada_nombre_oficial,
          clasificacion: row.programada_clasificacion,
          motivo: row.programada_motivo,
          aliases: row.programada_aliases ?? [],
          activa: row.programada_activa,
          vigencia_desde: row.programada_desde,
          vigencia_hasta: row.programada_hasta,
          semanas: row.programada_semanas,
          tasa: row.programada_tasa,
          seguro: row.programada_seguro,
          apertura: row.programada_apertura,
          retencion: row.programada_retencion,
          base: row.programada_base,
          refinanciamiento: row.programada_refinanciamiento,
          descripcion: row.programada_descripcion,
          sucursales: row.programada_sucursales ?? [],
        } : null,
        propuesta: row.propuesta_id ? {
          id: row.propuesta_id,
          revision: Number(row.propuesta_revision),
          nombre_oficial: row.propuesta_nombre_oficial,
          clasificacion: row.propuesta_clasificacion,
          motivo: row.propuesta_motivo,
          aliases: row.propuesta_aliases ?? [],
          activa: row.propuesta_activa,
          vigencia_desde: row.propuesta_vigencia_desde,
          semanas: row.propuesta_semanas,
          tasa: row.propuesta_tasa,
          seguro: row.propuesta_seguro,
          apertura: row.propuesta_apertura,
          retencion: row.propuesta_retencion,
          base: row.propuesta_base,
          refinanciamiento: row.propuesta_refinanciamiento,
          descripcion: row.propuesta_descripcion,
          sucursales: row.propuesta_sucursales ?? [],
          estado: row.propuesta_estado,
          propuesta_at: row.propuesta_at,
          decidida_at: row.decidida_at,
        } : null,
      })),
    };
  }

  async listarHistorial(financieraId: string) {
    const financiera = await this.dataSource.query(
      `SELECT id, nombre_oficial
       FROM public.financieras_competidoras
       WHERE id = $1`,
      [financieraId],
    ) as { id: string; nombre_oficial: string }[];
    if (!financiera[0]) throw new NotFoundException('Financiera no encontrada');

    const versiones = await this.dataSource.query(
      `SELECT
         version.id, version.revision, version.nombre_oficial, version.clasificacion,
         version.motivo, version.aliases, version.activa,
         version.semanas, version.tasa, version.seguro, version.apertura,
         version.retencion, version.base, version.refinanciamiento, version.descripcion,
         COALESCE((
           SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
             'orden', sucursal.orden,
             'zona', sucursal.zona,
             'direccion', sucursal.direccion,
             'numero_asesoras', sucursal.numero_asesoras,
             'valor_sucursal', sucursal.valor_sucursal
           ) ORDER BY sucursal.orden)
           FROM public.financieras_competidoras_sucursales_version AS sucursal
           WHERE sucursal.version_id = version.id
         ), '[]'::JSONB) AS sucursales,
         vigencia_desde, vigencia_hasta, estado,
         propuesta_por, propuesta_at, decidida_por, decidida_at,
         motivo_rechazo, publicada_por, publicada_at
       FROM public.financieras_competidoras_versiones AS version
       WHERE version.financiera_id = $1
       ORDER BY version.revision DESC`,
      [financieraId],
    );

    return {
      financiera: { id: financiera[0].id, nombre: financiera[0].nombre_oficial },
      versiones,
    };
  }

  async listarVigentes(fecha?: string) {
    const fechaConsulta = fecha?.trim() || fechaOperativaISO();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaConsulta)) {
      throw new BadRequestException('La fecha de consulta debe usar el formato AAAA-MM-DD');
    }

    const items = await this.dataSource.query(
      `WITH version_vigente AS (
         SELECT DISTINCT ON (version.financiera_id)
           version.financiera_id,
           version.nombre_oficial,
           version.clasificacion,
           version.motivo,
           version.aliases,
           version.activa,
           version.vigencia_desde,
           version.vigencia_hasta,
           version.revision
         FROM public.financieras_competidoras_versiones AS version
         WHERE version.estado = 'PUBLICADA'
           AND version.vigencia_desde <= $1::date
           AND (version.vigencia_hasta IS NULL OR version.vigencia_hasta >= $1::date)
         ORDER BY version.financiera_id, version.vigencia_desde DESC, version.revision DESC
       )
         SELECT
           financiera.id,
           COALESCE(version.nombre_oficial, financiera.nombre_oficial) AS nombre,
          COALESCE(
            NULLIF(BTRIM(version.aliases[1]), ''),
             version.nombre_oficial,
             financiera.nombre_oficial
          ) AS alias_captura,
         version.clasificacion,
         version.motivo,
         COALESCE(version.aliases, ARRAY[]::VARCHAR[]) AS aliases,
         version.vigencia_desde,
         version.vigencia_hasta,
         version.revision
       FROM public.financieras_competidoras AS financiera
       LEFT JOIN version_vigente AS version
         ON version.financiera_id = financiera.id
       WHERE version.activa = TRUE
          OR (version.financiera_id IS NULL AND financiera.catalogo_base = TRUE)
       ORDER BY alias_captura ASC`,
      [fechaConsulta],
    );

    return { fecha: fechaConsulta, items };
  }

  async publicarCambio(dto: PublicarCambioFinancieraDto, usuario: Usuario) {
    exigirAdministradorParametros(usuario);
    const vigenciaDesde = dto.vigencia_desde?.trim() || fechaOperativaISO();
    const clasificacion = dto.clasificacion ?? null;
    const motivo = dto.motivo?.trim() || null;
    const activa = dto.activa ?? true;
    const producto = {
      semanas: limpiarTextoOpcional(dto.semanas),
      tasa: limpiarTextoOpcional(dto.tasa),
      seguro: limpiarTextoOpcional(dto.seguro),
      apertura: limpiarTextoOpcional(dto.apertura),
      retencion: limpiarTextoOpcional(dto.retencion),
      base: limpiarTextoOpcional(dto.base),
      refinanciamiento: limpiarTextoOpcional(dto.refinanciamiento),
      descripcion: limpiarTextoLibreOpcional(dto.descripcion),
    };
    const sucursales = (dto.sucursales ?? []).map((sucursal, index) => ({
      orden: index + 1,
      zona: limpiarTextoOpcional(sucursal.zona),
      direccion: limpiarTextoOpcional(sucursal.direccion),
      numero_asesoras: sucursal.numero_asesoras ?? null,
      valor_sucursal: limpiarTextoOpcional(sucursal.valor_sucursal),
    }));
    this.exigirFechaNoPasada(vigenciaDesde);

    return this.dataSource.transaction(async (manager) => {
      let financieraId = dto.financiera_id;
      let nombreOficialAnterior: string | null = null;
      const { originales: aliases, normalizados: aliasesNormalizados } = depurarAliases(
        dto.aliases ?? [],
      );
      let nombreOficial = dto.nombre?.trim().replace(/\s+/g, ' ') ?? '';
      let nombreNormalizado = normalizarTextoCatalogo(nombreOficial);

      if (financieraId) {
        const financiera = await manager.query(
          `SELECT id, nombre_oficial, nombre_normalizado
           FROM public.financieras_competidoras
           WHERE id = $1
           FOR UPDATE`,
          [financieraId],
        ) as { id: string; nombre_oficial: string; nombre_normalizado: string }[];
        if (!financiera[0]) throw new NotFoundException('Financiera no encontrada');
        nombreOficialAnterior = financiera[0].nombre_oficial;
        if (!nombreOficial) {
          nombreOficial = financiera[0].nombre_oficial;
          nombreNormalizado = financiera[0].nombre_normalizado;
        }
      } else {
        if (!nombreOficial || nombreOficial.length < 2) {
          nombreOficial = aliases[0] ?? '';
          nombreNormalizado = normalizarTextoCatalogo(nombreOficial);
        }
        if (!nombreOficial || nombreOficial.length < 2) {
          throw new BadRequestException(
            'Escribe al menos el alias o el nombre oficial para identificar la financiera nueva',
          );
        }
        const duplicada = await manager.query(
          `SELECT id FROM public.financieras_competidoras WHERE nombre_normalizado = $1`,
          [nombreNormalizado],
        ) as { id: string }[];
        if (duplicada[0]) throw new ConflictException('Ya existe una financiera con ese nombre');

        const insertada = await manager.query(
          `INSERT INTO public.financieras_competidoras
             (nombre_oficial, nombre_normalizado, created_by)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [nombreOficial, nombreNormalizado, usuario.id],
        ) as { id: string }[];
        financieraId = insertada[0].id;
      }

      await this.exigirNombresDisponibles(
        manager,
        financieraId,
        [nombreNormalizado, ...aliasesNormalizados],
      );

      const estadoAbierto = await manager.query(
        `SELECT id FROM public.financieras_competidoras_versiones
         WHERE financiera_id = $1
           AND estado IN ('PENDIENTE_APROBACION', 'APROBADA')
         FOR UPDATE`,
        [financieraId],
      ) as { id: string }[];
      if (estadoAbierto[0]) {
        throw new ConflictException(
          'La financiera conserva un cambio pendiente del flujo anterior',
        );
      }

      const ultimaRevision = await manager.query(
        `SELECT COALESCE(MAX(revision), 0)::integer AS revision
         FROM public.financieras_competidoras_versiones
         WHERE financiera_id = $1`,
        [financieraId],
      ) as { revision: number }[];
      const revisionActual = Number(ultimaRevision[0]?.revision ?? 0);
      if (dto.expected_revision !== undefined && dto.expected_revision !== revisionActual) {
        throw new ConflictException('El catálogo cambió; actualiza la pantalla antes de continuar');
      }

      const solapada = await manager.query(
        `SELECT id
         FROM public.financieras_competidoras_versiones
         WHERE financiera_id = $1
           AND estado = 'PUBLICADA'
           AND vigencia_desde >= $2::date
         FOR UPDATE`,
        [financieraId, vigenciaDesde],
      ) as { id: string }[];
      if (solapada[0]) {
        throw new ConflictException('Ya existe una publicación con la misma vigencia o una posterior');
      }

      await manager.query(
        `UPDATE public.financieras_competidoras
         SET nombre_oficial = $2,
             nombre_normalizado = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [financieraId, nombreOficial, nombreNormalizado],
      );

      await manager.query(
        `UPDATE public.financieras_competidoras_versiones
         SET vigencia_hasta = $2::date - 1
         WHERE financiera_id = $1
           AND estado = 'PUBLICADA'
           AND vigencia_desde < $2::date
           AND (vigencia_hasta IS NULL OR vigencia_hasta >= $2::date)`,
        [financieraId, vigenciaDesde],
      );

      const version = await manager.query(
        `INSERT INTO public.financieras_competidoras_versiones (
           financiera_id, revision, nombre_oficial, nombre_normalizado, clasificacion, motivo,
           aliases, aliases_normalizados, activa, vigencia_desde,
           semanas, tasa, seguro, apertura, retencion, base, refinanciamiento, descripcion,
           estado, propuesta_por, decidida_por, decidida_at, publicada_por, publicada_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::varchar[], $8::varchar[], $9, $10::date,
           $11, $12, $13, $14, $15, $16, $17, $18,
           'PUBLICADA', $19, $19, NOW(), $19, NOW())
         RETURNING id`,
        [
          financieraId,
          revisionActual + 1,
          nombreOficial,
          nombreNormalizado,
          clasificacion,
          motivo,
          aliases,
          aliasesNormalizados,
          activa,
          vigenciaDesde,
          producto.semanas,
          producto.tasa,
          producto.seguro,
          producto.apertura,
          producto.retencion,
          producto.base,
          producto.refinanciamiento,
          producto.descripcion,
          usuario.id,
        ],
      ) as { id: string }[];

      if (sucursales.length > 0) {
        await manager.query(
          `INSERT INTO public.financieras_competidoras_sucursales_version (
             version_id, orden, zona, direccion, numero_asesoras, valor_sucursal
           )
           SELECT $1, sucursal.orden, sucursal.zona, sucursal.direccion,
             sucursal.numero_asesoras, sucursal.valor_sucursal
           FROM JSONB_TO_RECORDSET($2::JSONB) AS sucursal(
             orden SMALLINT,
             zona VARCHAR(120),
             direccion VARCHAR(250),
             numero_asesoras INTEGER,
             valor_sucursal VARCHAR(120)
           )`,
          [version[0].id, JSON.stringify(sucursales)],
        );
      }

      await registrarAuditoria(manager, {
        tabla: 'financieras_competidoras_versiones',
        registroId: version[0].id,
        accion: 'FIN_PUBLICADA',
        usuarioId: usuario.id,
        datosAntes: {
          nombre_oficial: nombreOficialAnterior,
          revision: revisionActual || null,
        },
        datosDespues: {
          estado: 'PUBLICADA',
          modo: 'PUBLICACION_DIRECTA_ADMIN',
          financiera_id: financieraId,
          revision: revisionActual + 1,
          clasificacion,
          activa,
          vigencia_desde: vigenciaDesde,
          nombre_oficial: nombreOficial,
          alias_captura: aliases[0] ?? nombreOficial,
          producto,
          numero_sucursales: sucursales.length,
          sucursales,
        },
      });

      return this.obtenerVersion(manager, version[0].id);
    });
  }

  private exigirFechaNoPasada(fecha: string): void {
    const hoy = fechaOperativaISO();
    if (fecha < hoy) {
      throw new BadRequestException('La vigencia debe iniciar hoy o en una fecha futura');
    }
  }

  private async exigirNombresDisponibles(
    manager: EntityManager,
    financieraId: string,
    nombresNormalizados: string[],
  ): Promise<void> {
    if (nombresNormalizados.length === 0) return;
    const conflicto = await manager.query(
      `SELECT financiera.id
       FROM public.financieras_competidoras AS financiera
       WHERE financiera.id <> $1
         AND (
           financiera.nombre_normalizado = ANY($2::varchar[])
           OR EXISTS (
             SELECT 1
             FROM public.financieras_competidoras_versiones AS version
             WHERE version.financiera_id = financiera.id
               AND version.estado IN ('PENDIENTE_APROBACION', 'APROBADA', 'PUBLICADA')
               AND version.aliases_normalizados && $2::varchar[]
           )
         )
       LIMIT 1`,
      [financieraId, nombresNormalizados],
    ) as { id: string }[];
    if (conflicto[0]) {
      throw new ConflictException('El nombre o uno de los alias ya pertenece a otra financiera');
    }
  }

  private async obtenerVersion(manager: EntityManager, versionId: string) {
    const rows = await manager.query(
      `SELECT version.*,
         COALESCE((
           SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
             'orden', sucursal.orden,
             'zona', sucursal.zona,
             'direccion', sucursal.direccion,
             'numero_asesoras', sucursal.numero_asesoras,
             'valor_sucursal', sucursal.valor_sucursal
           ) ORDER BY sucursal.orden)
           FROM public.financieras_competidoras_sucursales_version AS sucursal
           WHERE sucursal.version_id = version.id
         ), '[]'::JSONB) AS sucursales,
         financiera.nombre_oficial AS nombre_actual
       FROM public.financieras_competidoras_versiones AS version
       INNER JOIN public.financieras_competidoras AS financiera
         ON financiera.id = version.financiera_id
       WHERE version.id = $1`,
      [versionId],
    );
    return rows[0];
  }
}
