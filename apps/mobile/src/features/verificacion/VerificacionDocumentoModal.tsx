import React, { useRef } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ZoomableImage } from '../../components/ui';
import { colors, moduleThemes, radius, spacing } from '../../theme/tokens';
import type { DocumentoItem } from './verificacion-individual.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const pagesRef = useRef<ScrollView>(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text allowFontScaling={false} style={styles.subtitle}>{documento?.nombre}</Text>
              <Text allowFontScaling={false} style={styles.title}>{titulo}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar documento"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text allowFontScaling={false} style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {documento?.uriFrente ? (
            documento.uriReverso ? (
              <View style={styles.swipeableContainer}>
                <Text allowFontScaling={false} style={styles.swipeInstructionText}>
                  Pellizca o usa +/− para ampliar. Desliza para ver frente y reverso.
                </Text>
                <ScrollView
                  ref={pagesRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    onLadoSeleccionadoChange(offsetX > SCREEN_WIDTH / 2 ? 'reverso' : 'frente');
                  }}
                  style={styles.imageScrollView}
                >
                  <View style={styles.imagePageContainer}>
                    <ZoomableImage
                      uri={documento.uriFrente}
                      headers={documento.headers}
                      accessibilityLabel={`${documento.nombre}, frente`}
                      style={styles.fullScreenImage}
                    />
                    <Text allowFontScaling={false} style={styles.imageLabelOverlay}>Frente</Text>
                  </View>
                  <View style={styles.imagePageContainer}>
                    <ZoomableImage
                      uri={documento.uriReverso}
                      headers={documento.headers}
                      accessibilityLabel={`${documento.nombre}, reverso`}
                      style={styles.fullScreenImage}
                    />
                    <Text allowFontScaling={false} style={styles.imageLabelOverlay}>Reverso</Text>
                  </View>
                </ScrollView>
                <View style={styles.pageIndicator}>
                  <View style={[
                    styles.pageIndicatorDot,
                    ladoSeleccionado === 'frente' && styles.pageIndicatorDotActive,
                  ]} />
                  <View style={[
                    styles.pageIndicatorDot,
                    ladoSeleccionado === 'reverso' && styles.pageIndicatorDotActive,
                  ]} />
                </View>
              </View>
            ) : (
              <View style={styles.swipeableContainer}>
                <Text allowFontScaling={false} style={styles.swipeInstructionText}>
                  Pellizca o usa +/− para ampliar. Arrastra para recorrer la imagen.
                </Text>
                <ZoomableImage
                  uri={documento.uriFrente}
                  headers={documento.headers}
                  accessibilityLabel={documento.nombre}
                  style={styles.zoomableDocumentImage}
                />
              </View>
            )
          ) : documento?.ruta?.startsWith('mobile-temp:') ? (
            <ScrollView style={styles.imageContainer} contentContainerStyle={styles.imageContent}>
              <View style={styles.placeholderContainer}>
                <Text allowFontScaling={false} style={styles.placeholderIcon}>{documento.icono}</Text>
                <Text allowFontScaling={false} style={styles.placeholderTitle}>Documento capturado</Text>
                <Text allowFontScaling={false} style={styles.placeholderText}>{documento.nombre}</Text>
                <View style={styles.placeholderInfoBox}>
                  <Text allowFontScaling={false} style={styles.placeholderInfoIcon}>💡</Text>
                  <Text allowFontScaling={false} style={styles.placeholderInfoText}>
                    El documento fue capturado por el asesor.{'\n'}
                    La imagen no está disponible en este dispositivo.
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.imageContainer} contentContainerStyle={styles.imageContent}>
              <View style={styles.placeholderContainer}>
                <Text allowFontScaling={false} style={styles.placeholderIcon}>⚠️</Text>
                <Text allowFontScaling={false} style={styles.placeholderTitle}>Documento no disponible</Text>
                <Text allowFontScaling={false} style={styles.placeholderText}>
                  La imagen no se encuentra en este dispositivo
                </Text>
              </View>
            </ScrollView>
          )}

          {!consultando ? (
            <View style={styles.actions}>
              <Text allowFontScaling={false} style={styles.validationQuestion}>
                {preguntaValidacion}
              </Text>
              <View style={styles.validationButtons}>
                <TouchableOpacity
                  style={styles.yesButton}
                  onPress={() => onValidar('si')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.yesButtonText}>✓ SÍ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.noButton}
                  onPress={() => onValidar('no')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.noButtonText}>✗ NO</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '95%',
    height: '90%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: moduleThemes.verification.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.verification.titleBarBg,
  },
  titleContainer: { flex: 1, gap: 4 },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.white, lineHeight: 20 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 24, fontWeight: '700', color: colors.white },
  imageContainer: { flex: 1, backgroundColor: colors.gray[100] },
  imageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  zoomableDocumentImage: { flex: 1, width: '100%' },
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
    paddingVertical: 16,
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
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noButtonText: { color: colors.error, fontSize: 18, fontWeight: '700' },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderIcon: { fontSize: 80, marginBottom: spacing.lg },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  placeholderInfoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
    maxWidth: 320,
  },
  placeholderInfoIcon: { fontSize: 20 },
  placeholderInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
  },
  swipeableContainer: { flex: 1 },
  swipeInstructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  imageScrollView: { flex: 1 },
  imagePageContainer: {
    width: SCREEN_WIDTH * 0.95,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: { width: '100%', height: '100%' },
  imageLabelOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  pageIndicatorDotActive: { width: 24, backgroundColor: moduleThemes.verification.headerBg },
});
