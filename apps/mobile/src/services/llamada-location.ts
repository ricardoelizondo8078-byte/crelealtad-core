import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface UbicacionLlamada {
  latitud: number;
  longitud: number;
  precision_metros: number | null;
  capturada_at: string;
}

export type UbicacionVisitaVecino = UbicacionLlamada;
export type UbicacionImagenDomicilio = UbicacionLlamada;
export type UbicacionEntrevista = UbicacionLlamada;

const esCoordenadaValida = (latitud: number, longitud: number): boolean => (
  Number.isFinite(latitud)
  && Number.isFinite(longitud)
  && latitud >= -90
  && latitud <= 90
  && longitud >= -180
  && longitud <= 180
);

const redondear = (valor: number, decimales: number): number => (
  Number(valor.toFixed(decimales))
);

const obtenerUbicacionActual = async (
  contexto: 'llamada' | 'visita al vecino' | 'imagen del domicilio' | 'evidencia de entrevista',
): Promise<UbicacionLlamada> => {
  if (Platform.OS === 'web') {
    throw new Error(`La ubicación de la ${contexto} sólo está disponible desde el teléfono.`);
  }

  const serviciosActivos = await Location.hasServicesEnabledAsync();
  if (!serviciosActivos) {
    throw new Error(`Activa la ubicación del teléfono y vuelve a indicar el resultado de la ${contexto}.`);
  }

  let permiso = await Location.getForegroundPermissionsAsync();
  if (permiso.status !== 'granted') {
    permiso = await Location.requestForegroundPermissionsAsync();
  }
  if (permiso.status !== 'granted') {
    throw new Error(`Permite el acceso a la ubicación para registrar el resultado de la ${contexto}.`);
  }

  let lectura: Location.LocationObject;
  try {
    lectura = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    throw new Error('No se pudo obtener la ubicación actual. Sal a un lugar con mejor señal e inténtalo nuevamente.');
  }

  const { latitude, longitude, accuracy } = lectura.coords;
  if (!esCoordenadaValida(latitude, longitude)) {
    throw new Error('El teléfono devolvió una ubicación inválida. Inténtalo nuevamente.');
  }

  return {
    latitud: redondear(latitude, 7),
    longitud: redondear(longitude, 7),
    precision_metros: accuracy == null || !Number.isFinite(accuracy)
      ? null
      : redondear(Math.max(0, accuracy), 2),
    capturada_at: new Date(lectura.timestamp).toISOString(),
  };
};

export const obtenerUbicacionLlamada = (): Promise<UbicacionLlamada> => (
  obtenerUbicacionActual('llamada')
);

export const obtenerUbicacionVisitaVecino = (): Promise<UbicacionVisitaVecino> => (
  obtenerUbicacionActual('visita al vecino')
);

export const obtenerUbicacionImagenDomicilio = (): Promise<UbicacionImagenDomicilio> => (
  obtenerUbicacionActual('imagen del domicilio')
);

export const obtenerUbicacionEntrevista = (): Promise<UbicacionEntrevista> => (
  obtenerUbicacionActual('evidencia de entrevista')
);
