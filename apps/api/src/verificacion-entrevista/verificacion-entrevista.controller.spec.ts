import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import { VerificacionEntrevistaController } from './verificacion-entrevista.controller';

describe('VerificacionEntrevistaController', () => {
  const service = {
    obtenerEntrevista: jest.fn(),
    guardarEntrevista: jest.fn(),
    obtenerEvidencias: jest.fn(),
    registrarEvidencia: jest.fn(),
    actualizarIntegrantesEvidencia: jest.fn(),
    calificarEvidenciaIntegrante: jest.fn(),
    obtenerArchivo: jest.fn(),
  };
  const controller = new VerificacionEntrevistaController(service as never);
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
    service.obtenerEvidencias.mockResolvedValue({ evidencias: [] });

    await controller.obtenerEvidencias(
      integranteId,
      request as never,
      'verificacion',
    );

    expect(service.obtenerEvidencias).toHaveBeenCalledWith(integranteId, {
      usuarioId,
      rolNombre: 'VERIFICADOR',
      mode: 'INSTITUCIONAL',
    });
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionEntrevistaController.prototype.obtenerEvidencias,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('registra con el actor autenticado y permiso de registro', async () => {
    const dto = {
      tipo: 'NEGOCIO' as const,
      idempotency_key: 'business_photo_20260925_abcdef',
      foto_capturada_at: '2026-10-03T18:42:00.000Z',
      ubicacion_latitud: 25.6866,
      ubicacion_longitud: -100.3161,
      ubicacion_capturada_at: '2026-10-03T18:42:01.000Z',
    };
    const foto = {
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      mimetype: 'image/jpeg',
      size: 3,
    };
    service.registrarEvidencia.mockResolvedValue({ evidencia: {}, evidencias: [] });

    await controller.registrarEvidencia(
      integranteId,
      dto,
      foto,
      request as never,
      'verificacion',
    );

    expect(service.registrarEvidencia).toHaveBeenCalledWith(
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
      VerificacionEntrevistaController.prototype.registrarEvidencia,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('actualiza las integrantes de una evidencia con permiso de registro', async () => {
    const evidenciaId = '22222222-2222-4222-8222-222222222222';
    const dto = {
      integrante_ids: [
        integranteId,
        '66666666-6666-4666-8666-666666666666',
      ],
    };
    service.actualizarIntegrantesEvidencia.mockResolvedValue({ evidencia: {} });

    await controller.actualizarIntegrantesEvidencia(
      integranteId,
      evidenciaId,
      dto,
      request as never,
      'verificacion',
    );

    expect(service.actualizarIntegrantesEvidencia).toHaveBeenCalledWith(
      integranteId,
      evidenciaId,
      {
        usuarioId,
        rolNombre: 'VERIFICADOR',
        mode: 'INSTITUCIONAL',
      },
      dto,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionEntrevistaController.prototype.actualizarIntegrantesEvidencia,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('califica una evidencia para la integrante consultada con permiso de registro', async () => {
    const evidenciaId = '22222222-2222-4222-8222-222222222222';
    const dto = { calificacion: 'PALOMITA' as const };
    service.calificarEvidenciaIntegrante.mockResolvedValue({
      evidencia_id: evidenciaId,
      integrante_id: integranteId,
      calificacion_revision: 'PALOMITA',
    });

    await controller.calificarEvidenciaIntegrante(
      integranteId,
      evidenciaId,
      dto,
      request as never,
      'verificacion',
    );

    expect(service.calificarEvidenciaIntegrante).toHaveBeenCalledWith(
      integranteId,
      evidenciaId,
      {
        usuarioId,
        rolNombre: 'VERIFICADOR',
        mode: 'INSTITUCIONAL',
      },
      dto,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionEntrevistaController.prototype.calificarEvidenciaIntegrante,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });
});
