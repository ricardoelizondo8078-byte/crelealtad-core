-- Rollback estructural condicionado para 005_advisor_login_abbreviation.sql.
-- Solo puede ejecutarse despues de retirar usuarios sin email y consumidores de abreviatura.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM usuarios WHERE email IS NULL) THEN
    RAISE EXCEPTION 'Rollback bloqueado: existen usuarios sin email';
  END IF;
END $$;

DROP INDEX IF EXISTS ux_usuarios_abreviatura_ci;

ALTER TABLE usuarios
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE usuarios
  DROP COLUMN IF EXISTS requiere_cambio_pin,
  DROP COLUMN IF EXISTS abreviatura;

COMMIT;
