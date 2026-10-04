import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, StatusBadge } from '../../components/ui';
import { useProcessingAction } from '../../context/ProcessingContext';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { RenovacionGrupo } from './renovacion.types';

interface Props {
  grupo: RenovacionGrupo;
  busy: boolean;
  disabled: boolean;
  onPress: () => void | Promise<void>;
}

export const RenovacionGroupCard: React.FC<Props> = ({ grupo, busy, disabled, onPress }) => {
  const handlePress = useProcessingAction(onPress, 'Creando expediente…');

  return (
    <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${grupo.nombre}. ${busy ? 'Creando expediente' : grupo.puede_renovar ? 'Toca para renovar' : grupo.motivo_bloqueo}`}
    accessibilityState={{ disabled, busy }}
    disabled={disabled}
    onPress={handlePress}
    style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
  >
    <Card style={[styles.card, !grupo.vigente_en_corte && styles.pastCard, busy && styles.selected]}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>{grupo.nombre}</Text>
        <StatusBadge
          label={`${grupo.vigente_en_corte ? 'VIGENTE' : 'PASADO'} · CICLO ${grupo.ultimo_ciclo}`}
          tone={grupo.vigente_en_corte ? 'success' : 'progress'}
        />
      </View>
      <View style={styles.metrics}>
        <Text allowFontScaling={false} style={styles.metric}>{grupo.numero_integrantes ?? 0} integrantes</Text>
        <Text allowFontScaling={false} style={styles.metric}>{formatCurrency(grupo.prestamo_grupal)}</Text>
      </View>
      {busy ? <StatusBadge label="CREANDO EXPEDIENTE..." tone="progress" /> : null}
      {!grupo.puede_renovar ? (
        <View style={styles.blocked}>
          <StatusBadge label="DATOS PENDIENTES" tone="pending" />
          <Text allowFontScaling={false} style={styles.reason}>{grupo.motivo_bloqueo}</Text>
        </View>
      ) : null}
    </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  pressed: { opacity: 0.85 },
  card: { borderWidth: 1 },
  pastCard: { backgroundColor: colors.gray[100], borderColor: colors.gray[300] },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  metric: { ...typography.bodyStrong, color: colors.textSecondary },
  blocked: { marginTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.md },
  reason: { ...typography.caption, color: colors.textSecondary },
});
