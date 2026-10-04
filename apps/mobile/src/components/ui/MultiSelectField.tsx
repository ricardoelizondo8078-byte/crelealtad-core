import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

interface MultiSelectFieldProps {
  label: string;
  value: string[]; // Array de opciones seleccionadas
  options: string[];
  onSelect: (selected: string[]) => void;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  moduleTheme?: ModuleThemeKey;
  variant?: 'cards' | 'chips';
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  value,
  options,
  onSelect,
  required = false,
  helperText,
  errorText,
  moduleTheme = 'verification',
  variant = 'cards',
}) => {
  const themeColors = moduleThemes[moduleTheme];

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      // Remover la opción
      onSelect(value.filter(item => item !== option));
    } else {
      // Agregar la opción
      onSelect([...value, option]);
    }
  };

  return (
    <FormField
      label={label}
      required={required}
      helperText={helperText}
      errorText={errorText}
    >
      <View style={[styles.container, variant === 'chips' && styles.chipContainer]}>
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <Pressable
              key={option}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={[
                variant === 'chips' ? styles.chip : styles.option,
                isSelected && {
                  backgroundColor: `${themeColors.primary}18`,
                  borderColor: themeColors.primary,
                }
              ]}
              onPress={() => toggleOption(option)}
            >
              {variant === 'cards' ? (
                <View style={[
                  styles.checkbox,
                  isSelected && {
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.primary,
                  }
                ]}>
                  {isSelected && (
                    <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                  )}
                </View>
              ) : null}
              <Text allowFontScaling={false} style={[
                variant === 'chips' ? styles.chipText : styles.optionText,
                isSelected && {
                  fontWeight: '600',
                  color: themeColors.primary,
                }
              ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    minHeight: 44,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
