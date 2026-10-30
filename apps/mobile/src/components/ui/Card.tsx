import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  colors,
  moduleThemes,
  ModuleThemeKey,
  ModuleTheme,
  radius,
  shadows,
  spacing,
} from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'warning' | 'accent' | 'outlined';
  moduleTheme?: ModuleThemeKey;
  themeOverride?: ModuleTheme;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  moduleTheme = 'general',
  themeOverride,
}) => {
  const theme = themeOverride ?? moduleThemes[moduleTheme];

  return (
    <View
      style={[
        styles.card,
        variant === 'warning' && styles.warningCard,
        variant === 'accent' && styles.accentCard,
        variant === 'outlined' && styles.outlinedCard,
        variant === 'accent' && {
          backgroundColor: theme.headerAccent,
          borderColor: theme.primary,
        },
        variant === 'outlined' && {
          borderColor: theme.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  warningCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  accentCard: {
    borderWidth: 2,
  },
  outlinedCard: {
    borderWidth: 2,
  },
});
