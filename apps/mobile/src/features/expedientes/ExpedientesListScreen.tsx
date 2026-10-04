import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenTitleBar, StatusCard } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export interface ExpedienteSummary {
  id: string;
  nombre: string;
  estado: string;
  expedienteId?: string;
  estado_fecha?: string;
  es_grupo_nuevo_ciclo_1?: boolean;
  requiere_revision_documental?: boolean;
}

interface GrupoConHistorial {
  grupo_id: string;
}

interface ExpedientesListScreenProps {
  onSelectExpediente?: (id: string) => void;
  refreshKey?: number;
  newlyCreatedExpedienteId?: string | null;
  onBack?: () => void;
}

const getEstadoConfig = (estado: string) => {
  switch (estado) {
    case 'FORMANDO':
    case 'EN_DOCUMENTACION':
      return {
        texto: 'DOCUMENTANDO',
        backgroundColor: colors.successSoft,
        borderColor: colors.success,
      };
    case 'EN_VERIFICACION':
      return {
        texto: 'VERIFICANDO',
        backgroundColor: colors.warningLight,
        borderColor: '#D97706',
      };
    default:
      return {
        texto: estado,
        backgroundColor: colors.gray[100],
        borderColor: colors.border,
      };
  }
};

export const ExpedientesListScreen: React.FC<ExpedientesListScreenProps> = ({
  onSelectExpediente,
  refreshKey = 0,
  newlyCreatedExpedienteId,
  onBack,
}) => {
  const [expedientes, setExpedientes] = useState<ExpedienteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const calcularDiasEnEstado = (estadoFecha?: string): number => {
    if (!estadoFecha) {
      return 0;
    }
    const fechaEstado = new Date(estadoFecha);
    const hoy = new Date();
    // Resetear horas para comparar solo días completos
    fechaEstado.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    const diffTime = hoy.getTime() - fechaEstado.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const loadExpedientes = async () => {
      setLoading(true);
      try {
        const data = await api.get<any>('/grupos');
        const lista = (data.data || data) as ExpedienteSummary[];

        if (lista.every((expediente) => typeof expediente.es_grupo_nuevo_ciclo_1 === 'boolean')) {
          setExpedientes(lista);
          return;
        }

        // Compatibilidad con una API anterior que todavía no devuelve la bandera:
        // el catálogo de renovación es la fuente vigente de grupos con ciclos previos.
        try {
          const gruposConHistorial = await api.get<GrupoConHistorial[]>('/renovaciones/grupos');
          const idsConHistorial = new Set(gruposConHistorial.map((grupo) => grupo.grupo_id));
          setExpedientes(lista.map((expediente) => ({
            ...expediente,
            es_grupo_nuevo_ciclo_1: expediente.es_grupo_nuevo_ciclo_1
              ?? !idsConHistorial.has(expediente.id),
          })));
        } catch {
          // La lista sigue siendo utilizable; sólo se omite la marca si no puede
          // demostrarse el ciclo con ninguna de las dos respuestas.
          setExpedientes(lista);
        }
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
          <Text allowFontScaling={false} style={styles.subtitle}>Selecciona un expediente para continuar con la documentación.</Text>
          {expedientes.length === 0 ? (
            <Card>
              <Text allowFontScaling={false} style={styles.emptyTitle}>No tienes expedientes asignados</Text>
              <Text allowFontScaling={false} style={styles.subtitle}>Los expedientes nuevos que registres aparecerán aquí.</Text>
            </Card>
          ) : null}
          {expedientes.map((expediente, index) => {
            const config = getEstadoConfig(expediente.estado);
            const dias = calcularDiasEnEstado(expediente.estado_fecha);
            const esDocumentando = expediente.estado === 'EN_DOCUMENTACION' || expediente.estado === 'FORMANDO';
            const esGrupoNuevo = expediente.es_grupo_nuevo_ciclo_1 === true
              || Boolean(newlyCreatedExpedienteId && expediente.expedienteId === newlyCreatedExpedienteId);
            const requiereRevisionDocumental = expediente.requiere_revision_documental === true;

            return (
              <Pressable
                key={expediente.id}
                accessibilityRole="button"
                accessibilityLabel={`${expediente.nombre}.${requiereRevisionDocumental ? ' Revisar documentación.' : esGrupoNuevo ? ' Grupo nuevo, ciclo 1.' : ''} Estado ${expediente.estado.replace(/_/g, ' ').toLowerCase()}${esDocumentando ? `. ${dias} ${dias === 1 ? 'día' : 'días'} en este estado` : ''}.`}
                onPress={() => {
                  onSelectExpediente?.(expediente.expedienteId ?? expediente.id);
                }}
              >
                <StatusCard
                  compact
                  narrowStripe
                  status={requiereRevisionDocumental
                    ? 'needsDocumentationGroup'
                    : esGrupoNuevo
                      ? 'newGroup'
                      : 'neutral'}
                  style={styles.cardWithBorder}
                >
                  <View style={styles.cardHeader}>
                    <Text allowFontScaling={false} style={styles.title}>{expediente.nombre}</Text>
                    <Text allowFontScaling={false} style={styles.indexBadge}>{index + 1}/{expedientes.length}</Text>
                  </View>
                  <View style={styles.estadoRow}>
                    <View style={[styles.estadoBurbuja, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
                      <Text allowFontScaling={false} style={styles.estadoTexto}>{config.texto}</Text>
                    </View>
                    {esDocumentando ? (
                      <View style={[styles.estadoBurbuja, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
                        <Text allowFontScaling={false} style={styles.estadoTexto}>{dias} {dias === 1 ? 'DÍA' : 'DÍAS'}</Text>
                      </View>
                    ) : null}
                  </View>
                </StatusCard>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.xs, ...typography.body },
  emptyTitle: { color: colors.textPrimary, ...typography.sectionTitle },
  cardWithBorder: {
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  indexBadge: {
    ...typography.bodyStrong,
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
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
    borderRadius: radius.md,
    borderWidth: 2,
  },
  estadoTexto: {
    ...typography.caption,
    color: colors.gray[800],
    fontWeight: '700',
  },
});
