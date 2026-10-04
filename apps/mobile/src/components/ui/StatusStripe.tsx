import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { layout, spacing, statusColors, typography } from '../../theme/tokens';
import type { StatusKey } from '../../theme/tokens';
import { statusLabels } from './status-labels';

interface StatusStripeProps {
  status: StatusKey;
  narrow?: boolean;
}

export const StatusStripe: React.FC<StatusStripeProps> = ({ status, narrow = false }) => {
  const palette = statusColors[status];
  const label = statusLabels[status];
  const stripeWidth = narrow ? layout.statusStripeNarrowWidth : layout.statusStripeWidth;
  const usesLongLabel = label.length > 14;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.stripe, { width: stripeWidth, backgroundColor: palette.background }]}
    >
      {label ? (
        <View style={[styles.labelRotator, { height: stripeWidth }]}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.label,
              usesLongLabel && styles.longLabel,
              { color: palette.foreground },
            ]}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  labelRotator: {
    position: 'absolute',
    width: layout.statusStripeLabelLength,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  label: {
    width: '100%',
    flexShrink: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: spacing.xs / 8,
    ...typography.caption,
    fontWeight: '700',
  },
  longLabel: {
    fontSize: 10,
    letterSpacing: 0,
  },
});
