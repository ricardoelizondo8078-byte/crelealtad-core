import { BadRequestException } from '@nestjs/common';
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
  const evidenciaId = '22222222-2222-4222-8222-222222222222';
  const usuarioId = '33333333-3333-4333-8333-333333333333';
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
    tipo: 'NEGOCIO' as const,
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
  const dataSource = { transaction: jest.fn() };
  const storage = {
    guardar: jest.fn(),
    leer: jest.fn(),
    descartar: jest.fn(),
  };
  let service: VerificacionEntrevistaService;

  beforeEach(() => {
    jest.clearAllMocks();
    integranteRepository.findOne.mockResolvedValue({
      id: integranteId,
      expediente_id: expedienteId,
      estado: IntegranteEstado.SUJETA_CREDITO,
      expediente: { estado: ExpedienteEstado.EN_VERIFICACION },
    });
    familiarRepository.find.mockResolvedValue([]);
    desacuerdoRepository.find.mockResolvedValue([]);
    evidenciaRepository.save.mockResolvedValue(evidenciaGuardada);
    evidenciaRepository.find.mockResolvedValue([evidenciaGuardada]);
    storage.guardar.mockResolvedValue({
      id: evidenciaId,
      ruta: evidenciaGuardada.ruta,
      mime_type: evidenciaGuardada.mime_type,
      tamano_bytes: evidenciaGuardada.tamano_bytes,
      sha256: evidenciaGuardada.sha256,
    });
    storage.descartar.mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    service = new VerificacionEntrevistaService(
      entrevistaRepository as never,
      familiarRepository as never,
      desacuerdoRepository as never,
      evidenciaRepository as never,
      integranteRepository as never,
      dataSource as never,
      storage as never,
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
      const guardada = { ...evidenciaGuardada, tipo };
      evidenciaRepository.save.mockResolvedValueOnce(guardada);
      evidenciaRepository.find.mockResolvedValueOnce([guardada]);

      const resultado = await service.registrarEvidencia(
        integranteId,
        scope,
        { ...evidenciaInput, tipo, idempotency_key: `credit_photo_${tipo.toLowerCase()}` },
        { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
      );

      expect(storage.guardar).toHaveBeenCalledWith(integranteId, tipo, expect.any(Object));
      expect(evidenciaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ tipo }));
      expect(evidenciaRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { integrante_id: integranteId, tipo },
      }));
      expect(resultado.evidencias).toEqual([expect.objectContaining({ tipo })]);
    },
  );

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
