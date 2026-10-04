import { Controller, Get, Query } from '@nestjs/common';
import { CodigosPostalesService } from './codigos-postales.service';
import { RequierePermiso } from '../auth/permissions.decorator';

@Controller('codigos-postales')
export class CodigosPostalesController {
  constructor(private readonly codigosPostalesService: CodigosPostalesService) {}

  /**
   * GET /codigos-postales/colonias?codigo=64000
   * Buscar colonias por código postal
   */
  @Get('colonias')
  @RequierePermiso('documentacion', 'leer')
  async buscarColonias(@Query('codigo') codigo: string) {
    if (!codigo || codigo.length !== 5) {
      return { colonias: [], municipio: '' };
    }

    const resultados = await this.codigosPostalesService.buscarPorCodigo(codigo);

    if (resultados.length === 0) {
      return { colonias: [], municipio: '' };
    }

    // Retornar colonias y municipio (el municipio es el mismo para todas las colonias del código postal)
    return {
      colonias: resultados.map((r) => r.colonia),
      municipio: resultados[0].municipio,
    };
  }

  /**
   * GET /codigos-postales/info?codigo=64000&colonia=Centro
   * Buscar información completa de una colonia
   */
  @Get('info')
  @RequierePermiso('documentacion', 'leer')
  async buscarInfo(
    @Query('codigo') codigo: string,
    @Query('colonia') colonia: string,
  ) {
    if (!codigo || !colonia) {
      return null;
    }

    return this.codigosPostalesService.buscarPorCodigoYColonia(codigo, colonia);
  }
}
