import { Test, TestingModule } from '@nestjs/testing';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';
import { ExpedienteEntity } from './expediente.entity';

describe('ExpedientesController', () => {
  let controller: ExpedientesController;
  let service: ExpedientesService;
  const request = {
    user: {
      id: 'usuario-1',
      permisos_personalizados: null,
      rol: {
        nombre: 'VERIFICADOR',
        permisos: {
          modulos: ['verificacion', 'expedientes', 'solicitudes'],
          acciones: ['leer', 'registrar'],
        },
      },
    },
  } as never;
  const scope = {
    usuarioId: 'usuario-1',
    rolNombre: 'VERIFICADOR',
    mode: 'INSTITUCIONAL' as const,
  };

  const mockExpediente: ExpedienteEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    folio: null,
    grupo_id: '550e8400-e29b-41d4-a716-446655440000',
    producto_id: null,
    asesora_id: null,
    ciclo_historico_origen_id: null,
    importacion_integrantes_id: null,
    tesorera_integrante_id: null,
    horario_visita: null,
    dias_visita: null,
    semana_cobro: null,
    observaciones: null,
    estado: 'EN_DOCUMENTACION',
    estado_fecha: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    grupo: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpedientesController],
      providers: [
        {
          provide: ExpedientesService,
          useValue: {
            listAll: jest.fn(),
            listByGroup: jest.fn(),
            listEnVerificacion: jest.fn(),
            getById: jest.fn(),
            getIntegrantes: jest.fn(),
            seleccionarTesorera: jest.fn(),
            sendToVerification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExpedientesController>(ExpedientesController);
    service = module.get<ExpedientesService>(ExpedientesService);
  });

  describe('GET /expedientes', () => {
    it('debe listar todos los expedientes', async () => {
      jest.spyOn(service, 'listAll').mockResolvedValue([mockExpediente]);

      const result = await controller.listAll(request);

      expect(service.listAll).toHaveBeenCalledWith(scope);
      expect(result).toEqual([mockExpediente]);
    });
  });

  describe('GET /expedientes/:id', () => {
    it('debe obtener un expediente por id', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockExpediente);

      const result = await controller.getById(mockExpediente.id, request);

      expect(service.getById).toHaveBeenCalledWith(mockExpediente.id, scope);
      expect(result).toEqual(mockExpediente);
    });
  });

  describe('GET /expedientes/en-verificacion', () => {
    it('debe listar la bandeja enlazada al módulo de verificación', async () => {
      const grupos = [{
        id: mockExpediente.grupo_id,
        nombre: 'GRUPO PRUEBA',
        estado: 'EN_VERIFICACION',
        expediente_id: mockExpediente.id,
        estado_fecha: mockExpediente.estado_fecha,
        integrantes_count: 3,
        es_grupo_nuevo_ciclo_1: true,
        requiere_revision_documental: false,
      }];
      jest.spyOn(service, 'listEnVerificacion').mockResolvedValue(grupos);

      const result = await controller.listEnVerificacion(request);

      expect(service.listEnVerificacion).toHaveBeenCalledWith(scope);
      expect(result).toEqual(grupos);
    });
  });

  describe('PATCH /expedientes/:id/send-to-verification', () => {
    it('registra al usuario autenticado en la transición', async () => {
      jest.spyOn(service, 'sendToVerification').mockResolvedValue(mockExpediente);

      const result = await controller.sendToVerification(
        mockExpediente.id,
        request,
      );

      expect(service.sendToVerification).toHaveBeenCalledWith(mockExpediente.id, scope);
      expect(result).toEqual(mockExpediente);
    });
  });

  describe('PATCH /expedientes/:id/tesorera', () => {
    it('registra la selección con el usuario autenticado', async () => {
      const actualizado = { ...mockExpediente, tesorera_integrante_id: 'integrante-1' };
      jest.spyOn(service, 'seleccionarTesorera').mockResolvedValue(actualizado);

      const result = await controller.seleccionarTesorera(
        mockExpediente.id,
        { integrante_id: 'integrante-1' },
        request,
      );

      expect(service.seleccionarTesorera).toHaveBeenCalledWith(
        mockExpediente.id,
        'integrante-1',
        scope,
      );
      expect(result.tesorera_integrante_id).toBe('integrante-1');
    });
  });
});
