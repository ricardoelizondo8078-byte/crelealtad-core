import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFonts, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Card, PrimaryButton, ScreenContainer, SecondaryButton, SectionTitle } from './components/ui';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './features/auth';
import { ExpedienteDetailScreen, ExpedientesListScreen } from './features/expedientes';
import { CreateGroupScreen } from './features/grupos';
import { GruposVerificacionListScreen, GrupoVerificacionDetailScreen, IntegranteVerificacionScreen } from './features/verificacion';
import { colors, spacing, typography } from './theme/tokens';

// Mantener splash screen visible hasta que las fuentes carguen
SplashScreen.preventAutoHideAsync();

type AppScreen = 'home' | 'create-group' | 'expedientes' | 'verificacion';

function AppContent() {
  const { usuario, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [expedientesRefreshKey, setExpedientesRefreshKey] = useState(0);
  const [selectedGrupoVerificacionId, setSelectedGrupoVerificacionId] = useState<string | null>(null);
  const [selectedIntegranteVerificacionId, setSelectedIntegranteVerificacionId] = useState<string | null>(null);
  const [integranteVerificacionPosition, setIntegranteVerificacionPosition] = useState<number | undefined>(undefined);
  const [integranteVerificacionTotal, setIntegranteVerificacionTotal] = useState<number | undefined>(undefined);
  const [grupoVerificacionNombre, setGrupoVerificacionNombre] = useState<string | null>(null);
  const [verificacionRefreshKey, setVerificacionRefreshKey] = useState(0);

  const handleBackToList = () => {
    setSelectedExpedienteId(null);
    setScreen('expedientes');
    setExpedientesRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBackToHome = () => {
    setSelectedExpedienteId(null);
    setSelectedGrupoVerificacionId(null);
    setSelectedIntegranteVerificacionId(null);
    setGrupoVerificacionNombre(null);
    setScreen('home');
  };

  const handleBackToVerificacionList = () => {
    setSelectedGrupoVerificacionId(null);
    setSelectedIntegranteVerificacionId(null);
    setIntegranteVerificacionPosition(undefined);
    setIntegranteVerificacionTotal(undefined);
    setGrupoVerificacionNombre(null);
    setScreen('verificacion');
    setVerificacionRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBackToGrupoVerificacion = () => {
    setSelectedIntegranteVerificacionId(null);
    setIntegranteVerificacionPosition(undefined);
    setIntegranteVerificacionTotal(undefined);
  };

  const handleSelectIntegranteVerificacion = (integranteId: string, position?: number, total?: number) => {
    setSelectedIntegranteVerificacionId(integranteId);
    setIntegranteVerificacionPosition(position);
    setIntegranteVerificacionTotal(total);
  };

  // Mostrar login si no hay usuario autenticado
  if (!authLoading && !usuario) {
    return <LoginScreen />;
  }

  // Pantalla de verificación de integrante
  if (selectedIntegranteVerificacionId && selectedGrupoVerificacionId) {
    return (
      <IntegranteVerificacionScreen
        integranteId={selectedIntegranteVerificacionId}
        nombreGrupo={grupoVerificacionNombre || ''}
        integrantePosition={integranteVerificacionPosition}
        integrantesTotal={integranteVerificacionTotal}
        onBack={handleBackToGrupoVerificacion}
        onComplete={handleBackToVerificacionList}
      />
    );
  }

  // Pantalla de detalle de grupo en verificación
  if (selectedGrupoVerificacionId) {
    return (
      <GrupoVerificacionDetailScreen
        expedienteId={selectedGrupoVerificacionId}
        onBack={handleBackToVerificacionList}
        onSelectIntegrante={handleSelectIntegranteVerificacion}
        onGrupoLoaded={setGrupoVerificacionNombre}
      />
    );
  }

  // Pantalla de detalle de expediente (documentación)
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

  if (screen === 'verificacion') {
    return (
      <GruposVerificacionListScreen
        onSelectGrupo={setSelectedGrupoVerificacionId}
        refreshKey={verificacionRefreshKey}
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <ScreenContainer contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text allowFontScaling={false} style={styles.title}>MVP Prototipo - Flujo de Documentacion</Text>
        <Text allowFontScaling={false} style={styles.subtitle}>Usa estas acciones para recorrer la revisión funcional end-to-end.</Text>
      </Card>

      <PrimaryButton title="1. Crear grupo" onPress={() => setScreen('create-group')} moduleTheme="documentation" />

      <SecondaryButton title="2. Ir a Mis expedientes" onPress={() => setScreen('expedientes')} />

      <PrimaryButton title="3. Verificación de grupos" onPress={() => setScreen('verificacion')} moduleTheme="verification" />

      <Card>
        <SectionTitle title="Guia rapida de revision" />
        <Text allowFontScaling={false} style={styles.checklistItem}>1. Crear grupo</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>2. Mis expedientes</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>3. Abrir expediente</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>4. Agregar integrante</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>5. Capturar solicitud</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>6. Capturar documentos</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>7. Ver estado del expediente</Text>
        <Text allowFontScaling={false} style={styles.checklistItem}>8. Enviar a verificacion</Text>
      </Card>
    </ScreenContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
