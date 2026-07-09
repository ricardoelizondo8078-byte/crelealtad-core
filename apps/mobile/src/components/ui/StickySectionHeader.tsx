import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

interface StickySectionHeaderProps {
  title: string;
}

export const StickySectionHeader: React.FC<StickySectionHeaderProps> = ({ title }) => {
  const [visibleTitle, setVisibleTitle] = useState(title);
  const opacity = useRef(new Animated.Value(1)).current;

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
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity }]}>{visibleTitle}</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  title: {
    ...typography.caption,
    color: '#0F5A35',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
