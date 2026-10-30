export const TIPOS_INTEGRANTE_VERIFICACION = [
  'NUEVA',
  'NUEVA_CON_EVIDENCIA',
  'CICLO_2_MAS',
  'CICLO_2_MAS_CON_EVIDENCIA',
] as const;

export type TipoIntegranteVerificacion = (typeof TIPOS_INTEGRANTE_VERIFICACION)[number];

export const PASOS_VERIFICACION = [
  'DOCUMENTOS',
  'LLAMADA',
  'VISITA_VECINO',
  'IMAGENES_DOMICILIO',
  'ENTREVISTA',
  'CONCLUSIONES',
] as const;

export type PasoVerificacionConfigurable = (typeof PASOS_VERIFICACION)[number];

export const MODALIDADES_PASO_VERIFICACION = [
  'OBLIGATORIO',
  'OPCIONAL',
  'OBLIGATORIO_DESPUES_DIAS',
] as const;

export type ModalidadPasoVerificacion = (typeof MODALIDADES_PASO_VERIFICACION)[number];

export interface ReglaPasoVerificacion {
  tipo_integrante: TipoIntegranteVerificacion;
  paso: PasoVerificacionConfigurable;
  modalidad: ModalidadPasoVerificacion;
  dias_para_obligatorio: number | null;
}

export const esReglaObligatoriaSinHistorial = (regla: ReglaPasoVerificacion): boolean => (
  regla.modalidad !== 'OPCIONAL'
);

export interface MatrizPasosVerificacion {
  version_id: string;
  revision: number;
  publicada_at: string;
  reglas: ReglaPasoVerificacion[];
}

export const determinarTipoIntegranteVerificacion = (
  tieneHistorialInterno: boolean,
  tieneEvidenciaOtraFinanciera: boolean,
): TipoIntegranteVerificacion => {
  if (tieneHistorialInterno) {
    return tieneEvidenciaOtraFinanciera
      ? 'CICLO_2_MAS_CON_EVIDENCIA'
      : 'CICLO_2_MAS';
  }

  return tieneEvidenciaOtraFinanciera
    ? 'NUEVA_CON_EVIDENCIA'
    : 'NUEVA';
};

export const esEvidenciaOtraFinancieraConfirmada = (ruta: unknown): boolean => {
  const rutaNormalizada = typeof ruta === 'string' ? ruta.trim() : '';
  return Boolean(
    rutaNormalizada
    && !/^(storage:|file:\/\/|content:\/\/)/i.test(rutaNormalizada),
  );
};
