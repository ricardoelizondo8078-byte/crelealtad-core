import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  colors,
  moduleThemes,
  spacing,
  typography,
  type ModuleThemeKey,
} from '../../theme/tokens';

interface SummaryMetricsBarProps {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  moduleTheme: ModuleThemeKey;
}

export const SummaryMetricsBar: React.FC<SummaryMetricsBarProps> = ({
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  moduleTheme,
}) => {
  const theme = moduleThemes[moduleTheme];

  return (
    <View
      accessible
      accessibilityLabel={`${primaryLabel}: ${primaryValue}. ${secondaryLabel}: ${secondaryValue}.`}
      style={styles.container}
    >
      <View style={styles.primaryMetric}>
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          minimumFontScale={0.8}
          numberOfLines={1}
          style={[styles.value, { color: theme.primary }]}
        >
          {primaryValue}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.label}>
          {primaryLabel}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.secondaryMetric}>
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          minimumFontScale={0.72}
          numberOfLines={1}
          style={[styles.value, { color: theme.primary }]}
        >
          {secondaryValue}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.label}>
          {secondaryLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryMetric: {
    flex: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  secondaryMetric: {
    flex: 1.45,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  value: {
    ...typography.metricValue,
    textAlign: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
