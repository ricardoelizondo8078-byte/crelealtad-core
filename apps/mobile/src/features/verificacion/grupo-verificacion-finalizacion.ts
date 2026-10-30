export interface EstadoFinalizacionGrupo {
  habilitado: boolean;
  faltantes: number | null;
}

export const evaluarFinalizacionGrupo = (
  integrantesVerificadas: number,
  integrantesRequeridas: number | null,
): EstadoFinalizacionGrupo => {
  if (
    !Number.isInteger(integrantesVerificadas)
    || integrantesVerificadas < 0
    || !Number.isInteger(integrantesRequeridas)
    || integrantesRequeridas == null
    || integrantesRequeridas < 0
    || integrantesRequeridas > 12
  ) {
    return { habilitado: false, faltantes: null };
  }

  const faltantes = Math.max(0, integrantesRequeridas - integrantesVerificadas);
  return { habilitado: faltantes === 0, faltantes };
};
