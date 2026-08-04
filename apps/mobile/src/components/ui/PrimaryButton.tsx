import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { moduleThemes, ModuleThemeKey, radius, spacing, typography } from '../../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  moduleTheme?: ModuleThemeKey;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  moduleTheme = 'documentation',
  style,
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
        style,
      ]}
    >
      <Text allowFontScaling={false} style={[styles.text, { color: theme.primaryText }]}>{title || ''}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  text: {
    ...typography.bodyStrong,
  },
});
