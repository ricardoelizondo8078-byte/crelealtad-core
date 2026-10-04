import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { AppHeader, ScreenContainer, ScreenState, ScreenTitleBar } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';
import { RenovacionGroupCard } from './RenovacionGroupCard';
import { RenovacionCreada, RenovacionGrupo } from './renovacion.types';

interface Props {
  onBack: () => void;
  onCreated: (expedienteId: string) => void;
}

export const RenovacionScreen: React.FC<Props> = ({ onBack, onCreated }) => {
  const [grupos, setGrupos] = useState<RenovacionGrupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setGrupos(await api.get<RenovacionGrupo[]>('/renovaciones/grupos'));
    } catch (requestError) {
      setLoadError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los grupos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sections = useMemo(() => [
    { title: 'Vigentes', data: grupos.filter((grupo) => grupo.vigente_en_corte) },
    { title: 'Ciclos pasados', data: grupos.filter((grupo) => !grupo.vigente_en_corte) },
  ].filter((section) => section.data.length > 0), [grupos]);

  const createRenewal = async (grupo: RenovacionGrupo) => {
    if (!grupo.puede_renovar || submittingId) return;
    setSubmittingId(grupo.grupo_id);
    setActionError(null);
    try {
      const result = await api.post<RenovacionCreada>(`/renovaciones/grupos/${grupo.grupo_id}`);
      onCreated(result.expediente_id);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar la renovación.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Renovación" moduleTheme="documentation" />
      {loading ? <ScreenState title="Cargando grupos" loading /> : null}
      {!loading && loadError ? <ScreenState title="No se pudo continuar" message={loadError} actionLabel="Reintentar" onAction={load} /> : null}
      {!loading && !loadError && grupos.length === 0 ? (
        <ScreenState title="No hay grupos asignados" message="Los grupos aparecerán cuando el último ciclo esté asociado a tu cuenta." />
      ) : null}
      {!loading && !loadError && grupos.length > 0 ? (
        <View style={styles.content}>
          {actionError ? <Text allowFontScaling={false} style={styles.actionError}>{actionError}</Text> : null}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.grupo_id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => <Text allowFontScaling={false} style={styles.section}>{section.title}</Text>}
            renderItem={({ item }) => (
              <RenovacionGroupCard
                grupo={item}
                busy={submittingId === item.grupo_id}
                disabled={!item.puede_renovar || submittingId !== null}
                onPress={() => createRenewal(item)}
              />
            )}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.md },
  content: { flex: 1 },
  section: { ...typography.bodyStrong, color: colors.textPrimary, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  actionError: { ...typography.caption, color: colors.error, backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md },
});
