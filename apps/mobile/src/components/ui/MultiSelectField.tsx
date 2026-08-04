import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, spacing, typography } from '../../theme/tokens';
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
      <View style={styles.container}>
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <Pressable
              key={option}
              style={[
                styles.option,
                isSelected && {
                  backgroundColor: `${themeColors.primary}15`,
                  borderColor: themeColors.primary,
                }
              ]}
              onPress={() => toggleOption(option)}
            >
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
              <Text allowFontScaling={false} style={[
                styles.optionText,
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
