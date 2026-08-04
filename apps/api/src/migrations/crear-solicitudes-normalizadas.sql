-- =====================================================
-- CREAR TABLAS SOLICITUDES NORMALIZADAS
-- Mantiene NOMBRES EXACTOS de columnas originales
-- SIN MIGRACIÓN (no hay datos que migrar)
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 0: Limpiar tablas anteriores
-- =====================================================

DROP TABLE IF EXISTS solicitudes_documentos CASCADE;
DROP TABLE IF EXISTS solicitudes_validaciones CASCADE;
DROP TABLE IF EXISTS solicitudes_beneficiarios CASCADE;
DROP TABLE IF EXISTS solicitudes_referencias CASCADE;
DROP TABLE IF EXISTS solicitudes_negocios CASCADE;
DROP TABLE IF EXISTS solicitudes_domicilios CASCADE;
DROP TABLE IF EXISTS solicitudes_datos_personales CASCADE;
DROP VIEW IF EXISTS solicitudes_completo CASCADE;
DROP TABLE IF EXISTS solicitudes CASCADE;
DROP TABLE IF EXISTS solicitudes_old CASCADE;

-- =====================================================
-- 1. SOLICITUDES (CORE) - 14 columnas
-- =====================================================
CREATE TABLE solicitudes (
  -- PK
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(20),

  -- FKs de relación
  integrante_id UUID,
  integrante_id_old UUID,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX solicitudes_integrante_unique ON solicitudes(integrante_id) WHERE integrante_id IS NOT NULL;
CREATE INDEX idx_solicitudes_persona ON solicitudes(persona_id);
CREATE INDEX idx_solicitudes_expediente ON solicitudes(expediente_id);
CREATE INDEX idx_solicitudes_grupo ON solicitudes(grupo_id);
CREATE INDEX idx_solicitudes_folio ON solicitudes(folio);

COMMENT ON TABLE solicitudes IS 'Solicitudes de crédito (core) - 14 columnas';

-- =====================================================
-- 2. SOLICITUDES_DATOS_PERSONALES - 17 columnas
-- =====================================================
CREATE TABLE solicitudes_datos_personales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Nombres (snapshot de persona)
  primer_nombre VARCHAR(50),
  segundo_nombre VARCHAR(50),
  apellido_pat VARCHAR(50),
  apellido_mat VARCHAR(50),

  -- Datos CURP
  curp VARCHAR(18),
  fecha_nac DATE,
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

  CONSTRAINT fk_datos_personales_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_datos_personales_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_datos_personales_solicitud ON solicitudes_datos_personales(solicitud_id);

COMMENT ON TABLE solicitudes_datos_personales IS 'Datos personales del solicitante - 17 columnas';

-- =====================================================
-- 3. SOLICITUDES_DOMICILIOS - 14 columnas
-- =====================================================
CREATE TABLE solicitudes_domicilios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Domicilio completo (mantiene prefijo dom_)
  dom_calle VARCHAR(150),
  dom_num_ext VARCHAR(20),
  dom_num_int VARCHAR(20),
  dom_entre_calles VARCHAR(150),
  dom_colonia VARCHAR(100),
  dom_municipio VARCHAR(100),
  dom_estado VARCHAR(50),
  dom_codigo_postal VARCHAR(5),
  dom_cp_id UUID,
  dom_telefono VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_domicilio_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_domicilios_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_solicitudes_domicilios_solicitud ON solicitudes_domicilios(solicitud_id);

COMMENT ON TABLE solicitudes_domicilios IS 'Domicilio del solicitante - 14 columnas';

-- =====================================================
-- 4. SOLICITUDES_NEGOCIOS - 18 columnas
-- =====================================================
CREATE TABLE solicitudes_negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Datos del negocio (mantiene prefijo negocio_)
  negocio_giro VARCHAR(100),
  negocio_domicilio VARCHAR(200),
  negocio_colonia VARCHAR(100),
  negocio_municipio VARCHAR(100),
  negocio_estado VARCHAR(50),
  negocio_codigo_postal VARCHAR(5),
  negocio_cp_id UUID,
  negocio_num_ext VARCHAR(20),
  negocio_num_int VARCHAR(20),
  negocio_desde_cuando VARCHAR(50),

  -- Ingresos
  negocio_ingreso_semanal NUMERIC(10,2),
  negocio_otros_ingresos NUMERIC(10,2),
  negocio_gastos NUMERIC(10,2),
  negocio_total NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_negocio_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_negocios_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_solicitudes_negocios_solicitud ON solicitudes_negocios(solicitud_id);

COMMENT ON TABLE solicitudes_negocios IS 'Datos del negocio del solicitante - 18 columnas';

-- =====================================================
-- 5. SOLICITUDES_REFERENCIAS - 15 columnas
-- =====================================================
CREATE TABLE solicitudes_referencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Referencia 1
  ref1_nombre VARCHAR(150),
  ref1_parentesco VARCHAR(50),
  ref1_telefono VARCHAR(20),
  ref1_direccion VARCHAR(200),

  -- Referencia 2
  ref2_nombre VARCHAR(150),
  ref2_parentesco VARCHAR(50),
  ref2_telefono VARCHAR(20),
  ref2_direccion VARCHAR(200),

  -- Pareja
  pareja_nombre VARCHAR(150),
  pareja_actividad VARCHAR(100),
  pareja_ingreso_semanal NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_referencias_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_referencias_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_referencias_solicitud ON solicitudes_referencias(solicitud_id);

COMMENT ON TABLE solicitudes_referencias IS 'Referencias personales y pareja - 15 columnas';

-- =====================================================
-- 6. SOLICITUDES_BENEFICIARIOS - 8 columnas
-- =====================================================
CREATE TABLE solicitudes_beneficiarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Datos del beneficiario (mantiene prefijo beneficiario_)
  beneficiario_nombre VARCHAR(150),
  beneficiario_parentesco VARCHAR(50),
  beneficiario_telefono VARCHAR(20),
  beneficiario_direccion VARCHAR(200),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_beneficiario_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_beneficiarios_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_beneficiarios_solicitud ON solicitudes_beneficiarios(solicitud_id);

COMMENT ON TABLE solicitudes_beneficiarios IS 'Beneficiario designado - 8 columnas';

-- =====================================================
-- 7. SOLICITUDES_VALIDACIONES - 7 columnas
-- =====================================================
CREATE TABLE solicitudes_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Validaciones (VARCHAR para compatibilidad con entity)
  tiene_medidor_luz VARCHAR(20),
  vive_max_5km_tesorera VARCHAR(20),
  tiene_menos_70_anios VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_validaciones_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_validaciones_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_validaciones_solicitud ON solicitudes_validaciones(solicitud_id);

COMMENT ON TABLE solicitudes_validaciones IS 'Validaciones de campo - 7 columnas';

-- =====================================================
-- 8. SOLICITUDES_DOCUMENTOS - 12 columnas
-- =====================================================
CREATE TABLE solicitudes_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,

  -- Documentos (mantiene prefijo doc_)
  doc_ine_ruta VARCHAR(500),
  doc_ine_fecha DATE,
  doc_comprobante_ruta VARCHAR(500),
  doc_comprobante_fecha DATE,
  doc_ine_beneficiario_ruta VARCHAR(500),
  doc_ine_beneficiario_fecha DATE,
  doc_solicitud_firmada_ruta VARCHAR(500),
  doc_solicitud_firmada_fecha DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_documentos_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT solicitudes_documentos_unique UNIQUE(solicitud_id)
);

CREATE INDEX idx_documentos_solicitud ON solicitudes_documentos(solicitud_id);

COMMENT ON TABLE solicitudes_documentos IS 'Documentos capturados - 12 columnas';

-- =====================================================
-- 9. CREAR VISTA CONSOLIDADA
-- =====================================================

CREATE OR REPLACE VIEW solicitudes_completo AS
SELECT
  s.id as solicitud_id,
  s.folio,
  s.integrante_id,
  s.integrante_id_old,
  s.persona_id,
  s.expediente_id,
  s.grupo_id,
  s.credito_id,
  s.ciclo_numero,
  s.numero_credito,
  s.monto_solicitado,
  s.monto_autorizado,

  -- Datos personales
  dp.primer_nombre,
  dp.segundo_nombre,
  dp.apellido_pat,
  dp.apellido_mat,
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
  dom.dom_calle,
  dom.dom_num_ext,
  dom.dom_num_int,
  dom.dom_entre_calles,
  dom.dom_colonia,
  dom.dom_municipio,
  dom.dom_estado,
  dom.dom_codigo_postal,
  dom.dom_cp_id,
  dom.dom_telefono,

  -- Negocio
  neg.negocio_giro,
  neg.negocio_domicilio,
  neg.negocio_colonia,
  neg.negocio_municipio,
  neg.negocio_estado,
  neg.negocio_codigo_postal,
  neg.negocio_num_ext,
  neg.negocio_num_int,
  neg.negocio_desde_cuando,
  neg.negocio_ingreso_semanal,
  neg.negocio_otros_ingresos,
  neg.negocio_gastos,
  neg.negocio_total,

  -- Referencias
  ref.ref1_nombre,
  ref.ref1_parentesco,
  ref.ref1_telefono,
  ref.ref1_direccion,
  ref.ref2_nombre,
  ref.ref2_parentesco,
  ref.ref2_telefono,
  ref.ref2_direccion,
  ref.pareja_nombre,
  ref.pareja_actividad,
  ref.pareja_ingreso_semanal,

  -- Beneficiario
  ben.beneficiario_nombre,
  ben.beneficiario_parentesco,
  ben.beneficiario_telefono,
  ben.beneficiario_direccion,

  -- Validaciones
  val.tiene_medidor_luz,
  val.vive_max_5km_tesorera,
  val.tiene_menos_70_anios,

  -- Documentos
  doc.doc_ine_ruta,
  doc.doc_ine_fecha,
  doc.doc_comprobante_ruta,
  doc.doc_comprobante_fecha,
  doc.doc_ine_beneficiario_ruta,
  doc.doc_ine_beneficiario_fecha,
  doc.doc_solicitud_firmada_ruta,
  doc.doc_solicitud_firmada_fecha,

  -- Timestamps
  s.created_at,
  s.updated_at

FROM solicitudes s
LEFT JOIN solicitudes_datos_personales dp ON dp.solicitud_id = s.id
LEFT JOIN solicitudes_domicilios dom ON dom.solicitud_id = s.id
LEFT JOIN solicitudes_negocios neg ON neg.solicitud_id = s.id
LEFT JOIN solicitudes_referencias ref ON ref.solicitud_id = s.id
LEFT JOIN solicitudes_beneficiarios ben ON ben.solicitud_id = s.id
LEFT JOIN solicitudes_validaciones val ON val.solicitud_id = s.id
LEFT JOIN solicitudes_documentos doc ON doc.solicitud_id = s.id;

COMMENT ON VIEW solicitudes_completo IS 'Vista consolidada con TODOS los campos en nombres originales';

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
WHERE table_name = 'solicitudes_validaciones'
UNION ALL
SELECT 'solicitudes_documentos', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'solicitudes_documentos';
