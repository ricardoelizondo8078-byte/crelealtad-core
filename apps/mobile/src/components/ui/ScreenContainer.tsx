import React from 'react';
import { SafeAreaView, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, moduleThemes, ModuleTheme, ModuleThemeKey } from '../../theme/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  moduleTheme?: ModuleThemeKey;
  themeOverride?: ModuleTheme;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentStyle,
  scroll = false,
  moduleTheme = 'documentation',
  themeOverride,
}) => {
  const theme = themeOverride ?? moduleThemes[moduleTheme];

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBg }, style]}>
        <ScrollView style={styles.body} contentContainerStyle={contentStyle}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBg }, style]}>
      <View style={[styles.body, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
