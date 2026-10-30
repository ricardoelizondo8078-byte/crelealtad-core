import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  moduleThemes,
  ModuleThemeKey,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import { SecondaryButton } from './SecondaryButton';
import { EvidenceReviewChoice, type EvidenceReviewValue } from './EvidenceReviewChoice';
import { ZoomableImage, type ZoomableImageAction } from './ZoomableImage';

export interface DocumentViewerPage {
  uri: string;
  headers?: Record<string, string>;
  mimeType: string;
  label?: string;
  leftAction?: ZoomableImageAction;
  frameColor?: string;
  frameLabel?: string;
  frameAccessibilityLabel?: string;
  reviewValue?: EvidenceReviewValue;
  reviewDisabled?: boolean;
  onReviewChange?: (value: Exclude<EvidenceReviewValue, null>) => void;
}

export const getDocumentViewerPageIndex = (
  offsetX: number,
  pageWidth: number,
  pageCount: number,
): number => {
  if (pageWidth <= 0 || pageCount === 0) return 0;
  return Math.min(pageCount - 1, Math.max(0, Math.round(offsetX / pageWidth)));
};

export const isDocumentViewerPagingEnabled = (pagingLocked: boolean): boolean => !pagingLocked;

interface DocumentViewerProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  pages: readonly DocumentViewerPage[];
  onClose: () => void;
  moduleTheme?: ModuleThemeKey;
  initialPageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  closeButtonDisabled?: boolean;
  showReviewChoice?: boolean;
  secondaryAction?: {
    title: string;
    accessibilityLabel?: string;
    disabled?: boolean;
    onPress: () => void | Promise<void>;
  };
  emptyMessage?: string;
  footer?: React.ReactNode;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  visible,
  title,
  subtitle,
  pages,
  onClose,
  moduleTheme = 'documentation',
  initialPageIndex = 0,
  onPageIndexChange,
  closeButtonDisabled = false,
  showReviewChoice = false,
  secondaryAction,
  emptyMessage,
  footer,
}) => {
  const pagerRef = useRef<FlatList<DocumentViewerPage>>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [pagingLocked, setPagingLocked] = useState(false);
  const page = pages[pageIndex];
  const isImage = page?.mimeType.startsWith('image/');
  const theme = moduleThemes[moduleTheme];

  useEffect(() => {
    setPagingLocked(false);
    if (!visible) return;
    const nextPageIndex = Math.min(
      Math.max(0, initialPageIndex),
      Math.max(0, pages.length - 1),
    );
    setPageIndex(nextPageIndex);
    onPageIndexChange?.(nextPageIndex);
    if (previewWidth > 0) {
      requestAnimationFrame(() => {
        pagerRef.current?.scrollToOffset({
          offset: nextPageIndex * previewWidth,
          animated: false,
        });
      });
    }
  }, [initialPageIndex, onPageIndexChange, pages.length, previewWidth, title, visible]);

  const showPage = (nextPageIndex: number) => {
    const normalizedPageIndex = Math.min(
      Math.max(0, nextPageIndex),
      Math.max(0, pages.length - 1),
    );
    setPagingLocked(false);
    setPageIndex(normalizedPageIndex);
    onPageIndexChange?.(normalizedPageIndex);
  };

  const handlePageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    showPage(getDocumentViewerPageIndex(
      event.nativeEvent.contentOffset.x,
      previewWidth,
      pages.length,
    ));
  };

  const handlePagingLockChange = (locked: boolean) => {
    setPagingLocked(locked);
    if (locked && previewWidth > 0) {
      requestAnimationFrame(() => {
        pagerRef.current?.scrollToOffset({
          offset: pageIndex * previewWidth,
          animated: false,
        });
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="fade"
      onRequestClose={closeButtonDisabled ? () => undefined : onClose}
    >
      <SafeAreaView
        testID="document-viewer-overlay"
        style={styles.overlay}
      >
        <View testID="document-viewer-content" style={styles.content}>
          <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.titleBarBg }]}>
            <View style={styles.headerText}>
              {subtitle ? (
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.subtitle, { color: theme.headerText }]}>
                  {subtitle}
                </Text>
              ) : null}
              <Text allowFontScaling={false} numberOfLines={2} style={[styles.title, { color: theme.headerText }]}>
                {title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar imagen ampliada"
              accessibilityState={{ disabled: closeButtonDisabled }}
              disabled={closeButtonDisabled}
              hitSlop={spacing.sm}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
                closeButtonDisabled && styles.closeButtonDisabled,
              ]}
            >
              <Text allowFontScaling={false} style={[styles.closeText, { color: theme.headerText }]}>✕</Text>
            </Pressable>
          </View>
          {page && isImage ? (
            <Text
              allowFontScaling={false}
              style={[
                styles.zoomHelp,
                { backgroundColor: theme.headerAccent, borderBottomColor: theme.titleBarBg },
              ]}
            >
              {pages.length > 1
                ? 'Pellizca o usa +/− para ampliar. Desliza para cambiar de foto.'
                : 'Pellizca o usa +/− para ampliar. Arrastra para recorrer la imagen.'}
            </Text>
          ) : null}
          <View
            testID="document-viewer-preview"
            style={styles.preview}
            onLayout={(event) => setPreviewWidth(event.nativeEvent.layout.width)}
          >
            {pages.length === 0 ? (
              <Text allowFontScaling={false} style={styles.message}>
                {emptyMessage ?? 'El documento no está disponible en este dispositivo.'}
              </Text>
            ) : previewWidth > 0 ? (
              <FlatList
                ref={pagerRef}
                testID="document-viewer-pager"
                data={pages}
                style={styles.pager}
                horizontal
                pagingEnabled
                scrollEnabled={isDocumentViewerPagingEnabled(pagingLocked)}
                directionalLockEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={pageIndex}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                getItemLayout={(_, index) => ({
                  length: previewWidth,
                  offset: previewWidth * index,
                  index,
                })}
                keyExtractor={(viewerPage, index) => `${viewerPage.uri}-${index}`}
                onMomentumScrollEnd={handlePageScrollEnd}
                renderItem={({ item: viewerPage }) => {
                  const viewerPageIsImage = viewerPage.mimeType.startsWith('image/');
                  return (
                    <View style={[styles.page, { width: previewWidth }]}>
                      {viewerPageIsImage ? (
                        <ZoomableImage
                          uri={viewerPage.uri}
                          headers={viewerPage.headers}
                          accessibilityLabel={[
                            `Vista ampliable de ${title}`,
                            viewerPage.frameAccessibilityLabel,
                          ].filter(Boolean).join('. ')}
                          leftAction={viewerPage.leftAction}
                          frameColor={viewerPage.frameColor}
                          frameLabel={viewerPage.frameLabel}
                          onPagingLockChange={handlePagingLockChange}
                          style={styles.image}
                        />
                      ) : (
                        <Text allowFontScaling={false} style={styles.message}>
                          La vista previa de este formato no está disponible en la aplicación.
                        </Text>
                      )}
                      {viewerPage.label ? (
                        <Text allowFontScaling={false} style={styles.pageLabel}>
                          {viewerPage.label}
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
              />
            ) : null}
          </View>
          {pages.length > 1 ? (
            <View
              accessible
              accessibilityLabel={`Foto ${pageIndex + 1} de ${pages.length}. Desliza a los lados para cambiar de foto.`}
              style={styles.pageStatus}
            >
              {pages.map((viewerPage, index) => (
                <View
                  key={`${viewerPage.uri}-indicator-${index}`}
                  style={[
                    styles.pageIndicatorDot,
                    index === pageIndex && [styles.pageIndicatorDotActive, { backgroundColor: theme.primary }],
                  ]}
                />
              ))}
            </View>
          ) : null}
          {showReviewChoice || secondaryAction ? (
            <View testID="document-viewer-actions" style={styles.actions}>
              {showReviewChoice && page?.onReviewChange ? (
                <EvidenceReviewChoice
                  value={page.reviewValue ?? null}
                  disabled={page.reviewDisabled}
                  onChange={page.onReviewChange}
                />
              ) : null}
              {secondaryAction ? (
                <SecondaryButton
                  title={secondaryAction.title}
                  accessibilityLabel={secondaryAction.accessibilityLabel}
                  disabled={secondaryAction.disabled}
                  moduleTheme={moduleTheme}
                  onPress={secondaryAction.onPress}
                />
              ) : null}
            </View>
          ) : null}
          {footer}
        </View>
      </SafeAreaView>
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
    minHeight: touchTargets.largeAction,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 2,
  },
  headerText: { flex: 1, gap: spacing.xs },
  subtitle: { ...typography.captionStrong, opacity: 0.76, textTransform: 'uppercase' },
  title: { ...typography.sectionTitle },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: { backgroundColor: 'rgba(255, 255, 255, 0.32)' },
  closeButtonDisabled: { opacity: 0.45 },
  closeText: { fontSize: 24, fontWeight: '700' },
  zoomHelp: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  preview: { flex: 1, minHeight: 0, justifyContent: 'center', backgroundColor: colors.white },
  pager: { flex: 1 },
  page: { height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  image: { width: '100%', height: '100%', minHeight: 0 },
  pageLabel: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    ...typography.captionStrong,
    color: colors.white,
  },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  pageStatus: {
    minHeight: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pageIndicatorDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gray[300],
  },
  pageIndicatorDotActive: { width: spacing.xxl },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    minHeight: touchTargets.largeAction,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
