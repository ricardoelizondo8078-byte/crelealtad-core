import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEstado } from '../integrantes/integrante.entity';
import {
  RegistrarEncuestaLlamadaDto,
  RespuestaCoincidenciaLlamada,
} from './dto/registrar-encuesta-llamada.dto';
import { AccionPosteriorLlamadaVerificacion } from './verificacion-llamada-encuesta.entity';
import { TipoTelefonoEntrevista } from './verificacion-entrevista-telefono-confirmacion.entity';
import {
  CanalLlamadaVerificacion,
  ResultadoLlamadaVerificacion,
} from './verificacion-llamada.entity';
import { VerificacionLlamadasService } from './verificacion-llamadas.service';

describe('VerificacionLlamadasService', () => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const encuestaQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const llamadaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const integranteRepository = {
    findOne: jest.fn(),
  };
  const encuestaRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => encuestaQueryBuilder),
  };
  const evidenciaRepository = {
    findOne: jest.fn(),
  };
  const confirmacionTelefonoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
    query: jest.fn(),
  };
  const evidenciaStorage = {
    guardar: jest.fn(),
    leer: jest.fn(),
    descartar: jest.fn(),
  };
  const manager = {
    create: jest.fn((_entity, value) => value),
    save: jest.fn(),
    query: jest.fn(),
    getRepository: jest.fn(),
  };
  const personaTransactionRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  let service: VerificacionLlamadasService;

  const integranteEnVerificacion = {
    id: '11111111-1111-4111-8111-111111111111',
    persona_id: '77777777-7777-4777-8777-777777777777',
    estado: IntegranteEstado.SUJETA_CREDITO,
    expediente: { estado: ExpedienteEstado.EN_VERIFICACION },
  };

  const input = {
    canal: CanalLlamadaVerificacion.TELEFONICA,
    resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
    idempotency_key: 'call_20260918_abcdef',
    ubicacion_latitud: 25.6866142,
    ubicacion_longitud: -100.3161126,
    ubicacion_precision_metros: 8.5,
    ubicacion_capturada_at: '2026-09-21T18:43:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(queryBuilder).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReturnThis' in mock) {
        (mock as jest.Mock).mockReturnThis();
      }
    });
    integranteRepository.findOne.mockResolvedValue(integranteEnVerificacion);
    queryBuilder.getRawMany.mockResolvedValue([]);
    encuestaQueryBuilder.getRawOne.mockResolvedValue(null);
    encuestaRepository.findOne.mockResolvedValue(null);
    evidenciaRepository.findOne.mockResolvedValue(null);
    confirmacionTelefonoRepository.findOne.mockResolvedValue(null);
    confirmacionTelefonoRepository.find.mockResolvedValue([]);
    dataSource.query.mockResolvedValue([]);
    evidenciaStorage.descartar.mockResolvedValue(undefined);
    llamadaRepository.count.mockResolvedValue(0);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    manager.getRepository.mockReturnValue(personaTransactionRepository);
    personaTransactionRepository.findOne.mockResolvedValue({
      id: integranteEnVerificacion.persona_id,
      telefono: '8110000000',
      telefono_secundario: null,
    });
    personaTransactionRepository.update.mockResolvedValue({ affected: 1 });
    service = new VerificacionLlamadasService(
      llamadaRepository as never,
      encuestaRepository as never,
      evidenciaRepository as never,
      confirmacionTelefonoRepository as never,
      integranteRepository as never,
      dataSource as never,
      evidenciaStorage as never,
    );
  });

  it('registra actor, canal y resultado y devuelve los contadores actualizados', async () => {
    llamadaRepository.save.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      ...input,
      integrante_id: integranteEnVerificacion.id,
      registrada_por: '33333333-3333-4333-8333-333333333333',
      created_at: new Date('2026-09-18T18:00:00.000Z'),
    });
    queryBuilder.getRawMany.mockResolvedValue([
      {
        canal: CanalLlamadaVerificacion.TELEFONICA,
        resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
        cantidad: '1',
      },
    ]);

    const result = await service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      input,
    );

    expect(llamadaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      integrante_id: integranteEnVerificacion.id,
      registrada_por: '33333333-3333-4333-8333-333333333333',
      canal: CanalLlamadaVerificacion.TELEFONICA,
      resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
      ubicacion_latitud: input.ubicacion_latitud,
      ubicacion_longitud: input.ubicacion_longitud,
      ubicacion_precision_metros: input.ubicacion_precision_metros,
      ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(result.resumen.telefonica).toEqual({ no_contestadas: 1, contestadas: 0 });
    expect(result.resumen.whatsapp).toEqual({ no_contestadas: 0, contestadas: 0 });
  });

  it('reutiliza la evidencia de Llamada para confirmar el teléfono en Entrevista', async () => {
    const confirmadaAt = new Date('2026-09-28T18:00:00.000Z');
    dataSource.query.mockResolvedValue([{
      llamada_id: '22222222-2222-4222-8222-222222222222',
      tipo_telefono: TipoTelefonoEntrevista.PRINCIPAL,
      telefono: '8112345678',
      confirmada_at: confirmadaAt,
    }]);

    const resumen = await service.obtenerResumen(integranteEnVerificacion.id);

    expect(resumen.telefonos_confirmados.PRINCIPAL).toEqual({
      telefono: '8112345678',
      confirmada_at: confirmadaAt,
      llamada_id: '22222222-2222-4222-8222-222222222222',
      evidencia_url:
        `/verificacion/integrantes/${integranteEnVerificacion.id}/llamadas/22222222-2222-4222-8222-222222222222/confirmacion-telefono/evidencia-actual`,
    });
    expect(resumen.telefonos_confirmados.SECUNDARIO).toBeNull();
  });

  it('reutiliza el intento cuando se reenvía la misma clave y los mismos datos', async () => {
    const existente = {
      id: '22222222-2222-4222-8222-222222222222',
      ...input,
      integrante_id: integranteEnVerificacion.id,
      registrada_por: '33333333-3333-4333-8333-333333333333',
      created_at: new Date('2026-09-18T18:00:00.000Z'),
    };
    llamadaRepository.save.mockRejectedValue({ code: '23505' });
    llamadaRepository.findOne.mockResolvedValue(existente);

    const result = await service.registrar(
      integranteEnVerificacion.id,
      existente.registrada_por,
      input,
    );

    expect(result.llamada.id).toBe(existente.id);
    expect(llamadaRepository.findOne).toHaveBeenCalledWith({
      where: {
        registrada_por: existente.registrada_por,
        idempotency_key: input.idempotency_key,
      },
    });
  });

  it('rechaza reutilizar una clave con otro resultado', async () => {
    llamadaRepository.save.mockRejectedValue({ code: '23505' });
    llamadaRepository.findOne.mockResolvedValue({
      integrante_id: integranteEnVerificacion.id,
      canal: input.canal,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
    });

    await expect(service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      input,
    )).rejects.toBeInstanceOf(ConflictException);
  });

  it('bloquea WhatsApp cuando todavía no existe una llamada telefónica', async () => {
    await expect(service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      { ...input, canal: CanalLlamadaVerificacion.WHATSAPP },
    )).rejects.toThrow(
      'Primero registra el resultado de una llamada por teléfono para habilitar WhatsApp',
    );

    expect(llamadaRepository.count).toHaveBeenCalledWith({
      where: {
        integrante_id: integranteEnVerificacion.id,
        canal: CanalLlamadaVerificacion.TELEFONICA,
      },
    });
    expect(llamadaRepository.save).not.toHaveBeenCalled();
  });

  it('habilita WhatsApp después de cualquier resultado telefónico registrado', async () => {
    llamadaRepository.count.mockResolvedValue(1);
    llamadaRepository.save.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      ...input,
      canal: CanalLlamadaVerificacion.WHATSAPP,
      integrante_id: integranteEnVerificacion.id,
      registrada_por: '33333333-3333-4333-8333-333333333333',
      created_at: new Date('2026-09-21T18:00:00.000Z'),
    });

    await expect(service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      { ...input, canal: CanalLlamadaVerificacion.WHATSAPP },
    )).resolves.toBeDefined();

    expect(llamadaRepository.save).toHaveBeenCalled();
  });

  it('bloquea nuevos registros fuera de un expediente en verificación', async () => {
    integranteRepository.findOne.mockResolvedValue({
      ...integranteEnVerificacion,
      expediente: { estado: ExpedienteEstado.EN_DOCUMENTACION },
    });

    await expect(service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      input,
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(llamadaRepository.save).not.toHaveBeenCalled();
  });

  it('bloquea nuevos registros para una integrante que no está lista', async () => {
    integranteRepository.findOne.mockResolvedValue({
      ...integranteEnVerificacion,
      estado: IntegranteEstado.DOCUMENTANDO,
    });

    await expect(service.registrar(
      integranteEnVerificacion.id,
      '33333333-3333-4333-8333-333333333333',
      input,
    )).rejects.toBeInstanceOf(BadRequestException);
  });

  it('informa cuando la integrante no existe', async () => {
    integranteRepository.findOne.mockResolvedValue(null);

    await expect(service.obtenerResumen(integranteEnVerificacion.id))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('agrega los cuatro contadores y convierte COUNT a número', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        canal: CanalLlamadaVerificacion.TELEFONICA,
        resultado: ResultadoLlamadaVerificacion.CONTESTADA,
        cantidad: '2',
      },
      {
        canal: CanalLlamadaVerificacion.TELEFONICA,
        resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
        cantidad: '3',
      },
      {
        canal: CanalLlamadaVerificacion.WHATSAPP,
        resultado: ResultadoLlamadaVerificacion.CONTESTADA,
        cantidad: '4',
      },
      {
        canal: CanalLlamadaVerificacion.WHATSAPP,
        resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
        cantidad: '5',
      },
    ]);

    const result = await service.obtenerResumen(integranteEnVerificacion.id);

    expect(result).toEqual({
      telefonica: { no_contestadas: 3, contestadas: 2 },
      whatsapp: { no_contestadas: 5, contestadas: 4 },
      proceso: { completado: false, completado_at: null },
      telefonos_confirmados: { PRINCIPAL: null, SECUNDARIO: null },
    });
  });

  it('guarda respuestas, seis coincidencias, evidencia y auditoría antes de completar', async () => {
    const llamadaId = '22222222-2222-4222-8222-222222222222';
    const encuestaId = '44444444-4444-4444-8444-444444444444';
    const evidenciaId = '55555555-5555-4555-8555-555555555555';
    llamadaRepository.findOne.mockResolvedValue({
      id: llamadaId,
      integrante_id: integranteEnVerificacion.id,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
    });
    evidenciaStorage.guardar.mockResolvedValue({
      id: evidenciaId,
      ruta: '/evidencia',
      mime_type: 'image/png',
      tamano_bytes: 8,
      sha256: 'a'.repeat(64),
    });
    manager.save.mockImplementation(async (_entity, value) => (
      'llamada_id' in value ? { ...value, id: encuestaId } : value
    ));
    evidenciaRepository.findOne.mockResolvedValue({
      id: evidenciaId,
      ruta: '/evidencia',
      mime_type: 'image/png',
      tamano_bytes: 8,
    });
    const input: RegistrarEncuestaLlamadaDto = {
      identidad_coincide: RespuestaCoincidenciaLlamada.SI,
      domicilio_coincide: RespuestaCoincidenciaLlamada.SI,
      numero_plantas: RespuestaCoincidenciaLlamada.SI,
      color_domicilio: RespuestaCoincidenciaLlamada.SI,
      cochera_entrada: RespuestaCoincidenciaLlamada.SI,
      banqueta_frente: RespuestaCoincidenciaLlamada.SI,
      objeto_visible: RespuestaCoincidenciaLlamada.SI,
      referencia_exterior: RespuestaCoincidenciaLlamada.SI,
      accion_posterior: AccionPosteriorLlamadaVerificacion.ENTREVISTA_CORTA,
    };

    const result = await service.registrarEncuesta(
      integranteEnVerificacion.id,
      llamadaId,
      '33333333-3333-4333-8333-333333333333',
      input,
      { buffer: Buffer.from([0x89]), mimetype: 'image/png', size: 1 },
    );

    expect(result.encuesta.completada).toBe(true);
    expect(manager.save).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.objectContaining({ encuesta_id: encuestaId, coincide: true }),
      ]),
    );
    const caracteristicas = manager.save.mock.calls.find(([, value]) => Array.isArray(value));
    expect(caracteristicas?.[1]).toHaveLength(6);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('ENCUESTA_LLAMADA'),
      expect.any(Array),
    );
  });

  it('conserva el proceso pendiente cuando la acción es llamar más tarde', async () => {
    const llamadaId = '22222222-2222-4222-8222-222222222222';
    llamadaRepository.findOne.mockResolvedValue({
      id: llamadaId,
      integrante_id: integranteEnVerificacion.id,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
    });
    evidenciaStorage.guardar.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      ruta: '/evidencia',
      mime_type: 'image/jpeg',
      tamano_bytes: 10,
      sha256: 'b'.repeat(64),
    });
    manager.save.mockImplementation(async (_entity, value) => (
      'llamada_id' in value
        ? { ...value, id: '44444444-4444-4444-8444-444444444444' }
        : value
    ));
    evidenciaRepository.findOne.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      ruta: '/evidencia',
      mime_type: 'image/jpeg',
      tamano_bytes: 10,
    });
    const respuestasSi = RespuestaCoincidenciaLlamada.SI;

    const result = await service.registrarEncuesta(
      integranteEnVerificacion.id,
      llamadaId,
      '33333333-3333-4333-8333-333333333333',
      {
        identidad_coincide: respuestasSi,
        domicilio_coincide: respuestasSi,
        numero_plantas: respuestasSi,
        color_domicilio: respuestasSi,
        cochera_entrada: respuestasSi,
        banqueta_frente: respuestasSi,
        objeto_visible: respuestasSi,
        referencia_exterior: respuestasSi,
        accion_posterior: AccionPosteriorLlamadaVerificacion.LLAMAR_MAS_TARDE,
      },
      { buffer: Buffer.from([0xff]), mimetype: 'image/jpeg', size: 1 },
    );

    expect(result.encuesta.completada).toBe(false);
    expect(manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ completada_at: null }),
    );
  });

  it('exige evidencia para registrar las cuatro respuestas', async () => {
    llamadaRepository.findOne.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      integrante_id: integranteEnVerificacion.id,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
    });

    await expect(service.registrarEncuesta(
      integranteEnVerificacion.id,
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      {} as RegistrarEncuestaLlamadaDto,
      undefined,
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(evidenciaStorage.guardar).not.toHaveBeenCalled();
  });

  it('confirma un teléfono sólo con llamada contestada, evidencia y auditoría', async () => {
    const llamadaId = '22222222-2222-4222-8222-222222222222';
    const evidenciaId = '55555555-5555-4555-8555-555555555555';
    llamadaRepository.findOne.mockResolvedValue({
      id: llamadaId,
      integrante_id: integranteEnVerificacion.id,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
    });
    evidenciaStorage.guardar.mockResolvedValue({
      id: evidenciaId,
      ruta: '/confirmacion-telefono/evidencia',
      mime_type: 'image/jpeg',
      tamano_bytes: 12,
      sha256: 'c'.repeat(64),
    });
    manager.save.mockImplementation(async (_entity, value) => ({ ...value, id: evidenciaId }));
    confirmacionTelefonoRepository.find.mockResolvedValue([{
      id: evidenciaId,
      integrante_id: integranteEnVerificacion.id,
      llamada_id: llamadaId,
      tipo_telefono: TipoTelefonoEntrevista.SECUNDARIO,
      telefono: '8112345678',
      created_at: new Date('2026-09-28T18:00:00.000Z'),
    }]);

    const result = await service.registrarConfirmacionTelefono(
      integranteEnVerificacion.id,
      llamadaId,
      '33333333-3333-4333-8333-333333333333',
      { tipo_telefono: TipoTelefonoEntrevista.SECUNDARIO, telefono: '8112345678' },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    );

    expect(result.confirmacion).toEqual(expect.objectContaining({
      id: evidenciaId,
      llamada_id: llamadaId,
      tipo_telefono: TipoTelefonoEntrevista.SECUNDARIO,
      telefono: '8112345678',
    }));
    expect(evidenciaStorage.guardar).toHaveBeenCalledWith(
      integranteEnVerificacion.id,
      llamadaId,
      expect.any(Object),
      expect.stringContaining('/confirmacion-telefono/evidencia'),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('TELEFONO_CONFIRMADO'),
      expect.any(Array),
    );
    expect(personaTransactionRepository.update).toHaveBeenCalledWith(
      integranteEnVerificacion.persona_id,
      { telefono_secundario: '8112345678' },
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'personas',
        integranteEnVerificacion.persona_id,
        'TELEFONO_VERIFICADO',
      ]),
    );
    expect(result.resumen.proceso.completado).toBe(true);
  });

  it('rechaza confirmar el teléfono cuando la llamada no fue contestada', async () => {
    llamadaRepository.findOne.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      integrante_id: integranteEnVerificacion.id,
      resultado: ResultadoLlamadaVerificacion.NO_CONTESTADA,
    });

    await expect(service.registrarConfirmacionTelefono(
      integranteEnVerificacion.id,
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      { tipo_telefono: TipoTelefonoEntrevista.PRINCIPAL, telefono: '8112345678' },
      { buffer: Buffer.from([0xff]), mimetype: 'image/jpeg', size: 1 },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(evidenciaStorage.guardar).not.toHaveBeenCalled();
  });
});
