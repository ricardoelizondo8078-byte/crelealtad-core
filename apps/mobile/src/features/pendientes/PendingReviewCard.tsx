import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusCard } from '../../components/ui';
import { PendingReviewGroup } from '../../context/PendingReviewsContext';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatPendingAge } from './pending-review.utils';

interface PendingReviewCardProps {
  pending: PendingReviewGroup;
  onPress: () => void;
}

export const PendingReviewCard: React.FC<PendingReviewCardProps> = ({ pending, onPress }) => {
  const memberLabel = pending.integrantes_pendientes === 1 ? 'integrante' : 'integrantes';
  const age = formatPendingAge(pending.solicitado_desde);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Revisar documentación del grupo ${pending.grupo_nombre}. ${pending.integrantes_pendientes} ${memberLabel} pendientes, ${age}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <StatusCard status="needsDocumentationGroup" compact narrowStripe>
        <View style={styles.headingRow}>
          <Text allowFontScaling={false} style={styles.status}>REVISAR DOCUMENTACIÓN</Text>
          <Text allowFontScaling={false} style={styles.openLabel}>Abrir</Text>
        </View>
        <Text allowFontScaling={false} style={styles.groupName}>{pending.grupo_nombre}</Text>
        <Text allowFontScaling={false} style={styles.meta}>
          {pending.integrantes_pendientes} {memberLabel} · {age}
        </Text>
      </StatusCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.84,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  status: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  openLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  groupName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
