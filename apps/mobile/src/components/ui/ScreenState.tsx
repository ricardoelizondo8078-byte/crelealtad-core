import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { Card } from './Card';
import { SecondaryButton } from './SecondaryButton';

interface ScreenStateProps {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export const ScreenState: React.FC<ScreenStateProps> = ({ title, message, loading, actionLabel, onAction }) => (
  <View style={styles.container}>
    <Card>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      <Text allowFontScaling={false} style={styles.title}>{title}</Text>
      {message ? <Text allowFontScaling={false} style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <SecondaryButton title={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  loader: { marginBottom: spacing.md },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  action: { marginTop: spacing.lg, flex: 0, alignSelf: 'stretch' },
});
