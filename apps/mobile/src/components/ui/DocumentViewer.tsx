import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  ModuleThemeKey,
  radius,
  spacing,
  typography,
} from '../../theme/tokens';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { ZoomableImage } from './ZoomableImage';

interface DocumentViewerPage {
  uri: string;
  headers?: Record<string, string>;
  mimeType: string;
}

interface DocumentViewerProps {
  visible: boolean;
  title: string;
  pages: DocumentViewerPage[];
  onClose: () => void;
  fullScreen?: boolean;
  moduleTheme?: ModuleThemeKey;
  secondaryAction?: {
    title: string;
    accessibilityLabel?: string;
    disabled?: boolean;
    onPress: () => void | Promise<void>;
  };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  visible,
  title,
  pages,
  onClose,
  fullScreen = false,
  moduleTheme = 'documentation',
  secondaryAction,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex];
  const isImage = page?.mimeType.startsWith('image/');

  useEffect(() => {
    if (visible) setPageIndex(0);
  }, [title, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, fullScreen && styles.fullScreenOverlay]}>
        <View style={[styles.content, fullScreen && styles.fullScreenContent]}>
          <Text allowFontScaling={false} style={styles.title}>{title}</Text>
          {page && isImage ? (
            <Text allowFontScaling={false} style={styles.zoomHelp}>
              Pellizca o usa los controles para ampliar. Arrastra para recorrer la imagen.
            </Text>
          ) : null}
          <View style={[styles.preview, fullScreen && styles.fullScreenPreview]}>
            {page && isImage ? (
              <ZoomableImage
                key={page.uri}
                uri={page.uri}
                headers={page.headers}
                accessibilityLabel={`Vista ampliable de ${title}`}
                style={[styles.image, fullScreen && styles.fullScreenImage]}
              />
            ) : (
              <Text allowFontScaling={false} style={styles.message}>
                La vista previa de este formato no está disponible en la aplicación.
              </Text>
            )}
          </View>
          {pages.length > 1 ? (
            <View style={styles.navigation}>
              <SecondaryButton
                title="Anterior"
                onPress={() => setPageIndex((current) => Math.max(0, current - 1))}
                disabled={pageIndex === 0}
              />
              <Text allowFontScaling={false} style={styles.counter}>{pageIndex + 1} de {pages.length}</Text>
              <SecondaryButton
                title="Siguiente"
                onPress={() => setPageIndex((current) => Math.min(pages.length - 1, current + 1))}
                disabled={pageIndex === pages.length - 1}
              />
            </View>
          ) : null}
          <View style={styles.actions}>
            {secondaryAction ? (
              <SecondaryButton
                title={secondaryAction.title}
                accessibilityLabel={secondaryAction.accessibilityLabel}
                disabled={secondaryAction.disabled}
                moduleTheme={moduleTheme}
                onPress={secondaryAction.onPress}
              />
            ) : null}
            <PrimaryButton title="Cerrar" moduleTheme={moduleTheme} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  fullScreenOverlay: { padding: spacing.sm },
  content: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '92%' },
  fullScreenContent: { flex: 1, maxHeight: '100%', padding: spacing.md },
  title: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.md },
  zoomHelp: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  preview: { minHeight: 360, flexShrink: 1, justifyContent: 'center', backgroundColor: colors.gray[100], borderRadius: radius.md },
  fullScreenPreview: { flex: 1, minHeight: 0 },
  image: { width: '100%', height: '100%', minHeight: 360 },
  fullScreenImage: { minHeight: 0 },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  counter: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
