import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, shadows, spacing, typography } from '../../theme/tokens';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface BottomActionBarProps {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void | Promise<void>;
  onSecondary: () => void | Promise<void>;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  helperText?: string;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
  helperText,
}) => (
  <View style={styles.container}>
    {helperText ? <Text allowFontScaling={false} style={styles.helper}>{helperText}</Text> : null}
    <View style={styles.actions}>
      <SecondaryButton
        title={secondaryLabel}
        onPress={onSecondary}
        disabled={secondaryDisabled}
      />
      <PrimaryButton
        title={primaryLabel}
        onPress={onPrimary}
        disabled={primaryDisabled}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.card,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
