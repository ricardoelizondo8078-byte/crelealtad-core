BEGIN;

CREATE TABLE importaciones_excel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_fuente VARCHAR(50) NOT NULL,
  archivo_nombre VARCHAR(255) NOT NULL,
  archivo_sha256 CHAR(64) NOT NULL,
  semana_corte INTEGER NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'VALIDADO',
  es_base_activa BOOLEAN NOT NULL DEFAULT FALSE,
  manifest JSONB NOT NULL,
  creado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT ck_importaciones_excel_tipo CHECK (tipo_fuente IN ('HISTORIAL_GRUPOS')),
  CONSTRAINT ck_importaciones_excel_estado CHECK (estado IN ('VALIDADO', 'CARGADO', 'ACTIVO', 'RECHAZADO')),
  CONSTRAINT ck_importaciones_excel_semana CHECK (semana_corte > 0),
  CONSTRAINT uq_importaciones_excel_fuente_hash UNIQUE (tipo_fuente, archivo_sha256),
  CONSTRAINT fk_importaciones_excel_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_importaciones_excel_base_activa
  ON importaciones_excel (tipo_fuente)
  WHERE es_base_activa = TRUE;

CREATE TABLE historial_grupos_ciclos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  importacion_id UUID NOT NULL,
  grupo_id UUID NOT NULL,
  asesora_id UUID,
  clave_origen VARCHAR(80) NOT NULL,
  numero_grupo_legacy INTEGER NOT NULL,
  numero_ciclo INTEGER NOT NULL,
  nombre_grupo_origen VARCHAR(255) NOT NULL,
  asesora_origen VARCHAR(100) NOT NULL,
  fecha_desembolso DATE NOT NULL,
  fecha_vencimiento DATE,
  dia_pago VARCHAR(20),
  hora_pago TIME,
  numero_integrantes INTEGER,
  plazo_semanas INTEGER,
  prestamo NUMERIC(14,2),
  total_cuenta NUMERIC(14,2),
  vigente_en_corte BOOLEAN NOT NULL,
  primera_semana INTEGER NOT NULL,
  ultima_semana INTEGER NOT NULL,
  total_semanas_registradas INTEGER NOT NULL,
  ultima_fila_excel INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_historial_grupos_ciclos_importacion_clave UNIQUE (importacion_id, clave_origen),
  CONSTRAINT ck_historial_grupos_ciclos_numero CHECK (numero_grupo_legacy > 0 AND numero_ciclo > 0),
  CONSTRAINT ck_historial_grupos_ciclos_semanas CHECK (primera_semana > 0 AND ultima_semana >= primera_semana AND total_semanas_registradas > 0),
  CONSTRAINT fk_historial_grupos_ciclos_importacion FOREIGN KEY (importacion_id) REFERENCES importaciones_excel(id) ON DELETE RESTRICT,
  CONSTRAINT fk_historial_grupos_ciclos_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_historial_grupos_ciclos_asesora FOREIGN KEY (asesora_id) REFERENCES empleados(id) ON DELETE RESTRICT
);

CREATE INDEX ix_historial_grupos_ciclos_grupo ON historial_grupos_ciclos (grupo_id, numero_ciclo);
CREATE INDEX ix_historial_grupos_ciclos_asesora_vigente ON historial_grupos_ciclos (asesora_id, vigente_en_corte);
CREATE INDEX ix_historial_grupos_ciclos_importacion ON historial_grupos_ciclos (importacion_id);

CREATE TABLE historial_grupos_ciclos_semanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_historico_id UUID NOT NULL,
  fila_excel INTEGER NOT NULL,
  clave_fila_origen VARCHAR(100),
  semana INTEGER NOT NULL,
  numero_documento INTEGER,
  fecha_cobro DATE,
  pago_minimo NUMERIC(14,2),
  total_pagado_semana NUMERIC(14,2),
  ficha_pagada_semana NUMERIC(14,2),
  ahorro_pagado_semana NUMERIC(14,2),
  seguro_pagado_semana NUMERIC(14,2),
  semanas_sin_pago INTEGER,
  total_credito NUMERIC(14,2),
  credito_pagado_acumulado NUMERIC(14,2),
  porcentaje_pagado NUMERIC(12,8),
  saldo_por_liquidar NUMERIC(14,2),
  porcentaje_por_liquidar NUMERIC(12,8),
  capital_cobrado_semana NUMERIC(14,2),
  capital_cobrado_acumulado NUMERIC(14,2),
  capital_pendiente NUMERIC(14,2),
  utilidad_cobrada_semana NUMERIC(14,2),
  utilidad_cobrada_acumulada NUMERIC(14,2),
  seguro_cobrado_acumulado NUMERIC(14,2),
  hash_semantico CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_historial_grupos_ciclos_semanas_fila UNIQUE (ciclo_historico_id, fila_excel),
  CONSTRAINT ck_historial_grupos_ciclos_semanas_semana CHECK (semana > 0),
  CONSTRAINT fk_historial_grupos_ciclos_semanas_ciclo FOREIGN KEY (ciclo_historico_id) REFERENCES historial_grupos_ciclos(id) ON DELETE RESTRICT
);

CREATE INDEX ix_historial_grupos_ciclos_semanas_ciclo_semana
  ON historial_grupos_ciclos_semanas (ciclo_historico_id, semana);

COMMENT ON TABLE importaciones_excel IS 'Cortes inmutables y auditables importados desde archivos Excel operativos.';
COMMENT ON TABLE historial_grupos_ciclos IS 'Resumen de cada ciclo grupal tal como existía en un corte Excel; no sustituye ciclos transaccionales nacidos por desembolso.';
COMMENT ON COLUMN historial_grupos_ciclos.vigente_en_corte IS 'Refleja exclusivamente GRUPO VIGENTE=1 en el archivo; FALSE no implica LIQUIDADO.';
COMMENT ON TABLE historial_grupos_ciclos_semanas IS 'Comportamiento semanal agregado del grupo; no representa créditos individuales.';

COMMIT;
