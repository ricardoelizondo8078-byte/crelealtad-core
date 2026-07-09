import { SolicitudesService } from './solicitudes.service';

describe('SolicitudesService', () => {
  it('creates a solicitud attached to a solicitante', () => {
    const service = new SolicitudesService();
    const result = service.createForSolicitante({
      solicitanteId: 'sol-1',
      nombreCompleto: 'Ana López',
      fechaNacimiento: '1990-01-01',
      curp: 'LOPA900101',
      domicilio: 'Calle 1',
      beneficiarioNombre: 'Juan López',
      beneficiarioTelefono: '5550000',
      referencia1Nombre: 'María',
      referencia1Telefono: '5550001',
      referencia2Nombre: 'Pedro',
      referencia2Telefono: '5550002',
    });

    expect(result.solicitanteId).toBe('sol-1');
    expect(result.nombreCompleto).toBe('Ana López');
    expect(result.curp).toBe('LOPA900101');
    expect(result.id).toBeTruthy();
  });
});
