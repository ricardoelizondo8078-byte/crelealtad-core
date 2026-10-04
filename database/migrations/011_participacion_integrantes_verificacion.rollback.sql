BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM integrantes
    WHERE estado::TEXT = 'RETIRADA'
       OR motivo_retiro IS NOT NULL
       OR motivo_retiro_detalle IS NOT NULL
       OR retirada_at IS NOT NULL
       OR retirada_por IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen retiros de integrantes que deben conservarse como historial';
  END IF;
END
$$;

ALTER TABLE integrantes
  DROP CONSTRAINT IF EXISTS integrantes_retirada_por_fkey,
  DROP CONSTRAINT IF EXISTS integrantes_retiro_contexto_check,
  DROP CONSTRAINT IF EXISTS integrantes_motivo_retiro_check,
  DROP COLUMN IF EXISTS retirada_por,
  DROP COLUMN IF EXISTS retirada_at,
  DROP COLUMN IF EXISTS motivo_retiro_detalle,
  DROP COLUMN IF EXISTS motivo_retiro;

ALTER TABLE integrantes
  ALTER COLUMN estado DROP DEFAULT;

ALTER TYPE solicitantes_estado_enum
  RENAME TO solicitantes_estado_enum_con_retirada;

CREATE TYPE solicitantes_estado_enum AS ENUM (
  'DOCUMENTANDO',
  'SUJETA_CREDITO',
  'EN_VERIFICACION',
  'AUTORIZADA',
  'RECHAZADA'
);

ALTER TABLE integrantes
  ALTER COLUMN estado TYPE solicitantes_estado_enum
  USING estado::TEXT::solicitantes_estado_enum,
  ALTER COLUMN estado SET DEFAULT 'DOCUMENTANDO'::solicitantes_estado_enum;

DROP TYPE solicitantes_estado_enum_con_retirada;

COMMIT;

