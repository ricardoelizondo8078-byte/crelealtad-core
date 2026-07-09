import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, spacing, typography } from '../../theme/tokens';

export interface ExpedienteSummary {
  id: string;
  title: string;
  status: string;
}

interface ExpedientesListScreenProps {
  onSelectExpediente?: (id: string) => void;
  refreshKey?: number;
  onBack?: () => void;
}

export const ExpedientesListScreen: React.FC<ExpedientesListScreenProps> = ({ onSelectExpediente, refreshKey = 0, onBack }) => {
  const [expedientes, setExpedientes] = useState<ExpedienteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpedientes = async () => {
      try {
        const response = await fetch(apiUrl('/expedientes/group/group-1'));
        if (!response.ok) {
          throw new Error('Failed to load expedientes');
        }

        const data = await response.json();
        setExpedientes(data);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadExpedientes();
  }, [refreshKey]);

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Mis Expedientes" moduleTheme="documentation" />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <View style={styles.list}>
          <Text style={styles.subtitle}>Selecciona un expediente para continuar con la documentación.</Text>
          {expedientes.map((expediente) => (
            <Pressable
              key={expediente.id}
              onPress={() => onSelectExpediente?.(expediente.id)}
            >
              <Card style={styles.card}>
                <Text style={styles.title}>{expediente.title}</Text>
                <Text style={styles.status}>{expediente.status}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.xs, ...typography.body },
  card: { marginBottom: spacing.sm },
  title: { ...typography.sectionTitle, color: colors.textPrimary },
  status: { marginTop: spacing.xs, color: colors.textSecondary, ...typography.body },
});
