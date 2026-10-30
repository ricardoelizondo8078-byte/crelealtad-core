export type EstadoVerificacionGrupo = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;

interface IntegranteResumenGrupo {
  montoSolicitado: number | null;
  montoVerificado: number | null;
  estadoVerificacion: EstadoVerificacionGrupo;
}

export interface ResumenGrupoVerificacion {
  integrantes: number;
  montoSolicitado: number;
  integrantesVerificadas: number;
  montoVerificado: number | null;
}

export const calcularResumenGrupoVerificacion = (
  integrantes: readonly IntegranteResumenGrupo[],
): ResumenGrupoVerificacion => {
  const integrantesVerificadas = integrantes.filter(
    (integrante) => integrante.estadoVerificacion === 'APROBADO'
      || integrante.estadoVerificacion === 'RECHAZADO',
  );
  const montosVerificadosCompletos = integrantesVerificadas.every(
    (integrante) => integrante.montoVerificado != null,
  );

  return {
    integrantes: integrantes.length,
    montoSolicitado: integrantes.reduce(
      (total, integrante) => total + Number(integrante.montoSolicitado || 0),
      0,
    ),
    integrantesVerificadas: integrantesVerificadas.length,
    montoVerificado: montosVerificadosCompletos
      ? integrantesVerificadas.reduce(
        (total, integrante) => total + Number(integrante.montoVerificado || 0),
        0,
      )
      : null,
  };
};
