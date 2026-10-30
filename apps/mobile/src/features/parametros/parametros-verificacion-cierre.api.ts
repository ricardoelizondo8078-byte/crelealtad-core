import { api } from '../../services/api-client';
import { VERIFICACION_READ_REQUEST_OPTIONS } from '../verificacion/verificacion-api-context';

export interface ParametroIntegrantesVerificadas {
  version_id: string;
  revision: number;
  integrantes_verificadas_requeridas: number;
  publicada_at: string;
}

export const obtenerParametroIntegrantesVerificadas = () => api.get<{
  parametro: ParametroIntegrantesVerificadas | null;
}>(
  `/parametros/verificacion/integrantes-verificadas-para-finalizar?_=${Date.now()}`,
  { headers: { 'Cache-Control': 'no-cache, no-store' } },
);

export const publicarParametroIntegrantesVerificadas = (
  integrantesVerificadasRequeridas: number,
  expectedRevision: number,
) => api.put<{ parametro: ParametroIntegrantesVerificadas }>(
  '/parametros/verificacion/integrantes-verificadas-para-finalizar',
  {
    integrantes_verificadas_requeridas: integrantesVerificadasRequeridas,
    expected_revision: expectedRevision,
  },
  { showProcessing: false },
);

export const obtenerIntegrantesVerificadasRequeridas = () => api.get<{
  parametro: ParametroIntegrantesVerificadas | null;
}>(
  '/verificacion/parametros/integrantes-verificadas-para-finalizar',
  VERIFICACION_READ_REQUEST_OPTIONS,
);
