import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { IntegrantesVerificadasParametroScreen } from '../IntegrantesVerificadasParametroScreen';
import {
  obtenerParametroIntegrantesVerificadas,
  publicarParametroIntegrantesVerificadas,
} from '../parametros-verificacion-cierre.api';

jest.mock('../parametros-verificacion-cierre.api', () => ({
  obtenerParametroIntegrantesVerificadas: jest.fn(),
  publicarParametroIntegrantesVerificadas: jest.fn(),
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

const obtenerMock = obtenerParametroIntegrantesVerificadas as jest.MockedFunction<
  typeof obtenerParametroIntegrantesVerificadas
>;
const publicarMock = publicarParametroIntegrantesVerificadas as jest.MockedFunction<
  typeof publicarParametroIntegrantesVerificadas
>;
describe('IntegrantesVerificadasParametroScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    obtenerMock.mockResolvedValue({ parametro: null });
  });

  it('ofrece un selector desplazable de 0 a 12 y admite publicar cero', async () => {
    const view = await render(
      <IntegrantesVerificadasParametroScreen canUpdate onBack={() => undefined} />,
    );

    expect(await view.findByText('Integrantes verificadas requeridas *')).toBeTruthy();
    expect(view.getByText(/Sin configuración publicada/)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Guardar y publicar' })
      .props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(view.getByRole('button', {
      name: 'Integrantes verificadas requeridas. Selecciona de 0 a 12',
    }));
    expect(await view.findAllByRole('radio')).toHaveLength(13);
    await fireEvent.press(view.getByRole('radio', { name: '0' }));
    await fireEvent.press(view.getByRole('button', { name: 'Confirmar selección' }));
    await waitFor(() => expect(view.getByRole('button', { name: 'Guardar y publicar' })
      .props.accessibilityState.disabled).toBe(false));
  }, 120_000);

  it('confirma en pantalla cuando la cantidad queda publicada', async () => {
    obtenerMock.mockResolvedValue({
      parametro: {
        version_id: 'version-3',
        revision: 3,
        integrantes_verificadas_requeridas: 1,
        publicada_at: '2026-10-23T01:39:32.882Z',
      },
    });
    publicarMock.mockResolvedValue({
      parametro: {
        version_id: 'version-4',
        revision: 4,
        integrantes_verificadas_requeridas: 2,
        publicada_at: '2026-10-23T02:00:00.000Z',
      },
    });

    const view = await render(
      <IntegrantesVerificadasParametroScreen canUpdate onBack={() => undefined} />,
    );

    await waitFor(() => expect(view.getByRole('button', {
      name: 'Integrantes verificadas requeridas. 1',
    })).toBeTruthy());
    await fireEvent.press(view.getByRole('button', {
      name: 'Integrantes verificadas requeridas. 1',
    }));
    await fireEvent.press(view.getByRole('radio', { name: '2' }));
    await fireEvent.press(view.getByRole('button', { name: 'Confirmar selección' }));
    await fireEvent.press(view.getByRole('button', { name: 'Guardar y publicar' }));
    await waitFor(() => expect(view.getAllByRole('button', {
      name: 'Guardar y publicar',
    })).toHaveLength(2));
    await fireEvent.press(view.getAllByRole('button', { name: 'Guardar y publicar' })[1]);

    expect(await view.findByText('La cantidad quedó guardada y publicada.')).toBeTruthy();
    expect(view.getByText('Versión publicada 4')).toBeTruthy();
    expect(publicarMock).toHaveBeenCalledWith(2, 3);
  }, 120_000);
});
