import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, spacing, typography } from '../../theme/tokens';

export interface ExpedienteSummary {
  id: string;
  nombre: string;
  estado: string;
  expedienteId?: string;
  estado_fecha?: string;
}

interface ExpedientesListScreenProps {
  onSelectExpediente?: (id: string) => void;
  refreshKey?: number;
  onBack?: () => void;
}

export const ExpedientesListScreen: React.FC<ExpedientesListScreenProps> = ({ onSelectExpediente, refreshKey = 0, onBack }) => {
  const [expedientes, setExpedientes] = useState<ExpedienteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const calcularDiasEnEstado = (estadoFecha?: string): number => {
    if (!estadoFecha) {
      console.log('⚠️ Sin fecha de estado, usando fecha actual');
      return 0;
    }
    const fechaEstado = new Date(estadoFecha);
    const hoy = new Date();
    // Resetear horas para comparar solo días completos
    fechaEstado.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    const diffTime = hoy.getTime() - fechaEstado.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log(`📅 Días desde ${estadoFecha}:`, diffDays);
    return diffDays;
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'EN_DOCUMENTACION':
      case 'FORMANDO': // Mapear estado antiguo también
        return {
          texto: 'DOCUMENTANDO',
          bgColor: colors.successSoft,
          borderColor: '#10B981',
        };
      case 'EN_VERIFICACION':
        return {
          texto: 'VERIFICANDO',
          bgColor: '#FEF3C7',
          borderColor: '#D97706',
        };
      default:
        return {
          texto: estado,
          bgColor: colors.gray[100],
          borderColor: colors.border,
        };
    }
  };

  useEffect(() => {
    const loadExpedientes = async () => {
      setLoading(true);
      try {
        const data = await api.get<any>('/grupos');
        setExpedientes(data.data || data);
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
          {expedientes.map((expediente, index) => (
            <Pressable
              key={expediente.id}
              onPress={() => {
                console.log('ID seleccionado:', expediente.expedienteId ?? expediente.id);
                onSelectExpediente?.(expediente.expedienteId ?? expediente.id);
              }}
            >
              <Card style={styles.cardWithBorder}>
                <View style={styles.cardHeader}>
                  <Text allowFontScaling={false} style={styles.title}>{expediente.nombre}</Text>
                  <Text allowFontScaling={false} style={styles.indexBadge}>{index + 1}/{expedientes.length}</Text>
                </View>
                {(() => {
                  const config = getEstadoConfig(expediente.estado);
                  const dias = calcularDiasEnEstado(expediente.estado_fecha);
                  const esDocumentando = expediente.estado === 'EN_DOCUMENTACION' || expediente.estado === 'FORMANDO';
                  return (
                    <View style={styles.estadoRow}>
                      <View style={[
                        styles.estadoBurbuja,
                        { backgroundColor: config.bgColor, borderColor: config.borderColor }
                      ]}>
                        <Text allowFontScaling={false} style={styles.estadoTexto}>{config.texto}</Text>
                      </View>
                      {esDocumentando && (
                        <View style={[
                          styles.estadoBurbuja,
                          { backgroundColor: config.bgColor, borderColor: config.borderColor }
                        ]}>
                          <Text allowFontScaling={false} style={styles.estadoTexto}>
                            {dias} {dias === 1 ? 'DÍA' : 'DÍAS'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </Card>
            </Pressable>
          ))}
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
  cardWithBorder: {
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#000000',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  indexBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status: { marginTop: spacing.xs, color: colors.textSecondary, ...typography.body },
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
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
});
