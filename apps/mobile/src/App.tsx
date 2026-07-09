import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Card, PrimaryButton, ScreenContainer, SecondaryButton, SectionTitle } from './components/ui';
import { ensureApiBaseUrlDiscovered, getApiDiscoveryErrorMessage } from './config/api';
import { ExpedienteDetailScreen, ExpedientesListScreen } from './features/expedientes';
import { CreateGroupScreen } from './features/grupos';
import { colors, spacing, typography } from './theme/tokens';

type AppScreen = 'home' | 'create-group' | 'expedientes';

export default function App() {
  const [apiReady, setApiReady] = useState(false);
  const [apiDiscoveryError, setApiDiscoveryError] = useState<string | null>(null);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [expedientesRefreshKey, setExpedientesRefreshKey] = useState(0);

  const runApiDiscovery = async () => {
    try {
      setApiDiscoveryError(null);
      await ensureApiBaseUrlDiscovered();
      setApiReady(true);
    } catch {
      setApiReady(false);
      setApiDiscoveryError(getApiDiscoveryErrorMessage());
    }
  };

  useEffect(() => {
    runApiDiscovery();
  }, []);

  const handleBackToList = () => {
    setSelectedExpedienteId(null);
    setScreen('expedientes');
    setExpedientesRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBackToHome = () => {
    setSelectedExpedienteId(null);
    setScreen('home');
  };

  if (!apiReady && !apiDiscoveryError) {
    return (
      <ScreenContainer contentStyle={styles.statusContainer}>
        <Card>
          <Text style={styles.title}>Conectando con API local...</Text>
          <ActivityIndicator style={styles.loader} size="large" />
        </Card>
      </ScreenContainer>
    );
  }

  if (apiDiscoveryError) {
    return (
      <ScreenContainer contentStyle={styles.statusContainer}>
        <Card>
          <Text style={styles.errorTitle}>{apiDiscoveryError}</Text>
          <Text style={styles.subtitle}>Verifica que la API esté encendida y vuelve a intentar.</Text>
          <PrimaryButton title="Reintentar conexión" onPress={runApiDiscovery} moduleTheme="documentation" />
        </Card>
      </ScreenContainer>
    );
  }

  if (selectedExpedienteId) {
    return <ExpedienteDetailScreen expedienteId={selectedExpedienteId} onBack={handleBackToList} />;
  }

  if (screen === 'create-group') {
    return (
      <CreateGroupScreen
        onBack={handleBackToHome}
        onCreated={() => {
          setScreen('expedientes');
          setExpedientesRefreshKey((currentKey) => currentKey + 1);
        }}
      />
    );
  }

  if (screen === 'expedientes') {
    return <ExpedientesListScreen onSelectExpediente={setSelectedExpedienteId} refreshKey={expedientesRefreshKey} onBack={handleBackToHome} />;
  }

  return (
    <ScreenContainer contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.title}>MVP Prototipo - Flujo de Documentacion</Text>
        <Text style={styles.subtitle}>Usa estas acciones para recorrer la revisión funcional end-to-end.</Text>
      </Card>

      <PrimaryButton title="1. Crear grupo" onPress={() => setScreen('create-group')} moduleTheme="documentation" />

      <SecondaryButton title="2. Ir a Mis expedientes" onPress={() => setScreen('expedientes')} />

      <Card>
        <SectionTitle title="Guia rapida de revision" />
        <Text style={styles.checklistItem}>1. Crear grupo</Text>
        <Text style={styles.checklistItem}>2. Mis expedientes</Text>
        <Text style={styles.checklistItem}>3. Abrir expediente</Text>
        <Text style={styles.checklistItem}>4. Agregar solicitante</Text>
        <Text style={styles.checklistItem}>5. Capturar solicitud</Text>
        <Text style={styles.checklistItem}>6. Capturar documentos</Text>
        <Text style={styles.checklistItem}>7. Ver estado del expediente</Text>
        <Text style={styles.checklistItem}>8. Enviar a verificacion</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  loader: {
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.sectionTitle,
    color: '#B42318',
    marginBottom: spacing.sm,
  },
  container: {
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroCard: { marginBottom: spacing.xs },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checklistItem: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
