import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  PrimaryButton,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
} from '../../components/ui';
import { colors, spacing, typography } from '../../theme/tokens';

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
  const hasActions = canCreateGroup || canRenew || canViewExpedientes;

  return (
    <ScreenContainer moduleTheme="documentation">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Documentación" moduleTheme="documentation" />
      <View style={styles.content}>
        <Card>
          <SectionTitle title="¿Qué quieres hacer?" />
          <Text allowFontScaling={false} style={styles.introText}>
            Inicia un expediente o continúa con la documentación pendiente.
          </Text>
        </Card>

        {hasActions ? (
          <View style={styles.actions}>
            {canCreateGroup ? (
              <PrimaryButton
                title="Crear grupo"
                onPress={onCreateGroup}
                moduleTheme="documentation"
                style={styles.actionButton}
              />
            ) : null}

            {canRenew ? (
              <PrimaryButton
                title="Renovación"
                onPress={onRenew}
                moduleTheme="documentation"
                style={styles.actionButton}
              />
            ) : null}

            {canViewExpedientes ? (
              <SecondaryButton
                title="Ir a Mis expedientes"
                onPress={onViewExpedientes}
                style={styles.actionButton}
              />
            ) : null}
          </View>
        ) : (
          <ScreenState
            title="Sin acciones habilitadas"
            message="Puedes entrar a Documentación, pero todavía no tienes acciones disponibles en este módulo."
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    flex: 0,
  },
});
