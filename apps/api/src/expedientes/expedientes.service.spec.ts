import { ExpedienteEstado } from './expediente.entity';
import { ExpedientesService } from './expedientes.service';
import { IntegranteEstado } from '../integrantes/integrante.entity';

describe('ExpedientesService - bandeja de verificación', () => {
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const expedienteRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const expedienteTransactionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const integranteTransactionRepository = { find: jest.fn(), findOne: jest.fn() };
  const transactionManager = {
    getRepository: jest.fn((entity: { name?: string }) =>
      entity.name === 'ExpedienteEntity'
        ? expedienteTransactionRepository
        : integranteTransactionRepository,
    ),
    query: jest.fn(),
  };
  const dataSource = { transaction: jest.fn(), query: jest.fn() };

  let service: ExpedientesService;
  const scope = { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(queryBuilder).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReturnThis' in mock) {
        (mock as jest.Mock).mockReturnThis();
      }
    });
    dataSource.transaction.mockImplementation(async (operation) => operation(transactionManager));
    service = new ExpedientesService(
      expedienteRepository as never,
      dataSource as never,
    );
  });

  it('devuelve conteos, identifica el ciclo 1 y señala la revisión documental abierta', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        grupo_id: 'grupo-1',
        grupo_nombre: 'GRUPO UNO',
        expediente_id: 'expediente-1',
        expediente_estado: ExpedienteEstado.EN_VERIFICACION,
        estado_fecha: new Date('2026-08-29T12:00:00.000Z'),
        integrantes_count: '4',
        requiere_revision_documental: true,
      },
      {
        grupo_id: 'grupo-2',
        grupo_nombre: 'GRUPO DOS',
        expediente_id: 'expediente-2',
        expediente_estado: ExpedienteEstado.EN_VERIFICACION,
        estado_fecha: new Date('2026-08-30T12:00:00.000Z'),
        integrantes_count: '3',
        requiere_revision_documental: false,
      },
    ]);
    dataSource.query.mockResolvedValue([
      { expediente_id: 'expediente-1', numero_ciclo: '1' },
      { expediente_id: 'expediente-2', numero_ciclo: '4' },
    ]);

    const result = await service.listEnVerificacion(scope);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'expediente.estado = :estado',
      { estado: ExpedienteEstado.EN_VERIFICACION },
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      expect.anything(),
      'integrante',
      expect.stringContaining('integrante.estado <> :retirada'),
      { retirada: IntegranteEstado.RETIRADA },
    );
    expect(result).toEqual([
      expect.objectContaining({
        expediente_id: 'expediente-1',
        integrantes_count: 4,
        es_grupo_nuevo_ciclo_1: true,
        requiere_revision_documental: true,
      }),
      expect.objectContaining({
        expediente_id: 'expediente-2',
        integrantes_count: 3,
        es_grupo_nuevo_ciclo_1: false,
        requiere_revision_documental: false,
      }),
    ]);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("a.accion = 'INICIO_RENOVACION'"),
      [['expediente-1', 'expediente-2']],
    );
    expect(queryBuilder.setParameter).toHaveBeenCalledWith(
      'documentando',
      IntegranteEstado.DOCUMENTANDO,
    );
  });

  it('envía a verificación de forma atómica y registra auditoría', async () => {
    const expediente: {
      id: string;
      estado: ExpedienteEstado;
      tesorera_integrante_id: string | null;
    } = {
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: 'integrante-1',
    };
    expedienteTransactionRepository.findOne.mockResolvedValue(expediente);
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.SUJETA_CREDITO },
    ]);
    expedienteTransactionRepository.save.mockImplementation(async (value) => value);

    const result = await service.sendToVerification('expediente-1', scope);

    expect(result?.estado).toBe(ExpedienteEstado.EN_VERIFICACION);
    expect(expedienteTransactionRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      lock: { mode: 'pessimistic_write' },
    }));
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('ENVIO_VERIFICACION'),
      expect.arrayContaining(['expediente-1', 'usuario-1']),
    );
  });

  it('no repite la transición ni la auditoría si ya está en verificación', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_VERIFICACION,
    });

    const result = await service.sendToVerification('expediente-1', scope);

    expect(result?.estado).toBe(ExpedienteEstado.EN_VERIFICACION);
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
    expect(transactionManager.query).not.toHaveBeenCalled();
  });

  it('bloquea el envío si conserva integrantes incompletas', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    });
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.DOCUMENTANDO },
    ]);

    await expect(service.sendToVerification('expediente-1', scope))
      .rejects.toThrow('documentación obligatoria pendiente');
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('ignora retiradas formalmente y envía sólo integrantes completas', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: 'integrante-1',
    });
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.SUJETA_CREDITO },
      { id: 'integrante-2', estado: IntegranteEstado.RETIRADA },
    ]);
    expedienteTransactionRepository.save.mockImplementation(async (value) => value);

    const result = await service.sendToVerification('expediente-1', scope);

    expect(result?.estado).toBe(ExpedienteEstado.EN_VERIFICACION);
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('ENVIO_VERIFICACION'),
      expect.arrayContaining([
        'expediente-1',
        expect.stringContaining('"integrantes_enviadas":1'),
        'usuario-1',
      ]),
    );
  });

  it('bloquea el envío cuando todas las integrantes están retiradas', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    });
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.RETIRADA },
    ]);

    await expect(service.sendToVerification('expediente-1', scope))
      .rejects.toThrow('al menos una integrante completa');
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('selecciona una tesorera participante y registra auditoría', async () => {
    const expediente: {
      id: string;
      estado: ExpedienteEstado;
      tesorera_integrante_id: string | null;
    } = {
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    };
    expedienteTransactionRepository.findOne.mockResolvedValue(expediente);
    integranteTransactionRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
    });
    expedienteTransactionRepository.save.mockImplementation(async (value) => value);

    const result = await service.seleccionarTesorera(
      'expediente-1',
      'integrante-1',
      scope,
    );

    expect(result.tesorera_integrante_id).toBe('integrante-1');
    expect(integranteTransactionRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'integrante-1', expediente_id: 'expediente-1' },
      lock: { mode: 'pessimistic_write' },
    }));
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['expediente-1', 'ASIGNA_TESORERA', 'usuario-1']),
    );
  });

  it('no duplica auditoría al confirmar la misma tesorera', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: 'integrante-1',
    });
    integranteTransactionRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
    });

    await service.seleccionarTesorera('expediente-1', 'integrante-1', scope);

    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
    expect(transactionManager.query).not.toHaveBeenCalled();
  });

  it('rechaza como tesorera a una integrante que no participa', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    });
    integranteTransactionRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      estado: IntegranteEstado.DOCUMENTANDO,
    });

    await expect(service.seleccionarTesorera(
      'expediente-1',
      'integrante-1',
      scope,
    )).rejects.toThrow('documentación completa');
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('bloquea el envío cuando falta seleccionar tesorera', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    });
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.SUJETA_CREDITO },
    ]);

    await expect(service.sendToVerification('expediente-1', scope))
      .rejects.toThrow('Selecciona la tesorera');
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
  });

  it('bloquea el envío cuando la tesorera dejó de ser participante', async () => {
    expedienteTransactionRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: 'integrante-2',
    });
    integranteTransactionRepository.find.mockResolvedValue([
      { id: 'integrante-1', estado: IntegranteEstado.SUJETA_CREDITO },
      { id: 'integrante-2', estado: IntegranteEstado.RETIRADA },
    ]);

    await expect(service.sendToVerification('expediente-1', scope))
      .rejects.toThrow('debe tener su documentación completa');
    expect(expedienteTransactionRepository.save).not.toHaveBeenCalled();
  });
});
