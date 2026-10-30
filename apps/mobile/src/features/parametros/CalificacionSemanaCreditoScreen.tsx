import React from 'react';
import {
  actualizarParametroSemanaCredito,
  obtenerParametroSemanaCredito,
} from './parametros-conclusiones.api';
import {
  esRangoSemanaCreditoValido,
  RANGO_SEMANA_CREDITO_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface CalificacionSemanaCreditoScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const CalificacionSemanaCreditoScreen: React.FC<
  CalificacionSemanaCreditoScreenProps
> = ({ canUpdate, onBack }) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar semana del crédito"
    sectionTitle="Semana del crédito en otra financiera"
    instructions="Define de qué semana a qué semana se mostrará cada color en Conclusiones."
    helperText="El cambio se aplica directamente a la semana mostrada en Conclusiones."
    entitySingular="semana"
    maximo={16}
    initialRange={RANGO_SEMANA_CREDITO_INICIAL}
    validate={esRangoSemanaCreditoValido}
    load={obtenerParametroSemanaCredito}
    save={actualizarParametroSemanaCredito}
  />
);
