import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import { moduleThemes, ModuleTheme, ModuleThemeKey, radius, spacing, touchTargets, typography } from '../../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  moduleTheme?: ModuleThemeKey;
  leadingIcon?: React.ReactNode;
  trailingContent?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
  themeOverride?: ModuleTheme;
  size?: 'default' | 'compact';
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
  themeOverride,
  size = 'default',
}) => {
  const theme = themeOverride ?? moduleThemes[moduleTheme];
  const handlePress = useProcessingAction(onPress);
  const isCompact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isCompact && styles.compactButton,
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
  compactButton: {
    flex: 0,
    minHeight: touchTargets.minimum,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxl,
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
