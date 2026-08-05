-- =====================================================
-- QUERY DE PROGRESIÓN DE CRÉDITOS POR PERSONA
-- =====================================================
--
-- Este query devuelve el historial completo de crecimiento
-- de línea de crédito de una persona específica, mostrando
-- la progresión de numero_credito, montos autorizados y
-- desembolsados en orden cronológico.
--
-- IMPORTANTE: Este query sustenta:
-- - Reglas de refinanciamiento
-- - Análisis de crecimiento de línea de crédito
-- - Validación de historial crediticio
--
-- USO:
--   Reemplazar '<PERSONA_ID>' con el UUID real de la persona
-- =====================================================

SELECT
    p.id AS persona_id,
    p.curp,
    CONCAT(p.nombres, ' ', p.apellido_pat, ' ', COALESCE(p.apellido_mat, '')) AS nombre_completo,

    -- Datos de la solicitud
    s.id AS solicitud_id,
    s.numero_credito,
    s.created_at AS fecha_solicitud,
    s.monto_solicitado,
    s.monto_autorizado,

    -- Datos del crédito (si existe)
    c.id AS credito_id,
    c.fecha_desembolso,
    c.monto_desembolsado,
    c.estado AS estado_credito,
    c.tasa,
    c.num_semanas,

    -- Datos del grupo (desde solicitud)
    g.id AS grupo_id,
    g.nombre AS grupo_nombre,
    g.estado AS grupo_estado,

    -- Estado de la solicitud (inferido)
    CASE
        WHEN c.id IS NOT NULL AND c.fecha_desembolso IS NOT NULL THEN 'DESEMBOLSADO'
        WHEN s.monto_autorizado IS NOT NULL AND s.monto_autorizado > 0 THEN 'AUTORIZADO_PENDIENTE'
        WHEN s.id IS NOT NULL THEN 'SOLICITUD_ACTIVA'
        ELSE 'DESCONOCIDO'
    END AS estado_solicitud,

    -- Indicador de si cuenta como crédito real
    CASE
        WHEN c.id IS NOT NULL AND c.fecha_desembolso IS NOT NULL THEN TRUE
        ELSE FALSE
    END AS es_credito_real

FROM personas p

-- LEFT JOIN porque puede haber personas sin solicitudes aún
LEFT JOIN solicitudes s ON s.persona_id = p.id

-- LEFT JOIN porque puede haber solicitudes sin crédito desembolsado
LEFT JOIN creditos c ON c.id = s.credito_id

-- LEFT JOIN para datos del grupo (opcional)
-- LEFT JOIN: grupos (solo desde solicitud, creditos NO tiene grupo_id)
LEFT JOIN grupos g ON g.id = s.grupo_id

WHERE p.id = '<PERSONA_ID>'  -- ← REEMPLAZAR CON UUID REAL

-- Ordenar cronológicamente
ORDER BY
    COALESCE(c.fecha_desembolso, s.created_at) ASC,
    s.numero_credito ASC;


-- =====================================================
-- VARIANTE: RESUMEN CONSOLIDADO POR PERSONA
-- =====================================================
-- Usar este query para obtener estadísticas agregadas
-- del historial crediticio de una persona

WITH creditos_reales AS (
    SELECT
        p.id AS persona_id,
        s.numero_credito,
        c.fecha_desembolso,
        s.monto_autorizado,
        c.monto_desembolsado,
        g.nombre AS grupo_nombre,
        c.estado
    FROM personas p
    INNER JOIN solicitudes s ON s.persona_id = p.id
    INNER JOIN creditos c ON c.id = s.credito_id
    WHERE p.id = '<PERSONA_ID>'
      AND c.fecha_desembolso IS NOT NULL  -- Solo créditos desembolsados
)
SELECT
    persona_id,
    COUNT(*) AS total_creditos_desembolsados,
    MAX(numero_credito) AS numero_credito_actual,
    MIN(fecha_desembolso) AS fecha_primer_credito,
    MAX(fecha_desembolso) AS fecha_ultimo_credito,
    SUM(monto_desembolsado) AS suma_historica_desembolsada,
    AVG(monto_desembolsado) AS promedio_monto_desembolso,
    MAX(monto_desembolsado) AS maximo_monto_desembolsado,

    -- Verificar que numero_credito sea consecutivo (sin gaps)
    CASE
        WHEN MAX(numero_credito) = COUNT(*) THEN 'CONSECUTIVO'
        ELSE 'CON_GAPS'
    END AS validacion_secuencia,

    -- Lista de grupos donde ha tenido créditos
    STRING_AGG(DISTINCT grupo_nombre, ', ' ORDER BY grupo_nombre) AS grupos_historicos

FROM creditos_reales
GROUP BY persona_id;


-- =====================================================
-- VALIDACIÓN: Detectar violaciones del contrato
-- =====================================================
-- Este query detecta casos problemáticos que romperían
-- el contrato de incremento de numero_credito

-- 1. Detectar múltiples solicitudes con mismo numero_credito para una persona
SELECT
    persona_id,
    numero_credito,
    COUNT(*) AS cantidad_duplicados,
    STRING_AGG(id::text, ', ') AS solicitudes_duplicadas
FROM solicitudes
WHERE persona_id IS NOT NULL
  AND numero_credito IS NOT NULL
GROUP BY persona_id, numero_credito
HAVING COUNT(*) > 1
ORDER BY persona_id, numero_credito;


-- 2. Detectar numero_credito asignado a solicitudes SIN desembolso real
SELECT
    s.id AS solicitud_id,
    s.persona_id,
    s.numero_credito,
    s.monto_autorizado,
    s.created_at,
    c.id AS credito_id,
    c.fecha_desembolso,
    c.monto_desembolsado,
    CASE
        WHEN c.id IS NULL THEN 'SOLICITUD_SIN_CREDITO'
        WHEN c.fecha_desembolso IS NULL THEN 'CREDITO_SIN_DESEMBOLSO'
        ELSE 'OK'
    END AS problema
FROM solicitudes s
LEFT JOIN creditos c ON c.id = s.credito_id
WHERE s.numero_credito IS NOT NULL
  AND (c.id IS NULL OR c.fecha_desembolso IS NULL)
ORDER BY s.persona_id, s.numero_credito;


-- 3. Detectar gaps en la secuencia de numero_credito por persona
WITH secuencia AS (
    SELECT
        persona_id,
        numero_credito,
        LAG(numero_credito) OVER (PARTITION BY persona_id ORDER BY numero_credito) AS numero_credito_anterior
    FROM solicitudes
    WHERE persona_id IS NOT NULL
      AND numero_credito IS NOT NULL
)
SELECT
    persona_id,
    numero_credito_anterior,
    numero_credito,
    numero_credito - numero_credito_anterior AS gap
FROM secuencia
WHERE numero_credito - numero_credito_anterior > 1
ORDER BY persona_id, numero_credito;
