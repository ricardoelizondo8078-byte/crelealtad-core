-- Reversión destructiva. Ejecutar únicamente sobre una base respaldada y después
-- de confirmar que ninguna aplicación consume estas tablas históricas.
BEGIN;
DROP TABLE historial_grupos_ciclos_semanas;
DROP TABLE historial_grupos_ciclos;
DROP TABLE importaciones_excel;
COMMIT;
