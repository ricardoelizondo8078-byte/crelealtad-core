import React from 'react';
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { breakpoints, layout } from '../../theme/tokens';

export type ResponsiveContentVariant = 'content' | 'detail' | 'form';

interface ResponsiveContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: ResponsiveContentVariant;
  fill?: boolean;
}

const maxWidthByVariant: Record<ResponsiveContentVariant, number> = {
  content: layout.contentMaxWidth,
  detail: layout.detailMaxWidth,
  form: layout.formMaxWidth,
};

export const getResponsiveColumnCount = (
  width: number,
  options: { mobile?: number; tablet?: number; desktop?: number; wide?: number } = {},
): number => {
  const {
    mobile = 1,
    tablet = 2,
    desktop = 3,
    wide = desktop,
  } = options;

  if (width >= breakpoints.wide) return wide;
  if (width >= breakpoints.desktop) return desktop;
  if (width >= breakpoints.tablet) return tablet;
  return mobile;
};

export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isTablet: width >= breakpoints.tablet,
    isDesktop: width >= breakpoints.desktop,
    isWide: width >= breakpoints.wide,
    gutter: width >= breakpoints.desktop ? layout.desktopGutter : undefined,
  };
};

export const ResponsiveContent: React.FC<ResponsiveContentProps> = ({
  children,
  style,
  variant = 'content',
  fill = false,
}) => (
  <View
    style={[
      styles.container,
      { maxWidth: maxWidthByVariant[variant] },
      fill && styles.fill,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  fill: {
    flex: 1,
    minHeight: 0,
  },
});
