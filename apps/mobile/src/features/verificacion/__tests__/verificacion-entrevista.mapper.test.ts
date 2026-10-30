import { describe, expect, it, jest } from '@jest/globals';
import {
  crearEntrevistaPayload,
  type EntrevistaFormState,
} from '../verificacion-entrevista.mapper';

jest.mock('../verificacion-entrevista-parametros', () => ({
  codigoParametroEntrevista: (
    _familia: string,
    etiqueta: string,
    respaldo: Record<string, string>,
  ) => respaldo[etiqueta] ?? null,
  etiquetaParametroEntrevista: (
    _familia: string,
    codigo: string | null,
    respaldo: Record<string, string>,
  ) => Object.entries(respaldo).find(([, valor]) => valor === codigo)?.[0] ?? '',
}));

const crearEstado = (overrides: Partial<EntrevistaFormState> = {}): EntrevistaFormState => (
  new Proxy({
    companerasMontoNoAcordadoIds: [],
    motivosDesacuerdoMontosPorIntegrante: {},
    familiaresGrupoIds: [],
    quienViveConUsted: [],
    fuentesIngresoPersonal: [],
    ...overrides,
  }, {
    get(target, property: keyof EntrevistaFormState) {
      return property in target ? target[property] : '';
    },
  }) as EntrevistaFormState
);

describe('mapeo de entrevista', () => {
  it('normaliza y elimina convivientes repetidos aunque cambie la etiqueta visible', () => {
    const payload = crearEntrevistaPayload(crearEstado({
      quienViveConUsted: ['Conyuge', 'Cónyuge', 'Hijos'],
    }), 'NO_SABE_DOMICILIO_RECOLECCION');

    expect(payload.convivientes).toEqual(['CONYUGE', 'HIJOS']);
  });

  it('elimina códigos repetidos de las fuentes de ingreso antes de sincronizar', () => {
    const payload = crearEntrevistaPayload(crearEstado({
      fuentesIngresoPersonal: ['Sueldo', 'Sueldo', 'Negocio'],
    }), 'NO_SABE_DOMICILIO_RECOLECCION');

    expect(payload.fuentes_ingreso).toEqual(['SUELDO', 'NEGOCIO']);
  });
});
