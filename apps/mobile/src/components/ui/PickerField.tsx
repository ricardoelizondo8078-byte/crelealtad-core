import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors, moduleThemes, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

interface PickerFieldProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  moduleTheme?: ModuleThemeKey;
}

export const PickerField: React.FC<PickerFieldProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Seleccionar...',
  required = false,
  helperText,
  errorText,
  moduleTheme = 'verification',
}) => {
  const [open, setOpen] = useState(false);
  const themeColors = moduleThemes[moduleTheme];

  const handleSelect = (option: string) => {
    onSelect(option);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <FormField
        label={label}
        required={required}
        helperText={helperText}
        errorText={errorText}
      >
        <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
          <Text allowFontScaling={false} style={value ? styles.valueText : styles.placeholderText}>
            {value || placeholder}
          </Text>
        </Pressable>
      </FormField>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{label}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option, index) => (
                <Pressable
                  key={index}
                  style={styles.modalOption}
                  onPress={() => handleSelect(option)}
                >
                  <Text allowFontScaling={false} style={[
                    styles.modalOptionText,
                    value === option && styles.modalOptionTextSelected,
                  ]}>
                    {option}
                  </Text>
                  {value === option && (
                    <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 46,
    justifyContent: 'center',
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: '85%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
