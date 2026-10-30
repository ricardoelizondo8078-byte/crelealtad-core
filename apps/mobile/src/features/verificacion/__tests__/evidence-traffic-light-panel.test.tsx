import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { ScrollView } from 'react-native';
import { EvidenceTrafficLightPanel } from '../EvidenceTrafficLightPanel';

const motivos = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    clasificacion: 'VERDE' as const,
    concepto: 'Información consistente',
    orden: 1,
    activo: true,
    created_at: '2026-10-10T12:00:00.000Z',
    updated_at: '2026-10-10T12:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    clasificacion: 'AMARILLO' as const,
    concepto: 'Requiere seguimiento',
    orden: 1,
    activo: true,
    created_at: '2026-10-10T12:00:00.000Z',
    updated_at: '2026-10-10T12:00:00.000Z',
  },
];

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    mergeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
  },
}));

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

describe('EvidenceTrafficLightPanel', () => {
  it('exige elegir el color antes de continuar con integrantes', async () => {
    const onConfirm = jest.fn<(
      value: 'VERDE' | 'AMARILLO' | 'ROJO',
      motivoId: string,
    ) => void>();
    const screen = await render(
      <EvidenceTrafficLightPanel
        imageUri="file:///evidencia.jpg"
        motivos={motivos}
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Continuar con integrantes' }).props.accessibilityState,
    ).toEqual({ disabled: true });
    await fireEvent.press(screen.getByRole('radio', {
      name: 'VERDE. Mostrar esta fotografía con marco verde',
    }));
    await waitFor(() => {
      expect(screen.getByLabelText('Vista previa con clasificación VERDE')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'Información consistente' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar selección' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con integrantes' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(
      'VERDE',
      '11111111-1111-4111-8111-111111111111',
    ));
    await screen.unmount();
  }, 30_000);

  it('permite cancelar la toma antes de clasificarla', async () => {
    const onCancel = jest.fn<() => void>();
    const screen = await render(
      <EvidenceTrafficLightPanel
        imageUri="file:///evidencia.jpg"
        motivos={motivos}
        onConfirm={() => undefined}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar y repetir' }));

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    await screen.unmount();
  });

  it('mantiene seleccionables los colores al abrirse sobre un formulario desplazable', async () => {
    const onConfirm = jest.fn<(
      value: 'VERDE' | 'AMARILLO' | 'ROJO',
      motivoId: string,
    ) => void>();
    const screen = await render(
      <ScrollView>
        <EvidenceTrafficLightPanel
          imageUri="file:///evidencia.jpg"
          motivos={motivos}
          onConfirm={onConfirm}
          onCancel={() => undefined}
        />
      </ScrollView>,
    );

    await fireEvent.press(screen.getByRole('radio', {
      name: 'AMARILLO. Mostrar esta fotografía con marco amarillo',
    }));
    await waitFor(() => {
      expect(screen.getByLabelText('Vista previa con clasificación AMARILLO')).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'Requiere seguimiento' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar selección' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con integrantes' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(
      'AMARILLO',
      '22222222-2222-4222-8222-222222222222',
    ));
    await screen.unmount();
  });

  it('bloquea la confirmación si el color no tiene un motivo activo', async () => {
    const onConfirm = jest.fn();
    const screen = await render(
      <EvidenceTrafficLightPanel
        imageUri="file:///evidencia.jpg"
        motivos={[]}
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />,
    );

    await fireEvent.press(screen.getByRole('radio', {
      name: 'ROJO. Mostrar esta fotografía con marco rojo',
    }));

    expect(screen.getByText(
      'Administración todavía no ha registrado motivos activos para este color.',
    )).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Continuar con integrantes' }).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(onConfirm).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
