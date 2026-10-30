import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';

export type SummaryStatusTone = 'positive' | 'negative' | 'neutral';

interface SummaryStatusRowProps {
  title: string;
  detail?: string;
  tone: SummaryStatusTone;
}

export const SummaryStatusRow: React.FC<SummaryStatusRowProps> = ({
  title,
  detail,
  tone,
}) => {
  const stateLabel = tone === 'positive'
    ? 'Resultado positivo'
    : tone === 'negative'
      ? 'Resultado negativo'
      : 'Información pendiente';

  return (
    <View
      accessible
      accessibilityLabel={`${stateLabel}: ${title}${detail ? `. ${detail}` : ''}`}
      style={[
        styles.row,
        tone === 'positive' && styles.positiveRow,
        tone === 'negative' && styles.negativeRow,
        tone === 'neutral' && styles.neutralRow,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.mark,
          tone === 'positive' && styles.positiveText,
          tone === 'negative' && styles.negativeText,
          tone === 'neutral' && styles.neutralText,
        ]}
      >
        {tone === 'positive' ? '✓' : tone === 'negative' ? '✕' : '•'}
      </Text>
      <View style={styles.copy}>
        <Text
          allowFontScaling={false}
          style={[
            styles.title,
            tone === 'positive' && styles.positiveText,
            tone === 'negative' && styles.negativeText,
            tone === 'neutral' && styles.neutralText,
          ]}
        >
          {title}
        </Text>
        {detail ? (
          <Text
            allowFontScaling={false}
            style={[
              styles.detail,
              tone === 'positive' && styles.positiveText,
              tone === 'negative' && styles.negativeText,
              tone === 'neutral' && styles.neutralText,
            ]}
          >
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  positiveRow: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  negativeRow: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  neutralRow: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[500],
  },
  mark: {
    ...typography.sectionTitle,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
  },
  detail: {
    ...typography.captionStrong,
    marginTop: spacing.xs,
  },
  positiveText: {
    color: colors.primary,
  },
  negativeText: {
    color: colors.danger,
  },
  neutralText: {
    color: colors.gray[700],
  },
});
