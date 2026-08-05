import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpedienteEntity } from './expediente.entity';
import { IntegranteEntity } from '../integrantes/integrante.entity';

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(ExpedienteEntity)
    private readonly expedienteRepository: Repository<ExpedienteEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
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

  async getIntegrantes(expedienteId: string): Promise<any[]> {
    const integrantes = await this.integranteRepository
      .createQueryBuilder('integrante')
      .leftJoinAndSelect('integrante.persona', 'persona')
      .where('integrante.expediente_id = :expedienteId', { expedienteId })
      .getMany();

    return integrantes.map(int => ({
      id: int.id,
      nombre: int.persona?.nombre_completo || 'Sin nombre',
      nombres: int.persona?.nombres,
      apellido_pat: int.persona?.apellido_pat,
      telefono: int.persona?.telefono,
      monto_solicitado: int.persona?.monto_solicitado || 0,
      es_tesorera: false, // TODO: Agregar campo en la entidad
      ciclo: 1, // TODO: Obtener del expediente
    }));
  }

  async sendToVerification(id: string): Promise<ExpedienteEntity | null> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id },
    });

    if (!expediente) {
      return null;
    }

    expediente.estado = 'EN_VERIFICACION';
    expediente.estado_fecha = new Date(); // Actualizar fecha de cambio de estado
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
