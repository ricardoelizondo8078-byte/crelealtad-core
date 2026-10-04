import { PERMISO_REQUERIDO_KEY, SOLO_AUTENTICADO_KEY } from './permissions.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthController } from './auth.controller';
import { CodigosPostalesController } from '../codigos-postales/codigos-postales.controller';
import { ExpedientesController } from '../expedientes/expedientes.controller';
import { GruposController } from '../grupos/grupos.controller';
import { HealthController } from '../health.controller';
import { IntegrantesController } from '../integrantes/integrantes.controller';
import { SolicitudesController } from '../solicitudes/solicitudes.controller';
import { RenovacionesController } from '../renovaciones/renovaciones.controller';
import { PendientesController } from '../pendientes/pendientes.controller';
import { VerificacionLlamadasController } from '../verificacion-llamadas/verificacion-llamadas.controller';
import { VerificacionVisitasVecinoController } from '../verificacion-visitas-vecino/verificacion-visitas-vecino.controller';
import { VerificacionImagenesDomicilioController } from '../verificacion-imagenes-domicilio/verificacion-imagenes-domicilio.controller';
import { VerificacionEntrevistaController } from '../verificacion-entrevista/verificacion-entrevista.controller';

describe('Cobertura declarativa de permisos', () => {
  const controladores = [
    AuthController,
    CodigosPostalesController,
    ExpedientesController,
    GruposController,
    HealthController,
    IntegrantesController,
    SolicitudesController,
    RenovacionesController,
    PendientesController,
    VerificacionLlamadasController,
    VerificacionVisitasVecinoController,
    VerificacionImagenesDomicilioController,
    VerificacionEntrevistaController,
  ];

  it.each(controladores.map((controlador) => [controlador.name, controlador]))(
    '%s no deja handlers sin clasificación de acceso',
    (_nombre, controlador) => {
      const prototype = controlador.prototype as unknown as Record<string, unknown>;
      const metodos = Object.getOwnPropertyNames(prototype).filter(
        (nombre) => nombre !== 'constructor' && typeof prototype[nombre] === 'function',
      );

      for (const nombre of metodos) {
        const handler = prototype[nombre] as (...args: unknown[]) => unknown;
        const esPublico = Reflect.getMetadata(IS_PUBLIC_KEY, handler);
        const soloAutenticado = Reflect.getMetadata(SOLO_AUTENTICADO_KEY, handler);
        const permiso = Reflect.getMetadata(PERMISO_REQUERIDO_KEY, handler);

        expect(esPublico || soloAutenticado || permiso).toBeTruthy();
      }
    },
  );
});
