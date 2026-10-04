BEGIN;

WITH registros_migracion AS (
  SELECT
    auditoria.id AS audit_id,
    auditoria.registro_id AS persona_id,
    auditoria.datos_despues->>'campo' AS campo,
    confirmacion.telefono
  FROM audit_log auditoria
  JOIN verificacion_entrevista_telefono_confirmaciones confirmacion
    ON confirmacion.llamada_id = (auditoria.datos_despues->>'llamada_id')::uuid
  WHERE auditoria.tabla = 'personas'
    AND auditoria.accion = 'TELEFONO_VERIFICADO'
    AND auditoria.datos_despues->>'fuente' = 'MIGRACION_029_CONFIRMACION'
),
reversiones AS (
  SELECT
    registro.persona_id,
    MAX(registro.telefono) FILTER (
      WHERE registro.campo = 'telefono'
    ) AS telefono_principal,
    MAX(registro.telefono) FILTER (
      WHERE registro.campo = 'telefono_secundario'
    ) AS telefono_secundario
  FROM registros_migracion registro
  GROUP BY registro.persona_id
),
revertidos AS (
  UPDATE personas persona
  SET
    telefono = CASE
      WHEN reversion.telefono_principal IS NOT NULL
        AND persona.telefono = reversion.telefono_principal THEN NULL
      ELSE persona.telefono
    END,
    telefono_secundario = CASE
      WHEN reversion.telefono_secundario IS NOT NULL
        AND persona.telefono_secundario = reversion.telefono_secundario THEN NULL
      ELSE persona.telefono_secundario
    END,
    updated_at = NOW()
  FROM reversiones reversion
  WHERE persona.id = reversion.persona_id
  RETURNING persona.id
)
DELETE FROM audit_log auditoria
USING revertidos revertido
WHERE auditoria.registro_id = revertido.id
  AND auditoria.tabla = 'personas'
  AND auditoria.accion = 'TELEFONO_VERIFICADO'
  AND auditoria.datos_despues->>'fuente' = 'MIGRACION_029_CONFIRMACION';

COMMIT;
