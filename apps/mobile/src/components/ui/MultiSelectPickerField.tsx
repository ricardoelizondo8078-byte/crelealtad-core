import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { FormField } from './FormField';

type ModuleThemeKey = 'documentation' | 'verification' | 'disbursement';

export interface MultiSelectPickerOption {
  value: string;
  label: string;
}

interface MultiSelectPickerFollowUp {
  label: (option: MultiSelectPickerOption) => string;
  options: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  subtitle?: string;
}

interface MultiSelectPickerFieldProps {
  label: string;
  value: string[];
  options: MultiSelectPickerOption[];
  onSelect: (selected: string[]) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  moduleTheme?: ModuleThemeKey;
  disabled?: boolean;
  openOnMount?: boolean;
  modalSubtitle?: string;
  selectedItemsTitle?: string;
  showSelectedItemsTitleWhenTrigger?: boolean;
  minSelections?: number;
  maxSelections?: number;
  selectionTone?: 'default' | 'danger';
  dangerValues?: string[];
  selectedItemsAreTrigger?: boolean;
  hideLabelWhenSelected?: boolean;
  followUp?: MultiSelectPickerFollowUp;
}

export const MultiSelectPickerField: React.FC<MultiSelectPickerFieldProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Seleccionar integrantes',
  required = false,
  helperText,
  errorText,
  moduleTheme = 'verification',
  disabled = false,
  openOnMount = false,
  modalSubtitle = 'Selecciona una o varias integrantes',
  selectedItemsTitle = 'Integrantes seleccionadas',
  showSelectedItemsTitleWhenTrigger = false,
  minSelections = 0,
  maxSelections,
  selectionTone = 'default',
  dangerValues = [],
  selectedItemsAreTrigger = false,
  hideLabelWhenSelected = false,
  followUp,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [draftFollowUpValues, setDraftFollowUpValues] = useState<Record<string, string>>({});
  const [followUpOption, setFollowUpOption] = useState<MultiSelectPickerOption | null>(null);
  const [pendingFollowUpValue, setPendingFollowUpValue] = useState('');
  const autoOpened = useRef(false);
  const themeColors = moduleThemes[moduleTheme];
  const dangerSelection = selectionTone === 'danger';

  useEffect(() => {
    if (!openOnMount || disabled || autoOpened.current) return;
    autoOpened.current = true;
    setDraft(value);
    setDraftFollowUpValues(followUp?.values ?? {});
    setOpen(true);
  }, [disabled, followUp?.values, openOnMount, value]);

  const openPicker = () => {
    if (disabled) return;
    setDraft(value);
    setDraftFollowUpValues(followUp?.values ?? {});
    setFollowUpOption(null);
    setPendingFollowUpValue('');
    setOpen(true);
  };

  const toggleOption = (option: MultiSelectPickerOption) => {
    const optionValue = option.value;

    if (draft.includes(optionValue)) {
      setDraft(draft.filter((item) => item !== optionValue));
      setDraftFollowUpValues((current) => {
        const next = { ...current };
        delete next[optionValue];
        return next;
      });
      return;
    }

    if (maxSelections != null && maxSelections !== 1 && draft.length >= maxSelections) {
      return;
    }

    setDraft(maxSelections === 1 ? [optionValue] : [...draft, optionValue]);
    if (maxSelections === 1) {
      setDraftFollowUpValues({});
    }

    if (followUp) {
      setPendingFollowUpValue('');
      setFollowUpOption(option);
    }
  };

  const cancelFollowUp = () => {
    if (followUpOption) {
      setDraft((current) => current.filter((item) => item !== followUpOption.value));
      setDraftFollowUpValues((current) => {
        const next = { ...current };
        delete next[followUpOption.value];
        return next;
      });
    }
    setPendingFollowUpValue('');
    setFollowUpOption(null);
  };

  const confirmFollowUp = () => {
    if (!followUpOption || !pendingFollowUpValue) return;
    setDraftFollowUpValues((current) => ({
      ...current,
      [followUpOption.value]: pendingFollowUpValue,
    }));
    setPendingFollowUpValue('');
    setFollowUpOption(null);
  };

  const selectedOptions = options.filter((option) => value.includes(option.value));
  const selectedLabels = selectedOptions.map((option) => option.label);
  const confirmDisabled = draft.length < minSelections
    || Boolean(followUp && draft.some((item) => !draftFollowUpValues[item]));
  const summary = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels.length} integrantes seleccionadas`;

  const renderSelectedItem = (selectedOption: MultiSelectPickerOption) => {
    const selectedFollowUpValue = followUp?.values[selectedOption.value];
    const selectedOptionDanger = dangerSelection || dangerValues.includes(selectedOption.value);
    const itemContent = (
      <>
        <Text
          allowFontScaling={false}
          style={[
            styles.selectedItemCheck,
            { color: selectedOptionDanger ? colors.danger : themeColors.primary },
          ]}
        >
          {selectedOptionDanger ? '✕' : '✓'}
        </Text>
        <View style={styles.selectedItemCopy}>
          <Text
            allowFontScaling={false}
            style={[
              styles.selectedItemText,
              selectedOptionDanger && styles.selectedItemTextDanger,
            ]}
          >
            {selectedOption.label}
          </Text>
          {selectedFollowUpValue ? (
            <Text allowFontScaling={false} style={styles.selectedItemDetail}>
              Causa: {selectedFollowUpValue}
            </Text>
          ) : null}
        </View>
        {selectedItemsAreTrigger ? (
          <Text allowFontScaling={false} style={styles.selectedItemChevron}>⌄</Text>
        ) : null}
      </>
    );
    const itemStyle = [
      styles.selectedItem,
      {
        backgroundColor: selectedOptionDanger
          ? colors.dangerSoft
          : `${themeColors.primary}12`,
        borderColor: selectedOptionDanger ? colors.danger : themeColors.primary,
      },
    ];

    if (selectedItemsAreTrigger) {
      return (
        <Pressable
          key={selectedOption.value}
          accessibilityRole="button"
          accessibilityLabel={`${selectedOption.label}.${selectedFollowUpValue ? ` Causa: ${selectedFollowUpValue}.` : ''} Abrir para modificar la selección.`}
          disabled={disabled}
          onPress={openPicker}
          style={({ pressed }) => [
            ...itemStyle,
            pressed && styles.selectedItemPressed,
            disabled && styles.triggerDisabled,
          ]}
        >
          {itemContent}
        </Pressable>
      );
    }

    return (
      <View key={selectedOption.value} style={itemStyle}>
        {itemContent}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FormField
        label={hideLabelWhenSelected && selectedLabels.length > 0 ? null : label}
        required={hideLabelWhenSelected && selectedLabels.length > 0 ? false : required}
        helperText={helperText}
        errorText={errorText}
      >
        {!selectedItemsAreTrigger || selectedLabels.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}. ${summary}`}
            disabled={disabled}
            style={[styles.trigger, disabled && styles.triggerDisabled]}
            onPress={openPicker}
          >
            <Text
              allowFontScaling={false}
              style={selectedLabels.length > 0 ? styles.valueText : styles.placeholderText}
            >
              {summary}
            </Text>
            <Text allowFontScaling={false} style={styles.chevron}>⌄</Text>
          </Pressable>
        ) : null}

        {selectedLabels.length > 0 ? (
          <View
            accessible={!selectedItemsAreTrigger}
            accessibilityLabel={selectedItemsAreTrigger
              ? undefined
              : `${selectedItemsTitle}: ${selectedLabels.join(', ')}`}
            style={[
              styles.selectedItems,
              selectedItemsAreTrigger && styles.selectedItemsAsTrigger,
            ]}
          >
            {!selectedItemsAreTrigger || showSelectedItemsTitleWhenTrigger ? (
              <Text allowFontScaling={false} style={styles.selectedItemsTitle}>
                {selectedItemsTitle}
              </Text>
            ) : null}
            <View style={styles.selectedItemsList}>
              {selectedOptions.map(renderSelectedItem)}
            </View>
          </View>
        ) : null}
      </FormField>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (followUpOption) {
            cancelFollowUp();
            return;
          }
          setOpen(false);
        }}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            {followUpOption && followUp ? (
              <>
                <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
                  <Text allowFontScaling={false} style={styles.modalTitle}>
                    {followUp.label(followUpOption)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.modalSubtitle}>
                    {followUp.subtitle ?? 'Selecciona una causa y confírmala'}
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {followUp.options.map((option) => {
                    const selected = pendingFollowUpValue === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={[
                          styles.modalOption,
                          selected && styles.modalOptionDanger,
                        ]}
                        onPress={() => setPendingFollowUpValue(option)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selected && {
                              borderColor: colors.danger,
                              backgroundColor: colors.danger,
                            },
                          ]}
                        >
                          {selected ? (
                            <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>
                          ) : null}
                        </View>
                        <Text allowFontScaling={false} style={styles.modalOptionText}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={cancelFollowUp}>
                    <Text allowFontScaling={false} style={styles.cancelButtonText}>Volver</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !pendingFollowUpValue }}
                    disabled={!pendingFollowUpValue}
                    style={[
                      styles.confirmButton,
                      { backgroundColor: themeColors.primary },
                      !pendingFollowUpValue && styles.confirmButtonDisabled,
                    ]}
                    onPress={confirmFollowUp}
                  >
                    <Text allowFontScaling={false} style={styles.confirmButtonText}>
                      Guardar causa
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
                  <Text allowFontScaling={false} style={styles.modalTitle}>{label}</Text>
                  <Text allowFontScaling={false} style={styles.modalSubtitle}>
                    {modalSubtitle}
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {options.length > 0 ? options.map((option) => {
                    const selected = draft.includes(option.value);
                    const selectedOptionDanger = dangerSelection
                      || dangerValues.includes(option.value);
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole={maxSelections === 1 ? 'radio' : 'checkbox'}
                        accessibilityState={{ checked: selected }}
                        style={[
                          styles.modalOption,
                          selected && selectedOptionDanger && styles.modalOptionDanger,
                        ]}
                        onPress={() => toggleOption(option)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selected && {
                              borderColor: selectedOptionDanger ? colors.danger : themeColors.primary,
                              backgroundColor: selectedOptionDanger ? colors.danger : themeColors.primary,
                            },
                          ]}
                        >
                          {selected ? (
                            <Text allowFontScaling={false} style={styles.checkmark}>
                              {selectedOptionDanger ? '✕' : '✓'}
                            </Text>
                          ) : null}
                        </View>
                        <Text allowFontScaling={false} style={styles.modalOptionText}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  }) : (
                    <Text allowFontScaling={false} style={styles.emptyText}>
                      No hay otras integrantes disponibles.
                    </Text>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setOpen(false)}>
                    <Text allowFontScaling={false} style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: confirmDisabled }}
                    disabled={confirmDisabled}
                    style={[
                      styles.confirmButton,
                      { backgroundColor: themeColors.primary },
                      confirmDisabled && styles.confirmButtonDisabled,
                    ]}
                    onPress={() => {
                      onSelect(draft);
                      if (followUp) {
                        const selectedFollowUpValues: Record<string, string> = {};
                        draft.forEach((item) => {
                          if (draftFollowUpValues[item]) {
                            selectedFollowUpValues[item] = draftFollowUpValues[item];
                          }
                        });
                        followUp.onChange(selectedFollowUpValues);
                      }
                      setOpen(false);
                    }}
                  >
                    <Text allowFontScaling={false} style={styles.confirmButtonText}>
                      Guardar selección
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  triggerDisabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.7,
  },
  valueText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 20,
  },
  selectedItems: {
    marginTop: spacing.sm,
  },
  selectedItemsAsTrigger: {
    marginTop: 0,
  },
  selectedItemsTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectedItemsList: {
    gap: spacing.xs,
  },
  selectedItem: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedItemCheck: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  selectedItemCopy: {
    flex: 1,
  },
  selectedItemText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  selectedItemTextDanger: {
    color: colors.danger,
  },
  selectedItemDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  selectedItemChevron: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  selectedItemPressed: {
    opacity: 0.78,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    maxHeight: '78%',
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
  modalOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  modalOptionDanger: {
    backgroundColor: colors.dangerSoft,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOptionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  cancelButton: {
    minHeight: 44,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  cancelButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  confirmButton: {
    minHeight: 44,
    flex: 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
