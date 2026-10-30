import React from 'react';
import {
  actualizarParametroConcordanciaPrestamo,
  obtenerParametroConcordanciaPrestamo,
} from './parametros-conclusiones.api';
import {
  esRangoConcordanciaValido,
  RANGO_CONCORDANCIA_PRESTAMO_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface ConcordanciaPrestamoScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const ConcordanciaPrestamoScreen: React.FC<ConcordanciaPrestamoScreenProps> = ({
  canUpdate,
  onBack,
}) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar concordancia en préstamo"
    sectionTitle="Concordancia en préstamo"
    instructions="Define el color según el porcentaje de diferencia entre el préstamo declarado y el préstamo calculado. Cero significa concordancia exacta."
    helperText="El cambio se aplica al último préstamo mostrado en Conclusiones."
    entitySingular="porcentaje"
    minimo={0}
    maximo={100}
    unidad="%"
    initialRange={RANGO_CONCORDANCIA_PRESTAMO_INICIAL}
    validate={esRangoConcordanciaValido}
    load={obtenerParametroConcordanciaPrestamo}
    save={actualizarParametroConcordanciaPrestamo}
  />
);
