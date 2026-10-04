import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import { colors, radius, spacing, touchTargets, typography } from '../../theme/tokens';

interface BinaryChoiceDialogProps {
  visible: boolean;
  title: string;
  message: string;
  positiveLabel: string;
  negativeLabel: string;
  onPositive: () => void | Promise<void>;
  onNegative: () => void | Promise<void>;
  onDismiss: () => void;
  busy?: boolean;
}

export const BinaryChoiceDialog: React.FC<BinaryChoiceDialogProps> = ({
  visible,
  title,
  message,
  positiveLabel,
  negativeLabel,
  onPositive,
  onNegative,
  onDismiss,
  busy = false,
}) => {
  const handlePositive = useProcessingAction(onPositive);
  const handleNegative = useProcessingAction(onNegative);

  return (
    <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={() => {
      if (!busy) onDismiss();
    }}
  >
    <View style={styles.overlay}>
      <View accessibilityRole="alert" style={styles.dialog}>
        <Text allowFontScaling={false} style={styles.title}>{title}</Text>
        <Text allowFontScaling={false} style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleNegative}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => [
              styles.button,
              styles.negative,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            <Text allowFontScaling={false} style={[styles.buttonText, styles.negativeText]}>
              ✕ {negativeLabel}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handlePositive}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => [
              styles.button,
              styles.positive,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            <Text allowFontScaling={false} style={[styles.buttonText, styles.positiveText]}>
              ✓ {positiveLabel}
            </Text>
          </Pressable>
        </View>
        {busy ? (
          <Text
            accessibilityLiveRegion="polite"
            allowFontScaling={false}
            style={styles.busyText}
          >
            Guardando resultado…
          </Text>
        ) : null}
      </View>
    </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  dialog: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    minHeight: touchTargets.primary,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  positive: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  positiveText: {
    color: colors.primary,
  },
  negative: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  negativeText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  busyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
