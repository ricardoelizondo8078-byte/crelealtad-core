import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

interface MonthYearPickerFieldProps {
  label: string;
  month: string;
  year: string;
  months: string[];
  years: string[];
  onConfirm: (month: string, year: string) => void;
  placeholder?: string;
  trailingValue?: string;
  required?: boolean;
  moduleTheme?: ModuleThemeKey;
}

export const MonthYearPickerField: React.FC<MonthYearPickerFieldProps> = ({
  label,
  month,
  year,
  months,
  years,
  onConfirm,
  placeholder = 'Seleccionar mes y año',
  trailingValue,
  required = false,
  moduleTheme = 'verification',
}) => {
  const [open, setOpen] = useState(false);
  const [pendingMonth, setPendingMonth] = useState('');
  const [pendingYear, setPendingYear] = useState('');
  const themeColors = moduleThemes[moduleTheme];
  const value = month && year ? `${month} ${year}` : '';
  const showHighlightedValue = Boolean(value);
  const confirmDisabled = !pendingMonth || !pendingYear;

  const handleOpen = () => {
    setPendingMonth(month);
    setPendingYear(year);
    setOpen(true);
  };

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm(pendingMonth, pendingYear);
    setOpen(false);
  };

  const renderOption = (
    option: string,
    selected: boolean,
    onSelect: (value: string) => void,
  ) => (
    <Pressable
      key={option}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(option)}
      style={[
        styles.option,
        selected && {
          backgroundColor: themeColors.headerAccent,
          borderLeftColor: themeColors.primary,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.optionText,
          selected && { color: themeColors.primary, fontWeight: '700' },
        ]}
      >
        {option}
      </Text>
      {selected ? (
        <Text allowFontScaling={false} style={[styles.checkmark, { color: themeColors.primary }]}>✓</Text>
      ) : null}
    </Pressable>
  );

  return (
    <View>
      <FormField label={label} required={required}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${value || placeholder}${value && trailingValue ? `. ${trailingValue}` : ''}`}
          onPress={handleOpen}
          style={[
            styles.trigger,
            showHighlightedValue && {
              backgroundColor: `${themeColors.primary}12`,
              borderColor: themeColors.primary,
              borderWidth: 2,
              minHeight: 40,
            },
          ]}
        >
          {showHighlightedValue ? (
            <Text
              allowFontScaling={false}
              style={[styles.selectedCheckmark, { color: themeColors.primary }]}
            >
              ✓
            </Text>
          ) : null}
          <Text
            allowFontScaling={false}
            style={[
              value ? styles.valueText : styles.placeholderText,
              showHighlightedValue && styles.valueTextSelected,
            ]}
          >
            {value || placeholder}
          </Text>
          {value && trailingValue ? (
            <Text
              allowFontScaling={false}
              style={[styles.trailingValue, { color: themeColors.primary }]}
            >
              {trailingValue}
            </Text>
          ) : null}
          <Text allowFontScaling={false} style={styles.chevron}>⌄</Text>
        </Pressable>
      </FormField>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{label}</Text>
              <Text allowFontScaling={false} style={styles.modalSubtitle}>Selecciona mes y año</Text>
            </View>

            <View style={styles.columns}>
              <View style={styles.column}>
                <Text allowFontScaling={false} style={styles.columnTitle}>Mes</Text>
                <ScrollView showsVerticalScrollIndicator>
                  {months.map((option) => renderOption(
                    option,
                    pendingMonth === option,
                    setPendingMonth,
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.column, styles.yearColumn]}>
                <Text allowFontScaling={false} style={styles.columnTitle}>Año</Text>
                <ScrollView showsVerticalScrollIndicator>
                  {years.map((option) => renderOption(
                    option,
                    pendingYear === option,
                    setPendingYear,
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: confirmDisabled }}
                disabled={confirmDisabled}
                onPress={handleConfirm}
                style={[
                  styles.confirmButton,
                  { backgroundColor: themeColors.primary },
                  confirmDisabled && styles.confirmButtonDisabled,
                ]}
              >
                <Text allowFontScaling={false} style={styles.confirmButtonText}>
                  Confirmar selección
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  valueTextSelected: {
    fontWeight: '600',
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  trailingValue: {
    ...typography.bodyStrong,
    marginLeft: spacing.sm,
  },
  selectedCheckmark: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    height: '72%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: {
    ...typography.bodyStrong,
    color: colors.white,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  yearColumn: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  columnTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmButton: {
    minHeight: 46,
    borderRadius: radius.sm,
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
