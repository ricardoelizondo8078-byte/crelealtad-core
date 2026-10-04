import React from 'react';
import { Image, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { useProcessingAction } from '../../context/ProcessingContext';
import { colors, layout, moduleThemes, ModuleThemeKey, radius, spacing, touchTargets, typography } from '../../theme/tokens';

const crelealtadLogo = require('../../../assets/logo.png');

export interface AppHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void | Promise<void>;
  moduleTheme?: ModuleThemeKey;
  userName?: string;
  userRole?: string;
  currentWeek?: string;
  avatarLabel?: string;
  showPendingIndicator?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showBackButton = false,
  onBackPress,
  moduleTheme = 'documentation',
  userName,
  userRole,
  currentWeek = 'Semana 18',
  avatarLabel,
  showPendingIndicator = true,
}) => {
  const { usuario } = useAuth();
  const { totalPending, openInbox } = usePendingReviews();
  const handleBackPress = useProcessingAction(onBackPress);
  const theme = moduleThemes[moduleTheme];
  const compactWeekLabel = currentWeek.replace(/semana\s*/i, 'SEM ').toUpperCase();
  const resolvedUserName = userName ?? usuario?.abreviatura ?? usuario?.nombre ?? 'Usuario';
  const resolvedUserRole = userRole ?? usuario?.rol_nombre ?? 'Usuario';
  const resolvedAvatarLabel = avatarLabel ?? resolvedUserName
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBg }]}> 
      <StatusBar
        barStyle={theme.statusBarStyle ?? 'light-content'}
        backgroundColor={theme.headerBg}
      />
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          {showBackButton ? (
            <Pressable accessibilityRole="button" onPress={handleBackPress} style={styles.backButton}>
              <Text allowFontScaling={false} style={[styles.backButtonText, { color: theme.headerText }]}>{'<'}</Text>
            </Pressable>
          ) : null}

          <View style={styles.logoContainer}>
            <Image source={crelealtadLogo} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.brandTextBlock}>
            <Text allowFontScaling={false} style={[styles.brandLabel, { color: theme.headerText }]}>CRELEALTAD</Text>
            <Text allowFontScaling={false} style={[styles.weekLabel, { color: theme.headerText }]}>{compactWeekLabel}</Text>
          </View>
        </View>

        <View style={styles.centerSpacer} />

        <View style={styles.userBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${totalPending} ${totalPending === 1 ? 'pendiente' : 'pendientes'} de revisión documental. Abrir pendientes.`}
            accessible={showPendingIndicator && totalPending > 0}
            disabled={!showPendingIndicator || totalPending === 0}
            onPress={openInbox}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}
          >
            <View style={[styles.avatar, { backgroundColor: theme.headerAccent }]}>
              <Text
                allowFontScaling={false}
                style={[styles.avatarText, { color: theme.headerAccentText ?? theme.headerBg }]}
              >
                {resolvedAvatarLabel}
              </Text>
            </View>
            {showPendingIndicator && totalPending > 0 ? (
              <View style={styles.pendingBadge}>
                <Text allowFontScaling={false} style={styles.pendingBadgeText}>
                  {totalPending > 99 ? '99+' : totalPending}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <View style={styles.userTextBlock}>
            <Text allowFontScaling={false} style={[styles.userName, { color: theme.headerText }]}>{resolvedUserName}</Text>
            <Text
              allowFontScaling={false}
              style={[styles.userRole, { color: theme.headerSecondaryText ?? theme.headerAccent }]}
            >
              {resolvedUserRole}
            </Text>
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
  avatarButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  avatarButtonPressed: {
    opacity: 0.82,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '700',
  },
  pendingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: layout.notificationBadgeSize,
    height: layout.notificationBadgeSize,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    ...typography.notificationBadge,
    color: colors.white,
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
