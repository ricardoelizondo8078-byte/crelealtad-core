import { ExpedientesService } from '../expedientes/expedientes.service';
import { GruposService } from './grupos.service';

describe('GruposService', () => {
  it('creates a group with uppercase name and linked expediente', () => {
    const expedientesService = new ExpedientesService();
    const service = new GruposService(expedientesService);
    const result = service.create({ name: 'Grupo Demo', advisorName: 'Ana', createdBy: 'advisor' });

    expect(result.name).toBe('GRUPO DEMO');
    expect(result.status).toBe('active');
    expect(result.id).toBeTruthy();

    const createdExpediente = expedientesService
      .listByGroup('group-1')
      .find((expediente) => expediente.title === 'GRUPO DEMO');
    expect(createdExpediente).toBeTruthy();
  });
});
