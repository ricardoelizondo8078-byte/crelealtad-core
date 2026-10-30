import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';

export type SemanticChoiceTone = 'positive' | 'warning' | 'negative';

export interface SemanticChoiceOption {
  value: string;
  label: string;
  description: string;
  symbol: string;
  tone: SemanticChoiceTone;
}

interface SemanticChoiceGroupProps {
  value: string | null;
  options: readonly SemanticChoiceOption[];
  disabled?: boolean;
  allowClear?: boolean;
  onSelect: (value: string | null) => void;
}

const toneStyles: Record<SemanticChoiceTone, {
  borderColor: string;
  backgroundColor: string;
  foregroundColor: string;
}> = {
  positive: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
    foregroundColor: colors.primary,
  },
  warning: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
    foregroundColor: colors.gray[800],
  },
  negative: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    foregroundColor: colors.danger,
  },
};

export const SemanticChoiceGroup: React.FC<SemanticChoiceGroupProps> = ({
  value,
  options,
  disabled = false,
  allowClear = false,
  onSelect,
}) => (
  <View
    accessibilityRole="radiogroup"
    style={[styles.group, disabled && styles.disabled]}
  >
    {options.map((option) => {
      const selected = value === option.value;
      const tone = toneStyles[option.tone];

      return (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={`${option.label}. ${option.description}`}
          accessibilityHint={allowClear && selected
            ? 'Toca nuevamente para dejar la clasificación vacía'
            : undefined}
          accessibilityState={{ selected, disabled }}
          disabled={disabled}
          onPress={() => onSelect(allowClear && selected ? null : option.value)}
          style={({ pressed }) => [
            styles.option,
            selected && {
              borderColor: tone.borderColor,
              backgroundColor: tone.backgroundColor,
            },
            pressed && styles.pressed,
          ]}
        >
          <View
            testID={`semantic-choice-indicator-${option.value}`}
            style={[
              styles.indicator,
              {
                borderColor: tone.borderColor,
                backgroundColor: selected ? tone.borderColor : tone.backgroundColor,
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.symbol,
                selected && styles.selectedSymbol,
              ]}
            >
              {selected ? option.symbol : ''}
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={[
              styles.label,
              selected && { color: tone.foregroundColor },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: touchTargets.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[400],
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.82,
  },
  indicator: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[400],
    borderRadius: 19,
  },
  symbol: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  selectedSymbol: {
    color: colors.white,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
