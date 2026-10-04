import React from 'react';
import { DocumentViewer } from '../../components/ui';

interface EvidenceImage {
  uri: string;
  headers?: Record<string, string>;
}

interface EntrevistaEvidenceViewersProps {
  controlPagosVisible: boolean;
  controlPagos: EvidenceImage | null;
  imagenDomicilio: (EvidenceImage & { titulo: string }) | null;
  folletoVisible: boolean;
  folleto: EvidenceImage | null;
  onCloseControlPagos: () => void;
  onCloseImagenDomicilio: () => void;
  onCloseFolleto: () => void;
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
  onCloseControlPagos,
  onCloseImagenDomicilio,
  onCloseFolleto,
}) => (
  <>
    <DocumentViewer
      visible={controlPagosVisible && Boolean(controlPagos)}
      title="Control de pagos"
      pages={page(controlPagos)}
      onClose={onCloseControlPagos}
      fullScreen
      moduleTheme="verification"
    />
    <DocumentViewer
      visible={Boolean(imagenDomicilio)}
      title={imagenDomicilio?.titulo ?? 'Imagen del domicilio'}
      pages={page(imagenDomicilio)}
      onClose={onCloseImagenDomicilio}
      fullScreen
      moduleTheme="verification"
    />
    <DocumentViewer
      visible={folletoVisible && Boolean(folleto)}
      title="Evidencia del folleto para tesorera"
      pages={page(folleto)}
      onClose={onCloseFolleto}
      fullScreen
      moduleTheme="verification"
    />
  </>
);
