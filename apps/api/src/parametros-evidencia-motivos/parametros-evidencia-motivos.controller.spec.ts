import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import {
  MotivosClasificacionEvidenciaVerificacionController,
  ParametrosEvidenciaMotivosController,
} from './parametros-evidencia-motivos.controller';
import { ParametrosEvidenciaMotivosService } from './parametros-evidencia-motivos.service';

describe('ParametrosEvidenciaMotivosController', () => {
  const service = {
    listar: jest.fn(),
    listarActivos: jest.fn(),
    crear: jest.fn(),
    actualizarConcepto: jest.fn(),
    cambiarEstado: jest.fn(),
    reordenar: jest.fn(),
  };
  const controller = new ParametrosEvidenciaMotivosController(service as never);

  it.each([
    ['listar', 'leer'],
    ['crear', 'registrar'],
    ['actualizarConcepto', 'actualizar'],
    ['cambiarEstado', 'actualizar'],
    ['reordenar', 'actualizar'],
  ] as const)('protege %s con parametros:%s', (metodo, accion) => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      ParametrosEvidenciaMotivosController.prototype[metodo],
    )).toEqual({ modulo: 'parametros', accion });
  });

  it('expone únicamente motivos activos con permiso de Verificación', () => {
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      MotivosClasificacionEvidenciaVerificacionController.prototype.listarActivos,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('entrega el actor autenticado al registrar, editar, reordenar y cambiar estado', async () => {
    const user = { id: '11111111-1111-4111-8111-111111111111' };
    const dto = { clasificacion: 'ROJO' as const, concepto: 'Información inconsistente' };
    await controller.crear(dto, { user } as never);
    await controller.actualizarConcepto(
      '22222222-2222-4222-8222-222222222222',
      { concepto: 'Información contradictoria' },
      { user } as never,
    );
    await controller.cambiarEstado(
      '22222222-2222-4222-8222-222222222222',
      { activo: false },
      { user } as never,
    );
    await controller.reordenar(
      { clasificacion: 'ROJO', motivo_ids: ['22222222-2222-4222-8222-222222222222'] },
      { user } as never,
    );

    expect(service.crear).toHaveBeenCalledWith(dto, user);
    expect(service.actualizarConcepto).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
      { concepto: 'Información contradictoria' },
      user,
    );
    expect(service.cambiarEstado).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
      { activo: false },
      user,
    );
    expect(service.reordenar).toHaveBeenCalledWith(
      { clasificacion: 'ROJO', motivo_ids: ['22222222-2222-4222-8222-222222222222'] },
      user,
    );
  });

  it('resuelve la ruta específica /estado antes que la edición genérica', async () => {
    jest.clearAllMocks();
    service.cambiarEstado.mockResolvedValue({
      motivo: {
        id: '22222222-2222-4222-8222-222222222222',
        activo: false,
      },
    });
    let app: INestApplication | undefined;

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [ParametrosEvidenciaMotivosController],
        providers: [{
          provide: ParametrosEvidenciaMotivosService,
          useValue: service,
        }],
      }).compile();
      app = moduleRef.createNestApplication();
      await app.init();

      await request(app.getHttpServer())
        .patch(
          '/parametros/evidencia/motivos-clasificacion/'
          + '22222222-2222-4222-8222-222222222222/estado',
        )
        .send({ activo: false })
        .expect(200);

      expect(service.cambiarEstado).toHaveBeenCalledWith(
        '22222222-2222-4222-8222-222222222222',
        { activo: false },
        undefined,
      );
      expect(service.actualizarConcepto).not.toHaveBeenCalled();
    } finally {
      await app?.close();
    }
  });
});
