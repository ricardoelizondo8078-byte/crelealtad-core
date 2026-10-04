import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface OperationalAccess {
  canCreateGroup: boolean;
  canReadDocumentation: boolean;
  canViewExpedientes: boolean;
  canViewVerification: boolean;
  canRenew: boolean;
  canOpenDocumentation: boolean;
}

export function useOperationalAccess(): OperationalAccess {
  const { tienePermiso } = useAuth();

  return useMemo(() => {
    const canCreateGroup = tienePermiso('documentacion', 'crear');
    const canReadDocumentation = tienePermiso('documentacion', 'leer');
    const canViewExpedientes = tienePermiso('expedientes', 'leer');
    const canViewVerification = tienePermiso('verificacion', 'leer');

    return {
      canCreateGroup,
      canReadDocumentation,
      canViewExpedientes,
      canViewVerification,
      canRenew: canCreateGroup && canReadDocumentation && canViewExpedientes,
      canOpenDocumentation: canCreateGroup || canReadDocumentation || canViewExpedientes,
    };
  }, [tienePermiso]);
}
