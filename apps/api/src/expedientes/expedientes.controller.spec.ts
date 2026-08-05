import { Test, TestingModule } from '@nestjs/testing';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';
import { CreateExpedienteDto } from './dto/create-expediente.dto';
import { ExpedienteEntity } from './expediente.entity';

describe('ExpedientesController', () => {
  let controller: ExpedientesController;
  let service: ExpedientesService;

  const mockExpediente: ExpedienteEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    folio: null,
    grupo_id: '550e8400-e29b-41d4-a716-446655440000',
    producto_id: null,
    asesora_id: null,
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
            createForGroup: jest.fn(),
            listAll: jest.fn(),
            listByGroup: jest.fn(),
            getById: jest.fn(),
            getIntegrantes: jest.fn(),
            sendToVerification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExpedientesController>(ExpedientesController);
    service = module.get<ExpedientesService>(ExpedientesService);
  });

  describe('POST /expedientes', () => {
    it('debe crear un expediente con grupo_id válido', async () => {
      const dto: CreateExpedienteDto = {
        grupo_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      jest.spyOn(service, 'createForGroup').mockResolvedValue(mockExpediente);

      const result = await controller.create(dto);

      expect(service.createForGroup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockExpediente);
      expect(result.id).toBeDefined();
      expect(result.grupo_id).toBe(dto.grupo_id);
    });
  });

  describe('GET /expedientes', () => {
    it('debe listar todos los expedientes', async () => {
      jest.spyOn(service, 'listAll').mockResolvedValue([mockExpediente]);

      const result = await controller.listAll();

      expect(service.listAll).toHaveBeenCalled();
      expect(result).toEqual([mockExpediente]);
    });
  });

  describe('GET /expedientes/:id', () => {
    it('debe obtener un expediente por id', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockExpediente);

      const result = await controller.getById(mockExpediente.id);

      expect(service.getById).toHaveBeenCalledWith(mockExpediente.id);
      expect(result).toEqual(mockExpediente);
    });
  });
});
