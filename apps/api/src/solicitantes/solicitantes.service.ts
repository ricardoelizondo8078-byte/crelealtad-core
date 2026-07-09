import { Injectable } from '@nestjs/common';
import { SolicitanteEntity } from './solicitantes.entity';

@Injectable()
export class SolicitantesService {
  private solicitantes: SolicitanteEntity[] = [
    {
      id: 'sol-demo-completa',
      expedienteId: 'exp-1',
      nombre: 'Ana Lopez',
      telefono: '5551001000',
      montoSolicitado: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sol-demo-pendiente',
      expedienteId: 'exp-1',
      nombre: 'Brenda Ruiz',
      telefono: '5552002000',
      montoSolicitado: 6000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  listByExpediente(expedienteId: string): SolicitanteEntity[] {
    return this.solicitantes.filter((solicitante) => solicitante.expedienteId === expedienteId);
  }

  createForExpediente(dto: { expedienteId: string; nombre: string; telefono: string; montoSolicitado: number }): SolicitanteEntity {
    const created: SolicitanteEntity = {
      id: `sol-${Math.random().toString(36).slice(2)}`,
      expedienteId: dto.expedienteId,
      nombre: dto.nombre,
      telefono: dto.telefono,
      montoSolicitado: dto.montoSolicitado,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.solicitantes.push(created);
    return created;
  }
}
