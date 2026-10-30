import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DocumentViewer } from '../../components/ui';
import { colors, radius, spacing } from '../../theme/tokens';
import type { DocumentoItem } from './verificacion-individual.types';

interface VerificacionDocumentoModalProps {
  visible: boolean;
  documento: DocumentoItem | null;
  consultando: boolean;
  ladoSeleccionado: 'frente' | 'reverso';
  titulo: string;
  preguntaValidacion: string;
  onLadoSeleccionadoChange: (lado: 'frente' | 'reverso') => void;
  onClose: () => void;
  onValidar: (respuesta: 'si' | 'no') => void;
}

export const VerificacionDocumentoModal: React.FC<VerificacionDocumentoModalProps> = ({
  visible,
  documento,
  consultando,
  ladoSeleccionado,
  titulo,
  preguntaValidacion,
  onLadoSeleccionadoChange,
  onClose,
  onValidar,
}) => {
  const pages = documento?.uriFrente ? [
    {
      uri: documento.uriFrente,
      headers: documento.headers,
      mimeType: 'image/jpeg',
      label: documento.uriReverso ? 'Frente' : undefined,
    },
    ...(documento.uriReverso ? [{
      uri: documento.uriReverso,
      headers: documento.headers,
      mimeType: 'image/jpeg',
      label: 'Reverso',
    }] : []),
  ] : [];

  const emptyMessage = documento?.ruta?.startsWith('mobile-temp:')
    ? 'El documento fue capturado por el asesor, pero la imagen no está disponible en este dispositivo.'
    : 'La imagen no se encuentra disponible en este dispositivo.';

  return (
    <DocumentViewer
      visible={visible}
      title={titulo}
      subtitle={documento?.nombre}
      pages={pages}
      initialPageIndex={ladoSeleccionado === 'reverso' ? 1 : 0}
      onPageIndexChange={(index) => onLadoSeleccionadoChange(index === 1 ? 'reverso' : 'frente')}
      onClose={onClose}
      moduleTheme="verification"
      emptyMessage={emptyMessage}
      footer={!consultando ? (
        <View style={styles.actions}>
          <Text allowFontScaling={false} style={styles.validationQuestion}>
            {preguntaValidacion}
          </Text>
          <View style={styles.validationButtons}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Validar documento: sí"
              style={styles.yesButton}
              onPress={() => onValidar('si')}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.yesButtonText}>✓ SÍ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Validar documento: no"
              style={styles.noButton}
              onPress={() => onValidar('no')}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.noButtonText}>✕ NO</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : undefined}
    />
  );
};

const styles = StyleSheet.create({
  actions: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.md,
  },
  validationQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validationButtons: { flexDirection: 'row', gap: spacing.md },
  yesButton: {
    flex: 1,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.success,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButtonText: { color: colors.success, fontSize: 18, fontWeight: '700' },
  noButton: {
    flex: 1,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noButtonText: { color: colors.error, fontSize: 18, fontWeight: '700' },
});
