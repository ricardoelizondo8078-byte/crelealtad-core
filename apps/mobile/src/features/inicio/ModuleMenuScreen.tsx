import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  ModuleCard,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
} from '../../components/ui';
import { ModuleThemeKey, spacing, typography, colors } from '../../theme/tokens';
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
  const { totalPending, error, refresh } = usePendingReviews();
  const showPendingPanel = totalPending > 0 || Boolean(error);
  const hasPlannedModules = modules.some((module) => module.statusLabel === 'Próximamente');
  const hasRestrictedModules = modules.some((module) => module.statusLabel === 'Requiere permiso');
  const introMessage = hasRestrictedModules
    ? 'Los módulos activos corresponden a tu cuenta. Los marcados como restringidos requieren autorización.'
    : hasPlannedModules
      ? 'Tus módulos habilitados están activos. Los demás estarán disponibles próximamente.'
      : 'Aquí aparecen los módulos habilitados para tu cuenta.';
  const gridModules: Array<ModuleMenuOption | null> = modules.length % 2 === 0
    ? modules
    : [...modules, null];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ScreenContainer moduleTheme="general">
      <AppHeader moduleTheme="general" />
      <ScreenTitleBar title="Menú principal" moduleTheme="general" />
      <FlatList
        style={styles.moduleList}
        data={gridModules}
        numColumns={2}
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
      <View style={styles.logoutArea}>
        <SecondaryButton
          title="Cerrar sesión"
          onPress={onLogout}
          tone="danger"
          style={styles.logoutButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  moduleList: {
    flex: 1,
  },
  list: {
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
  logoutArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  logoutButton: {
    flex: 0,
  },
});
