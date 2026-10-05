import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { SolicitudCoreEntity } from './entities/solicitud-core.entity';
import { SolicitudDatosPersonalesEntity } from './entities/solicitud-datos-personales.entity';
import { SolicitudDomiciliosEntity } from './entities/solicitud-domicilios.entity';
import { SolicitudNegociosEntity } from './entities/solicitud-negocios.entity';
import { SolicitudReferenciasEntity } from './entities/solicitud-referencias.entity';
import { SolicitudBeneficiariosEntity } from './entities/solicitud-beneficiarios.entity';
import { SolicitudValidacionesEntity } from './entities/solicitud-validaciones.entity';
import { SolicitudDocumentosEntity } from './entities/solicitud-documentos.entity';
import {
  obtenerMontoMaximoSolicitable,
  validarMontoSolicitadoContraLimite,
} from './monto-solicitado.policy';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { SolicitudCompletaDto } from './dto/solicitud-completa.dto';
import { DocumentosStoragePort } from './documentos/documentos-storage.port';
import {
  ArchivoDocumentoRecibido,
  CargaDocumentoInput,
  TipoDocumento,
} from './documentos/documentos.types';
import { IntegranteEntity } from '../integrantes/integrante.entity';
import { calcularEdad, EDAD_LIMITE_INTEGRANTE } from '../common/edad.policy';
import { AccessScope, assertIntegranteAccess } from '../common/access-scope';
import { registrarAuditoria } from '../common/audit-log';

interface SolicitudDocumentosInternos {
  doc_ine_ruta?: string;
  doc_ine_fecha?: string;
  doc_comprobante_ruta?: string;
  doc_comprobante_fecha?: string;
  doc_ine_beneficiario_ruta?: string;
  doc_ine_beneficiario_fecha?: string;
  doc_solicitud_firmada_ruta?: string;
  doc_solicitud_firmada_fecha?: string;
  doc_comprobante_credito_ruta?: string;
  doc_comprobante_credito_fecha?: string;
}

type SolicitudPersistenciaInput = CreateSolicitudDto & SolicitudDocumentosInternos & {
  persona_id: string;
  expediente_id: string;
  grupo_id: string;
} & Record<string, unknown>;

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudCoreEntity)
    private readonly solicitudCoreRepository: Repository<SolicitudCoreEntity>,
    @InjectRepository(SolicitudDatosPersonalesEntity)
    private readonly datosPersonalesRepository: Repository<SolicitudDatosPersonalesEntity>,
    @InjectRepository(SolicitudDomiciliosEntity)
    private readonly domiciliosRepository: Repository<SolicitudDomiciliosEntity>,
    @InjectRepository(SolicitudNegociosEntity)
    private readonly negociosRepository: Repository<SolicitudNegociosEntity>,
    @InjectRepository(SolicitudReferenciasEntity)
    private readonly referenciasRepository: Repository<SolicitudReferenciasEntity>,
    @InjectRepository(SolicitudBeneficiariosEntity)
    private readonly beneficiariosRepository: Repository<SolicitudBeneficiariosEntity>,
    @InjectRepository(SolicitudValidacionesEntity)
    private readonly validacionesRepository: Repository<SolicitudValidacionesEntity>,
    @InjectRepository(SolicitudDocumentosEntity)
    private readonly documentosRepository: Repository<SolicitudDocumentosEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    private readonly dataSource: DataSource,
    private readonly documentosStorageService: DocumentosStoragePort,
  ) {}

  async subirDocumento(
    integranteId: string,
    tipo: string,
    scope: AccessScope,
    archivos: ArchivoDocumentoRecibido[],
    carga: CargaDocumentoInput = {},
  ) {
    await assertIntegranteAccess(this.dataSource, integranteId, scope);
    await this.getIntegranteContext(integranteId);
    const resultado = await this.documentosStorageService.guardarLote(
      integranteId,
      tipo,
      scope.usuarioId,
      archivos,
      carga,
    );
    if (!resultado.completado || !resultado.documento) return resultado;

    const documento = resultado.documento;
    const camposPorTipo = {
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
      comprobante_credito: {
        ruta: 'doc_comprobante_credito_ruta',
        fecha: 'doc_comprobante_credito_fecha',
      },
    } as const;
    const campos = camposPorTipo[documento.tipo];

    const solicitudActual = await this.solicitudCoreRepository.findOne({
      where: { integrante_id: integranteId },
    });
    if (solicitudActual) {
      const documentosActuales = await this.documentosRepository.findOne({
        where: { solicitud_id: solicitudActual.id },
      });
      if (documentosActuales?.[campos.ruta] === documento.ruta) {
        return documento;
      }
    }

    try {
      await this.partialUpdateDocumentos(integranteId, {
        [campos.ruta]: documento.ruta,
        [campos.fecha]: documento.fecha_captura.slice(0, 10),
      }, scope.usuarioId, {
        tipo: documento.tipo,
        paginas: documento.archivos.length,
      });
      return documento;
    } catch (error) {
      await this.documentosStorageService.descartar(documento);
      throw error;
    }
  }

  async documentoConfirmado(
    integranteId: string,
    tipo: TipoDocumento,
    ruta: string | null | undefined,
  ): Promise<boolean> {
    if (!ruta) return false;
    const prefijo = `/solicitudes/integrante/${integranteId}/documentos/${tipo}/`;
    if (!ruta.startsWith(prefijo)) return false;
    const documentoId = ruta.slice(prefijo.length);
    if (!documentoId || documentoId.includes('/')) return false;

    try {
      const documento = await this.documentosStorageService.obtener(
        integranteId,
        tipo,
        documentoId,
      );
      return documento.archivos.length > 0
        && this.documentosStorageService.confirmarExistencia(
          integranteId,
          tipo,
          documentoId,
        );
    } catch {
      return false;
    }
  }

  async obtenerDocumento(
    integranteId: string,
    tipo: string,
    documentoId: string,
    scope: AccessScope,
  ) {
    await assertIntegranteAccess(this.dataSource, integranteId, scope);
    return this.documentosStorageService.obtener(integranteId, tipo, documentoId);
  }

  async leerArchivoDocumento(
    integranteId: string,
    tipo: string,
    documentoId: string,
    indice: number,
    scope: AccessScope,
  ) {
    await assertIntegranteAccess(this.dataSource, integranteId, scope);
    return this.documentosStorageService.leerArchivo(
      integranteId,
      tipo,
      documentoId,
      indice,
    );
  }

  /**
   * Helper: excluye colisiones (id, solicitud_id, created_at, updated_at) de entidades hijas
   * y normaliza campos numéricos (pg devuelve decimals como string al serializar JSON)
   */
  private excludeCollisions<T extends { id?: string; solicitud_id?: string; created_at?: Date; updated_at?: Date }>(
    entity: T | null,
  ): Partial<Omit<T, 'id' | 'solicitud_id' | 'created_at' | 'updated_at'>> {
    if (!entity) return {};
    const { id, solicitud_id, created_at, updated_at, ...rest } = entity;

    // Normalizar TODOS los campos decimals del proyecto a number
    const result = { ...rest };
    const mutableResult = result as unknown as Record<string, unknown>;
    const numericFields = [
      // Core
      'monto_solicitado', 'monto_autorizado',
      // Negocios
      'negocio_ingreso_semanal', 'negocio_otros_ingresos', 'negocio_gastos', 'negocio_total',
      // Referencias (pareja)
      'pareja_ingreso_semanal',
      // Coordenadas geocodificadas del domicilio
      'dom_latitud', 'dom_longitud',
    ];

    numericFields.forEach(field => {
      const value = mutableResult[field];
      if (typeof value === 'string') {
        mutableResult[field] = parseFloat(value);
      }
    });

    return result;
  }

  async getBySolicitante(
    solicitanteId: string,
    scope: AccessScope,
  ): Promise<SolicitudCompletaDto | null> {
    await assertIntegranteAccess(this.dataSource, solicitanteId, scope);
    return this.getBySolicitanteInterno(solicitanteId);
  }

  async getBySolicitanteInterno(solicitanteId: string): Promise<SolicitudCompletaDto | null> {
    // Buscar solicitud core por integrante_id
    const core = await this.solicitudCoreRepository.findOne({
      where: { integrante_id: solicitanteId },
    });

    if (!core) {
      return null;
    }

    // Lectura secuencial para conservar compatibilidad con pools de una sola conexión
    // usados por pruebas y entornos móviles de desarrollo.
    const datosPersonales = await this.datosPersonalesRepository.findOne({ where: { solicitud_id: core.id } });
    const domicilios = await this.domiciliosRepository.findOne({ where: { solicitud_id: core.id } });
    const negocios = await this.negociosRepository.findOne({ where: { solicitud_id: core.id } });
    const referencias = await this.referenciasRepository.findOne({ where: { solicitud_id: core.id } });
    const beneficiarios = await this.beneficiariosRepository.findOne({ where: { solicitud_id: core.id } });
    const validaciones = await this.validacionesRepository.findOne({ where: { solicitud_id: core.id } });
    const documentos = await this.documentosRepository.findOne({ where: { solicitud_id: core.id } });

    // Armar respuesta plana con core + hijas (sin colisiones)
    return {
      // Core completo (id, created_at, updated_at del core sobreviven)
      ...core,
      // Hijas sin colisiones
      ...this.excludeCollisions(datosPersonales),
      ...this.excludeCollisions(domicilios),
      ...this.excludeCollisions(negocios),
      ...this.excludeCollisions(referencias),
      ...this.excludeCollisions(beneficiarios),
      ...this.excludeCollisions(validaciones),
      ...this.excludeCollisions(documentos),
    };
  }

  async createOrUpdateForSolicitante(
    dto: CreateSolicitudDto,
    scope: AccessScope,
  ): Promise<SolicitudCompletaDto> {
    if (!dto.integrante_id) {
      throw new BadRequestException('integrante_id es requerido');
    }

    await assertIntegranteAccess(this.dataSource, dto.integrante_id, scope);
    const integrante = await this.getIntegranteContext(dto.integrante_id);
    return this.persistSolicitud({
      ...dto,
      persona_id: integrante.persona_id,
      expediente_id: integrante.expediente_id,
      grupo_id: integrante.expediente.grupo_id,
    }, scope.usuarioId);
  }

  private async persistSolicitud(
    dto: SolicitudPersistenciaInput,
    usuarioId: string,
    auditContext?: {
      accion: 'DOCUMENTO_SUBIDO';
      datos: Record<string, unknown>;
    },
    expectedUpdatedAt?: string | null,
  ): Promise<SolicitudCompletaDto> {
    if (dto.monto_solicitado !== undefined) {
      const montoMaximo = await obtenerMontoMaximoSolicitable(this.dataSource, dto.expediente_id);
      validarMontoSolicitadoContraLimite(dto.monto_solicitado, montoMaximo);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Buscar o crear solicitud core
      let solicitudCore = await manager.findOne(SolicitudCoreEntity, {
        where: { integrante_id: dto.integrante_id },
        lock: { mode: 'pessimistic_write' },
      });
      const esNueva = !solicitudCore;

      if (expectedUpdatedAt !== undefined) {
        const versionActual = solicitudCore?.updated_at?.toISOString() ?? null;
        if (expectedUpdatedAt !== versionActual) {
          if (solicitudCore) {
            const actual = await this.cargarSolicitudCompleta(manager, solicitudCore);
            if (this.solicitudCoincideConEntrada(actual, dto)) return actual;
          }
          throw new ConflictException(
            'La solicitud cambió en el servidor. Revisa la versión actual antes de sincronizar.',
          );
        }
      }

      if (!solicitudCore) {
        // ASIGNACIÓN EXPLÍCITA CAMPO POR CAMPO - NO SPREAD
        solicitudCore = manager.create(SolicitudCoreEntity, {
          integrante_id: dto.integrante_id,
          persona_id: dto.persona_id,
          expediente_id: dto.expediente_id,
          grupo_id: dto.grupo_id,
          monto_solicitado: dto.monto_solicitado,
          monto_solicitado_confirmado_at: dto.monto_solicitado !== undefined ? new Date() : null,
          // folio, ciclo_numero y monto_autorizado se asignan sólo por procesos internos.
          // credito_id: NUNCA del DTO - solo en desembolso
          // numero_credito: NUNCA del DTO - solo en desembolso
        });
        solicitudCore = await manager.save(SolicitudCoreEntity, solicitudCore);
      } else {
        // Actualizar campos core - ASIGNACIÓN EXPLÍCITA
        if (dto.monto_solicitado !== undefined) {
          solicitudCore.monto_solicitado = dto.monto_solicitado;
          solicitudCore.monto_solicitado_confirmado_at = new Date();
        }
        solicitudCore = await manager.save(SolicitudCoreEntity, solicitudCore);
      }

      // 2. Guardar en tablas relacionadas
      await this.upsertDatosPersonales(manager, solicitudCore.id, dto);
      await this.upsertDomicilio(manager, solicitudCore.id, dto);
      await this.upsertNegocio(manager, solicitudCore.id, dto);
      await this.upsertReferencias(manager, solicitudCore.id, dto);
      await this.upsertBeneficiario(manager, solicitudCore.id, dto);
      await this.upsertValidaciones(manager, solicitudCore.id, dto);
      await this.upsertDocumentos(manager, solicitudCore.id, dto);
      solicitudCore.updated_at = new Date();
      solicitudCore = await manager.save(SolicitudCoreEntity, solicitudCore);
      const camposModificados = Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([field]) => field)
        .filter((field) => !['integrante_id', 'persona_id', 'expediente_id', 'grupo_id'].includes(field));
      await registrarAuditoria(manager, {
        tabla: 'solicitudes',
        registroId: solicitudCore.id,
        accion: esNueva ? 'SOLICITUD_CREADA' : auditContext?.accion ?? 'SOLICITUD_CAMBIO',
        usuarioId,
        datosDespues: {
          campos_modificados: camposModificados,
          ...(auditContext?.datos ?? {}),
        },
      });

      return this.cargarSolicitudCompleta(manager, solicitudCore);
    });
  }

  private async cargarSolicitudCompleta(
    manager: EntityManager,
    solicitudCore: SolicitudCoreEntity,
  ): Promise<SolicitudCompletaDto> {
    // Lectura secuencial: el EntityManager transaccional usa una sola conexión.
    const datosPersonales = await manager.findOne(SolicitudDatosPersonalesEntity, { where: { solicitud_id: solicitudCore.id } });
    const domicilios = await manager.findOne(SolicitudDomiciliosEntity, { where: { solicitud_id: solicitudCore.id } });
    const negocios = await manager.findOne(SolicitudNegociosEntity, { where: { solicitud_id: solicitudCore.id } });
    const referencias = await manager.findOne(SolicitudReferenciasEntity, { where: { solicitud_id: solicitudCore.id } });
    const beneficiarios = await manager.findOne(SolicitudBeneficiariosEntity, { where: { solicitud_id: solicitudCore.id } });
    const validaciones = await manager.findOne(SolicitudValidacionesEntity, { where: { solicitud_id: solicitudCore.id } });
    const documentos = await manager.findOne(SolicitudDocumentosEntity, { where: { solicitud_id: solicitudCore.id } });
    return {
      ...solicitudCore,
      ...this.excludeCollisions(datosPersonales),
      ...this.excludeCollisions(domicilios),
      ...this.excludeCollisions(negocios),
      ...this.excludeCollisions(referencias),
      ...this.excludeCollisions(beneficiarios),
      ...this.excludeCollisions(validaciones),
      ...this.excludeCollisions(documentos),
    };
  }

  private solicitudCoincideConEntrada(
    actual: SolicitudCompletaDto,
    entrada: SolicitudPersistenciaInput,
  ): boolean {
    const ignorados = new Set(['integrante_id', 'persona_id', 'expediente_id', 'grupo_id']);
    return Object.entries(entrada).every(([campo, esperado]) => {
      if (ignorados.has(campo) || esperado === undefined) return true;
      const valorActual = (actual as unknown as Record<string, unknown>)[campo];
      if (typeof esperado === 'number') return Number(valorActual) === esperado;
      if (valorActual instanceof Date && typeof esperado === 'string') {
        const fechaEsperada = new Date(esperado);
        return !Number.isNaN(fechaEsperada.getTime())
          && valorActual.toISOString() === fechaEsperada.toISOString();
      }
      if (esperado instanceof Date) {
        const actualIso = valorActual instanceof Date ? valorActual.toISOString() : String(valorActual);
        return actualIso === esperado.toISOString();
      }
      return valorActual === esperado;
    });
  }

  async partialUpdate(
    integranteId: string,
    data: Partial<CreateSolicitudDto> & { expected_updated_at?: string | null },
    scope: AccessScope,
  ): Promise<SolicitudCompletaDto> {
    await assertIntegranteAccess(this.dataSource, integranteId, scope);
    // DERIVAR los 4 campos obligatorios desde el integrante
    const integrante = await this.getIntegranteContext(integranteId);

    // Construir DTO completo con campos derivados
    const { expected_updated_at: expectedUpdatedAt, ...changes } = data;
    const fullDto: SolicitudPersistenciaInput = {
      ...changes,
      integrante_id: integranteId,
      persona_id: integrante.persona_id,
      expediente_id: integrante.expediente_id,
      grupo_id: integrante.expediente.grupo_id,
    };

    return this.persistSolicitud(fullDto, scope.usuarioId, undefined, expectedUpdatedAt);
  }

  private async partialUpdateDocumentos(
    integranteId: string,
    data: SolicitudDocumentosInternos,
    usuarioId: string,
    auditData: Record<string, unknown>,
  ): Promise<SolicitudCompletaDto> {
    const integrante = await this.getIntegranteContext(integranteId);
    return this.persistSolicitud({
      ...data,
      integrante_id: integranteId,
      persona_id: integrante.persona_id,
      expediente_id: integrante.expediente_id,
      grupo_id: integrante.expediente.grupo_id,
    }, usuarioId, {
      accion: 'DOCUMENTO_SUBIDO',
      datos: auditData,
    });
  }

  private async getIntegranteContext(integranteId: string): Promise<IntegranteEntity> {
    const integrante = await this.integranteRepository.findOne({
      where: { id: integranteId },
      relations: { expediente: true },
    });
    if (!integrante?.persona_id || !integrante.expediente?.grupo_id) {
      throw new BadRequestException(`Integrante ${integranteId} no encontrado o incompleto`);
    }
    return integrante;
  }

  // =====================================================
  // MÉTODOS AUXILIARES PARA UPSERT EN CADA TABLA
  // =====================================================

  private async upsertChild<T extends ObjectLiteral & { solicitud_id: string }>(
    manager: EntityManager,
    entityType: EntityTarget<T>,
    solicitudId: string,
    data: SolicitudPersistenciaInput,
    fields: ReadonlyArray<Extract<keyof T, string>>,
    excludedFields: ReadonlyArray<Extract<keyof T, string>> = [],
    nullableFields: ReadonlyArray<Extract<keyof T, string>> = [],
  ): Promise<T | null> {
    const values = Object.fromEntries(
      fields
        .filter((field) => data[field] !== undefined && (
          nullableFields.includes(field)
          || (data[field] !== null && data[field] !== '')
        ))
        .map((field) => [field, data[field]]),
    );
    if (Object.keys(values).length === 0) {
      return null;
    }

    let entity = await manager.findOne(entityType, {
      where: { solicitud_id: solicitudId } as FindOptionsWhere<T>,
    });
    if (!entity) {
      entity = manager.create(
        entityType,
        { solicitud_id: solicitudId } as DeepPartial<T>,
      );
    }

    Object.assign(entity, values);
    const mutableEntity = entity as Record<string, unknown>;
    excludedFields.forEach((field) => delete mutableEntity[field]);
    return manager.save(entityType, entity);
  }

  private async upsertDatosPersonales(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    const entity = await this.upsertChild(
      manager,
      SolicitudDatosPersonalesEntity,
      solicitudId,
      data,
      [
      'nombres', 'apellido_pat', 'apellido_mat',
      'curp', 'fecha_nac', 'genero', 'nacionalidad', 'estado_nacimiento',
      'estado_civil', 'ocupacion', 'nivel_estudio', 'telefono'
      ],
      ['nombre_completo'],
    );
    if (!entity) return;

    // CALCULAR tiene_menos_70_anios automáticamente si hay fecha_nac
    if (data.fecha_nac) {
      await this.calcularTieneMenos70Anios(manager, solicitudId, data.fecha_nac);
    }
  }

  private async calcularTieneMenos70Anios(manager: EntityManager, solicitudId: string, fechaNac: string | Date) {
    if (!fechaNac) return;

    const edadReal = calcularEdad(fechaNac);
    if (edadReal === null) return;

    const tieneMenos70 = edadReal < EDAD_LIMITE_INTEGRANTE ? 'SI' : 'NO';

    let entity = await manager.findOne(SolicitudValidacionesEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudValidacionesEntity, {
        solicitud_id: solicitudId,
        tiene_menos_70_anios: tieneMenos70
      });
    } else {
      entity.tiene_menos_70_anios = tieneMenos70;
    }

    await manager.save(SolicitudValidacionesEntity, entity);
  }

  private async upsertDomicilio(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    await this.upsertChild(manager, SolicitudDomiciliosEntity, solicitudId, data, [
      'dom_calle', 'dom_num_ext', 'dom_num_int', 'dom_entre_calles',
      'dom_colonia', 'dom_municipio', 'dom_estado', 'dom_codigo_postal',
      'dom_cp_id', 'dom_telefono', 'dom_latitud', 'dom_longitud',
      'dom_geocodificacion_fuente', 'dom_geocodificacion_fecha',
    ], [], [
      'dom_latitud', 'dom_longitud', 'dom_geocodificacion_fuente',
      'dom_geocodificacion_fecha',
    ]);
  }

  private async upsertNegocio(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    await this.upsertChild(manager, SolicitudNegociosEntity, solicitudId, data, [
      'negocio_giro', 'negocio_domicilio', 'negocio_colonia', 'negocio_municipio',
      'negocio_estado', 'negocio_codigo_postal', 'negocio_cp_id',
      'negocio_num_ext', 'negocio_num_int', 'negocio_desde_cuando',
      'negocio_ingreso_semanal', 'negocio_otros_ingresos', 'negocio_gastos', 'negocio_total',
    ]);
  }

  private async upsertReferencias(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    await this.upsertChild(manager, SolicitudReferenciasEntity, solicitudId, data, [
      'ref1_nombre', 'ref1_parentesco', 'ref1_telefono', 'ref1_direccion',
      'ref2_nombre', 'ref2_parentesco', 'ref2_telefono', 'ref2_direccion',
      'pareja_nombre', 'pareja_actividad', 'pareja_ingreso_semanal',
    ]);
  }

  private async upsertBeneficiario(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    await this.upsertChild(manager, SolicitudBeneficiariosEntity, solicitudId, data, [
      'beneficiario_nombre', 'beneficiario_parentesco',
      'beneficiario_telefono', 'beneficiario_direccion',
    ]);
  }

  private async upsertValidaciones(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    // tiene_menos_70_anios NO se captura, se calcula automáticamente desde fecha_nac
    await this.upsertChild(manager, SolicitudValidacionesEntity, solicitudId, data, [
      'tiene_medidor_luz', 'vive_max_5km_tesorera',
    ]);
  }

  private async upsertDocumentos(manager: EntityManager, solicitudId: string, data: SolicitudPersistenciaInput) {
    await this.upsertChild(manager, SolicitudDocumentosEntity, solicitudId, data, [
      'doc_ine_ruta', 'doc_ine_fecha',
      'doc_comprobante_ruta', 'doc_comprobante_fecha',
      'doc_ine_beneficiario_ruta', 'doc_ine_beneficiario_fecha',
      'doc_solicitud_firmada_ruta', 'doc_solicitud_firmada_fecha',
      'doc_comprobante_credito_ruta', 'doc_comprobante_credito_fecha',
    ]);
  }
}
