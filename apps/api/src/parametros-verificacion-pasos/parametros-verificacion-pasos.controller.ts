import { Body, Controller, Get, Headers, Param, Put, Req } from '@nestjs/common';
import { RequierePermiso } from '../auth/permissions.decorator';
import { Usuario } from '../catalogos/entities/usuario.entity';
import {
  ACCESS_CONTEXT_HEADER,
  accessScopeFromContext,
} from '../common/access-scope';
import { IntegrantesService } from '../integrantes/integrantes.service';
import { SolicitudesService } from '../solicitudes/solicitudes.service';
import { ActualizarMatrizVerificacionDto } from './dto/actualizar-matriz-verificacion.dto';
import { ParametrosVerificacionPasosService } from './parametros-verificacion-pasos.service';
import {
  determinarTipoIntegranteVerificacion,
  esEvidenciaOtraFinancieraConfirmada,
} from './parametros-verificacion-pasos.types';

@Controller('parametros/verificacion/pasos')
export class ParametrosVerificacionPasosController {
  constructor(private readonly service: ParametrosVerificacionPasosService) {}

  @Get()
  @RequierePermiso('parametros', 'leer')
  obtener() {
    return this.service.obtenerMatrizVigente().then((matriz) => ({ matriz }));
  }

  @Put()
  @RequierePermiso('parametros', 'actualizar')
  actualizar(
    @Body() dto: ActualizarMatrizVerificacionDto,
    @Req() request: { user: Usuario },
  ) {
    return this.service.actualizarMatriz(dto, request.user);
  }
}

@Controller('verificacion/parametros/pasos')
export class PasosVerificacionController {
  constructor(
    private readonly service: ParametrosVerificacionPasosService,
    private readonly integrantesService: IntegrantesService,
    private readonly solicitudesService: SolicitudesService,
  ) {}

  @Get()
  @RequierePermiso('verificacion', 'leer')
  obtener() {
    return this.service.obtenerMatrizVigente().then((matriz) => ({ matriz }));
  }

  @Get('integrantes/:integranteId/requisitos')
  @RequierePermiso('verificacion', 'leer')
  async obtenerRequisitosIntegrante(
    @Param('integranteId') integranteId: string,
    @Req() request: { user: Usuario },
    @Headers(ACCESS_CONTEXT_HEADER) context?: string,
  ) {
    const scope = accessScopeFromContext(request.user, context);
    const [integrante, solicitud, matriz] = await Promise.all([
      this.integrantesService.getById(integranteId, scope),
      this.solicitudesService.getBySolicitante(integranteId, scope),
      this.service.obtenerMatrizVigente(),
    ]);
    if (!integrante) return null;

    const tieneEvidenciaOtraFinanciera = esEvidenciaOtraFinancieraConfirmada(
      solicitud?.doc_comprobante_credito_ruta,
    );
    const tipoIntegrante = determinarTipoIntegranteVerificacion(
      integrante.tiene_historial_interno === true,
      tieneEvidenciaOtraFinanciera,
    );

    return {
      tipo_integrante: tipoIntegrante,
      tiene_historial_crelealtad: integrante.tiene_historial_interno === true,
      tiene_evidencia_otra_financiera: tieneEvidenciaOtraFinanciera,
      matriz_revision: matriz.revision,
      pasos: matriz.reglas.filter((regla) => regla.tipo_integrante === tipoIntegrante),
    };
  }
}
