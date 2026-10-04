import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  colors,
  moduleThemes,
  shadows,
  spacing,
  typography,
  zIndex,
  type ModuleThemeKey,
} from '../../theme/tokens';

type StickySectionHeaderVariant = 'soft' | 'solid';
type StickySectionHeaderTextTone = 'default' | 'withdrawn';

interface StickySectionHeaderProps {
  title: string;
  moduleTheme?: ModuleThemeKey;
  variant?: StickySectionHeaderVariant;
  textTone?: StickySectionHeaderTextTone;
  fullBleed?: boolean;
}

export const StickySectionHeader: React.FC<StickySectionHeaderProps> = ({
  title,
  moduleTheme = 'documentation',
  variant = 'soft',
  textTone = 'default',
  fullBleed = false,
}) => {
  const [visibleTitle, setVisibleTitle] = useState(title);
  const opacity = useRef(new Animated.Value(1)).current;
  const theme = moduleThemes[moduleTheme];
  const isSolid = variant === 'solid';
  const solidTextColor = textTone === 'withdrawn'
    ? colors.withdrawnHeaderText
    : theme.headerText;

  useEffect(() => {
    if (title === visibleTitle) {
      return;
    }

    Animated.timing(opacity, {
      toValue: 0.35,
      duration: 90,
      useNativeDriver: true,
    }).start(() => {
      setVisibleTitle(title);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    });
  }, [opacity, title, visibleTitle]);

  return (
    <View
      collapsable={false}
      style={[
        styles.container,
        !isSolid && {
          backgroundColor: theme.headerAccent,
          borderColor: theme.primary,
        },
        isSolid && styles.solidContainer,
        isSolid && {
          backgroundColor: theme.headerBg,
        },
        fullBleed && styles.fullBleed,
      ]}
    >
      <Animated.Text
        accessibilityRole="header"
        allowFontScaling={false}
        style={[
          styles.title,
          !isSolid && { color: theme.primary },
          isSolid && styles.solidTitle,
          isSolid && { color: solidTextColor },
          { opacity },
        ]}
      >
        {visibleTitle}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  solidContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    zIndex: zIndex.stickyHeader,
    ...shadows.stickyHeader,
  },
  solidTitle: {
    ...typography.sectionTitle,
    letterSpacing: 0,
  },
  fullBleed: {
    marginHorizontal: -spacing.lg,
  },
});
