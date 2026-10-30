import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { SemanticChoiceGroup, type SemanticChoiceOption } from '../SemanticChoiceGroup';
import { colors } from '../../../theme/tokens';

const options: readonly SemanticChoiceOption[] = [
  {
    value: 'VERDE',
    label: 'Óptima',
    description: 'Nos interesa esta cartera',
    symbol: '✓',
    tone: 'positive',
  },
  {
    value: 'AMARILLO',
    label: 'Atención',
    description: 'Requiere atención',
    symbol: '!',
    tone: 'warning',
  },
  {
    value: 'ROJO',
    label: 'No interesa',
    description: 'No nos interesa esta cartera',
    symbol: '×',
    tone: 'negative',
  },
];

describe('SemanticChoiceGroup', () => {
  it('expone tres radios y comunica la selección también con una marca', async () => {
    const onSelect = jest.fn();
    const view = await render(
      <SemanticChoiceGroup value="AMARILLO" options={options} onSelect={onSelect} />,
    );

    expect(view.getByRole('radio', { name: /óptima/i })).toBeTruthy();
    expect(view.getByRole('radio', { name: /atención/i }).props.accessibilityState)
      .toEqual({ selected: true, disabled: false });
    expect(view.getByText('!')).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('semantic-choice-indicator-VERDE').props.style))
      .toMatchObject({
        borderRadius: 19,
        borderColor: colors.success,
        backgroundColor: colors.successSoft,
      });
    expect(StyleSheet.flatten(view.getByTestId('semantic-choice-indicator-AMARILLO').props.style))
      .toMatchObject({
        borderRadius: 19,
        borderColor: colors.warning,
        backgroundColor: colors.warning,
      });

    fireEvent.press(view.getByRole('radio', { name: /no interesa/i }));
    expect(onSelect).toHaveBeenCalledWith('ROJO');
  });

  it('permite dejar la clasificación vacía cuando la captura es opcional', async () => {
    const onSelect = jest.fn();
    const view = await render(
      <SemanticChoiceGroup
        value="AMARILLO"
        options={options}
        allowClear
        onSelect={onSelect}
      />,
    );

    fireEvent.press(view.getByRole('radio', { name: /atención/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
