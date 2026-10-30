import { act, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { ZoomableImage } from '../ZoomableImage';

describe('ZoomableImage paging lock', () => {
  it('bloquea la paginación al iniciar un pellizco y la libera al terminar en 100 %', async () => {
    const onPagingLockChange = jest.fn<(locked: boolean) => void>();
    const screen = await render(
      <ZoomableImage
        uri="file:///evidencia.jpg"
        accessibilityLabel="Evidencia ampliable"
        onPagingLockChange={onPagingLockChange}
        style={{ height: 400 }}
      />,
    );

    const gestureSurface = screen.getByTestId('zoomable-image-gesture-surface');
    await act(async () => {
      gestureSurface.props.onTouchStart({
        nativeEvent: {
          touches: [
            { pageX: 80, pageY: 180 },
            { pageX: 160, pageY: 260 },
          ],
        },
      });
    });
    expect(onPagingLockChange).toHaveBeenLastCalledWith(true);

    await act(async () => {
      gestureSurface.props.onTouchEnd({
        nativeEvent: { touches: [] },
      });
    });
    expect(onPagingLockChange).toHaveBeenLastCalledWith(false);
  });
});
