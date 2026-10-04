import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import {
  colors,
  moduleThemes,
  ModuleThemeKey,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';
import { Card } from './Card';
import { CompletionIndicator } from './CompletionIndicator';

interface TaskMenuButtonProps {
  title: string;
  iconLabel: string;
  moduleTheme: ModuleThemeKey;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  completed?: boolean;
  result?: 'positive' | 'negative';
  accessibilityHint?: string;
}

export const TaskMenuButton: React.FC<TaskMenuButtonProps> = ({
  title,
  iconLabel,
  moduleTheme,
  onPress,
  disabled = false,
  completed = false,
  result,
  accessibilityHint,
}) => {
  const theme = moduleThemes[moduleTheme];
  const handlePress = useProcessingAction(onPress);
  const resultIsNegative = result === 'negative';
  const showIndicator = completed || result !== undefined;
  const accessibilityStatus = result === 'positive'
    ? 'Resultado: Sí'
    : result === 'negative'
      ? 'Resultado: No'
      : completed
        ? 'Realizado'
        : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityStatus ? `${title}. ${accessibilityStatus}` : title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Card style={[styles.card, { borderColor: theme.headerBg }]}>
        <View style={[styles.icon, { backgroundColor: theme.headerAccent }]}>
          <Text allowFontScaling={false} style={styles.iconText}>
            {iconLabel}
          </Text>
        </View>

        <Text allowFontScaling={false} style={styles.title}>
          {title}
        </Text>

        {showIndicator ? (
          <CompletionIndicator tone={resultIsNegative ? 'negative' : 'positive'} />
        ) : null}

        <Text
          allowFontScaling={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.chevron, { color: theme.primary }]}
        >
          ›
        </Text>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    minHeight: touchTargets.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  card: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    paddingVertical: spacing.md,
  },
  icon: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  chevron: {
    ...typography.title,
  },
});
