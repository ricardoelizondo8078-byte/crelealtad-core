-- =====================================================
-- REORDENAR COLUMNAS EN TABLA USUARIOS
-- Poner nombre, apellido_paterno, apellido_materno en posiciones 3, 4, 5
-- =====================================================

BEGIN;

-- PASO 1: Crear tabla temporal con el orden correcto
CREATE TABLE usuarios_new (
  -- 1, 2: ID y folio
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(20),

  -- 3, 4, 5: NOMBRE SEPARADO ✅
  nombre VARCHAR(100),
  apellido_paterno VARCHAR(100),
  apellido_materno VARCHAR(100),

  -- 6-11: Resto de columnas
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol_id UUID NOT NULL,
  sucursal_id UUID NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  ultimo_login TIMESTAMPTZ,

  -- 12, 13: Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_usuarios_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT
);

-- PASO 2: Copiar datos de la tabla antigua a la nueva
INSERT INTO usuarios_new (
  id, folio,
  nombre, apellido_paterno, apellido_materno,
  email, password_hash, rol_id, sucursal_id, estado, ultimo_login,
  created_at, updated_at
)
SELECT
  id, folio,
  nombre, apellido_paterno, apellido_materno,
  email, password_hash, rol_id, sucursal_id, estado, ultimo_login,
  created_at, updated_at
FROM usuarios;

-- PASO 3: Eliminar tabla antigua
DROP TABLE usuarios CASCADE;

-- PASO 4: Renombrar tabla nueva
ALTER TABLE usuarios_new RENAME TO usuarios;

-- PASO 5: Recrear índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_sucursal ON usuarios(sucursal_id);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- PASO 6: Recrear foreign keys de otras tablas hacia usuarios
-- empleados → usuarios
ALTER TABLE empleados
  ADD CONSTRAINT fk_empleados_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- empleados_datos_laborales → usuarios (jefe_inmediato_id)
ALTER TABLE empleados_datos_laborales
  ADD CONSTRAINT fk_laboral_jefe
  FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- PASO 7: Comentarios
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con nombre separado en posiciones 3, 4, 5';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre(s) - Posición 3';
COMMENT ON COLUMN usuarios.apellido_paterno IS 'Apellido paterno - Posición 4';
COMMENT ON COLUMN usuarios.apellido_materno IS 'Apellido materno - Posición 5';

COMMIT;

-- Verificar nuevo orden
SELECT
  ordinal_position,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
