import React from 'react';
import {
  actualizarParametroCiclosCredito,
  obtenerParametroCiclosCredito,
} from './parametros-conclusiones.api';
import {
  esRangoCiclosCreditoValido,
  RANGO_CICLOS_CREDITO_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface CalificacionCiclosCreditoScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const CalificacionCiclosCreditoScreen: React.FC<
  CalificacionCiclosCreditoScreenProps
> = ({ canUpdate, onBack }) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar número de ciclos"
    sectionTitle="Ciclos en otra financiera"
    instructions="Define de qué número de ciclos a qué número se mostrará cada color en Conclusiones."
    helperText="El cambio se aplica directamente a los ciclos mostrados en Conclusiones."
    entitySingular="número de ciclos"
    maximo={40}
    initialRange={RANGO_CICLOS_CREDITO_INICIAL}
    validate={esRangoCiclosCreditoValido}
    load={obtenerParametroCiclosCredito}
    save={actualizarParametroCiclosCredito}
  />
);
