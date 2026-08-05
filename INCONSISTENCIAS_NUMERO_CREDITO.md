# ❌ INCONSISTENCIAS CRÍTICAS: Historial de Créditos

**Fecha**: 05 de agosto de 2026  
**Sistema**: CRELEALTAD CORE  
**Auditor**: Verificación automática + revisión de código

---

## 🔴 HALLAZGOS CRÍTICOS

### 1. ❌ CONSTRAINT UNIQUE (persona_id, numero_credito) NO EXISTE

**Severidad**: **CRÍTICO**  
**Impacto**: Permite duplicados que rompen el historial de créditos

**Estado actual**:
- ✅ No hay duplicados en los datos actuales
- ❌ **NO existe constraint** que prevenga duplicados futuros
- ⚠️  Sin la constraint, un bug en el código podría crear duplicados

**Evidencia**:
```sql
-- Query de verificación ejecutado
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = 'solicitudes';

-- Resultado: Solo existe constraint en solicitudes_datos_personales.solicitud_id
-- NO existe UNIQUE (persona_id, numero_credito)
```

**Constraint faltante**:
```sql
ALTER TABLE solicitudes
ADD CONSTRAINT solicitudes_persona_numero_credito_unique
UNIQUE (persona_id, numero_credito);
```

**Justificación**:
- `numero_credito` es el contador de créditos REALES desembolsados por persona
- Debe ser único y consecutivo (1, 2, 3, ...) por persona
- Si hay duplicados, se rompe el historial de crecimiento de línea de crédito
- Las reglas de refinanciamiento dependen de esta secuencia

---

### 2. ❌ NO EXISTE LÓGICA DE INCREMENTO AUTOMÁTICO DE numero_credito

**Severidad**: **CRÍTICO**  
**Impacto**: No hay garantía de que numero_credito solo incremente en desembolsos reales

**Hallazgo**:
```typescript
// apps/api/src/solicitudes/solicitudes.service.ts
// Líneas 64-77: Creación de solicitud

solicitudCore = manager.create(SolicitudCoreEntity, {
  integrante_id: integranteId,
  // ... otros campos ...
  numero_credito: dto.numero_credito,  // ⚠️  VALOR VIENE DEL DTO
  // ... más campos ...
});
```

**Problemas detectados**:
1. **No hay lógica de cálculo automático** de `numero_credito`
2. **Se toma del DTO** - puede venir del frontend sin validación
3. **No hay verificación** de que sea solo en desembolsos (no en rechazos/retiros)
4. **No hay servicio de créditos** aún que maneje el desembolso

**Búsqueda exhaustiva**:
```bash
# Búsqueda en todo el código fuente:
grep -r "numero_credito.*(\+\+|update|set|increment)" apps/api/src/
# Resultado: NO se encontró lógica de incremento
```

**Lógica requerida** (NO implementada):
```typescript
// EJEMPLO de cómo DEBERÍA funcionar (NO EXISTE):

async function calcularNumeroCredito(personaId: string): Promise<number> {
  // 1. Obtener el último numero_credito de créditos DESEMBOLSADOS
  const ultimoCredito = await this.dataSource.query(`
    SELECT MAX(s.numero_credito) AS ultimo
    FROM solicitudes s
    INNER JOIN creditos c ON c.id = s.credito_id
    WHERE s.persona_id = $1
      AND c.fecha_desembolso IS NOT NULL  -- Solo desembolsados
  `, [personaId]);

  // 2. Incrementar en 1 (o empezar en 1 si es el primero)
  return (ultimoCredito[0]?.ultimo || 0) + 1;
}

// DEBE llamarse SOLO en el momento del desembolso:
async function crearCredito(solicitudId: string) {
  const solicitud = await obtenerSolicitud(solicitudId);

  // Solo si se va a desembolsar realmente
  const numeroCredito = await calcularNumeroCredito(solicitud.persona_id);

  await this.dataSource.query(`
    UPDATE solicitudes
    SET numero_credito = $1
    WHERE id = $2
  `, [numeroCredito, solicitudId]);

  // ... crear registro en tabla creditos con fecha_desembolso ...
}
```

**Escenarios de riesgo**:
- ❌ Solicitud aprobada pero cancelada → `numero_credito` asignado sin desembolso
- ❌ Solicitud rechazada → podría haber incrementado el contador
- ❌ Cliente retira solicitud → número quemado
- ❌ Frontend envía `numero_credito` incorrecto → se guarda sin validación

---

### 3. ⚠️  AUSENCIA DE FOREIGN KEYS EN solicitudes

**Severidad**: **ALTA**  
**Impacto**: Posibilidad de registros huérfanos que rompan la cadena de integridad

**Foreign Keys faltantes detectadas**:

```sql
-- FK que SÍ existe (única encontrada):
solicitudes_datos_personales.solicitud_id -> solicitudes.id

-- FK que NO existen (DEBEN agregarse):
solicitudes.persona_id -> personas.id
solicitudes.expediente_id -> expedientes.id
solicitudes.grupo_id -> grupos.id
solicitudes.credito_id -> creditos.id
solicitudes.integrante_id -> integrantes.id
```

**Estado actual de la cadena**:
```
personas (3,242)
    ↓
solicitudes (0) ← ⚠️  Sin datos aún
    ↓
creditos (0) ← ⚠️  Sin datos aún
```

**Verificación de huérfanos**:
```sql
-- Ejecutado: Query de integridad
WITH persona_creditos AS (
  SELECT
    p.id AS persona_id,
    COUNT(DISTINCT s.id) AS num_solicitudes,
    COUNT(DISTINCT c.id) AS num_creditos,
    COUNT(DISTINCT CASE WHEN s.persona_id IS NULL THEN s.id END) AS solicitudes_sin_persona,
    COUNT(DISTINCT CASE WHEN c.persona_id IS NULL THEN c.id END) AS creditos_sin_persona
  FROM personas p
  LEFT JOIN solicitudes s ON s.persona_id = p.id
  LEFT JOIN creditos c ON c.id = s.credito_id
  GROUP BY p.id
)
SELECT
  COUNT(*) AS total_personas,
  SUM(num_solicitudes) AS total_solicitudes,
  SUM(num_creditos) AS total_creditos,
  SUM(solicitudes_sin_persona) AS solicitudes_huerfanas,
  SUM(creditos_sin_persona) AS creditos_huerfanos
FROM persona_creditos;

-- Resultado:
-- total_personas: 3,242
-- total_solicitudes: 0
-- total_creditos: 0
-- solicitudes_huerfanas: 0
-- creditos_huerfanos: 0
```

**Conclusión**: Actualmente no hay registros huérfanos, pero **sin FK constraints**, no hay garantía para el futuro.

**Constraints faltantes propuestas**:
```sql
-- Agregar FK en solicitudes
ALTER TABLE solicitudes
ADD CONSTRAINT fk_solicitudes_persona
    FOREIGN KEY (persona_id)
    REFERENCES personas(id)
    ON DELETE RESTRICT;  -- No permitir borrar persona con solicitudes

ALTER TABLE solicitudes
ADD CONSTRAINT fk_solicitudes_expediente
    FOREIGN KEY (expediente_id)
    REFERENCES expedientes(id)
    ON DELETE RESTRICT;

ALTER TABLE solicitudes
ADD CONSTRAINT fk_solicitudes_grupo
    FOREIGN KEY (grupo_id)
    REFERENCES grupos(id)
    ON DELETE RESTRICT;

ALTER TABLE solicitudes
ADD CONSTRAINT fk_solicitudes_credito
    FOREIGN KEY (credito_id)
    REFERENCES creditos(id)
    ON DELETE RESTRICT;

ALTER TABLE solicitudes
ADD CONSTRAINT fk_solicitudes_integrante
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT;
```

---

## ✅ QUERY DE PROGRESIÓN DE CRÉDITOS

**Ubicación**: `query_progresion_creditos.sql`

**Propósito**:
- Obtener historial COMPLETO de créditos por persona
- Validar que `numero_credito` sea consecutivo
- Detectar gaps en la secuencia
- Detectar solicitudes con `numero_credito` SIN desembolso real

**Query principal**:
```sql
SELECT
    p.id AS persona_id,
    p.curp,
    CONCAT(p.nombres, ' ', p.apellido_pat, ' ', COALESCE(p.apellido_mat, '')) AS nombre_completo,

    s.id AS solicitud_id,
    s.numero_credito,
    s.created_at AS fecha_solicitud,
    s.monto_solicitado,
    s.monto_autorizado,

    c.id AS credito_id,
    c.fecha_desembolso,
    c.monto_desembolsado,
    c.estado AS estado_credito,

    g.id AS grupo_id,
    g.nombre AS grupo_nombre,

    CASE
        WHEN c.id IS NOT NULL AND c.fecha_desembolso IS NOT NULL THEN 'DESEMBOLSADO'
        WHEN s.monto_autorizado IS NOT NULL AND s.monto_autorizado > 0 THEN 'AUTORIZADO_PENDIENTE'
        WHEN s.id IS NOT NULL THEN 'SOLICITUD_ACTIVA'
        ELSE 'DESCONOCIDO'
    END AS estado_solicitud,

    CASE
        WHEN c.id IS NOT NULL AND c.fecha_desembolso IS NOT NULL THEN TRUE
        ELSE FALSE
    END AS es_credito_real

FROM personas p
LEFT JOIN solicitudes s ON s.persona_id = p.id
LEFT JOIN creditos c ON c.id = s.credito_id
LEFT JOIN grupos g ON g.id = s.grupo_id

WHERE p.id = '<PERSONA_ID>'

ORDER BY
    COALESCE(c.fecha_desembolso, s.created_at) ASC,
    s.numero_credito ASC;
```

**Estado**: ✅ Query funcional, probado con datos reales

**Nota**: El query se adaptó a la estructura REAL de las tablas:
- `creditos` NO tiene `grupo_id` (se obtiene desde `solicitudes.grupo_id`)
- `creditos` NO tiene `saldo_actual` ni `saldo_total`
- `grupos` NO tiene `ciclo_actual`

---

## 📊 VALIDACIONES IMPLEMENTADAS

### 1. Detectar duplicados (persona_id, numero_credito)
```sql
SELECT
    persona_id,
    numero_credito,
    COUNT(*) AS cantidad_duplicados
FROM solicitudes
WHERE persona_id IS NOT NULL
  AND numero_credito IS NOT NULL
GROUP BY persona_id, numero_credito
HAVING COUNT(*) > 1;
```
**Resultado actual**: ✅ Sin duplicados

---

### 2. Detectar numero_credito sin desembolso
```sql
SELECT
    s.id AS solicitud_id,
    s.persona_id,
    s.numero_credito,
    CASE
        WHEN c.id IS NULL THEN 'SOLICITUD_SIN_CREDITO'
        WHEN c.fecha_desembolso IS NULL THEN 'CREDITO_SIN_DESEMBOLSO'
        ELSE 'OK'
    END AS problema
FROM solicitudes s
LEFT JOIN creditos c ON c.id = s.credito_id
WHERE s.numero_credito IS NOT NULL
  AND (c.id IS NULL OR c.fecha_desembolso IS NULL);
```
**Resultado actual**: ✅ Sin inconsistencias (tabla vacía)

---

### 3. Detectar gaps en secuencia
```sql
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
WHERE numero_credito - numero_credito_anterior > 1;
```
**Resultado actual**: ✅ Sin gaps (tabla vacía)

---

## 🚨 ACCIONES REQUERIDAS

### INMEDIATAS (Antes de desembolsar el primer crédito)

1. **Agregar constraint UNIQUE (persona_id, numero_credito)**
   ```sql
   ALTER TABLE solicitudes
   ADD CONSTRAINT solicitudes_persona_numero_credito_unique
   UNIQUE (persona_id, numero_credito);
   ```

2. **Implementar lógica de incremento automático**
   - Crear función `calcularNumeroCredito(personaId)`
   - Solo llamarla en el momento del DESEMBOLSO REAL
   - Nunca asignar `numero_credito` en solicitudes rechazadas/canceladas

3. **Agregar Foreign Keys en solicitudes**
   ```sql
   ALTER TABLE solicitudes
   ADD CONSTRAINT fk_solicitudes_persona
       FOREIGN KEY (persona_id)
       REFERENCES personas(id)
       ON DELETE RESTRICT;

   -- (y las demás FK listadas en el hallazgo #3)
   ```

---

### VALIDACIÓN CONTINUA (En cada desembolso)

4. **Ejecutar query de validación** antes de cada desembolso:
   ```typescript
   // Antes de crear un crédito:
   const validaciones = await verificarIntegridadHistorialCreditos(personaId);

   if (validaciones.tiene_duplicados || validaciones.tiene_gaps) {
     throw new Error('Historial de créditos inconsistente');
   }
   ```

5. **Monitorear queries de validación** en un dashboard de operaciones

---

## 📝 CONTRATO DE numero_credito

**Regla de oro**: `numero_credito` SOLO se asigna e incrementa en DESEMBOLSO REAL.

| Escenario | numero_credito |
|-----------|----------------|
| ✅ Crédito desembolsado | Incrementa (1 → 2 → 3) |
| ❌ Solicitud aprobada pero NO desembolsada | NULL |
| ❌ Solicitud rechazada | NULL |
| ❌ Solicitud cancelada | NULL |
| ❌ Cliente retira solicitud | NULL |

**Consecuencias de violar el contrato**:
- 🔴 Historial de créditos incorrecto
- 🔴 Reglas de refinanciamiento fallan
- 🔴 Análisis de crecimiento de línea inválido
- 🔴 Reportes de cartera incorrectos

---

## 🛠️  ARCHIVOS GENERADOS

1. `query_progresion_creditos.sql` - Query de progresión completa
2. `apps/api/probar_query_progresion.js` - Script de prueba del query
3. `apps/api/verificar_constraints_creditos.js` - Script de verificación de constraints
4. `verificacion_constraints_creditos.json` - Resultado de la verificación

---

## 📌 NOTAS ADICIONALES

### Sobre monto_prospeccion
- ✅ **Se confirmó**: `monto_prospeccion` en `personas` SÍ puede sobrescribirse
- ✅ **No requiere histórico**: Solo importa el valor actual
- ✅ **Valor real de línea**: Viene del historial de créditos desembolsados

### Sobre el diseño actual
- ⚠️  Tabla `solicitudes` está vacía (sin datos de prueba aún)
- ⚠️  Tabla `creditos` está vacía (sin datos de prueba aún)
- ✅ Tabla `personas` tiene 3,242 registros
- ✅ No hay registros huérfanos en el estado actual

---

**Generado**: 05 de agosto de 2026  
**Próxima revisión**: Antes del primer desembolso de crédito
