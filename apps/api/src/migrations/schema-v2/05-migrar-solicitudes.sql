-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 2.4: MIGRAR TABLA SOLICITUDES
-- ============================================================

-- Agregar columnas de vínculo nuevas
ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS folio          VARCHAR(20)   UNIQUE,
  ADD COLUMN IF NOT EXISTS integrante_id  UUID          REFERENCES integrantes(id),
  ADD COLUMN IF NOT EXISTS persona_id     UUID          REFERENCES personas(id),
  ADD COLUMN IF NOT EXISTS expediente_id  UUID          REFERENCES expedientes(id),
  ADD COLUMN IF NOT EXISTS grupo_id       UUID          REFERENCES grupos(id),
  ADD COLUMN IF NOT EXISTS ciclo_numero   INTEGER,
  ADD COLUMN IF NOT EXISTS numero_credito INTEGER,
  ADD COLUMN IF NOT EXISTS credito_id     UUID,
  ADD COLUMN IF NOT EXISTS es_nuevo       BOOLEAN       NOT NULL DEFAULT TRUE;

-- Renombrar columna de vínculo vieja (mantener temporalmente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='solicitanteId') THEN
    ALTER TABLE solicitudes RENAME COLUMN "solicitanteId" TO integrante_id_old;
  END IF;
END $$;

-- Agregar columnas de snapshot faltantes
ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS primer_nombre             VARCHAR(50),
  ADD COLUMN IF NOT EXISTS segundo_nombre            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS apellido_pat              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS apellido_mat              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS estado_nacimiento_nuevo   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dom_calle                 VARCHAR(150),
  ADD COLUMN IF NOT EXISTS dom_num_ext               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dom_num_int               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dom_entre_calles          VARCHAR(150),
  ADD COLUMN IF NOT EXISTS dom_cp_id                 UUID          REFERENCES codigos_postales(id),
  ADD COLUMN IF NOT EXISTS dom_colonia               VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dom_municipio             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dom_estado                VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dom_telefono              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ref1_nombre               VARCHAR(150),
  ADD COLUMN IF NOT EXISTS ref1_parentesco           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ref1_telefono             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ref1_direccion            VARCHAR(200),
  ADD COLUMN IF NOT EXISTS ref2_nombre               VARCHAR(150),
  ADD COLUMN IF NOT EXISTS ref2_parentesco           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ref2_telefono             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ref2_direccion            VARCHAR(200),
  ADD COLUMN IF NOT EXISTS pareja_nombre             VARCHAR(150),
  ADD COLUMN IF NOT EXISTS pareja_actividad          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pareja_ingreso_semanal    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS negocio_domicilio         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS negocio_cp_id             UUID          REFERENCES codigos_postales(id),
  ADD COLUMN IF NOT EXISTS negocio_colonia           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS negocio_municipio         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS negocio_desde_cuando      DATE,
  ADD COLUMN IF NOT EXISTS negocio_giro_nuevo        VARCHAR(150),
  ADD COLUMN IF NOT EXISTS negocio_ingreso_semanal   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS negocio_otros_ingresos    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS negocio_gastos_nuevo      DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS negocio_total             DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS beneficiario_nombre       VARCHAR(150),
  ADD COLUMN IF NOT EXISTS beneficiario_parentesco   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS beneficiario_telefono     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS beneficiario_direccion    VARCHAR(200),
  ADD COLUMN IF NOT EXISTS monto_autorizado          DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS doc_ine_ruta              VARCHAR(500),
  ADD COLUMN IF NOT EXISTS doc_ine_fecha             DATE,
  ADD COLUMN IF NOT EXISTS doc_comprobante_ruta      VARCHAR(500),
  ADD COLUMN IF NOT EXISTS doc_comprobante_fecha     DATE,
  ADD COLUMN IF NOT EXISTS doc_ine_beneficiario_ruta  VARCHAR(500),
  ADD COLUMN IF NOT EXISTS doc_ine_beneficiario_fecha DATE,
  ADD COLUMN IF NOT EXISTS doc_solicitud_firmada_ruta  VARCHAR(500),
  ADD COLUMN IF NOT EXISTS doc_solicitud_firmada_fecha DATE;

-- Renombrar columnas existentes al nuevo estándar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='curp') THEN
    ALTER TABLE solicitudes RENAME COLUMN "curp" TO curp;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='fechaNacimiento') THEN
    ALTER TABLE solicitudes RENAME COLUMN "fechaNacimiento" TO fecha_nac;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='estadoCivil') THEN
    ALTER TABLE solicitudes RENAME COLUMN "estadoCivil" TO estado_civil;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='nacionalidad') THEN
    ALTER TABLE solicitudes RENAME COLUMN "nacionalidad" TO nacionalidad;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='genero') THEN
    ALTER TABLE solicitudes RENAME COLUMN "genero" TO genero;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='ocupacion') THEN
    ALTER TABLE solicitudes RENAME COLUMN "ocupacion" TO ocupacion;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='nivelEstudio') THEN
    ALTER TABLE solicitudes RENAME COLUMN "nivelEstudio" TO nivel_estudio;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='telefono') THEN
    ALTER TABLE solicitudes RENAME COLUMN "telefono" TO telefono_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia1NombreCompleto') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia1NombreCompleto" TO ref1_nombre_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia1Telefono') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia1Telefono" TO ref1_telefono_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia1Parentesco') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia1Parentesco" TO ref1_parentesco_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia1Direccion') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia1Direccion" TO ref1_direccion_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia2NombreCompleto') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia2NombreCompleto" TO ref2_nombre_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia2Telefono') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia2Telefono" TO ref2_telefono_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia2Parentesco') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia2Parentesco" TO ref2_parentesco_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='referencia2Direccion') THEN
    ALTER TABLE solicitudes RENAME COLUMN "referencia2Direccion" TO ref2_direccion_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='parejaNombreCompleto') THEN
    ALTER TABLE solicitudes RENAME COLUMN "parejaNombreCompleto" TO pareja_nombre_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='parejaActividadEconomica') THEN
    ALTER TABLE solicitudes RENAME COLUMN "parejaActividadEconomica" TO pareja_actividad_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='parejaIngresoSemanal') THEN
    ALTER TABLE solicitudes RENAME COLUMN "parejaIngresoSemanal" TO pareja_ingreso_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='beneficiarioNombreCompleto') THEN
    ALTER TABLE solicitudes RENAME COLUMN "beneficiarioNombreCompleto" TO beneficiario_nombre_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='beneficiarioTelefono') THEN
    ALTER TABLE solicitudes RENAME COLUMN "beneficiarioTelefono" TO beneficiario_telefono_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='beneficiarioParentesco') THEN
    ALTER TABLE solicitudes RENAME COLUMN "beneficiarioParentesco" TO beneficiario_parentesco_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='beneficiarioDireccion') THEN
    ALTER TABLE solicitudes RENAME COLUMN "beneficiarioDireccion" TO beneficiario_direccion_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='tieneMedidorLuzSinAdeudo') THEN
    ALTER TABLE solicitudes RENAME COLUMN "tieneMedidorLuzSinAdeudo" TO tiene_medidor_luz;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='viveMaximo5KmTesorera') THEN
    ALTER TABLE solicitudes RENAME COLUMN "viveMaximo5KmTesorera" TO vive_max_5km_tesorera;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='tieneMenos70Anios') THEN
    ALTER TABLE solicitudes RENAME COLUMN "tieneMenos70Anios" TO tiene_menos_70_anios;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioIngresoSemanal') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioIngresoSemanal" TO negocio_ingreso_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioOtrosIngresos') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioOtrosIngresos" TO negocio_otros_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioGastos') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioGastos" TO negocio_gastos_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioTotal') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioTotal" TO negocio_total_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioGiro') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioGiro" TO negocio_giro_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='negocioDesdeCuando') THEN
    ALTER TABLE solicitudes RENAME COLUMN "negocioDesdeCuando" TO negocio_desde_old;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='createdAt') THEN
    ALTER TABLE solicitudes RENAME COLUMN "createdAt" TO created_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='updatedAt') THEN
    ALTER TABLE solicitudes RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END $$;

-- Estandarizar estado y eliminar columnas obsoletas de UI
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitudes' AND column_name='estado') THEN
    ALTER TABLE solicitudes RENAME COLUMN "estado" TO estado;
  END IF;
END $$;

ALTER TABLE solicitudes DROP COLUMN IF EXISTS "seccionCompletada";

-- Constraint: numero_credito único por persona (solo aplica cuando no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitud_persona_credito
  ON solicitudes(persona_id, numero_credito)
  WHERE numero_credito IS NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_solicitudes_persona      ON solicitudes(persona_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_expediente   ON solicitudes(expediente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_num_credito  ON solicitudes(persona_id, numero_credito);
