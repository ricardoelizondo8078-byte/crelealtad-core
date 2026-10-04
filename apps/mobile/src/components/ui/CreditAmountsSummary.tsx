import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

interface CreditAmountsSummaryProps {
  previousAmount?: number | null;
  requestedAmount?: number | null;
}

export const CreditAmountsSummary: React.FC<CreditAmountsSummaryProps> = ({
  previousAmount,
  requestedAmount,
}) => {
  const trend = previousAmount != null && requestedAmount != null
    ? requestedAmount > previousAmount
      ? 'up'
      : requestedAmount < previousAmount
        ? 'down'
        : null
    : null;
  const difference = trend && previousAmount != null && requestedAmount != null
    ? Math.abs(requestedAmount - previousAmount)
    : null;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Crédito anterior: ${
        previousAmount == null ? 'sin registro' : formatCurrency(previousAmount)
      }. Monto solicitado: ${
        requestedAmount == null ? 'sin capturar' : formatCurrency(requestedAmount)
      }${trend === 'up' && difference != null
        ? `, aumenta en ${formatCurrency(difference)}`
        : trend === 'down' && difference != null
          ? `, disminuye en ${formatCurrency(difference)}`
          : ''}.`}
    >
      <View style={styles.amountItem}>
        <Text allowFontScaling={false} style={styles.label}>Crédito anterior</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.previousValue}>
          {previousAmount == null ? 'Sin registro' : formatCurrency(previousAmount)}
        </Text>
      </View>

      <View style={[styles.amountItem, styles.requestedItem]}>
        <Text allowFontScaling={false} style={styles.label}>Monto solicitado</Text>
        <View style={styles.requestedValueRow}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.requestedValue}>
            {requestedAmount == null ? 'Sin capturar' : formatCurrency(requestedAmount)}
          </Text>
          {trend ? (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[styles.trendArrow, trend === 'up' ? styles.trendUp : styles.trendDown]}
            >
              {trend === 'up' ? '↑' : '↓'} {formatCurrency(difference)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  amountItem: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  requestedItem: {
    backgroundColor: colors.infoSoft,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previousValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 2,
  },
  requestedValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  requestedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 2,
  },
  trendArrow: {
    ...typography.bodyStrong,
    fontWeight: '800',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  trendUp: {
    color: colors.success,
  },
  trendDown: {
    color: colors.danger,
  },
});
