-- =====================================================
-- NORMALIZACIÓN DE TABLA ASESORAS
-- De 45 columnas → 5 tablas bien diseñadas
-- =====================================================

-- =====================================================
-- 1. CREAR NUEVAS TABLAS NORMALIZADAS
-- =====================================================

-- 1.1 CONTACTO DEL ASESOR (9 columnas)
CREATE TABLE IF NOT EXISTS asesoras_contacto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asesor_id UUID NOT NULL UNIQUE,

  -- Teléfonos
  telefono_celular VARCHAR(20) NOT NULL,
  telefono_casa VARCHAR(20),
  telefono_emergencia VARCHAR(20),

  -- Contacto de emergencia
  emergencia_nombre VARCHAR(100),
  emergencia_parentesco VARCHAR(50),

  -- Control
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_contacto_asesor FOREIGN KEY (asesor_id) REFERENCES asesoras(id) ON DELETE CASCADE
);

CREATE INDEX idx_asesoras_contacto_asesor ON asesoras_contacto(asesor_id);

COMMENT ON TABLE asesoras_contacto IS 'Información de contacto del asesor';

-- 1.2 DOMICILIO DEL ASESOR (13 columnas)
CREATE TABLE IF NOT EXISTS asesoras_domicilios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asesor_id UUID NOT NULL UNIQUE,

  -- Dirección
  calle VARCHAR(200),
  numero_ext VARCHAR(20),
  numero_int VARCHAR(20),
  colonia VARCHAR(100),
  municipio VARCHAR(100),
  estado VARCHAR(100),
  codigo_postal VARCHAR(10),
  referencias TEXT,

  -- Geolocalización
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  geolocalizacion_fecha TIMESTAMP,

  -- Control
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_domicilio_asesor FOREIGN KEY (asesor_id) REFERENCES asesoras(id) ON DELETE CASCADE
);

CREATE INDEX idx_asesoras_domicilios_asesor ON asesoras_domicilios(asesor_id);
CREATE INDEX idx_asesoras_domicilios_latlon ON asesoras_domicilios(latitud, longitud);

COMMENT ON TABLE asesoras_domicilios IS 'Domicilio completo y geolocalización del asesor';

-- 1.3 DOCUMENTOS DEL ASESOR (8 columnas)
CREATE TABLE IF NOT EXISTS asesoras_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asesor_id UUID NOT NULL,

  -- Tipo de documento
  tipo_documento VARCHAR(50) NOT NULL,
  -- Valores: FOTO_PERFIL, INE_FRENTE, INE_REVERSO, COMPROBANTE_DOMICILIO, CURP, RFC, CONTRATO

  -- Archivo
  ruta_archivo VARCHAR(500) NOT NULL,
  fecha_captura TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Estado del documento
  estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
  -- Valores: PENDIENTE, VIGENTE, VENCIDO

  -- Control
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_documento_asesor FOREIGN KEY (asesor_id) REFERENCES asesoras(id) ON DELETE CASCADE
);

CREATE INDEX idx_asesoras_documentos_asesor ON asesoras_documentos(asesor_id);
CREATE INDEX idx_asesoras_documentos_tipo ON asesoras_documentos(tipo_documento);
CREATE INDEX idx_asesoras_documentos_estado ON asesoras_documentos(estado);

COMMENT ON TABLE asesoras_documentos IS 'Fotografías y documentos del asesor con historial';
COMMENT ON COLUMN asesoras_documentos.tipo_documento IS 'FOTO_PERFIL | INE_FRENTE | INE_REVERSO | COMPROBANTE_DOMICILIO | CURP | RFC | CONTRATO';

-- 1.4 DATOS LABORALES DEL ASESOR (11 columnas)
CREATE TABLE IF NOT EXISTS asesoras_datos_laborales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asesor_id UUID NOT NULL UNIQUE,

  -- Jerarquía y organización
  sucursal_id UUID,
  jefe_inmediato_id UUID,

  -- Contrato
  tipo_contrato VARCHAR(50),
  -- Valores: PLANTA, HONORARIOS, COMISION
  nivel VARCHAR(50),
  -- Valores: JUNIOR, SENIOR, COORDINADOR

  -- Metas
  meta_mensual_grupos INTEGER,
  meta_mensual_monto DECIMAL(12, 2),

  -- Observaciones
  observaciones TEXT,

  -- Control
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_laboral_asesor FOREIGN KEY (asesor_id) REFERENCES asesoras(id) ON DELETE CASCADE,
  CONSTRAINT fk_laboral_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL,
  CONSTRAINT fk_laboral_jefe FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_asesoras_laborales_asesor ON asesoras_datos_laborales(asesor_id);
CREATE INDEX idx_asesoras_laborales_sucursal ON asesoras_datos_laborales(sucursal_id);
CREATE INDEX idx_asesoras_laborales_jefe ON asesoras_datos_laborales(jefe_inmediato_id);

COMMENT ON TABLE asesoras_datos_laborales IS 'Información laboral, jerarquía y metas del asesor';

-- =====================================================
-- 2. MIGRAR DATOS EXISTENTES (si hay)
-- =====================================================

-- 2.1 Migrar contacto
INSERT INTO asesoras_contacto (asesor_id, telefono_celular, telefono_casa, telefono_emergencia, emergencia_nombre, emergencia_parentesco, created_at, updated_at)
SELECT
  id,
  COALESCE(telefono_celular, telefono, '0000000000'),
  telefono_casa,
  telefono_emergencia,
  contacto_emergencia_nombre,
  contacto_emergencia_parentesco,
  created_at,
  updated_at
FROM asesoras
WHERE id IS NOT NULL
ON CONFLICT (asesor_id) DO NOTHING;

-- 2.2 Migrar domicilios
INSERT INTO asesoras_domicilios (asesor_id, calle, numero_ext, numero_int, colonia, municipio, estado, codigo_postal, referencias, latitud, longitud, geolocalizacion_fecha, created_at, updated_at)
SELECT
  id,
  dom_calle,
  dom_numero_ext,
  dom_numero_int,
  dom_colonia,
  dom_municipio,
  dom_estado,
  dom_codigo_postal,
  dom_referencias,
  dom_latitud,
  dom_longitud,
  dom_geolocalizacion_fecha,
  created_at,
  updated_at
FROM asesoras
WHERE id IS NOT NULL
ON CONFLICT (asesor_id) DO NOTHING;

-- 2.3 Migrar documentos (solo si existen rutas)
INSERT INTO asesoras_documentos (asesor_id, tipo_documento, ruta_archivo, fecha_captura, estado, created_at, updated_at)
SELECT id, 'FOTO_PERFIL', foto_perfil_ruta, created_at, 'VIGENTE', created_at, updated_at
FROM asesoras WHERE foto_perfil_ruta IS NOT NULL
UNION ALL
SELECT id, 'INE_FRENTE', foto_ine_frente_ruta, created_at, 'VIGENTE', created_at, updated_at
FROM asesoras WHERE foto_ine_frente_ruta IS NOT NULL
UNION ALL
SELECT id, 'INE_REVERSO', foto_ine_reverso_ruta, created_at, 'VIGENTE', created_at, updated_at
FROM asesoras WHERE foto_ine_reverso_ruta IS NOT NULL
UNION ALL
SELECT id, 'COMPROBANTE_DOMICILIO', foto_comprobante_domicilio_ruta, created_at, 'VIGENTE', created_at, updated_at
FROM asesoras WHERE foto_comprobante_domicilio_ruta IS NOT NULL;

-- 2.4 Migrar datos laborales
INSERT INTO asesoras_datos_laborales (asesor_id, sucursal_id, jefe_inmediato_id, tipo_contrato, nivel, meta_mensual_grupos, meta_mensual_monto, observaciones, created_at, updated_at)
SELECT
  id,
  sucursal_id,
  jefe_inmediato_id,
  tipo_contrato,
  nivel,
  meta_mensual_grupos,
  meta_mensual_monto,
  observaciones,
  created_at,
  updated_at
FROM asesoras
WHERE id IS NOT NULL
ON CONFLICT (asesor_id) DO NOTHING;

-- =====================================================
-- 3. LIMPIAR TABLA ASESORAS (Eliminar columnas duplicadas)
-- =====================================================

-- 3.1 Eliminar campos de contacto (ahora en asesoras_contacto)
ALTER TABLE asesoras DROP COLUMN IF EXISTS telefono CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS telefono_celular CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS telefono_casa CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS telefono_emergencia CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS contacto_emergencia_nombre CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS contacto_emergencia_parentesco CASCADE;

-- 3.2 Eliminar campos de domicilio (ahora en asesoras_domicilios)
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_calle CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_numero_ext CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_numero_int CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_colonia CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_municipio CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_estado CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_codigo_postal CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_referencias CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_latitud CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_longitud CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS dom_geolocalizacion_fecha CASCADE;

-- 3.3 Eliminar campos de documentos (ahora en asesoras_documentos)
ALTER TABLE asesoras DROP COLUMN IF EXISTS foto_perfil_ruta CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS foto_ine_frente_ruta CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS foto_ine_reverso_ruta CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS foto_comprobante_domicilio_ruta CASCADE;

-- 3.4 Eliminar campos laborales (ahora en asesoras_datos_laborales)
ALTER TABLE asesoras DROP COLUMN IF EXISTS sucursal_id CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS jefe_inmediato_id CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS tipo_contrato CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS nivel CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS meta_mensual_grupos CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS meta_mensual_monto CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS observaciones CASCADE;

-- 3.5 Eliminar campos duplicados con usuarios
ALTER TABLE asesoras DROP COLUMN IF EXISTS email CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS estado CASCADE;
ALTER TABLE asesoras DROP COLUMN IF EXISTS activo CASCADE;

-- =====================================================
-- 4. RESULTADO FINAL: asesoras limpia (15 columnas)
-- =====================================================
-- asesoras ahora tiene:
--   id, folio, usuario_id, zona_id
--   nombre, apellido_paterno, apellido_materno
--   fecha_nacimiento, genero, curp, rfc
--   fecha_ingreso
--   created_at, updated_at
-- (15 columnas - ÓPTIMO ✅)

-- =====================================================
-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE asesoras IS 'Datos personales básicos e identificación oficial del asesor (15 columnas)';
COMMENT ON COLUMN asesoras.usuario_id IS 'FK → usuarios (login y permisos)';
COMMENT ON COLUMN asesoras.zona_id IS 'FK → zonas (zona geográfica asignada)';
COMMENT ON COLUMN asesoras.curp IS 'CURP de 18 caracteres (ÚNICO)';
COMMENT ON COLUMN asesoras.rfc IS 'RFC de 13 caracteres (ÚNICO)';
COMMENT ON COLUMN asesoras.fecha_ingreso IS 'Fecha de ingreso a la empresa';
