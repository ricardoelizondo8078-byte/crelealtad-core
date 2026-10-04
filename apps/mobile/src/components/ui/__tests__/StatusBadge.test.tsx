import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('muestra la etiqueta y la marca accesoria', async () => {
    const screen = await render(
      <StatusBadge label="SINCRONIZADO" tone="success" leadingMark="✓" />,
    );

    expect(screen.getByText('SINCRONIZADO')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('omite la marca cuando no fue proporcionada', async () => {
    const screen = await render(<StatusBadge label="PENDIENTE" tone="pending" />);

    expect(screen.getByText('PENDIENTE')).toBeTruthy();
    expect(screen.queryByText('✓')).toBeNull();
  });
});
