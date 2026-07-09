import { Injectable } from '@nestjs/common';
import { SolicitudEntity } from './solicitudes.entity';

type SolicitudPayload = {
  solicitanteId: string;
  [key: string]: string | boolean | undefined;
};

@Injectable()
export class SolicitudesService {
  private solicitudes: SolicitudEntity[] = [
    {
      id: 'solicitud-demo-1',
      solicitanteId: 'sol-demo-completa',
      nombreCompleto: 'Ana Lopez Garcia',
      fechaNacimiento: '1992-02-10',
      curp: 'LOGA920210MDFPRN01',
      domicilio: 'Calle Central 100',
      beneficiarioNombre: 'Luis Lopez',
      beneficiarioTelefono: '5554441111',
      referencia1Nombre: 'Marta Diaz',
      referencia1Telefono: '5554442222',
      referencia2Nombre: 'Jose Ramos',
      referencia2Telefono: '5554443333',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  getBySolicitante(solicitanteId: string): SolicitudEntity | undefined {
    return this.solicitudes.find((solicitud) => solicitud.solicitanteId === solicitanteId);
  }

  createForSolicitante(dto: SolicitudPayload): SolicitudEntity {
    const created: SolicitudEntity = {
      id: `solicitud-${Math.random().toString(36).slice(2)}`,
      ...dto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.solicitudes.push(created);
    return created;
  }
}
