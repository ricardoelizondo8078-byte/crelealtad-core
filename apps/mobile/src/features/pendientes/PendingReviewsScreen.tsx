import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
} from '../../components/ui';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { colors, spacing, typography } from '../../theme/tokens';
import { PendingReviewCard } from './PendingReviewCard';

export const PendingReviewsScreen: React.FC = () => {
  const {
    groups,
    loading,
    refreshing,
    error,
    refresh,
    closeInbox,
    openExpediente,
  } = usePendingReviews();

  return (
    <ScreenContainer moduleTheme="general">
      <AppHeader
        moduleTheme="general"
        showBackButton
        onBackPress={closeInbox}
        showPendingIndicator={false}
      />
      <ScreenTitleBar title="Pendientes para ti" moduleTheme="general" />
      {loading && groups.length === 0 ? (
        <ScreenState title="Actualizando pendientes" loading />
      ) : error && groups.length === 0 ? (
        <ScreenState
          title="No se pudieron cargar los pendientes"
          message={error}
          actionLabel="Reintentar"
          onAction={refresh}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.expediente_id}
          contentContainerStyle={[styles.list, groups.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          ListHeaderComponent={groups.length > 0 ? (
            <View style={styles.intro}>
              <Text allowFontScaling={false} style={styles.introText}>
                Se muestran únicamente grupos con documentos que el verificador devolvió para corregir.
              </Text>
              {error ? (
                <Text allowFontScaling={false} style={styles.warningText}>
                  No se pudo actualizar la lista; se conserva la última información disponible.
                </Text>
              ) : null}
            </View>
          ) : null}
          ListEmptyComponent={(
            <ScreenState
              title="Sin revisiones documentales"
              message="Cuando un verificador solicite corregir documentos de uno de tus grupos, aparecerá aquí."
            />
          )}
          renderItem={({ item }) => (
            <PendingReviewCard
              pending={item}
              onPress={() => openExpediente(item.expediente_id)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  intro: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  introText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
});
