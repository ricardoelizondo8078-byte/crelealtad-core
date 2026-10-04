import { useCallback, useState } from 'react';
import type { DocumentoItem } from './verificacion-individual.types';

export const useDocumentoRevisionModal = () => {
  const [documentoViewing, setDocumentoViewing] = useState<DocumentoItem | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [ladoSeleccionado, setLadoSeleccionado] = useState<'frente' | 'reverso'>('frente');

  const abrirDocumento = useCallback((documento: DocumentoItem) => {
    setDocumentoViewing(documento);
    setLadoSeleccionado('frente');
    setShowDocumentModal(true);
  }, []);

  const cerrarDocumento = useCallback(() => {
    setShowDocumentModal(false);
  }, []);

  return {
    documentoViewing,
    showDocumentModal,
    ladoSeleccionado,
    setLadoSeleccionado,
    abrirDocumento,
    cerrarDocumento,
  };
};
