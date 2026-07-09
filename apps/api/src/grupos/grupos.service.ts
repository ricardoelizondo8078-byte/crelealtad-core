import { Injectable } from '@nestjs/common';
import { ExpedientesService } from '../expedientes/expedientes.service';
import { GrupoEntity } from './grupos.entity';

@Injectable()
export class GruposService {
  private grupos: GrupoEntity[] = [];

  constructor(private readonly expedientesService: ExpedientesService) {}

  create(dto: { name: string; advisorName?: string; createdBy?: string }) {
    const normalizedName = dto.name.trim().toUpperCase();
    const now = new Date().toISOString();
    const created: GrupoEntity = {
      id: Math.random().toString(36).slice(2),
      name: normalizedName,
      advisorName: dto.advisorName,
      createdBy: dto.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: 'active',
    };

    this.grupos.push(created);
    const createdExpediente = this.expedientesService.createForGroup({
      groupId: 'group-1',
      title: normalizedName,
      status: 'En proceso',
    });

    return {
      ...created,
      expediente: createdExpediente,
    };
  }
}
