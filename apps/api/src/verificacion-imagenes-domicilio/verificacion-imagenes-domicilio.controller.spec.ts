import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import { VerificacionImagenesDomicilioController } from './verificacion-imagenes-domicilio.controller';

describe('VerificacionImagenesDomicilioController', () => {
  const service = {
    obtenerResumen: jest.fn(),
    registrar: jest.fn(),
    registrarRespuestaMedidor: jest.fn(),
    obtenerArchivo: jest.fn(),
  };
  const controller = new VerificacionImagenesDomicilioController(service as never);
  const integranteId = '11111111-1111-4111-8111-111111111111';
  const usuarioId = '33333333-3333-4333-8333-333333333333';
  const request: {
    user: {
      id: string;
      permisos_personalizados: null;
      rol: {
        nombre: string;
        permisos: { modulos: string[]; acciones: string[] };
      };
    };
  } = {
    user: {
      id: usuarioId,
      permisos_personalizados: null,
      rol: {
        nombre: 'VERIFICADOR',
        permisos: {
          modulos: ['verificacion'],
          acciones: ['leer', 'registrar'],
        },
      },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('consulta con alcance institucional y permiso de lectura', async () => {
    service.obtenerResumen.mockResolvedValue({ imagenes: {} });

    await controller.obtenerResumen(integranteId, request as never, 'verificacion');

    expect(service.obtenerResumen).toHaveBeenCalledWith(integranteId, {
      usuarioId,
      rolNombre: 'VERIFICADOR',
      mode: 'INSTITUCIONAL',
    });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionImagenesDomicilioController.prototype.obtenerResumen,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('registra la imagen con el actor autenticado y permiso de registro', async () => {
    const dto = {
      tipo: 'FACHADA' as const,
      idempotency_key: 'home_image_20260922_abcdef',
      foto_capturada_at: '2026-09-22T18:42:58.000Z',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161126,
      ubicacion_precision_metros: 8.5,
      ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
    };
    const foto = {
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimetype: 'image/jpeg',
      size: 3,
    };
    service.registrar.mockResolvedValue({ imagen: {}, resumen: {} });

    await controller.registrar(
      integranteId,
      dto,
      foto,
      request as never,
      'verificacion',
    );

    expect(service.registrar).toHaveBeenCalledWith(
      integranteId,
      {
        usuarioId,
        rolNombre: 'VERIFICADOR',
        mode: 'INSTITUCIONAL',
      },
      dto,
      foto,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionImagenesDomicilioController.prototype.registrar,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra la respuesta del medidor con el actor autenticado', async () => {
    const dto = {
      fachada_id: '22222222-2222-4222-8222-222222222222',
      tiene_medidor: false,
      motivo: 'SIN_SERVICIO_ELECTRICO' as const,
      idempotency_key: 'meter_answer_20261003_abcdef',
    };
    service.registrarRespuestaMedidor.mockResolvedValue({ respuesta: {}, resumen: {} });

    await controller.registrarRespuestaMedidor(
      integranteId,
      dto,
      request as never,
      'verificacion',
    );

    expect(service.registrarRespuestaMedidor).toHaveBeenCalledWith(
      integranteId,
      {
        usuarioId,
        rolNombre: 'VERIFICADOR',
        mode: 'INSTITUCIONAL',
      },
      dto,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionImagenesDomicilioController.prototype.registrarRespuestaMedidor,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });
});
