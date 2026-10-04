import React from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';
import { FormField } from './FormField';
import {
  colors,
  moduleThemes,
  ModuleThemeKey,
  spacing,
  typography,
} from '../../theme/tokens';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  moduleTheme?: ModuleThemeKey;
  highlightWhenFilled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  moduleTheme = 'general',
  highlightWhenFilled = false,
  ...rest
}) => {
  const answered = highlightWhenFilled && value.trim().length > 0;
  const themeColors = moduleThemes[moduleTheme];

  return (
    <FormField label={label} required={required} helperText={helperText} errorText={error}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          answered && {
            borderWidth: 2,
            borderColor: themeColors.primary,
          },
          error && styles.inputError,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...rest}
      />
    </FormField>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: '#B91C1C',
  },
});
