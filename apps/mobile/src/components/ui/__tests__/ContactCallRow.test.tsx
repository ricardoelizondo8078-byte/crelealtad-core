import { fireEvent, render } from '@testing-library/react-native';
import { colors, spacing, touchTargets, typography } from '../../../theme/tokens';
import { ContactCallRow } from '../ContactCallRow';

describe('ContactCallRow', () => {
  it('muestra el nombre y permite llamar cuando existe un teléfono válido', async () => {
    const onCall = jest.fn();
    const screen = await render(
      <ContactCallRow
        label="Asesor"
        name="ASESOR PRUEBA"
        phone="8112345678"
        moduleTheme="verification"
        onCall={onCall}
      />,
    );

    await fireEvent.press(screen.getByRole('button', {
      name: 'Llamar a ASESOR PRUEBA al 81-12-34-56-78',
    }));

    expect(screen.getByTestId('contact-call-identity')).toHaveStyle({
      alignItems: 'flex-start',
    });
    expect(screen.getByText('Asesor')).toHaveStyle({
      color: colors.textSecondary,
      fontSize: typography.notificationBadge.fontSize,
    });
    expect(screen.getByTestId('contact-call-phone-value')).toHaveStyle({
      backgroundColor: colors.infoSoft,
      minHeight: touchTargets.minimum - spacing.xs,
      minWidth: 116,
      paddingHorizontal: spacing.sm,
    });
    expect(screen.getByText('81-12-34-56-78')).toHaveStyle({
      color: colors.info,
      fontSize: typography.bodyStrong.fontSize,
      fontWeight: typography.bodyStrong.fontWeight,
    });
    expect(screen.getByTestId('contact-call-phone-icon-box')).toHaveStyle({
      backgroundColor: colors.infoSoft,
      minHeight: touchTargets.minimum - spacing.xs,
      width: touchTargets.minimum - spacing.xs,
    });
    expect(screen.getByTestId('contact-call-phone-icon')).toHaveStyle({
      color: colors.textPrimary,
    });
    expect(onCall).toHaveBeenCalledTimes(1);
    await screen.unmount();
  }, 15_000);

  it('presenta un estado no accionable cuando falta el teléfono', async () => {
    const onCall = jest.fn();
    const screen = await render(
      <ContactCallRow
        label="Asesor"
        name="ASESOR PRUEBA"
        phone={null}
        onCall={onCall}
      />,
    );

    expect(screen.getByText('Sin teléfono')).toBeTruthy();
    const callButton = screen.getByRole('button');
    expect(callButton.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(callButton);
    expect(onCall).not.toHaveBeenCalled();
    await screen.unmount();
  });
});
