import { ConflictException } from '@nestjs/common';
import { IntegrantesService } from './integrantes.service';

describe('IntegrantesService - monto formal de solicitud', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const integranteRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    create: jest.fn((value) => value),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: { query: jest.fn(), transaction: jest.fn() },
  };
  const personaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    merge: jest.fn((entity, changes) => ({ ...entity, ...changes })),
  };
  let service: IntegrantesService;
  const scope = { usuarioId: 'usuario-1', rolNombre: 'VERIFICADOR' };

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.getMany.mockReset();
    integranteRepository.create.mockClear();
    integranteRepository.save.mockReset();
    integranteRepository.findOne.mockReset();
    integranteRepository.manager.query.mockReset();
    integranteRepository.manager.transaction.mockReset();
    integranteRepository.manager.transaction.mockImplementation(async (operation) => operation({
      getRepository: (entity: { name?: string }) =>
        entity.name === 'PersonaEntity' ? personaRepository : integranteRepository,
      query: jest.fn(),
    }));
    personaRepository.findOne.mockReset();
    personaRepository.save.mockReset();
    personaRepository.merge.mockClear();
    service = new IntegrantesService(
      integranteRepository as never,
      personaRepository as never,
      {} as never,
    );
  });

  it('muestra monto_solicitado de la solicitud y no el prospectivo de persona', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-1',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA PRUEBA', telefono: null, monto_solicitado: 0 },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        monto_solicitado: '39000.00',
        monto_solicitado_confirmado_at: '2026-08-28T12:00:00.000Z',
        fecha_nac: '1950-01-01',
        monto_autorizado_anterior: '35000.00',
        coincidencias_ciclo_anterior: 1,
        ciclo_numero: 3,
      }])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        tiene_historial_interno: true,
        creditos_participados: '2',
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].montoSolicitado).toBe(39000);
    expect(result[0].montoAutorizadoAnterior).toBe(35000);
    expect(result[0].comparacionMontoDisponible).toBe(true);
    expect(result[0].cicloNumeroActual).toBe(3);
    expect(result[0].tiene_historial_interno).toBe(true);
    expect(result[0].creditos_participados).toBe(2);
    expect(result[0].es_nueva_con_nosotros).toBe(false);
    expect(result[0].edad).toBeGreaterThan(70);
    expect(result[0].supera_limite_edad).toBe(true);
    expect(result[0].montoMaximoSolicitable).toBe(100000);
  });

  it('resume el historial confirmado con máximo, mínimo y los cinco ciclos más recientes', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-1',
      expediente_id: 'expediente-actual',
      persona_id: 'persona-1',
      estado: 'EN_VERIFICACION',
      persona: { nombre_completo: 'PERSONA PRUEBA', telefono: null },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        tiene_historial_interno: true,
        creditos_participados: '6',
        historial_crediticio: [
          { ciclo_numero: 7, monto_autorizado: '22000.00', fecha_referencia: '2026-08-01' },
          { ciclo_numero: 6, monto_autorizado: '25000.00', fecha_referencia: '2026-04-01' },
          { ciclo_numero: 5, monto_autorizado: '25000.00', fecha_referencia: '2025-12-01' },
          { ciclo_numero: 4, monto_autorizado: '20000.00', fecha_referencia: '2025-08-01' },
          { ciclo_numero: 3, monto_autorizado: '12000.00', fecha_referencia: '2025-04-01' },
          { ciclo_numero: 2, monto_autorizado: '15000.00', fecha_referencia: '2024-12-01' },
        ],
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-actual', scope);

    expect(result[0].historial_crediticio_interno).toEqual({
      total_ciclos: 6,
      monto_maximo: { monto_autorizado: 25000, ciclos: [6, 5] },
      monto_minimo: { monto_autorizado: 12000, ciclos: [3] },
      ultimos_ciclos: [
        { ciclo_numero: 7, monto_autorizado: 22000 },
        { ciclo_numero: 6, monto_autorizado: 25000 },
        { ciclo_numero: 5, monto_autorizado: 25000 },
        { ciclo_numero: 4, monto_autorizado: 20000 },
        { ciclo_numero: 3, monto_autorizado: 12000 },
      ],
    });
    expect(integranteRepository.manager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('JSONB_AGG'),
      [['integrante-1']],
    );
  });

  it('no infiere el monto anterior cuando el ciclo previo es ambiguo', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-1',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA PRUEBA', telefono: null, monto_solicitado: 50000 },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        monto_solicitado: '39000.00',
        monto_solicitado_confirmado_at: '2026-08-28T12:00:00.000Z',
        monto_autorizado_anterior: null,
        coincidencias_ciclo_anterior: 2,
      }])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        tiene_historial_interno: true,
        creditos_participados: '2',
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].montoSolicitado).toBe(39000);
    expect(result[0].montoAutorizadoAnterior).toBeNull();
    expect(result[0].comparacionMontoDisponible).toBe(false);
  });

  it('separa el monto prospectivo, el formal y el autorizado anterior en el detalle', async () => {
    integranteRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-1',
      estado: 'DOCUMENTANDO',
      expediente: { grupo_id: 'grupo-1' },
    });
    personaRepository.findOne.mockResolvedValue({
      nombres: 'PERSONA',
      apellido_pat: 'PRUEBA',
      monto_solicitado: 15000,
      fecha_nac: '2000-01-01',
    });
    integranteRepository.manager.query
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        monto_solicitado: '39000.00',
        monto_solicitado_confirmado_at: '2026-08-28T12:00:00.000Z',
        monto_autorizado_anterior: '35000.00',
        coincidencias_ciclo_anterior: 1,
        ciclo_numero: 3,
      }])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        tiene_historial_interno: true,
        creditos_participados: '2',
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.getById('integrante-1', scope);

    expect(result.montoSolicitado).toBe(39000);
    expect(result.montoProspectivo).toBe(15000);
    expect(result.montoAutorizadoAnterior).toBe(35000);
    expect(result.comparacionMontoDisponible).toBe(true);
    expect(result.cicloNumeroActual).toBe(3);
    expect(result.tiene_historial_interno).toBe(true);
    expect(result.creditos_participados).toBe(2);
    expect(result.es_nueva_con_nosotros).toBe(false);
    expect(result.edad).toBeGreaterThanOrEqual(26);
    expect(result.supera_limite_edad).toBe(false);
    expect(result.esRenovacion).toBe(true);
    expect(result.montoReferenciaPaso6).toBe(35000);
    expect(result.origenMontoReferenciaPaso6).toBe('CICLO_ANTERIOR');
    expect(result.montoMaximoSolicitable).toBe(100000);
  });

  it('no presenta como capturado un monto precargado sin confirmación del asesor', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-1',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA PRUEBA', telefono: null, monto_solicitado: 39000 },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        monto_solicitado: '39000.00',
        monto_solicitado_confirmado_at: null,
        monto_autorizado_anterior: '39000.00',
        coincidencias_ciclo_anterior: 1,
        ciclo_numero: 3,
      }])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        tiene_historial_interno: false,
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].montoSolicitado).toBeNull();
    expect(result[0].montoAutorizadoAnterior).toBe(39000);
    expect(result[0].tiene_historial_interno).toBe(false);
    expect(result[0].es_nueva_con_nosotros).toBe(true);
  });

  it('marca como nueva a una integrante sin solicitud actual ni historial interno', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-nueva',
      expediente_id: 'expediente-1',
      persona_id: 'persona-nueva',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA NUEVA', telefono: null },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-nueva',
        tiene_historial_interno: false,
        creditos_participados: '0',
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].es_nueva_con_nosotros).toBe(true);
    expect(result[0].creditos_participados).toBe(0);
    expect(integranteRepository.manager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('s.monto_autorizado > 0'),
      [['integrante-nueva']],
    );
  });

  it('bloquea datos personales atrasados cuando la persona ya cambió', async () => {
    integranteRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      persona_id: 'persona-1',
    });
    personaRepository.findOne.mockResolvedValue({
      id: 'persona-1',
      nombres: 'NOMBRE ACTUAL',
      updated_at: new Date('2026-10-04T20:00:00.000Z'),
    });

    await expect(service.update('integrante-1', {
      nombres: 'NOMBRE ATRASADO',
      expected_persona_updated_at: '2026-10-04T19:00:00.000Z',
    }, scope)).rejects.toBeInstanceOf(ConflictException);
    expect(personaRepository.save).not.toHaveBeenCalled();
  });

  it('acepta sin duplicar el mismo cambio personal después de perder la respuesta', async () => {
    const updatedAt = new Date('2026-10-04T20:00:00.000Z');
    integranteRepository.findOne.mockResolvedValue({
      id: 'integrante-1',
      persona_id: 'persona-1',
    });
    personaRepository.findOne.mockResolvedValue({
      id: 'persona-1',
      nombres: 'NOMBRE CONFIRMADO',
      updated_at: updatedAt,
    });

    const resultado = await service.update('integrante-1', {
      nombres: 'NOMBRE CONFIRMADO',
      expected_persona_updated_at: '2026-10-04T19:00:00.000Z',
    }, scope);

    expect(resultado).toEqual(expect.objectContaining({ persona_updated_at: updatedAt }));
    expect(personaRepository.save).not.toHaveBeenCalled();
  });

  it('conserva historial desconocido sin clasificarlo como confirmado', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-sin-identidad',
      expediente_id: 'expediente-1',
      persona_id: null,
      estado: 'DOCUMENTANDO',
      persona: null,
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-sin-identidad',
        tiene_historial_interno: null,
        creditos_participados: null,
      }])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);

    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].tiene_historial_interno).toBeNull();
    expect(result[0].creditos_participados).toBeNull();
    expect(result[0].es_nueva_con_nosotros).toBe(false);
  });

  it('expone el domicilio geocodificable y conserva la validación declarada', async () => {
    queryBuilder.getMany.mockResolvedValue([{
      id: 'integrante-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-1',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA PRUEBA', telefono: null },
        expediente: { tesorera_integrante_id: 'tesorera-1' },
    }, {
      id: 'tesorera-1',
      expediente_id: 'expediente-1',
      persona_id: 'persona-2',
      estado: 'DOCUMENTANDO',
      persona: { nombre_completo: 'PERSONA TESORERA', telefono: null },
      expediente: { tesorera_integrante_id: 'tesorera-1' },
    }]);
    integranteRepository.manager.query
      .mockResolvedValueOnce([{
        integrante_id: 'integrante-1',
        monto_solicitado: null,
        monto_solicitado_confirmado_at: null,
        monto_autorizado_anterior: null,
        coincidencias_ciclo_anterior: 0,
        vive_max_5km_tesorera: 'SI',
        dom_calle: 'CALLE PRUEBA',
        dom_num_ext: '10',
        dom_colonia: 'CENTRO',
        dom_municipio: 'MONTERREY',
        dom_estado: 'NUEVO LEON',
        dom_codigo_postal: '64000',
        dom_latitud: '25.6866000',
        dom_longitud: '-100.3161000',
      }, {
        integrante_id: 'tesorera-1',
        monto_solicitado: null,
        monto_solicitado_confirmado_at: null,
        monto_autorizado_anterior: null,
        coincidencias_ciclo_anterior: 0,
        vive_max_5km_tesorera: 'NO',
      }])
      .mockResolvedValueOnce([
        { integrante_id: 'integrante-1', tiene_historial_interno: true },
        { integrante_id: 'tesorera-1', tiene_historial_interno: true },
      ])
      .mockResolvedValueOnce([{ monto_maximo: '100000.00' }]);
    const result = await service.listByExpediente('expediente-1', scope);

    expect(result[0].distancia_tesorera_rango).toBe('HASTA_5_KM');
    expect(result[1].distancia_tesorera_rango).toBe('MAS_DE_5_KM');
    expect(result[0].domicilio_geocodificacion).toEqual({
      calle: 'CALLE PRUEBA',
      numeroExterior: '10',
      colonia: 'CENTRO',
      municipio: 'MONTERREY',
      estado: 'NUEVO LEON',
      codigoPostal: '64000',
      latitud: 25.6866,
      longitud: -100.3161,
    });
  });

  it('confirma la clasificación de nueva desde la respuesta del alta', async () => {
    personaRepository.save.mockResolvedValue({ id: 'persona-nueva' });
    integranteRepository.save.mockResolvedValue({
      id: 'integrante-nueva',
      expediente_id: 'expediente-1',
      estado: 'DOCUMENTANDO',
    });
    integranteRepository.manager.query.mockResolvedValueOnce([{
      integrante_id: 'integrante-nueva',
      tiene_historial_interno: false,
    }]);

    const result = await service.createForExpediente({
      expedienteId: 'expediente-1',
      nombres: 'PERSONA',
      apellidoPaterno: 'NUEVA',
    }, scope);

    expect(result).toEqual(expect.objectContaining({
      id: 'integrante-nueva',
      tiene_historial_interno: false,
      es_nueva_con_nosotros: true,
    }));
  });
});
