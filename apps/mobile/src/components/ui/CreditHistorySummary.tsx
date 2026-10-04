import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { Card } from './Card';

const crelealtadLogo = require('../../../assets/logo.png');

export interface CreditHistoryCycle {
  cycleNumber: number | null;
  authorizedAmount: number;
}

export interface CreditHistoryExtreme {
  authorizedAmount: number;
  cycleNumbers: readonly number[];
}

interface CreditHistorySummaryProps {
  totalCycles: number;
  maximum: CreditHistoryExtreme;
  minimum: CreditHistoryExtreme;
  recentCycles: readonly CreditHistoryCycle[];
  simulated?: boolean;
}

const cycleReference = (cycleNumbers: readonly number[]): string => {
  if (cycleNumbers.length === 0) return 'CICLO N/D';
  if (cycleNumbers.length === 1) return `CICLO ${cycleNumbers[0]}`;
  return `CICLOS ${cycleNumbers.join(', ')}`;
};

const compactCycleReference = (cycleNumbers: readonly number[]): string => {
  if (cycleNumbers.length === 0) return 'C. N/D';
  return `C. ${cycleNumbers.join(', ')}`;
};

export const CreditHistorySummary: React.FC<CreditHistorySummaryProps> = ({
  totalCycles,
  maximum,
  minimum,
  recentCycles,
  simulated = false,
}) => {
  const safeTotalCycles = Math.max(0, Math.trunc(totalCycles));
  const cycleCountLabel = `${safeTotalCycles} ${safeTotalCycles === 1 ? 'CICLO' : 'CICLOS'}`;
  const visibleCycles = recentCycles.slice(0, 5);
  const accessibilityLabel = [
    `Historial con CRELEALTAD: ${cycleCountLabel.toLowerCase()}.`,
    `Monto máximo ${formatCurrency(maximum.authorizedAmount)}, ${cycleReference(maximum.cycleNumbers).toLowerCase()}.`,
    `Monto mínimo ${formatCurrency(minimum.authorizedAmount)}, ${cycleReference(minimum.cycleNumbers).toLowerCase()}.`,
    ...visibleCycles.map((cycle) => (
      `${cycle.cycleNumber == null ? 'Ciclo no disponible' : `Ciclo ${cycle.cycleNumber}`}: ${formatCurrency(cycle.authorizedAmount)}.`
    )),
  ].join(' ');

  return (
    <Card style={styles.card}>
      <View accessible accessibilityLabel={accessibilityLabel}>
        <View style={styles.headerRow}>
          <View style={styles.loyaltyIcon}>
            <Image source={crelealtadLogo} style={styles.loyaltyLogo} resizeMode="contain" />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>CON CRELEALTAD</Text>
            {simulated ? (
              <Text style={styles.simulationText}>SIMULACIÓN · NO GUARDADA</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.extremesColumn}>
            <View style={[styles.extremeCell, styles.maximumCell]}>
              <Text style={styles.extremeLabel}>MÁXIMO</Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
                style={styles.extremeAmount}
              >
                {formatCurrency(maximum.authorizedAmount)}
              </Text>
              <Text numberOfLines={1} style={styles.extremeCycle}>
                {compactCycleReference(maximum.cycleNumbers)}
              </Text>
            </View>
            <View style={[styles.extremeCell, styles.minimumCell]}>
              <Text style={styles.extremeLabel}>MÍNIMO</Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
                style={styles.extremeAmount}
              >
                {formatCurrency(minimum.authorizedAmount)}
              </Text>
              <Text numberOfLines={1} style={styles.extremeCycle}>
                {compactCycleReference(minimum.cycleNumbers)}
              </Text>
            </View>
          </View>

          <View style={styles.recentColumn}>
            <View style={styles.recentHeader}>
              <Text numberOfLines={1} style={styles.recentTitle}>
                ÚLTIMOS {visibleCycles.length} CICLOS
              </Text>
              <Text style={styles.recentCaption}>AUTORIZADO</Text>
            </View>
            {visibleCycles.map((cycle, index) => (
              <View
                key={`${cycle.cycleNumber ?? 'nd'}-${index}`}
                style={[
                  styles.recentCycleRow,
                  index < visibleCycles.length - 1 && styles.recentCycleDivider,
                ]}
              >
                <Text style={styles.tableCycle}>
                  {cycle.cycleNumber == null ? 'CICLO N/D' : `CICLO ${cycle.cycleNumber}`}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={styles.tableAmount}
                >
                  {formatCurrency(cycle.authorizedAmount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.info,
    backgroundColor: colors.infoSoft,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  loyaltyIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  loyaltyLogo: {
    width: 28,
    height: 28,
  },
  simulationText: {
    ...typography.notificationBadge,
    color: colors.warning,
    marginTop: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.info,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  extremesColumn: {
    flex: 0.9,
    gap: spacing.xs,
  },
  extremeCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  maximumCell: {
    backgroundColor: colors.successSoft,
    borderColor: '#86EFAC',
  },
  minimumCell: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FCA5A5',
  },
  extremeLabel: {
    ...typography.notificationBadge,
    color: colors.textSecondary,
  },
  extremeAmount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 1,
  },
  extremeCycle: {
    ...typography.notificationBadge,
    color: colors.textSecondary,
    marginTop: 1,
  },
  recentColumn: {
    flex: 1.25,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recentTitle: {
    ...typography.notificationBadge,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  recentCaption: {
    ...typography.notificationBadge,
    color: colors.textSecondary,
  },
  recentCycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recentCycleDivider: {
    borderBottomColor: '#BFDBFE',
    borderBottomWidth: 1,
  },
  tableCycle: {
    ...typography.notificationBadge,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  tableAmount: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
