import { BadRequestException } from '@nestjs/common';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEstado } from '../integrantes/integrante.entity';
import { VerificacionImagenesDomicilioService } from './verificacion-imagenes-domicilio.service';
import { VerificacionMedidorLuzRespuestaEntity } from './verificacion-medidor-luz-respuesta.entity';

describe('VerificacionImagenesDomicilioService', () => {
  const integranteId = '11111111-1111-4111-8111-111111111111';
  const imagenId = '22222222-2222-4222-8222-222222222222';
  const medidorId = '44444444-4444-4444-8444-444444444444';
  const usuarioId = '33333333-3333-4333-8333-333333333333';
  const scope = {
    usuarioId,
    rolNombre: 'VERIFICADOR',
    mode: 'INSTITUCIONAL' as const,
  };
  const input = {
    tipo: 'FACHADA' as const,
    idempotency_key: 'home_image_20260922_abcdef',
    foto_capturada_at: '2026-09-22T18:42:58.000Z',
    ubicacion_latitud: 25.686614238,
    ubicacion_longitud: -100.316112689,
    ubicacion_precision_metros: 8.567,
    ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
  };
  const guardada = {
    id: imagenId,
    integrante_id: integranteId,
    tipo: input.tipo,
    ruta: `/verificacion/integrantes/${integranteId}/imagenes-domicilio/${imagenId}/archivo`,
    mime_type: 'image/jpeg' as const,
    tamano_bytes: 5,
    sha256: 'a'.repeat(64),
    captura_fuente: 'CAMARA' as const,
    foto_capturada_at: new Date(input.foto_capturada_at),
    idempotency_key: input.idempotency_key,
    registrada_por: usuarioId,
    ubicacion_latitud: 25.6866142,
    ubicacion_longitud: -100.3161127,
    ubicacion_precision_metros: 8.57,
    ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
    ubicacion_fuente: 'DISPOSITIVO' as const,
    created_at: new Date('2026-09-22T18:44:00.000Z'),
  };
  const imagenRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const respuestaMedidorRepository = {
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
      entity === VerificacionMedidorLuzRespuestaEntity
        ? respuestaMedidorRepository
        : imagenRepository
    )),
    query: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };
  const storage = {
    guardar: jest.fn(),
    leer: jest.fn(),
    descartar: jest.fn(),
  };
  let service: VerificacionImagenesDomicilioService;

  beforeEach(() => {
    jest.clearAllMocks();
    integranteRepository.findOne.mockResolvedValue({
      id: integranteId,
      estado: IntegranteEstado.SUJETA_CREDITO,
      expediente: { estado: ExpedienteEstado.EN_VERIFICACION },
    });
    imagenRepository.save.mockResolvedValue(guardada);
    imagenRepository.find.mockResolvedValue([guardada]);
    imagenRepository.findOne.mockResolvedValue(null);
    respuestaMedidorRepository.findOne.mockResolvedValue(null);
    storage.guardar.mockResolvedValue({
      id: imagenId,
      ruta: guardada.ruta,
      mime_type: guardada.mime_type,
      tamano_bytes: guardada.tamano_bytes,
      sha256: guardada.sha256,
    });
    storage.descartar.mockResolvedValue(undefined);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    service = new VerificacionImagenesDomicilioService(
      imagenRepository as never,
      respuestaMedidorRepository as never,
      integranteRepository as never,
      dataSource as never,
      storage as never,
    );
  });

  it('guarda tipo, ubicación normalizada y actor sin copiar coordenadas a auditoría', async () => {
    await service.registrar(
      integranteId,
      scope,
      input,
      { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]), mimetype: 'image/jpeg', size: 5 },
    );

    expect(imagenRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      integrante_id: integranteId,
      tipo: 'FACHADA',
      registrada_por: usuarioId,
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161127,
      ubicacion_precision_metros: 8.57,
      ubicacion_fuente: 'DISPOSITIVO',
    }));
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_imagenes_domicilio',
        imagenId,
        'IMAGEN_DOMICILIO',
      ]),
    );
    expect(JSON.stringify(manager.query.mock.calls[0][1])).not.toContain('25.686');
    expect(JSON.stringify(manager.query.mock.calls[0][1])).not.toContain('-100.316');
  });

  it('habilita terminar con fachada y medidor confirmados, manteniendo opcional la foto con la integrante', async () => {
    imagenRepository.find.mockResolvedValue([
      guardada,
      { ...guardada, id: medidorId, tipo: 'MEDIDOR_LUZ' },
    ]);

    const resumen = await service.obtenerResumen(integranteId, scope);

    expect(resumen.proceso.puede_terminar).toBe(true);
    expect(resumen.imagenes.NOMENCLATURAS_CALLES).toBeNull();
    expect(resumen.imagenes.MEDIDOR_LUZ?.id).toBe(medidorId);
    expect(resumen.imagenes.FACHADA_CON_INTEGRANTE).toBeNull();
    expect(JSON.stringify(resumen)).not.toContain('ubicacion_latitud');
  });

  it('no habilita terminar cuando falta el medidor de luz', async () => {
    imagenRepository.find.mockResolvedValue([guardada]);

    const resumen = await service.obtenerResumen(integranteId, scope);

    expect(resumen.proceso.puede_terminar).toBe(false);
    expect(resumen.imagenes.FACHADA?.id).toBe(imagenId);
    expect(resumen.imagenes.MEDIDOR_LUZ).toBeNull();
  });

  it('habilita terminar con fachada y una causa confirmada cuando no existe medidor', async () => {
    respuestaMedidorRepository.findOne.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      integrante_id: integranteId,
      fachada_id: imagenId,
      tiene_medidor: false,
      motivo: 'SIN_SERVICIO_ELECTRICO',
      idempotency_key: 'meter_answer_20261003_abcdef',
      registrada_por: usuarioId,
      created_at: new Date('2026-09-22T18:45:00.000Z'),
    });

    const resumen = await service.obtenerResumen(integranteId, scope);

    expect(resumen.medidor_luz).toEqual(expect.objectContaining({
      tiene_medidor: false,
      motivo: 'SIN_SERVICIO_ELECTRICO',
      fuente: 'RESPUESTA',
    }));
    expect(resumen.proceso.puede_terminar).toBe(true);
  });

  it('registra y audita la causa contra la fachada vigente', async () => {
    const respuesta = {
      id: '55555555-5555-4555-8555-555555555555',
      integrante_id: integranteId,
      fachada_id: imagenId,
      tiene_medidor: false,
      motivo: 'SERVICIO_COMPARTIDO' as const,
      idempotency_key: 'meter_answer_20261003_abcdef',
      registrada_por: usuarioId,
      created_at: new Date('2026-10-03T18:45:00.000Z'),
    };
    imagenRepository.findOne.mockResolvedValue(guardada);
    respuestaMedidorRepository.save.mockResolvedValue(respuesta);
    respuestaMedidorRepository.findOne.mockResolvedValue(respuesta);

    const resultado = await service.registrarRespuestaMedidor(integranteId, scope, {
      fachada_id: imagenId,
      tiene_medidor: false,
      motivo: 'SERVICIO_COMPARTIDO',
      idempotency_key: 'meter_answer_20261003_abcdef',
    });

    expect(respuestaMedidorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      integrante_id: integranteId,
      fachada_id: imagenId,
      tiene_medidor: false,
      motivo: 'SERVICIO_COMPARTIDO',
      registrada_por: usuarioId,
    }));
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'verificacion_medidor_luz_respuestas',
        respuesta.id,
        'RESP_MEDIDOR_LUZ',
      ]),
    );
    expect(resultado.resumen.proceso.puede_terminar).toBe(true);
  });

  it('rechaza No sin una causa controlada', async () => {
    imagenRepository.findOne.mockResolvedValue(guardada);

    await expect(service.registrarRespuestaMedidor(integranteId, scope, {
      fachada_id: imagenId,
      tiene_medidor: false,
      idempotency_key: 'meter_answer_20261003_abcdef',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(respuestaMedidorRepository.save).not.toHaveBeenCalled();
  });

  it('bloquea la foto del medidor mientras no exista un Sí vigente', async () => {
    imagenRepository.findOne.mockResolvedValue(guardada);

    await expect(service.registrar(
      integranteId,
      scope,
      { ...input, tipo: 'MEDIDOR_LUZ' },
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.guardar).not.toHaveBeenCalled();
  });

  it('no habilita terminar cuando sólo existe la fachada con la integrante', async () => {
    imagenRepository.find.mockResolvedValue([{
      ...guardada,
      tipo: 'FACHADA_CON_INTEGRANTE',
    }]);

    const resumen = await service.obtenerResumen(integranteId, scope);

    expect(resumen.proceso.puede_terminar).toBe(false);
    expect(resumen.imagenes.FACHADA).toBeNull();
    expect(resumen.imagenes.MEDIDOR_LUZ).toBeNull();
    expect(resumen.imagenes.FACHADA_CON_INTEGRANTE?.id).toBe(imagenId);
  });

  it('bloquea el registro fuera de un expediente en verificación', async () => {
    integranteRepository.findOne.mockResolvedValue({
      id: integranteId,
      estado: IntegranteEstado.SUJETA_CREDITO,
      expediente: { estado: ExpedienteEstado.EN_DOCUMENTACION },
    });

    await expect(service.registrar(
      integranteId,
      scope,
      input,
      { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 },
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.guardar).not.toHaveBeenCalled();
  });
});
