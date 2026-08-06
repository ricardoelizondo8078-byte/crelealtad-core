import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SolicitudEntity } from './solicitud.entity';
import { SolicitudReadEntity } from './entities/solicitud-read.entity';
import { SolicitudCoreEntity } from './entities/solicitud-core.entity';
import { SolicitudDatosPersonalesEntity } from './entities/solicitud-datos-personales.entity';
import { SolicitudDomiciliosEntity } from './entities/solicitud-domicilios.entity';
import { SolicitudNegociosEntity } from './entities/solicitud-negocios.entity';
import { SolicitudReferenciasEntity } from './entities/solicitud-referencias.entity';
import { SolicitudBeneficiariosEntity } from './entities/solicitud-beneficiarios.entity';
import { SolicitudValidacionesEntity } from './entities/solicitud-validaciones.entity';
import { SolicitudDocumentosEntity } from './entities/solicitud-documentos.entity';
import { IntegrantesService } from '../integrantes/integrantes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { SolicitudCompletaDto } from './dto/solicitud-completa.dto';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @InjectRepository(SolicitudReadEntity)
    private readonly solicitudReadRepository: Repository<SolicitudReadEntity>,
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
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => IntegrantesService))
    private readonly integrantesService: IntegrantesService,
  ) {}

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
    const result = { ...rest } as any;
    const numericFields = [
      // Core
      'monto_solicitado', 'monto_autorizado',
      // Negocios
      'negocio_ingreso_semanal', 'negocio_otros_ingresos', 'negocio_gastos', 'negocio_total',
      // Referencias (pareja)
      'pareja_ingreso_semanal',
    ];

    numericFields.forEach(field => {
      if (result[field] !== null && result[field] !== undefined && typeof result[field] === 'string') {
        result[field] = parseFloat(result[field]);
      }
    });

    return result;
  }

  async getBySolicitante(solicitanteId: string): Promise<SolicitudCompletaDto | null> {
    // Buscar solicitud core por integrante_id
    const core = await this.solicitudCoreRepository.findOne({
      where: { integrante_id: solicitanteId },
    });

    if (!core) {
      return null;
    }

    // Cargar las 7 tablas hijas en paralelo
    const [datosPersonales, domicilios, negocios, referencias, beneficiarios, validaciones, documentos] = await Promise.all([
      this.datosPersonalesRepository.findOne({ where: { solicitud_id: core.id } }),
      this.domiciliosRepository.findOne({ where: { solicitud_id: core.id } }),
      this.negociosRepository.findOne({ where: { solicitud_id: core.id } }),
      this.referenciasRepository.findOne({ where: { solicitud_id: core.id } }),
      this.beneficiariosRepository.findOne({ where: { solicitud_id: core.id } }),
      this.validacionesRepository.findOne({ where: { solicitud_id: core.id } }),
      this.documentosRepository.findOne({ where: { solicitud_id: core.id } }),
    ]);

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

  async createOrUpdateForSolicitante(dto: CreateSolicitudDto): Promise<SolicitudCompletaDto> {
    // Validación explícita de campos requeridos
    if (!dto.integrante_id) {
      throw new BadRequestException('integrante_id es requerido');
    }
    if (!dto.persona_id) {
      throw new BadRequestException('persona_id es requerido');
    }
    if (!dto.expediente_id) {
      throw new BadRequestException('expediente_id es requerido');
    }
    if (!dto.grupo_id) {
      throw new BadRequestException('grupo_id es requerido');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Buscar o crear solicitud core
      let solicitudCore = await manager.findOne(SolicitudCoreEntity, {
        where: { integrante_id: dto.integrante_id },
      });

      if (!solicitudCore) {
        // ASIGNACIÓN EXPLÍCITA CAMPO POR CAMPO - NO SPREAD
        solicitudCore = manager.create(SolicitudCoreEntity, {
          integrante_id: dto.integrante_id,
          persona_id: dto.persona_id,
          expediente_id: dto.expediente_id,
          grupo_id: dto.grupo_id,
          folio: dto.folio,
          ciclo_numero: dto.ciclo_numero,
          monto_solicitado: dto.monto_solicitado,
          monto_autorizado: dto.monto_autorizado,
          // credito_id: NUNCA del DTO - solo en desembolso
          // numero_credito: NUNCA del DTO - solo en desembolso
        });
        solicitudCore = await manager.save(SolicitudCoreEntity, solicitudCore);
      } else {
        // Actualizar campos core - ASIGNACIÓN EXPLÍCITA
        if (dto.monto_solicitado !== undefined) solicitudCore.monto_solicitado = dto.monto_solicitado;
        if (dto.monto_autorizado !== undefined) solicitudCore.monto_autorizado = dto.monto_autorizado;
        if (dto.folio !== undefined) solicitudCore.folio = dto.folio;
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

      // 3. Cargar las 7 hijas para retornar completo
      const [datosPersonales, domicilios, negocios, referencias, beneficiarios, validaciones, documentos] = await Promise.all([
        manager.findOne(SolicitudDatosPersonalesEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudDomiciliosEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudNegociosEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudReferenciasEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudBeneficiariosEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudValidacionesEntity, { where: { solicitud_id: solicitudCore.id } }),
        manager.findOne(SolicitudDocumentosEntity, { where: { solicitud_id: solicitudCore.id } }),
      ]);

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
    });
  }

  async createForSolicitante(dto: CreateSolicitudDto): Promise<SolicitudCompletaDto> {
    return this.createOrUpdateForSolicitante(dto);
  }

  async partialUpdate(integranteId: string, data: any): Promise<SolicitudCompletaDto> {
    // DERIVAR los 4 campos obligatorios desde el integrante
    const integrante = await this.integrantesService.getById(integranteId);

    if (!integrante) {
      throw new BadRequestException(`Integrante ${integranteId} no encontrado`);
    }

    // Construir DTO completo con campos derivados
    const fullDto: CreateSolicitudDto = {
      ...data,
      integrante_id: integranteId,
      persona_id: integrante.persona_id,
      expediente_id: integrante.expediente_id,
      grupo_id: integrante.grupo_id,
    };

    return this.createOrUpdateForSolicitante(fullDto);
  }

  // =====================================================
  // MÉTODOS AUXILIARES PARA UPSERT EN CADA TABLA
  // =====================================================

  private async upsertDatosPersonales(manager: any, solicitudId: string, data: any) {
    const fields = [
      'nombres', 'apellido_pat', 'apellido_mat',
      'curp', 'fecha_nac', 'genero', 'nacionalidad', 'estado_nacimiento',
      'estado_civil', 'ocupacion', 'nivel_estudio', 'telefono'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudDatosPersonalesEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudDatosPersonalesEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    // Eliminar campos readonly/generated antes de guardar
    delete (entity as any).nombre_completo;

    try {
      await manager.save(SolicitudDatosPersonalesEntity, entity);

      // CALCULAR tiene_menos_70_anios automáticamente si hay fecha_nac
      if (data.fecha_nac) {
        await this.calcularTieneMenos70Anios(manager, solicitudId, data.fecha_nac);
      }
    } catch (error) {
      console.error('❌ ERROR EN upsertDatosPersonales:');
      console.error('Error completo:', error);
      console.error('Mensaje:', error.message);
      console.error('Detalle:', error.detail);
      console.error('SQL:', error.query);
      throw error;
    }
  }

  private async calcularTieneMenos70Anios(manager: any, solicitudId: string, fechaNac: string | Date) {
    if (!fechaNac) return;

    const fechaNacDate = typeof fechaNac === 'string' ? new Date(fechaNac) : fechaNac;
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNacDate.getFullYear();
    const mesCumpleaños = fechaNacDate.getMonth();
    const diaCumpleaños = fechaNacDate.getDate();
    const edadReal = (hoy.getMonth() < mesCumpleaños ||
                      (hoy.getMonth() === mesCumpleaños && hoy.getDate() < diaCumpleaños))
      ? edad - 1
      : edad;

    const tieneMenos70 = edadReal < 70 ? 'SI' : 'NO';

    let entity = await manager.findOne(SolicitudValidacionesEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudValidacionesEntity, {
        solicitud_id: solicitudId,
        tiene_menos_70_anios: tieneMenos70
      } as any);
    } else {
      (entity as any).tiene_menos_70_anios = tieneMenos70;
    }

    await manager.save(SolicitudValidacionesEntity, entity);
    console.log(`✅ Calculado tiene_menos_70_anios: ${tieneMenos70} (edad: ${edadReal} años)`);
  }

  private async upsertDomicilio(manager: any, solicitudId: string, data: any) {
    const fields = [
      'dom_calle', 'dom_num_ext', 'dom_num_int', 'dom_entre_calles',
      'dom_colonia', 'dom_municipio', 'dom_estado', 'dom_codigo_postal',
      'dom_cp_id', 'dom_telefono'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudDomiciliosEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudDomiciliosEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudDomiciliosEntity, entity);
  }

  private async upsertNegocio(manager: any, solicitudId: string, data: any) {
    const fields = [
      'negocio_giro', 'negocio_domicilio', 'negocio_colonia', 'negocio_municipio',
      'negocio_estado', 'negocio_codigo_postal', 'negocio_cp_id',
      'negocio_num_ext', 'negocio_num_int', 'negocio_desde_cuando',
      'negocio_ingreso_semanal', 'negocio_otros_ingresos', 'negocio_gastos', 'negocio_total'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudNegociosEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudNegociosEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudNegociosEntity, entity);
  }

  private async upsertReferencias(manager: any, solicitudId: string, data: any) {
    const fields = [
      'ref1_nombre', 'ref1_parentesco', 'ref1_telefono', 'ref1_direccion',
      'ref2_nombre', 'ref2_parentesco', 'ref2_telefono', 'ref2_direccion',
      'pareja_nombre', 'pareja_actividad', 'pareja_ingreso_semanal'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudReferenciasEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudReferenciasEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudReferenciasEntity, entity);
  }

  private async upsertBeneficiario(manager: any, solicitudId: string, data: any) {
    const fields = [
      'beneficiario_nombre', 'beneficiario_parentesco',
      'beneficiario_telefono', 'beneficiario_direccion'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudBeneficiariosEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudBeneficiariosEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudBeneficiariosEntity, entity);
  }

  private async upsertValidaciones(manager: any, solicitudId: string, data: any) {
    // tiene_menos_70_anios NO se captura, se calcula automáticamente desde fecha_nac
    const fields = [
      'tiene_medidor_luz', 'vive_max_5km_tesorera'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudValidacionesEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudValidacionesEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudValidacionesEntity, entity);
  }

  private async upsertDocumentos(manager: any, solicitudId: string, data: any) {
    const fields = [
      'doc_ine_ruta', 'doc_ine_fecha',
      'doc_comprobante_ruta', 'doc_comprobante_fecha',
      'doc_ine_beneficiario_ruta', 'doc_ine_beneficiario_fecha',
      'doc_solicitud_firmada_ruta', 'doc_solicitud_firmada_fecha'
    ];

    const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (!hasData) return;

    let entity = await manager.findOne(SolicitudDocumentosEntity, { where: { solicitud_id: solicitudId } });

    if (!entity) {
      entity = manager.create(SolicitudDocumentosEntity, { solicitud_id: solicitudId } as any);
    }

    fields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (entity as any)[field] = data[field];
      }
    });

    await manager.save(SolicitudDocumentosEntity, entity);
  }
}
