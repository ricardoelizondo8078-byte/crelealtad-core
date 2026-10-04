import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { layout, spacing } from '../../theme/tokens';
import type { StatusKey } from '../../theme/tokens';
import { Card } from './Card';
import { StatusStripe } from './StatusStripe';

interface StatusCardProps {
  children: React.ReactNode;
  status: StatusKey;
  compact?: boolean;
  narrowStripe?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  children,
  status,
  compact = false,
  narrowStripe = false,
  style,
}) => (
  <Card style={[style, styles.card, compact && styles.compactCard]}>
    <StatusStripe status={status} narrow={narrowStripe} />
    <View
      style={[
        styles.content,
        narrowStripe && styles.narrowStripeContent,
        compact && styles.compactContent,
      ]}
    >
      {children}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    minHeight: layout.statusCardMinHeight,
    padding: 0,
    overflow: 'hidden',
  },
  compactCard: {
    minHeight: 0,
  },
  content: {
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
    paddingLeft: layout.statusStripeWidth + spacing.md,
  },
  narrowStripeContent: {
    paddingLeft: layout.statusStripeNarrowWidth + spacing.md,
  },
  compactContent: {
    paddingVertical: spacing.md,
  },
});
