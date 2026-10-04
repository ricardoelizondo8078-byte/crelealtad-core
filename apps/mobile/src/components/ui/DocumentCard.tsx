import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { StatusBadge, StatusBadgeTone } from './StatusBadge';

interface DocumentCardProps {
  name: string;
  required?: boolean;
  statusLabel: string;
  statusTone: StatusBadgeTone;
  hint?: string;
  primaryLabel: string;
  onPrimary: () => void;
  onView?: () => void;
  disabled?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  name,
  required = false,
  statusLabel,
  statusTone,
  hint,
  primaryLabel,
  onPrimary,
  onView,
  disabled,
}) => (
  <Card style={styles.card}>
    <View style={styles.header}>
      <View style={styles.info}>
        <Text allowFontScaling={false} style={styles.name}>{name}</Text>
        <Text allowFontScaling={false} style={styles.meta}>{required ? 'Requerido' : 'Opcional'}</Text>
        {hint ? <Text allowFontScaling={false} style={styles.hint}>{hint}</Text> : null}
      </View>
      <StatusBadge label={statusLabel} tone={statusTone} />
    </View>
    <View style={styles.actions}>
      {onView ? <SecondaryButton title="Ver" onPress={onView} disabled={disabled} /> : null}
      <PrimaryButton title={primaryLabel} onPress={onPrimary} disabled={disabled} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
