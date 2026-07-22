import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

interface SelectorFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  errorText?: string;
  onSelect: (value: string) => void;
}

export const SelectorField: React.FC<SelectorFieldProps> = ({
  label,
  required = false,
  helperText,
  value,
  placeholder = 'Seleccionar opción',
  options,
  errorText,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const useChips = options.length <= 7;

  return (
    <View style={styles.container}>
      <FormField
        label={label}
        required={required}
        helperText={helperText}
        errorText={errorText}
      >
        {useChips ? (
          <View style={styles.chipGroup}>
            {options.map((option) => {
              // Solo marcar como seleccionado si value no está vacío Y coincide con la opción
              const isSelected = value && value === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
            <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
          </Pressable>
        )}
      </FormField>

      {!useChips ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={() => undefined}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <Pressable
                    key={option}
                    style={styles.modalOption}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.textSecondary,
    ...typography.body,
  },
  valueText: {
    color: colors.textPrimary,
    ...typography.body,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.successSoft,
    borderColor: '#0F5A35',
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#0F5A35',
  },
  chipTextUnselected: {
    color: colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '72%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    backgroundColor: '#0F5A35',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  modalOption: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
