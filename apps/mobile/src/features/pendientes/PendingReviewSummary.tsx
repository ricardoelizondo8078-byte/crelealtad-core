import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SecondaryButton, SectionTitle } from '../../components/ui';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { PendingReviewCard } from './PendingReviewCard';

export const PendingReviewSummary: React.FC = () => {
  const {
    groups,
    totalPending,
    error,
    refresh,
    openInbox,
    openExpediente,
  } = usePendingReviews();

  if (error && totalPending === 0) {
    return (
      <Card>
        <SectionTitle title="Pendientes para ti" />
        <Text allowFontScaling={false} style={styles.errorText}>
          No pudimos actualizar tus revisiones documentales. Tus demás módulos siguen disponibles.
        </Text>
        <SecondaryButton title="Reintentar" onPress={refresh} style={styles.button} />
      </Card>
    );
  }

  if (totalPending === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <SectionTitle title="Pendientes para ti" />
        <View style={styles.countPill}>
          <Text allowFontScaling={false} style={styles.countText}>{totalPending}</Text>
        </View>
      </View>
      <Text allowFontScaling={false} style={styles.helperText}>
        Abre un grupo para atender los documentos observados.
      </Text>
      {error ? (
        <Text allowFontScaling={false} style={styles.warningText}>
          Se conserva la última información disponible porque no fue posible actualizarla.
        </Text>
      ) : null}
      <View style={styles.cards}>
        {groups.slice(0, 2).map((pending) => (
          <PendingReviewCard
            key={pending.expediente_id}
            pending={pending}
            onPress={() => openExpediente(pending.expediente_id)}
          />
        ))}
      </View>
      <SecondaryButton
        title={groups.length > 2 ? `Ver todos (${groups.length} grupos)` : 'Ver todos los pendientes'}
        onPress={openInbox}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  countPill: {
    minWidth: layout.notificationCountPillMinSize,
    minHeight: layout.notificationCountPillMinSize,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  helperText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cards: {
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
  button: {
    flex: 0,
    marginTop: spacing.xs,
  },
});
