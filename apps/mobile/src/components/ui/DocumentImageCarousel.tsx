import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
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
import { DocumentViewer } from './DocumentViewer';
import {
  getEvidenceClassificationFrameStyle,
  type ZoomableImageAction,
} from './ZoomableImage';

export interface DocumentImageCarouselPage {
  uri: string;
  label: string;
  headers?: Record<string, string>;
  leftAction?: ZoomableImageAction;
  frameColor?: string;
  frameLabel?: string;
  frameAccessibilityLabel?: string;
}

export const getDocumentImageCarouselPageAction = (
  page: DocumentImageCarouselPage,
  closeFullscreen: () => void,
): ZoomableImageAction | undefined => {
  const action = page.leftAction;
  if (!action) return undefined;

  return {
    ...action,
    onPress: () => {
      closeFullscreen();
      return action.onPress();
    },
  };
};

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
  const [previewWidth, setPreviewWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

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

  const activePage = pages[activeIndex];

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
                accessibilityLabel={[
                  `Ampliar ${title}, ${page.label}`,
                  page.frameAccessibilityLabel,
                ].filter(Boolean).join('. ')}
                accessibilityHint="Abre la imagen sin mostrar el fondo de la aplicación"
                onPress={() => openFullscreen(index)}
                style={({ pressed }) => [
                  styles.previewPage,
                  { width: previewWidth },
                  getEvidenceClassificationFrameStyle(page.frameColor),
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

      <DocumentViewer
        visible={fullscreenVisible}
        title={title}
        pages={pages.map((page) => ({
          uri: page.uri,
          headers: page.headers,
          mimeType: 'image/jpeg',
          label: page.label,
          leftAction: page.leftAction ? {
            ...page.leftAction,
            onPress: () => (
              getDocumentImageCarouselPageAction(page, closeFullscreen)?.onPress()
            ),
          } : undefined,
          frameColor: page.frameColor,
          frameLabel: page.frameLabel,
          frameAccessibilityLabel: [page.label, page.frameAccessibilityLabel]
            .filter(Boolean)
            .join('. '),
        }))}
        initialPageIndex={fullscreenIndex}
        onPageIndexChange={setFullscreenIndex}
        onClose={closeFullscreen}
        moduleTheme={moduleTheme}
      />
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewPage: {
    height: layout.documentPreviewHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
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
});
