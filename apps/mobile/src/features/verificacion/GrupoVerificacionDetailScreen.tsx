import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, ContextHeader, IntegranteCard, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api-client';
import {
  completarDistanciasAproximadas,
  DISTANCIA_MAXIMA_TESORERA_KM,
} from '../../services/domicilio-distance';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  getLocalVerificationProgress,
  VERIFICATION_TOTAL_STEPS,
} from './verificacion-progress.storage';
import { VERIFICACION_READ_REQUEST_OPTIONS } from './verificacion-api-context';

const parseCycleNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

interface GrupoInfo {
  id: string;
  nombre: string;
  estado: string;
  expedienteId: string;
}

interface IntegranteVerificacion {
  id: string;
  nombre: string;
  telefono: string | null;
  montoSolicitado: number | null;
  montoAutorizadoAnterior: number | null;
  esNuevaConNosotros: boolean;
  tieneHistorialInterno: boolean | null;
  edad: number | null;
  superaLimiteEdad: boolean;
  distanciaTesoreraAproxKm: number | null;
  estadoVerificacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;
  esTesorera: boolean;
  completedSteps: number;
  needsDocumentation: boolean;
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
  const { usuario } = useAuth();
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [integrantes, setIntegrantes] = useState<IntegranteVerificacion[]>([]);
  const [cicloNumeroActual, setCicloNumeroActual] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setCicloNumeroActual(null);
      try {
        const expData = await api.get<any>(
          `/expedientes/${expedienteId}`,
          VERIFICACION_READ_REQUEST_OPTIONS,
        );

        if (expData.grupo) {
          const grupoData = {
            id: expData.grupo.id,
            nombre: expData.grupo.nombre,
            estado: expData.grupo.estado,
            expedienteId,
          };
          setGrupo(grupoData);
          onGrupoLoaded?.(grupoData.nombre);
        }

        const integrantesData = await api.get<any[]>(
          `/integrantes/expediente/${expedienteId}`,
          VERIFICACION_READ_REQUEST_OPTIONS,
        );

        const integrantesActivas = integrantesData
          .filter((int: any) => int.estado !== 'RETIRADA');
        const ciclosPorIntegrante = integrantesActivas.map((int: any) => (
          parseCycleNumber(int.cicloNumeroActual ?? int.ciclo)
        ));
        const ciclosActuales = Array.from(new Set(
          ciclosPorIntegrante.filter((ciclo): ciclo is number => ciclo != null),
        ));
        setCicloNumeroActual(
          ciclosPorIntegrante.length > 0
            && ciclosPorIntegrante.every((ciclo) => ciclo != null)
            && ciclosActuales.length === 1
            ? ciclosActuales[0]
            : null,
        );
        const integrantesConDistancias = await completarDistanciasAproximadas(integrantesActivas);

        const enriched = await Promise.all(integrantesConDistancias.map(async (int: any) => {
          const progress = usuario?.id
            ? await getLocalVerificationProgress(usuario.id, int.id)
            : null;

          return {
            ...int,
            montoSolicitado: int.montoSolicitado == null
              ? null
              : Number(int.montoSolicitado),
            montoAutorizadoAnterior: int.montoAutorizadoAnterior == null
              ? null
              : Number(int.montoAutorizadoAnterior),
            esNuevaConNosotros: int.es_nueva_con_nosotros === true,
            tieneHistorialInterno: typeof int.tiene_historial_interno === 'boolean'
              ? int.tiene_historial_interno
              : null,
            edad: Number.isFinite(Number(int.edad)) ? Number(int.edad) : null,
            superaLimiteEdad: int.supera_limite_edad === true,
            distanciaTesoreraAproxKm: int.distancia_tesorera_aprox_km != null
              && Number.isFinite(Number(int.distancia_tesorera_aprox_km))
              ? Number(int.distancia_tesorera_aprox_km)
              : null,
            estadoVerificacion: int.estado === 'AUTORIZADA'
              ? 'APROBADO'
              : int.estado === 'RECHAZADA'
                ? 'RECHAZADO'
                : 'PENDIENTE',
            esTesorera: int.es_tesorera || int.esTesorera || false,
            completedSteps: int.estado === 'DOCUMENTANDO' ? 0 : progress?.completedSteps ?? 0,
            needsDocumentation: int.estado === 'DOCUMENTANDO',
          };
        }));

        setIntegrantes(enriched);
      } catch (error) {
        Alert.alert(
          'No se pudo abrir el grupo',
          error instanceof Error ? error.message : 'Revisa tu conexión e intenta nuevamente.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [expedienteId, usuario?.id]);

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

      <ContextHeader
        title={grupo?.nombre || 'Cargando...'}
        trailingText={cicloNumeroActual == null ? 'CICLO N/D' : `CICLO ${cicloNumeroActual}`}
        moduleTheme="verification"
        tone="brandAccent"
      />

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
                <Text allowFontScaling={false} style={styles.kpiLabel}>No aprobadas</Text>
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
              integrantes.map((integrante, index) => (
                <IntegranteCard
                  key={integrante.id}
                  name={integrante.nombre || 'Sin nombre'}
                  position={index + 1}
                  total={integrantes.length}
                  phone={integrante.telefono}
                  age={integrante.edad}
                  ageWarning={integrante.superaLimiteEdad}
                  completedSteps={integrante.completedSteps}
                  totalSteps={VERIFICATION_TOTAL_STEPS}
                  previousCreditAmount={integrante.montoAutorizadoAnterior}
                  requestedAmount={integrante.montoSolicitado}
                  distanceToTreasurerLabel={integrante.distanciaTesoreraAproxKm == null
                    ? 'DIST. N/D'
                    : `DIST. ${integrante.distanciaTesoreraAproxKm.toFixed(1)} KM`}
                  distanceToTreasurerWarning={integrante.distanciaTesoreraAproxKm != null
                    && integrante.distanciaTesoreraAproxKm > DISTANCIA_MAXIMA_TESORERA_KM}
                  isNewMember={integrante.esNuevaConNosotros}
                  status={integrante.estadoVerificacion === 'RECHAZADO'
                    ? 'rejected'
                    : integrante.needsDocumentation
                      ? 'needsDocumentation'
                      : 'neutral'}
                  roleLabel={integrante.esTesorera ? 'Tesorera' : undefined}
                  roleMark={integrante.esTesorera ? 'T' : undefined}
                  style={styles.integranteCard}
                  accessibilityLabel={`${integrante.nombre || 'Integrante'}, ${index + 1} de ${integrantes.length}.${integrante.esTesorera ? ' Tesorera del grupo.' : ''}${integrante.esNuevaConNosotros ? ' Integrante nueva con CRELEALTAD.' : ''}${integrante.estadoVerificacion === 'RECHAZADO' ? ' No aprobada.' : integrante.needsDocumentation ? ' Revisar documentación.' : ''} Edad: ${integrante.edad == null ? 'sin registro' : `${integrante.edad} años`}.${integrante.superaLimiteEdad ? ' Supera el límite de 70 años.' : ''}${integrante.distanciaTesoreraAproxKm == null ? '' : ` Distancia aproximada en línea recta al domicilio de la tesorera: ${integrante.distanciaTesoreraAproxKm.toFixed(1)} kilómetros.`} Avance de verificación ${integrante.completedSteps} de ${VERIFICATION_TOTAL_STEPS}. Crédito anterior ${
                    integrante.montoAutorizadoAnterior == null
                      ? 'sin registro'
                      : formatCurrency(integrante.montoAutorizadoAnterior)
                  }. Monto solicitado ${integrante.montoSolicitado == null
                    ? 'sin captura'
                    : formatCurrency(integrante.montoSolicitado)}. Monto verificado pendiente. Estado ${integrante.estadoVerificacion || 'PENDIENTE'}.`}
                  onPress={() => {
                    onSelectIntegrante?.(integrante.id, index + 1, integrantes.length);
                  }}
                />
              ))
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
