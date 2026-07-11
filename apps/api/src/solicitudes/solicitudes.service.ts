import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudEntity } from './solicitud.entity';
import { SolicitantesService } from '../solicitantes/solicitantes.service';

type SolicitudPayload = {
  solicitanteId: string;
  [key: string]: string | boolean | number | undefined;
};

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @Inject(forwardRef(() => SolicitantesService))
    private readonly solicitantesService: SolicitantesService,
  ) {}

  async getBySolicitante(solicitanteId: string): Promise<SolicitudEntity | null> {
    return this.solicitudRepository.findOne({
      where: { solicitanteId },
    });
  }

  async createOrUpdateForSolicitante(dto: SolicitudPayload): Promise<SolicitudEntity> {
    // Buscar si ya existe una solicitud para este solicitante
    const existing = await this.solicitudRepository.findOne({
      where: { solicitanteId: dto.solicitanteId },
    });

    if (existing) {
      // Actualizar la existente
      const updated = this.solicitudRepository.merge(existing, dto);
      return this.solicitudRepository.save(updated);
    } else {
      // Crear nueva
      const solicitud = this.solicitudRepository.create(dto);
      return this.solicitudRepository.save(solicitud);
    }
  }

  // Mantener método legacy por si acaso
  async createForSolicitante(dto: SolicitudPayload): Promise<SolicitudEntity> {
    return this.createOrUpdateForSolicitante(dto);
  }

  async partialUpdate(solicitanteId: string, data: Partial<SolicitudEntity>): Promise<SolicitudEntity> {
    // Buscar solicitud existente
    let solicitud = await this.solicitudRepository.findOne({
      where: { solicitanteId },
    });

    if (!solicitud) {
      // Si no existe, crear nueva
      solicitud = this.solicitudRepository.create({
        solicitanteId,
        seccionCompletada: 0,
      });
    }

    // Merge solo campos no vacíos
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof SolicitudEntity];

      // Solo actualizar si el valor no es undefined, null o string vacío
      if (value !== undefined && value !== null && value !== '') {
        (solicitud as any)[key] = value;
      }
    });

    // Actualizar seccionCompletada si el número enviado es mayor al guardado
    if (data.seccionCompletada !== undefined && data.seccionCompletada > solicitud.seccionCompletada) {
      solicitud.seccionCompletada = data.seccionCompletada;
    }

    // Guardar y retornar
    const savedSolicitud = await this.solicitudRepository.save(solicitud);

    // Recalcular estado del solicitante después de actualizar la solicitud
    await this.solicitantesService.recalcularEstado(solicitanteId);

    return savedSolicitud;
  }
}
