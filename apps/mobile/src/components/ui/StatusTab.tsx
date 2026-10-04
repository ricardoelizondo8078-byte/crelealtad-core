import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  colors,
  layout,
  radius,
  spacing,
  statusColors,
  typography,
} from '../../theme/tokens';
import type { StatusKey } from '../../theme/tokens';
import { statusLabels } from './status-labels';

interface StatusTabProps {
  status: StatusKey;
  accessibilityLabel?: string;
  flushLeft?: boolean;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  status,
  accessibilityLabel,
  flushLeft = false,
}) => {
  const label = statusLabels[status];
  const palette = statusColors[status];

  if (!label) return null;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      pointerEvents="none"
      style={[
        styles.tab,
        flushLeft && styles.flushLeft,
        {
          backgroundColor: palette.background,
          borderColor: colors.textPrimary,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.label, { color: palette.foreground }]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tab: {
    alignSelf: 'flex-start',
    minWidth: layout.statusTabMinWidth,
    marginLeft: layout.statusStripeNarrowWidth,
    marginBottom: -layout.statusCardBorderWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: layout.statusCardBorderWidth,
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  flushLeft: {
    marginLeft: 0,
  },
});
