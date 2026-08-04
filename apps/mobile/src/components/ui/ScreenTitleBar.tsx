import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moduleThemes, ModuleThemeKey, spacing, typography } from '../../theme/tokens';

interface ScreenTitleBarProps {
  title: string;
  moduleTheme?: ModuleThemeKey;
}

export const ScreenTitleBar: React.FC<ScreenTitleBarProps> = ({
  title,
  moduleTheme = 'documentation',
}) => {
  const theme = moduleThemes[moduleTheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.titleBarBg }]}>
      <Text allowFontScaling={false} style={styles.title}>{title || ''}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.sectionTitle,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
});