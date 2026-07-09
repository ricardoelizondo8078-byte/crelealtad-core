import { ExpedientesService } from './expedientes.service';

describe('ExpedientesService', () => {
  it('creates an expediente linked to a group', () => {
    const service = new ExpedientesService();
    const result = service.createForGroup({
      groupId: 'group-1',
      title: 'Expediente Demo',
      status: 'En proceso',
    });

    expect(result.groupId).toBe('group-1');
    expect(result.title).toBe('Expediente Demo');
    expect(result.status).toBe('En proceso');
    expect(result.id).toBeTruthy();
  });

  it('sends an expediente to verification', () => {
    const service = new ExpedientesService();

    const result = service.sendToVerification('exp-1');

    expect(result?.status).toBe('En verificacion');
    expect(service.getById('exp-1')?.status).toBe('En verificacion');
  });
});
