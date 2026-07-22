-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 2.1: MIGRAR TABLA GRUPOS
-- ============================================================

-- Agregar columnas nuevas
ALTER TABLE grupos
  ADD COLUMN IF NOT EXISTS folio        VARCHAR(20)  UNIQUE,
  ADD COLUMN IF NOT EXISTS zona_id      UUID         REFERENCES zonas(id),
  ADD COLUMN IF NOT EXISTS sucursal_id  UUID         REFERENCES sucursales(id),
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE         NOT NULL DEFAULT CURRENT_DATE;

-- Renombrar columnas al nuevo estándar snake_case
ALTER TABLE grupos RENAME COLUMN "name"        TO nombre;
ALTER TABLE grupos RENAME COLUMN "createdBy"   TO created_by;
ALTER TABLE grupos RENAME COLUMN "createdAt"   TO created_at;
ALTER TABLE grupos RENAME COLUMN "updatedAt"   TO updated_at;
ALTER TABLE grupos RENAME COLUMN "deletedAt"   TO deleted_at;

-- Eliminar columna obsoleta (advisorName pasa a ciclos.asesora_id)
ALTER TABLE grupos DROP COLUMN IF EXISTS "advisorName";

-- Estandarizar valores de estado
UPDATE grupos SET status = 'FORMANDO'       WHERE status = 'FORMANDO';
UPDATE grupos SET status = 'ACTIVO'         WHERE status = 'ACTIVO';
UPDATE grupos SET status = 'EN_RENOVACION'  WHERE status = 'EN_RENOVACION';
ALTER TABLE grupos RENAME COLUMN "status" TO estado;
