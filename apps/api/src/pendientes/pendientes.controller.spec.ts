import { Usuario } from '../catalogos/entities/usuario.entity';
import { PendientesController } from './pendientes.controller';
import { PendientesService } from './pendientes.service';

describe('PendientesController', () => {
  it('usa el usuario autenticado como alcance de la bandeja personal', async () => {
    const listRevisionDocumental = jest.fn().mockResolvedValue({
      total_pendientes: 0,
      grupos: [],
    });
    const service = { listRevisionDocumental } as unknown as PendientesService;
    const controller = new PendientesController(service);
    const request = {
      user: { id: 'usuario-autenticado' } as Usuario,
    };

    await expect(controller.listRevisionDocumental(request)).resolves.toEqual({
      total_pendientes: 0,
      grupos: [],
    });
    expect(listRevisionDocumental).toHaveBeenCalledWith('usuario-autenticado');
  });
});
