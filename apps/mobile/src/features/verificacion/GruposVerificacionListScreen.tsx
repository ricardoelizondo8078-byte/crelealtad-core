import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, spacing, typography } from '../../theme/tokens';

export interface GrupoVerificacion {
  id: string;
  nombre: string;
  estado: string;
  expedienteId?: string;
  estado_fecha?: string;
  integrantes_count?: number;
}

interface GruposVerificacionListScreenProps {
  onSelectGrupo?: (id: string) => void;
  refreshKey?: number;
  onBack?: () => void;
}

export const GruposVerificacionListScreen: React.FC<GruposVerificacionListScreenProps> = ({
  onSelectGrupo,
  refreshKey = 0,
  onBack
}) => {
  const [grupos, setGrupos] = useState<GrupoVerificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const calcularDiasEnEstado = (estadoFecha?: string): number => {
    if (!estadoFecha) {
      return 0;
    }
    const fechaEstado = new Date(estadoFecha);
    const hoy = new Date();
    fechaEstado.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    const diffTime = hoy.getTime() - fechaEstado.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const loadGrupos = async () => {
      setLoading(true);
      try {
        // Cargar grupos que están EN_VERIFICACION
        const response = await fetch(apiUrl('/grupos?estado=EN_VERIFICACION'));
        if (!response.ok) {
          throw new Error('Failed to load grupos en verificación');
        }

        const data = await response.json();
        setGrupos(data);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadGrupos();
  }, [refreshKey]);

  return (
    <ScreenContainer moduleTheme="verification">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="verification" />
      <ScreenTitleBar title="Grupos en Verificación" moduleTheme="verification" />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Selecciona un grupo para realizar la verificación de crédito.
          </Text>
          {grupos.length === 0 ? (
            <Card>
              <Text allowFontScaling={false} style={styles.emptyText}>
                No hay grupos pendientes de verificación
              </Text>
            </Card>
          ) : (
            grupos.map((grupo, index) => (
              <Pressable
                key={grupo.id}
                onPress={() => {
                  onSelectGrupo?.(grupo.expedienteId ?? grupo.id);
                }}
              >
                <Card style={styles.cardWithBorder}>
                  <View style={styles.cardHeader}>
                    <Text allowFontScaling={false} style={styles.title}>{grupo.nombre}</Text>
                    <Text allowFontScaling={false} style={styles.indexBadge}>
                      {index + 1}/{grupos.length}
                    </Text>
                  </View>

                  <View style={styles.estadoRow}>
                    <View style={styles.estadoBurbuja}>
                      <Text allowFontScaling={false} style={styles.estadoTexto}>VERIFICANDO</Text>
                    </View>
                    <View style={styles.estadoBurbuja}>
                      <Text allowFontScaling={false} style={styles.estadoTexto}>
                        {calcularDiasEnEstado(grupo.estado_fecha)} {calcularDiasEnEstado(grupo.estado_fecha) === 1 ? 'DÍA' : 'DÍAS'}
                      </Text>
                    </View>
                  </View>

                  {grupo.integrantes_count !== undefined && (
                    <View style={styles.integrantesInfo}>
                      <Text allowFontScaling={false} style={styles.integrantesTexto}>
                        {grupo.integrantes_count} {grupo.integrantes_count === 1 ? 'integrante' : 'integrantes'}
                      </Text>
                    </View>
                  )}
                </Card>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  list: {
    padding: spacing.lg,
    gap: spacing.md
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    ...typography.body
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    ...typography.body,
  },
  cardWithBorder: {
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[900],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    flex: 1
  },
  indexBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoBurbuja: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[900],
  },
  integrantesInfo: {
    marginTop: spacing.sm,
  },
  integrantesTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
