import { ExpedienteEstado } from '../expedientes/expediente.entity';
import {
  IntegranteEstado,
  MotivoRetiroIntegrante,
} from './integrante.entity';
import { IntegrantesService } from './integrantes.service';

interface IntegranteParticipacionMock {
  id: string;
  expediente_id: string;
  estado: IntegranteEstado;
  motivo_retiro: MotivoRetiroIntegrante | null;
  motivo_retiro_detalle: string | null;
  retirada_at: Date | null;
  retirada_por: string | null;
}

describe('IntegrantesService - participación en el expediente', () => {
  const integranteRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
      query: jest.fn(),
    },
  };
  const expedienteRepository = { findOne: jest.fn(), save: jest.fn() };
  const personaRepository = {};
  const solicitudesService = {};
  const transactionManager = {
    getRepository: jest.fn((entity: { name?: string }) => (
      entity.name === 'ExpedienteEntity'
        ? expedienteRepository
        : integranteRepository
    )),
    query: jest.fn(),
  };

  let service: IntegrantesService;
  const scope = { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' };

  beforeEach(() => {
    jest.clearAllMocks();
    integranteRepository.manager.transaction.mockImplementation(
      async (operation) => operation(transactionManager),
    );
    integranteRepository.save.mockImplementation(async (value) => value);
    expedienteRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: null,
    });
    expedienteRepository.save.mockImplementation(async (value) => value);
    service = new IntegrantesService(
      integranteRepository as never,
      personaRepository as never,
      solicitudesService as never,
    );
  });

  it('retira una integrante completa con motivo, actor y auditoría', async () => {
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
      motivo_retiro: null,
      motivo_retiro_detalle: null,
      retirada_at: null,
      retirada_por: null,
    };
    integranteRepository.findOne
      .mockResolvedValueOnce(integrante)
      .mockResolvedValueOnce(integrante);

    const result = await service.retirarDeExpediente(
      'integrante-1',
      { motivo_retiro: MotivoRetiroIntegrante.DESCANSA_RENOVACION },
      scope,
    );

    expect(result).toEqual(expect.objectContaining({
      estado: IntegranteEstado.RETIRADA,
      motivo_retiro: MotivoRetiroIntegrante.DESCANSA_RENOVACION,
      retirada_por: 'usuario-1',
    }));
    expect(expedienteRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      lock: { mode: 'pessimistic_write' },
    }));
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['integrante-1', 'RETIRO_CICLO', 'usuario-1']),
    );
  });

  it('no duplica auditoría cuando el mismo retiro ya estaba confirmado', async () => {
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.RETIRADA,
      motivo_retiro: MotivoRetiroIntegrante.DOCUMENTACION_INCOMPLETA,
      motivo_retiro_detalle: null,
      retirada_at: new Date(),
      retirada_por: 'usuario-1',
    };
    integranteRepository.findOne
      .mockResolvedValueOnce(integrante)
      .mockResolvedValueOnce(integrante);

    await service.retirarDeExpediente(
      'integrante-1',
      { motivo_retiro: MotivoRetiroIntegrante.DOCUMENTACION_INCOMPLETA },
      scope,
    );

    expect(integranteRepository.save).not.toHaveBeenCalled();
    expect(transactionManager.query).not.toHaveBeenCalled();
  });

  it('exige explicación cuando el motivo es Otro', async () => {
    await expect(service.retirarDeExpediente(
      'integrante-1',
      { motivo_retiro: MotivoRetiroIntegrante.OTRO },
      scope,
    )).rejects.toThrow('Escribe el motivo');
    expect(integranteRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('reintegra como completa cuando la solicitud todavía cumple 7/7', async () => {
    jest.spyOn(service, 'validarSolicitudCompleta').mockResolvedValue({
      completa: true,
      pasosIncompletos: [],
      camposFaltantes: {},
    });
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.RETIRADA,
      motivo_retiro: MotivoRetiroIntegrante.DESCANSA_RENOVACION,
      motivo_retiro_detalle: null,
      retirada_at: new Date(),
      retirada_por: 'usuario-anterior',
    };
    integranteRepository.findOne
      .mockResolvedValueOnce(integrante)
      .mockResolvedValueOnce(integrante);

    const result = await service.reintegrarEnExpediente('integrante-1', scope);

    expect(result).toEqual(expect.objectContaining({
      estado: IntegranteEstado.SUJETA_CREDITO,
      motivo_retiro: null,
      retirada_por: null,
    }));
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('REINTEGRO_CICLO'),
      expect.arrayContaining(['integrante-1', 'usuario-1']),
    );
  });

  it('reintegra como pendiente cuando la solicitud ya no está completa', async () => {
    jest.spyOn(service, 'validarSolicitudCompleta').mockResolvedValue({
      completa: false,
      pasosIncompletos: ['Paso 7: Documentos'],
      camposFaltantes: { 'Paso 7': ['INE'] },
    });
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.RETIRADA,
      motivo_retiro: MotivoRetiroIntegrante.DOCUMENTACION_INCOMPLETA,
      motivo_retiro_detalle: null,
      retirada_at: new Date(),
      retirada_por: 'usuario-anterior',
    };
    integranteRepository.findOne
      .mockResolvedValueOnce(integrante)
      .mockResolvedValueOnce(integrante);

    const result = await service.reintegrarEnExpediente('integrante-1', scope);

    expect(result.estado).toBe(IntegranteEstado.DOCUMENTANDO);
  });

  it('bloquea cambios de participación después del handoff', async () => {
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
      motivo_retiro: null,
      motivo_retiro_detalle: null,
      retirada_at: null,
      retirada_por: null,
    };
    integranteRepository.findOne.mockResolvedValueOnce(integrante);
    expedienteRepository.findOne.mockResolvedValue({
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_VERIFICACION,
    });

    await expect(service.retirarDeExpediente(
      'integrante-1',
      { motivo_retiro: MotivoRetiroIntegrante.DECIDIO_NO_CONTINUAR },
      scope,
    )).rejects.toThrow('mientras el expediente está en documentación');
    expect(integranteRepository.save).not.toHaveBeenCalled();
  });

  it('al retirar a la tesorera limpia la asignación y audita ambos cambios', async () => {
    const integrante: IntegranteParticipacionMock = {
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      estado: IntegranteEstado.SUJETA_CREDITO,
      motivo_retiro: null,
      motivo_retiro_detalle: null,
      retirada_at: null,
      retirada_por: null,
    };
    integranteRepository.findOne
      .mockResolvedValueOnce(integrante)
      .mockResolvedValueOnce(integrante);
    const expediente = {
      id: 'expediente-1',
      estado: ExpedienteEstado.EN_DOCUMENTACION,
      tesorera_integrante_id: 'integrante-1',
    };
    expedienteRepository.findOne.mockResolvedValue(expediente);

    await service.retirarDeExpediente(
      'integrante-1',
      { motivo_retiro: MotivoRetiroIntegrante.DESCANSA_RENOVACION },
      scope,
    );

    expect(expedienteRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      tesorera_integrante_id: null,
    }));
    expect(transactionManager.query).toHaveBeenCalledTimes(2);
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('DESASIG_TESORERA'),
      expect.arrayContaining(['expediente-1', 'usuario-1']),
    );
  });
});
