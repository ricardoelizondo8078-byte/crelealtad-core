export interface RenovacionGrupo {
  grupo_id: string;
  nombre: string;
  ultimo_ciclo: number;
  vigente_en_corte: boolean;
  fecha_desembolso: string;
  fecha_vencimiento: string | null;
  numero_integrantes: number | null;
  prestamo_grupal: number | null;
  porcentaje_pagado: number | null;
  puede_renovar: boolean;
  motivo_bloqueo: string | null;
}

export interface RenovacionCreada {
  expediente_id: string;
  ya_existia: boolean;
  integrantes_precargadas?: number;
}
