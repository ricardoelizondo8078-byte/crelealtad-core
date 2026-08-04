-- =====================================================
-- NORMALIZAR TABLA SOLICITUDES
-- De 81 columnas → 6 tablas normalizadas
-- =====================================================

BEGIN;

-- =====================================================
-- 1. SOLICITUDES (CORE) - 14 columnas
-- =====================================================
CREATE TABLE solicitudes_new (
  -- PK
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(20),

  -- FKs de relación
  integrante_id UUID,
  persona_id UUID,
  expediente_id UUID,
  grupo_id UUID,
  credito_id UUID,

  -- Datos del ciclo/crédito
  ciclo_numero INTEGER,
  numero_credito INTEGER,

  -- Monto
  monto_solicitado NUMERIC(10,2),
  monto_autorizado NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- FKs
  CONSTRAINT fk_solicitudes_integrante FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_solicitudes_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT,

  -- Índices
  CONSTRAINT solicitudes_integrante_unique UNIQUE(integrante_id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_new_integrante ON solicitudes_new(integrante_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_new_persona ON solicitudes_new(persona_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_new_expediente ON solicitudes_new(expediente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_new_grupo ON solicitudes_new(grupo_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_new_folio ON solicitudes_new(folio);

COMMENT ON TABLE solicitudes_new IS 'Solicitudes de crédito (core) - 14 columnas';

-- =====================================================
-- 2. SOLICITUDES_DATOS_PERSONALES - 12 columnas
-- =====================================================
CREATE TABLE solicitudes_datos_personales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Datos CURP
  curp VARCHAR(18),
  fecha_nac VARCHAR(20),
  genero VARCHAR(20),
  nacionalidad VARCHAR(50),
  estado_nacimiento VARCHAR(50),

  -- Datos complementarios
  estado_civil VARCHAR(50),
  ocupacion VARCHAR(100),
  nivel_estudio VARCHAR(50),
  telefono VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_datos_personales_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_datos_personales_unique UNIQUE(solicitud_id)
);

CREATE INDEX IF NOT EXISTS idx_datos_personales_solicitud ON solicitudes_datos_personales(solicitud_id);

COMMENT ON TABLE solicitudes_datos_personales IS 'Datos personales complementarios de la solicitud - 12 columnas';

-- =====================================================
-- 3. SOLICITUDES_DOMICILIOS - 13 columnas
-- =====================================================
CREATE TABLE solicitudes_domicilios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Domicilio completo
  calle VARCHAR(150),
  num_ext VARCHAR(20),
  num_int VARCHAR(20),
  entre_calles VARCHAR(150),
  colonia VARCHAR(100),
  municipio VARCHAR(100),
  estado VARCHAR(50),
  codigo_postal VARCHAR(5),
  cp_id UUID,
  telefono VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_domicilio_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_domicilios_unique UNIQUE(solicitud_id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_domicilios_solicitud ON solicitudes_domicilios(solicitud_id);

COMMENT ON TABLE solicitudes_domicilios IS 'Domicilio del solicitante - 13 columnas';

-- =====================================================
-- 4. SOLICITUDES_NEGOCIOS - 16 columnas
-- =====================================================
CREATE TABLE solicitudes_negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Datos del negocio
  giro VARCHAR(100),
  domicilio VARCHAR(200),
  colonia VARCHAR(100),
  municipio VARCHAR(100),
  estado VARCHAR(50),
  codigo_postal VARCHAR(5),
  cp_id UUID,
  num_ext VARCHAR(20),
  num_int VARCHAR(20),
  desde_cuando VARCHAR(50),

  -- Ingresos
  ingreso_semanal NUMERIC(10,2),
  otros_ingresos NUMERIC(10,2),
  gastos NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_negocio_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_negocios_unique UNIQUE(solicitud_id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_negocios_solicitud ON solicitudes_negocios(solicitud_id);

COMMENT ON TABLE solicitudes_negocios IS 'Datos del negocio del solicitante - 16 columnas';

-- =====================================================
-- 5. SOLICITUDES_REFERENCIAS - 10 columnas
-- =====================================================
-- Tabla normalizada: 1 fila por referencia
CREATE TABLE solicitudes_referencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Tipo de referencia
  tipo VARCHAR(20) NOT NULL, -- 'REFERENCIA_1', 'REFERENCIA_2', 'PAREJA'

  -- Datos de la referencia
  nombre VARCHAR(150),
  parentesco VARCHAR(50),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  actividad VARCHAR(100),
  ingreso_semanal NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_referencias_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_referencias_solicitud ON solicitudes_referencias(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_referencias_tipo ON solicitudes_referencias(tipo);

COMMENT ON TABLE solicitudes_referencias IS 'Referencias personales y pareja del solicitante - 10 columnas';

-- =====================================================
-- 6. SOLICITUDES_BENEFICIARIOS - 8 columnas
-- =====================================================
CREATE TABLE solicitudes_beneficiarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Datos del beneficiario
  nombre VARCHAR(150),
  parentesco VARCHAR(50),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  doc_ine_ruta VARCHAR(500),
  doc_ine_fecha DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_beneficiario_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_beneficiarios_unique UNIQUE(solicitud_id)
);

CREATE INDEX IF NOT EXISTS idx_beneficiarios_solicitud ON solicitudes_beneficiarios(solicitud_id);

COMMENT ON TABLE solicitudes_beneficiarios IS 'Beneficiario designado en la solicitud - 8 columnas';

-- =====================================================
-- 7. SOLICITUDES_VALIDACIONES - 7 columnas
-- =====================================================
CREATE TABLE solicitudes_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Validaciones de campo
  tiene_medidor_luz BOOLEAN DEFAULT false,
  vive_max_5km_tesorera BOOLEAN DEFAULT false,
  tiene_menos_70_anios BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_validaciones_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_new(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_validaciones_unique UNIQUE(solicitud_id)
);

CREATE INDEX IF NOT EXISTS idx_validaciones_solicitud ON solicitudes_validaciones(solicitud_id);

COMMENT ON TABLE solicitudes_validaciones IS 'Validaciones de campo de la solicitud - 7 columnas';

-- =====================================================
-- 8. MIGRAR DATOS EXISTENTES
-- =====================================================

-- 8.1 Migrar solicitudes core
INSERT INTO solicitudes_new (
  id, folio, integrante_id, persona_id, expediente_id, grupo_id, credito_id,
  ciclo_numero, numero_credito, monto_solicitado, monto_autorizado,
  created_at, updated_at
)
SELECT
  id, folio, integrante_id, persona_id, expediente_id, grupo_id, credito_id,
  ciclo_numero, numero_credito, monto_solicitado, monto_autorizado,
  created_at, updated_at
FROM solicitudes;

-- 8.2 Migrar datos personales
INSERT INTO solicitudes_datos_personales (
  solicitud_id, curp, fecha_nac, genero, nacionalidad, estado_nacimiento,
  estado_civil, ocupacion, nivel_estudio, telefono,
  created_at, updated_at
)
SELECT
  id, curp, fecha_nac, genero, nacionalidad, estado_nacimiento,
  estado_civil, ocupacion, nivel_estudio, telefono,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL;

-- 8.3 Migrar domicilios
INSERT INTO solicitudes_domicilios (
  solicitud_id, calle, num_ext, num_int, entre_calles, colonia, municipio, estado,
  codigo_postal, cp_id, telefono,
  created_at, updated_at
)
SELECT
  id, dom_calle, dom_num_ext, dom_num_int, dom_entre_calles, dom_colonia, dom_municipio, dom_estado,
  dom_codigo_postal, dom_cp_id, dom_telefono,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL;

-- 8.4 Migrar negocios
INSERT INTO solicitudes_negocios (
  solicitud_id, giro, domicilio, colonia, municipio, estado, codigo_postal, cp_id,
  num_ext, num_int, desde_cuando, ingreso_semanal, otros_ingresos, gastos,
  created_at, updated_at
)
SELECT
  id, negocio_giro, negocio_domicilio, negocio_colonia, negocio_municipio, negocio_estado,
  negocio_codigo_postal, negocio_cp_id, negocio_num_ext, negocio_num_int, negocio_desde_cuando,
  negocio_ingreso_semanal, negocio_otros_ingresos,
  CASE WHEN negocio_gastos ~ '^[0-9]+\.?[0-9]*$' THEN negocio_gastos::NUMERIC ELSE NULL END,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL;

-- 8.5 Migrar referencias (REFERENCIA_1)
INSERT INTO solicitudes_referencias (
  solicitud_id, tipo, nombre, parentesco, telefono, direccion,
  created_at, updated_at
)
SELECT
  id, 'REFERENCIA_1', ref1_nombre, ref1_parentesco, ref1_telefono, ref1_direccion,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL AND ref1_nombre IS NOT NULL;

-- 8.6 Migrar referencias (REFERENCIA_2)
INSERT INTO solicitudes_referencias (
  solicitud_id, tipo, nombre, parentesco, telefono, direccion,
  created_at, updated_at
)
SELECT
  id, 'REFERENCIA_2', ref2_nombre, ref2_parentesco, ref2_telefono, ref2_direccion,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL AND ref2_nombre IS NOT NULL;

-- 8.7 Migrar pareja
INSERT INTO solicitudes_referencias (
  solicitud_id, tipo, nombre, actividad, ingreso_semanal,
  created_at, updated_at
)
SELECT
  id, 'PAREJA', pareja_nombre, pareja_actividad, pareja_ingreso_semanal,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL AND pareja_nombre IS NOT NULL;

-- 8.8 Migrar beneficiarios
INSERT INTO solicitudes_beneficiarios (
  solicitud_id, nombre, parentesco, telefono, direccion, doc_ine_ruta, doc_ine_fecha,
  created_at, updated_at
)
SELECT
  id, beneficiario_nombre, beneficiario_parentesco, beneficiario_telefono, beneficiario_direccion,
  doc_ine_beneficiario_ruta, doc_ine_beneficiario_fecha,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL;

-- 8.9 Migrar validaciones
INSERT INTO solicitudes_validaciones (
  solicitud_id, tiene_medidor_luz, vive_max_5km_tesorera, tiene_menos_70_anios,
  created_at, updated_at
)
SELECT
  id, tiene_medidor_luz, vive_max_5km_tesorera, tiene_menos_70_anios,
  created_at, updated_at
FROM solicitudes
WHERE id IS NOT NULL;

-- =====================================================
-- 9. ELIMINAR TABLA ANTIGUA Y RENOMBRAR
-- =====================================================

DROP TABLE solicitudes CASCADE;
ALTER TABLE solicitudes_new RENAME TO solicitudes;

-- =====================================================
-- 10. DOCUMENTOS (ya existe tabla) - Migrar doc_*_ruta
-- =====================================================

-- Crear tabla documentos si NO existe
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID,
  integrante_id UUID,
  tipo VARCHAR(50) NOT NULL,
  ruta_archivo VARCHAR(500),
  fecha_captura DATE,
  estado VARCHAR(20) DEFAULT 'CAPTURADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrar doc_ine_ruta (ya migrados previamente en otra sesión, pero por si acaso)
-- INSERT INTO documentos (solicitud_id, tipo, ruta_archivo, fecha_captura, created_at, updated_at)
-- SELECT id, 'INE', doc_ine_ruta, doc_ine_fecha, created_at, updated_at
-- FROM solicitudes_old WHERE doc_ine_ruta IS NOT NULL
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. CREAR VISTA CONSOLIDADA
-- =====================================================

CREATE OR REPLACE VIEW solicitudes_completo AS
SELECT
  s.id as solicitud_id,
  s.folio,
  s.integrante_id,
  s.persona_id,
  s.expediente_id,
  s.grupo_id,
  s.credito_id,
  s.ciclo_numero,
  s.numero_credito,
  s.monto_solicitado,
  s.monto_autorizado,

  -- Datos personales
  dp.curp,
  dp.fecha_nac,
  dp.genero,
  dp.nacionalidad,
  dp.estado_nacimiento,
  dp.estado_civil,
  dp.ocupacion,
  dp.nivel_estudio,
  dp.telefono,

  -- Domicilio
  dom.calle as dom_calle,
  dom.num_ext as dom_num_ext,
  dom.num_int as dom_num_int,
  dom.colonia as dom_colonia,
  dom.municipio as dom_municipio,
  dom.estado as dom_estado,
  dom.codigo_postal as dom_codigo_postal,

  -- Negocio
  neg.giro as negocio_giro,
  neg.domicilio as negocio_domicilio,
  neg.ingreso_semanal as negocio_ingreso_semanal,

  -- Beneficiario
  ben.nombre as beneficiario_nombre,
  ben.parentesco as beneficiario_parentesco,

  -- Validaciones
  val.tiene_medidor_luz,
  val.vive_max_5km_tesorera,
  val.tiene_menos_70_anios,

  -- Timestamps
  s.created_at,
  s.updated_at

FROM solicitudes s
LEFT JOIN solicitudes_datos_personales dp ON dp.solicitud_id = s.id
LEFT JOIN solicitudes_domicilios dom ON dom.solicitud_id = s.id
LEFT JOIN solicitudes_negocios neg ON neg.solicitud_id = s.id
LEFT JOIN solicitudes_beneficiarios ben ON ben.solicitud_id = s.id
LEFT JOIN solicitudes_validaciones val ON val.solicitud_id = s.id;

COMMENT ON VIEW solicitudes_completo IS 'Vista consolidada de solicitudes con todas sus tablas relacionadas';

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT
  'solicitudes' as tabla,
  COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_name = 'solicitudes'
UNION ALL
SELECT 'solicitudes_datos_personales', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_datos_personales'
UNION ALL
SELECT 'solicitudes_domicilios', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_domicilios'
UNION ALL
SELECT 'solicitudes_negocios', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_negocios'
UNION ALL
SELECT 'solicitudes_referencias', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_referencias'
UNION ALL
SELECT 'solicitudes_beneficiarios', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_beneficiarios'
UNION ALL
SELECT 'solicitudes_validaciones', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_validaciones';
