import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme/tokens';

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return <Text allowFontScaling={false} style={styles.title}>{title || ''}</Text>;
};

const styles = StyleSheet.create({
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
});
