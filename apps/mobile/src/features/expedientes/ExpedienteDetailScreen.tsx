import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { llamar } from '../../utils/phone';
import { DocumentosScreen } from '../documentos';
import { IntegranteFormScreen } from '../integrantes';
import { SolicitudFormScreen } from '../solicitudes';

export interface ExpedienteDetail {
  id: string;
  nombre?: string;
  estado: string;
  grupo_id: string;
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

  const loadExpediente = async () => {
    try {
      const response = await fetch(apiUrl(`/expedientes/${expedienteId}`));
      if (!response.ok) {
        throw new Error('Failed to load expediente');
      }

      const data = await response.json();
      console.log('Expediente data:', JSON.stringify(data));
      setExpediente(data);

      // Cargar información del grupo
      if (data.grupo_id) {
        console.log('Cargando grupo con ID:', data.grupo_id);
        try {
          const grupoResponse = await fetch(apiUrl(`/grupos/${data.grupo_id}`));
          if (grupoResponse.ok) {
            const grupoData = await grupoResponse.json();
            console.log('Grupo data:', JSON.stringify(grupoData));
            setGrupo(grupoData);
          }
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
      const response = await fetch(apiUrl(`/integrantes/expediente/${expedienteId}`));
      if (!response.ok) {
        throw new Error('Failed to load integrantes');
      }

      const data = await response.json();
      const enriched = await Promise.all(
        data.map(async (integrante: any) => {
          try {
            const solicitudResponse = await fetch(apiUrl(`/solicitudes/integrante/${integrante.id}`));
            let solicitud = null;
            if (solicitudResponse.ok) {
              const text = await solicitudResponse.text();
              if (text) {
                solicitud = JSON.parse(text);
              }
            }
            const hasSolicitud = Boolean(solicitud);
            const documentosResponse = await fetch(apiUrl(`/documentos/integrante/${integrante.id}`));
            let documentos = [];
            if (documentosResponse.ok) {
              const text = await documentosResponse.text();
              if (text) {
                documentos = JSON.parse(text);
              }
            }
            const documentosRequeridos = documentos.filter((documento: any) => documento.requerido);
            const requiredDocumentsCaptured =
              documentosRequeridos.length > 0 &&
              documentosRequeridos.every((documento: any) => documento.estado === 'Capturado');

            // BUG 2 FIX: Solo marcar como "Capturada" si el estado es SUJETA_CREDITO
            const solicitudCapturada = integrante.estado === 'SUJETA_CREDITO';

            return {
              ...integrante,
              solicitudStatus: solicitudCapturada ? 'Capturada' : 'Pendiente',
              documentosStatus: requiredDocumentsCaptured ? 'Capturados' : 'Pendientes',
              overallStatus: solicitudCapturada && requiredDocumentsCaptured ? 'Completa' : 'Pendiente',
            } as IntegranteStatusViewModel;
          } catch {
            return {
              ...integrante,
              solicitudStatus: 'Pendiente',
              documentosStatus: 'Pendientes',
              overallStatus: 'Pendiente',
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
    const pendientes = integrantes.filter((integrante) => integrante.overallStatus === 'Pendiente').length;
    const missingMessages: string[] = [];

    if (completadas < 1) {
      missingMessages.push('Se requiere Al menos 1 integrante completa.');
    }

    if (pendientes > 0) {
      missingMessages.push(`Hay ${pendientes} integrante(s) pendiente(s).`);
    }

    if (missingMessages.length > 0) {
      Alert.alert('No se puede enviar a verificacion', missingMessages.join('\n'));
      return;
    }

    try {
      const response = await fetch(apiUrl(`/expedientes/${expedienteId}/send-to-verification`), {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to send expediente to verification');
      }

      const data = await response.json();
      setExpediente(data);
      Alert.alert('Expediente enviado', 'El expediente ahora esta en verificacion.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  if (selectedintegranteId && activeSolicitanteView === 'solicitud') {
    return (
      <SolicitudFormScreen
        integranteId={selectedintegranteId}
        integranteNombre={selectedintegranteNombre ?? undefined}
        groupName={grupo?.nombre}
        integrantePosition={selectedSolicitantePosition ?? undefined}
        integrantesTotal={integrantes.length || undefined}
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
        <Text style={styles.grupoBannerText}>{grupo?.nombre || 'Cargando grupo...'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : expediente ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.mainCard}>
            {/* Botones en la parte superior */}
            <View style={styles.buttonsRow}>
              <View style={styles.buttonHalf}>
                <PrimaryButton title="Agregar integrante" onPress={() => setShowForm(true)} moduleTheme="documentation" />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton title="Enviar a verificación" onPress={handleSendToVerification} moduleTheme="documentation" />
              </View>
            </View>

            {/* Estado del expediente */}
            <Text style={styles.status}>Estado: {expediente.estado}</Text>

            {/* KPIs en burbujas */}
            <View style={styles.kpisRow}>
              <View style={styles.kpiBubble}>
                <Text style={styles.kpiValue}>{integrantes.length}</Text>
                <Text style={styles.kpiLabel}>Total</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleSuccess]}>
                <Text style={styles.kpiValue}>{completadas}</Text>
                <Text style={styles.kpiLabel}>Completa</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleWarning]}>
                <Text style={styles.kpiValue}>{pendientes}</Text>
                <Text style={styles.kpiLabel}>Pendiente</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleDanger]}>
                <Text style={styles.kpiValue}>{retiradas}</Text>
                <Text style={styles.kpiLabel}>Retirada</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <SectionTitle title="integrantes" />
            {integrantes.length === 0 ? (
              <Text style={styles.empty}>Aún no hay integrantes para este expediente.</Text>
            ) : (
              integrantes.map((integrante, index) => (
                <Pressable
                  key={integrante.id}
                  onPress={() => {
                    setSelectedintegranteId(integrante.id);
                    setSelectedintegranteNombre(integrante.nombre);
                    setSelectedSolicitantePosition(index + 1);
                    setActiveSolicitanteView('solicitud');
                  }}
                >
                  <Card style={styles.integranteCard}>
                    {/* Número de posición en esquina superior derecha */}
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionBadgeText}>{index + 1}/{integrantes.length}</Text>
                    </View>

                    <Text style={styles.integranteName}>{integrante.nombre}</Text>
                    <TouchableOpacity
                      onPress={() => llamar(integrante.telefono, integrante.nombre)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.integranteMeta}>📞 Teléfono: {formatPhone(integrante.telefono ?? '')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.integranteMeta}>Monto: {formatCurrency(integrante.montoSolicitado ?? 0)}</Text>
                    <Text style={styles.integranteMeta}>
                      Solicitud: {integrante.solicitudStatus}{' '}
                      {integrante.solicitudStatus === 'Capturada' && <Text style={styles.checkmark}>✓</Text>}
                    </Text>
                    <Text style={styles.integranteMeta}>
                      Documentos: {integrante.documentosStatus}{' '}
                      {integrante.documentosStatus === 'Capturados' && <Text style={styles.checkmark}>✓</Text>}
                    </Text>
                    <View style={[styles.statusPill, integrante.overallStatus === 'Completa' ? styles.statusPillComplete : styles.statusPillPending]}>
                      <Text style={styles.statusPillText}>{integrante.overallStatus}</Text>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No se encontró el expediente.</Text>
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
    paddingVertical: spacing.md,
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
    letterSpacing: 1,
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
  kpisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  kpiBubble: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    padding: spacing.sm,
    paddingTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 70,
  },
  kpiBubbleSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: '#10B981',
  },
  kpiBubbleWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  kpiBubbleDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#EF4444',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 9,
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
  integranteName: { ...typography.bodyStrong, color: colors.textPrimary },
  integranteMeta: { marginTop: spacing.xs, color: colors.textSecondary, ...typography.body },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
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
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  statusPillText: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
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
