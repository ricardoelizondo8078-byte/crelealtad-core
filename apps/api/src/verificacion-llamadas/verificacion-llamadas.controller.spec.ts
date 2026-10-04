import { PERMISO_REQUERIDO_KEY } from '../auth/permissions.decorator';
import { VerificacionLlamadasController } from './verificacion-llamadas.controller';
import {
  CanalLlamadaVerificacion,
  ResultadoLlamadaVerificacion,
} from './verificacion-llamada.entity';

describe('VerificacionLlamadasController', () => {
  const service = {
    obtenerResumen: jest.fn(),
    registrar: jest.fn(),
    registrarEncuesta: jest.fn(),
    registrarConfirmacionTelefono: jest.fn(),
    obtenerEvidencia: jest.fn(),
    obtenerEvidenciaConfirmacionTelefono: jest.fn(),
    obtenerEvidenciaTelefonoActual: jest.fn(),
    reemplazarEvidenciaTelefono: jest.fn(),
  };
  const controller = new VerificacionLlamadasController(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('consulta el resumen con permiso de lectura de Verificación', async () => {
    service.obtenerResumen.mockResolvedValue({ telefonica: {}, whatsapp: {} });

    await controller.obtenerResumen('11111111-1111-4111-8111-111111111111');

    expect(service.obtenerResumen).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionLlamadasController.prototype.obtenerResumen,
    )).toEqual({ modulo: 'verificacion', accion: 'leer' });
  });

  it('registra usando exclusivamente el usuario autenticado como actor', async () => {
    const dto = {
      canal: CanalLlamadaVerificacion.WHATSAPP,
      resultado: ResultadoLlamadaVerificacion.CONTESTADA,
      idempotency_key: 'call_20260918_abcdef',
      ubicacion_latitud: 25.6866142,
      ubicacion_longitud: -100.3161126,
      ubicacion_precision_metros: 8.5,
      ubicacion_capturada_at: '2026-09-21T18:43:00.000Z',
    };
    service.registrar.mockResolvedValue({ llamada: {}, resumen: {} });

    await controller.registrar(
      '11111111-1111-4111-8111-111111111111',
      dto,
      { user: { id: '33333333-3333-4333-8333-333333333333' } } as never,
    );

    expect(service.registrar).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '33333333-3333-4333-8333-333333333333',
      dto,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionLlamadasController.prototype.registrar,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra encuesta y evidencia con el usuario autenticado', async () => {
    const dto = { accion_posterior: 'ENTREVISTA_CORTA' };
    const evidencia = { buffer: Buffer.from([0xff]), mimetype: 'image/jpeg', size: 1 };
    service.registrarEncuesta.mockResolvedValue({ encuesta: {}, resumen: {} });

    await controller.registrarEncuesta(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      dto as never,
      evidencia,
      { user: { id: '33333333-3333-4333-8333-333333333333' } } as never,
    );

    expect(service.registrarEncuesta).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      dto,
      evidencia,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionLlamadasController.prototype.registrarEncuesta,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra la evidencia de confirmación telefónica con el usuario autenticado', async () => {
    const dto = { tipo_telefono: 'SECUNDARIO', telefono: '8112345678' };
    const evidencia = { buffer: Buffer.from([0xff]), mimetype: 'image/jpeg', size: 1 };
    service.registrarConfirmacionTelefono.mockResolvedValue({ confirmacion: {}, resumen: {} });

    await controller.registrarConfirmacionTelefono(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      dto as never,
      evidencia,
      { user: { id: '33333333-3333-4333-8333-333333333333' } } as never,
    );

    expect(service.registrarConfirmacionTelefono).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      dto,
      evidencia,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionLlamadasController.prototype.registrarConfirmacionTelefono,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });

  it('registra una nueva versión de evidencia con el usuario autenticado', async () => {
    const dto = { tipo_telefono: 'PRINCIPAL', telefono: '8112345678' };
    const evidencia = { buffer: Buffer.from([0xff]), mimetype: 'image/jpeg', size: 1 };
    service.reemplazarEvidenciaTelefono.mockResolvedValue({ evidencia: {}, resumen: {} });

    await controller.reemplazarEvidenciaTelefono(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      dto as never,
      evidencia,
      { user: { id: '33333333-3333-4333-8333-333333333333' } } as never,
    );

    expect(service.reemplazarEvidenciaTelefono).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      dto,
      evidencia,
    );
    expect(Reflect.getMetadata(
      PERMISO_REQUERIDO_KEY,
      VerificacionLlamadasController.prototype.reemplazarEvidenciaTelefono,
    )).toEqual({ modulo: 'verificacion', accion: 'registrar' });
  });
});
