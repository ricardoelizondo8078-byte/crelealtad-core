import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface OperationalAccess {
  canCreateGroup: boolean;
  canReadDocumentation: boolean;
  canViewExpedientes: boolean;
  canViewVerification: boolean;
  canRenew: boolean;
  canOpenDocumentation: boolean;
  canReadParameters: boolean;
  canUpdateParameters: boolean;
  canPublishParameters: boolean;
  canOpenParameters: boolean;
  canReviewModuleColors: boolean;
}

export function useOperationalAccess(): OperationalAccess {
  const { tienePermiso } = useAuth();

  return useMemo(() => {
    const canCreateGroup = tienePermiso('documentacion', 'crear');
    const canReadDocumentation = tienePermiso('documentacion', 'leer');
    const canViewExpedientes = tienePermiso('expedientes', 'leer');
    const canViewVerification = tienePermiso('verificacion', 'leer');
    const canReadParameters = tienePermiso('parametros', 'leer');
    const canUpdateParameters = tienePermiso('parametros', 'actualizar');
    const canPublishParameters = tienePermiso('parametros', 'registrar');
    const canReviewModuleColors = tienePermiso('administracion', 'leer');

    return {
      canCreateGroup,
      canReadDocumentation,
      canViewExpedientes,
      canViewVerification,
      canRenew: canCreateGroup && canReadDocumentation && canViewExpedientes,
      canOpenDocumentation: canCreateGroup || canReadDocumentation || canViewExpedientes,
      canReadParameters,
      canUpdateParameters,
      canPublishParameters,
      canOpenParameters: canReadParameters,
      canReviewModuleColors,
    };
  }, [tienePermiso]);
}
