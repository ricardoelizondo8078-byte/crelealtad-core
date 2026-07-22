import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpedienteEntity } from './expediente.entity';

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(ExpedienteEntity)
    private readonly expedienteRepository: Repository<ExpedienteEntity>,
  ) {}

  async listAll(): Promise<ExpedienteEntity[]> {
    return this.expedienteRepository.find();
  }

  async listByGroup(groupId: string): Promise<ExpedienteEntity[]> {
    return this.expedienteRepository.find({
      where: { grupo_id: groupId },
    });
  }

  async getById(id: string): Promise<ExpedienteEntity | null> {
    return this.expedienteRepository.findOne({
      where: { id },
    });
  }

  async sendToVerification(id: string): Promise<ExpedienteEntity | null> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id },
    });

    if (!expediente) {
      return null;
    }

    expediente.estado = 'EN_REVISION';
    return this.expedienteRepository.save(expediente);
  }

  async createForGroup(dto: { grupo_id: string }): Promise<ExpedienteEntity> {
    const expediente = this.expedienteRepository.create({
      grupo_id: dto.grupo_id,
      estado: 'EN_DOCUMENTACION',
    } as any);

    const saved = await this.expedienteRepository.save(expediente);
    return Array.isArray(saved) ? saved[0] : saved;
  }
}
