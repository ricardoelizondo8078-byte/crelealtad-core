import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudEntity } from './solicitud.entity';
import { IntegrantesService } from '../integrantes/integrantes.service';

type SolicitudPayload = {
  solicitanteId?: string;
  integrante_id?: string;  // Campo correcto según schema v2
  integrante_id_old?: string;
  [key: string]: string | boolean | number | undefined | null;
};

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @Inject(forwardRef(() => IntegrantesService))
    private readonly integrantesService: IntegrantesService,
  ) {}

  async getBySolicitante(solicitanteId: string): Promise<SolicitudEntity | null> {
    return this.solicitudRepository.findOne({
      where: { integrante_id: solicitanteId },
    });
  }

  async createOrUpdateForSolicitante(dto: SolicitudPayload): Promise<SolicitudEntity> {
    // Buscar si ya existe una solicitud para este integrante
    // Prioridad: integrante_id (schema v2) > solicitanteId (legacy) > integrante_id_old (legacy)
    const integranteId = dto.integrante_id || dto.solicitanteId || dto.integrante_id_old;
    const existing = await this.solicitudRepository.findOne({
      where: { integrante_id: integranteId },
    });

    // Mapear campos del frontend a propiedades de la entidad
    const mappedDto = { ...dto };
    if (dto.fechaNacimiento) {
      mappedDto.fecha_nac = dto.fechaNacimiento;
      delete mappedDto.fechaNacimiento;
    }
    if (dto.estado_nacimiento_nuevo !== undefined) {
      mappedDto.estado_nacimiento = dto.estado_nacimiento_nuevo;
      delete mappedDto.estado_nacimiento_nuevo;
    }

    if (existing) {
      // Actualizar la existente
      const updated = this.solicitudRepository.merge(existing, mappedDto);
      return this.solicitudRepository.save(updated);
    } else {
      // Crear nueva
      const newDto = { ...mappedDto, integrante_id: integranteId };
      const solicitud = this.solicitudRepository.create(newDto as any);
      const saved = await this.solicitudRepository.save(solicitud);
      return Array.isArray(saved) ? saved[0] : saved;
    }
  }

  // Mantener método legacy por si acaso
  async createForSolicitante(dto: SolicitudPayload): Promise<SolicitudEntity> {
    return this.createOrUpdateForSolicitante(dto);
  }

  async partialUpdate(solicitanteId: string, data: any): Promise<SolicitudEntity> {
    console.log('🔍 partialUpdate - integrante_id:', solicitanteId);
    console.log('🔍 partialUpdate - data recibida:', JSON.stringify(data, null, 2));

    // Buscar solicitud existente
    let solicitud = await this.solicitudRepository.findOne({
      where: { integrante_id: solicitanteId },
    });

    if (!solicitud) {
      // Si no existe, crear nueva
      const created = this.solicitudRepository.create({
        integrante_id: solicitanteId,
      } as any);
      solicitud = Array.isArray(created) ? created[0] : created;
    }

    // Mapear campos del frontend a propiedades de la entidad
    const fieldMappings: Record<string, string> = {
      fechaNacimiento: 'fecha_nac',
      estadoCivil: 'estado_civil',
      nivelEstudio: 'nivel_estudio',
      estado_nacimiento_nuevo: 'estado_nacimiento',
      // Los siguientes mapeos se eliminan porque ya no existen columnas _nuevo
      // negocio_giro ya es el nombre correcto en la BD
      // negocio_gastos ya es el nombre correcto en la BD
    };

    const mappedData = { ...data };
    Object.entries(fieldMappings).forEach(([from, to]) => {
      if (mappedData[from] !== undefined) {
        mappedData[to] = mappedData[from];
        delete mappedData[from];
      }
    });

    // Merge solo campos no vacíos
    const camposActualizados: string[] = [];
    Object.keys(mappedData).forEach((key) => {
      const value = mappedData[key];

      // Solo actualizar si el valor no es undefined, null o string vacío
      if (value !== undefined && value !== null && value !== '') {
        (solicitud as any)[key] = value;
        camposActualizados.push(key);
      }
    });

    console.log('✅ Campos que se actualizarán:', camposActualizados.join(', '));

    // Guardar solicitud
    const savedSolicitud = await this.solicitudRepository.save(solicitud);

    // Recalcular estado del solicitante después de actualizar la solicitud
    // await this.integrantesService.recalcularEstado(solicitanteId);

    return savedSolicitud;
  }
}
