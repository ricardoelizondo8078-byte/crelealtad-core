import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  details?: readonly {
    label: string;
    value: string;
  }[];
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  details,
  confirmLabel,
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View accessibilityRole="alert" style={styles.dialog}>
        <Text allowFontScaling={false} style={styles.title}>{title}</Text>
        {message ? <Text allowFontScaling={false} style={styles.message}>{message}</Text> : null}
        {details?.length ? (
          <View style={styles.details}>
            {details.map((detail, index) => (
              <View
                key={`${detail.label}-${index}`}
                accessible
                accessibilityLabel={`${detail.label}: ${detail.value}`}
                style={[
                  styles.detailRow,
                  index < details.length - 1 && styles.detailDivider,
                ]}
              >
                <Text allowFontScaling={false} style={styles.detailLabel}>{detail.label}</Text>
                <Text allowFontScaling={false} style={styles.detailValue}>{detail.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <SecondaryButton title={cancelLabel} onPress={onCancel} disabled={busy} />
          <PrimaryButton
            title={busy ? 'Enviando…' : confirmLabel}
            onPress={onConfirm}
            disabled={busy}
          />
        </View>
      </View>
    </View>
  </Modal>
);

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
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  details: {
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  detailValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
