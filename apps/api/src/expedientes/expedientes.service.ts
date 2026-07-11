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
      where: { groupId },
    });
  }

  async getById(id: string): Promise<ExpedienteEntity | null> {
    return this.expedienteRepository.findOne({
      where: { id },
      relations: {
        solicitantes: true,
      },
    });
  }

  async sendToVerification(id: string): Promise<ExpedienteEntity | null> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id },
    });

    if (!expediente) {
      return null;
    }

    expediente.status = 'En verificacion';
    return this.expedienteRepository.save(expediente);
  }

  async createForGroup(dto: { groupId: string; title: string; status: string }): Promise<ExpedienteEntity> {
    const expediente = this.expedienteRepository.create({
      groupId: dto.groupId,
      title: dto.title,
      status: dto.status,
    });

    return this.expedienteRepository.save(expediente);
  }
}
