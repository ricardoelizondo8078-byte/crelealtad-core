-- =====================================================
-- BACKUP MANUAL: Crear script de respaldo
-- =====================================================

-- Contar registros ANTES del backup
SELECT 'BACKUP - Registros en personas:' as info, COUNT(*) as cantidad FROM personas;
SELECT 'BACKUP - Registros en solicitudes_datos_personales:' as info, COUNT(*) as cantidad FROM solicitudes_datos_personales;

-- Verificar estructura actual
SELECT 'ESTRUCTURA personas' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
  AND column_name IN ('primer_nombre', 'segundo_nombre', 'apellido_pat', 'apellido_mat', 'nombres', 'nombre_completo')
ORDER BY ordinal_position;

SELECT 'ESTRUCTURA solicitudes_datos_personales' as tabla,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitudes_datos_personales'
  AND column_name IN ('primer_nombre', 'segundo_nombre', 'apellido_pat', 'apellido_mat', 'nombres', 'nombre_completo')
ORDER BY ordinal_position;

-- Mostrar primeros 5 registros como evidencia del estado ANTES
SELECT 'DATOS ACTUALES personas - Primeros 5 registros' as snapshot;
SELECT
  id,
  folio,
  primer_nombre,
  segundo_nombre,
  apellido_pat,
  apellido_mat
FROM personas
LIMIT 5;

SELECT 'DATOS ACTUALES solicitudes_datos_personales - Primeros 5 registros' as snapshot;
SELECT
  id,
  solicitud_id,
  primer_nombre,
  segundo_nombre,
  apellido_pat,
  apellido_mat
FROM solicitudes_datos_personales
LIMIT 5;
