import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { CompletionIndicator } from './CompletionIndicator';
import { FormField } from './FormField';

interface PhoneCallFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onCall: () => void;
  onViewEvidence?: () => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  callAccessibilityLabel?: string;
  viewAccessibilityLabel?: string;
  actionLabel?: string;
  confirmed?: boolean;
}

export const PhoneCallField: React.FC<PhoneCallFieldProps> = ({
  label,
  value,
  onChangeText,
  onCall,
  onViewEvidence,
  placeholder = 'Número de 10 dígitos',
  required = false,
  helperText,
  errorText,
  callAccessibilityLabel = 'Marcar al número capturado',
  viewAccessibilityLabel = 'Ver evidencia del teléfono confirmado',
  actionLabel,
  confirmed = false,
}) => {
  const canCall = value.replace(/\D/g, '').length === 10;
  const actionDisabled = confirmed ? !onViewEvidence : !canCall;
  const answered = !confirmed && value.trim().length > 0;

  return (
    <FormField
      label={label}
      required={required}
      helperText={helperText}
      errorText={errorText}
    >
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <RNTextInput
            accessibilityLabel={label}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={14}
            editable={!confirmed}
            style={[
              styles.input,
              answered && styles.inputAnswered,
              confirmed && styles.inputConfirmed,
              errorText && styles.inputError,
            ]}
          />
          {confirmed ? (
            <CompletionIndicator
              accessibilityLabel="Teléfono confirmado"
              style={styles.confirmedBadge}
            />
          ) : null}
        </View>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmed ? viewAccessibilityLabel : callAccessibilityLabel}
            accessibilityState={{ disabled: actionDisabled }}
            disabled={actionDisabled}
            style={({ pressed }) => [
              styles.confirmButton,
              confirmed && styles.viewButton,
              actionDisabled && styles.confirmButtonDisabled,
              confirmed && actionDisabled && styles.viewButtonDisabled,
              pressed && !actionDisabled && styles.confirmButtonPressed,
            ]}
            onPress={confirmed ? onViewEvidence : onCall}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.confirmButtonText,
                confirmed && styles.viewButtonText,
                actionDisabled && styles.confirmButtonTextDisabled,
                confirmed && actionDisabled && styles.viewButtonTextDisabled,
              ]}
            >
              {confirmed ? 'Ver' : actionLabel}
            </Text>
          </Pressable>
        ) : canCall ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={callAccessibilityLabel}
            style={styles.callButton}
            onPress={onCall}
          >
            <FontAwesome name="phone" size={22} color={colors.gray[700]} />
          </Pressable>
        ) : (
          <View
            accessible={false}
            pointerEvents="none"
            style={styles.callButtonPlaceholder}
          />
        )}
      </View>
    </FormField>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  inputConfirmed: {
    paddingRight: 48,
    borderWidth: 2,
    borderColor: colors.success,
  },
  inputAnswered: {
    borderWidth: 2,
    borderColor: moduleThemes.verification.primary,
  },
  confirmedBadge: {
    position: 'absolute',
    right: spacing.sm,
    top: 8,
    zIndex: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  confirmButton: {
    minWidth: 104,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: moduleThemes.verification.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: moduleThemes.verification.headerAccent,
    borderWidth: 1,
    borderColor: moduleThemes.verification.primary,
    opacity: 0.65,
  },
  viewButton: {
    backgroundColor: colors.infoSoft,
    borderWidth: 1.5,
    borderColor: colors.info,
  },
  viewButtonDisabled: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
    opacity: 0.55,
  },
  confirmButtonPressed: {
    opacity: 0.82,
  },
  confirmButtonText: {
    ...typography.bodyStrong,
    color: moduleThemes.verification.primaryText,
  },
  confirmButtonTextDisabled: {
    color: moduleThemes.verification.primary,
  },
  viewButtonText: {
    color: colors.info,
  },
  viewButtonTextDisabled: {
    color: colors.info,
  },
  callButton: {
    width: 48,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonPlaceholder: {
    width: 48,
    minHeight: 48,
  },
});
