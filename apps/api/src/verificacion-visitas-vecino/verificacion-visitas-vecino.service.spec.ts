import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEstado } from '../integrantes/integrante.entity';
import { VerificacionVisitasVecinoService } from './verificacion-visitas-vecino.service';

describe('VerificacionVisitasVecinoService', () => {
  const integranteId = '11111111-1111-4111-8111-111111111111';
  const fachadaId = '22222222-2222-4222-8222-222222222222';
  const evidenciaId = '55555555-5555-4555-8555-555555555555';
  const usuarioId = '33333333-3333-4333-8333-333333333333';
  const scope = {
    usuarioId,
    rolNombre: 'VERIFICADOR',
    mode: 'INSTITUCIONAL' as const,
  };
  const integranteEnVerificacion = {
    id: integranteId,
    estado: IntegranteEstado.SUJETA_CREDITO,
    expediente: { estado: ExpedienteEstado.EN_VERIFICACION },
  };
  const input = {
    fachada_id: fachadaId,
    conoce_y_sabe_donde_vive: true,
    idempotency_key: 'neighbor_20260922_abcdef',
    ubicacion_latitud: 25.686614238,
    ubicacion_longitud: -100.316112689,
    ubicacion_precision_metros: 8.567,
    ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
  };
  const guardada = {
    id: '44444444-4444-4444-8444-444444444444',
    integrante_id: integranteId,
    fachada_id: fachadaId,
    conoce_y_sabe_donde_vive: true,
    idempotency_key: input.idempotency_key,
    registrada_por: usuarioId,
    ubicacion_fuente: 'DISPOSITIVO' as const,
    created_at: new Date('2026-09-22T18:44:00.000Z'),
  };
  const evidenciaGuardada = {
    id: evidenciaId,
    visita_id: guardada.id,
    ruta: `/verificacion/integrantes/${integranteId}/visitas-vecino/${guardada.id}/evidencias/${evidenciaId}/archivo`,
    mime_type: 'image/jpeg' as const,
    tamano_bytes: 5,
    sha256: 'b'.repeat(64),
    captura_fuente: 'CAMARA' as const,
    foto_capturada_at: new Date('2026-09-22T18:45:58.000Z'),
    idempotency_key: 'neighbor_evidence_20260922_abcdef',
    registrada_por: usuarioId,
    ubicacion_fuente: 'DISPOSITIVO' as const,
    created_at: new Date('2026-09-22T18:46:00.000Z'),
  };
  const visitaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const fachadaGuardada = {
    id: fachadaId,
    integrante_id: integranteId,
    ruta: `/verificacion/integrantes/${integranteId}/visitas-vecino/fachadas/${fachadaId}/archivo`,
    mime_type: 'image/jpeg' as const,
    tamano_bytes: 5,
    sha256: 'a'.repeat(64),
    captura_fuente: 'CAMARA' as const,
    foto_capturada_at: new Date('2026-09-22T18:42:58.000Z'),
    idempotency_key: 'facade_20260922_abcdef',
    registrada_por: usuarioId,
    ubicacion_fuente: 'DISPOSITIVO' as const,
    created_at: new Date('2026-09-22T18:43:00.000Z'),
  };
  const fachadaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const evidenciaRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const integranteRepository = {
    manager: { query: jest.fn() },
    findOne: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity) => (
      entity.name === 'VerificacionVisitaVecinoFachadaEntity'
        ? fachadaRepository
        : entity.name === 'VerificacionVisitaVecinoEvidenciaEntity'
          ? evidenciaRepository
          : visitaRepository
    )),
    query: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };
  const fachadaStorage = {
    guardar: jest.fn(),
    leer: jest.fn(),
    descartar: jest.fn(),
    guardarEvidencia: jest.fn(),
    leerEvidencia: jest.fn(),
    descartarEvidencia: jest.fn(),
  };
  let service: VerificacionVisitasVecinoService;

  beforeEach(() => {
    jest.clearAllMocks();
    integranteRepository.findOne.mockResolvedValue(integranteEnVerificacion);
    visitaRepository.save.mockResolvedValue(guardada);
    visitaRepository.findOne.mockResolvedValue(guardada);
    fachadaRepository.save.mockResolvedValue(fachadaGuardada);
    fachadaRepository.findOne.mockResolvedValue(fachadaGuardada);
    evidenciaRepository.save.mockResolvedValue(evidenciaGuardada);
    evidenciaRepository.findOne.mockResolvedValue(evidenciaGuardada);
    fachadaStorage.guardar.mockResolvedValue({
      id: fachadaId,
      ruta: fachadaGuardada.ruta,
      mime_type: fachadaGuardada.mime_type,
      tamano_bytes: fachadaGuardada.tamano_bytes,
      sha256: fachadaGuardada.sha256,
    });
    fachadaStorage.leer.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]));
    fachadaStorage.descartar.mockResolvedValue(undefined);
    fachadaStorage.guardarEvidencia.mockResolvedValue({
      id: evidenciaId,
      ruta: evidenciaGuardada.ruta,
      mime_type: evidenciaGuardada.mime_type,
      tamano_bytes: evidenciaGuardada.tamano_bytes,
      sha256: evidenciaGuardada.sha256,
    });
    fachadaStorage.leerEvidencia.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]));
    fachadaStorage.descartarEvidencia.mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    service = new VerificacionVisitasVecinoService(
      visitaRepository as never,
      fachadaRepository as never,
      evidenciaRepository as never,
      integranteRepository as never,
      dataSource as never,
      fachadaStorage as never,
    );
  });

  it('guarda respuesta, ubicación normalizada y auditoría sin coordenadas', async () => {
    const result = await service.registrar(integranteId, scope, input);

    expect(visitaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      integrante_id: integranteId,
      conoce_y_sabe_donde_vive: true,
      fachada_id: fachadaId,
      registrada_por: usuarioId,
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161127,
      ubicacion_precision_metros: 8.57,
      ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_visitas_vecino',
        guardada.id,
        'VISITA_VECINO',
      ]),
    );
    const auditParameters = manager.query.mock.calls[0][1] as unknown[];
    expect(JSON.stringify(auditParameters)).not.toContain('25.686');
    expect(JSON.stringify(auditParameters)).not.toContain('-100.316');
    expect(result.resumen.resultado).toEqual({
      conoce_y_sabe_donde_vive: true,
      visita_id: guardada.id,
      fachada_id: fachadaId,
      registrada_at: guardada.created_at,
    });
  });

  it('reutiliza el registro cuando se reintenta la misma clave y respuesta', async () => {
    dataSource.transaction.mockRejectedValue({ code: '23505' });
    visitaRepository.findOne.mockResolvedValue(guardada);

    const result = await service.registrar(integranteId, scope, input);

    expect(result.visita.id).toBe(guardada.id);
    expect(visitaRepository.findOne).toHaveBeenCalledWith({
      where: {
        registrada_por: usuarioId,
        idempotency_key: input.idempotency_key,
      },
    });
  });

  it('rechaza reutilizar una clave con otra respuesta', async () => {
    dataSource.transaction.mockRejectedValue({ code: '23505' });
    visitaRepository.findOne.mockResolvedValue({
      ...guardada,
      conoce_y_sabe_donde_vive: false,
    });

    await expect(service.registrar(integranteId, scope, input))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('devuelve la respuesta más reciente en el resumen', async () => {
    const result = await service.obtenerResumen(integranteId, scope);

    expect(visitaRepository.findOne).toHaveBeenCalledWith({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    expect(result.resultado?.conoce_y_sabe_donde_vive).toBe(true);
  });

  it('guarda la fachada de cámara con ubicación y auditoría sin coordenadas', async () => {
    const result = await service.registrarFachada(
      integranteId,
      scope,
      {
        idempotency_key: fachadaGuardada.idempotency_key,
        foto_capturada_at: fachadaGuardada.foto_capturada_at.toISOString(),
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
    );

    expect(fachadaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      id: fachadaId,
      integrante_id: integranteId,
      captura_fuente: 'CAMARA',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161127,
      ubicacion_precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(result.fachada?.id).toBe(fachadaId);
    const auditParameters = manager.query.mock.calls[0][1] as unknown[];
    expect(JSON.stringify(auditParameters)).not.toContain('25.686');
    expect(JSON.stringify(auditParameters)).not.toContain('-100.316');
  });

  it('exige que la respuesta use la fachada más reciente', async () => {
    fachadaRepository.findOne.mockResolvedValue({
      ...fachadaGuardada,
      id: '55555555-5555-4555-8555-555555555555',
    });

    await expect(service.registrar(integranteId, scope, input))
      .rejects.toThrow('Primero captura y guarda la fotografía actual de la fachada');
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('guarda la evidencia de cámara para la respuesta actual con ubicación minimizada en auditoría', async () => {
    const result = await service.registrarEvidencia(
      integranteId,
      guardada.id,
      scope,
      {
        idempotency_key: evidenciaGuardada.idempotency_key,
        foto_capturada_at: evidenciaGuardada.foto_capturada_at.toISOString(),
        ubicacion_latitud: 25.686614238,
        ubicacion_longitud: -100.316112689,
        ubicacion_precision_metros: 8.567,
        ubicacion_capturada_at: '2026-09-22T18:46:00.000Z',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
    );

    expect(evidenciaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      id: evidenciaId,
      visita_id: guardada.id,
      captura_fuente: 'CAMARA',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161127,
      ubicacion_precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(result.evidencia?.id).toBe(evidenciaId);
    const auditParameters = manager.query.mock.calls[0][1] as unknown[];
    expect(JSON.stringify(auditParameters)).not.toContain('25.686');
    expect(JSON.stringify(auditParameters)).not.toContain('-100.316');
  });

  it('rechaza guardar evidencia para una respuesta que ya no es la más reciente', async () => {
    visitaRepository.findOne
      .mockResolvedValueOnce(guardada)
      .mockResolvedValueOnce({ ...guardada, id: '66666666-6666-4666-8666-666666666666' });

    await expect(service.registrarEvidencia(
      integranteId,
      guardada.id,
      scope,
      {
        idempotency_key: evidenciaGuardada.idempotency_key,
        foto_capturada_at: evidenciaGuardada.foto_capturada_at.toISOString(),
        ubicacion_latitud: 25.6866142,
        ubicacion_longitud: -100.3161126,
        ubicacion_capturada_at: '2026-09-22T18:46:00.000Z',
      },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toThrow('La evidencia debe corresponder a la respuesta más reciente del vecino');
    expect(fachadaStorage.guardarEvidencia).not.toHaveBeenCalled();
  });

  it('bloquea el registro fuera de un expediente en verificación', async () => {
    integranteRepository.findOne.mockResolvedValue({
      ...integranteEnVerificacion,
      expediente: { estado: ExpedienteEstado.EN_DOCUMENTACION },
    });

    await expect(service.registrar(integranteId, scope, input))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('informa cuando la integrante no existe', async () => {
    integranteRepository.findOne.mockResolvedValue(null);

    await expect(service.obtenerResumen(integranteId, scope))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
