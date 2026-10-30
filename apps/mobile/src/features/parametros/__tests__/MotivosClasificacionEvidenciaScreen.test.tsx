import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MotivosClasificacionEvidenciaScreen } from '../MotivosClasificacionEvidenciaScreen';
import {
  actualizarMotivoClasificacionEvidencia,
  cambiarEstadoMotivoClasificacionEvidencia,
  crearMotivoClasificacionEvidencia,
  listarMotivosClasificacionEvidencia,
  reordenarMotivosClasificacionEvidencia,
} from '../parametros-evidencia-motivos.api';

jest.mock('../parametros-evidencia-motivos.api', () => ({
  actualizarMotivoClasificacionEvidencia: jest.fn(),
  cambiarEstadoMotivoClasificacionEvidencia: jest.fn(),
  crearMotivoClasificacionEvidencia: jest.fn(),
  listarMotivosClasificacionEvidencia: jest.fn(),
  reordenarMotivosClasificacionEvidencia: jest.fn(),
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

const listarMock = listarMotivosClasificacionEvidencia as jest.MockedFunction<
  typeof listarMotivosClasificacionEvidencia
>;
const crearMock = crearMotivoClasificacionEvidencia as jest.MockedFunction<
  typeof crearMotivoClasificacionEvidencia
>;
const estadoMock = cambiarEstadoMotivoClasificacionEvidencia as jest.MockedFunction<
  typeof cambiarEstadoMotivoClasificacionEvidencia
>;
const actualizarMock = actualizarMotivoClasificacionEvidencia as jest.MockedFunction<
  typeof actualizarMotivoClasificacionEvidencia
>;
const reordenarMock = reordenarMotivosClasificacionEvidencia as jest.MockedFunction<
  typeof reordenarMotivosClasificacionEvidencia
>;

const motivo = {
  id: '11111111-1111-4111-8111-111111111111',
  clasificacion: 'VERDE' as const,
  concepto: 'Información consistente',
  orden: 1,
  activo: true,
  created_at: '2026-10-10T12:00:00.000Z',
  updated_at: '2026-10-10T12:00:00.000Z',
};

describe('MotivosClasificacionEvidenciaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listarMock.mockResolvedValue({ items: [motivo] });
    crearMock.mockResolvedValue({ motivo });
    actualizarMock.mockResolvedValue({
      motivo: { ...motivo, concepto: 'Pago comprobado' },
    });
    estadoMock.mockResolvedValue({ motivo: { ...motivo, activo: false } });
    reordenarMock.mockResolvedValue({ items: [motivo] });
  });

  it('agrega un concepto al catálogo del color mostrado', async () => {
    const view = await render(
      <MotivosClasificacionEvidenciaScreen
        clasificacion="VERDE"
        canUpdate
        onBack={() => undefined}
      />,
    );

    expect(await view.findByText('Información consistente')).toBeTruthy();
    await fireEvent.changeText(
      view.getByDisplayValue(''),
      '  Pago   comprobado  ',
    );
    await fireEvent.press(view.getByRole('button', { name: 'Agregar concepto' }));

    await waitFor(() => expect(crearMock).toHaveBeenCalledWith('VERDE', 'Pago comprobado'));
    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  }, 30000);

  it('desactiva sin borrar un concepto existente', async () => {
    const view = await render(
      <MotivosClasificacionEvidenciaScreen
        clasificacion="VERDE"
        canUpdate
        onBack={() => undefined}
      />,
    );

    await view.findByText('Información consistente');
    expect(view.getByTestId(`motivo-actions-${motivo.id}`)).toHaveStyle({
      flexDirection: 'row',
    });
    await fireEvent.press(view.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() => expect(estadoMock).toHaveBeenCalledWith(motivo.id, false));
    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  }, 30000);

  it('edita un concepto que todavía no tiene uso histórico', async () => {
    const view = await render(
      <MotivosClasificacionEvidenciaScreen
        clasificacion="VERDE"
        canUpdate
        onBack={() => undefined}
      />,
    );

    await view.findByText('Información consistente');
    await fireEvent.press(view.getByRole('button', { name: 'Editar' }));
    await fireEvent.changeText(
      view.getByDisplayValue('Información consistente'),
      '  Pago   comprobado  ',
    );
    await fireEvent.press(view.getByRole('button', { name: 'Guardar cambio' }));

    await waitFor(() => expect(actualizarMock).toHaveBeenCalledWith(
      motivo.id,
      'Pago comprobado',
    ));
    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  }, 30000);

  it('mantiene fijo el bloque de conceptos y permite cambiar el orden del pop-up', async () => {
    const segundo = {
      ...motivo,
      id: '22222222-2222-4222-8222-222222222222',
      concepto: 'Documento completo',
      orden: 2,
    };
    listarMock.mockResolvedValue({ items: [motivo, segundo] });
    reordenarMock.mockResolvedValue({
      items: [{ ...segundo, orden: 1 }, { ...motivo, orden: 2 }],
    });
    const view = await render(
      <MotivosClasificacionEvidenciaScreen
        clasificacion="VERDE"
        canUpdate
        onBack={() => undefined}
      />,
    );

    expect(await view.findByRole('header', { name: 'CONCEPTOS REGISTRADOS' })).toBeTruthy();
    expect(view.getByLabelText('Posición 1')).toHaveStyle({ width: 48, height: 48 });
    expect(view.getByLabelText('Posición 2')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: `Bajar ${motivo.concepto}` }));

    await waitFor(() => expect(reordenarMock).toHaveBeenCalledWith(
      'VERDE',
      [segundo.id, motivo.id],
    ));
    await waitFor(() => expect(view.getByText('Documento completo')).toBeTruthy());
  }, 30000);
});
