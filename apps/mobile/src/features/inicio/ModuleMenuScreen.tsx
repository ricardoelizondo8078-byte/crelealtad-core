import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  ModuleCard,
  ResponsiveContent,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
  getResponsiveColumnCount,
  useResponsiveLayout,
} from '../../components/ui';
import { layout, ModuleThemeKey, spacing, typography, colors } from '../../theme/tokens';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { PendingReviewSummary } from '../pendientes';

export interface ModuleMenuOption {
  key: string;
  title: string;
  description: string;
  iconLabel: string;
  moduleTheme: ModuleThemeKey;
  onPress?: () => void;
  disabled?: boolean;
  statusLabel?: string;
}

interface ModuleMenuScreenProps {
  modules: ModuleMenuOption[];
  onLogout: () => void;
}

export const ModuleMenuScreen: React.FC<ModuleMenuScreenProps> = ({ modules, onLogout }) => {
  const { width, isDesktop } = useResponsiveLayout();
  const { totalPending, error, refresh } = usePendingReviews();
  const showPendingPanel = totalPending > 0 || Boolean(error);
  const hasPlannedModules = modules.some((module) => module.statusLabel === 'Próximamente');
  const hasRestrictedModules = modules.some((module) => module.statusLabel === 'Requiere permiso');
  const introMessage = hasRestrictedModules
    ? 'Los módulos activos corresponden a tu cuenta. Los marcados como restringidos requieren autorización.'
    : hasPlannedModules
      ? 'Tus módulos habilitados están activos. Los demás estarán disponibles próximamente.'
      : 'Aquí aparecen los módulos habilitados para tu cuenta.';
  const columnCount = getResponsiveColumnCount(width, {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    wide: 4,
  });
  const missingCells = (columnCount - (modules.length % columnCount)) % columnCount;
  const gridModules: (ModuleMenuOption | null)[] = [
    ...modules,
    ...Array.from({ length: missingCells }, () => null),
  ];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ScreenContainer moduleTheme="general">
      <AppHeader moduleTheme="general" />
      <ScreenTitleBar title="Menú principal" moduleTheme="general" />
      <FlatList
        key={`module-grid-${columnCount}`}
        style={styles.moduleList}
        data={gridModules}
        numColumns={columnCount}
        keyExtractor={(item, index) => item?.key ?? `grid-spacer-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            {showPendingPanel ? (
              <PendingReviewSummary />
            ) : (
              <Card>
                <SectionTitle title="Selecciona un módulo" />
                <Text allowFontScaling={false} style={styles.introText}>
                  {introMessage}
                </Text>
              </Card>
            )}
            {showPendingPanel ? <SectionTitle title="Módulos" /> : null}
          </View>
        )}
        ListEmptyComponent={(
          <ScreenState
            title="Sin módulos habilitados"
            message="Tu cuenta está activa, pero todavía no tiene módulos disponibles. Solicita la revisión de tus permisos."
          />
        )}
        renderItem={({ item }) => item ? (
          <ModuleCard
            title={item.title}
            description={item.description}
            iconLabel={item.iconLabel}
            moduleTheme={item.moduleTheme}
            onPress={item.onPress}
            disabled={item.disabled}
            statusLabel={item.statusLabel}
          />
        ) : <View style={styles.gridSpacer} />}
      />
      <View style={styles.logoutShell}>
        <ResponsiveContent style={styles.logoutArea}>
          <SecondaryButton
            title="Cerrar sesión"
            onPress={onLogout}
            tone="danger"
            style={isDesktop ? styles.logoutButtonDesktop : styles.logoutButton}
          />
        </ResponsiveContent>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  moduleList: {
    flex: 1,
  },
  list: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  row: {
    gap: spacing.lg,
  },
  gridSpacer: {
    flex: 1,
  },
  headerContent: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  logoutShell: {
    backgroundColor: colors.background,
  },
  logoutArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  logoutButton: {
    flex: 0,
  },
  logoutButtonDesktop: {
    flex: 0,
    width: 240,
    alignSelf: 'flex-end',
  },
});
