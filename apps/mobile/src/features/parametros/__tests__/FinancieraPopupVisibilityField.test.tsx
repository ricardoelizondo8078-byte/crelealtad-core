import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { StyleSheet } from 'react-native';
import { moduleThemes } from '../../../theme/tokens';
import { FinancieraPopupVisibilityField } from '../FinancieraPopupVisibilityField';

describe('FinancieraPopupVisibilityField', () => {
  it('muestra la disponibilidad actual y convierte No al valor del formulario', async () => {
    const onChange = jest.fn();
    const view = await render(
      <FinancieraPopupVisibilityField value="Sí" onChange={onChange} />,
    );

    expect(view.getByText('¿Se muestran en el pop-up?')).toBeTruthy();
    expect(view.queryByText(
      'El cambio se aplicará después de la aprobación de Gerencia y la publicación por Administración.',
    )).toBeNull();
    expect(view.getByRole('radio', { name: 'Sí' }).props.accessibilityState.selected).toBe(true);
    expect(StyleSheet.flatten(view.getByRole('radio', { name: 'Sí' }).props.style)).toMatchObject({
      minHeight: 40,
      borderRadius: 999,
      borderColor: moduleThemes.parameters.primary,
    });

    fireEvent.press(view.getByRole('radio', { name: 'No' }));
    expect(onChange).toHaveBeenCalledWith('No');
  });
});
