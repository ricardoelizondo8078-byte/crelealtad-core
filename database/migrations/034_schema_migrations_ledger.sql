BEGIN;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version varchar(255) PRIMARY KEY,
  checksum char(64) NOT NULL,
  source varchar(20) NOT NULL DEFAULT 'MIGRATION',
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL DEFAULT current_user,
  execution_ms integer NULL,
  CONSTRAINT ck_schema_migrations_checksum
    CHECK (checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT ck_schema_migrations_source
    CHECK (source IN ('MIGRATION', 'BASELINE')),
  CONSTRAINT ck_schema_migrations_execution_ms
    CHECK (execution_ms IS NULL OR execution_ms >= 0)
);

COMMENT ON TABLE public.schema_migrations IS
  'Ledger técnico de migraciones aplicadas; no contiene reglas ni datos operativos.';

COMMIT;
