import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api-client';
import { useAuth } from './AuthContext';

export interface PendingReviewGroup {
  expediente_id: string;
  grupo_id: string;
  grupo_nombre: string;
  integrantes_pendientes: number;
  solicitado_desde: string;
}

interface PendingReviewsResponse {
  total_pendientes: number;
  grupos: PendingReviewGroup[];
}

interface PendingReviewsContextData {
  groups: PendingReviewGroup[];
  totalPending: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  inboxVisible: boolean;
  requestedExpedienteId: string | null;
  refresh: () => Promise<void>;
  openInbox: () => void;
  closeInbox: () => void;
  openExpediente: (expedienteId: string) => void;
  consumeRequestedExpediente: () => void;
}

const PendingReviewsContext = createContext<PendingReviewsContextData | null>(null);

export function PendingReviewsProvider({ children }: { children: React.ReactNode }) {
  const { usuario, tienePermiso } = useAuth();
  const canReadExpedientes = Boolean(usuario) && tienePermiso('expedientes', 'leer');
  const [groups, setGroups] = useState<PendingReviewGroup[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inboxVisible, setInboxVisible] = useState(false);
  const [requestedExpedienteId, setRequestedExpedienteId] = useState<string | null>(null);
  const requestVersionRef = useRef(0);

  const loadPendingReviews = useCallback(async (initialLoad = false) => {
    if (!canReadExpedientes) {
      requestVersionRef.current += 1;
      setGroups([]);
      setTotalPending(0);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get<PendingReviewsResponse>('/pendientes/revision-documental');
      if (requestVersion !== requestVersionRef.current) return;
      setGroups(Array.isArray(response.grupos) ? response.grupos : []);
      setTotalPending(Number(response.total_pendientes) || 0);
      setError(null);
    } catch (loadError) {
      if (requestVersion !== requestVersionRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron actualizar los pendientes.',
      );
    } finally {
      if (requestVersion !== requestVersionRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [canReadExpedientes, usuario?.id]);

  const refresh = useCallback(
    () => loadPendingReviews(false),
    [loadPendingReviews],
  );

  useEffect(() => {
    if (!usuario || !canReadExpedientes) {
      requestVersionRef.current += 1;
      setGroups([]);
      setTotalPending(0);
      setError(null);
      setInboxVisible(false);
      setRequestedExpedienteId(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    requestVersionRef.current += 1;
    setGroups([]);
    setTotalPending(0);
    setError(null);
    void loadPendingReviews(true);
  }, [canReadExpedientes, loadPendingReviews, usuario?.id]);

  useEffect(() => {
    if (!canReadExpedientes) return undefined;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [canReadExpedientes, refresh]);

  const openInbox = useCallback(() => {
    setInboxVisible(true);
    void refresh();
  }, [refresh]);

  const closeInbox = useCallback(() => setInboxVisible(false), []);

  const openExpediente = useCallback((expedienteId: string) => {
    setRequestedExpedienteId(expedienteId);
    setInboxVisible(false);
  }, []);

  const consumeRequestedExpediente = useCallback(
    () => setRequestedExpedienteId(null),
    [],
  );

  const value = useMemo<PendingReviewsContextData>(() => ({
    groups,
    totalPending,
    loading,
    refreshing,
    error,
    inboxVisible,
    requestedExpedienteId,
    refresh,
    openInbox,
    closeInbox,
    openExpediente,
    consumeRequestedExpediente,
  }), [
    closeInbox,
    consumeRequestedExpediente,
    error,
    groups,
    inboxVisible,
    loading,
    openExpediente,
    openInbox,
    refresh,
    refreshing,
    requestedExpedienteId,
    totalPending,
  ]);

  return (
    <PendingReviewsContext.Provider value={value}>
      {children}
    </PendingReviewsContext.Provider>
  );
}

export function usePendingReviews() {
  const context = useContext(PendingReviewsContext);
  if (!context) {
    throw new Error('usePendingReviews must be used within PendingReviewsProvider');
  }
  return context;
}
