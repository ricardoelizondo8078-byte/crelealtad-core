import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  errorText,
  children,
}) => {
  return (
    <View style={styles.container}>
      {label != null && label !== '' ? (
        <Text allowFontScaling={false} style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      {children}
      {helperText && typeof helperText === 'string' ? (
        <Text allowFontScaling={false} style={styles.helper}>{helperText}</Text>
      ) : null}
      {errorText && typeof errorText === 'string' ? (
        <Text allowFontScaling={false} style={styles.error}>{errorText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, ...typography.bodyStrong },
  helper: { color: colors.textSecondary, marginTop: spacing.xs, ...typography.caption },
  error: { color: '#B91C1C', marginTop: spacing.xs, ...typography.caption },
});
