import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { VisitaVecinoSection } from '../VisitaVecinoSection';

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null }),
}));

jest.mock('../../../context/PendingReviewsContext', () => ({
  usePendingReviews: () => ({ totalPending: 0, openInbox: jest.fn() }),
}));

const baseProps = {
  nombreIntegrante: 'María López',
  fachada: {
    id: 'fachada-1',
    uri: 'file:///fachada.jpg',
    fotoCapturadaAt: '2026-10-18T12:00:00.000Z',
  },
  fachadaPendiente: null,
  loadingFachada: false,
  guardandoFachada: false,
  errorFachada: null,
  inePages: [{ uri: 'file:///ine.jpg', label: 'Frente' }],
  loadingIne: false,
  errorIne: null,
  vecinoConoceDomicilio: null,
  opcionesVisitaVecino: {
    si: [
      { id: 'opcion-si-1', codigo: 'SI_1', etiqueta: 'Confirma el domicilio', orden: 1 },
      { id: 'opcion-si-2', codigo: 'SI_2', etiqueta: 'La conoce personalmente', orden: 2 },
    ],
    no: [
      { id: 'opcion-no-1', codigo: 'NO_1', etiqueta: 'No la conoce', orden: 1 },
    ],
  },
  opcionesSeleccionadas: [],
  loadingOpciones: false,
  errorOpciones: null,
  visitaActualId: null,
  errorResumenVisita: false,
  guardandoResultado: false,
  evidencia: null,
  evidenciaPendiente: null,
  loadingEvidencia: false,
  guardandoEvidencia: false,
  errorEvidencia: null,
  onCaptureFachada: jest.fn(),
  onSaveFachada: jest.fn(),
  onRetryIne: jest.fn(),
  onRetryOpciones: jest.fn(),
  onCaptureEvidencia: jest.fn(),
  onSaveEvidencia: jest.fn(),
};

describe('VisitaVecinoSection', () => {
  it('permite exactamente una opción después de Sí y guarda sólo al confirmar', async () => {
    const onRespuestaChange = jest.fn();
    const view = await render(
      <VisitaVecinoSection
        {...baseProps}
        onRespuestaChange={onRespuestaChange}
      />,
    );

    fireEvent.press(view.getByRole('radio', { name: 'Sí' }));

    const guardar = await view.findByRole('button', { name: 'Guardar respuesta' });
    expect(guardar.props.accessibilityState).toEqual({ disabled: true });
    expect(view.getByRole('radio', { name: 'Confirma el domicilio' })).toBeTruthy();

    fireEvent.press(view.getByRole('radio', { name: 'Confirma el domicilio' }));
    await waitFor(() => {
      expect(view.getByRole('radio', { name: 'Confirma el domicilio' }).props.accessibilityState)
        .toMatchObject({ checked: true });
    });

    fireEvent.press(view.getByRole('radio', { name: 'La conoce personalmente' }));
    await waitFor(() => {
      expect(view.getByRole('radio', { name: 'Confirma el domicilio' }).props.accessibilityState)
        .toMatchObject({ checked: false });
      expect(view.getByRole('radio', { name: 'La conoce personalmente' }).props.accessibilityState)
        .toMatchObject({ checked: true });
      expect(view.getByRole('button', { name: 'Guardar respuesta' }).props.accessibilityState)
        .toMatchObject({ disabled: false });
    });

    fireEvent.press(view.getByRole('button', { name: 'Guardar respuesta' }));

    expect(onRespuestaChange).toHaveBeenCalledWith(
      'si',
      ['opcion-si-2'],
    );
    await waitFor(() => {
      expect(view.queryByRole('button', { name: 'Guardar respuesta' })).toBeNull();
    });
    await view.unmount();
  }, 30000);

  it('usa un catálogo independiente cuando la respuesta es No', async () => {
    const onRespuestaChange = jest.fn();
    const view = await render(
      <VisitaVecinoSection
        {...baseProps}
        onRespuestaChange={onRespuestaChange}
      />,
    );

    fireEvent.press(view.getByRole('radio', { name: 'No' }));

    expect(await view.findByRole('radio', { name: 'No la conoce' })).toBeTruthy();
    expect(view.queryByRole('radio', { name: 'Confirma el domicilio' })).toBeNull();
    await view.unmount();
  }, 30000);
});
