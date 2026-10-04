import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

type SelectionIndicatorState = 'selected' | 'pending' | 'excluded';

interface SelectionIndicatorProps {
  state: SelectionIndicatorState;
}

const symbols: Record<SelectionIndicatorState, string> = {
  selected: '✓',
  pending: '!',
  excluded: '—',
};

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({ state }) => (
  <View
    accessible
    accessibilityLabel={
      state === 'selected' ? 'Participa' : state === 'pending' ? 'Pendiente' : 'No participa'
    }
    style={[styles.base, styles[state]]}
  >
    <Text allowFontScaling={false} style={[styles.symbol, state === 'selected' && styles.selectedSymbol]}>
      {symbols[state]}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  base: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pending: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  excluded: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  symbol: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  selectedSymbol: {
    color: colors.white,
  },
});
