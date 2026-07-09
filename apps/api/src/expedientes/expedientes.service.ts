import { Injectable } from '@nestjs/common';
import { ExpedienteEntity } from './expedientes.entity';

@Injectable()
export class ExpedientesService {
  private expedientes: ExpedienteEntity[] = [
    {
      id: 'exp-1',
      groupId: 'demo-group',
      title: 'Expediente inicial',
      status: 'En proceso',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      groupId: 'demo-group',
      title: 'Expediente complementario',
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  listByGroup(groupId: string): ExpedienteEntity[] {
    return this.expedientes.filter((expediente) => expediente.groupId === groupId);
  }

  getById(id: string): ExpedienteEntity | undefined {
    return this.expedientes.find((expediente) => expediente.id === id);
  }

  sendToVerification(id: string): ExpedienteEntity | undefined {
    const expediente = this.expedientes.find((currentExpediente) => currentExpediente.id === id);

    if (!expediente) {
      return undefined;
    }

    expediente.status = 'En verificacion';
    expediente.updatedAt = new Date().toISOString();
    return expediente;
  }

  createForGroup(dto: { groupId: string; title: string; status: string }): ExpedienteEntity {
    const created: ExpedienteEntity = {
      id: `exp-${Math.random().toString(36).slice(2)}`,
      groupId: dto.groupId,
      title: dto.title,
      status: dto.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.expedientes.push(created);
    return created;
  }
}
