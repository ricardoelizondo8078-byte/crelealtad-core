import { GruposService } from './grupos.service';

describe('GruposService - alcance de asesor', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };
  const grupoRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const expedienteRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const dataSource = {
    query: jest.fn(),
    transaction: jest.fn(),
  };
  const transactionManager = {
    getRepository: (entity: { name?: string }) => entity.name === 'GrupoEntity'
      ? grupoRepository
      : expedienteRepository,
    query: jest.fn(),
  };

  let service: GruposService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(queryBuilder).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReturnThis' in mock) {
        (mock as jest.Mock).mockReturnThis();
      }
    });
    service = new GruposService(
      grupoRepository as never,
      dataSource as never,
    );
    dataSource.query.mockResolvedValue([{ id: 'empleado-1' }]);
    dataSource.transaction.mockImplementation(async (callback) => callback(transactionManager));
  });

  it('registra al usuario autenticado como propietario de un grupo nuevo y su expediente', async () => {
    grupoRepository.save.mockResolvedValue({ id: 'grupo-1', nombre: 'GRUPO UNO' });
    expedienteRepository.save.mockResolvedValue({ id: 'expediente-1' });

    const result = await service.create(
      { nombre: 'Grupo Uno' },
      { usuarioId: 'usuario-1', rolNombre: 'ASESOR' },
    );

    expect(grupoRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      created_by: 'usuario-1',
    }));
    expect(expedienteRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      grupo_id: 'grupo-1',
      asesora_id: 'empleado-1',
    }));
    expect(result).toEqual(expect.objectContaining({
      expedienteId: 'expediente-1',
      es_grupo_nuevo_ciclo_1: true,
    }));
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.query).toHaveBeenCalledTimes(2);
  });

  it('propaga el error si no puede crear el expediente para evitar un alta parcial', async () => {
    grupoRepository.save.mockResolvedValue({ id: 'grupo-1', nombre: 'GRUPO UNO' });
    expedienteRepository.save.mockRejectedValue(new Error('fallo de persistencia'));

    await expect(service.create(
      { nombre: 'Grupo Uno' },
      { usuarioId: 'usuario-1', rolNombre: 'ASESOR' },
    )).rejects.toThrow('fallo de persistencia');
  });

  it('limita la bandeja del rol ASESOR a sus expedientes', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await service.listAll({}, { usuarioId: 'usuario-1', rolNombre: 'ASESOR' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'expediente.asesora_id = :empleadoId',
      { empleadoId: 'empleado-1' },
    );
  });

  it('conserva la bandeja institucional para roles no asesores', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await service.listAll({}, { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' });

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });

  it('marca como nuevo solamente al expediente cuyo ciclo calculado es 1', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[
      {
        id: 'grupo-nuevo',
        nombre: 'GRUPO NUEVO',
        expedientes: [{ id: 'expediente-nuevo', estado: 'EN_DOCUMENTACION' }],
      },
      {
        id: 'grupo-renovado',
        nombre: 'GRUPO RENOVADO',
        expedientes: [{ id: 'expediente-renovado', estado: 'EN_DOCUMENTACION' }],
      },
    ], 2]);
    dataSource.query.mockResolvedValue([
      { expediente_id: 'expediente-nuevo', numero_ciclo: '1' },
      { expediente_id: 'expediente-renovado', numero_ciclo: '5' },
    ]);

    const result = await service.listAll({}, { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' });

    expect(result.data).toEqual([
      expect.objectContaining({ id: 'grupo-nuevo', es_grupo_nuevo_ciclo_1: true }),
      expect.objectContaining({ id: 'grupo-renovado', es_grupo_nuevo_ciclo_1: false }),
    ]);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("a.accion = 'INICIO_RENOVACION'"),
      [['expediente-nuevo', 'expediente-renovado']],
    );
  });

  it('selecciona de forma determinista el expediente más reciente del grupo', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[
      {
        id: 'grupo-1',
        nombre: 'GRUPO UNO',
        expedientes: [
          {
            id: 'expediente-anterior',
            estado: 'FINALIZADO',
            created_at: new Date('2025-01-01T00:00:00.000Z'),
          },
          {
            id: 'expediente-actual',
            estado: 'EN_DOCUMENTACION',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      },
    ], 1]);
    dataSource.query
      .mockResolvedValueOnce([{ expediente_id: 'expediente-actual', numero_ciclo: '2' }])
      .mockResolvedValueOnce([]);

    const result = await service.listAll({}, {
      usuarioId: 'usuario-1',
      rolNombre: 'VERIFICADOR',
    });

    expect(result.data[0]).toEqual(expect.objectContaining({
      expedienteId: 'expediente-actual',
      estado: 'EN_DOCUMENTACION',
    }));
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      [['expediente-actual']],
    );
  });

  it('marca el grupo para revisar cuando una integrante volvió a Documentación', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[
      {
        id: 'grupo-observado',
        nombre: 'GRUPO OBSERVADO',
        expedientes: [{ id: 'expediente-observado', estado: 'EN_VERIFICACION' }],
      },
    ], 1]);
    dataSource.query
      .mockResolvedValueOnce([{ expediente_id: 'expediente-observado', numero_ciclo: '2' }])
      .mockResolvedValueOnce([{ expediente_id: 'expediente-observado' }]);

    const result = await service.listAll({}, { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' });

    expect(result.data).toEqual([
      expect.objectContaining({
        id: 'grupo-observado',
        requiere_revision_documental: true,
      }),
    ]);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('i.estado = $3'),
      [['expediente-observado'], 'EN_VERIFICACION', 'DOCUMENTANDO'],
    );
  });
});
