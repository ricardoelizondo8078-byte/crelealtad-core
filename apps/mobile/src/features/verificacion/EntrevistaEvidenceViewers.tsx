import React from 'react';
import { DocumentViewer, type EvidenceReviewValue } from '../../components/ui';

interface EvidenceImage {
  uri: string;
  headers?: Record<string, string>;
  label?: string;
  evidenciaId?: string;
  integranteIds?: string[];
  frameColor?: string;
  frameLabel?: string;
  frameAccessibilityLabel?: string;
  reviewValue?: EvidenceReviewValue;
  reviewDisabled?: boolean;
}

interface EntrevistaEvidenceViewersProps {
  controlPagosVisible: boolean;
  controlPagos: EvidenceImage | null;
  imagenDomicilio: (EvidenceImage & { titulo: string }) | null;
  folletoVisible: boolean;
  folleto: EvidenceImage | null;
  historialCreditoVisible: boolean;
  historialCredito: readonly EvidenceImage[];
  historialCreditoTitle: string;
  fotografiasResumenVisible: boolean;
  fotografiasResumen: readonly EvidenceImage[];
  fotografiasResumenTitle: string;
  onCloseControlPagos: () => void;
  onCloseImagenDomicilio: () => void;
  onCloseFolleto: () => void;
  onCloseHistorialCredito: () => void;
  onCloseFotografiasResumen: () => void;
  onEditHistorialCreditoIntegrantes: (evidenciaId: string, integranteIds: string[]) => void;
  onCalificarHistorialCredito: (
    evidenciaId: string,
    value: Exclude<EvidenceReviewValue, null>,
  ) => void;
}

const page = (evidencia: EvidenceImage | null) => evidencia ? [{
  uri: evidencia.uri,
  headers: evidencia.headers,
  mimeType: 'image/jpeg',
}] : [];

export const EntrevistaEvidenceViewers: React.FC<EntrevistaEvidenceViewersProps> = ({
  controlPagosVisible,
  controlPagos,
  imagenDomicilio,
  folletoVisible,
  folleto,
  historialCreditoVisible,
  historialCredito,
  historialCreditoTitle,
  fotografiasResumenVisible,
  fotografiasResumen,
  fotografiasResumenTitle,
  onCloseControlPagos,
  onCloseImagenDomicilio,
  onCloseFolleto,
  onCloseHistorialCredito,
  onCloseFotografiasResumen,
  onEditHistorialCreditoIntegrantes,
  onCalificarHistorialCredito,
}) => (
  <>
    <DocumentViewer
      visible={controlPagosVisible && Boolean(controlPagos)}
      title="Control de pagos"
      pages={page(controlPagos)}
      onClose={onCloseControlPagos}
      moduleTheme="verification"
    />
    <DocumentViewer
      visible={Boolean(imagenDomicilio)}
      title={imagenDomicilio?.titulo ?? 'Imagen del domicilio'}
      pages={page(imagenDomicilio)}
      onClose={onCloseImagenDomicilio}
      moduleTheme="verification"
    />
    <DocumentViewer
      visible={folletoVisible && Boolean(folleto)}
      title="Evidencia del folleto para tesorera"
      pages={page(folleto)}
      onClose={onCloseFolleto}
      moduleTheme="verification"
    />
    <DocumentViewer
      visible={historialCreditoVisible && historialCredito.length > 0}
      title={historialCreditoTitle}
      pages={historialCredito.map((evidencia) => {
        const evidenciaId = evidencia.evidenciaId;
        const integranteIds = evidencia.integranteIds;
        return {
          uri: evidencia.uri,
          headers: evidencia.headers,
          mimeType: 'image/jpeg',
          frameColor: evidencia.frameColor,
          frameLabel: evidencia.frameLabel,
          frameAccessibilityLabel: evidencia.frameAccessibilityLabel,
          reviewValue: evidencia.reviewValue,
          reviewDisabled: evidencia.reviewDisabled,
          onReviewChange: evidenciaId
            ? (value: Exclude<EvidenceReviewValue, null>) => (
              onCalificarHistorialCredito(evidenciaId, value)
            )
            : undefined,
          leftAction: evidenciaId && integranteIds ? {
            title: 'Integrantes',
            accessibilityLabel: 'Editar integrantes de esta evidencia',
            onPress: () => onEditHistorialCreditoIntegrantes(evidenciaId, integranteIds),
          } : undefined,
        };
      })}
      onClose={onCloseHistorialCredito}
      moduleTheme="verification"
      showReviewChoice
    />
    <DocumentViewer
      visible={fotografiasResumenVisible && fotografiasResumen.length > 0}
      title={fotografiasResumenTitle}
      pages={fotografiasResumen.map((evidencia) => ({
        uri: evidencia.uri,
        headers: evidencia.headers,
        mimeType: 'image/jpeg',
        label: evidencia.label,
      }))}
      onClose={onCloseFotografiasResumen}
      moduleTheme="verification"
    />
  </>
);
