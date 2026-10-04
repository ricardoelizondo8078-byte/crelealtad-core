import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colors,
  layout,
  moduleThemes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme/tokens';

interface ProcessingOverlayProps {
  visible: boolean;
  message: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  visible,
  message,
}) => {
  const announcedRef = useRef(false);

  useEffect(() => {
    if (visible && !announcedRef.current) {
      announcedRef.current = true;
      AccessibilityInfo.announceForAccessibility(`${message} Espera un momento.`);
    }

    if (!visible) {
      announcedRef.current = false;
    }
  }, [message, visible]);

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={() => undefined}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityLabel={`${message} Espera un momento.`}
          accessibilityLiveRegion="assertive"
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
          accessibilityViewIsModal
          style={styles.panel}
        >
          <ActivityIndicator
            accessibilityElementsHidden
            color={moduleThemes.general.primary}
            importantForAccessibility="no-hide-descendants"
            size="large"
          />
          <Text allowFontScaling style={styles.message}>
            {message}
          </Text>
          <Text allowFontScaling style={styles.helper}>
            Espera un momento
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    maxWidth: layout.processingPanelMaxWidth,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    width: '100%',
    ...shadows.card,
  },
  message: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  helper: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
