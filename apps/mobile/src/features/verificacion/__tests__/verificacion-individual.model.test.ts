import { describe, expect, it } from '@jest/globals';
import {
  cycleNumber,
  esTipoDocumentoRevision,
  mapCreditHistory,
  obtenerPresentacionCicloIndividual,
  obtenerTelefonosLlamadaDisponibles,
} from '../verificacion-individual.model';
import type { IntegranteData } from '../verificacion-individual.types';

const integranteBase = (): IntegranteData => ({
  id: '00000000-0000-4000-8000-000000000001',
  nombre: 'PERSONA DE PRUEBA',
  telefono: '81 1234 5678',
  telefonoSecundario: null,
  montoSolicitado: null,
  montoAutorizadoAnterior: null,
  esTesorera: false,
  cicloNumeroActual: 1,
  esRenovacion: false,
  esNuevaConNosotros: true,
  tieneHistorialInterno: false,
  creditosParticipados: 0,
  historialCrediticioInterno: null,
  edad: 30,
  superaLimiteEdad: false,
  distanciaTesoreraAproxKm: null,
});

describe('modelo de Verificación individual', () => {
  it('acepta únicamente números de ciclo enteros y positivos', () => {
    expect(cycleNumber('3')).toBe(3);
    expect(cycleNumber(0)).toBeNull();
    expect(cycleNumber(2.5)).toBeNull();
  });

  it('presenta el mismo ciclo individual registrado sin sumar el expediente actual', () => {
    expect(obtenerPresentacionCicloIndividual(1, false)).toEqual({
      accessibilityLabel: '1 ciclo individual registrado, primer ciclo',
      label: '1 CICLO',
      tone: 'pending',
    });
    expect(obtenerPresentacionCicloIndividual(3, false)).toEqual({
      accessibilityLabel: '3 ciclos individuales registrados',
      label: '3 CICLOS',
      tone: 'success',
    });
    expect(obtenerPresentacionCicloIndividual(0, true)).toEqual({
      accessibilityLabel: 'Integrante nueva, sin ciclos individuales registrados',
      label: 'NUEVO',
      tone: 'progress',
    });
  });

  it('normaliza historial válido y descarta ciclos recientes inválidos', () => {
    expect(mapCreditHistory({
      total_ciclos: 3,
      monto_maximo: { monto_autorizado: 30000, ciclos: [3] },
      monto_minimo: { monto_autorizado: 10000, ciclos: [1, 0] },
      ultimos_ciclos: [
        { ciclo_numero: 3, monto_autorizado: 30000 },
        { ciclo_numero: 2, monto_autorizado: 0 },
      ],
    })).toEqual({
      totalCycles: 3,
      maximum: { authorizedAmount: 30000, cycleNumbers: [3] },
      minimum: { authorizedAmount: 10000, cycleNumbers: [1] },
      recentCycles: [{ cycleNumber: 3, authorizedAmount: 30000 }],
    });
  });

  it('rechaza historiales incompletos en lugar de inventar valores', () => {
    expect(mapCreditHistory({ total_ciclos: 2 })).toBeNull();
    expect(mapCreditHistory(null)).toBeNull();
  });

  it('elimina teléfonos inválidos o duplicados después de normalizarlos', () => {
    const duplicado = { ...integranteBase(), telefonoSecundario: '8112345678' };
    const distintos = { ...integranteBase(), telefonoSecundario: '8187654321' };

    expect(obtenerTelefonosLlamadaDisponibles(duplicado)).toHaveLength(1);
    expect(obtenerTelefonosLlamadaDisponibles(distintos).map(({ tipo }) => tipo)).toEqual([
      'PRINCIPAL',
      'SECUNDARIO',
    ]);
  });

  it('distingue los documentos que sí forman parte de la revisión obligatoria', () => {
    expect(esTipoDocumentoRevision('ine')).toBe(true);
    expect(esTipoDocumentoRevision('comprobante_credito')).toBe(false);
  });
});
