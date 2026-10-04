import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { api } from './api-client';

export interface DomicilioGeocodificable {
  calle?: string | null;
  numeroExterior?: string | null;
  colonia?: string | null;
  municipio?: string | null;
  estado?: string | null;
  codigoPostal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

interface Coordenadas {
  latitud: number;
  longitud: number;
}

interface IntegranteGeocodificable {
  id: string;
  es_tesorera?: boolean;
  esTesorera?: boolean;
  domicilio_geocodificacion?: DomicilioGeocodificable | null;
}

// Valor operativo vigente. Se mantiene centralizado para sustituirlo por el
// parámetro remoto cuando el módulo de Parámetros tenga contrato ejecutable.
export const DISTANCIA_MAXIMA_TESORERA_KM = 5;

const coordenadasSesion = new Map<string, Coordenadas>();
let permisoAndroidPromise: Promise<boolean> | null = null;

const tieneCoordenadasValidas = (
  domicilio?: DomicilioGeocodificable | null,
): domicilio is DomicilioGeocodificable & { latitud: number; longitud: number } => {
  if (domicilio?.latitud == null || domicilio.longitud == null) return false;
  const latitud = Number(domicilio?.latitud);
  const longitud = Number(domicilio?.longitud);
  return Number.isFinite(latitud)
    && Number.isFinite(longitud)
    && latitud >= -90
    && latitud <= 90
    && longitud >= -180
    && longitud <= 180;
};

const construirDirecciones = (domicilio: DomicilioGeocodificable): string[] => {
  const calle = domicilio.calle?.trim();
  const municipio = domicilio.municipio?.trim();
  if (!calle || !municipio) return [];

  const numero = domicilio.numeroExterior?.trim();
  const colonia = domicilio.colonia?.trim();
  const estado = domicilio.estado?.trim();
  const codigoPostal = domicilio.codigoPostal?.trim();
  const candidatas = [
    [[calle, numero].filter(Boolean).join(' '), colonia, municipio, estado, codigoPostal, 'México'],
    [calle, colonia, municipio, estado, codigoPostal, 'México'],
    [calle, municipio, estado, codigoPostal, 'México'],
  ].map((partes) => partes.filter(Boolean).join(', '));

  return [...new Set(candidatas)];
};

const puedeGeocodificar = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  if (Platform.OS !== 'android') return true;

  if (!permisoAndroidPromise) {
    permisoAndroidPromise = Location.requestForegroundPermissionsAsync()
      .then(({ status }) => status === 'granted')
      .catch(() => false);
  }
  return permisoAndroidPromise;
};

export const geocodificarDomicilio = async (
  domicilio: DomicilioGeocodificable,
): Promise<Coordenadas | null> => {
  const direcciones = construirDirecciones(domicilio);
  if (direcciones.length === 0 || !(await puedeGeocodificar())) return null;

  try {
    for (const direccion of direcciones) {
      const cacheKey = direccion.toLocaleUpperCase('es-MX');
      const cached = coordenadasSesion.get(cacheKey);
      if (cached) return cached;

      const resultados = await Location.geocodeAsync(direccion);
      const resultadoMexico = resultados.find(({ latitude, longitude }) => (
        latitude >= 14
        && latitude <= 33.5
        && longitude >= -119
        && longitude <= -86
      ));
      if (resultadoMexico) {
        const coordenadas = {
          latitud: resultadoMexico.latitude,
          longitud: resultadoMexico.longitude,
        };
        coordenadasSesion.set(cacheKey, coordenadas);
        return coordenadas;
      }
    }
    console.warn('[domicilio-distance] El geocodificador no encontró una coincidencia en México.');
    return null;
  } catch {
    console.warn('[domicilio-distance] El geocodificador del dispositivo devolvió un error.');
    return null;
  }
};

const calcularHaversineKm = (origen: Coordenadas, destino: Coordenadas): number => {
  const gradosARadianes = (grados: number): number => grados * Math.PI / 180;
  const radioTierraKm = 6_371;
  const deltaLatitud = gradosARadianes(destino.latitud - origen.latitud);
  const deltaLongitud = gradosARadianes(destino.longitud - origen.longitud);
  const latitudOrigen = gradosARadianes(origen.latitud);
  const latitudDestino = gradosARadianes(destino.latitud);
  const a = Math.sin(deltaLatitud / 2) ** 2
    + Math.cos(latitudOrigen)
    * Math.cos(latitudDestino)
    * Math.sin(deltaLongitud / 2) ** 2;
  const distancia = 2 * radioTierraKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(distancia * 10) / 10;
};

export const calcularDistanciasAproximadasRegistradas = <T extends IntegranteGeocodificable>(
  integrantes: T[],
): (T & { distancia_tesorera_aprox_km: number | null })[] => {
  const coordenadas = new Map<string, Coordenadas>();

  integrantes.forEach((integrante) => {
    if (tieneCoordenadasValidas(integrante.domicilio_geocodificacion)) {
      coordenadas.set(integrante.id, {
        latitud: Number(integrante.domicilio_geocodificacion.latitud),
        longitud: Number(integrante.domicilio_geocodificacion.longitud),
      });
    }
  });

  const tesorera = integrantes.find((integrante) => integrante.es_tesorera || integrante.esTesorera);
  const coordenadasTesorera = tesorera ? coordenadas.get(tesorera.id) : null;

  return integrantes.map((integrante) => {
    const ubicacion = coordenadas.get(integrante.id);
    return {
      ...integrante,
      distancia_tesorera_aprox_km: ubicacion && coordenadasTesorera
        ? calcularHaversineKm(ubicacion, coordenadasTesorera)
        : null,
    };
  });
};

export const completarDistanciasAproximadas = async <T extends IntegranteGeocodificable>(
  integrantes: T[],
): Promise<(T & { distancia_tesorera_aprox_km: number | null })[]> => {
  const coordenadas = new Map<string, Coordenadas>();

  for (const integrante of integrantes) {
    const domicilio = integrante.domicilio_geocodificacion;
    let ubicacion: Coordenadas | null = tieneCoordenadasValidas(domicilio)
      ? { latitud: Number(domicilio.latitud), longitud: Number(domicilio.longitud) }
      : null;

    if (!ubicacion && domicilio) {
      ubicacion = await geocodificarDomicilio(domicilio);
      if (ubicacion) {
        try {
          await api.patch(`/solicitudes/integrante/${integrante.id}`, {
            dom_latitud: ubicacion.latitud,
            dom_longitud: ubicacion.longitud,
            dom_geocodificacion_fuente: 'GEOCODIFICADOR_DISPOSITIVO',
            dom_geocodificacion_fecha: new Date().toISOString(),
          }, {
            showProcessing: false,
          });
        } catch {
          // La distancia puede mostrarse en esta sesión aunque la persistencia falle.
        }
      }
    }

    if (ubicacion) coordenadas.set(integrante.id, ubicacion);
  }

  return calcularDistanciasAproximadasRegistradas(
    integrantes.map((integrante) => {
      const ubicacion = coordenadas.get(integrante.id);
      if (!ubicacion) return integrante;
      return {
        ...integrante,
        domicilio_geocodificacion: {
          ...integrante.domicilio_geocodificacion,
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
        },
      };
    }),
  );
};
