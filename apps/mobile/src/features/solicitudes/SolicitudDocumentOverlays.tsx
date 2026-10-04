import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DocumentImageCarousel,
  DocumentViewer,
} from '../../components/ui';
import type { DocumentImageCarouselPage } from '../../components/ui';
import {
  colors,
  moduleThemes,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import type {
  DocumentoCarouselState,
  DocumentoViewerState,
} from './solicitud-documentos';

interface PreviewImageState {
  uris: string[];
  documentoId: string;
  titulo: string;
}

interface SolicitudDocumentOverlaysProps {
  viewingImage: { uri: string; titulo: string } | null;
  previewImage: PreviewImageState | null;
  previewCarouselPages: DocumentImageCarouselPage[];
  documentCarousel: DocumentoCarouselState | null;
  documentViewer: DocumentoViewerState | null;
  uploadingDocId: string | null;
  documentUploadError: string | null;
  onCloseViewingImage: () => void;
  onCancelPreview: () => void;
  onConfirmPreview: () => void;
  onCloseCarousel: () => void;
  onCloseViewer: () => void;
}

export const SolicitudDocumentOverlays: React.FC<SolicitudDocumentOverlaysProps> = ({
  viewingImage,
  previewImage,
  previewCarouselPages,
  documentCarousel,
  documentViewer,
  uploadingDocId,
  documentUploadError,
  onCloseViewingImage,
  onCancelPreview,
  onConfirmPreview,
  onCloseCarousel,
  onCloseViewer,
}) => (
  <>
    <Modal
      visible={viewingImage !== null}
      transparent
      animationType="fade"
      onRequestClose={onCloseViewingImage}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={styles.modalTitle}>{viewingImage?.titulo}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onCloseViewingImage}>
              <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {viewingImage?.uri ? (
            <Image source={{ uri: viewingImage.uri }} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </View>
      </View>
    </Modal>

    {previewImage ? (
      <View accessibilityViewIsModal style={styles.localModalLayer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{previewImage.titulo}</Text>
              <TouchableOpacity
                style={[styles.modalCloseButton, uploadingDocId !== null && styles.previewActionDisabled]}
                onPress={onCancelPreview}
                disabled={uploadingDocId !== null}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {previewImage.documentoId === 'comprobante_linea_credito' ? (
              <View style={styles.previewCarouselContent}>
                <DocumentImageCarousel
                  title={previewImage.titulo}
                  pages={previewCarouselPages}
                  moduleTheme="documentation"
                  helperText="Desliza para revisar las fotografías. Toca una imagen para ampliarla y hacer zoom."
                />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.previewScrollContent}>
                {previewImage.uris.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.previewImageContainer}>
                    <Text allowFontScaling={false} style={styles.previewLabel}>
                      {previewImage.uris.length === 2 && previewImage.documentoId.includes('ine')
                        ? index === 0 ? 'Frente' : 'Reverso'
                        : `Imagen ${index + 1} de ${previewImage.uris.length}`}
                    </Text>
                    <Image source={{ uri }} style={styles.previewImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
            )}

            {documentUploadError ? (
              <Text allowFontScaling={false} style={styles.previewErrorText}>{documentUploadError}</Text>
            ) : null}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewCancelButton, uploadingDocId !== null && styles.previewActionDisabled]}
                onPress={onCancelPreview}
                activeOpacity={0.8}
                disabled={uploadingDocId !== null}
              >
                <Text allowFontScaling={false} style={styles.previewCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewSaveButton, uploadingDocId !== null && styles.previewActionDisabled]}
                onPress={onConfirmPreview}
                activeOpacity={0.8}
                disabled={uploadingDocId !== null}
              >
                {uploadingDocId !== null ? (
                  <View style={styles.previewSavingContent}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text allowFontScaling={false} style={styles.previewSaveButtonText}>Guardando...</Text>
                  </View>
                ) : (
                  <Text allowFontScaling={false} style={styles.previewSaveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    ) : null}

    {documentCarousel ? (
      <View accessibilityViewIsModal style={styles.localModalLayer}>
        <View style={styles.modalOverlay}>
          <View style={styles.carouselModalContainer}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{documentCarousel.title}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Cerrar comprobante"
                style={styles.modalCloseButton}
                onPress={onCloseCarousel}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.savedCarouselContent}>
              <DocumentImageCarousel
                title={documentCarousel.title}
                pages={documentCarousel.pages}
                moduleTheme="documentation"
                helperText="Desliza para revisar las fotografías. Toca una imagen para verla completa y hacer zoom."
              />
            </View>
          </View>
        </View>
      </View>
    ) : null}

    <DocumentViewer
      visible={Boolean(documentViewer)}
      title={documentViewer?.title || ''}
      pages={documentViewer?.pages || []}
      onClose={onCloseViewer}
    />
  </>
);

const styles = StyleSheet.create({
  localModalLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    elevation: 100,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.documentOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  carouselModalContainer: {
    width: '95%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  modalImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewCarouselContent: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  savedCarouselContent: {
    padding: spacing.md,
  },
  previewScrollContent: {
    padding: spacing.md,
  },
  previewImageContainer: {
    marginBottom: spacing.lg,
  },
  previewLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray[100],
    borderRadius: radius.sm,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewErrorText: {
    ...typography.body,
    color: colors.error,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  previewCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: moduleThemes.documentation.headerBg,
    borderRadius: radius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCancelButtonText: {
    color: moduleThemes.documentation.headerBg,
    fontSize: 16,
    fontWeight: '600',
  },
  previewSaveButton: {
    flex: 1,
    backgroundColor: moduleThemes.documentation.headerBg,
    borderRadius: radius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  previewActionDisabled: {
    opacity: 0.55,
  },
  previewSavingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
