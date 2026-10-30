import React from 'react';
import {
  actualizarParametroPromedioEvidencias,
  obtenerParametroPromedioEvidencias,
} from './parametros-conclusiones.api';
import {
  esRangoPromedioEvidenciasValido,
  RANGO_PROMEDIO_EVIDENCIAS_INICIAL,
} from './parametros-conclusiones.model';
import { CalificacionRangosCreditoScreen } from './CalificacionRangosCreditoScreen';

interface CalificacionPromedioEvidenciasScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

export const CalificacionPromedioEvidenciasScreen: React.FC<
  CalificacionPromedioEvidenciasScreenProps
> = ({ canUpdate, onBack }) => (
  <CalificacionRangosCreditoScreen
    canUpdate={canUpdate}
    onBack={onBack}
    screenTitle="Calificar promedio de fotografías"
    sectionTitle="Promedio de fotografías"
    instructions="Define el color del círculo según el promedio de las fotografías calificadas. La escala va de 0 a 100."
    helperText="El cambio se aplica al círculo de promedio en Conclusiones."
    entitySingular="promedio"
    minimo={0}
    maximo={100}
    initialRange={RANGO_PROMEDIO_EVIDENCIAS_INICIAL}
    validate={esRangoPromedioEvidenciasValido}
    load={obtenerParametroPromedioEvidencias}
    save={actualizarParametroPromedioEvidencias}
  />
);
