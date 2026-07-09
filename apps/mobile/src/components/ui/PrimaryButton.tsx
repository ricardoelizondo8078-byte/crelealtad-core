import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { moduleThemes, ModuleThemeKey, radius, spacing, typography } from '../../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  moduleTheme?: ModuleThemeKey;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  moduleTheme = 'documentation',
}) => {
  const theme = moduleThemes[moduleTheme];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
      ]}
    >
      <Text style={[styles.text, { color: theme.primaryText }]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  text: {
    ...typography.bodyStrong,
  },
});
