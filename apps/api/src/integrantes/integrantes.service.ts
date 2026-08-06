import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegranteEntity, IntegranteEstado } from './integrante.entity';
import { PersonaEntity } from '../personas/persona.entity';
import { SolicitudesService } from '../solicitudes/solicitudes.service';

@Injectable()
export class IntegrantesService {
  constructor(
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    @InjectRepository(PersonaEntity)
    private readonly personaRepository: Repository<PersonaEntity>,
    @Inject(forwardRef(() => SolicitudesService))
    private readonly solicitudesService: SolicitudesService,
  ) {}

  async listByExpediente(expedienteId: string): Promise<any[]> {
    try {
      // Usar LEFT JOIN para evitar N+1 query problem
      // Antes: 10 integrantes = 11 queries (1 + 10)
      // Ahora: 10 integrantes = 1 query (90% improvement)
      const integrantes = await this.integranteRepository
        .createQueryBuilder('integrante')
        .leftJoinAndSelect('integrante.persona', 'persona')
        .where('integrante.expediente_id = :expedienteId', { expedienteId })
        .orderBy('integrante.created_at', 'ASC')
        .getMany();

      return integrantes.map((integrante) => {
        const persona = integrante.persona;
        const nombre = persona?.nombre_completo || '';
        const telefono = persona?.telefono ?? null;
        const montoSolicitado = persona?.monto_solicitado ?? 0;

        return {
          id: integrante.id,
          expediente_id: integrante.expediente_id,
          persona_id: integrante.persona_id,
          estado: integrante.estado,
          created_at: integrante.created_at,
          updated_at: integrante.updated_at,
          nombre,
          telefono,
          montoSolicitado,
        };
      });
    } catch (error) {
      console.error('Error en listByExpediente:', error);
      // Devuelve array vacío en lugar de 500
      return [];
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
        relations: { expediente: true },
      });

      if (!integrante) {
        return null;
      }

      let personaData: any = {
        nombre: '',
        telefono: null,
        montoSolicitado: 0,
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
            montoSolicitado: persona.monto_solicitado ?? 0,
          };
        }
      }

      return {
        id: integrante.id,
        expediente_id: integrante.expediente_id,
        persona_id: integrante.persona_id,
        grupo_id: integrante.expediente?.grupo_id,
        estado: integrante.estado,
        created_at: integrante.created_at,
        updated_at: integrante.updated_at,
        ...personaData,
      };
    } catch (error) {
      console.error('Error en getById:', error);
      return null;
    }
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
    persona_id?: string;
  }): Promise<any> {
    try {
      const expediente_id = dto.expediente_id ?? dto.expedienteId;

      if (!expediente_id) {
        throw new Error('expediente_id o expedienteId es requerido');
      }

      let persona_id = dto.persona_id;

      // Crear persona si se proporcionan datos
      if (!persona_id && (dto.nombres || dto.nombre)) {
        const nombres = dto.nombres?.trim().toUpperCase() || '';
        const apellido_pat = dto.apellidoPaterno?.trim().toUpperCase() ?? '';
        const apellido_mat = dto.apellidoMaterno?.trim().toUpperCase() ?? '';

        const personaGuardada = await this.personaRepository.save({
          nombres: nombres,
          apellido_pat: apellido_pat,
          apellido_mat: apellido_mat,
          telefono: dto.telefono ?? null,
          monto_solicitado: dto.montoSolicitado ?? null,
        });
        persona_id = personaGuardada.id;
      }

      const integrante = this.integranteRepository.create({
        expediente_id,
        persona_id,
        estado: IntegranteEstado.DOCUMENTANDO,
      });

      const integranteSaved = await this.integranteRepository.save(integrante);

      // Devolver con campos adicionales para el frontend
      return {
        id: integranteSaved.id,
        nombre: dto.nombre || `${dto.nombres ?? ''} ${dto.apellidoPaterno ?? ''} ${dto.apellidoMaterno ?? ''}`.trim(),
        telefono: dto.telefono || '',
        montoSolicitado: dto.montoSolicitado || 0,
        estado: integranteSaved.estado,
        expediente_id: integranteSaved.expediente_id,
      };
    } catch (error) {
      console.error('Error completo en createForExpediente:', error);
      throw new Error(`Error al crear integrante: ${error.message}`);
    }
  }

  /**
   * Helper para verificar si una ruta es del servidor o local del dispositivo.
   * Rechaza prefijos locales: storage:, file://, content://
   *
   * NOTA: Este helper está diseñado para extenderse a un estado intermedio
   * DOCUMENTOS_PENDIENTES cuando se implemente captura offline + sincronización.
   * Ver docs/DECISIONES.md para el roadmap completo.
   */
  private esRutaServidor(ruta: string | null | undefined): boolean {
    if (!ruta) return false;

    // Rechazar rutas locales del dispositivo
    const esLocal = ruta.startsWith('storage:') ||
                    ruta.startsWith('file://') ||
                    ruta.startsWith('content://');

    return !esLocal;
  }

  /**
   * Mapeo de nombres técnicos a etiquetas legibles para asesoras.
   * Facilita la comprensión de los mensajes de validación en campo.
   */
  private obtenerEtiquetaLegible(campo: string): string {
    const etiquetas: Record<string, string> = {
      // Paso 1
      'nombres': 'Nombre(s) de pila',
      'curp': 'CURP',
      'fecha_nac': 'Fecha de nacimiento',
      'genero': 'Género',
      // Paso 2
      'dom_calle': 'Calle del domicilio',
      'dom_colonia': 'Colonia',
      'dom_municipio': 'Municipio',
      // Paso 3
      'ref1_nombre': 'Nombre de la primera referencia',
      'ref2_nombre': 'Nombre de la segunda referencia',
      // Paso 4
      'negocio_giro': 'Giro del negocio',
      'negocio_ingreso_semanal': 'Ingreso semanal del negocio',
      // Paso 5
      'beneficiario_nombre': 'Nombre del beneficiario',
      'beneficiario_parentesco': 'Parentesco del beneficiario',
      // Paso 6
      'tiene_medidor_luz': 'Medidor de luz sin adeudo',
      'vive_max_5km_tesorera': 'Vive a máximo 5km de la tesorera',
      'tiene_menos_70_anios': 'Tiene menos de 70 años',
      // Paso 7 - Documentos del servidor
      'doc_ine_ruta': 'INE de la integrante',
      'doc_comprobante_ruta': 'Comprobante de domicilio',
      'doc_ine_beneficiario_ruta': 'INE del beneficiario',
      'doc_solicitud_firmada_ruta': 'Solicitud firmada',
    };

    return etiquetas[campo] || campo;
  }

  async validarSolicitudCompleta(integranteId: string): Promise<{ completa: boolean; pasosIncompletos: string[]; camposFaltantes: Record<string, string[]> }> {
    const solicitud = await this.solicitudesService.getBySolicitante(integranteId);

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
          'Paso 1': [
            this.obtenerEtiquetaLegible('nombres'),
            this.obtenerEtiquetaLegible('curp'),
            this.obtenerEtiquetaLegible('fecha_nac'),
            this.obtenerEtiquetaLegible('genero'),
          ],
          'Paso 2': [
            this.obtenerEtiquetaLegible('dom_calle'),
            this.obtenerEtiquetaLegible('dom_colonia'),
            this.obtenerEtiquetaLegible('dom_municipio'),
          ],
          'Paso 3': [
            this.obtenerEtiquetaLegible('ref1_nombre'),
            this.obtenerEtiquetaLegible('ref2_nombre'),
          ],
          'Paso 4': [
            this.obtenerEtiquetaLegible('negocio_giro'),
            this.obtenerEtiquetaLegible('negocio_ingreso_semanal'),
          ],
          'Paso 5': [
            this.obtenerEtiquetaLegible('beneficiario_nombre'),
            this.obtenerEtiquetaLegible('beneficiario_parentesco'),
          ],
          'Paso 6': [
            this.obtenerEtiquetaLegible('tiene_medidor_luz'),
            this.obtenerEtiquetaLegible('vive_max_5km_tesorera'),
            this.obtenerEtiquetaLegible('tiene_menos_70_anios'),
          ],
          'Paso 7': [
            this.obtenerEtiquetaLegible('doc_ine_ruta'),
            this.obtenerEtiquetaLegible('doc_comprobante_ruta'),
            this.obtenerEtiquetaLegible('doc_ine_beneficiario_ruta'),
            this.obtenerEtiquetaLegible('doc_solicitud_firmada_ruta'),
          ],
        },
      };
    }

    const pasosIncompletos: string[] = [];
    const camposFaltantes: Record<string, string[]> = {};

    // Paso 1: Datos Personales
    const faltantesPaso1: string[] = [];
    if (!solicitud.nombres) faltantesPaso1.push(this.obtenerEtiquetaLegible('nombres'));
    if (!solicitud.curp) faltantesPaso1.push(this.obtenerEtiquetaLegible('curp'));
    if (!solicitud.fecha_nac) faltantesPaso1.push(this.obtenerEtiquetaLegible('fecha_nac'));
    if (!solicitud.genero) faltantesPaso1.push(this.obtenerEtiquetaLegible('genero'));
    if (faltantesPaso1.length > 0) {
      pasosIncompletos.push('Paso 1: Datos Personales');
      camposFaltantes['Paso 1'] = faltantesPaso1;
    }

    // Paso 2: Domicilio
    const faltantesPaso2: string[] = [];
    if (!solicitud.dom_calle) faltantesPaso2.push(this.obtenerEtiquetaLegible('dom_calle'));
    if (!solicitud.dom_colonia) faltantesPaso2.push(this.obtenerEtiquetaLegible('dom_colonia'));
    if (!solicitud.dom_municipio) faltantesPaso2.push(this.obtenerEtiquetaLegible('dom_municipio'));
    if (faltantesPaso2.length > 0) {
      pasosIncompletos.push('Paso 2: Domicilio');
      camposFaltantes['Paso 2'] = faltantesPaso2;
    }

    // Paso 3: Referencias
    const faltantesPaso3: string[] = [];
    if (!solicitud.ref1_nombre) faltantesPaso3.push(this.obtenerEtiquetaLegible('ref1_nombre'));
    if (!solicitud.ref2_nombre) faltantesPaso3.push(this.obtenerEtiquetaLegible('ref2_nombre'));
    if (faltantesPaso3.length > 0) {
      pasosIncompletos.push('Paso 3: Referencias');
      camposFaltantes['Paso 3'] = faltantesPaso3;
    }

    // Paso 4: Negocio
    const faltantesPaso4: string[] = [];
    if (!solicitud.negocio_giro) faltantesPaso4.push(this.obtenerEtiquetaLegible('negocio_giro'));
    if (!solicitud.negocio_ingreso_semanal) faltantesPaso4.push(this.obtenerEtiquetaLegible('negocio_ingreso_semanal'));
    if (faltantesPaso4.length > 0) {
      pasosIncompletos.push('Paso 4: Negocio');
      camposFaltantes['Paso 4'] = faltantesPaso4;
    }

    // Paso 5: Beneficiario
    const faltantesPaso5: string[] = [];
    if (!solicitud.beneficiario_nombre) faltantesPaso5.push(this.obtenerEtiquetaLegible('beneficiario_nombre'));
    if (!solicitud.beneficiario_parentesco) faltantesPaso5.push(this.obtenerEtiquetaLegible('beneficiario_parentesco'));
    if (faltantesPaso5.length > 0) {
      pasosIncompletos.push('Paso 5: Beneficiario');
      camposFaltantes['Paso 5'] = faltantesPaso5;
    }

    // Paso 6: Validaciones
    const faltantesPaso6: string[] = [];
    if (solicitud.tiene_medidor_luz === null || solicitud.tiene_medidor_luz === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('tiene_medidor_luz'));
    if (solicitud.vive_max_5km_tesorera === null || solicitud.vive_max_5km_tesorera === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('vive_max_5km_tesorera'));
    if (solicitud.tiene_menos_70_anios === null || solicitud.tiene_menos_70_anios === undefined) faltantesPaso6.push(this.obtenerEtiquetaLegible('tiene_menos_70_anios'));
    if (faltantesPaso6.length > 0) {
      pasosIncompletos.push('Paso 6: Validaciones');
      camposFaltantes['Paso 6'] = faltantesPaso6;
    }

    // Paso 7: Documentos (4 obligatorios) - Deben estar en el servidor
    const faltantesPaso7: string[] = [];
    if (!this.esRutaServidor(solicitud.doc_ine_ruta)) {
      faltantesPaso7.push(this.obtenerEtiquetaLegible('doc_ine_ruta') + ' - pendiente de subir');
    }
    if (!this.esRutaServidor(solicitud.doc_comprobante_ruta)) {
      faltantesPaso7.push(this.obtenerEtiquetaLegible('doc_comprobante_ruta') + ' - pendiente de subir');
    }
    if (!this.esRutaServidor(solicitud.doc_ine_beneficiario_ruta)) {
      faltantesPaso7.push(this.obtenerEtiquetaLegible('doc_ine_beneficiario_ruta') + ' - pendiente de subir');
    }
    if (!this.esRutaServidor(solicitud.doc_solicitud_firmada_ruta)) {
      faltantesPaso7.push(this.obtenerEtiquetaLegible('doc_solicitud_firmada_ruta') + ' - pendiente de subir');
    }
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

  async updateEstadoManual(id: string, estado: IntegranteEstado): Promise<IntegranteEntity> {
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
      });

      if (!integrante) {
        throw new Error(`Integrante con ID ${id} no encontrado`);
      }

      const estadosPermitidos = [
        IntegranteEstado.EN_VERIFICACION,
        IntegranteEstado.AUTORIZADA,
        IntegranteEstado.RECHAZADA,
        IntegranteEstado.SUJETA_CREDITO,
      ];

      if (!estadosPermitidos.includes(estado)) {
        throw new Error(`Solo se permiten cambios manuales a: ${estadosPermitidos.join(', ')}`);
      }

      // VALIDACIÓN: Si se intenta marcar como SUJETA_CREDITO, verificar que la solicitud esté completa
      if (estado === IntegranteEstado.SUJETA_CREDITO) {
        const validacion = await this.validarSolicitudCompleta(id);
        if (!validacion.completa) {
          const error = new Error('Solicitud incompleta. No se puede marcar como SUJETA_CREDITO.');
          (error as any).statusCode = 400;
          (error as any).response = {
            message: 'Solicitud incompleta',
            pasosIncompletos: validacion.pasosIncompletos,
            camposFaltantes: validacion.camposFaltantes,
          };
          throw error;
        }
      }

      integrante.estado = estado;
      return this.integranteRepository.save(integrante);
    } catch (error) {
      console.error('Error en updateEstadoManual:', error);
      throw error;
    }
  }

  async update(id: string, data: any): Promise<IntegranteEntity> {
    try {
      console.log('🔧 IntegrantesService.update() - ID:', id);
      console.log('🔧 Datos recibidos:', JSON.stringify(data, null, 2));

      const integrante = await this.integranteRepository.findOne({
        where: { id },
      });

      if (!integrante) {
        throw new Error(`Integrante con ID ${id} no encontrado`);
      }

      // Si vienen datos de persona, actualizar la tabla personas
      const camposPersona = ['nombres', 'apellido_pat', 'apellido_mat', 'telefono', 'telefonoSecundario', 'telefono_secundario', 'montoSolicitado'];
      const datosPersona: any = {};
      let hayDatosPersona = false;

      camposPersona.forEach((campo) => {
        if (data[campo] !== undefined) {
          hayDatosPersona = true;
          // Mapear campos del frontend a BD
          if (campo === 'telefonoSecundario') {
            datosPersona.telefono_secundario = data[campo];
            console.log('✅ Mapeando telefonoSecundario:', data[campo], '→ telefono_secundario');
          } else if (campo === 'telefono_secundario') {
            datosPersona.telefono_secundario = data[campo];
            console.log('✅ Mapeando telefono_secundario:', data[campo]);
          } else if (campo === 'montoSolicitado') {
            datosPersona.monto_solicitado = data[campo];
          } else if (campo === 'nombres') {
            datosPersona.nombres = data[campo];
          } else {
            datosPersona[campo] = data[campo];
          }
        }
      });

      // ELIMINAR campo 'nombre' si existe (no es una columna de la tabla personas)
      delete datosPersona.nombre;

      console.log('🔧 Datos a actualizar en persona:', JSON.stringify(datosPersona, null, 2));
      console.log('🔧 persona_id:', integrante.persona_id);

      // Actualizar persona si hay datos
      if (hayDatosPersona && integrante.persona_id) {
        await this.personaRepository.update(integrante.persona_id, datosPersona);
        console.log('✅ Persona actualizada');
      }

      // Actualizar campos de integrante
      const camposPermitidos = ['persona_id'];
      camposPermitidos.forEach((campo) => {
        if (data[campo as keyof IntegranteEntity] !== undefined) {
          (integrante as any)[campo] = data[campo as keyof IntegranteEntity];
        }
      });

      return this.integranteRepository.save(integrante);
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }
}
