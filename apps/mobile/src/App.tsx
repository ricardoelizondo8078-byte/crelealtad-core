import { useEffect, useState } from 'react';
import { useFonts, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PendingReviewsProvider, usePendingReviews } from './context/PendingReviewsContext';
import { ProcessingProvider } from './context/ProcessingContext';
import { ChangePinScreen, LoginScreen } from './features/auth';
import { ExpedienteDetailScreen, ExpedientesListScreen } from './features/expedientes';
import { CreateGroupScreen } from './features/grupos';
import {
  buildOperationalModuleOptions,
  DocumentationHomeScreen,
  ModuleMenuScreen,
  useOperationalAccess,
} from './features/inicio';
import { GruposVerificacionListScreen, GrupoVerificacionDetailScreen, IntegranteVerificacionScreen } from './features/verificacion';
import { RenovacionScreen } from './features/renovaciones';
import { PendingReviewOverlay } from './features/pendientes';

// Mantener splash screen visible hasta que las fuentes carguen
SplashScreen.preventAutoHideAsync();

type AppScreen = 'modules' | 'documentation' | 'create-group' | 'expedientes' | 'renovacion' | 'verificacion';

function AppContent() {
  const { usuario, loading: authLoading, logout } = useAuth();
  const { requestedExpedienteId, consumeRequestedExpediente } = usePendingReviews();
  const {
    canCreateGroup: puedeCrearGrupo,
    canViewExpedientes: puedeVerExpedientes,
    canViewVerification: puedeVerVerificacion,
    canRenew: puedeRenovar,
    canOpenDocumentation: puedeAbrirDocumentacion,
  } = useOperationalAccess();
  const [screen, setScreen] = useState<AppScreen>('modules');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [expedientesRefreshKey, setExpedientesRefreshKey] = useState(0);
  const [newlyCreatedExpedienteId, setNewlyCreatedExpedienteId] = useState<string | null>(null);
  const [selectedGrupoVerificacionId, setSelectedGrupoVerificacionId] = useState<string | null>(null);
  const [selectedIntegranteVerificacionId, setSelectedIntegranteVerificacionId] = useState<string | null>(null);
  const [integranteVerificacionPosition, setIntegranteVerificacionPosition] = useState<number | undefined>(undefined);
  const [integranteVerificacionTotal, setIntegranteVerificacionTotal] = useState<number | undefined>(undefined);
  const [grupoVerificacionNombre, setGrupoVerificacionNombre] = useState<string | null>(null);
  const [verificacionRefreshKey, setVerificacionRefreshKey] = useState(0);
  const [expedienteOpenedFromPending, setExpedienteOpenedFromPending] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setSelectedExpedienteId(null);
    setNewlyCreatedExpedienteId(null);
    setSelectedGrupoVerificacionId(null);
    setSelectedIntegranteVerificacionId(null);
    setIntegranteVerificacionPosition(undefined);
    setIntegranteVerificacionTotal(undefined);
    setGrupoVerificacionNombre(null);
    setExpedienteOpenedFromPending(false);
    setScreen('modules');
  }, [usuario?.id]);

  useEffect(() => {
    if (!requestedExpedienteId) return;

    if (puedeVerExpedientes) {
      setSelectedGrupoVerificacionId(null);
      setSelectedIntegranteVerificacionId(null);
      setGrupoVerificacionNombre(null);
      setNewlyCreatedExpedienteId(null);
      setSelectedExpedienteId(requestedExpedienteId);
      setExpedienteOpenedFromPending(true);
      setScreen('expedientes');
    }

    consumeRequestedExpediente();
  }, [consumeRequestedExpediente, puedeVerExpedientes, requestedExpedienteId]);

  const handleBackToList = () => {
    setSelectedExpedienteId(null);
    if (expedienteOpenedFromPending) {
      setExpedienteOpenedFromPending(false);
      setScreen('modules');
      return;
    }
    setScreen('expedientes');
    setExpedientesRefreshKey((currentKey) => currentKey + 1);
  };

  const handleBackToModuleMenu = () => {
    setSelectedExpedienteId(null);
    setSelectedGrupoVerificacionId(null);
    setSelectedIntegranteVerificacionId(null);
    setGrupoVerificacionNombre(null);
    setScreen('modules');
  };

  const handleSelectExpediente = (expedienteId: string) => {
    setExpedienteOpenedFromPending(false);
    setSelectedExpedienteId(expedienteId);
  };

  const handleBackToDocumentation = () => {
    setSelectedExpedienteId(null);
    setScreen('documentation');
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

  if (authLoading) {
    return null;
  }

  // Mostrar login si no hay usuario autenticado
  if (!usuario) {
    return <LoginScreen />;
  }

  if (usuario.requiere_cambio_pin) {
    return <ChangePinScreen />;
  }

  // Pantalla de verificación de integrante
  if (puedeVerVerificacion && selectedIntegranteVerificacionId && selectedGrupoVerificacionId) {
    return (
      <IntegranteVerificacionScreen
        integranteId={selectedIntegranteVerificacionId}
        nombreGrupo={grupoVerificacionNombre || ''}
        integrantePosition={integranteVerificacionPosition}
        integrantesTotal={integranteVerificacionTotal}
        onBack={handleBackToGrupoVerificacion}
      />
    );
  }

  // Pantalla de detalle de grupo en verificación
  if (puedeVerVerificacion && selectedGrupoVerificacionId) {
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
  if (puedeVerExpedientes && selectedExpedienteId) {
    return <ExpedienteDetailScreen expedienteId={selectedExpedienteId} onBack={handleBackToList} />;
  }

  if (puedeCrearGrupo && screen === 'create-group') {
    return (
      <CreateGroupScreen
        onBack={handleBackToDocumentation}
        onCreated={(result) => {
          setNewlyCreatedExpedienteId(
            result.es_grupo_nuevo_ciclo_1 ? result.expedienteId : null,
          );
          setScreen('expedientes');
          setExpedientesRefreshKey((currentKey) => currentKey + 1);
        }}
      />
    );
  }

  if (puedeVerExpedientes && screen === 'expedientes') {
    return (
      <ExpedientesListScreen
        onSelectExpediente={handleSelectExpediente}
        refreshKey={expedientesRefreshKey}
        newlyCreatedExpedienteId={newlyCreatedExpedienteId}
        onBack={handleBackToDocumentation}
      />
    );
  }

  if (puedeVerVerificacion && screen === 'verificacion') {
    return (
      <GruposVerificacionListScreen
        onSelectGrupo={setSelectedGrupoVerificacionId}
        refreshKey={verificacionRefreshKey}
        onBack={handleBackToModuleMenu}
      />
    );
  }

  if (puedeRenovar && screen === 'renovacion') {
    return (
      <RenovacionScreen
        onBack={handleBackToDocumentation}
        onCreated={(expedienteId) => {
          setExpedienteOpenedFromPending(false);
          setSelectedExpedienteId(expedienteId);
          setScreen('expedientes');
          setExpedientesRefreshKey((currentKey) => currentKey + 1);
        }}
      />
    );
  }

  if (puedeAbrirDocumentacion && screen === 'documentation') {
    return (
      <DocumentationHomeScreen
        canCreateGroup={puedeCrearGrupo}
        canRenew={puedeRenovar}
        canViewExpedientes={puedeVerExpedientes}
        onBack={handleBackToModuleMenu}
        onCreateGroup={() => setScreen('create-group')}
        onRenew={() => setScreen('renovacion')}
        onViewExpedientes={() => setScreen('expedientes')}
      />
    );
  }

  const modules = buildOperationalModuleOptions(
    {
      canOpenDocumentation: puedeAbrirDocumentacion,
      canViewVerification: puedeVerVerificacion,
    },
    {
      openDocumentation: () => setScreen('documentation'),
      openVerification: () => setScreen('verificacion'),
    },
    __DEV__,
  );

  return <ModuleMenuScreen modules={modules} onLogout={logout} />;
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
    <ProcessingProvider>
      <AuthProvider>
        <PendingReviewsProvider>
          <AppContent />
          <PendingReviewOverlay />
        </PendingReviewsProvider>
      </AuthProvider>
    </ProcessingProvider>
  );
}
