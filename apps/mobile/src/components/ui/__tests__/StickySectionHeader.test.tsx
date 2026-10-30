import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { StyleSheet } from 'react-native';
import { spacing } from '../../../theme/tokens';
import { StickySectionHeader } from '../StickySectionHeader';

describe('StickySectionHeader', () => {
  it('iguala la anchura y separación efectiva de Verificación', async () => {
    const view = await render(
      <StickySectionHeader
        title="PRODUCTO"
        moduleTheme="parameters"
        placement="standalone"
        fullBleed
      />,
    );

    const header = view.getByRole('header', { name: 'PRODUCTO' });
    const containerStyle = StyleSheet.flatten(header.parent?.props.style);

    expect(containerStyle).toMatchObject({
      marginHorizontal: -spacing.xs,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    });
  });
});
