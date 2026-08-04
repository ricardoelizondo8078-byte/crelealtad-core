import React, { useState, useRef, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../../theme/tokens';

interface DatePickerFieldProps {
  label: string;
  value: string; // Formato DD,MMM,YYYY
  onChange: (value: string) => void;
  required?: boolean;
  errorText?: string;
}

const MESES = [
  { value: '01', label: 'ENE' },
  { value: '02', label: 'FEB' },
  { value: '03', label: 'MAR' },
  { value: '04', label: 'ABR' },
  { value: '05', label: 'MAY' },
  { value: '06', label: 'JUN' },
  { value: '07', label: 'JUL' },
  { value: '08', label: 'AGO' },
  { value: '09', label: 'SEP' },
  { value: '10', label: 'OCT' },
  { value: '11', label: 'NOV' },
  { value: '12', label: 'DIC' },
];

const ITEM_HEIGHT = 40;
const PICKER_HEIGHT = 280;
const SPACER_HEIGHT = (PICKER_HEIGHT / 2) - (ITEM_HEIGHT / 2);

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

const getCurrentYear = () => new Date().getFullYear();

const parseDateValue = (value: string): { day: number; month: number; year: number } | null => {
  if (!value) return null;

  // Aceptar tanto formato con comas como con guiones
  const parts = value.includes('-') ? value.split('-') : value.split(',');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const monthLabel = parts[1];
  const year = parseInt(parts[2], 10);

  const monthObj = MESES.find(m => m.label === monthLabel);
  if (!monthObj) return null;

  const month = parseInt(monthObj.value, 10);

  return { day, month, year };
};

const formatDateValue = (day: number, month: number, year: number): string => {
  const monthObj = MESES.find(m => m.value === month.toString().padStart(2, '0'));
  const monthLabel = monthObj?.label || 'ENE';
  return `${day.toString().padStart(2, '0')}-${monthLabel}-${year}`;
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({ label, value, onChange, required, errorText }) => {
  const [showPicker, setShowPicker] = useState(false);

  const parsed = parseDateValue(value);
  const currentYear = getCurrentYear();

  const [selectedDay, setSelectedDay] = useState(parsed?.day || 1);
  const [selectedMonth, setSelectedMonth] = useState(parsed?.month || 1);
  const [selectedYear, setSelectedYear] = useState(parsed?.year || currentYear);

  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calcular snapToOffsets para alineación perfecta
  const daySnapOffsets = days.map((_, index) => index * ITEM_HEIGHT);
  const monthSnapOffsets = MESES.map((_, index) => index * ITEM_HEIGHT);
  const yearSnapOffsets = years.map((_, index) => index * ITEM_HEIGHT);

  // Ajustar día si excede el máximo del mes
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  const findClosestIndex = (offset: number, snapOffsets: number[]): number => {
    let closestIndex = 0;
    let minDiff = Math.abs(snapOffsets[0] - offset);

    for (let i = 1; i < snapOffsets.length; i++) {
      const diff = Math.abs(snapOffsets[i] - offset);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const handleDayScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Restar 1 porque snapToAlignment="start" causa off-by-one con el spacer
    let index = Math.floor(offsetY / ITEM_HEIGHT) - 1;
    const clampedIndex = Math.max(0, Math.min(index, days.length - 1));
    const newDay = days[clampedIndex];

    if (newDay && newDay !== selectedDay) {
      setSelectedDay(newDay);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.selectionAsync();
      }
    }
  };

  const handleMonthScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    let index = Math.floor(offsetY / ITEM_HEIGHT) - 1;
    const clampedIndex = Math.max(0, Math.min(index, MESES.length - 1));
    const newMonth = clampedIndex + 1;

    if (newMonth >= 1 && newMonth <= 12 && newMonth !== selectedMonth) {
      setSelectedMonth(newMonth);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.selectionAsync();
      }
    }
  };

  const handleYearScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    let index = Math.floor(offsetY / ITEM_HEIGHT) - 1;
    const clampedIndex = Math.max(0, Math.min(index, years.length - 1));
    const newYear = years[clampedIndex];

    if (newYear && newYear !== selectedYear) {
      setSelectedYear(newYear);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.selectionAsync();
      }
    }
  };

  const handleConfirm = () => {
    const formattedDate = formatDateValue(selectedDay, selectedMonth, selectedYear);
    onChange(formattedDate);
    setShowPicker(false);
  };

  const scrollToInitialValues = () => {
    setTimeout(() => {
      // Scroll día - ajustado para centrar exactamente
      const dayIndex = days.indexOf(selectedDay);
      if (dayIndex >= 0) {
        dayScrollRef.current?.scrollTo({ y: dayIndex * ITEM_HEIGHT, animated: true });
      }

      // Scroll mes - ajustado para centrar exactamente
      const monthIndex = selectedMonth - 1;
      monthScrollRef.current?.scrollTo({ y: monthIndex * ITEM_HEIGHT, animated: true });

      // Scroll año - ajustado para centrar exactamente
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex >= 0) {
        yearScrollRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: true });
      }
    }, 150);
  };

  useEffect(() => {
    if (showPicker) {
      scrollToInitialValues();
    }
  }, [showPicker]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text allowFontScaling={false} style={styles.label}>{label}</Text>
        {required && <Text allowFontScaling={false} style={styles.required}> *</Text>}
      </View>

      <Pressable onPress={() => setShowPicker(true)} style={[styles.input, errorText && styles.inputError]}>
        <Text allowFontScaling={false} style={[styles.inputText, !value && styles.placeholder]}>
          {value || 'Seleccionar fecha'}
        </Text>
      </Pressable>

      {errorText && <Text allowFontScaling={false} style={styles.errorText}>{errorText}</Text>}

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>Selecciona la fecha</Text>
              <Pressable onPress={handleConfirm}>
                <Text allowFontScaling={false} style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.pickersContainer}>
              <View style={styles.pickersRow}>
                {/* Día */}
                <View style={styles.pickerColumn}>
                  <Text allowFontScaling={false} style={styles.pickerLabel}>DÍA</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView
                      ref={dayScrollRef}
                      style={styles.pickerScroll}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={daySnapOffsets}
                      snapToAlignment="start"
                      decelerationRate={0.994}
                      onMomentumScrollEnd={handleDayScroll}
                      onScroll={handleDayScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={styles.scrollContent}
                    >
                      <View style={styles.spacer} />
                      {days.map((day) => (
                        <View key={day} style={styles.pickerItem}>
                          <Text allowFontScaling={false} style={styles.pickerItemText}>
                            {day.toString().padStart(2, '0')}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.spacer} />
                    </ScrollView>
                  </View>
                </View>

                {/* Mes */}
                <View style={styles.pickerColumn}>
                  <Text allowFontScaling={false} style={styles.pickerLabel}>MES</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView
                      ref={monthScrollRef}
                      style={styles.pickerScroll}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={monthSnapOffsets}
                      snapToAlignment="start"
                      decelerationRate={0.994}
                      onMomentumScrollEnd={handleMonthScroll}
                      onScroll={handleMonthScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={styles.scrollContent}
                    >
                      <View style={styles.spacer} />
                      {MESES.map((mes) => (
                        <View key={mes.value} style={styles.pickerItem}>
                          <Text allowFontScaling={false} style={styles.pickerItemText}>{mes.label}</Text>
                        </View>
                      ))}
                      <View style={styles.spacer} />
                    </ScrollView>
                  </View>
                </View>

                {/* Año */}
                <View style={styles.pickerColumn}>
                  <Text allowFontScaling={false} style={styles.pickerLabel}>AÑO</Text>
                  <View style={styles.pickerWrapper}>
                    <ScrollView
                      ref={yearScrollRef}
                      style={styles.pickerScroll}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={yearSnapOffsets}
                      snapToAlignment="start"
                      decelerationRate={0.994}
                      onMomentumScrollEnd={handleYearScroll}
                      onScroll={handleYearScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={styles.scrollContent}
                    >
                      <View style={styles.spacer} />
                      {years.map((year) => (
                        <View key={year} style={styles.pickerItem}>
                          <Text allowFontScaling={false} style={styles.pickerItemText}>{year}</Text>
                        </View>
                      ))}
                      <View style={styles.spacer} />
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* Barra verde fija en el centro */}
              <View style={styles.selectionBar} pointerEvents="none" />
            </View>

            <View style={styles.modalFooter}>
              <Pressable onPress={handleConfirm} style={styles.confirmButton}>
                <Text allowFontScaling={false} style={styles.confirmButtonText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  required: {
    color: colors.danger,
    ...typography.bodyStrong,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: '#10B981',
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  pickersContainer: {
    position: 'relative',
    height: PICKER_HEIGHT,
  },
  pickersRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    height: '100%',
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pickerWrapper: {
    flex: 1,
    position: 'relative',
  },
  pickerScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  spacer: {
    height: SPACER_HEIGHT,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  selectionBar: {
    position: 'absolute',
    top: SPACER_HEIGHT,
    left: spacing.lg,
    right: spacing.lg,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(209, 250, 229, 0.4)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#10B981',
    borderRadius: radius.md,
  },
  modalFooter: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
