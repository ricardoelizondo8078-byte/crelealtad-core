import { render } from '@testing-library/react-native';
import { colors, statusColors } from '../../../theme/tokens';
import { EvidenceReviewChoice, type EvidenceReviewValue } from '../EvidenceReviewChoice';

describe('EvidenceReviewChoice', () => {
  it.each<{
    value: Exclude<EvidenceReviewValue, null>;
    label: string;
    backgroundColor: string;
  }>([
    {
      value: 'rejected',
      label: 'Marcar evidencia para revisar',
      backgroundColor: statusColors.rejected.background,
    },
    {
      value: 'attention',
      label: 'Calificar evidencia en amarillo',
      backgroundColor: colors.warning,
    },
    {
      value: 'approved',
      label: 'Marcar evidencia como revisada',
      backgroundColor: statusColors.completed.background,
    },
  ])('muestra $value con fondo sólido cuando está seleccionado', async ({
    value,
    label,
    backgroundColor,
  }) => {
    const screen = await render(
      <EvidenceReviewChoice value={value} onChange={jest.fn()} />,
    );

    const selected = screen.getByRole('radio', { name: label });
    expect(selected.props.accessibilityState).toMatchObject({ checked: true });
    expect(selected).toHaveStyle({ backgroundColor, borderWidth: 3 });
    await screen.unmount();
  });
});
