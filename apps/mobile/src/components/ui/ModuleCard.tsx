import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useProcessingAction } from '../../context/ProcessingContext';
import { colors, iconSizes, layout, moduleThemes, ModuleThemeKey, radius, spacing, typography } from '../../theme/tokens';
import { Card } from './Card';

interface ModuleCardProps {
  title: string;
  description: string;
  iconLabel: string;
  moduleTheme: ModuleThemeKey;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  statusLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  iconLabel,
  moduleTheme,
  onPress,
  disabled = false,
  statusLabel,
  style,
}) => {
  const theme = moduleThemes[moduleTheme];
  const handlePress = useProcessingAction(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}${statusLabel ? `. ${statusLabel}` : ''}`}
      accessibilityHint={disabled ? `${title} todavía no está disponible` : `Abre el módulo ${title}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        disabled && styles.disabled,
        style,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Card style={[styles.card, { borderColor: theme.headerBg }]}>
        <View style={[styles.icon, { backgroundColor: theme.headerAccent }]}>
          <Text allowFontScaling={false} style={[styles.iconText, { color: theme.headerBg }]}>
            {iconLabel}
          </Text>
        </View>
        <Text allowFontScaling={false} style={[styles.title, { color: theme.headerBg }]}>
          {title}
        </Text>
        <Text allowFontScaling={false} style={styles.description}>
          {description}
        </Text>
        {statusLabel ? (
          <View style={styles.statusBadge}>
            <Text allowFontScaling={false} style={styles.statusText}>{statusLabel}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minHeight: layout.moduleCardMinHeight,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.72,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  icon: {
    width: iconSizes.module,
    height: iconSizes.module,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    ...typography.bodyStrong,
  },
  title: {
    ...typography.sectionTitle,
    textAlign: 'center',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statusBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.pill,
    backgroundColor: colors.gray[100],
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
