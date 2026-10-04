import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import { moduleThemes, ModuleThemeKey, radius, spacing, touchTargets, typography } from '../../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  moduleTheme?: ModuleThemeKey;
  leadingIcon?: React.ReactNode;
  trailingContent?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  moduleTheme = 'documentation',
  leadingIcon,
  trailingContent,
  accessibilityLabel,
  style,
}) => {
  const theme = moduleThemes[moduleTheme];
  const handlePress = useProcessingAction(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        {leadingIcon}
        <Text allowFontScaling={false} style={[styles.text, { color: theme.primaryText }]}>
          {title || ''}
        </Text>
        {trailingContent}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: touchTargets.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.bodyStrong,
  },
});
