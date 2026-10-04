import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import {
  colors,
  moduleThemes,
  radius,
  spacing,
  touchTargets,
  typography,
  type ModuleThemeKey,
} from '../../theme/tokens';

interface RequiredSelectionBarProps {
  label: string;
  mark: string;
  value?: string | null;
  emptyText?: string;
  actionLabel?: string;
  requiredLabel?: string;
  moduleTheme?: ModuleThemeKey;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
}

export const RequiredSelectionBar: React.FC<RequiredSelectionBarProps> = ({
  label,
  mark,
  value,
  emptyText = 'Sin seleccionar',
  actionLabel = value ? 'Cambiar' : 'Seleccionar',
  requiredLabel = 'Obligatoria',
  moduleTheme = 'documentation',
  disabled = false,
  onPress,
}) => {
  const theme = moduleThemes[moduleTheme];
  const handlePress = useProcessingAction(onPress);
  const displayedValue = value?.trim() || emptyText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${requiredLabel}. ${displayedValue}. ${actionLabel}.`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.markCircle}>
        <Text allowFontScaling={false} style={styles.markText}>{mark}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.label}>{label}</Text>
          <Text allowFontScaling={false} style={styles.required}>· {requiredLabel}</Text>
        </View>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={[styles.value, !value && styles.emptyValue]}
        >
          {displayedValue}
        </Text>
      </View>
      <View style={[styles.action, { borderColor: theme.primary }]}>
        <Text allowFontScaling={false} style={[styles.actionText, { color: theme.primary }]}>
          {actionLabel}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    backgroundColor: colors.gray[100],
  },
  markCircle: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  markText: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  required: {
    ...typography.caption,
    color: colors.warning,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyValue: {
    color: colors.danger,
  },
  action: {
    minHeight: touchTargets.minimum,
    minWidth: touchTargets.minimum,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
