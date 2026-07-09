import { SolicitantesService } from './solicitantes.service';

describe('SolicitantesService', () => {
  it('creates a solicitante linked to an expediente', () => {
    const service = new SolicitantesService();
    const result = service.createForExpediente({
      expedienteId: 'exp-1',
      nombre: 'Ana López',
      telefono: '5551234',
      montoSolicitado: 5000,
    });

    expect(result.expedienteId).toBe('exp-1');
    expect(result.nombre).toBe('Ana López');
    expect(result.montoSolicitado).toBe(5000);
    expect(result.id).toBeTruthy();
  });
});
