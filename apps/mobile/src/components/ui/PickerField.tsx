import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
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
  autoOpen?: boolean;
  confirmSelection?: boolean;
  highlightSelectedValue?: boolean;
  selectionTone?: 'default' | 'danger';
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
  autoOpen = false,
  confirmSelection = false,
  highlightSelectedValue = false,
  selectionTone = 'default',
}) => {
  const [open, setOpen] = useState(autoOpen);
  const [pendingValue, setPendingValue] = useState(value);
  const themeColors = moduleThemes[moduleTheme];
  const selectedValue = confirmSelection ? pendingValue : value;
  const showHighlightedValue = (highlightSelectedValue || confirmSelection) && Boolean(value);
  const dangerSelection = selectionTone === 'danger';

  const handleOpen = () => {
    setPendingValue(value);
    setOpen(true);
  };

  const handleSelect = (option: string) => {
    if (confirmSelection) {
      setPendingValue(option);
      return;
    }

    onSelect(option);
    setOpen(false);
  };

  const handleConfirm = () => {
    if (!pendingValue) return;
    onSelect(pendingValue);
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${value || placeholder}`}
          style={[
            styles.trigger,
            showHighlightedValue && {
              backgroundColor: dangerSelection ? colors.dangerSoft : `${themeColors.primary}12`,
              borderColor: dangerSelection ? colors.danger : themeColors.primary,
              borderWidth: 2,
              minHeight: 40,
            },
          ]}
          onPress={handleOpen}
        >
          {showHighlightedValue ? (
            <Text
              allowFontScaling={false}
              style={[
                styles.selectedCheckmark,
                { color: dangerSelection ? colors.danger : themeColors.primary },
              ]}
            >
              {dangerSelection ? '✕' : '✓'}
            </Text>
          ) : null}
          <Text
            allowFontScaling={false}
            style={[
              value ? styles.valueText : styles.placeholderText,
              showHighlightedValue && styles.valueTextSelected,
              showHighlightedValue && dangerSelection && styles.valueTextDanger,
            ]}
          >
            {value || placeholder}
          </Text>
          {showHighlightedValue ? (
            <Text
              allowFontScaling={false}
              style={styles.selectedChevron}
            >
              ⌄
            </Text>
          ) : null}
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
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedValue === option }}
                  style={[
                    styles.modalOption,
                    selectedValue === option && {
                      backgroundColor: themeColors.headerAccent,
                      borderLeftColor: themeColors.primary,
                    },
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text allowFontScaling={false} style={[
                    styles.modalOptionText,
                    selectedValue === option && [
                      styles.modalOptionTextSelected,
                      { color: themeColors.primary },
                    ],
                  ]}>
                    {option}
                  </Text>
                  {selectedValue === option && (
                    <Text
                      allowFontScaling={false}
                      style={[styles.checkmark, { color: themeColors.primary }]}
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {confirmSelection ? (
              <View style={styles.modalFooter}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !pendingValue }}
                  disabled={!pendingValue}
                  onPress={handleConfirm}
                  style={[
                    styles.confirmButton,
                    { backgroundColor: themeColors.primary },
                    !pendingValue && styles.confirmButtonDisabled,
                  ]}
                >
                  <Text allowFontScaling={false} style={styles.confirmButtonText}>
                    Confirmar selección
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 46,
    justifyContent: 'space-between',
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  valueTextSelected: {
    flex: 1,
    fontWeight: '600',
  },
  valueTextDanger: {
    color: colors.danger,
  },
  selectedCheckmark: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  selectedChevron: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 20,
    marginLeft: spacing.sm,
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
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmButton: {
    minHeight: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
    textAlign: 'center',
  },
});
