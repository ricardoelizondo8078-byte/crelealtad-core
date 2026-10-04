import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenState, ScreenTitleBar, StatusCard } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';

export interface GrupoVerificacion {
  id: string;
  nombre: string;
  estado: string;
  expediente_id: string;
  estado_fecha?: string;
  integrantes_count?: number;
  es_grupo_nuevo_ciclo_1: boolean;
  requiere_revision_documental: boolean;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

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
      setErrorMessage(null);
      try {
        const data = await api.get<GrupoVerificacion[]>('/expedientes/en-verificacion');
        setGrupos(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No fue posible consultar los grupos pendientes.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadGrupos();
  }, [refreshKey, retryKey]);

  return (
    <ScreenContainer moduleTheme="verification">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="verification" />
      <ScreenTitleBar title="Grupos en Verificación" moduleTheme="verification" />
      {loading ? (
        <ScreenState title="Consultando grupos" loading />
      ) : errorMessage ? (
        <ScreenState
          title="No se pudo abrir Verificación"
          message={errorMessage}
          actionLabel="Intentar nuevamente"
          onAction={() => setRetryKey((currentKey) => currentKey + 1)}
        />
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
            grupos.map((grupo, index) => {
              const requiereRevisionDocumental = grupo.requiere_revision_documental === true;

              return (
                <Pressable
                  key={grupo.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${grupo.nombre}.${requiereRevisionDocumental
                    ? ' Revisar documentación. Hay integrantes que están en Documentación. El grupo continúa disponible.'
                    : grupo.es_grupo_nuevo_ciclo_1
                      ? ' Grupo nuevo, ciclo 1. Estado verificando.'
                      : ' Estado verificando.'}`}
                  onPress={() => {
                    onSelectGrupo?.(grupo.expediente_id);
                  }}
                >
                  <StatusCard
                    compact
                    narrowStripe
                    status={requiereRevisionDocumental
                      ? 'needsDocumentationGroup'
                      : grupo.es_grupo_nuevo_ciclo_1
                        ? 'newGroup'
                        : 'neutral'}
                    style={styles.cardWithBorder}
                  >
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
                  </StatusCard>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
