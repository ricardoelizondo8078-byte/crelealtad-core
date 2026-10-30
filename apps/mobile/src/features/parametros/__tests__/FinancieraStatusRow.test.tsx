import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { colors, radius } from '../../../theme/tokens';
import { FinancieraStatusRow } from '../FinancieraStatusRow';

describe('FinancieraStatusRow', () => {
  it('muestra sólo el alias y una bolita blanca cuando no existe clasificación', async () => {
    const onPress = jest.fn();
    const view = await render(
      <FinancieraStatusRow
        alias="Came"
        clasificacion={null}
        onPress={onPress}
        testID="financiera-came"
      />,
    );

    expect(view.getByText('Came')).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('financiera-came').props.style))
      .toMatchObject({
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: radius.md,
      });
    expect(StyleSheet.flatten(view.getByTestId('financiera-came-indicator').props.style))
      .toMatchObject({
        backgroundColor: colors.surface,
        borderColor: colors.gray[400],
        borderRadius: radius.pill,
      });

    fireEvent.press(view.getByTestId('financiera-came'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      clasificacion: 'OBJETIVO' as const,
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    {
      clasificacion: 'REVISION' as const,
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    },
    {
      clasificacion: 'NO_PRIORITARIA' as const,
      backgroundColor: colors.dangerSoft,
      borderColor: colors.danger,
    },
  ])('pinta $clasificacion con fondo claro y borde semántico', async ({
    clasificacion,
    backgroundColor,
    borderColor,
  }) => {
    const view = await render(
      <FinancieraStatusRow
        alias="Financiera"
        clasificacion={clasificacion}
        onPress={() => undefined}
        testID="financiera-clasificada"
      />,
    );

    expect(StyleSheet.flatten(view.getByTestId('financiera-clasificada-indicator').props.style))
      .toMatchObject({ backgroundColor, borderColor });
  });
});
