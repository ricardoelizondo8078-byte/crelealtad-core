import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import {
  colors,
  radius,
  spacing,
  statusColors,
  typography,
} from '../../theme/tokens';
import type { StatusKey } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { StatusCard } from './StatusCard';
import { StatusTab } from './StatusTab';
import { StatusBadge } from './StatusBadge';

type AmountNoteTone = 'neutral' | 'positive' | 'negative';

interface IntegranteCardProps {
  name: string;
  position: number;
  total: number;
  phone?: string | null;
  age?: number | null;
  ageWarning?: boolean;
  completedSteps: number;
  totalSteps?: number;
  previousCreditAmount?: number | null;
  requestedAmount?: number | null;
  verifiedAmount?: number | null;
  distanceToTreasurerLabel?: string | null;
  distanceToTreasurerWarning?: boolean;
  status: StatusKey;
  isNewMember?: boolean;
  amountNote?: {
    label: string;
    tone?: AmountNoteTone;
  } | null;
  roleLabel?: string;
  roleMark?: string;
  disabled?: boolean;
  muted?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
}

const clampProgress = (completedSteps: number, totalSteps: number): number => {
  if (!Number.isFinite(completedSteps)) return 0;
  return Math.min(Math.max(completedSteps, 0), totalSteps);
};

export const IntegranteCard: React.FC<IntegranteCardProps> = ({
  name,
  position,
  total,
  phone,
  age,
  ageWarning = false,
  completedSteps,
  totalSteps = 7,
  previousCreditAmount,
  requestedAmount,
  verifiedAmount,
  distanceToTreasurerLabel,
  distanceToTreasurerWarning = false,
  status,
  isNewMember = false,
  amountNote,
  roleLabel,
  roleMark,
  disabled = false,
  muted = false,
  accessibilityLabel,
  onPress,
  style,
}) => {
  const safeTotalSteps = Math.max(totalSteps, 1);
  const safeCompletedSteps = clampProgress(completedSteps, safeTotalSteps);
  const progressWidth = `${(safeCompletedSteps / safeTotalSteps) * 100}%` as `${number}%`;
  const isComplete = safeCompletedSteps >= safeTotalSteps;
  const effectiveStatus = isNewMember && status === 'neutral' ? 'newMember' : status;
  const showNewMemberTab = isNewMember && effectiveStatus !== 'newMember';
  const formattedDistance = distanceToTreasurerLabel?.trim() ?? '';
  const showDistance = formattedDistance.length > 0;
  const handlePress = useProcessingAction(onPress);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled || !onPress}
      onPress={handlePress}
    >
      {showNewMemberTab ? (
        <StatusTab
          status="newMember"
          accessibilityLabel="Integrante nueva con CRELEALTAD"
        />
      ) : null}
      <StatusCard
        narrowStripe
        status={effectiveStatus}
        style={[styles.card, (disabled || muted) && styles.disabledCard, style]}
      >
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text allowFontScaling={false} numberOfLines={2} style={styles.name}>
              {name || 'Sin nombre'}
            </Text>
            {roleLabel ? (
              <View style={styles.roleBadge}>
                <StatusBadge
                  label={roleLabel.toUpperCase()}
                  leadingMark={roleMark}
                  tone="pending"
                />
              </View>
            ) : null}
          </View>
          <Text allowFontScaling={false} style={styles.position}>
            {position}/{total}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text allowFontScaling={false} style={styles.progressLabel}>
              {isComplete
                ? `Completo ${safeTotalSteps}/${safeTotalSteps}`
                : `${safeCompletedSteps} de ${safeTotalSteps} completos`}
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.previousCredit}>
              Crédito anterior: {previousCreditAmount == null
                ? 'Sin registro'
                : formatCurrency(previousCreditAmount)}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                isComplete ? styles.progressComplete : styles.progressIncomplete,
                { width: progressWidth },
              ]}
            />
          </View>
        </View>

        <View style={styles.contactRow}>
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.meta, styles.phone]}>
            Teléfono: {formatPhone(phone ?? '')}
          </Text>
          <View style={[styles.ageContainer, ageWarning && styles.ageWarning]}>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.ageText}>
              {age == null ? '—' : `${age} AÑOS`}
            </Text>
          </View>
        </View>

        <View style={styles.requestedAmountRow}>
          <Text allowFontScaling={false} style={styles.meta}>
            Monto solicitado: {requestedAmount == null ? '' : formatCurrency(requestedAmount)}
          </Text>
          {amountNote ? (
            <Text
              allowFontScaling={false}
              style={[
                styles.amountNote,
                amountNote.tone === 'positive' && styles.amountNotePositive,
                amountNote.tone === 'negative' && styles.amountNoteNegative,
              ]}
            >
              {amountNote.label}
            </Text>
          ) : null}
        </View>

        <View style={styles.verifiedRow}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.meta, styles.verifiedAmount]}
          >
            Monto verificado: {verifiedAmount == null ? '' : formatCurrency(verifiedAmount)}
          </Text>
          {showDistance ? (
            <View
              accessibilityLabel={`${formattedDistance} en línea recta respecto al domicilio de la tesorera`}
              style={[
                styles.distanceBadge,
                distanceToTreasurerWarning && styles.distanceBadgeWarning,
              ]}
            >
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[
                  styles.distanceText,
                  distanceToTreasurerWarning && styles.distanceTextWarning,
                ]}
              >
                {formattedDistance}
              </Text>
            </View>
          ) : null}
        </View>
      </StatusCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: colors.gray[100],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  roleBadge: {
    marginTop: spacing.xs,
  },
  position: {
    flexShrink: 0,
    color: colors.textPrimary,
    ...typography.sectionTitle,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  previousCredit: {
    flexShrink: 1,
    color: colors.textSecondary,
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressTrack: {
    height: spacing.sm,
    backgroundColor: colors.borderSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  progressIncomplete: {
    backgroundColor: colors.brandYellow,
  },
  progressComplete: {
    backgroundColor: statusColors.completed.background,
  },
  meta: {
    color: colors.textSecondary,
    ...typography.body,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  phone: {
    flex: 1,
  },
  ageContainer: {
    flexShrink: 0,
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ageWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  ageText: {
    color: colors.textPrimary,
    ...typography.caption,
    fontWeight: '700',
  },
  requestedAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  amountNote: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    ...typography.bodyStrong,
  },
  amountNotePositive: {
    color: colors.success,
  },
  amountNoteNegative: {
    color: colors.danger,
  },
  verifiedAmount: {
    marginTop: spacing.xs,
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  distanceBadge: {
    flexShrink: 0,
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  distanceText: {
    color: colors.info,
    ...typography.caption,
    fontWeight: '700',
  },
  distanceBadgeWarning: {
    backgroundColor: colors.dangerSoft,
    borderColor: statusColors.rejected.background,
    borderWidth: 1,
  },
  distanceTextWarning: {
    color: statusColors.rejected.background,
  },
});
