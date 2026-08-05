import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { api } from '../../services/api-client';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { llamar } from '../../utils/phone';
import { DocumentosScreen } from '../documentos';
import { IntegranteFormScreen } from '../integrantes';
import { SolicitudFormScreen } from '../solicitudes';
import { VerificacionSelectionScreen } from './VerificacionSelectionScreen';

export interface ExpedienteDetail {
  id: string;
  nombre?: string;
  estado: string;
  grupo_id: string;
  estado_fecha?: string;
}

interface GrupoInfo {
  id: string;
  nombre: string;
}

interface IntegranteStatusViewModel {
  id: string;
  nombre: string;
  telefono: string;
  montoSolicitado: number;
  solicitudStatus: 'Capturada' | 'Pendiente';
  documentosStatus: 'Capturados' | 'Pendientes';
  overallStatus: 'Completa' | 'Pendiente';
  pasoActual: number; // Siguiente paso a llenar (1-7)
  pasoCompletado: number; // Último paso completado (0-7) para la barra de progreso
}

interface ExpedienteDetailScreenProps {
  expedienteId: string;
  onBack?: () => void;
}

export const ExpedienteDetailScreen: React.FC<ExpedienteDetailScreenProps> = ({ expedienteId, onBack }) => {
  const [expediente, setExpediente] = useState<ExpedienteDetail | null>(null);
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [integrantes, setIntegrantes] = useState<IntegranteStatusViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedintegranteId, setSelectedintegranteId] = useState<string | null>(null);
  const [selectedintegranteNombre, setSelectedintegranteNombre] = useState<string | null>(null);
  const [selectedSolicitantePosition, setSelectedSolicitantePosition] = useState<number | null>(null);
  const [activeSolicitanteView, setActiveSolicitanteView] = useState<'solicitud' | 'documentos' | null>(null);
  const [initialStep, setInitialStep] = useState<number | undefined>(undefined);
  const [showVerificacionSelection, setShowVerificacionSelection] = useState(false);

  const calcularDiasEnEstado = (estadoFecha?: string): number => {
    if (!estadoFecha) return 0;
    const fechaEstado = new Date(estadoFecha);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fechaEstado.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const loadExpediente = async () => {
    try {
      const data = await api.get<any>(`/expedientes/${expedienteId}`);
      console.log('Expediente data:', JSON.stringify(data));
      setExpediente(data);

      // Cargar información del grupo
      if (data.grupo_id) {
        console.log('Cargando grupo con ID:', data.grupo_id);
        try {
          const grupoData = await api.get<any>(`/grupos/${data.grupo_id}`);
          console.log('Grupo data:', JSON.stringify(grupoData));
          setGrupo(grupoData);
        } catch {
          // Si falla, no mostramos el nombre del grupo
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  const loadSolicitantes = async () => {
    try {
      const data = await api.get<any>(`/integrantes/expediente/${expedienteId}`);
      const enriched = await Promise.all(
        data.map(async (integrante: any) => {
          try {
            let solicitud = null;
            try {
              solicitud = await api.get<any>(`/solicitudes/integrante/${integrante.id}`);
            } catch {
              // No tiene solicitud todavía
            }
            const hasSolicitud = Boolean(solicitud);

            // Verificar documentos OBLIGATORIOS directamente desde la solicitud
            // Los 4 documentos obligatorios son: INE, Comprobante Domicilio, INE Beneficiario, Solicitud Firmada
            const requiredDocumentsCaptured = solicitud ? (
              Boolean(solicitud.doc_ine_ruta) &&
              Boolean(solicitud.doc_comprobante_ruta) &&
              Boolean(solicitud.doc_ine_beneficiario_ruta) &&
              Boolean(solicitud.doc_solicitud_firmada_ruta)
            ) : false;

            // BUG 2 FIX: Solo marcar como "Capturada" si el estado es SUJETA_CREDITO
            const solicitudCapturada = integrante.estado === 'SUJETA_CREDITO';

            // Calcular paso actual (1-7)
            // Determinar el último paso COMPLETADO (para la barra de progreso)
            let pasoCompletado = 0;

            if (solicitud) {
              // Paso 1 completo: tiene CURP, fecha_nac y genero
              if (solicitud.curp && solicitud.fecha_nac && solicitud.genero) {
                pasoCompletado = 1;

                // Paso 2 completo: tiene domicilio
                if (solicitud.dom_calle && solicitud.dom_colonia && solicitud.dom_municipio) {
                  pasoCompletado = 2;

                  // Paso 3 completo: tiene referencias
                  if (solicitud.ref1_nombre && solicitud.ref2_nombre) {
                    pasoCompletado = 3;

                    // Paso 4 completo: tiene negocio
                    if (solicitud.negocio_giro && solicitud.negocio_ingreso_semanal) {
                      pasoCompletado = 4;

                      // Paso 5 completo: tiene beneficiario
                      if (solicitud.beneficiario_nombre && solicitud.beneficiario_parentesco) {
                        pasoCompletado = 5;

                        // Paso 6 completo: tiene validaciones
                        if (solicitud.tiene_medidor_luz !== null && solicitud.vive_max_5km_tesorera !== null) {
                          pasoCompletado = 6;

                          // Paso 7 completo: tiene documentos
                          if (requiredDocumentsCaptured) {
                            pasoCompletado = 7;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            // El siguiente paso a llenar es pasoCompletado + 1 (máximo 7)
            const pasoSiguiente = Math.min(pasoCompletado + 1, 7);

            return {
              ...integrante,
              solicitudStatus: solicitudCapturada ? 'Capturada' : 'Pendiente',
              documentosStatus: requiredDocumentsCaptured ? 'Capturados' : 'Pendientes',
              overallStatus: solicitudCapturada && requiredDocumentsCaptured ? 'Completa' : 'Pendiente',
              pasoActual: pasoSiguiente, // Para abrir en el paso correcto
              pasoCompletado, // Para mostrar el progreso en la barra
            } as IntegranteStatusViewModel;
          } catch {
            return {
              ...integrante,
              solicitudStatus: 'Pendiente',
              documentosStatus: 'Pendientes',
              overallStatus: 'Pendiente',
              pasoActual: 1,
              pasoCompletado: 0,
            } as IntegranteStatusViewModel;
          }
        }),
      );

      setIntegrantes(enriched);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadExpediente(), loadSolicitantes()]);
      setLoading(false);
    };

    loadAll();
  }, [expedienteId]);

  const handleSaved = async () => {
    setShowForm(false);
    setSelectedintegranteId(null);
    setSelectedintegranteNombre(null);
    setSelectedSolicitantePosition(null);
    setActiveSolicitanteView(null);
    setInitialStep(undefined);
    await loadSolicitantes();
  };

  // BUG 1 FIX: Actualización inmediata mientras edita
  const handleDataChange = useCallback((integranteId: string, data: { nombre?: string; telefono?: string; montoSolicitado?: number }) => {
    setIntegrantes((prev) =>
      prev.map((s) =>
        s.id === integranteId
          ? {
              ...s,
              ...(data.nombre !== undefined && { nombre: data.nombre }),
              ...(data.telefono !== undefined && { telefono: data.telefono }),
              ...(data.montoSolicitado !== undefined && { montoSolicitado: data.montoSolicitado }),
            }
          : s
      )
    );
  }, []);

  const handleSendToVerification = async () => {
    const completadas = integrantes.filter((integrante) => integrante.overallStatus === 'Completa').length;

    if (completadas < 1) {
      Alert.alert('No se puede enviar a verificación', 'Se requiere al menos 1 integrante completa.');
      return;
    }

    // Abrir pantalla de selección
    setShowVerificacionSelection(true);
  };

  const handleConfirmVerificacion = async (
    integrantesAprobados: string[],
    integrantesRechazados: { id: string; motivo: string }[]
  ) => {
    try {
      // TODO: Implementar endpoint que reciba la selección de integrantes
      const response = await api.patch<any>(`/expedientes/${expedienteId}/send-to-verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrantesAprobados,
          integrantesRechazados,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send expediente to verification');
      }

      const data = await response.json();
      setExpediente(data);
      setShowVerificacionSelection(false);
      Alert.alert(
        'Expediente enviado',
        `${integrantesAprobados.length} integrante(s) enviados a verificación.`
      );
      loadExpediente(); // Recargar expediente
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al enviar a verificación');
    }
  };

  // Mostrar pantalla de selección para verificación
  if (showVerificacionSelection) {
    return (
      <VerificacionSelectionScreen
        expedienteId={expedienteId}
        grupoNombre={grupo?.nombre || 'Grupo'}
        integrantes={integrantes.map((int) => ({
          id: int.id,
          nombre: int.nombre,
          montoSolicitado: int.montoSolicitado,
          estaCompleta: int.overallStatus === 'Completa',
        }))}
        onBack={() => {
          setShowVerificacionSelection(false);
          loadExpediente(); // Recargar expediente para mostrar cambios
        }}
        onConfirm={handleConfirmVerificacion}
      />
    );
  }

  if (selectedintegranteId && activeSolicitanteView === 'solicitud') {
    return (
      <SolicitudFormScreen
        integranteId={selectedintegranteId}
        integranteNombre={selectedintegranteNombre ?? undefined}
        groupName={grupo?.nombre}
        integrantePosition={selectedSolicitantePosition ?? undefined}
        integrantesTotal={integrantes.length || undefined}
        initialStep={initialStep}
        onSaved={handleSaved}
        onSavedGoToDocumentos={() => {
          setActiveSolicitanteView('documentos');
        }}
        onBack={handleSaved}
        onDataChange={(data) => handleDataChange(selectedintegranteId, data)}
      />
    );
  }

  if (selectedintegranteId && activeSolicitanteView === 'documentos') {
    return (
      <DocumentosScreen
        integranteId={selectedintegranteId}
        integranteNombre={selectedintegranteNombre ?? undefined}
        integrantePosition={selectedSolicitantePosition ?? undefined}
        integrantesTotal={integrantes.length || undefined}
        groupName={grupo?.nombre}
        onSaved={handleSaved}
        onBack={handleSaved}
      />
    );
  }

  if (showForm) {
    return <IntegranteFormScreen expedienteId={expedienteId} onSaved={handleSaved} onBack={handleSaved} />;
  }

  const completadas = integrantes.filter((integrante) => integrante.overallStatus === 'Completa').length;
  const pendientes = integrantes.length - completadas;
  const retiradas = 0;

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Detalle de Expediente" moduleTheme="documentation" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text allowFontScaling={false} style={styles.grupoBannerText}>{grupo?.nombre || 'Cargando grupo...'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : expediente ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.mainCard}>
            {/* Botones en la parte superior */}
            <View style={styles.buttonsRow}>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  title="Agregar integrante"
                  onPress={() => setShowForm(true)}
                  moduleTheme="documentation"
                  disabled={expediente.estado !== 'EN_DOCUMENTACION'}
                />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  title="Enviar a verificación"
                  onPress={handleSendToVerification}
                  moduleTheme="documentation"
                  disabled={expediente.estado !== 'EN_DOCUMENTACION'}
                />
              </View>
            </View>

            {/* Estado del expediente */}
            {expediente.estado === 'EN_VERIFICACION' ? (
              <View style={styles.estadoRow}>
                <View style={styles.estadoVerificacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoVerificacionTexto}>VERIFICANDO</Text>
                </View>
              </View>
            ) : expediente.estado === 'EN_DOCUMENTACION' ? (
              <View style={styles.estadoRow}>
                <View style={styles.estadoDocumentacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoDocumentacionTexto}>DOCUMENTANDO</Text>
                </View>
                <View style={styles.estadoDocumentacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoDocumentacionTexto}>
                    {calcularDiasEnEstado(expediente.estado_fecha)} {calcularDiasEnEstado(expediente.estado_fecha) === 1 ? 'DÍA' : 'DÍAS'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.estadoRow}>
                <Text allowFontScaling={false} style={styles.status}>Estado: {expediente.estado}</Text>
              </View>
            )}

            {/* KPIs en burbujas */}
            <View style={styles.kpisRow}>
              <View style={styles.kpiBubble}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{integrantes.length}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Total</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleSuccess]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{completadas}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Completa</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleWarning]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{pendientes}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Pendiente</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleDanger]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{retiradas}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Retirada</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <SectionTitle title="integrantes" />
            {integrantes.length === 0 ? (
              <Text allowFontScaling={false} style={styles.empty}>Aún no hay integrantes para este expediente.</Text>
            ) : (
              integrantes.map((integrante, index) => (
                <Pressable
                  key={integrante.id}
                  onPress={() => {
                    if (expediente.estado !== 'EN_DOCUMENTACION') {
                      Alert.alert(
                        'Expediente en verificación',
                        'No se pueden modificar los datos mientras el expediente está en verificación.',
                        [{ text: 'Entendido' }]
                      );
                      return;
                    }
                    setSelectedintegranteId(integrante.id);
                    setSelectedintegranteNombre(integrante.nombre);
                    setSelectedSolicitantePosition(index + 1);
                    setInitialStep(integrante.pasoActual);
                    setActiveSolicitanteView('solicitud');
                  }}
                >
                  <Card style={[
                    styles.integranteCard,
                    expediente.estado !== 'EN_DOCUMENTACION' && styles.integranteCardDisabled
                  ]}>
                    {/* Número de posición en esquina superior izquierda */}
                    <View style={styles.positionBadge}>
                      <Text allowFontScaling={false} style={styles.positionBadgeText}>{index + 1}/{integrantes.length}</Text>
                    </View>

                    {/* Burbuja de estado en esquina superior derecha */}
                    <View style={[styles.statusPill, integrante.overallStatus === 'Completa' ? styles.statusPillComplete : styles.statusPillPending]}>
                      <Text allowFontScaling={false} style={styles.statusPillText}>{integrante.overallStatus || 'Pendiente'}</Text>
                    </View>

                    <Text allowFontScaling={false} style={styles.integranteName}>{integrante.nombre || 'Sin nombre'}</Text>

                    {/* Barra de progreso compacta */}
                    <View style={styles.progressContainer}>
                      <Text allowFontScaling={false} style={styles.progressLabel}>
                        {integrante.pasoCompletado === 7 ? 'Completo 7/7' : `${integrante.pasoCompletado ?? 0} de 7 completos`}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            (integrante.pasoCompletado ?? 0) >= 7 ? styles.progressBarComplete : styles.progressBarIncomplete,
                            { width: `${((integrante.pasoCompletado ?? 0) / 7) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>

                    <Text allowFontScaling={false} style={styles.integranteMeta}>Teléfono: {formatPhone(integrante.telefono ?? '')}</Text>
                    <Text allowFontScaling={false} style={styles.integranteMeta}>Monto: {formatCurrency(integrante.montoSolicitado ?? 0)}</Text>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <Text allowFontScaling={false} style={styles.empty}>No se encontró el expediente.</Text>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xl },
  grupoBanner: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.documentation.titleBarBg,
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
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  estadoVerificacionBurbuja: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: '#D97706',
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  estadoVerificacionTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    textAlign: 'center',
  },
  estadoDocumentacionBurbuja: {
    backgroundColor: colors.successSoft,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  estadoDocumentacionTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  diasTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  kpisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  kpiBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#000000',
    padding: spacing.xs,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 55,
  },
  kpiBubbleSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: '#10B981',
  },
  kpiBubbleWarning: {
    backgroundColor: '#D1D5DB',
    borderColor: '#6B7280',
  },
  kpiBubbleDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#EF4444',
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
  section: { marginTop: spacing.sm },
  empty: { color: colors.textSecondary, ...typography.body },
  integranteCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#000000',
  },
  integranteCardDisabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[100],
  },
  integranteName: { ...typography.bodyStrong, color: colors.textPrimary },
  integranteMeta: { marginTop: spacing.xs, color: colors.textSecondary, ...typography.body },
  statusPill: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusPillComplete: {
    backgroundColor: colors.successSoft,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusPillPending: {
    backgroundColor: '#D1D5DB',
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  statusPillText: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  progressContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  progressBarIncomplete: {
    backgroundColor: '#FDE047',
  },
  progressBarComplete: {
    backgroundColor: '#10B981',
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
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  checkmark: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
});
