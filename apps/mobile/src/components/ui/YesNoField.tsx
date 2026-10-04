import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import {
  colors,
  ModuleThemeKey,
  moduleThemes,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import { FormField } from './FormField';

export type YesNoValue = 'si' | 'no' | null;

interface YesNoFieldProps {
  label: string;
  value: YesNoValue;
  onChange: (value: Exclude<YesNoValue, null>) => void | Promise<void>;
  yesLabel?: string;
  noLabel?: string;
  registeredLabel?: string;
  registeredValue?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  moduleTheme?: ModuleThemeKey;
}

export const YesNoField: React.FC<YesNoFieldProps> = ({
  label,
  value,
  onChange,
  yesLabel = 'Sí',
  noLabel = 'No',
  registeredLabel,
  registeredValue,
  helperText,
  errorText,
  disabled = false,
  moduleTheme = 'documentation',
}) => {
  const theme = moduleThemes[moduleTheme];
  const handleChange = useProcessingAction(onChange);

  return (
    <FormField label={label} helperText={helperText} errorText={errorText}>
      {registeredValue ? (
        <View style={[styles.registeredValue, { backgroundColor: theme.headerAccent }]}>
          {registeredLabel ? (
            <Text allowFontScaling={false} style={styles.registeredLabel}>
              {registeredLabel}
            </Text>
          ) : null}
          <Text allowFontScaling={false} style={styles.registeredText}>
            {registeredValue}
          </Text>
        </View>
      ) : null}

      <View accessibilityRole="radiogroup" style={styles.options}>
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={yesLabel}
          accessibilityState={{ checked: value === 'si', disabled }}
          disabled={disabled}
          onPress={() => handleChange?.('si')}
          style={({ pressed }) => [
            styles.option,
            styles.yesOption,
            value === 'si' && styles.yesSelected,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.optionText,
              styles.yesOptionText,
              value === 'si' && styles.yesSelectedText,
            ]}
          >
            {value === 'si' ? '✓ ' : ''}{yesLabel}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={noLabel}
          accessibilityState={{ checked: value === 'no', disabled }}
          disabled={disabled}
          onPress={() => handleChange?.('no')}
          style={({ pressed }) => [
            styles.option,
            styles.noOption,
            value === 'no' && styles.noSelected,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.optionText,
              styles.noOptionText,
              value === 'no' && styles.noSelectedText,
            ]}
          >
            {value === 'no' ? '✕ ' : ''}{noLabel}
          </Text>
        </Pressable>
      </View>
    </FormField>
  );
};

const styles = StyleSheet.create({
  registeredValue: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  registeredLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  registeredText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: touchTargets.primary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  yesOption: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  yesOptionText: {
    color: colors.primary,
  },
  noOption: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  noOptionText: {
    color: colors.danger,
  },
  yesSelected: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  yesSelectedText: {
    color: colors.white,
  },
  noSelected: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  noSelectedText: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
