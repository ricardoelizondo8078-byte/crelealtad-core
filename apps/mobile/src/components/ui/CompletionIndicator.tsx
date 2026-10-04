import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

interface CompletionIndicatorProps {
  tone?: 'positive' | 'negative';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({
  tone = 'positive',
  accessibilityLabel,
  style,
}) => {
  const negative = tone === 'negative';

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.indicator, negative && styles.negativeIndicator, style]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.symbol, negative && styles.negativeSymbol]}
      >
        {negative ? '✕' : '✓'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 2,
    borderColor: colors.success,
  },
  symbol: {
    ...typography.bodyStrong,
    color: colors.success,
  },
  negativeIndicator: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  negativeSymbol: {
    color: colors.danger,
  },
});
