import { fireEvent, render, screen } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MatrizPasosVerificacionScreen } from '../MatrizPasosVerificacionScreen';
import {
  obtenerMatrizPasosVerificacion,
  PASOS_VERIFICACION_CONFIGURABLES,
  TIPOS_INTEGRANTE_VERIFICACION,
} from '../parametros-verificacion-pasos.api';

jest.mock('../parametros-verificacion-pasos.api', () => ({
  PASOS_VERIFICACION_CONFIGURABLES: [
    'DOCUMENTOS',
    'LLAMADA',
    'VISITA_VECINO',
    'IMAGENES_DOMICILIO',
    'ENTREVISTA',
    'CONCLUSIONES',
  ],
  TIPOS_INTEGRANTE_VERIFICACION: [
    'NUEVA',
    'NUEVA_CON_EVIDENCIA',
    'CICLO_2_MAS',
    'CICLO_2_MAS_CON_EVIDENCIA',
  ],
  obtenerMatrizPasosVerificacion: jest.fn(),
  publicarMatrizPasosVerificacion: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null }),
}));

jest.mock('../../../context/PendingReviewsContext', () => ({
  usePendingReviews: () => ({ totalPending: 0, openInbox: jest.fn() }),
}));

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

jest.mock('../../../services/api-client', () => ({
  ApiError: class ApiError extends Error {},
}));

const obtenerMock = obtenerMatrizPasosVerificacion as jest.MockedFunction<
  typeof obtenerMatrizPasosVerificacion
>;

const matriz = {
  version_id: '11111111-1111-4111-8111-111111111111',
  revision: 1,
  publicada_at: '2026-10-21T12:00:00.000Z',
  reglas: TIPOS_INTEGRANTE_VERIFICACION.flatMap((tipo_integrante) => (
    PASOS_VERIFICACION_CONFIGURABLES.map((paso) => ({
      tipo_integrante,
      paso,
      modalidad: 'OBLIGATORIO' as const,
      dias_para_obligatorio: null,
    }))
  )),
};

describe('MatrizPasosVerificacionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    obtenerMock.mockResolvedValue({ matriz });
  });

  it('muestra primero los cuatro tipos y abre sólo los pasos del tipo seleccionado', async () => {
    await render(
      <MatrizPasosVerificacionScreen canUpdate onBack={() => undefined} />,
    );

    expect(await screen.findByText('Nueva en CRELEALTAD')).toBeTruthy();
    expect(screen.getByText('Nueva con evidencia de otra financiera')).toBeTruthy();
    expect(screen.getByText('Ciclo 2+ con CRELEALTAD')).toBeTruthy();
    expect(screen.getByText('Ciclo 2+ con evidencia para aumento')).toBeTruthy();
    expect(screen.queryByText('Documentos')).toBeNull();

    fireEvent.press(screen.getByText('Nueva con evidencia de otra financiera'));

    expect(await screen.findByText('Documentos')).toBeTruthy();
    expect(screen.getByText('Llamada')).toBeTruthy();
    expect(screen.getByText('Visita al vecino')).toBeTruthy();
    expect(screen.getByText('Imágenes del domicilio')).toBeTruthy();
    expect(screen.getByText('Entrevista')).toBeTruthy();
    expect(screen.getByText('Conclusiones')).toBeTruthy();
    expect(screen.queryByText('Nueva en CRELEALTAD')).toBeNull();
    expect(screen.getAllByText('Siempre')).toHaveLength(6);
    expect(screen.getAllByText('Opcional')).toHaveLength(6);
    expect(screen.getAllByText('Después de')).toHaveLength(6);
  }, 30_000);
});
