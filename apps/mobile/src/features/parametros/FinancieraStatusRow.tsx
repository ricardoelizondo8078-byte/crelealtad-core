import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import {
  CLASIFICACIONES_FINANCIERA,
  type ClasificacionFinanciera,
} from './parametros-financieras.model';

interface FinancieraStatusRowProps {
  alias: string;
  clasificacion: ClasificacionFinanciera | null;
  onPress: () => void;
  testID?: string;
}

const dotToneByClassification: Record<ClasificacionFinanciera, {
  backgroundColor: string;
  borderColor: string;
}> = {
  OBJETIVO: { backgroundColor: colors.successSoft, borderColor: colors.success },
  REVISION: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  NO_PRIORITARIA: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
};

export const FinancieraStatusRow: React.FC<FinancieraStatusRowProps> = ({
  alias,
  clasificacion,
  onPress,
  testID,
}) => {
  const statusLabel = clasificacion
    ? CLASIFICACIONES_FINANCIERA[clasificacion].choiceLabel
    : 'Sin clasificación';
  const dotTone = clasificacion ? dotToneByClassification[clasificacion] : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${alias}. ${statusLabel}`}
      accessibilityHint="Abre los datos y la clasificación de la financiera"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text allowFontScaling={false} numberOfLines={1} style={styles.alias}>
        {alias}
      </Text>
      <View
        testID={testID ? `${testID}-indicator` : undefined}
        style={[
          styles.indicator,
          dotTone,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.gray[100],
  },
  alias: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  indicator: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.gray[400],
    backgroundColor: colors.surface,
  },
});
