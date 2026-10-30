import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import {
  colors,
  layout,
  spacing,
  typography,
} from '../../../theme/tokens';
import {
  getEvidenceClassificationControlsStyle,
  getEvidenceClassificationFrameStyle,
  ZoomableImage,
} from '../ZoomableImage';

describe('ZoomableImage', () => {
  it('reserva bandas iguales y limita la clasificación a la parte superior e inferior', () => {
    expect(getEvidenceClassificationFrameStyle('#10B981')).toEqual({
      backgroundColor: colors.white,
      borderBottomColor: '#10B981',
      borderBottomWidth: layout.evidenceControlsBandHeight,
      borderTopColor: '#10B981',
      borderTopWidth: layout.evidenceClassificationBandHeight,
    });
    expect(layout.evidenceClassificationBandHeight).toBe(64);
    expect(layout.evidenceControlsBandHeight).toBe(72);
    expect(getEvidenceClassificationFrameStyle()).toEqual({
      backgroundColor: colors.white,
      borderBottomColor: colors.white,
      borderBottomWidth: 72,
      borderTopColor: colors.white,
      borderTopWidth: 64,
    });
    expect(getEvidenceClassificationControlsStyle('#10B981')).toEqual({
      bottom: -layout.evidenceControlsBandHeight + spacing.sm,
    });
    expect(getEvidenceClassificationControlsStyle()).toEqual({
      bottom: -layout.evidenceControlsBandHeight + spacing.sm,
    });
  });

  it('muestra el motivo centrado dentro de la franja superior clasificada', async () => {
    const screen = await render(
      <ZoomableImage
        uri="file:///evidencia-amarilla.jpg"
        accessibilityLabel="Evidencia amarilla"
        frameColor="#F59E0B"
        frameLabel="Información incompleta"
        style={{ height: 400 }}
      />,
    );

    expect(screen.getByText('Información incompleta')).toHaveStyle({
      color: colors.gray[900],
      fontSize: typography.contextTitle.fontSize,
      textAlign: 'center',
    });
    await screen.unmount();
  });

  it('muestra y ejecuta la acción izquierda frente a los controles de zoom', async () => {
    const onEdit = jest.fn<() => void>();
    const screen = await render(
      <ZoomableImage
        uri="file:///evidencia.jpg"
        accessibilityLabel="Evidencia de otra financiera"
        leftAction={{
          title: 'Integrantes',
          accessibilityLabel: 'Editar integrantes de esta evidencia',
          onPress: onEdit,
        }}
        style={{ height: 400 }}
      />,
    );

    fireEvent.press(screen.getByLabelText('Editar integrantes de esta evidencia'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('zoomable-image-left-action')).toHaveStyle({
      bottom: -layout.evidenceControlsBandHeight + spacing.sm,
      height: 56,
    });
    expect(screen.getByTestId('zoomable-image-controls')).toHaveStyle({
      bottom: -layout.evidenceControlsBandHeight + spacing.sm,
      height: 56,
    });
    await screen.unmount();
  });

  it('no agrega el botón cuando no recibe una acción de edición', async () => {
    const screen = await render(
      <ZoomableImage
        uri="file:///comprobante.jpg"
        accessibilityLabel="Comprobante de Documentación"
        style={{ height: 400 }}
      />,
    );

    expect(screen.queryByLabelText('Editar integrantes de esta evidencia')).toBeNull();
    await screen.unmount();
  });

});
