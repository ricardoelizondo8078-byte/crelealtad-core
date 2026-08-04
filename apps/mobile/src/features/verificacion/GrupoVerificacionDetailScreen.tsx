import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';

interface GrupoInfo {
  id: string;
  nombre: string;
  estado: string;
  expedienteId: string;
}

interface IntegranteVerificacion {
  id: string;
  nombre: string;
  telefono: string;
  montoSolicitado: number;
  estadoVerificacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;
  esTesorera: boolean;
}

interface GrupoVerificacionDetailScreenProps {
  expedienteId: string;
  onBack?: () => void;
  onSelectIntegrante?: (integranteId: string, position?: number, total?: number) => void;
  onGrupoLoaded?: (nombreGrupo: string) => void;
}

export const GrupoVerificacionDetailScreen: React.FC<GrupoVerificacionDetailScreenProps> = ({
  expedienteId,
  onBack,
  onSelectIntegrante,
  onGrupoLoaded
}) => {
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [integrantes, setIntegrantes] = useState<IntegranteVerificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar expediente
        const expResponse = await fetch(apiUrl(`/expedientes/${expedienteId}`));
        if (!expResponse.ok) {
          throw new Error('Failed to load expediente');
        }
        const expData = await expResponse.json();

        // Cargar grupo
        if (expData.grupo_id) {
          const grupoResponse = await fetch(apiUrl(`/grupos/${expData.grupo_id}`));
          if (grupoResponse.ok) {
            const grupoData = await grupoResponse.json();
            setGrupo(grupoData);
            onGrupoLoaded?.(grupoData.nombre);
          }
        }

        // Cargar integrantes
        const integrantesResponse = await fetch(apiUrl(`/integrantes/expediente/${expedienteId}`));
        if (!integrantesResponse.ok) {
          throw new Error('Failed to load integrantes');
        }

        const integrantesData = await integrantesResponse.json();

        // TODO: Cargar estado de verificación de cada integrante
        const enriched = integrantesData.map((int: any) => ({
          ...int,
          estadoVerificacion: int.estado_verificacion || 'PENDIENTE',
          esTesorera: int.es_tesorera || false,
        }));

        setIntegrantes(enriched);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [expedienteId]);

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case 'APROBADO':
        return { bg: colors.successSoft, border: colors.success, text: colors.success };
      case 'RECHAZADO':
        return { bg: colors.dangerSoft, border: colors.error, text: colors.error };
      default:
        return { bg: colors.gray[100], border: colors.gray[400], text: colors.gray[500] };
    }
  };

  const aprobados = integrantes.filter((int) => int.estadoVerificacion === 'APROBADO').length;
  const rechazados = integrantes.filter((int) => int.estadoVerificacion === 'RECHAZADO').length;
  const pendientes = integrantes.filter((int) => int.estadoVerificacion === 'PENDIENTE').length;

  const montoTotal = integrantes
    .filter((int) => int.estadoVerificacion === 'APROBADO')
    .reduce((sum, int) => sum + Number(int.montoSolicitado || 0), 0);

  return (
    <ScreenContainer moduleTheme="verification">
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="verification" />
      <ScreenTitleBar title="Verificación de Grupo" moduleTheme="verification" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text allowFontScaling={false} style={styles.grupoBannerText}>
          {grupo?.nombre || 'Cargando...'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.mainCard}>
            {/* Resumen: Integrantes y Monto Total */}
            <View style={styles.resumenContainer}>
              <View style={styles.resumenCardSmall}>
                <Text allowFontScaling={false} style={styles.resumenLabel}>Integrantes</Text>
                <Text allowFontScaling={false} style={styles.resumenValor}>{aprobados}</Text>
              </View>

              <View style={styles.resumenDivider} />

              <View style={styles.resumenCardLarge}>
                <Text allowFontScaling={false} style={styles.resumenLabel}>Monto total</Text>
                <Text allowFontScaling={false} style={styles.resumenValor}>{formatCurrency(montoTotal)}</Text>
              </View>
            </View>

            {/* KPIs del grupo */}
            <View style={styles.kpisRow}>
              <View style={styles.kpiBubble}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{integrantes.length}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Total</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleSuccess]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{aprobados}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Aprobados</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleWarning]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{pendientes}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Pendientes</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleDanger]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{rechazados}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Rechazados</Text>
              </View>
            </View>

            {/* Botón de finalizar verificación */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                pendientes > 0 && styles.continueButtonDisabled
              ]}
              onPress={() => {
                Alert.alert(
                  'Finalizar verificación',
                  '¿Estás seguro de finalizar la verificación de este grupo?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Finalizar',
                      onPress: () => {
                        // TODO: Implementar finalización
                        Alert.alert('Éxito', 'Verificación finalizada');
                      }
                    }
                  ]
                );
              }}
              disabled={pendientes > 0}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.continueButtonText}>Finalizar Verificación de Grupo</Text>
            </TouchableOpacity>
          </Card>

          <View style={styles.section}>
            <SectionTitle title="Integrantes" />
            {integrantes.length === 0 ? (
              <Text allowFontScaling={false} style={styles.empty}>
                No hay integrantes en este grupo.
              </Text>
            ) : (
              integrantes.map((integrante, index) => {
                const estadoColor = getEstadoColor(integrante.estadoVerificacion);
                return (
                  <Pressable
                    key={integrante.id}
                    onPress={() => {
                      onSelectIntegrante?.(integrante.id, index + 1, integrantes.length);
                    }}
                  >
                    <Card style={styles.integranteCard}>
                      {/* Badge de posición */}
                      <View style={styles.positionBadge}>
                        <Text allowFontScaling={false} style={styles.positionBadgeText}>
                          {index + 1}/{integrantes.length}
                        </Text>
                      </View>

                      {/* Badge de estado */}
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: estadoColor.bg, borderColor: estadoColor.border }
                      ]}>
                        <Text allowFontScaling={false} style={[styles.statusPillText, { color: estadoColor.text }]}>
                          {integrante.estadoVerificacion || 'PENDIENTE'}
                        </Text>
                      </View>

                      {/* Icono de tesorera */}
                      {integrante.esTesorera && (
                        <View style={styles.tesoreraIcon}>
                          <Text allowFontScaling={false} style={styles.tesoreraIconText}>👑</Text>
                        </View>
                      )}

                      <Text allowFontScaling={false} style={styles.integranteName}>
                        {integrante.nombre || 'Sin nombre'}
                      </Text>
                      <Text allowFontScaling={false} style={styles.integranteMeta}>
                        Teléfono: {formatPhone(integrante.telefono ?? '')}
                      </Text>
                      <Text allowFontScaling={false} style={styles.integranteMeta}>
                        Monto: {formatCurrency(integrante.montoSolicitado ?? 0)}
                      </Text>
                    </Card>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl
  },
  grupoBanner: {
    backgroundColor: moduleThemes.verification.headerBg,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.verification.titleBarBg,
  },
  grupoBannerText: {
    color: '#FDE047', // Amarillo brillante
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  kpisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  kpiBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[900],
    padding: spacing.xs,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 55,
  },
  kpiBubbleSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  kpiBubbleWarning: {
    backgroundColor: colors.gray[300],
    borderColor: colors.gray[500],
  },
  kpiBubbleDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.error,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  resumenContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[900],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenCardSmall: {
    flex: 0.7,
    alignItems: 'center',
  },
  resumenCardLarge: {
    flex: 2.3,
    alignItems: 'center',
  },
  resumenDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  resumenLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  resumenValor: {
    fontSize: 32,
    fontWeight: 'bold',
    color: moduleThemes.verification.primary,
  },
  section: { marginTop: spacing.sm },
  empty: { color: colors.textSecondary, ...typography.body },
  integranteCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[900],
  },
  positionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  positionBadgeText: {
    color: colors.gray[900],
    fontSize: 16,
    fontWeight: '700',
  },
  statusPill: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tesoreraIcon: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  tesoreraIconText: {
    fontSize: 24,
  },
  integranteName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  integranteMeta: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    ...typography.body
  },
  continueButton: {
    flex: 1,
    backgroundColor: moduleThemes.verification.headerBg,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D4B57E', // Amarillo claro del módulo (tono disabled)
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
