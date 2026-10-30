import React from 'react';
import { EntrevistaEvidenceViewers } from '../EntrevistaEvidenceViewers';

jest.mock('../../../components/ui', () => ({
  DocumentViewer: () => null,
}));

describe('EntrevistaEvidenceViewers', () => {
  it('mantiene habilitada la tacha superior en el visor de evidencia externa', () => {
    const element = EntrevistaEvidenceViewers({
      controlPagosVisible: false,
      controlPagos: null,
      imagenDomicilio: null,
      folletoVisible: false,
      folleto: null,
      historialCreditoVisible: true,
      historialCredito: [{
        uri: 'evidencia.jpg',
        evidenciaId: 'evidencia-1',
        integranteIds: ['integrante-1'],
        reviewValue: null,
      }],
      historialCreditoTitle: 'Evidencia de otra financiera',
      fotografiasResumenVisible: true,
      fotografiasResumen: [{ uri: 'fachada.jpg', label: 'Fachada' }],
      fotografiasResumenTitle: 'Fotografías de casa',
      onCloseControlPagos: jest.fn(),
      onCloseImagenDomicilio: jest.fn(),
      onCloseFolleto: jest.fn(),
      onCloseHistorialCredito: jest.fn(),
      onCloseFotografiasResumen: jest.fn(),
      onEditHistorialCreditoIntegrantes: jest.fn(),
      onCalificarHistorialCredito: jest.fn(),
    }) as React.ReactElement<{ children: React.ReactNode }>;

    const viewers = React.Children.toArray(element.props.children) as React.ReactElement<{
      closeButtonDisabled?: boolean;
      showReviewChoice?: boolean;
    }>[];
    const historialViewer = viewers[3];

    expect(historialViewer.props.closeButtonDisabled).toBeUndefined();
    expect(historialViewer.props.showReviewChoice).toBe(true);
    const fotografiasResumenViewer = viewers[4] as React.ReactElement<{
      visible?: boolean;
      title?: string;
      pages?: { uri: string; label?: string }[];
      showReviewChoice?: boolean;
    }>;
    expect(fotografiasResumenViewer.props.visible).toBe(true);
    expect(fotografiasResumenViewer.props.title).toBe('Fotografías de casa');
    expect(fotografiasResumenViewer.props.pages).toEqual([
      expect.objectContaining({ uri: 'fachada.jpg', label: 'Fachada' }),
    ]);
    expect(fotografiasResumenViewer.props.showReviewChoice).toBeUndefined();
  });
});
