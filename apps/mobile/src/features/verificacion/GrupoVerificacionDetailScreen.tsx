import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ContactCallRow, ContextHeader, IntegranteCard, PrimaryButton, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api-client';
import {
  completarDistanciasAproximadas,
  DISTANCIA_MAXIMA_TESORERA_KM,
} from '../../services/domicilio-distance';
import { colors, layout, moduleThemes, radius, spacing, touchTargets, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { llamar } from '../../utils/phone';
import {
  getLocalVerificationProgress,
  VERIFICATION_TOTAL_STEPS,
} from './verificacion-progress.storage';
import { VERIFICACION_READ_REQUEST_OPTIONS } from './verificacion-api-context';
import {
  calcularResumenGrupoVerificacion,
  type EstadoVerificacionGrupo,
} from './grupo-verificacion-summary';
import { obtenerIntegrantesVerificadasRequeridas } from '../parametros/parametros-verificacion-cierre.api';
import { evaluarFinalizacionGrupo } from './grupo-verificacion-finalizacion';

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

interface AsesoraInfo {
  id: string;
  nombre: string;
  abreviatura: string | null;
  telefono: string | null;
}

interface ExpedienteVerificacionDetalle {
  grupo?: {
    id: string;
    nombre: string;
    estado: string;
  } | null;
  asesora?: AsesoraInfo | null;
}

interface IntegranteVerificacion {
  id: string;
  nombre: string;
  telefono: string | null;
  montoSolicitado: number | null;
  montoVerificado: number | null;
  montoAutorizadoAnterior: number | null;
  esNuevaConNosotros: boolean;
  tieneHistorialInterno: boolean | null;
  edad: number | null;
  superaLimiteEdad: boolean;
  distanciaTesoreraAproxKm: number | null;
  estadoVerificacion: EstadoVerificacionGrupo;
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
  const [asesora, setAsesora] = useState<AsesoraInfo | null>(null);
  const [cicloNumeroActual, setCicloNumeroActual] = useState<number | null>(null);
  const [integrantesVerificadasRequeridas, setIntegrantesVerificadasRequeridas] = useState<number | null>(null);
  const [estadoParametroCierre, setEstadoParametroCierre] = useState<
    'loading' | 'ready' | 'unconfigured' | 'error'
  >('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setCicloNumeroActual(null);
      setIntegrantesVerificadasRequeridas(null);
      setEstadoParametroCierre('loading');
      try {
        const expData = await api.get<ExpedienteVerificacionDetalle>(
          `/expedientes/${expedienteId}`,
          VERIFICACION_READ_REQUEST_OPTIONS,
        );
        setAsesora(expData.asesora ?? null);

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
            montoVerificado: (int.montoVerificado ?? int.monto_verificado) == null
              ? null
              : Number(int.montoVerificado ?? int.monto_verificado),
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

        try {
          const response = await obtenerIntegrantesVerificadasRequeridas();
          if (response.parametro) {
            setIntegrantesVerificadasRequeridas(
              response.parametro.integrantes_verificadas_requeridas,
            );
            setEstadoParametroCierre('ready');
          } else {
            setEstadoParametroCierre('unconfigured');
          }
        } catch {
          setEstadoParametroCierre('error');
        }
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

  const resumenGrupo = calcularResumenGrupoVerificacion(integrantes);
  const finalizacion = evaluarFinalizacionGrupo(
    resumenGrupo.integrantesVerificadas,
    integrantesVerificadasRequeridas,
  );
  const mensajeFinalizacion = estadoParametroCierre === 'ready'
    ? finalizacion.habilitado
      ? `Requisito cumplido: ${resumenGrupo.integrantesVerificadas} de ${integrantesVerificadasRequeridas} verificadas.`
      : `Faltan ${finalizacion.faltantes} ${finalizacion.faltantes === 1 ? 'integrante verificada' : 'integrantes verificadas'} para habilitar el cierre.`
    : estadoParametroCierre === 'unconfigured'
      ? 'Administración debe configurar cuántas integrantes verificadas habilitan el cierre.'
      : estadoParametroCierre === 'error'
        ? 'No se pudo confirmar el parámetro de cierre. Revisa la conexión.'
        : 'Consultando el parámetro de cierre…';
  const telefonoAsesoraVisible = asesora?.telefono || '0000000000';

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
            <ContactCallRow
              label="Asesor"
              name={asesora?.abreviatura || 'SIN ABREV.'}
              phone={telefonoAsesoraVisible}
              moduleTheme="verification"
              onCall={() => llamar(telefonoAsesoraVisible, asesora?.nombre || 'el asesor')}
            />

            {/* Resumen solicitado y verificado */}
            <View style={styles.resumenContainer}>
              <View style={[styles.resumenRow, styles.resumenRowSolicitado]}>
                <View style={styles.resumenCardSmall}>
                  <Text allowFontScaling={false} style={styles.resumenLabel}>Integrantes</Text>
                  <Text allowFontScaling={false} style={[styles.resumenValor, styles.resumenValorSolicitado]}>
                    {resumenGrupo.integrantes}
                  </Text>
                </View>

                <View style={styles.resumenDividerVertical} />

                <View style={styles.resumenCardLarge}>
                  <Text allowFontScaling={false} style={styles.resumenLabel}>Monto solicitado</Text>
                  <Text allowFontScaling={false} style={[styles.resumenValor, styles.resumenValorSolicitado]}>
                    {formatCurrency(resumenGrupo.montoSolicitado)}
                  </Text>
                </View>
              </View>

              <View style={styles.resumenDividerHorizontal} />

              <View style={styles.resumenRow}>
                <View style={styles.resumenCardSmall}>
                  <Text allowFontScaling={false} style={styles.resumenLabel}>Verificadas</Text>
                  <Text allowFontScaling={false} style={styles.resumenValor}>
                    {resumenGrupo.integrantesVerificadas}
                  </Text>
                </View>

                <View style={styles.resumenDividerVertical} />

                <View style={styles.resumenCardLarge}>
                  <Text allowFontScaling={false} style={styles.resumenLabel}>Monto verificado</Text>
                  <Text allowFontScaling={false} style={styles.resumenValor}>
                    {resumenGrupo.montoVerificado == null
                      ? '—'
                      : formatCurrency(resumenGrupo.montoVerificado)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de finalizar verificación */}
            <PrimaryButton
              title="Finalizar Verificación de Grupo"
              moduleTheme="verification"
              onPress={() => {
                Alert.alert(
                  'Finalizar verificación',
                  '¿Estás seguro de finalizar la verificación de este grupo?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Finalizar',
                      onPress: () => {
                        Alert.alert(
                          'Cierre pendiente',
                          'El requisito de integrantes está cumplido. La transición final del grupo todavía no está habilitada en el servidor.',
                        );
                      }
                    }
                  ]
                );
              }}
              disabled={!finalizacion.habilitado}
            />
            <Text allowFontScaling={false} style={styles.finalizacionHelp}>
              {mensajeFinalizacion}
            </Text>
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
                  verifiedAmount={integrante.montoVerificado}
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
                    : formatCurrency(integrante.montoSolicitado)}. Monto verificado ${
                    integrante.montoVerificado == null
                      ? 'pendiente'
                      : formatCurrency(integrante.montoVerificado)
                  }. Estado ${integrante.estadoVerificacion || 'PENDIENTE'}.`}
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
    width: '100%',
    maxWidth: layout.detailMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl
  },
  mainCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  resumenContainer: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[900],
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenRow: {
    minHeight: touchTargets.primary,
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  resumenRowSolicitado: {
    backgroundColor: colors.infoSoft,
  },
  resumenCardSmall: {
    flex: 0.7,
    alignItems: 'center',
  },
  resumenCardLarge: {
    flex: 2.3,
    alignItems: 'center',
  },
  resumenDividerVertical: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  resumenDividerHorizontal: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  resumenLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resumenValor: {
    ...typography.metricValue,
    color: moduleThemes.verification.primary,
  },
  resumenValorSolicitado: {
    color: colors.info,
  },
  section: { marginTop: spacing.sm },
  empty: { color: colors.textSecondary, ...typography.body },
  integranteCard: {
    marginBottom: spacing.sm,
  },
  finalizacionHelp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
