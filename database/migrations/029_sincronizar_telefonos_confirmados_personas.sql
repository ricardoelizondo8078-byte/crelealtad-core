BEGIN;

WITH confirmaciones_vigentes AS (
  SELECT DISTINCT ON (integrante.persona_id, confirmacion.tipo_telefono)
    persona.id AS persona_id,
    confirmacion.tipo_telefono,
    confirmacion.telefono,
    confirmacion.registrada_por,
    confirmacion.integrante_id,
    confirmacion.llamada_id,
    confirmacion.evidencia_id
  FROM verificacion_entrevista_telefono_confirmaciones confirmacion
  JOIN integrantes integrante ON integrante.id = confirmacion.integrante_id
  JOIN personas persona ON persona.id = integrante.persona_id
  WHERE integrante.persona_id IS NOT NULL
  ORDER BY
    integrante.persona_id,
    confirmacion.tipo_telefono,
    confirmacion.created_at DESC,
    confirmacion.id DESC
),
actualizables AS (
  SELECT confirmacion.*
  FROM confirmaciones_vigentes confirmacion
  JOIN personas persona ON persona.id = confirmacion.persona_id
  WHERE (
    confirmacion.tipo_telefono = 'PRINCIPAL'
    AND NULLIF(BTRIM(persona.telefono), '') IS NULL
  ) OR (
    confirmacion.tipo_telefono = 'SECUNDARIO'
    AND NULLIF(BTRIM(persona.telefono_secundario), '') IS NULL
  )
),
auditoria AS (
  INSERT INTO audit_log (
    tabla,
    registro_id,
    accion,
    datos_antes,
    datos_despues,
    usuario_id
  )
  SELECT
    'personas',
    actualizable.persona_id,
    'TELEFONO_VERIFICADO',
    jsonb_build_object(
      'campo', CASE
        WHEN actualizable.tipo_telefono = 'PRINCIPAL' THEN 'telefono'
        ELSE 'telefono_secundario'
      END,
      'tenia_valor', FALSE
    ),
    jsonb_build_object(
      'campo', CASE
        WHEN actualizable.tipo_telefono = 'PRINCIPAL' THEN 'telefono'
        ELSE 'telefono_secundario'
      END,
      'fuente', 'MIGRACION_029_CONFIRMACION',
      'integrante_id', actualizable.integrante_id,
      'llamada_id', actualizable.llamada_id,
      'evidencia_id', actualizable.evidencia_id
    ),
    actualizable.registrada_por
  FROM actualizables actualizable
  RETURNING registro_id
),
actualizaciones AS (
  SELECT
    actualizable.persona_id,
    MAX(actualizable.telefono) FILTER (
      WHERE actualizable.tipo_telefono = 'PRINCIPAL'
    ) AS telefono_principal,
    MAX(actualizable.telefono) FILTER (
      WHERE actualizable.tipo_telefono = 'SECUNDARIO'
    ) AS telefono_secundario
  FROM actualizables actualizable
  GROUP BY actualizable.persona_id
)
UPDATE personas persona
SET
  telefono = COALESCE(actualizacion.telefono_principal, persona.telefono),
  telefono_secundario = COALESCE(
    actualizacion.telefono_secundario,
    persona.telefono_secundario
  ),
  updated_at = NOW()
FROM actualizaciones actualizacion
WHERE persona.id = actualizacion.persona_id
  AND EXISTS (
    SELECT 1
    FROM auditoria
    WHERE auditoria.registro_id = persona.id
  );

COMMIT;
