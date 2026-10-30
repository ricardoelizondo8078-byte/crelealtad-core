import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '../../../services/api-client';
import {
  actualizarParametroCiclosCredito,
  actualizarParametroConcordanciaFicha,
  actualizarParametroConcordanciaPrestamo,
  actualizarParametroPromedioEvidencias,
  actualizarParametroSemanaCredito,
  actualizarParametroToleranciaSemanaDesembolso,
  obtenerCalificacionCiclosCreditoVerificacion,
  obtenerCalificacionSemanaCreditoVerificacion,
  obtenerConcordanciaFichaVerificacion,
  obtenerConcordanciaPrestamoVerificacion,
  obtenerPromedioEvidenciasVerificacion,
  obtenerParametroCiclosCredito,
  obtenerParametroConcordanciaFicha,
  obtenerParametroConcordanciaPrestamo,
  obtenerParametroPromedioEvidencias,
  obtenerParametroSemanaCredito,
  obtenerParametroToleranciaSemanaDesembolso,
  obtenerToleranciaSemanaDesembolsoVerificacion,
} from '../parametros-conclusiones.api';
import {
  RANGO_CICLOS_CREDITO_INICIAL,
  RANGO_CONCORDANCIA_INICIAL,
  RANGO_CONCORDANCIA_PRESTAMO_INICIAL,
  RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
  RANGO_SEMANA_CREDITO_INICIAL,
  RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
} from '../parametros-conclusiones.model';

jest.mock('../../../services/api-client', () => ({
  api: { get: jest.fn(), put: jest.fn() },
}));

describe('API de parámetros de Conclusiones', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('separa la consulta administrativa, publicación y consumo de Verificación', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ parametro: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ parametro: {} });

    await obtenerParametroSemanaCredito();
    await actualizarParametroSemanaCredito(RANGO_SEMANA_CREDITO_INICIAL);
    await obtenerCalificacionSemanaCreditoVerificacion();

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /^\/parametros\/verificacion\/conclusiones\/calificacion-semana-credito\?_\=\d+$/,
      ),
      { headers: { 'Cache-Control': 'no-cache, no-store' } },
    );
    expect(api.put).toHaveBeenCalledWith(
      '/parametros/verificacion/conclusiones/calificacion-semana-credito',
      RANGO_SEMANA_CREDITO_INICIAL,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/verificacion/parametros/conclusiones/calificacion-semana-credito',
      { showProcessing: false },
    );
  });

  it('separa administración y consumo de los rangos de ciclos', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ parametro: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ parametro: {} });

    await obtenerParametroCiclosCredito();
    await actualizarParametroCiclosCredito(RANGO_CICLOS_CREDITO_INICIAL);
    await obtenerCalificacionCiclosCreditoVerificacion();

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /^\/parametros\/verificacion\/conclusiones\/calificacion-ciclos-credito\?_\=\d+$/,
      ),
      { headers: { 'Cache-Control': 'no-cache, no-store' } },
    );
    expect(api.put).toHaveBeenCalledWith(
      '/parametros/verificacion/conclusiones/calificacion-ciclos-credito',
      RANGO_CICLOS_CREDITO_INICIAL,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/verificacion/parametros/conclusiones/calificacion-ciclos-credito',
      { showProcessing: false },
    );
  });

  it('separa administración y consumo de la tolerancia de desembolso', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ parametro: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ parametro: {} });

    await obtenerParametroToleranciaSemanaDesembolso();
    await actualizarParametroToleranciaSemanaDesembolso(
      RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
    );
    await obtenerToleranciaSemanaDesembolsoVerificacion();

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /^\/parametros\/verificacion\/conclusiones\/tolerancia-semana-desembolso\?_\=\d+$/,
      ),
      { headers: { 'Cache-Control': 'no-cache, no-store' } },
    );
    expect(api.put).toHaveBeenCalledWith(
      '/parametros/verificacion/conclusiones/tolerancia-semana-desembolso',
      RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/verificacion/parametros/conclusiones/tolerancia-semana-desembolso',
      { showProcessing: false },
    );
  });

  it('separa administración y consumo de ambas concordancias', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ parametro: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ parametro: {} });

    await obtenerParametroConcordanciaFicha();
    await actualizarParametroConcordanciaFicha(RANGO_CONCORDANCIA_INICIAL);
    await obtenerConcordanciaFichaVerificacion();
    await obtenerParametroConcordanciaPrestamo();
    await actualizarParametroConcordanciaPrestamo(RANGO_CONCORDANCIA_PRESTAMO_INICIAL);
    await obtenerConcordanciaPrestamoVerificacion();

    expect(api.put).toHaveBeenNthCalledWith(
      1,
      '/parametros/verificacion/conclusiones/concordancia-ficha',
      RANGO_CONCORDANCIA_INICIAL,
    );
    expect(api.put).toHaveBeenNthCalledWith(
      2,
      '/parametros/verificacion/conclusiones/concordancia-prestamo',
      RANGO_CONCORDANCIA_PRESTAMO_INICIAL,
    );
    expect(api.get).toHaveBeenCalledWith(
      '/verificacion/parametros/conclusiones/concordancia-ficha',
      { showProcessing: false },
    );
    expect(api.get).toHaveBeenCalledWith(
      '/verificacion/parametros/conclusiones/concordancia-prestamo',
      { showProcessing: false },
    );
  });

  it('separa administración y consumo del promedio de fotografías', async () => {
    (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ parametro: {} });
    (api.put as jest.MockedFunction<typeof api.put>).mockResolvedValue({ parametro: {} });

    await obtenerParametroPromedioEvidencias();
    await actualizarParametroPromedioEvidencias(RANGO_PROMEDIO_EVIDENCIAS_INICIAL);
    await obtenerPromedioEvidenciasVerificacion();

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(
        /^\/parametros\/verificacion\/conclusiones\/calificacion-promedio-evidencias\?_\=\d+$/,
      ),
      { headers: { 'Cache-Control': 'no-cache, no-store' } },
    );
    expect(api.put).toHaveBeenCalledWith(
      '/parametros/verificacion/conclusiones/calificacion-promedio-evidencias',
      RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/verificacion/parametros/conclusiones/calificacion-promedio-evidencias',
      { showProcessing: false },
    );
  });
});
