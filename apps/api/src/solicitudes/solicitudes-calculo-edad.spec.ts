import { SolicitudesService } from './solicitudes.service';

describe('Cálculo de tiene_menos_70_anios', () => {
  let service: any;
  let manager: any;
  let savedEntity: any;

  beforeEach(() => {
    service = new SolicitudesService(
      null, null, null, null, null, null, null, null, null, null, null,
    );

    manager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((_, data) => data),
      save: jest.fn((_, entity) => {
        savedEntity = entity;
        return Promise.resolve(entity);
      }),
    };
  });

  it('debe calcular SI para persona de 45 años', async () => {
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 45);

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac);

    expect(savedEntity.tiene_menos_70_anios).toBe('SI');
  });

  it('debe calcular NO para persona de 75 años', async () => {
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 75);

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac);

    expect(savedEntity.tiene_menos_70_anios).toBe('NO');
  });

  it('debe calcular NO exactamente para persona de 70 años cumplidos', async () => {
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 70);
    fechaNac.setDate(fechaNac.getDate() - 1); // Un día antes para que ya cumplió 70

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac);

    expect(savedEntity.tiene_menos_70_anios).toBe('NO');
  });

  it('debe calcular SI para persona de 69 años', async () => {
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 69);

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac);

    expect(savedEntity.tiene_menos_70_anios).toBe('SI');
  });

  it('debe recalcular si fecha_nac cambia', async () => {
    const fechaNac1 = new Date();
    fechaNac1.setFullYear(fechaNac1.getFullYear() - 45);

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac1);
    expect(savedEntity.tiene_menos_70_anios).toBe('SI');

    // Simular que ya existe
    manager.findOne.mockResolvedValue({ solicitud_id: 'solicitud-123' });

    const fechaNac2 = new Date();
    fechaNac2.setFullYear(fechaNac2.getFullYear() - 75);

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaNac2);
    expect(savedEntity.tiene_menos_70_anios).toBe('NO');
  });

  it('debe aceptar fecha_nac como string ISO', async () => {
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 50);
    const fechaString = fechaNac.toISOString().split('T')[0]; // YYYY-MM-DD

    await service.calcularTieneMenos70Anios(manager, 'solicitud-123', fechaString);

    expect(savedEntity.tiene_menos_70_anios).toBe('SI');
  });
});
