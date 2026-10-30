import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { colors, moduleThemes, statusColors } from '../../../theme/tokens';
import { DocumentViewer, isDocumentViewerPagingEnabled } from '../DocumentViewer';

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

jest.mock('../ZoomableImage', () => ({
  ZoomableImage: 'ZoomableImage',
}));

describe('DocumentViewer', () => {
  it('deshabilita el carrusel mientras el zoom mantiene bloqueada la paginación', () => {
    expect(isDocumentViewerPagingEnabled(false)).toBe(true);
    expect(isDocumentViewerPagingEnabled(true)).toBe(false);
  });

  it('abre la página solicitada y cambia de foto mediante deslizamiento', async () => {
    const onPageIndexChange = jest.fn<(pageIndex: number) => void>();
    const screen = await render(
      <DocumentViewer
        visible
        title="Evidencia de otra financiera"
        pages={[
          {
            uri: 'file:///evidencia-verde.jpg',
            mimeType: 'image/jpeg',
            frameAccessibilityLabel: 'Evidencia 1. Clasificación VERDE',
          },
          {
            uri: 'file:///evidencia-roja.jpg',
            mimeType: 'image/jpeg',
            frameAccessibilityLabel: 'Evidencia 2. Clasificación ROJO',
          },
        ]}
        initialPageIndex={1}
        onPageIndexChange={onPageIndexChange}
        onClose={() => undefined}
        moduleTheme="verification"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Foto 2 de 2. Desliza a los lados para cambiar de foto.')).toBeTruthy();
    });
    fireEvent(screen.getByTestId('document-viewer-preview'), 'layout', {
      nativeEvent: { layout: { width: 320, height: 480, x: 0, y: 0 } },
    });
    await waitFor(() => {
      expect(screen.getByTestId('document-viewer-pager')).toBeTruthy();
      expect(screen.getByLabelText(
        'Vista ampliable de Evidencia de otra financiera. Evidencia 2. Clasificación ROJO',
      )).toBeTruthy();
    });
    expect(screen.queryByText('Anterior')).toBeNull();
    expect(screen.queryByText('Siguiente')).toBeNull();

    fireEvent(screen.getByTestId('document-viewer-pager'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Foto 1 de 2. Desliza a los lados para cambiar de foto.')).toBeTruthy();
      expect(onPageIndexChange).toHaveBeenLastCalledWith(0);
    });
    await screen.unmount();
  }, 60_000);

  it('presenta el formato institucional y puede bloquear el cierre durante una operación', async () => {
    const onClose = jest.fn<() => void>();
    const onReviewChange = jest.fn<(value: 'rejected' | 'attention' | 'approved') => void>();
    const screen = await render(
      <DocumentViewer
        visible
        title="Evidencia de otra financiera · Crédito activo"
        pages={[{
          uri: 'file:///evidencia.jpg',
          mimeType: 'image/jpeg',
          reviewValue: 'approved',
          onReviewChange,
        }]}
        onClose={onClose}
        moduleTheme="verification"
        closeButtonDisabled
        showReviewChoice
      />,
    );

    const closeButton = screen.getByLabelText('Cerrar imagen ampliada');
    expect(closeButton.props.accessibilityState).toEqual({ disabled: true });
    expect(closeButton).toHaveStyle({ width: 36, height: 36 });
    expect(screen.getByTestId('document-viewer-actions')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'flex-end',
    });
    expect(screen.getByTestId('evidence-review-choice').parent)
      .toBe(screen.getByTestId('document-viewer-actions'));
    expect(screen.getByTestId('document-viewer-overlay')).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    });
    expect(screen.getByTestId('document-viewer-content')).toHaveStyle({
      width: '95%',
      height: '90%',
    });
    expect(screen.getByText('Evidencia de otra financiera · Crédito activo').parent?.parent).toHaveStyle({
      backgroundColor: moduleThemes.verification.headerBg,
      borderBottomColor: moduleThemes.verification.titleBarBg,
    });
    expect(screen.queryByText('Cerrar')).toBeNull();
    expect(screen.getByText('Revisa')).toBeTruthy();

    const rejectedChoice = screen.getByRole('radio', { name: 'Marcar evidencia para revisar' });
    const attentionChoice = screen.getByRole('radio', { name: 'Calificar evidencia en amarillo' });
    const approvedChoice = screen.getByRole('radio', { name: 'Marcar evidencia como revisada' });
    expect(rejectedChoice.props.accessibilityState).toMatchObject({ checked: false });
    expect(attentionChoice.props.accessibilityState).toMatchObject({ checked: false });
    expect(approvedChoice.props.accessibilityState).toMatchObject({ checked: true });
    expect(rejectedChoice).toHaveStyle({
      backgroundColor: colors.dangerSoft,
      borderColor: statusColors.rejected.background,
      borderRadius: 999,
    });
    expect(approvedChoice).toHaveStyle({
      backgroundColor: statusColors.completed.background,
      borderColor: statusColors.completed.background,
      borderRadius: 999,
    });
    expect(attentionChoice).toHaveStyle({
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
      borderRadius: 999,
    });

    expect(approvedChoice).toHaveStyle({ borderWidth: 3 });
    fireEvent.press(attentionChoice);
    expect(onReviewChange).toHaveBeenCalledWith('attention');
    fireEvent.press(rejectedChoice);
    expect(onReviewChange).toHaveBeenCalledWith('rejected');

    fireEvent.press(closeButton);
    expect(onClose).not.toHaveBeenCalled();
    await screen.unmount();
  }, 60_000);

});
