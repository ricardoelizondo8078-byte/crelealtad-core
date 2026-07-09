import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, moduleThemes, ModuleThemeKey, radius, spacing, typography } from '../../theme/tokens';

const crelealtadLogo = require('../../../assets/logo.png');

export interface AppHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  moduleTheme?: ModuleThemeKey;
  userName?: string;
  userRole?: string;
  currentWeek?: string;
  avatarLabel?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showBackButton = false,
  onBackPress,
  moduleTheme = 'documentation',
  userName = 'Maria Gonzalez',
  userRole = 'Asesora',
  currentWeek = 'Semana 18',
  avatarLabel = 'MG',
}) => {
  const theme = moduleThemes[moduleTheme];
  const compactWeekLabel = currentWeek.replace(/semana\s*/i, 'SEM ').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBg }]}> 
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          {showBackButton ? (
            <Pressable accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.headerText }]}>{'<'}</Text>
            </Pressable>
          ) : null}

          <View style={styles.logoContainer}>
            <Image source={crelealtadLogo} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.brandTextBlock}>
            <Text style={[styles.brandLabel, { color: theme.headerText }]}>CRELEALTAD</Text>
            <Text style={[styles.weekLabel, { color: theme.headerText }]}>{compactWeekLabel}</Text>
          </View>
        </View>

        <View style={styles.centerSpacer} />

        <View style={styles.userBlock}>
          <View style={[styles.avatar, { backgroundColor: theme.headerAccent }]}>
            <Text style={[styles.avatarText, { color: theme.headerBg }]}>{avatarLabel}</Text>
          </View>
          <View style={styles.userTextBlock}>
            <Text style={[styles.userName, { color: colors.white }]}>{userName}</Text>
            <Text style={[styles.userRole, { color: theme.headerAccent }]}>{userRole}</Text>
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  brandTextBlock: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  centerSpacer: {
    flex: 1,
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandLabel: {
    ...typography.bodyStrong,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  weekLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 1,
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '42%',
    marginLeft: spacing.md,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '700',
  },
  userTextBlock: {
    flexShrink: 1,
  },
  userName: {
    ...typography.caption,
    fontWeight: '700',
  },
  userRole: {
    ...typography.caption,
  },
});
