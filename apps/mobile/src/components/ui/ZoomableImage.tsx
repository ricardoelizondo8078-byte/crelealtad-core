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
import { colors, radius, spacing, typography } from '../../theme/tokens';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

interface TouchPoint {
  pageX: number;
  pageY: number;
}

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
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
}) => {
  const scale = useRef(new Animated.Value(MIN_ZOOM)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const transformRef = useRef({ scale: MIN_ZOOM, x: 0, y: 0 });
  const layoutRef = useRef({ width: 0, height: 0 });
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const lastPanPointRef = useRef<TouchPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);

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

  const resetZoom = () => animateTransform(MIN_ZOOM, 0, 0);

  useEffect(() => {
    transformRef.current = { scale: MIN_ZOOM, x: 0, y: 0 };
    scale.setValue(MIN_ZOOM);
    translateX.setValue(0);
    translateY.setValue(0);
    setZoomLevel(MIN_ZOOM);
  }, [scale, translateX, translateY, uri]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: (event) => (
      event.nativeEvent.touches.length >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onMoveShouldSetPanResponderCapture: (event) => (
      event.nativeEvent.touches.length >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onStartShouldSetPanResponder: (event) => (
      event.nativeEvent.touches.length >= 2 || transformRef.current.scale > MIN_ZOOM
    ),
    onMoveShouldSetPanResponder: (event, gestureState) => (
      event.nativeEvent.touches.length >= 2
      || (
        transformRef.current.scale > MIN_ZOOM
        && Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 2
      )
    ),
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2) {
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
        setZoomLevel(transformRef.current.scale);
      }
    },
    onPanResponderTerminate: () => {
      pinchStartRef.current = null;
      lastPanPointRef.current = null;
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
    animateTransform(nextScale, transformRef.current.x, transformRef.current.y);
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        layoutRef.current = event.nativeEvent.layout;
        setTransformImmediately(
          transformRef.current.scale,
          transformRef.current.x,
          transformRef.current.y,
        );
      }}
    >
      <View style={styles.gestureSurface} {...panResponder.panHandlers}>
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

      <View style={styles.controls}>
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
    backgroundColor: colors.gray[100],
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
  controls: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
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
    backgroundColor: colors.gray[700],
  },
  controlText: {
    ...typography.contextTitle,
    color: colors.white,
  },
  levelText: {
    ...typography.caption,
    color: colors.white,
  },
});
