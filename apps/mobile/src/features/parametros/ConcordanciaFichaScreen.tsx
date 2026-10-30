import React from 'react';
import {
  actualizarParametroConcordanciaFicha,
  obtenerParametroConcordanciaFicha,
} from './parametros-conclusiones.api';
import {
  esRangoConcordanciaValido,
  RANGO_CONCORDANCIA_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface ConcordanciaFichaScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const ConcordanciaFichaScreen: React.FC<ConcordanciaFichaScreenProps> = ({
  canUpdate,
  onBack,
}) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar concordancia en ficha"
    sectionTitle="Concordancia en ficha"
    instructions="Define el color según el porcentaje de diferencia entre la ficha declarada y la ficha calculada. Cero significa concordancia exacta."
    helperText="El cambio se aplica al valor de ficha mostrado en Conclusiones."
    entitySingular="porcentaje"
    minimo={0}
    maximo={100}
    unidad="%"
    initialRange={RANGO_CONCORDANCIA_INICIAL}
    validate={esRangoConcordanciaValido}
    load={obtenerParametroConcordanciaFicha}
    save={actualizarParametroConcordanciaFicha}
  />
);
