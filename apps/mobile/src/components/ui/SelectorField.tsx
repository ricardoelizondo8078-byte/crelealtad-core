import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

interface SelectorFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  errorText?: string;
  onSelect: (value: string) => void;
  moduleTheme?: ModuleThemeKey;
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
  moduleTheme = 'documentation',
}) => {
  const [open, setOpen] = useState(false);
  // Siempre usar scroll para colonias, el resto según la cantidad (7 o menos = chips)
  const useChips = label === 'Colonia' ? false : options.length <= 7;

  // Obtener colores del módulo
  const themeColors = moduleThemes[moduleTheme];

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
              // Normalizar para comparación (sin acentos, lowercase)
              const normalizeText = (text: string) =>
                text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

              // Comparar de forma normalizada
              const isSelected = value && normalizeText(value) === normalizeText(option);

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: `${themeColors.primary}20`, borderColor: themeColors.primary }
                      : styles.chipUnselected
                  ]}
                  onPress={() => onSelect(option)}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.chipText,
                      isSelected
                        ? { color: themeColors.primary }
                        : styles.chipTextUnselected
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
            <Text allowFontScaling={false} style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
          </Pressable>
        )}
      </FormField>

      {!useChips ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={() => undefined}>
              <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
                <Text allowFontScaling={false} style={styles.modalTitle}>{label}</Text>
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
                    <Text allowFontScaling={false} style={styles.modalOptionText}>{option}</Text>
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
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalSheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
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
