-- Migración: poblar primer_nombre y segundo_nombre desde la columna nombres (legacy)
-- CRELEALTAD CORE - 2026-08-06
-- NO ejecutar hasta confirmar conteo y aprobación

-- 1. Contar estado actual
SELECT
  COUNT(*) FILTER (WHERE primer_nombre IS NOT NULL) AS con_primer_nombre,
  COUNT(*) FILTER (WHERE nombres IS NOT NULL) AS con_nombres_legacy,
  COUNT(*) FILTER (WHERE nombre_completo IS NOT NULL) AS con_nombre_completo,
  COUNT(*) AS total
FROM personas;

-- 2. Migración: split de nombres en primer_nombre y segundo_nombre
-- Solo para registros que tengan nombres pero NO tengan primer_nombre
UPDATE personas
SET
  primer_nombre = UPPER(TRIM(SPLIT_PART(nombres, ' ', 1))),
  segundo_nombre = UPPER(TRIM(SUBSTRING(nombres FROM POSITION(' ' IN nombres || ' ') + 1)))
WHERE
  nombres IS NOT NULL
  AND nombres != ''
  AND primer_nombre IS NULL;

-- 3. Verificar resultado
SELECT
  COUNT(*) FILTER (WHERE primer_nombre IS NOT NULL) AS con_primer_nombre_despues,
  COUNT(*) FILTER (WHERE nombres IS NOT NULL) AS con_nombres_legacy,
  COUNT(*) AS total
FROM personas;

-- 4. Casos a revisar manualmente: personas con solo un nombre (segundo_nombre quedará vacío)
SELECT id, folio, nombres, primer_nombre, segundo_nombre
FROM personas
WHERE nombres IS NOT NULL
  AND nombres NOT LIKE '% %'
ORDER BY created_at DESC
LIMIT 20;
