-- =====================================================
-- AMPLIACIÓN DE TABLA ASESORAS
-- Agrega datos personales completos del asesor
-- =====================================================

-- Datos personales básicos
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS genero VARCHAR(10); -- MASCULINO, FEMENINO
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS curp VARCHAR(18);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS rfc VARCHAR(13);

-- Contacto
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS telefono_celular VARCHAR(20);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS telefono_casa VARCHAR(20);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS telefono_emergencia VARCHAR(20);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(50);

-- Domicilio
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_calle VARCHAR(200);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_numero_ext VARCHAR(20);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_numero_int VARCHAR(20);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_colonia VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_municipio VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_estado VARCHAR(100);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_codigo_postal VARCHAR(10);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_referencias TEXT;

-- Geolocalización
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_latitud DECIMAL(10, 8);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_longitud DECIMAL(11, 8);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS dom_geolocalizacion_fecha TIMESTAMP;

-- Fotografía y documentos
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS foto_perfil_ruta VARCHAR(500);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS foto_ine_frente_ruta VARCHAR(500);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS foto_ine_reverso_ruta VARCHAR(500);
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS foto_comprobante_domicilio_ruta VARCHAR(500);

-- Datos laborales
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS sucursal_id UUID;
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS jefe_inmediato_id UUID; -- Referencia a otro asesor/coordinador
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(50); -- PLANTA, HONORARIOS, COMISION
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS nivel VARCHAR(50); -- JUNIOR, SENIOR, COORDINADOR
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS meta_mensual_grupos INTEGER;
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS meta_mensual_monto DECIMAL(12, 2);

-- Observaciones y notas
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE asesoras ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_asesoras_nombre ON asesoras(nombre);
CREATE INDEX IF NOT EXISTS idx_asesoras_curp ON asesoras(curp);
CREATE INDEX IF NOT EXISTS idx_asesoras_sucursal ON asesoras(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_asesoras_zona ON asesoras(zona_id);
CREATE INDEX IF NOT EXISTS idx_asesoras_activo ON asesoras(activo);

-- Foreign keys
ALTER TABLE asesoras ADD CONSTRAINT fk_asesoras_sucursal
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE asesoras ADD CONSTRAINT fk_asesoras_jefe
  FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN asesoras.dom_latitud IS 'Latitud del domicilio (formato: -25.12345678)';
COMMENT ON COLUMN asesoras.dom_longitud IS 'Longitud del domicilio (formato: -100.12345678)';
COMMENT ON COLUMN asesoras.foto_perfil_ruta IS 'Ruta de la fotografía de perfil del asesor';
COMMENT ON COLUMN asesoras.meta_mensual_grupos IS 'Número de grupos meta por mes';
COMMENT ON COLUMN asesoras.meta_mensual_monto IS 'Monto total meta por mes';
