import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors,
  layout,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme/tokens';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const IMAGE_CONTROL_HEIGHT = 56;

interface TouchPoint {
  pageX: number;
  pageY: number;
}

export interface ZoomableImageAction {
  title: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
}

export const getEvidenceClassificationFrameStyle = (
  frameColor?: string,
): ViewStyle => ({
  backgroundColor: colors.white,
  borderBottomColor: frameColor ?? colors.white,
  borderBottomWidth: layout.evidenceControlsBandHeight,
  borderTopColor: frameColor ?? colors.white,
  borderTopWidth: layout.evidenceClassificationBandHeight,
});

export const getEvidenceClassificationControlsStyle = (
  _frameColor?: string,
): ViewStyle => ({
  bottom: -layout.evidenceControlsBandHeight + spacing.sm,
});

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  leftAction?: ZoomableImageAction;
  frameColor?: string;
  frameLabel?: string;
  onPagingLockChange?: (locked: boolean) => void;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

const getTouchDistance = (touches: readonly TouchPoint[]): number => {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[1].pageX - touches[0].pageX,
    touches[1].pageY - touches[0].pageY,
  );
};

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  uri,
  headers,
  style,
  accessibilityLabel,
  leftAction,
  frameColor,
  frameLabel,
  onPagingLockChange,
}) => {
  const scale = useRef(new Animated.Value(MIN_ZOOM)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const transformRef = useRef({ scale: MIN_ZOOM, x: 0, y: 0 });
  const layoutRef = useRef({ width: 0, height: 0 });
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastPanPointRef = useRef<TouchPoint | null>(null);
  const pagingLockedRef = useRef(false);
  const onPagingLockChangeRef = useRef(onPagingLockChange);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);

  useEffect(() => {
    onPagingLockChangeRef.current = onPagingLockChange;
  }, [onPagingLockChange]);

  const setPagingLocked = (locked: boolean, notifyWhenUnchanged = false) => {
    const changed = pagingLockedRef.current !== locked;
    pagingLockedRef.current = locked;
    if (changed || notifyWhenUnchanged) onPagingLockChangeRef.current?.(locked);
  };

  const getConstrainedTranslation = (nextScale: number, x: number, y: number) => {
    const maxX = layoutRef.current.width * (nextScale - MIN_ZOOM) / 2;
    const maxY = layoutRef.current.height * (nextScale - MIN_ZOOM) / 2;
    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY),
    };
  };

  const setTransformImmediately = (nextScale: number, x: number, y: number) => {
    const constrained = getConstrainedTranslation(nextScale, x, y);
    transformRef.current = { scale: nextScale, ...constrained };
    scale.setValue(nextScale);
    translateX.setValue(constrained.x);
    translateY.setValue(constrained.y);
  };

  const animateTransform = (nextScale: number, x: number, y: number) => {
    const constrained = getConstrainedTranslation(nextScale, x, y);
    transformRef.current = { scale: nextScale, ...constrained };
    setZoomLevel(nextScale);
    Animated.parallel([
      Animated.spring(scale, { toValue: nextScale, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: constrained.x, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: constrained.y, useNativeDriver: true }),
    ]).start();
  };

  const resetZoom = () => {
    setPagingLocked(false);
    animateTransform(MIN_ZOOM, 0, 0);
  };

  useEffect(() => {
    transformRef.current = { scale: MIN_ZOOM, x: 0, y: 0 };
    scale.setValue(MIN_ZOOM);
    translateX.setValue(0);
    translateY.setValue(0);
    setZoomLevel(MIN_ZOOM);
    setPagingLocked(false);
  }, [scale, translateX, translateY, uri]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: (event) => (
      (event?.nativeEvent?.touches?.length ?? 0) >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onMoveShouldSetPanResponderCapture: (event) => (
      (event?.nativeEvent?.touches?.length ?? 0) >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onStartShouldSetPanResponder: (event) => (
      (event?.nativeEvent?.touches?.length ?? 0) >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onMoveShouldSetPanResponder: (event, gestureState) => (
      (event?.nativeEvent?.touches?.length ?? 0) >= 2
      || (
        transformRef.current.scale > MIN_ZOOM
        && Math.abs(gestureState?.dx ?? 0) + Math.abs(gestureState?.dy ?? 0) > 2
      )
    ),
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2) {
        setPagingLocked(true);
        pinchStartRef.current = {
          distance: getTouchDistance(touches),
          scale: transformRef.current.scale,
        };
        lastPanPointRef.current = null;
      } else {
        lastPanPointRef.current = touches[0] || null;
      }
    },
    onPanResponderMove: (event) => {
      const touches = event.nativeEvent.touches;

      if (touches.length >= 2) {
        setPagingLocked(true);
        const distance = getTouchDistance(touches);
        if (!pinchStartRef.current) {
          pinchStartRef.current = {
            distance,
            scale: transformRef.current.scale,
          };
          return;
        }

        const startDistance = pinchStartRef.current.distance;
        if (startDistance <= 0) return;
        const nextScale = clamp(
          pinchStartRef.current.scale * distance / startDistance,
          MIN_ZOOM,
          MAX_ZOOM,
        );
        setTransformImmediately(nextScale, transformRef.current.x, transformRef.current.y);
        lastPanPointRef.current = null;
        return;
      }

      pinchStartRef.current = null;
      const touch = touches[0];
      if (!touch || transformRef.current.scale <= MIN_ZOOM) return;
      if (!lastPanPointRef.current) {
        lastPanPointRef.current = touch;
        return;
      }

      setTransformImmediately(
        transformRef.current.scale,
        transformRef.current.x + touch.pageX - lastPanPointRef.current.pageX,
        transformRef.current.y + touch.pageY - lastPanPointRef.current.pageY,
      );
      lastPanPointRef.current = touch;
    },
    onPanResponderRelease: () => {
      pinchStartRef.current = null;
      lastPanPointRef.current = null;
      if (transformRef.current.scale <= MIN_ZOOM + 0.02) {
        resetZoom();
      } else {
        setPagingLocked(true);
        setZoomLevel(transformRef.current.scale);
      }
    },
    onPanResponderTerminate: () => {
      pinchStartRef.current = null;
      lastPanPointRef.current = null;
      setPagingLocked(transformRef.current.scale > MIN_ZOOM + 0.02);
      setZoomLevel(transformRef.current.scale);
    },
    onPanResponderTerminationRequest: () => false,
  })).current;

  const changeZoom = (delta: number) => {
    const nextScale = clamp(transformRef.current.scale + delta, MIN_ZOOM, MAX_ZOOM);
    if (nextScale === MIN_ZOOM) {
      resetZoom();
      return;
    }
    setPagingLocked(true);
    animateTransform(nextScale, transformRef.current.x, transformRef.current.y);
  };

  return (
    <View
      style={[
        styles.container,
        style,
        getEvidenceClassificationFrameStyle(frameColor),
      ]}
      onLayout={(event) => {
        layoutRef.current = event.nativeEvent.layout;
        setTransformImmediately(
          transformRef.current.scale,
          transformRef.current.x,
          transformRef.current.y,
        );
      }}
    >
      <View
        testID="zoomable-image-gesture-surface"
        style={styles.gestureSurface}
        onTouchStart={(event) => {
          if (
            event.nativeEvent.touches.length >= 2
            || transformRef.current.scale > MIN_ZOOM + 0.02
          ) {
            setPagingLocked(true, true);
          }
        }}
        onTouchMove={(event) => {
          if (event.nativeEvent.touches.length >= 2) setPagingLocked(true);
        }}
        onTouchEnd={(event) => {
          if (
            event.nativeEvent.touches.length === 0
            && transformRef.current.scale <= MIN_ZOOM + 0.02
          ) {
            setPagingLocked(false);
          }
        }}
        {...panResponder.panHandlers}
      >
        <Animated.Image
          source={{ uri, headers }}
          resizeMode="contain"
          accessible
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.image,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
        />
      </View>

      {frameColor && frameLabel ? (
        <View
          pointerEvents="none"
          style={styles.frameLabelContainer}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={styles.frameLabelText}
          >
            {frameLabel}
          </Text>
        </View>
      ) : null}

      {leftAction ? (
        <Pressable
          testID="zoomable-image-left-action"
          accessibilityRole="button"
          accessibilityLabel={leftAction.accessibilityLabel ?? leftAction.title}
          accessibilityState={{ disabled: leftAction.disabled }}
          disabled={leftAction.disabled}
          hitSlop={spacing.sm}
          onPress={leftAction.onPress}
          style={({ pressed }) => [
            styles.leftAction,
            getEvidenceClassificationControlsStyle(frameColor),
            leftAction.disabled && styles.controlButtonDisabled,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text allowFontScaling={false} style={styles.leftActionText}>
            {leftAction.title}
          </Text>
        </Pressable>
      ) : null}

      <View testID="zoomable-image-controls" style={[
        styles.controls,
        getEvidenceClassificationControlsStyle(frameColor),
      ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Alejar imagen"
          disabled={zoomLevel <= MIN_ZOOM}
          hitSlop={spacing.sm}
          onPress={() => changeZoom(-ZOOM_STEP)}
          style={({ pressed }) => [
            styles.controlButton,
            zoomLevel <= MIN_ZOOM && styles.controlButtonDisabled,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text allowFontScaling={false} style={styles.controlText}>−</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restablecer zoom al cien por ciento"
          hitSlop={spacing.sm}
          onPress={resetZoom}
          style={({ pressed }) => [styles.levelButton, pressed && styles.controlButtonPressed]}
        >
          <Text allowFontScaling={false} style={styles.levelText}>
            {Math.round(zoomLevel * 100)}%
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acercar imagen"
          disabled={zoomLevel >= MAX_ZOOM}
          hitSlop={spacing.sm}
          onPress={() => changeZoom(ZOOM_STEP)}
          style={({ pressed }) => [
            styles.controlButton,
            zoomLevel >= MAX_ZOOM && styles.controlButtonDisabled,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <Text allowFontScaling={false} style={styles.controlText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  gestureSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  frameLabelContainer: {
    position: 'absolute',
    top: -layout.evidenceClassificationBandHeight,
    right: spacing.lg,
    left: spacing.lg,
    height: layout.evidenceClassificationBandHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameLabelText: {
    ...typography.contextTitle,
    color: colors.gray[900],
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    height: IMAGE_CONTROL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[500],
    ...shadows.stickyHeader,
  },
  leftAction: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    height: IMAGE_CONTROL_HEIGHT,
    maxWidth: '44%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[500],
    ...shadows.stickyHeader,
  },
  leftActionText: {
    ...typography.captionStrong,
    color: colors.gray[900],
    textAlign: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  levelButton: {
    minWidth: 58,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  controlButtonDisabled: {
    opacity: 0.35,
  },
  controlButtonPressed: {
    backgroundColor: colors.gray[200],
  },
  controlText: {
    ...typography.contextTitle,
    color: colors.gray[900],
  },
  levelText: {
    ...typography.caption,
    color: colors.gray[900],
  },
});
