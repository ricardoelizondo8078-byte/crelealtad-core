import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export type StatusBadgeTone = 'pending' | 'progress' | 'success' | 'error';

interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
  leadingMark?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone, leadingMark }) => (
  <View style={[styles.badge, toneStyles[tone]]}>
    {leadingMark ? (
      <View style={styles.leadingMark}>
        <Text allowFontScaling={false} style={styles.leadingMarkText}>{leadingMark}</Text>
      </View>
    ) : null}
    <Text allowFontScaling={false} style={styles.label}>{label}</Text>
  </View>
);

const toneStyles = StyleSheet.create({
  pending: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  progress: { backgroundColor: colors.gray[100], borderColor: colors.gray[500] },
  success: { backgroundColor: colors.successSoft, borderColor: colors.success },
  error: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
});

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.xxl,
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  label: { ...typography.caption, color: colors.textPrimary },
  leadingMark: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
  },
  leadingMarkText: {
    ...typography.notificationBadge,
    color: colors.textPrimary,
  },
});
