import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, PrimaryButton, ScreenContainer, ScreenTitleBar, SectionTitle } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { DocumentosScreen } from '../documentos';
import { SolicitanteFormScreen } from '../solicitantes';
import { SolicitudFormScreen } from '../solicitudes';

export interface ExpedienteDetail {
  id: string;
  title: string;
  status: string;
}

interface SolicitanteStatusViewModel {
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
  const [solicitantes, setSolicitantes] = useState<SolicitanteStatusViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSolicitanteId, setSelectedSolicitanteId] = useState<string | null>(null);
  const [selectedSolicitanteNombre, setSelectedSolicitanteNombre] = useState<string | null>(null);
  const [activeSolicitanteView, setActiveSolicitanteView] = useState<'solicitud' | 'documentos' | null>(null);

  const loadExpediente = async () => {
    try {
      const response = await fetch(apiUrl(`/expedientes/${expedienteId}`));
      if (!response.ok) {
        throw new Error('Failed to load expediente');
      }

      const data = await response.json();
      setExpediente(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  const loadSolicitantes = async () => {
    try {
      const response = await fetch(apiUrl(`/solicitantes/expediente/${expedienteId}`));
      if (!response.ok) {
        throw new Error('Failed to load solicitantes');
      }

      const data = await response.json();
      const enriched = await Promise.all(
        data.map(async (solicitante: any) => {
          try {
            const solicitudResponse = await fetch(apiUrl(`/solicitudes/solicitante/${solicitante.id}`));
            const solicitud = solicitudResponse.ok ? await solicitudResponse.json() : null;
            const hasSolicitud = Boolean(solicitud);
            const documentosResponse = await fetch(apiUrl(`/documentos/solicitante/${solicitante.id}`));
            const documentos = documentosResponse.ok ? await documentosResponse.json() : [];
            const documentosRequeridos = documentos.filter((documento: any) => documento.requerido);
            const requiredDocumentsCaptured =
              documentosRequeridos.length > 0 &&
              documentosRequeridos.every((documento: any) => documento.estado === 'Capturado');

            return {
              ...solicitante,
              solicitudStatus: hasSolicitud ? 'Capturada' : 'Pendiente',
              documentosStatus: requiredDocumentsCaptured ? 'Capturados' : 'Pendientes',
              overallStatus: hasSolicitud && requiredDocumentsCaptured ? 'Completa' : 'Pendiente',
            } as SolicitanteStatusViewModel;
          } catch {
            return {
              ...solicitante,
              solicitudStatus: 'Pendiente',
              documentosStatus: 'Pendientes',
              overallStatus: 'Pendiente',
            } as SolicitanteStatusViewModel;
          }
        }),
      );

      setSolicitantes(enriched);
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
    setSelectedSolicitanteId(null);
    setSelectedSolicitanteNombre(null);
    setActiveSolicitanteView(null);
    await Promise.all([loadExpediente(), loadSolicitantes()]);
  };

  const handleSendToVerification = async () => {
    const completadas = solicitantes.filter((solicitante) => solicitante.overallStatus === 'Completa').length;
    const pendientes = solicitantes.filter((solicitante) => solicitante.overallStatus === 'Pendiente').length;
    const missingMessages: string[] = [];

    if (completadas < 1) {
      missingMessages.push('Se requiere al menos 1 solicitante completa.');
    }

    if (pendientes > 0) {
      missingMessages.push(`Hay ${pendientes} solicitante(s) pendiente(s).`);
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

  if (selectedSolicitanteId && activeSolicitanteView === 'solicitud') {
    return (
      <SolicitudFormScreen
        solicitanteId={selectedSolicitanteId}
        solicitanteNombre={selectedSolicitanteNombre ?? undefined}
        onSaved={handleSaved}
        onBack={handleSaved}
      />
    );
  }

  if (selectedSolicitanteId && activeSolicitanteView === 'documentos') {
    return <DocumentosScreen solicitanteId={selectedSolicitanteId} onSaved={handleSaved} onBack={handleSaved} />;
  }

  if (showForm) {
    return <SolicitanteFormScreen expedienteId={expedienteId} onSaved={handleSaved} onBack={handleSaved} />;
  }

  const completadas = solicitantes.filter((solicitante) => solicitante.overallStatus === 'Completa').length;
  const pendientes = solicitantes.length - completadas;
  const retiradas = 0;

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Detalle de Expediente" moduleTheme="documentation" />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : expediente ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>{expediente.title}</Text>
            <Text style={styles.status}>Estado: {expediente.status}</Text>
            <Text style={styles.helperText}>Revisa el expediente y completa solicitantes para enviarlo a verificación.</Text>
          </Card>

          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Solicitantes</Text>
              <Text style={styles.summaryValue}>{solicitantes.length}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Completas</Text>
              <Text style={styles.summaryValue}>{completadas}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pendientes</Text>
              <Text style={styles.summaryValue}>{pendientes}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Retiradas</Text>
              <Text style={styles.summaryValue}>{retiradas}</Text>
            </Card>
          </View>

          <View style={styles.actions}>
            <PrimaryButton title="Agregar solicitante" onPress={() => setShowForm(true)} moduleTheme="documentation" />
          </View>
          <View style={styles.actions}>
            <PrimaryButton title="Enviar a verificacion" onPress={handleSendToVerification} moduleTheme="documentation" />
          </View>

          <View style={styles.section}>
            <SectionTitle title="Solicitantes" />
            {solicitantes.length === 0 ? (
              <Text style={styles.empty}>Aún no hay solicitantes para este expediente.</Text>
            ) : (
              solicitantes.map((solicitante) => (
                <Card key={solicitante.id} style={styles.solicitanteCard}>
                  <Text style={styles.solicitanteName}>{solicitante.nombre}</Text>
                  <Text style={styles.solicitanteMeta}>Teléfono: {formatPhone(solicitante.telefono)}</Text>
                  <Text style={styles.solicitanteMeta}>Monto: {formatCurrency(solicitante.montoSolicitado)}</Text>
                  <Text style={styles.solicitanteMeta}>Solicitud: {solicitante.solicitudStatus}</Text>
                  <Text style={styles.solicitanteMeta}>Documentos: {solicitante.documentosStatus}</Text>
                  <View style={[styles.statusPill, solicitante.overallStatus === 'Completa' ? styles.statusPillComplete : styles.statusPillPending]}>
                    <Text style={styles.statusPillText}>{solicitante.overallStatus}</Text>
                  </View>
                  <View style={styles.solicitanteActions}>
                    <PrimaryButton
                      title="Capturar solicitud"
                      moduleTheme="documentation"
                      onPress={() => {
                        setSelectedSolicitanteId(solicitante.id);
                        setSelectedSolicitanteNombre(solicitante.nombre);
                        setActiveSolicitanteView('solicitud');
                      }}
                    />
                  </View>
                  <View style={styles.solicitanteActions}>
                    <PrimaryButton
                      title="Documentos"
                      moduleTheme="documentation"
                      onPress={() => {
                        setSelectedSolicitanteId(solicitante.id);
                        setActiveSolicitanteView('documentos');
                      }}
                    />
                  </View>
                </Card>
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
  card: { marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  status: { marginTop: spacing.sm, color: colors.textSecondary, ...typography.body },
  helperText: { marginTop: spacing.sm, color: colors.textSecondary, ...typography.body },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  summaryCard: {
    minWidth: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  summaryLabel: { color: colors.textSecondary, ...typography.caption },
  summaryValue: { marginTop: spacing.xs, color: colors.textPrimary, ...typography.title },
  actions: { marginBottom: spacing.md },
  section: { marginTop: spacing.sm },
  empty: { color: colors.textSecondary, ...typography.body },
  solicitanteCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  solicitanteName: { ...typography.bodyStrong, color: colors.textPrimary },
  solicitanteMeta: { marginTop: spacing.xs, color: colors.textSecondary, ...typography.body },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusPillComplete: { backgroundColor: colors.successSoft },
  statusPillPending: { backgroundColor: colors.dangerSoft },
  statusPillText: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  solicitanteActions: { marginTop: spacing.sm },
});
