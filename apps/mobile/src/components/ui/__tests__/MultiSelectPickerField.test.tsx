import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { MultiSelectPickerField } from '../MultiSelectPickerField';

const options = [
  { value: 'integrante-1', label: 'Ana López' },
  { value: 'integrante-2', label: 'Beatriz Ruiz' },
  { value: 'integrante-3', label: 'Carla Soto' },
];

describe('MultiSelectPickerField', () => {
  it('notifica la cancelación para descartar una captura pendiente', async () => {
    const onCancel = jest.fn();
    const view = await render(
      <MultiSelectPickerField
        label="¿De qué integrantes es esta evidencia?"
        value={[]}
        options={options}
        onSelect={() => undefined}
        onCancel={onCancel}
        openOnMount
        minSelections={1}
      />,
    );

    fireEvent.press(await view.findByRole('button', { name: 'Cancelar selección' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
    await view.unmount();
  }, 30000);

  it('obliga a elegir al menos una integrante y permite guardar una o todas', async () => {
    const onSelect = jest.fn();
    const view = await render(
      <MultiSelectPickerField
        label="¿De qué integrantes es esta evidencia?"
        value={[]}
        options={options}
        onSelect={onSelect}
        openOnMount
        minSelections={1}
        selectAllLabel="Todas las integrantes"
        confirmLabel="Guardar evidencia"
      />,
    );

    const guardar = await view.findByRole('button', { name: 'Guardar evidencia' });
    expect(guardar.props.accessibilityState).toEqual({ disabled: true });

    fireEvent.press(view.getByRole('checkbox', { name: 'Ana López' }));
    await waitFor(() => {
      expect(view.getByRole('button', { name: 'Guardar evidencia' }).props.accessibilityState)
        .toEqual({ disabled: false });
    });
    fireEvent.press(view.getByRole('button', { name: 'Guardar evidencia' }));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(['integrante-1']);
    });

    fireEvent.press(view.getByRole('button', {
      name: /¿De qué integrantes es esta evidencia\?.*Seleccionar integrantes/i,
    }));
    const todas = await view.findByRole('checkbox', { name: 'Todas las integrantes' });
    fireEvent.press(todas);
    await waitFor(() => {
      expect(view.getByRole('checkbox', { name: 'Carla Soto' }).props.accessibilityState)
        .toEqual({ checked: true });
    });
    fireEvent.press(view.getByRole('button', { name: 'Guardar evidencia' }));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(options.map((option) => option.value));
    });
    await view.unmount();
  }, 30000);
});
