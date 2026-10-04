import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  colors,
  layout,
  moduleThemes,
  ModuleThemeKey,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import { ZoomableImage } from './ZoomableImage';

export interface DocumentImageCarouselPage {
  uri: string;
  label: string;
  headers?: Record<string, string>;
}

interface DocumentImageCarouselProps {
  title: string;
  pages: readonly DocumentImageCarouselPage[];
  moduleTheme?: ModuleThemeKey;
  helperText?: string;
}

const getPageIndex = (offsetX: number, pageWidth: number, pageCount: number): number => {
  if (pageWidth <= 0 || pageCount === 0) return 0;
  return Math.min(pageCount - 1, Math.max(0, Math.round(offsetX / pageWidth)));
};

export const DocumentImageCarousel: React.FC<DocumentImageCarouselProps> = ({
  title,
  pages,
  moduleTheme = 'general',
  helperText,
}) => {
  const theme = moduleThemes[moduleTheme];
  const previewScrollRef = useRef<FlatList<DocumentImageCarouselPage>>(null);
  const fullscreenScrollRef = useRef<FlatList<DocumentImageCarouselPage>>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    setActiveIndex(0);
    setFullscreenIndex(0);
    previewScrollRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [pages]);

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
    setActiveIndex(fullscreenIndex);
    previewScrollRef.current?.scrollToOffset({
      offset: fullscreenIndex * previewWidth,
      animated: false,
    });
  };

  const handlePreviewScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(getPageIndex(event.nativeEvent.contentOffset.x, previewWidth, pages.length));
  };

  const handleFullscreenScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setFullscreenIndex(getPageIndex(event.nativeEvent.contentOffset.x, windowWidth, pages.length));
  };

  const activePage = pages[activeIndex];
  const activeFullscreenPage = pages[fullscreenIndex];

  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.helper}>
        {helperText ?? (pages.length > 1
          ? 'Desliza hacia un lado para ver las imágenes. Toca una imagen para ampliarla.'
          : 'Toca la imagen para ampliarla.')}
      </Text>

      <View
        style={styles.preview}
        onLayout={(event) => setPreviewWidth(event.nativeEvent.layout.width)}
      >
        {previewWidth > 0 ? (
          <FlatList
            ref={previewScrollRef}
            data={pages}
            horizontal
            pagingEnabled
            directionalLockEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            getItemLayout={(_, index) => ({
              length: previewWidth,
              offset: previewWidth * index,
              index,
            })}
            keyExtractor={(page, index) => `${page.label}-${page.uri}-${index}`}
            onMomentumScrollEnd={handlePreviewScrollEnd}
            renderItem={({ item: page, index }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ampliar ${title}, ${page.label}`}
                accessibilityHint="Abre la imagen sin mostrar el fondo de la aplicación"
                onPress={() => openFullscreen(index)}
                style={({ pressed }) => [
                  styles.previewPage,
                  { width: previewWidth },
                  pressed && styles.previewPagePressed,
                ]}
              >
                <Image
                  source={{ uri: page.uri, headers: page.headers }}
                  resizeMode="contain"
                  style={styles.previewImage}
                />
                <View style={styles.pageLabel}>
                  <Text allowFontScaling={false} style={styles.pageLabelText}>
                    {page.label}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        ) : null}
      </View>

      <View
        accessible
        accessibilityLabel={`${activePage?.label ?? ''}. Imagen ${activeIndex + 1} de ${pages.length}`}
        style={styles.pageIndicator}
      >
        {pages.length <= 8 && pages.map((page, index) => (
            <View
              key={`indicator-${page.label}-${index}`}
              style={[
                styles.pageIndicatorDot,
                index === activeIndex && [
                  styles.pageIndicatorDotActive,
                  { backgroundColor: theme.primary },
                ],
              ]}
            />
          ))}
        <Text allowFontScaling={false} style={styles.counter}>
          {activeIndex + 1} de {pages.length}
        </Text>
      </View>

      <Modal
        visible={fullscreenVisible}
        transparent={false}
        presentationStyle="fullScreen"
        statusBarTranslucent
        animationType="fade"
        onRequestClose={closeFullscreen}
        onShow={() => {
          requestAnimationFrame(() => {
            fullscreenScrollRef.current?.scrollToOffset({
              offset: fullscreenIndex * windowWidth,
              animated: false,
            });
          });
        }}
      >
        <StatusBar hidden />
        <SafeAreaView style={styles.fullscreen}>
          <View style={styles.fullscreenHeader}>
            <View style={styles.fullscreenTitleContainer}>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.fullscreenTitle}>
                {title}
              </Text>
              <Text allowFontScaling={false} style={styles.fullscreenSubtitle}>
                {activeFullscreenPage?.label} · {fullscreenIndex + 1} de {pages.length}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar imagen ampliada"
              hitSlop={spacing.sm}
              onPress={closeFullscreen}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Text allowFontScaling={false} style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            ref={fullscreenScrollRef}
            data={pages}
            horizontal
            pagingEnabled
            directionalLockEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            getItemLayout={(_, index) => ({
              length: windowWidth,
              offset: windowWidth * index,
              index,
            })}
            keyExtractor={(page, index) => `fullscreen-${page.label}-${page.uri}-${index}`}
            onMomentumScrollEnd={handleFullscreenScrollEnd}
            style={styles.fullscreenCarousel}
            renderItem={({ item: page }) => (
              <View
                style={[styles.fullscreenPage, { width: windowWidth }]}
              >
                <ZoomableImage
                  uri={page.uri}
                  headers={page.headers}
                  accessibilityLabel={`${title}, ${page.label}, imagen ampliada`}
                  style={styles.fullscreenImage}
                />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  helper: {
    ...typography.body,
    color: colors.textSecondary,
  },
  preview: {
    height: layout.documentPreviewHeight,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPage: {
    height: layout.documentPreviewHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  previewPagePressed: {
    opacity: 0.84,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pageLabel: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.overlay,
  },
  pageLabelText: {
    ...typography.captionStrong,
    color: colors.white,
  },
  pageIndicator: {
    minHeight: touchTargets.minimum,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pageIndicatorDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gray[300],
  },
  pageIndicatorDotActive: {
    width: spacing.xxl,
  },
  counter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  fullscreenHeader: {
    minHeight: touchTargets.largeAction,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.gray[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  fullscreenTitleContainer: {
    flex: 1,
  },
  fullscreenTitle: {
    ...typography.sectionTitle,
    color: colors.white,
  },
  fullscreenSubtitle: {
    ...typography.caption,
    color: colors.gray[300],
    marginTop: spacing.xs,
  },
  closeButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[700],
  },
  closeButtonPressed: {
    backgroundColor: colors.gray[600],
  },
  closeButtonText: {
    ...typography.contextTitle,
    color: colors.white,
  },
  fullscreenCarousel: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  fullscreenPage: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  fullscreenImage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.gray[900],
  },
});
