import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { layout, moduleThemes, ModuleTheme, ModuleThemeKey, spacing, typography } from '../../theme/tokens';

interface ScreenTitleBarProps {
  title: string;
  moduleTheme?: ModuleThemeKey;
  themeOverride?: ModuleTheme;
}

export const ScreenTitleBar: React.FC<ScreenTitleBarProps> = ({
  title,
  moduleTheme = 'documentation',
  themeOverride,
}) => {
  const theme = themeOverride ?? moduleThemes[moduleTheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.titleBarBg }]}>
      <View style={styles.content}>
        <Text allowFontScaling={false} style={[styles.title, { color: theme.headerText }]}>
          {title || ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    textAlign: 'center',
    fontWeight: '700',
  },
});
