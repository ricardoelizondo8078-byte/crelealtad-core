import {
  MOTIVOS_SIN_MEDIDOR_LUZ,
  type MotivoSinMedidorLuz,
} from './verificacion-imagenes-domicilio.api';
import type {
  ErroresEvidenciasHistorialCredito,
  EvidenciasHistorialCredito,
  EvidenciasHistorialCreditoPendientes,
  ImagenDomicilioPendienteEnPantalla,
  ImagenDomicilioVista,
  TipoImagenDomicilioEnPantalla,
} from './verificacion-individual.types';

export const IMAGENES_DOMICILIO: readonly {
  tipo: TipoImagenDomicilioEnPantalla;
  titulo: string;
  obligatoria: boolean;
}[] = [
  {
    tipo: 'FACHADA',
    titulo: 'Fachada',
    obligatoria: true,
  },
  {
    tipo: 'MEDIDOR_LUZ',
    titulo: 'Medidor de luz',
    obligatoria: true,
  },
  {
    tipo: 'FACHADA_CON_INTEGRANTE',
    titulo: 'Fachada con la integrante',
    obligatoria: false,
  },
];

export const OPCIONES_MOTIVO_SIN_MEDIDOR_LUZ = MOTIVOS_SIN_MEDIDOR_LUZ.map(
  (opcion) => opcion.etiqueta,
);

export const obtenerEtiquetaMotivoSinMedidorLuz = (
  motivo: MotivoSinMedidorLuz | null,
): string => MOTIVOS_SIN_MEDIDOR_LUZ.find(
  (opcion) => opcion.codigo === motivo,
)?.etiqueta ?? '';

export const crearEvidenciasHistorialCreditoVacias = (): EvidenciasHistorialCredito => ({
  HISTORIAL_CREDITO_ACTIVO: [],
  HISTORIAL_CREDITO_INACTIVO: [],
});

export const crearEvidenciasHistorialCreditoPendientesVacias = (
): EvidenciasHistorialCreditoPendientes => ({
  HISTORIAL_CREDITO_ACTIVO: [],
  HISTORIAL_CREDITO_INACTIVO: [],
});

export const crearErroresEvidenciasHistorialCreditoVacios = (
): ErroresEvidenciasHistorialCredito => ({
  HISTORIAL_CREDITO_ACTIVO: null,
  HISTORIAL_CREDITO_INACTIVO: null,
});

export const crearImagenesDomicilioVacias = (
): Record<TipoImagenDomicilioEnPantalla, ImagenDomicilioVista | null> => ({
  FACHADA: null,
  MEDIDOR_LUZ: null,
  FACHADA_CON_INTEGRANTE: null,
});

export const crearImagenesDomicilioPendientesVacias = (
): Record<TipoImagenDomicilioEnPantalla, ImagenDomicilioPendienteEnPantalla | null> => ({
  FACHADA: null,
  MEDIDOR_LUZ: null,
  FACHADA_CON_INTEGRANTE: null,
});

export const crearErroresImagenesDomicilioVacios = (
): Record<TipoImagenDomicilioEnPantalla, string | null> => ({
  FACHADA: null,
  MEDIDOR_LUZ: null,
  FACHADA_CON_INTEGRANTE: null,
});
