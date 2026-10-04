-- CRELEALTAD CORE
-- M01: login de asesores por abreviatura y PIN individual
-- Fecha: 2026-08-13
-- Aplicar primero en crelealtad_test y despues en crelealtad.

BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS abreviatura VARCHAR(100);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS requiere_cambio_pin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE usuarios
  ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_abreviatura_ci
  ON usuarios (UPPER(abreviatura))
  WHERE abreviatura IS NOT NULL;

COMMENT ON COLUMN usuarios.abreviatura IS
  'Identificador operativo de login. Para asesores proviene de la abreviatura oficial.';

COMMENT ON COLUMN usuarios.password_hash IS
  'Hash bcrypt del PIN o credencial. Nunca contiene el PIN en texto plano.';

COMMENT ON COLUMN usuarios.requiere_cambio_pin IS
  'Indica que la credencial actual es temporal y debe sustituirse cuando el flujo este disponible.';

COMMIT;
