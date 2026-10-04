import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import { colors, radius, spacing, touchTargets, typography } from '../../theme/tokens';

interface SingleSelectOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
}

export const SingleSelectOption: React.FC<SingleSelectOptionProps> = ({
  label,
  description,
  selected,
  disabled = false,
  onPress,
}) => {
  const handlePress = useProcessingAction(onPress);

  return (
    <Pressable
    accessibilityRole="radio"
    accessibilityLabel={description ? `${label}. ${description}` : label}
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={handlePress}
    style={({ pressed }) => [
      styles.option,
      selected && styles.selectedOption,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    <View style={[styles.radio, selected && styles.selectedRadio]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
    <View style={styles.content}>
      <Text allowFontScaling={false} numberOfLines={2} style={styles.label}>{label}</Text>
      {description ? (
        <Text allowFontScaling={false} numberOfLines={1} style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  option: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  selectedOption: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: colors.warning,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
