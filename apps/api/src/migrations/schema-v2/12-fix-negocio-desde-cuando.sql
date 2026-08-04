-- Corregir el tipo de dato de negocio_desde_cuando de DATE a VARCHAR
-- La columna debe almacenar rangos como "0-1 AÑO", "1-3 AÑOS", etc.

ALTER TABLE solicitudes
ALTER COLUMN negocio_desde_cuando TYPE varchar;
