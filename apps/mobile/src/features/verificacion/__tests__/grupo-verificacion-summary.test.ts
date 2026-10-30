import { calcularResumenGrupoVerificacion } from '../grupo-verificacion-summary';

describe('calcularResumenGrupoVerificacion', () => {
  it('suma todas las solicitudes y conserva cero cuando no hay revisiones concluidas', () => {
    expect(calcularResumenGrupoVerificacion([
      { montoSolicitado: 18_000, montoVerificado: null, estadoVerificacion: 'PENDIENTE' },
      { montoSolicitado: 42_000, montoVerificado: null, estadoVerificacion: 'PENDIENTE' },
    ])).toEqual({
      integrantes: 2,
      montoSolicitado: 60_000,
      integrantesVerificadas: 0,
      montoVerificado: 0,
    });
  });

  it('cuenta revisiones aprobadas y rechazadas y suma sólo sus montos verificados', () => {
    expect(calcularResumenGrupoVerificacion([
      { montoSolicitado: 18_000, montoVerificado: 15_000, estadoVerificacion: 'APROBADO' },
      { montoSolicitado: 42_000, montoVerificado: 0, estadoVerificacion: 'RECHAZADO' },
      { montoSolicitado: 25_000, montoVerificado: null, estadoVerificacion: 'PENDIENTE' },
    ])).toEqual({
      integrantes: 3,
      montoSolicitado: 85_000,
      integrantesVerificadas: 2,
      montoVerificado: 15_000,
    });
  });

  it('no infiere el monto verificado cuando una revisión concluida carece del importe', () => {
    expect(calcularResumenGrupoVerificacion([
      { montoSolicitado: 18_000, montoVerificado: null, estadoVerificacion: 'APROBADO' },
    ]).montoVerificado).toBeNull();
  });
});
