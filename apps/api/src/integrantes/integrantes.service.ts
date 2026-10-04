import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegranteEntity, IntegranteEstado, MotivoRetiroIntegrante } from './integrante.entity';
import { PersonaEntity } from '../personas/persona.entity';
import { SolicitudesService } from '../solicitudes/solicitudes.service';
import { obtenerMontoMaximoSolicitable } from '../solicitudes/monto-solicitado.policy';
import { ExpedienteEntity, ExpedienteEstado } from '../expedientes/expediente.entity';
import { SolicitudCoreEntity } from '../solicitudes/entities/solicitud-core.entity';
import { SolicitudDocumentosEntity } from '../solicitudes/entities/solicitud-documentos.entity';
import {
  TipoDocumentoRevision,
  TIPOS_DOCUMENTO_REVISION,
} from './integrantes-revision-documental.types';
import { calcularEdad, superaLimiteEdad } from '../common/edad.policy';
import {
  AccessScope,
  assertExpedienteAccess,
  assertIntegranteAccess,
} from '../common/access-scope';
import { registrarAuditoria } from '../common/audit-log';

const CAMPOS_DOCUMENTO_REVISION: Record<
  TipoDocumentoRevision,
  { ruta: string; fecha: string }
> = {
  ine: { ruta: 'doc_ine_ruta', fecha: 'doc_ine_fecha' },
  comprobante: { ruta: 'doc_comprobante_ruta', fecha: 'doc_comprobante_fecha' },
  ine_beneficiario: {
    ruta: 'doc_ine_beneficiario_ruta',
    fecha: 'doc_ine_beneficiario_fecha',
  },
  solicitud_firmada: {
    ruta: 'doc_solicitud_firmada_ruta',
    fecha: 'doc_solicitud_firmada_fecha',
  },
};

export interface RetirarIntegranteInput {
  motivo_retiro: MotivoRetiroIntegrante;
  motivo_retiro_detalle?: string;
}

export interface UpdateIntegranteInput {
  nombres?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  telefono?: string;
  telefonoSecundario?: string;
  telefono_secundario?: string;
  montoSolicitado?: number;
}

interface PersonaViewData {
  nombres?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  nombre: string;
  telefono: string | null;
  telefonoSecundario?: string | null;
  montoSolicitado: number | null;
  montoProspectivo: number | null;
  fechaNacimiento?: string | Date | null;
}

interface HistorialCreditoInterno {
  tieneHistorial: boolean | null;
  creditosParticipados: number | null;
  resumen: ResumenHistorialCreditoInterno | null;
}

interface RegistroHistorialCreditoInterno {
  cicloNumero: number | null;
  montoAutorizado: number;
  fechaReferencia: string | null;
}

interface ResumenHistorialCreditoInterno {
  total_ciclos: number;
  monto_maximo: {
    monto_autorizado: number;
    ciclos: number[];
  };
  monto_minimo: {
    monto_autorizado: number;
    ciclos: number[];
  };
  ultimos_ciclos: Array<{
    ciclo_numero: number | null;
    monto_autorizado: number;
  }>;
}

const normalizarHistorialCredito = (value: unknown): RegistroHistorialCreditoInterno[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const montoAutorizado = Number(record.monto_autorizado);
    const cicloNumero = record.ciclo_numero == null ? null : Number(record.ciclo_numero);
    if (!Number.isFinite(montoAutorizado) || montoAutorizado <= 0) return [];

    return [{
      cicloNumero: cicloNumero != null && Number.isInteger(cicloNumero) && cicloNumero > 0
        ? cicloNumero
        : null,
      montoAutorizado,
      fechaReferencia: typeof record.fecha_referencia === 'string'
        ? record.fecha_referencia
        : null,
    }];
  });
};

const resumirHistorialCredito = (
  registros: RegistroHistorialCreditoInterno[],
): ResumenHistorialCreditoInterno | null => {
  if (registros.length === 0) return null;

  const ordenados = [...registros].sort((a, b) => {
    const fechaA = a.fechaReferencia == null ? Number.NEGATIVE_INFINITY : Date.parse(a.fechaReferencia);
    const fechaB = b.fechaReferencia == null ? Number.NEGATIVE_INFINITY : Date.parse(b.fechaReferencia);
    const fechaNormalizadaA = Number.isFinite(fechaA) ? fechaA : Number.NEGATIVE_INFINITY;
    const fechaNormalizadaB = Number.isFinite(fechaB) ? fechaB : Number.NEGATIVE_INFINITY;
    if (fechaNormalizadaA !== fechaNormalizadaB) return fechaNormalizadaB - fechaNormalizadaA;
    return (b.cicloNumero ?? Number.NEGATIVE_INFINITY)
      - (a.cicloNumero ?? Number.NEGATIVE_INFINITY);
  });
  const montos = ordenados.map((registro) => registro.montoAutorizado);
  const montoMaximo = Math.max(...montos);
  const montoMinimo = Math.min(...montos);
  const ciclosPorMonto = (monto: number): number[] => Array.from(new Set(
    ordenados
      .filter((registro) => registro.montoAutorizado === monto && registro.cicloNumero != null)
      .map((registro) => registro.cicloNumero as number),
  )).sort((a, b) => b - a);

  return {
    total_ciclos: ordenados.length,
    monto_maximo: {
      monto_autorizado: montoMaximo,
      ciclos: ciclosPorMonto(montoMaximo),
    },
    monto_minimo: {
      monto_autorizado: montoMinimo,
      ciclos: ciclosPorMonto(montoMinimo),
    },
    ultimos_ciclos: ordenados.slice(0, 5).map((registro) => ({
      ciclo_numero: registro.cicloNumero,
      monto_autorizado: registro.montoAutorizado,
    })),
  };
};

@Injectable()
export class IntegrantesService {
  constructor(
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    @InjectRepository(PersonaEntity)
    private readonly personaRepository: Repository<PersonaEntity>,
    private readonly solicitudesService: SolicitudesService,
  ) {}

  async listByExpediente(expedienteId: string, scope: AccessScope): Promise<any[]> {
    await assertExpedienteAccess(this.integranteRepository.manager, expedienteId, scope);
    try {
      // Usar LEFT JOIN para evitar N+1 query problem
      // Antes: 10 integrantes = 11 queries (1 + 10)
      // Ahora: 10 integrantes = 1 query (90% improvement)
      const integrantes = await this.integranteRepository
        .createQueryBuilder('integrante')
        .leftJoinAndSelect('integrante.persona', 'persona')
        .leftJoinAndSelect('integrante.expediente', 'expediente')
        .where('integrante.expediente_id = :expedienteId', { expedienteId })
        .orderBy('integrante.created_at', 'ASC')
        .getMany();

      const montosComparables = await this.getMontosComparables(
        integrantes.map((integrante) => integrante.id),
      );
      const historialInterno = await this.getHistorialInterno(
        integrantes.map((integrante) => integrante.id),
      );
      const montoMaximoSolicitable = await obtenerMontoMaximoSolicitable(
        this.integranteRepository.manager,
        expedienteId,
      );

      return integrantes.map((integrante) => {
        const persona = integrante.persona;
        const nombre = persona?.nombre_completo || '';
        const telefono = persona?.telefono ?? null;
        const montos = montosComparables.get(integrante.id);
        const historial = historialInterno.get(integrante.id);
        const edad = calcularEdad(montos?.fechaNacimiento ?? persona?.fecha_nac);
        const montoSolicitado = montos?.montoSolicitadoConfirmado
          && montos.montoSolicitado != null
          ? Number(montos.montoSolicitado)
          : null;

        return {
          id: integrante.id,
          expediente_id: integrante.expediente_id,
          persona_id: integrante.persona_id,
          estado: integrante.estado,
          motivo_retiro: integrante.motivo_retiro,
          motivo_retiro_detalle: integrante.motivo_retiro_detalle,
          retirada_at: integrante.retirada_at,
          es_tesorera: integrante.expediente?.tesorera_integrante_id === integrante.id,
          created_at: integrante.created_at,
          updated_at: integrante.updated_at,
          nombre,
          telefono,
          montoSolicitado,
          montoAutorizadoAnterior: montos?.montoAutorizadoAnterior ?? null,
          comparacionMontoDisponible: montos?.coincidenciasCicloAnterior === 1,
          cicloNumeroActual: montos?.cicloNumeroActual ?? null,
          tiene_historial_interno: historial?.tieneHistorial ?? null,
          creditos_participados: historial?.creditosParticipados ?? null,
          historial_crediticio_interno: historial?.resumen ?? null,
          es_nueva_con_nosotros: historial?.tieneHistorial === false,
          edad,
          supera_limite_edad: superaLimiteEdad(edad),
          distancia_tesorera_rango: montos?.distanciaTesoreraRango ?? null,
          domicilio_geocodificacion: montos?.domicilio ?? null,
          montoMaximoSolicitable,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string, scope: AccessScope): Promise<any> {
    await assertIntegranteAccess(this.integranteRepository.manager, id, scope);
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
        relations: { expediente: true },
      });

      if (!integrante) {
        return null;
      }

      let personaData: PersonaViewData = {
        nombre: '',
        telefono: null,
        montoSolicitado: null,
        montoProspectivo: null,
        fechaNacimiento: null,
      };

      if (integrante.persona_id) {
        const persona = await this.personaRepository.findOne({
          where: { id: integrante.persona_id },
        });
        if (persona) {
          personaData = {
            nombres: persona.nombres,
            apellido_pat: persona.apellido_pat,
            apellido_mat: persona.apellido_mat,
            nombre: persona.nombre_completo,
            telefono: persona.telefono ?? null,
            telefonoSecundario: persona.telefono_secundario ?? null,
            montoSolicitado: null,
            montoProspectivo: persona.monto_solicitado ?? null,
            fechaNacimiento: persona.fecha_nac ?? null,
          };
        }
      }

      const montosComparables = await this.getMontosComparables([integrante.id]);
      const montos = montosComparables.get(integrante.id);
      const historialInterno = await this.getHistorialInterno([integrante.id]);
      const historial = historialInterno.get(integrante.id);
      const edad = calcularEdad(montos?.fechaNacimiento ?? personaData.fechaNacimiento);
      if (montos?.montoSolicitadoConfirmado && montos.montoSolicitado != null) {
        personaData.montoSolicitado = Number(montos.montoSolicitado);
      }
      const esRenovacion = Number(montos?.cicloNumeroActual ?? 0) > 1;
      const montoAnteriorDisponible = montos?.coincidenciasCicloAnterior === 1
        && montos.montoAutorizadoAnterior != null;
      const montoReferenciaPaso6 = esRenovacion
        ? (montoAnteriorDisponible ? montos.montoAutorizadoAnterior : null)
        : personaData.montoProspectivo == null
          ? null
          : Number(personaData.montoProspectivo);
      const montoMaximoSolicitable = await obtenerMontoMaximoSolicitable(
        this.integranteRepository.manager,
        integrante.expediente_id,
      );

      return {
        id: integrante.id,
        expediente_id: integrante.expediente_id,
        persona_id: integrante.persona_id,
        grupo_id: integrante.expediente?.grupo_id,
        estado: integrante.estado,
        motivo_retiro: integrante.motivo_retiro,
        motivo_retiro_detalle: integrante.motivo_retiro_detalle,
        retirada_at: integrante.retirada_at,
        es_tesorera: integrante.expediente?.tesorera_integrante_id === integrante.id,
        created_at: integrante.created_at,
        updated_at: integrante.updated_at,
        ...personaData,
        montoAutorizadoAnterior: montos?.montoAutorizadoAnterior ?? null,
        comparacionMontoDisponible: montoAnteriorDisponible,
        cicloNumeroActual: montos?.cicloNumeroActual ?? null,
        tiene_historial_interno: historial?.tieneHistorial ?? null,
        creditos_participados: historial?.creditosParticipados ?? null,
        historial_crediticio_interno: historial?.resumen ?? null,
        es_nueva_con_nosotros: historial?.tieneHistorial === false,
        edad,
        supera_limite_edad: superaLimiteEdad(edad),
        esRenovacion,
        montoReferenciaPaso6,
        origenMontoReferenciaPaso6: esRenovacion ? 'CICLO_ANTERIOR' : 'PROSPECCION',
        montoMaximoSolicitable,
      };
    } catch (error) {
      throw error;
    }
  }

  private async getMontosComparables(integranteIds: string[]): Promise<Map<string, {
    montoSolicitado: number | null;
    montoAutorizadoAnterior: number | null;
    coincidenciasCicloAnterior: number;
    cicloNumeroActual: number | null;
    montoSolicitadoConfirmado: boolean;
    fechaNacimiento: string | Date | null;
    distanciaTesoreraRango: 'HASTA_5_KM' | 'MAS_DE_5_KM' | null;
    domicilio: {
      calle: string | null;
      numeroExterior: string | null;
      colonia: string | null;
      municipio: string | null;
      estado: string | null;
      codigoPostal: string | null;
      latitud: number | null;
      longitud: number | null;
    };
  }>> {
    if (integranteIds.length === 0) return new Map();

    const rows = await this.integranteRepository.manager.query(
      `SELECT
         actual.integrante_id,
         actual.ciclo_numero,
         actual.monto_solicitado,
         actual.monto_solicitado_confirmado_at,
         datos_actuales.fecha_nac,
         validacion_actual.vive_max_5km_tesorera,
         domicilio_actual.dom_calle,
         domicilio_actual.dom_num_ext,
         domicilio_actual.dom_colonia,
         domicilio_actual.dom_municipio,
         domicilio_actual.dom_estado,
         domicilio_actual.dom_codigo_postal,
         domicilio_actual.dom_latitud,
         domicilio_actual.dom_longitud,
         CASE
           WHEN COUNT(anterior.id) = 1 THEN MAX(anterior.monto_autorizado)
           ELSE NULL
         END AS monto_autorizado_anterior,
         COUNT(anterior.id)::integer AS coincidencias_ciclo_anterior
       FROM solicitudes actual
       LEFT JOIN solicitudes_datos_personales datos_actuales
         ON datos_actuales.solicitud_id = actual.id
       LEFT JOIN solicitudes_validaciones validacion_actual
         ON validacion_actual.solicitud_id = actual.id
       LEFT JOIN solicitudes_domicilios domicilio_actual
         ON domicilio_actual.solicitud_id = actual.id
       LEFT JOIN solicitudes anterior
         ON anterior.persona_id = actual.persona_id
        AND anterior.grupo_id = actual.grupo_id
        AND anterior.ciclo_numero = actual.ciclo_numero - 1
        AND anterior.monto_autorizado IS NOT NULL
       WHERE actual.integrante_id = ANY($1::uuid[])
       GROUP BY actual.integrante_id, actual.ciclo_numero, actual.monto_solicitado,
          actual.monto_solicitado_confirmado_at, datos_actuales.fecha_nac,
          validacion_actual.vive_max_5km_tesorera,
          domicilio_actual.dom_calle, domicilio_actual.dom_num_ext,
          domicilio_actual.dom_colonia, domicilio_actual.dom_municipio,
          domicilio_actual.dom_estado, domicilio_actual.dom_codigo_postal,
          domicilio_actual.dom_latitud, domicilio_actual.dom_longitud`,
      [integranteIds],
    ) as Array<{
      integrante_id: string;
      monto_solicitado: string | number | null;
      monto_solicitado_confirmado_at: string | Date | null;
      fecha_nac: string | Date | null;
      vive_max_5km_tesorera: string | null;
      dom_calle: string | null;
      dom_num_ext: string | null;
      dom_colonia: string | null;
      dom_municipio: string | null;
      dom_estado: string | null;
      dom_codigo_postal: string | null;
      dom_latitud: string | number | null;
      dom_longitud: string | number | null;
      monto_autorizado_anterior: string | number | null;
      coincidencias_ciclo_anterior: string | number;
      ciclo_numero: string | number | null;
    }>;

    return new Map(rows.map((row) => [
      row.integrante_id,
      {
        montoSolicitado: row.monto_solicitado == null ? null : Number(row.monto_solicitado),
        montoAutorizadoAnterior: row.monto_autorizado_anterior == null
          ? null
          : Number(row.monto_autorizado_anterior),
        coincidenciasCicloAnterior: Number(row.coincidencias_ciclo_anterior),
        cicloNumeroActual: row.ciclo_numero == null ? null : Number(row.ciclo_numero),
        montoSolicitadoConfirmado: row.monto_solicitado_confirmado_at != null,
        fechaNacimiento: row.fecha_nac ?? null,
        distanciaTesoreraRango: String(row.vive_max_5km_tesorera ?? '').trim().toUpperCase() === 'SI'
          ? 'HASTA_5_KM'
          : String(row.vive_max_5km_tesorera ?? '').trim().toUpperCase() === 'NO'
            ? 'MAS_DE_5_KM'
            : null,
        domicilio: {
          calle: row.dom_calle ?? null,
          numeroExterior: row.dom_num_ext ?? null,
          colonia: row.dom_colonia ?? null,
          municipio: row.dom_municipio ?? null,
          estado: row.dom_estado ?? null,
          codigoPostal: row.dom_codigo_postal ?? null,
          latitud: row.dom_latitud == null ? null : Number(row.dom_latitud),
          longitud: row.dom_longitud == null ? null : Number(row.dom_longitud),
        },
      },
    ]));
  }

  private async getHistorialInterno(
    integranteIds: string[],
  ): Promise<Map<string, HistorialCreditoInterno>> {
    if (integranteIds.length === 0) return new Map();

    const rows = await this.integranteRepository.manager.query(
      `SELECT i.id AS integrante_id,
               CASE
                 WHEN i.persona_id IS NULL THEN NULL
                 ELSE COALESCE(historial.creditos_participados, 0) > 0
               END AS tiene_historial_interno,
               CASE
                 WHEN i.persona_id IS NULL THEN NULL
                 ELSE COALESCE(historial.creditos_participados, 0)
               END AS creditos_participados,
               historial.historial_crediticio
          FROM integrantes i
          LEFT JOIN LATERAL (
            WITH fuentes AS (
              SELECT s.expediente_id,
                     s.ciclo_numero,
                     s.monto_autorizado,
                     COALESCE(
                       credito_solicitud.fecha_desembolso,
                       ciclo_solicitud.fecha_inicio,
                       historico_solicitud.fecha_desembolso
                     ) AS fecha_referencia,
                     1 AS prioridad_fuente,
                     s.updated_at AS fecha_registro
                FROM solicitudes s
                LEFT JOIN expedientes expediente_solicitud
                  ON expediente_solicitud.id = s.expediente_id
                LEFT JOIN ciclos ciclo_solicitud
                  ON ciclo_solicitud.expediente_id = s.expediente_id
                LEFT JOIN historial_grupos_ciclos historico_solicitud
                  ON historico_solicitud.id = expediente_solicitud.ciclo_historico_origen_id
                LEFT JOIN creditos credito_solicitud
                  ON credito_solicitud.solicitud_id = s.id
               WHERE s.persona_id = i.persona_id
                 AND s.expediente_id <> i.expediente_id
                 AND s.monto_autorizado > 0
              UNION ALL
              SELECT credito.expediente_id,
                     COALESCE(ciclo_credito.numero_ciclo, solicitud_credito.ciclo_numero),
                     credito.monto_autorizado,
                     credito.fecha_desembolso AS fecha_referencia,
                     2 AS prioridad_fuente,
                     credito.updated_at AS fecha_registro
                FROM creditos credito
                LEFT JOIN ciclos ciclo_credito
                  ON ciclo_credito.expediente_id = credito.expediente_id
                LEFT JOIN solicitudes solicitud_credito
                  ON solicitud_credito.id = credito.solicitud_id
               WHERE credito.persona_id = i.persona_id
                 AND credito.expediente_id <> i.expediente_id
                 AND credito.monto_autorizado > 0
            ), participaciones AS (
              SELECT expediente_id, ciclo_numero, monto_autorizado, fecha_referencia
                FROM (
                  SELECT fuentes.*,
                         ROW_NUMBER() OVER (
                           PARTITION BY expediente_id
                           ORDER BY prioridad_fuente DESC,
                                    fecha_referencia DESC NULLS LAST,
                                    fecha_registro DESC,
                                    ciclo_numero DESC NULLS LAST
                         ) AS posicion
                    FROM fuentes
                ) candidatas
               WHERE posicion = 1
            )
            SELECT COUNT(*)::int AS creditos_participados,
                   JSONB_AGG(
                     JSONB_BUILD_OBJECT(
                       'ciclo_numero', ciclo_numero,
                       'monto_autorizado', monto_autorizado,
                       'fecha_referencia', fecha_referencia
                     )
                     ORDER BY fecha_referencia DESC NULLS LAST,
                              ciclo_numero DESC NULLS LAST,
                              expediente_id
                   ) AS historial_crediticio
              FROM participaciones
          ) historial ON TRUE
         WHERE i.id = ANY($1::uuid[])`,
      [integranteIds],
    ) as Array<{
      integrante_id: string;
      tiene_historial_interno: boolean | null;
      creditos_participados?: string | number | null;
      historial_crediticio?: unknown;
    }>;

    return new Map(rows.map((row) => {
      const registros = normalizarHistorialCredito(row.historial_crediticio);
      return [
        row.integrante_id,
        {
          tieneHistorial: row.tiene_historial_interno,
          creditosParticipados: row.tiene_historial_interno === null
            ? null
            : Number(row.creditos_participados ?? (row.tiene_historial_interno ? 1 : 0)),
          resumen: row.tiene_historial_interno === true
            ? resumirHistorialCredito(registros)
            : null,
        },
      ];
    }));
  }

  async createForExpediente(dto: {
    expedienteId?: string;
    expediente_id?: string;
    nombre?: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    montoSolicitado?: number;
  }, scope: AccessScope): Promise<any> {
    const expediente_id = dto.expediente_id ?? dto.expedienteId;
    if (!expediente_id) {
      throw new BadRequestException('expediente_id o expedienteId es requerido');
    }

    const integranteSaved = await this.integranteRepository.manager.transaction(async (manager) => {
      await assertExpedienteAccess(manager, expediente_id, scope);
      if (!dto.nombres && !dto.nombre) {
        throw new BadRequestException('nombres es requerido para crear una integrante');
      }
      const personaGuardada = await manager.getRepository(PersonaEntity).save({
        nombres: (dto.nombres || dto.nombre || '').trim().toUpperCase(),
        apellido_pat: dto.apellidoPaterno?.trim().toUpperCase() ?? '',
        apellido_mat: dto.apellidoMaterno?.trim().toUpperCase() ?? '',
        telefono: dto.telefono ?? null,
        monto_solicitado: dto.montoSolicitado ?? null,
      });
      const persona_id = personaGuardada.id;

      const integrante = await manager.getRepository(IntegranteEntity).save({
        expediente_id,
        persona_id,
        estado: IntegranteEstado.DOCUMENTANDO,
      });
      await registrarAuditoria(manager, {
        tabla: 'integrantes',
        registroId: integrante.id,
        accion: 'INTEGRANTE_CREADA',
        usuarioId: scope.usuarioId,
        datosDespues: {
          expediente_id,
          persona_existente: false,
          estado: integrante.estado,
        },
      });
      return integrante;
    });
    const historialInterno = await this.getHistorialInterno([integranteSaved.id]);
    const historial = historialInterno.get(integranteSaved.id);

    return {
      id: integranteSaved.id,
      nombre: dto.nombre || `${dto.nombres ?? ''} ${dto.apellidoPaterno ?? ''} ${dto.apellidoMaterno ?? ''}`.trim(),
      telefono: dto.telefono || '',
      montoSolicitado: null,
      estado: integranteSaved.estado,
      expediente_id: integranteSaved.expediente_id,
      tiene_historial_interno: historial?.tieneHistorial ?? null,
      creditos_participados: historial?.creditosParticipados ?? null,
      historial_crediticio_interno: historial?.resumen ?? null,
      es_nueva_con_nosotros: historial?.tieneHistorial === false,
    };
  }

  /**
   * Mapeo de nombres técnicos a etiquetas legibles para asesoras.
   * Facilita la comprensión de los mensajes de validación en campo.
   */
  private obtenerEtiquetaLegible(campo: string): string {
    const etiquetas: Record<string, string> = {
      // Paso 1
      'nombres': 'Nombre(s) de pila',
      'apellido_pat': 'Apellido paterno',
      'apellido_mat': 'Apellido materno',
      'curp': 'CURP',
      'fecha_nac': 'Fecha de nacimiento',
      'genero': 'Género',
      'nacionalidad': 'Nacionalidad',
      'estado_nacimiento': 'Estado de nacimiento',
      'estado_civil': 'Estado civil',
      'ocupacion': 'Ocupación',
      'nivel_estudio': 'Nivel de estudios',
      'telefono': 'Teléfono',
      // Paso 2
      'dom_calle': 'Calle del domicilio',
      'dom_num_ext': 'Número exterior',
      'dom_entre_calles': 'Entre calles',
      'dom_colonia': 'Colonia',
      'dom_municipio': 'Municipio',
      'dom_estado': 'Estado',
      'dom_codigo_postal': 'Código postal',
      // Paso 3
      'ref1_nombre': 'Nombre de la primera referencia',
      'ref1_parentesco': 'Parentesco de la primera referencia',
      'ref1_telefono': 'Teléfono de la primera referencia',
      'ref1_direccion': 'Dirección de la primera referencia',
      'ref2_nombre': 'Nombre de la segunda referencia',
      'ref2_parentesco': 'Parentesco de la segunda referencia',
      'ref2_telefono': 'Teléfono de la segunda referencia',
      'ref2_direccion': 'Dirección de la segunda referencia',
      // Paso 4
      'negocio_giro': 'Giro del negocio',
      'negocio_domicilio': 'Calle del negocio',
      'negocio_num_ext': 'Número exterior del negocio',
      'negocio_colonia': 'Colonia del negocio',
      'negocio_municipio': 'Municipio del negocio',
      'negocio_estado': 'Estado del negocio',
      'negocio_codigo_postal': 'Código postal del negocio',
      'negocio_desde_cuando': 'Antigüedad del negocio',
      'negocio_ingreso_semanal': 'Ingreso semanal del negocio',
      'negocio_gastos': 'Gastos del negocio',
      'negocio_total': 'Total disponible del negocio',
      // Paso 5
      'beneficiario_nombre': 'Nombre del beneficiario',
      'beneficiario_parentesco': 'Parentesco del beneficiario',
      'beneficiario_telefono': 'Teléfono del beneficiario',
      'beneficiario_direccion': 'Dirección del beneficiario',
      // Paso 6
      'tiene_medidor_luz': 'Medidor de luz sin adeudo',
      'vive_max_5km_tesorera': 'Vive a máximo 5km de la tesorera',
      'tiene_menos_70_anios': 'Tiene menos de 70 años',
      'monto_solicitado': 'Monto solicitado capturado',
      // Paso 7 - Documentos del servidor
      'doc_ine_ruta': 'INE de la integrante',
      'doc_comprobante_ruta': 'Comprobante de domicilio',
      'doc_ine_beneficiario_ruta': 'INE del beneficiario',
      'doc_solicitud_firmada_ruta': 'Solicitud firmada',
    };

    return etiquetas[campo] || campo;
  }

  async validarSolicitudCompleta(integranteId: string): Promise<{ completa: boolean; pasosIncompletos: string[]; camposFaltantes: Record<string, string[]> }> {
    const solicitud = await this.solicitudesService.getBySolicitanteInterno(integranteId);
    const estaVacio = (valor: unknown): boolean => (
      valor === null
      || valor === undefined
      || (typeof valor === 'string' && valor.trim() === '')
    );
    const etiquetas = (campos: string[]): string[] => (
      campos.map((campo) => this.obtenerEtiquetaLegible(campo))
    );

    const camposPaso1 = [
      'nombres', 'apellido_pat', 'apellido_mat', 'telefono', 'fecha_nac', 'curp',
      'genero', 'estado_civil', 'ocupacion', 'nivel_estudio', 'nacionalidad',
    ];
    const camposPaso2 = [
      'dom_calle', 'dom_num_ext', 'dom_entre_calles', 'dom_colonia',
      'dom_municipio', 'dom_estado', 'dom_codigo_postal',
    ];
    const camposPaso3 = [
      'ref1_nombre', 'ref1_parentesco', 'ref1_telefono', 'ref1_direccion',
      'ref2_nombre', 'ref2_parentesco', 'ref2_telefono', 'ref2_direccion',
    ];
    const camposPaso4 = [
      'negocio_domicilio', 'negocio_num_ext', 'negocio_colonia',
      'negocio_municipio', 'negocio_estado', 'negocio_codigo_postal',
      'negocio_desde_cuando', 'negocio_giro', 'negocio_ingreso_semanal',
      'negocio_gastos', 'negocio_total',
    ];
    const camposPaso5 = [
      'beneficiario_nombre', 'beneficiario_parentesco',
      'beneficiario_telefono', 'beneficiario_direccion',
    ];

    if (!solicitud) {
      return {
        completa: false,
        pasosIncompletos: [
          'Paso 1: Datos Personales',
          'Paso 2: Domicilio',
          'Paso 3: Referencias',
          'Paso 4: Negocio',
          'Paso 5: Beneficiario',
          'Paso 6: Validaciones',
          'Paso 7: Documentos',
        ],
        camposFaltantes: {
          'Paso 1': etiquetas(camposPaso1),
          'Paso 2': etiquetas(camposPaso2),
          'Paso 3': etiquetas(camposPaso3),
          'Paso 4': etiquetas(camposPaso4),
          'Paso 5': etiquetas(camposPaso5),
          'Paso 6': [
            this.obtenerEtiquetaLegible('tiene_medidor_luz'),
            this.obtenerEtiquetaLegible('vive_max_5km_tesorera'),
            this.obtenerEtiquetaLegible('tiene_menos_70_anios'),
            this.obtenerEtiquetaLegible('monto_solicitado'),
          ],
          'Paso 7': [
            this.obtenerEtiquetaLegible('doc_ine_ruta'),
            this.obtenerEtiquetaLegible('doc_comprobante_ruta'),
            this.obtenerEtiquetaLegible('doc_solicitud_firmada_ruta'),
          ],
        },
      };
    }

    const pasosIncompletos: string[] = [];
    const camposFaltantes: Record<string, string[]> = {};

    // Paso 1: Datos Personales
    const faltantesPaso1 = camposPaso1
      .filter((campo) => estaVacio((solicitud as unknown as Record<string, unknown>)[campo]));
    if (solicitud.nacionalidad === 'MEXICANA' && estaVacio(solicitud.estado_nacimiento)) {
      faltantesPaso1.push('estado_nacimiento');
    }
    if (faltantesPaso1.length > 0) {
      pasosIncompletos.push('Paso 1: Datos Personales');
      camposFaltantes['Paso 1'] = etiquetas(faltantesPaso1);
    }

    // Paso 2: Domicilio
    const faltantesPaso2 = camposPaso2
      .filter((campo) => estaVacio((solicitud as unknown as Record<string, unknown>)[campo]));
    if (faltantesPaso2.length > 0) {
      pasosIncompletos.push('Paso 2: Domicilio');
      camposFaltantes['Paso 2'] = etiquetas(faltantesPaso2);
    }

    // Paso 3: Referencias
    const faltantesPaso3 = camposPaso3
      .filter((campo) => estaVacio((solicitud as unknown as Record<string, unknown>)[campo]));
    if (faltantesPaso3.length > 0) {
      pasosIncompletos.push('Paso 3: Referencias');
      camposFaltantes['Paso 3'] = etiquetas(faltantesPaso3);
    }

    // Paso 4: Negocio
    const faltantesPaso4 = camposPaso4
      .filter((campo) => estaVacio((solicitud as unknown as Record<string, unknown>)[campo]));
    if (faltantesPaso4.length > 0) {
      pasosIncompletos.push('Paso 4: Negocio');
      camposFaltantes['Paso 4'] = etiquetas(faltantesPaso4);
    }

    // Paso 5: Beneficiario
    const faltantesPaso5 = camposPaso5
      .filter((campo) => estaVacio((solicitud as unknown as Record<string, unknown>)[campo]));
    if (faltantesPaso5.length > 0) {
      pasosIncompletos.push('Paso 5: Beneficiario');
      camposFaltantes['Paso 5'] = etiquetas(faltantesPaso5);
    }

    // Paso 6: Validaciones
    const faltantesPaso6: string[] = [];
    if (solicitud.tiene_medidor_luz === null || solicitud.tiene_medidor_luz === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('tiene_medidor_luz'));
    if (solicitud.vive_max_5km_tesorera === null || solicitud.vive_max_5km_tesorera === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('vive_max_5km_tesorera'));
    if (solicitud.tiene_menos_70_anios === null || solicitud.tiene_menos_70_anios === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('tiene_menos_70_anios'));
    const montoMaximoSolicitable = await obtenerMontoMaximoSolicitable(
      this.integranteRepository.manager,
      solicitud.expediente_id,
    );
    if (
      Number(solicitud.monto_solicitado) <= 0
      || Number(solicitud.monto_solicitado) > montoMaximoSolicitable
      || !solicitud.monto_solicitado_confirmado_at
    ) {
      faltantesPaso6.push(this.obtenerEtiquetaLegible('monto_solicitado'));
    }
    if (faltantesPaso6.length > 0) {
      pasosIncompletos.push('Paso 6: Validaciones');
      camposFaltantes['Paso 6'] = faltantesPaso6;
    }

    // Paso 7: la referencia debe apuntar a un manifiesto y archivos reales del servidor.
    const documentos = [
      { tipo: 'ine' as const, ruta: solicitud.doc_ine_ruta, campo: 'doc_ine_ruta' },
      { tipo: 'comprobante' as const, ruta: solicitud.doc_comprobante_ruta, campo: 'doc_comprobante_ruta' },
      { tipo: 'solicitud_firmada' as const, ruta: solicitud.doc_solicitud_firmada_ruta, campo: 'doc_solicitud_firmada_ruta' },
    ];
    const confirmaciones = await Promise.all(documentos.map((documento) => (
      this.solicitudesService.documentoConfirmado(
        integranteId,
        documento.tipo,
        documento.ruta,
      )
    )));
    const faltantesPaso7 = documentos
      .filter((_documento, indice) => !confirmaciones[indice])
      .map((documento) => `${this.obtenerEtiquetaLegible(documento.campo)} - pendiente de subir`);
    if (faltantesPaso7.length > 0) {
      pasosIncompletos.push('Paso 7: Documentos');
      camposFaltantes['Paso 7'] = faltantesPaso7;
    }

    return {
      completa: pasosIncompletos.length === 0,
      pasosIncompletos,
      camposFaltantes,
    };
  }

  async updateEstadoManual(
    id: string,
    estado: IntegranteEstado,
    scope: AccessScope,
    documentosObservados: TipoDocumentoRevision[] = [],
  ): Promise<IntegranteEntity> {
    const solicitaRevisionDocumental = estado === IntegranteEstado.DOCUMENTANDO;
    const completaDocumentacion = estado === IntegranteEstado.SUJETA_CREDITO;
    const documentosRevision = [...new Set(documentosObservados)];

    if (!solicitaRevisionDocumental && !completaDocumentacion) {
      throw new BadRequestException(
        'Sólo están habilitadas la revisión documental y la conclusión de documentación; los dictámenes permanecen bloqueados',
      );
    }

    if (
      solicitaRevisionDocumental
      && (
        documentosRevision.length === 0
        || documentosRevision.some((tipo) => !TIPOS_DOCUMENTO_REVISION.includes(tipo))
      )
    ) {
      throw new BadRequestException('Selecciona al menos un documento para corregir');
    }

    await assertIntegranteAccess(this.integranteRepository.manager, id, scope);

    if (completaDocumentacion) {
      const validacion = await this.validarSolicitudCompleta(id);
      if (!validacion.completa) {
        throw new BadRequestException({
          message: 'Solicitud incompleta',
          pasosIncompletos: validacion.pasosIncompletos,
          camposFaltantes: validacion.camposFaltantes,
        });
      }
    }

    return this.integranteRepository.manager.transaction(async (manager) => {
      await assertIntegranteAccess(manager, id, scope);
      const repository = manager.getRepository(IntegranteEntity);
      const expedienteRepository = manager.getRepository(ExpedienteEntity);
      const integrante = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!integrante) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }

      const expediente = await expedienteRepository.findOne({
        where: { id: integrante.expediente_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!expediente) {
        throw new NotFoundException(`Expediente con ID ${integrante.expediente_id} no encontrado`);
      }

      if (integrante.estado === estado && !solicitaRevisionDocumental) {
        return integrante;
      }

      if (solicitaRevisionDocumental) {
        if (expediente.estado !== ExpedienteEstado.EN_VERIFICACION) {
          throw new ConflictException(
            'La revisión documental sólo puede solicitarse mientras el expediente está en verificación',
          );
        }
        if (
          integrante.estado !== IntegranteEstado.SUJETA_CREDITO
          && integrante.estado !== IntegranteEstado.EN_VERIFICACION
          && integrante.estado !== IntegranteEstado.DOCUMENTANDO
        ) {
          throw new ConflictException(
            `No se puede solicitar revisión documental desde el estado ${integrante.estado}`,
          );
        }
      }

      if (
        completaDocumentacion
        && integrante.estado !== IntegranteEstado.DOCUMENTANDO
      ) {
        throw new ConflictException(
          `La documentación no puede concluirse desde el estado ${integrante.estado}`,
        );
      }

      let rutasAnteriores: Record<string, string | null> | null = null;
      if (solicitaRevisionDocumental) {
        const solicitudRepository = manager.getRepository(SolicitudCoreEntity);
        const documentosRepository = manager.getRepository(SolicitudDocumentosEntity);
        const solicitud = await solicitudRepository.findOne({
          where: { integrante_id: id },
          select: { id: true },
        });
        if (!solicitud) {
          throw new ConflictException('La integrante no tiene una solicitud documental para corregir');
        }

        const documentos = await documentosRepository.findOne({
          where: { solicitud_id: solicitud.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!documentos) {
          throw new ConflictException('La solicitud no tiene un registro de documentos para corregir');
        }

        const documentosMutables = documentos as unknown as Record<string, string | Date | null>;
        rutasAnteriores = {};
        for (const tipo of documentosRevision) {
          const campos = CAMPOS_DOCUMENTO_REVISION[tipo];
          const rutaAnterior = documentosMutables[campos.ruta];
          rutasAnteriores[tipo] = typeof rutaAnterior === 'string' ? rutaAnterior : null;
          documentosMutables[campos.ruta] = null;
          documentosMutables[campos.fecha] = null;
        }
        await documentosRepository.save(documentos);
      }

      const estadoAnterior = integrante.estado;
      integrante.estado = estado;
      const actualizado = await repository.save(integrante);
      const accion = solicitaRevisionDocumental
        ? 'REV_DOC_SOLICITADA'
        : 'REV_DOC_COMPLETADA';
      await manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
         VALUES ('integrantes', $1, $2, $3::jsonb, $4::jsonb, $5)`,
        [
          id,
          accion,
          JSON.stringify({
            estado: estadoAnterior,
            expediente_estado: expediente.estado,
            ...(solicitaRevisionDocumental ? {
              documentos_observados: documentosRevision,
              rutas_anteriores: rutasAnteriores,
            } : {}),
          }),
          JSON.stringify({
            estado,
            expediente_estado: expediente.estado,
            ...(solicitaRevisionDocumental ? {
              documentos_observados: documentosRevision,
              documentos_activos: 'PENDIENTES_DE_REEMPLAZO',
            } : {}),
          }),
          scope.usuarioId,
        ],
      );
      return actualizado;
    });
  }

  async retirarDeExpediente(
    id: string,
    data: RetirarIntegranteInput,
    scope: AccessScope,
  ): Promise<IntegranteEntity> {
    const detalle = data.motivo_retiro === MotivoRetiroIntegrante.OTRO
      ? data.motivo_retiro_detalle?.trim() || null
      : null;

    if (data.motivo_retiro === MotivoRetiroIntegrante.OTRO && !detalle) {
      throw new BadRequestException('Escribe el motivo cuando selecciones Otro');
    }

    return this.integranteRepository.manager.transaction(async (manager) => {
      await assertIntegranteAccess(manager, id, scope);
      const repository = manager.getRepository(IntegranteEntity);
      const expedienteRepository = manager.getRepository(ExpedienteEntity);
      const referencia = await repository.findOne({ where: { id } });
      if (!referencia) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }

      const expediente = await expedienteRepository.findOne({
        where: { id: referencia.expediente_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!expediente) {
        throw new NotFoundException(`Expediente con ID ${referencia.expediente_id} no encontrado`);
      }
      if (expediente.estado !== ExpedienteEstado.EN_DOCUMENTACION) {
        throw new ConflictException('La participación sólo puede cambiar mientras el expediente está en documentación');
      }

      const integrante = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!integrante) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }

      if (
        integrante.estado === IntegranteEstado.RETIRADA
        && integrante.motivo_retiro === data.motivo_retiro
        && integrante.motivo_retiro_detalle === detalle
        && expediente.tesorera_integrante_id !== integrante.id
      ) {
        return integrante;
      }
      if (
        integrante.estado !== IntegranteEstado.DOCUMENTANDO
        && integrante.estado !== IntegranteEstado.SUJETA_CREDITO
        && integrante.estado !== IntegranteEstado.RETIRADA
      ) {
        throw new ConflictException(
          `La integrante no puede retirarse desde el estado ${integrante.estado}`,
        );
      }

      const estadoAnterior = integrante.estado;
      const motivoAnterior = integrante.motivo_retiro;
      const eraTesorera = expediente.tesorera_integrante_id === integrante.id;
      if (eraTesorera) {
        expediente.tesorera_integrante_id = null;
        await expedienteRepository.save(expediente);
        await manager.query(
          `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
           VALUES ('expedientes', $1, 'DESASIG_TESORERA', $2::jsonb, $3::jsonb, $4)`,
          [
            expediente.id,
            JSON.stringify({ tesorera_integrante_id: integrante.id }),
            JSON.stringify({ tesorera_integrante_id: null, motivo: 'INTEGRANTE_RETIRADA' }),
            scope.usuarioId,
          ],
        );
      }

      if (
        integrante.estado === IntegranteEstado.RETIRADA
        && integrante.motivo_retiro === data.motivo_retiro
        && integrante.motivo_retiro_detalle === detalle
      ) {
        return integrante;
      }

      integrante.estado = IntegranteEstado.RETIRADA;
      integrante.motivo_retiro = data.motivo_retiro;
      integrante.motivo_retiro_detalle = detalle;
      integrante.retirada_at = new Date();
      integrante.retirada_por = scope.usuarioId;

      const actualizado = await repository.save(integrante);
      const accion = estadoAnterior === IntegranteEstado.RETIRADA
        ? 'CAMBIO_RETIRO'
        : 'RETIRO_CICLO';
      await manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
         VALUES ('integrantes', $1, $2, $3::jsonb, $4::jsonb, $5)`,
        [
          id,
          accion,
          JSON.stringify({ estado: estadoAnterior, motivo_retiro: motivoAnterior }),
          JSON.stringify({
            estado: IntegranteEstado.RETIRADA,
            motivo_retiro: data.motivo_retiro,
            tiene_detalle: detalle !== null,
          }),
          scope.usuarioId,
        ],
      );
      return actualizado;
    });
  }

  async reintegrarEnExpediente(id: string, scope: AccessScope): Promise<IntegranteEntity> {
    await assertIntegranteAccess(this.integranteRepository.manager, id, scope);
    const validacion = await this.validarSolicitudCompleta(id);
    const estadoReintegrado = validacion.completa
      ? IntegranteEstado.SUJETA_CREDITO
      : IntegranteEstado.DOCUMENTANDO;

    return this.integranteRepository.manager.transaction(async (manager) => {
      await assertIntegranteAccess(manager, id, scope);
      const repository = manager.getRepository(IntegranteEntity);
      const expedienteRepository = manager.getRepository(ExpedienteEntity);
      const referencia = await repository.findOne({ where: { id } });
      if (!referencia) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }

      const expediente = await expedienteRepository.findOne({
        where: { id: referencia.expediente_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!expediente) {
        throw new NotFoundException(`Expediente con ID ${referencia.expediente_id} no encontrado`);
      }
      if (expediente.estado !== ExpedienteEstado.EN_DOCUMENTACION) {
        throw new ConflictException('La participación sólo puede cambiar mientras el expediente está en documentación');
      }

      const integrante = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!integrante) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }
      if (integrante.estado !== IntegranteEstado.RETIRADA) {
        return integrante;
      }

      const motivoAnterior = integrante.motivo_retiro;
      integrante.estado = estadoReintegrado;
      integrante.motivo_retiro = null;
      integrante.motivo_retiro_detalle = null;
      integrante.retirada_at = null;
      integrante.retirada_por = null;

      const actualizado = await repository.save(integrante);
      await manager.query(
        `INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_id)
         VALUES ('integrantes', $1, 'REINTEGRO_CICLO', $2::jsonb, $3::jsonb, $4)`,
        [
          id,
          JSON.stringify({
            estado: IntegranteEstado.RETIRADA,
            motivo_retiro: motivoAnterior,
          }),
          JSON.stringify({
            estado: estadoReintegrado,
            solicitud_completa: validacion.completa,
          }),
          scope.usuarioId,
        ],
      );
      return actualizado;
    });
  }

  async update(
    id: string,
    data: UpdateIntegranteInput,
    scope: AccessScope,
  ): Promise<IntegranteEntity> {
    await assertIntegranteAccess(this.integranteRepository.manager, id, scope);
    const datosPersona: Partial<PersonaEntity> = {};
    if (data.nombres !== undefined) datosPersona.nombres = data.nombres;
    if (data.apellido_pat !== undefined) datosPersona.apellido_pat = data.apellido_pat;
    if (data.apellido_mat !== undefined) datosPersona.apellido_mat = data.apellido_mat;
    if (data.telefono !== undefined) datosPersona.telefono = data.telefono;
    const telefonoSecundario = data.telefonoSecundario ?? data.telefono_secundario;
    if (telefonoSecundario !== undefined) datosPersona.telefono_secundario = telefonoSecundario;
    if (data.montoSolicitado !== undefined) datosPersona.monto_solicitado = data.montoSolicitado;

    return this.integranteRepository.manager.transaction(async (manager) => {
      await assertIntegranteAccess(manager, id, scope);
      const integranteRepository = manager.getRepository(IntegranteEntity);
      const integrante = await integranteRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!integrante) {
        throw new NotFoundException(`Integrante con ID ${id} no encontrado`);
      }

      const camposModificados = Object.keys(datosPersona);
      if (camposModificados.length === 0 || !integrante.persona_id) {
        return integrante;
      }

      await manager.getRepository(PersonaEntity).update(
        integrante.persona_id,
        datosPersona,
      );
      await registrarAuditoria(manager, {
        tabla: 'integrantes',
        registroId: integrante.id,
        accion: 'INTEGRANTE_CAMBIO',
        usuarioId: scope.usuarioId,
        datosDespues: { campos_modificados: camposModificados },
      });
      return integrante;
    });
  }
}
