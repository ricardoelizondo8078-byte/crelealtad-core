import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEntity, IntegranteEstado } from '../integrantes/integrante.entity';
import { VerificacionEntrevistaDesacuerdoMontoEntity } from './verificacion-entrevista-desacuerdo-monto.entity';
import { VerificacionEntrevistaEvidenciaEntity } from './verificacion-entrevista-evidencia.entity';
import { VerificacionEntrevistaFamiliarEntity } from './verificacion-entrevista-familiar.entity';
import { VerificacionEntrevistaEntity } from './verificacion-entrevista.entity';
import { VerificacionEntrevistaService } from './verificacion-entrevista.service';

describe('VerificacionEntrevistaService', () => {
  const integranteId = '11111111-1111-4111-8111-111111111111';
  const expedienteId = '55555555-5555-4555-8555-555555555555';
  const otraIntegranteId = '66666666-6666-4666-8666-666666666666';
  const evidenciaId = '22222222-2222-4222-8222-222222222222';
  const usuarioId = '33333333-3333-4333-8333-333333333333';
  const motivoClasificacionId = '44444444-4444-4444-8444-444444444444';
  const scope = {
    usuarioId,
    rolNombre: 'VERIFICADOR',
    mode: 'INSTITUCIONAL' as const,
  };
  const evidenciaInput = {
    tipo: 'NEGOCIO' as const,
    idempotency_key: 'business_photo_20261003_abcdef',
    foto_capturada_at: '2026-10-03T18:42:00.000Z',
    ubicacion_latitud: 25.686614238,
    ubicacion_longitud: -100.316112689,
    ubicacion_precision_metros: 8.567,
    ubicacion_capturada_at: '2026-10-03T18:42:01.000Z',
  };
  const evidenciaGuardada = {
    id: evidenciaId,
    integrante_id: integranteId,
    expediente_id: expedienteId,
    tipo: 'NEGOCIO' as const,
    clasificacion_semaforo: null as 'VERDE' | 'AMARILLO' | 'ROJO' | null,
    motivo_clasificacion_id: null as string | null,
    ruta: `/verificacion/integrantes/${integranteId}/entrevista/evidencias/${evidenciaId}/archivo`,
    mime_type: 'image/jpeg' as const,
    tamano_bytes: 5,
    sha256: 'a'.repeat(64),
    captura_fuente: 'CAMARA' as const,
    foto_capturada_at: new Date(evidenciaInput.foto_capturada_at),
    idempotency_key: evidenciaInput.idempotency_key,
    registrada_por: usuarioId,
    ubicacion_latitud: 25.6866142,
    ubicacion_longitud: -100.3161127,
    ubicacion_precision_metros: 8.57,
    ubicacion_capturada_at: new Date(evidenciaInput.ubicacion_capturada_at),
    ubicacion_fuente: 'DISPOSITIVO' as const,
    legado_sin_ubicacion: false,
    created_at: new Date('2026-10-03T18:44:00.000Z'),
  };
  const entrevistaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const familiarRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    find: jest.fn(),
  };
  const desacuerdoRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    find: jest.fn(),
  };
  const evidenciaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const integranteTxRepository = { find: jest.fn() };
  const integranteRepository = {
    manager: { query: jest.fn() },
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === VerificacionEntrevistaEntity) return entrevistaRepository;
      if (entity === VerificacionEntrevistaFamiliarEntity) return familiarRepository;
      if (entity === VerificacionEntrevistaDesacuerdoMontoEntity) return desacuerdoRepository;
      if (entity === VerificacionEntrevistaEvidenciaEntity) return evidenciaRepository;
      if (entity === IntegranteEntity) return integranteTxRepository;
      throw new Error('Repositorio inesperado');
    }),
    query: jest.fn(),
  };
  const dataSource = { query: jest.fn(), transaction: jest.fn() };
  const storage = {
    guardar: jest.fn(),
    leer: jest.fn(),
    descartar: jest.fn(),
  };
  const parametrosEvidenciaMotivos = {
    obtenerActivo: jest.fn(),
  };
  let service: VerificacionEntrevistaService;

  beforeEach(() => {
    jest.clearAllMocks();
    manager.query.mockImplementation(async (query: string) => (
      query.includes('FROM parametros_entrevista_opciones') ? [{ existe: 1 }] : []
    ));
    integranteRepository.findOne.mockResolvedValue({
      id: integranteId,
      expediente_id: expedienteId,
      estado: IntegranteEstado.SUJETA_CREDITO,
      expediente: { estado: ExpedienteEstado.EN_VERIFICACION },
    });
    familiarRepository.find.mockResolvedValue([]);
    desacuerdoRepository.find.mockResolvedValue([]);
    integranteRepository.find.mockResolvedValue([{ id: integranteId }]);
    evidenciaRepository.save.mockResolvedValue(evidenciaGuardada);
    evidenciaRepository.find.mockResolvedValue([evidenciaGuardada]);
    dataSource.query.mockResolvedValue([{
      ...evidenciaGuardada,
      integrante_ids: [integranteId],
    }]);
    storage.guardar.mockResolvedValue({
      id: evidenciaId,
      ruta: evidenciaGuardada.ruta,
      mime_type: evidenciaGuardada.mime_type,
      tamano_bytes: evidenciaGuardada.tamano_bytes,
      sha256: evidenciaGuardada.sha256,
    });
    storage.descartar.mockResolvedValue(undefined);
    parametrosEvidenciaMotivos.obtenerActivo.mockResolvedValue({
      id: motivoClasificacionId,
      clasificacion: 'VERDE',
      concepto: 'Información consistente',
      activo: true,
      created_at: new Date('2026-10-10T12:00:00.000Z'),
      updated_at: new Date('2026-10-10T12:00:00.000Z'),
    });
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    service = new VerificacionEntrevistaService(
      entrevistaRepository as never,
      familiarRepository as never,
      desacuerdoRepository as never,
      evidenciaRepository as never,
      integranteRepository as never,
      dataSource as never,
      storage as never,
      parametrosEvidenciaMotivos as never,
    );
  });

  it('guarda una fotografía con actor y ubicación sin copiar coordenadas a auditoría', async () => {
    const resultado = await service.registrarEvidencia(
      integranteId,
      scope,
      evidenciaInput,
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
    );

    expect(evidenciaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      integrante_id: integranteId,
      tipo: 'NEGOCIO',
      captura_fuente: 'CAMARA',
      registrada_por: usuarioId,
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161127,
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(resultado.evidencias).toHaveLength(1);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_entrevista_evidencias',
        evidenciaId,
        'EVID_ENTREVISTA',
      ]),
    );
    expect(JSON.stringify(manager.query.mock.calls[0][1])).not.toContain('25.686');
    expect(JSON.stringify(manager.query.mock.calls[0][1])).not.toContain('-100.316');
  });

  it.each([
    'HISTORIAL_CREDITO_ACTIVO',
    'HISTORIAL_CREDITO_INACTIVO',
  ] as const)(
    'clasifica y recupera sin límite una evidencia de %s',
    async (tipo) => {
      const guardada = {
        ...evidenciaGuardada,
        tipo,
        clasificacion_semaforo: 'VERDE' as const,
        motivo_clasificacion_id: motivoClasificacionId,
      };
      evidenciaRepository.save.mockResolvedValueOnce(guardada);
      integranteRepository.find.mockResolvedValueOnce([
        { id: integranteId },
        { id: otraIntegranteId },
      ]);
      dataSource.query.mockResolvedValueOnce([{
        ...guardada,
        integrante_ids: [integranteId, otraIntegranteId],
        motivo_clasificacion: 'Información consistente',
      }]);

      const resultado = await service.registrarEvidencia(
        integranteId,
        scope,
        {
          ...evidenciaInput,
          tipo,
          idempotency_key: `credit_photo_${tipo.toLowerCase()}`,
          integrante_ids: [integranteId, otraIntegranteId],
          clasificacion_semaforo: 'VERDE',
          motivo_clasificacion_id: motivoClasificacionId,
        },
        { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
      );

      expect(storage.guardar).toHaveBeenCalledWith(integranteId, tipo, expect.any(Object));
      expect(evidenciaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        tipo,
        clasificacion_semaforo: 'VERDE',
        motivo_clasificacion_id: motivoClasificacionId,
      }));
      expect(manager.query).toHaveBeenCalledWith(
        expect.stringContaining('verificacion_entrevista_evidencia_integrantes'),
        expect.arrayContaining([integranteId, otraIntegranteId]),
      );
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN verificacion_entrevista_evidencia_integrantes acceso'),
        [integranteId, tipo],
      );
      expect(resultado.evidencias).toEqual([
        expect.objectContaining({
          tipo,
          integrante_ids: [integranteId, otraIntegranteId],
          clasificacion_semaforo: 'VERDE',
          motivo_clasificacion_id: motivoClasificacionId,
          motivo_clasificacion: 'Información consistente',
        }),
      ]);
    },
  );

  it('guarda desde galería sólo el historial externo, sin inventar hora original de la foto', async () => {
    const guardada = {
      ...evidenciaGuardada,
      tipo: 'HISTORIAL_CREDITO_ACTIVO' as const,
      captura_fuente: 'GALERIA' as const,
      foto_capturada_at: null as Date | null,
      clasificacion_semaforo: 'VERDE' as const,
      motivo_clasificacion_id: motivoClasificacionId,
    };
    evidenciaRepository.save.mockResolvedValueOnce(guardada);
    dataSource.query.mockResolvedValueOnce([{
      ...guardada,
      integrante_ids: [integranteId],
      motivo_clasificacion: 'Información consistente',
    }]);
    const inputSinHoraDeFoto = {
      tipo: evidenciaInput.tipo,
      idempotency_key: evidenciaInput.idempotency_key,
      ubicacion_latitud: evidenciaInput.ubicacion_latitud,
      ubicacion_longitud: evidenciaInput.ubicacion_longitud,
      ubicacion_precision_metros: evidenciaInput.ubicacion_precision_metros,
      ubicacion_capturada_at: evidenciaInput.ubicacion_capturada_at,
    };

    const resultado = await service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...inputSinHoraDeFoto,
        tipo: 'HISTORIAL_CREDITO_ACTIVO',
        captura_fuente: 'GALERIA',
        integrante_ids: [integranteId],
        clasificacion_semaforo: 'VERDE',
        motivo_clasificacion_id: motivoClasificacionId,
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01]), mimetype: 'image/jpeg', size: 4 },
    );

    expect(evidenciaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'HISTORIAL_CREDITO_ACTIVO',
      captura_fuente: 'GALERIA',
      foto_capturada_at: null,
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(resultado.evidencia).toEqual(expect.objectContaining({
      captura_fuente: 'GALERIA',
      foto_capturada_at: null,
    }));
  });

  it('rechaza galería para evidencias distintas al historial externo', async () => {
    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        captura_fuente: 'GALERIA',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('obliga a elegir integrantes antes de guardar evidencia de otra financiera', async () => {
    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
         tipo: 'HISTORIAL_CREDITO_ACTIVO',
         clasificacion_semaforo: 'AMARILLO',
         motivo_clasificacion_id: motivoClasificacionId,
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('obliga a clasificar el semáforo antes de guardar evidencia de otra financiera', async () => {
    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        tipo: 'HISTORIAL_CREDITO_ACTIVO',
        integrante_ids: [integranteId],
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('obliga a elegir exactamente un motivo antes de guardar evidencia de otra financiera', async () => {
    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        tipo: 'HISTORIAL_CREDITO_ACTIVO',
        integrante_ids: [integranteId],
        clasificacion_semaforo: 'VERDE',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(parametrosEvidenciaMotivos.obtenerActivo).not.toHaveBeenCalled();
    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('conserva la idempotencia si el motivo fue desactivado después del primer registro', async () => {
    const existente = {
      ...evidenciaGuardada,
      tipo: 'HISTORIAL_CREDITO_ACTIVO' as const,
      clasificacion_semaforo: 'VERDE' as const,
      motivo_clasificacion_id: motivoClasificacionId,
    };
    evidenciaRepository.findOne.mockResolvedValueOnce(existente);
    evidenciaRepository.save.mockRejectedValueOnce({ code: '23505' });
    dataSource.query
      .mockResolvedValueOnce([{ integrante_id: integranteId }])
      .mockResolvedValueOnce([{
        ...existente,
        integrante_ids: [integranteId],
        motivo_clasificacion: 'Información consistente',
      }]);

    const resultado = await service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        tipo: 'HISTORIAL_CREDITO_ACTIVO',
        integrante_ids: [integranteId],
        clasificacion_semaforo: 'VERDE',
        motivo_clasificacion_id: motivoClasificacionId,
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
    );

    expect(parametrosEvidenciaMotivos.obtenerActivo).toHaveBeenCalledWith(
      motivoClasificacionId,
      'VERDE',
      true,
    );
    expect(storage.descartar).toHaveBeenCalledWith(
      integranteId,
      'HISTORIAL_CREDITO_ACTIVO',
      evidenciaId,
    );
    expect(resultado.evidencia).toEqual(expect.objectContaining({ id: evidenciaId }));
  });

  it('rechaza una clasificación de semáforo para evidencia que no es de otra financiera', async () => {
    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        clasificacion_semaforo: 'ROJO',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('rechaza asociar evidencia con integrantes fuera del expediente', async () => {
    integranteRepository.find.mockResolvedValueOnce([{ id: integranteId }]);

    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      {
        ...evidenciaInput,
        tipo: 'HISTORIAL_CREDITO_INACTIVO',
        integrante_ids: [integranteId, otraIntegranteId],
        clasificacion_semaforo: 'ROJO',
        motivo_clasificacion_id: motivoClasificacionId,
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('edita las integrantes de una evidencia sin borrar el historial de asociación', async () => {
    const evidenciaHistorial = {
      ...evidenciaGuardada,
      tipo: 'HISTORIAL_CREDITO_ACTIVO' as const,
    };
    evidenciaRepository.findOne.mockResolvedValueOnce(evidenciaHistorial);
    integranteRepository.find.mockResolvedValueOnce([
      { id: integranteId },
      { id: otraIntegranteId },
    ]);
    manager.query
      .mockResolvedValueOnce([{ integrante_id: integranteId }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const resultado = await service.actualizarIntegrantesEvidencia(
      integranteId,
      evidenciaId,
      scope,
      { integrante_ids: [integranteId, otraIntegranteId] },
    );

    expect(resultado.evidencia.integrante_ids).toEqual([integranteId, otraIntegranteId]);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('SET activo = FALSE'),
      [evidenciaId, [integranteId, otraIntegranteId], usuarioId],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (evidencia_id, integrante_id) DO UPDATE'),
      [evidenciaId, expedienteId, [integranteId, otraIntegranteId], usuarioId],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_entrevista_evidencias',
        evidenciaId,
        'EDITA_EVID_ASOC',
      ]),
    );
    expect(manager.query.mock.calls.some(([consulta]) => (
      String(consulta).includes('DELETE FROM verificacion_entrevista_evidencia_integrantes')
    ))).toBe(false);
  });

  it('impide editar una evidencia que no está asociada a la integrante consultada', async () => {
    evidenciaRepository.findOne.mockResolvedValueOnce({
      ...evidenciaGuardada,
      tipo: 'HISTORIAL_CREDITO_INACTIVO',
    });
    manager.query.mockResolvedValueOnce([{ integrante_id: otraIntegranteId }]);

    await expect(service.actualizarIntegrantesEvidencia(
      integranteId,
      evidenciaId,
      scope,
      { integrante_ids: [integranteId] },
    )).rejects.toBeInstanceOf(NotFoundException);

    expect(integranteRepository.find).not.toHaveBeenCalled();
  });

  it('califica una imagen únicamente en la asociación con la integrante y audita el cambio', async () => {
    const calificadaAt = new Date('2026-10-11T19:10:00.000Z');
    manager.query
      .mockResolvedValueOnce([{
        calificacion_revision: null,
        calificada_at: null,
      }])
      .mockResolvedValueOnce([{
        calificacion_revision: 'AMARILLO',
        calificada_at: calificadaAt,
      }])
      .mockResolvedValueOnce(undefined);

    const resultado = await service.calificarEvidenciaIntegrante(
      integranteId,
      evidenciaId,
      scope,
      { calificacion: 'AMARILLO' },
    );

    expect(resultado).toEqual({
      evidencia_id: evidenciaId,
      integrante_id: integranteId,
      calificacion_revision: 'AMARILLO',
      calificada_at: calificadaAt,
    });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE evidencia_id = $1\n           AND integrante_id = $2'),
      [evidenciaId, integranteId, 'AMARILLO', usuarioId],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_entrevista_evidencia_integrantes',
        evidenciaId,
        'CALIF_EVIDENCIA',
      ]),
    );
  });

  it('rechaza calificar una imagen que no está asociada a la integrante', async () => {
    manager.query.mockResolvedValueOnce([]);

    await expect(service.calificarEvidenciaIntegrante(
      integranteId,
      evidenciaId,
      scope,
      { calificacion: 'TACHA' },
    )).rejects.toBeInstanceOf(NotFoundException);

    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('guarda respuestas tipadas y toma al entrevistador exclusivamente del JWT', async () => {
    const entrevistaGuardada = {
      id: '77777777-7777-4777-8777-777777777777',
      expediente_id: expedienteId,
      integrante_id: integranteId,
      conoce_asesora: true,
      como_conocio_asesora: 'OTRA_INTEGRANTE',
      convivientes: ['HIJOS'],
      fuentes_ingreso: ['NEGOCIO'],
      entrevistada_por: usuarioId,
      actualizada_por: usuarioId,
      revision: 1,
      created_at: new Date('2026-10-03T18:40:00.000Z'),
      updated_at: new Date('2026-10-03T18:40:00.000Z'),
    };
    entrevistaRepository.findOne.mockResolvedValue(null);
    entrevistaRepository.save.mockResolvedValue(entrevistaGuardada);

    const resultado = await service.guardarEntrevista(integranteId, scope, {
      conoce_asesora: true,
      como_conocio_asesora: 'OTRA_INTEGRANTE',
      convivientes: ['HIJOS'],
      fuentes_ingreso: ['NEGOCIO'],
      familiares_grupo_ids: [],
      desacuerdos_montos: [],
    });

    expect(entrevistaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      expediente_id: expedienteId,
      integrante_id: integranteId,
      entrevistada_por: usuarioId,
      actualizada_por: usuarioId,
      revision: 1,
    }));
    expect(resultado.entrevista).toEqual(expect.objectContaining({
      conoce_asesora: true,
      familiares_grupo_ids: [],
      desacuerdos_montos: [],
    }));
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining("familia = 'COMO_CONOCIO_ASESORA'"),
      ['OTRA_INTEGRANTE'],
    );
  });

  it('rechaza una opción inactiva o ajena al catálogo de cómo conoció a la asesora', async () => {
    manager.query.mockResolvedValueOnce([]);

    await expect(service.guardarEntrevista(integranteId, scope, {
      conoce_asesora: true,
      como_conocio_asesora: 'CODIGO_NO_ACTIVO',
    })).rejects.toThrow('Cómo conoció a la asesora debe ser una opción activa del catálogo');
    expect(entrevistaRepository.save).not.toHaveBeenCalled();
  });

  it('bloquea una entrevista atrasada cuando el servidor ya tiene otros datos', async () => {
    entrevistaRepository.findOne.mockResolvedValue({
      id: '77777777-7777-4777-8777-777777777777',
      expediente_id: expedienteId,
      integrante_id: integranteId,
      conoce_asesora: false,
      revision: 2,
    });

    await expect(service.guardarEntrevista(integranteId, scope, {
      expected_revision: 1,
      conoce_asesora: true,
    })).rejects.toBeInstanceOf(ConflictException);
    expect(entrevistaRepository.save).not.toHaveBeenCalled();
  });

  it('acepta sin duplicar una repetición cuyo contenido ya quedó confirmado', async () => {
    const input = { expected_revision: 1 };
    const mapped = (service as unknown as {
      mapearEntrevista: (value: typeof input) => Record<string, unknown>;
    }).mapearEntrevista(input);
    entrevistaRepository.findOne.mockResolvedValue({
      ...mapped,
      id: '77777777-7777-4777-8777-777777777777',
      expediente_id: expedienteId,
      integrante_id: integranteId,
      revision: 2,
    });

    const resultado = await service.guardarEntrevista(integranteId, scope, input);

    expect(resultado.entrevista).toEqual(expect.objectContaining({ revision: 2 }));
    expect(entrevistaRepository.save).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('mapea el monto del último préstamo del crédito externo', () => {
    const mapped = (service as unknown as {
      mapearEntrevista: (
        value: { monto_ultimo_prestamo_credito_grupal: number },
      ) => Record<string, unknown>;
    }).mapearEntrevista({ monto_ultimo_prestamo_credito_grupal: 18000 });

    expect(mapped.monto_ultimo_prestamo_credito_grupal).toBe(18000);
  });

  it('rechaza relaciones hacia integrantes de otro expediente', async () => {
    integranteTxRepository.find.mockResolvedValue([]);

    await expect(service.guardarEntrevista(integranteId, scope, {
      conoce_tesorera: true,
      tesorera_reconocida_integrante_id: '66666666-6666-4666-8666-666666666666',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(entrevistaRepository.save).not.toHaveBeenCalled();
  });

  it('rechaza datos condicionales cuando la respuesta que los habilita no aplica', async () => {
    await expect(service.guardarEntrevista(integranteId, scope, {
      tiene_otro_credito_grupal: false,
      financiera_credito_grupal: 'OTRA',
    })).rejects.toBeInstanceOf(BadRequestException);

    await expect(service.guardarEntrevista(integranteId, scope, {
      tiene_otro_credito_grupal: false,
      monto_ultimo_prestamo_credito_grupal: 18000,
    })).rejects.toBeInstanceOf(BadRequestException);

    await expect(service.guardarEntrevista(integranteId, scope, {
      fuentes_ingreso: [],
      tipo_negocio: 'ABARROTES',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('bloquea escrituras fuera de un expediente en verificación', async () => {
    integranteRepository.findOne.mockResolvedValue({
      id: integranteId,
      expediente_id: expedienteId,
      estado: IntegranteEstado.SUJETA_CREDITO,
      expediente: { estado: ExpedienteEstado.EN_DOCUMENTACION },
    });

    await expect(service.registrarEvidencia(
      integranteId,
      scope,
      evidenciaInput,
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.guardar).not.toHaveBeenCalled();
  });
});
