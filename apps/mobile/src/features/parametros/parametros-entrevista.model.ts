import type { FamiliaParametroEntrevista } from './parametros-entrevista.api';

export interface FamiliaEntrevistaPresentacion {
  familia: FamiliaParametroEntrevista;
  titulo: string;
  descripcion: string;
  extensible: boolean;
}

export const FAMILIAS_ENTREVISTA: readonly FamiliaEntrevistaPresentacion[] = [
  { familia: 'COMO_CONOCIO_ASESORA', titulo: 'Cómo conoció a la asesora', descripcion: 'Origen del contacto con la asesora', extensible: true },
  { familia: 'MOTIVO_DESACUERDO_MONTOS', titulo: 'Desacuerdo con montos', descripcion: 'Motivos por integrante', extensible: true },
  { familia: 'MOTIVO_NO_RENOVACION', titulo: 'No renovación', descripcion: 'Razones para no renovar en otra financiera', extensible: true },
  { familia: 'MOTIVO_NO_VIVE_DOMICILIO', titulo: 'No vive en el domicilio', descripcion: 'Razones declaradas sobre residencia', extensible: true },
  { familia: 'MOTIVO_SIN_CONTROL_PAGOS', titulo: 'Sin control de pagos', descripcion: 'Causas de falta del documento', extensible: true },
  { familia: 'MOTIVO_RECOMENDACION_SI', titulo: 'Razones para recomendarnos', descripcion: 'Motivos de recomendación positiva', extensible: true },
  { familia: 'MOTIVO_RECOMENDACION_NO', titulo: 'Razones para no recomendarnos', descripcion: 'Motivos de recomendación negativa', extensible: true },
];

export const FAMILIAS_VISITA_VECINO: readonly FamiliaEntrevistaPresentacion[] = [
  {
    familia: 'VISITA_VECINO_RESPUESTA_SI',
    titulo: 'Opciones cuando responde Sí',
    descripcion: 'Respuestas múltiples después de seleccionar Sí',
    extensible: true,
  },
  {
    familia: 'VISITA_VECINO_RESPUESTA_NO',
    titulo: 'Opciones cuando responde No',
    descripcion: 'Respuestas múltiples después de seleccionar No',
    extensible: true,
  },
];
