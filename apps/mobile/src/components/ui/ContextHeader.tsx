import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  colors,
  moduleThemes,
  spacing,
  typography,
  type ModuleThemeKey,
} from '../../theme/tokens';

type ContextHeaderTone = 'default' | 'brandAccent';

interface ContextHeaderProps {
  title: string;
  subtitle?: string;
  trailingText?: string;
  moduleTheme: ModuleThemeKey;
  tone?: ContextHeaderTone;
}

export const ContextHeader: React.FC<ContextHeaderProps> = ({
  title,
  subtitle,
  trailingText,
  moduleTheme,
  tone = 'default',
}) => {
  const theme = moduleThemes[moduleTheme];
  const titleColor = tone === 'brandAccent' ? colors.brandYellow : theme.headerText;

  return (
    <View
      accessibilityRole="header"
      style={[
        styles.container,
        {
          backgroundColor: theme.headerBg,
          borderBottomColor: theme.titleBarBg,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={[
            styles.title,
            trailingText ? styles.titleWithTrailingText : null,
            { color: titleColor },
          ]}
        >
          {title}
        </Text>
        {trailingText ? (
          <View style={styles.trailingTextContainer}>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[styles.trailingText, { color: theme.headerText }]}
            >
              {trailingText}
            </Text>
          </View>
        ) : null}
      </View>
      {subtitle ? (
        <Text
          allowFontScaling={false}
          style={[styles.subtitle, { color: theme.headerText }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  titleRow: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  title: {
    ...typography.contextTitle,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleWithTrailingText: {
    paddingHorizontal: spacing.xxxl * 2,
  },
  trailingTextContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  trailingText: {
    ...typography.bodyStrong,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
