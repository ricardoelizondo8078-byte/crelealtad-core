BEGIN;

ALTER TABLE public.motivos_clasificacion_evidencia
  ADD COLUMN orden INTEGER;

WITH orden_inicial AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY clasificacion
      ORDER BY activo DESC, concepto_normalizado, id
    )::INTEGER AS orden
  FROM public.motivos_clasificacion_evidencia
)
UPDATE public.motivos_clasificacion_evidencia AS motivo
SET orden = orden_inicial.orden
FROM orden_inicial
WHERE motivo.id = orden_inicial.id;

ALTER TABLE public.motivos_clasificacion_evidencia
  ALTER COLUMN orden SET NOT NULL,
  ADD CONSTRAINT chk_motivos_clasificacion_evidencia_orden
    CHECK (orden >= 1),
  ADD CONSTRAINT uq_motivos_clasificacion_evidencia_clasificacion_orden
    UNIQUE (clasificacion, orden)
    DEFERRABLE INITIALLY DEFERRED;

COMMENT ON COLUMN public.motivos_clasificacion_evidencia.orden IS
  'Posición configurable dentro del color; determina el orden mostrado en el pop-up operativo.';

COMMIT;
