import React from 'react';
import {
  actualizarParametroToleranciaSemanaDesembolso,
  obtenerParametroToleranciaSemanaDesembolso,
} from './parametros-conclusiones.api';
import {
  esRangoToleranciaSemanaDesembolsoValido,
  RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface ToleranciaSemanaDesembolsoScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const ToleranciaSemanaDesembolsoScreen: React.FC<
  ToleranciaSemanaDesembolsoScreenProps
> = ({ canUpdate, onBack }) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar semana de desembolso"
    sectionTitle="Tolerancia de semana de desembolso"
    instructions="Define el color según cuántas semanas quede la semana actual antes o después del rango estimado. Cero significa que está dentro del rango."
    helperText="El cambio se aplica a la comparación de semana actual contra el mes de desembolso en Conclusiones."
    entitySingular="valor de tolerancia"
    minimo={0}
    maximo={10}
    initialRange={RANGO_TOLERANCIA_SEMANA_DESEMBOLSO_INICIAL}
    validate={esRangoToleranciaSemanaDesembolsoValido}
    load={obtenerParametroToleranciaSemanaDesembolso}
    save={actualizarParametroToleranciaSemanaDesembolso}
  />
);
