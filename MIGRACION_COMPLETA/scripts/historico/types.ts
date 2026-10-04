export type ValorCelda = string | number | boolean | Date | null | undefined;

export interface Incidencia {
  nivel: 'ERROR' | 'ADVERTENCIA';
  codigo: string;
  mensaje: string;
  fila_excel?: number;
  clave_origen?: string;
}

export interface SemanaHistorica {
  fila_excel: number;
  clave_fila_origen: string | null;
  clave_origen: string;
  semana: number;
  numero_grupo_legacy: number;
  numero_ciclo: number;
  nombre_grupo: string;
  asesora_origen: string;
  asesora_normalizada: string | null;
  numero_integrantes: number | null;
  fecha_desembolso: string | null;
  semana_desembolso: number | null;
  tasa: number | null;
  retencion_inicial: number | null;
  apertura: number | null;
  seguro_por_persona: number | null;
  plazo_semanas: number | null;
  numero_documento: number | null;
  prestamo: number | null;
  total_cuenta: number | null;
  semana_vencimiento: number | null;
  fecha_vencimiento: string | null;
  dia_pago: string | null;
  hora_pago: string | null;
  pago_minimo: number | null;
  fecha_cobro: string | null;
  total_pagado_semana: number | null;
  ficha_pagada_semana: number | null;
  ahorro_pagado_semana: number | null;
  seguro_pagado_semana: number | null;
  semanas_sin_pago: number | null;
  vigente_en_corte: boolean;
  total_credito: number | null;
  credito_pagado_acumulado: number | null;
  porcentaje_pagado: number | null;
  saldo_por_liquidar: number | null;
  porcentaje_por_liquidar: number | null;
  capital_cobrado_semana: number | null;
  capital_cobrado_acumulado: number | null;
  capital_pendiente: number | null;
  utilidad_cobrada_semana: number | null;
  utilidad_cobrada_acumulada: number | null;
  seguro_cobrado_acumulado: number | null;
  hash_semantico: string;
}

export interface CicloHistorico {
  clave_origen: string;
  numero_grupo_legacy: number;
  numero_ciclo: number;
  nombre_grupo: string;
  asesora_origen: string;
  asesora_normalizada: string | null;
  fecha_desembolso: string | null;
  fecha_vencimiento: string | null;
  dia_pago: string | null;
  hora_pago: string | null;
  numero_integrantes: number | null;
  plazo_semanas: number | null;
  prestamo: number | null;
  total_cuenta: number | null;
  vigente_en_corte: boolean;
  primera_semana: number;
  ultima_semana: number;
  total_semanas_registradas: number;
  ultima_fila_excel: number;
}

export interface ResultadoExtraccion {
  archivo: string;
  archivo_sha256: string;
  hoja: string;
  fila_encabezado: number;
  semanas: SemanaHistorica[];
  ciclos: CicloHistorico[];
  resumen_vigentes: Map<string, SemanaHistorica>;
  incidencias: Incidencia[];
}
