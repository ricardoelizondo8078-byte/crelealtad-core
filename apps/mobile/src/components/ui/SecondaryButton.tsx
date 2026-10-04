import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import {
  colors,
  layout,
  moduleThemes,
  ModuleThemeKey,
  radius,
  spacing,
  touchTargets,
  typography,
} from '../../theme/tokens';

interface SecondaryButtonProps {
  title: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  style?: ViewStyle;
  tone?: 'default' | 'danger';
  leadingIcon?: React.ReactNode;
  trailingContent?: React.ReactNode;
  accessibilityLabel?: string;
  moduleTheme?: ModuleThemeKey;
  size?: 'default' | 'large';
  contentLayout?: 'centered' | 'columns';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  tone = 'default',
  leadingIcon,
  trailingContent,
  accessibilityLabel,
  moduleTheme,
  size = 'default',
  contentLayout = 'centered',
}) => {
  const isDanger = tone === 'danger';
  const isLarge = size === 'large';
  const usesColumns = contentLayout === 'columns';
  const theme = moduleTheme ? moduleThemes[moduleTheme] : null;
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
        isLarge && styles.largeButton,
        theme && styles.moduleButton,
        theme && { borderColor: theme.primary },
        isDanger && styles.dangerButton,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={[styles.content, usesColumns && styles.columnContent]}>
        {usesColumns && leadingIcon ? (
          <View style={styles.columnLeading}>{leadingIcon}</View>
        ) : leadingIcon}
        <Text
          allowFontScaling={false}
          style={[
            styles.text,
            isLarge && styles.largeText,
            usesColumns && styles.columnText,
            isDanger && styles.dangerText,
          ]}
        >
          {title || ''}
        </Text>
        {usesColumns && trailingContent ? (
          <View style={styles.columnTrailing}>{trailingContent}</View>
        ) : trailingContent}
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  columnContent: {
    width: '100%',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  columnLeading: {
    width: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnText: {
    flex: 1,
    textAlign: 'center',
  },
  columnTrailing: {
    width: layout.buttonTrailingIndicatorWidth,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  largeButton: {
    minHeight: touchTargets.largeAction,
    paddingVertical: spacing.lg,
  },
  largeText: {
    ...typography.sectionTitle,
  },
  moduleButton: {
    borderWidth: 2,
  },
  dangerButton: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  dangerText: {
    color: colors.danger,
  },
});
