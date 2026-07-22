import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpedientesService } from '../expedientes/expedientes.service';
import { GrupoEntity, GrupoEstado } from './grupo.entity';
import { IntegranteEstado } from '../integrantes/integrante.entity';
import { ExpedienteEntity } from '../expedientes/expediente.entity';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(GrupoEntity)
    private readonly grupoRepository: Repository<GrupoEntity>,
    @InjectRepository(ExpedienteEntity)
    private readonly expedienteRepository: Repository<ExpedienteEntity>,
    private readonly expedientesService: ExpedientesService,
  ) {}

  async create(dto: { name: string }) {
    const normalizedName = dto.name.trim().toUpperCase();

    const grupo = this.grupoRepository.create({
      nombre: normalizedName,
      fecha_inicio: new Date(),
      estado: GrupoEstado.FORMANDO,
    } as any);

    const saved = await this.grupoRepository.save(grupo);
    const entity = Array.isArray(saved) ? saved[0] : saved;

    // Crear expediente automáticamente
    try {
      const expediente = this.expedienteRepository.create({
        grupo_id: entity.id,
        estado: 'EN_DOCUMENTACION',
        asesora_id: null,
        producto_id: null,
      } as any);
      const savedExpediente = await this.expedienteRepository.save(expediente);
      const expedienteEntity = Array.isArray(savedExpediente) ? savedExpediente[0] : savedExpediente;
      console.log('Expediente creado:', expedienteEntity.id);
      return { ...entity, name: entity.nombre, expedienteId: expedienteEntity.id };
    } catch (err) {
      console.error('ERROR al crear expediente:', err.message);
      return { ...entity, name: entity.nombre, expedienteId: null };
    }
  }

  async getById(id: string): Promise<any> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
    });

    if (!grupo) {
      return null;
    }

    return {
      id: grupo.id,
      nombre: grupo.nombre,
      estado: grupo.estado,
      fecha_inicio: grupo.fecha_inicio,
      created_at: grupo.created_at,
    };
  }

  async listAll() {
    const grupos = await this.grupoRepository.find();
    const result = await Promise.all(
      grupos.map(async (grupo) => {
        const expediente = await this.expedienteRepository.findOne({
          where: { grupo_id: grupo.id },
        });
        return {
          ...grupo,
          name: grupo.nombre,
          expedienteId: expediente?.id ?? null,
        };
      })
    );
    return result;
  }
}
