import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SectionTitle,
  TaskMenuButton,
  getResponsiveColumnCount,
  useResponsiveLayout,
} from '../../components/ui';
import { colors, layout, spacing, typography } from '../../theme/tokens';

interface DocumentationHomeScreenProps {
  canCreateGroup: boolean;
  canRenew: boolean;
  canViewExpedientes: boolean;
  onBack: () => void;
  onCreateGroup: () => void;
  onRenew: () => void;
  onViewExpedientes: () => void;
}

export const DocumentationHomeScreen: React.FC<DocumentationHomeScreenProps> = ({
  canCreateGroup,
  canRenew,
  canViewExpedientes,
  onBack,
  onCreateGroup,
  onRenew,
  onViewExpedientes,
}) => {
  const { width } = useResponsiveLayout();
  const actions = [
    canCreateGroup ? {
      key: 'create-group',
      title: 'Crear grupo',
      description: 'Inicia un expediente para un grupo nuevo.',
      iconLabel: '👥',
      accessibilityHint: 'Abre la captura para crear un grupo nuevo',
      onPress: onCreateGroup,
    } : null,
    canRenew ? {
      key: 'renewal',
      title: 'Renovación',
      description: 'Inicia el siguiente expediente de un grupo.',
      iconLabel: '↻',
      accessibilityHint: 'Abre el proceso de renovación de un grupo',
      onPress: onRenew,
    } : null,
    canViewExpedientes ? {
      key: 'expedientes',
      title: 'Mis expedientes',
      description: 'Continúa con la documentación pendiente.',
      iconLabel: '📁',
      accessibilityHint: 'Abre la lista de tus expedientes',
      onPress: onViewExpedientes,
    } : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);
  const columnCount = getResponsiveColumnCount(width, {
    mobile: 1,
    tablet: 1,
    desktop: 3,
    wide: 3,
  });
  const missingCells = (columnCount - (actions.length % columnCount)) % columnCount;
  const gridActions = [
    ...actions,
    ...Array.from({ length: missingCells }, () => null),
  ];

  return (
    <ScreenContainer moduleTheme="documentation">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Documentación" moduleTheme="documentation" />
      <FlatList
        key={`documentation-actions-${columnCount}`}
        data={gridActions}
        numColumns={columnCount}
        keyExtractor={(item, index) => item?.key ?? `action-spacer-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        columnWrapperStyle={columnCount > 1 ? styles.row : undefined}
        ListHeaderComponent={(
          <Card style={styles.introCard}>
            <SectionTitle title="¿Qué quieres hacer?" />
            <Text allowFontScaling={false} style={styles.introText}>
              Inicia un expediente o continúa con la documentación pendiente.
            </Text>
          </Card>
        )}
        ListEmptyComponent={(
          <ScreenState
            title="Sin acciones habilitadas"
            message="Puedes entrar a Documentación, pero todavía no tienes acciones disponibles en este módulo."
          />
        )}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            {item ? (
              <TaskMenuButton
                title={item.title}
                description={item.description}
                iconLabel={item.iconLabel}
                moduleTheme="documentation"
                accessibilityHint={item.accessibilityHint}
                onPress={item.onPress}
              />
            ) : null}
          </View>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: spacing.lg,
  },
  gridItem: {
    flex: 1,
  },
  introCard: {
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[400],
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
