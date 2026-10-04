import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import { VerificacionVisitasVecinoController } from './verificacion-visitas-vecino.controller';

describe('VerificacionVisitasVecinoController', () => {
  const service = {
    obtenerResumen: jest.fn(),
    obtenerResumenFachada: jest.fn(),
    registrarFachada: jest.fn(),
    obtenerArchivoFachada: jest.fn(),
    obtenerResumenEvidencia: jest.fn(),
    registrarEvidencia: jest.fn(),
    obtenerArchivoEvidencia: jest.fn(),
    registrar: jest.fn(),
  };
  const controller = new VerificacionVisitasVecinoController(service as never);
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

  it('consulta el resumen con alcance institucional de Verificación', async () => {
    service.obtenerResumen.mockResolvedValue({ resultado: null });

    await controller.obtenerResumen(integranteId, request as never, 'verificacion');

    expect(service.obtenerResumen).toHaveBeenCalledWith(
      integranteId,
      {
        usuarioId,
        rolNombre: 'VERIFICADOR',
        mode: 'INSTITUCIONAL',
      },
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionVisitasVecinoController.prototype.obtenerResumen,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('registra con el actor autenticado y permiso de registro', async () => {
    const dto = {
      fachada_id: '22222222-2222-4222-8222-222222222222',
      conoce_y_sabe_donde_vive: true,
      idempotency_key: 'neighbor_20260922_abcdef',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161126,
      ubicacion_precision_metros: 8.5,
      ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
    };
    service.registrar.mockResolvedValue({ visita: {}, resumen: {} });

    await controller.registrar(
      integranteId,
      dto,
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
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionVisitasVecinoController.prototype.registrar,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra la fachada y su archivo con el actor autenticado', async () => {
    const dto = {
      idempotency_key: 'facade_20260922_abcdef',
      foto_capturada_at: '2026-09-22T18:42:58.000Z',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161126,
      ubicacion_precision_metros: 8.5,
      ubicacion_capturada_at: '2026-09-22T18:43:00.000Z',
    };
    const foto = { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 };
    service.registrarFachada.mockResolvedValue({ fachada: {} });

    await controller.registrarFachada(
      integranteId,
      dto,
      foto,
      request as never,
      'verificacion',
    );

    expect(service.registrarFachada).toHaveBeenCalledWith(
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
      VerificacionVisitasVecinoController.prototype.registrarFachada,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra la evidencia de la respuesta con el actor autenticado', async () => {
    const visitaId = '44444444-4444-4444-8444-444444444444';
    const dto = {
      idempotency_key: 'neighbor_evidence_20260922_abcdef',
      foto_capturada_at: '2026-09-22T18:45:58.000Z',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161126,
      ubicacion_precision_metros: 8.5,
      ubicacion_capturada_at: '2026-09-22T18:46:00.000Z',
    };
    const foto = { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg', size: 3 };
    service.registrarEvidencia.mockResolvedValue({ evidencia: {} });

    await controller.registrarEvidencia(
      integranteId,
      visitaId,
      dto,
      foto,
      request as never,
      'verificacion',
    );

    expect(service.registrarEvidencia).toHaveBeenCalledWith(
      integranteId,
      visitaId,
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
      VerificacionVisitasVecinoController.prototype.registrarEvidencia,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });
});
