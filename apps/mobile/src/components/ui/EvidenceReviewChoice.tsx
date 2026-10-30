import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  spacing,
  statusColors,
  touchTargets,
  typography,
} from '../../theme/tokens';

export type EvidenceReviewValue = 'rejected' | 'attention' | 'approved' | null;

interface EvidenceReviewChoiceProps {
  value: EvidenceReviewValue;
  onChange: (value: Exclude<EvidenceReviewValue, null>) => void;
  disabled?: boolean;
}

export const EvidenceReviewChoice: React.FC<EvidenceReviewChoiceProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <View
    testID="evidence-review-choice"
    accessibilityRole="radiogroup"
    style={styles.container}
  >
    <Text allowFontScaling={false} style={styles.label}>Revisa</Text>

    <Pressable
      accessibilityRole="radio"
      accessibilityLabel="Marcar evidencia para revisar"
      accessibilityState={{ checked: value === 'rejected' }}
      disabled={disabled}
      onPress={() => onChange('rejected')}
      style={({ pressed }) => [
        styles.choice,
        styles.rejectedChoice,
        value === 'rejected' && styles.selectedChoice,
        value === 'rejected' && styles.selectedRejectedChoice,
        disabled && styles.disabledChoice,
        pressed && styles.pressedChoice,
      ]}
    >
      <Text allowFontScaling={false} style={[
        styles.symbol,
        styles.rejectedSymbol,
        value === 'rejected' && styles.selectedLightSymbol,
      ]}>✕</Text>
    </Pressable>

    <Pressable
      accessibilityRole="radio"
      accessibilityLabel="Calificar evidencia en amarillo"
      accessibilityState={{ checked: value === 'attention' }}
      disabled={disabled}
      onPress={() => onChange('attention')}
      style={({ pressed }) => [
        styles.choice,
        styles.attentionChoice,
        value === 'attention' && styles.selectedChoice,
        value === 'attention' && styles.selectedAttentionChoice,
        disabled && styles.disabledChoice,
        pressed && styles.pressedChoice,
      ]}
    >
      <Text allowFontScaling={false} style={[styles.symbol, styles.attentionSymbol]}>!</Text>
    </Pressable>

    <Pressable
      accessibilityRole="radio"
      accessibilityLabel="Marcar evidencia como revisada"
      accessibilityState={{ checked: value === 'approved' }}
      disabled={disabled}
      onPress={() => onChange('approved')}
      style={({ pressed }) => [
        styles.choice,
        styles.approvedChoice,
        value === 'approved' && styles.selectedChoice,
        value === 'approved' && styles.selectedApprovedChoice,
        disabled && styles.disabledChoice,
        pressed && styles.pressedChoice,
      ]}
    >
      <Text allowFontScaling={false} style={[
        styles.symbol,
        styles.approvedSymbol,
        value === 'approved' && styles.selectedLightSymbol,
      ]}>✓</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: touchTargets.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    paddingLeft: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  choice: {
    width: touchTargets.primary,
    height: touchTargets.primary,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedChoice: {
    backgroundColor: colors.dangerSoft,
    borderColor: statusColors.rejected.background,
  },
  approvedChoice: {
    backgroundColor: colors.successSoft,
    borderColor: statusColors.completed.background,
  },
  attentionChoice: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  selectedChoice: {
    borderWidth: 3,
  },
  selectedRejectedChoice: {
    backgroundColor: statusColors.rejected.background,
  },
  selectedAttentionChoice: {
    backgroundColor: colors.warning,
  },
  selectedApprovedChoice: {
    backgroundColor: statusColors.completed.background,
  },
  pressedChoice: {
    opacity: 0.82,
  },
  disabledChoice: {
    opacity: 0.55,
  },
  symbol: {
    ...typography.sectionTitle,
  },
  rejectedSymbol: {
    color: statusColors.rejected.background,
  },
  approvedSymbol: {
    color: statusColors.completed.background,
  },
  attentionSymbol: {
    color: colors.textPrimary,
  },
  selectedLightSymbol: {
    color: colors.white,
  },
});
