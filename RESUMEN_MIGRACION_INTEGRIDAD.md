# ✅ MIGRACIÓN DE INTEGRIDAD COMPLETADA

**Fecha**: 05 de agosto de 2026  
**Commit**: bab9851

---

## 🎯 OBJETIVO

Cerrar la integridad de la cadena de historial de créditos **ANTES del primer desembolso**, garantizando que `numero_credito` solo incremente en desembolsos reales y que no existan registros huérfanos.

---

## ✅ CONSTRAINTS APLICADAS

### 1. **5 Foreign Keys** (ON DELETE RESTRICT)

Todas las FK usan `ON DELETE RESTRICT` porque en CRELEALTAD **no se borra información**:

| FK | Relación | Justificación ON DELETE RESTRICT |
|----|----------|----------------------------------|
| `fk_solicitudes_persona` | `solicitudes.persona_id -> personas.id` | Una persona con solicitudes NO debe poder eliminarse. Si se requiere "eliminar", debe ser soft delete. |
| `fk_solicitudes_expediente` | `solicitudes.expediente_id -> expedientes.id` | El expediente es crítico para la trazabilidad del proceso. No puede eliminarse si tiene solicitudes. |
| `fk_solicitudes_grupo` | `solicitudes.grupo_id -> grupos.id` | El grupo es parte del contexto operativo. No puede eliminarse si tiene solicitudes asociadas. |
| `fk_solicitudes_credito` | `solicitudes.credito_id -> creditos.id` | La relación solicitud ↔ crédito es fundamental para el historial. No puede eliminarse. |
| `fk_solicitudes_integrante` | `solicitudes.integrante_id -> integrantes.id` | El integrante es quien solicita el crédito. Su vínculo es permanente. |

**Verificación previa**: Se confirmó que **NO hay registros huérfanos** en ninguna de las 5 columnas.

---

### 2. **UNIQUE (persona_id, numero_credito)**

```sql
ALTER TABLE solicitudes
ADD CONSTRAINT solicitudes_persona_numero_credito_unique
UNIQUE (persona_id, numero_credito);
```

**Comportamiento en PostgreSQL**:
- Permite **múltiples filas con `numero_credito = NULL`** para la misma `persona_id`
- Solo valida unicidad cuando **ambos valores son NOT NULL**

**Esto es correcto porque**:
- Todas las solicitudes **SIN desembolso** tienen `numero_credito = NULL`
- Solo las solicitudes **DESEMBOLSADAS** tienen `numero_credito NOT NULL`
- Cada persona puede tener múltiples solicitudes sin desembolso (todas con NULL)
- Pero solo puede tener **UN** crédito con `numero_credito = 1`, **UNO** con `numero_credito = 2`, etc.

**Ejemplo válido**:
```
persona_id          | numero_credito
------------------- | --------------
uuid-persona-A      | NULL           ← Solicitud 1 (sin desembolso)
uuid-persona-A      | NULL           ← Solicitud 2 (sin desembolso)
uuid-persona-A      | 1              ← Primer crédito desembolsado
uuid-persona-A      | NULL           ← Solicitud 3 (sin desembolso)
uuid-persona-A      | 2              ← Segundo crédito desembolsado
```

---

## 🔒 SANITIZACIÓN DE DTO

Se modificó `solicitudes.service.ts` para **eliminar campos sensibles del DTO**:

```typescript
// ⚠️  SEGURIDAD: Eliminar campos que NO deben venir del DTO
const sanitizedDto = { ...dto };
delete sanitizedDto.numero_credito;
delete sanitizedDto.credito_id;
```

**Aplicado en**:
- `createOrUpdateForSolicitante()`
- `partialUpdate()`

**Razón**: `numero_credito` y `credito_id` solo deben asignarse en el momento del desembolso, **NUNCA** desde el frontend.

---

## 📋 CAMPO `integrante_id_old`

**Decisión**: NO se eliminó.

**Razón**: Está en uso como fallback en `solicitudes.service.ts:55`:
```typescript
const integranteId = dto.integrante_id || dto.solicitanteId || dto.integrante_id_old;
```

Se mantiene para compatibilidad con sistema legacy.

---

## 🧪 TESTS DE REGRESIÓN

Se crearon tests para verificar:

1. **Sanitización de `numero_credito`**: Enviarlo en el body NO lo persiste (queda NULL) ✅
2. **UNIQUE constraint duplicados**: Rechaza dos solicitudes con mismo `(persona_id, numero_credito)` NOT NULL ✅
3. **UNIQUE permite NULL**: Acepta múltiples solicitudes con mismo `persona_id` y `numero_credito = NULL` ✅
4. **FK persona_id**: Rechaza solicitudes con `persona_id` inexistente ✅
5. **ON DELETE RESTRICT**: Protege personas con solicitudes asociadas ✅

**Resultado**: Tests de integración manual confirmaron que las constraints funcionan correctamente.

---

## 📊 ESTADO DE LA BASE DE DATOS

### Antes de la migración:
- ❌ Sin FK constraints
- ❌ Sin UNIQUE constraint
- ❌ `numero_credito` aceptaba valores del DTO
- ⚠️  Alto riesgo de corrupción de historial

### Después de la migración:
- ✅ 5 FK con ON DELETE RESTRICT
- ✅ UNIQUE (persona_id, numero_credito)
- ✅ Sanitización de DTO implementada
- ✅ **Cadena de integridad cerrada**

### Datos actuales:
| Tabla | Registros | Estado |
|-------|-----------|--------|
| personas | 3,242 | ✅ Con datos |
| solicitudes | 2 | ⚠️  Ambas con `persona_id = NULL` |
| creditos | 0 | ⚠️  Vacía |

**Conclusión**: No hay datos históricos que limpiar. La migración se aplicó en el momento óptimo.

---

## 🔄 ROLLBACK

La migración incluye método `down()` completo y reversible que elimina las constraints en orden inverso.

Para revertir:
```typescript
const migration = new AddCreditHistoryIntegrityConstraints1785956582554();
await migration.down(queryRunner);
```

---

## 📁 ARCHIVOS GENERADOS

1. **Migración**:
   - `apps/api/src/migrations/1785956582554-AddCreditHistoryIntegrityConstraints.ts`

2. **Scripts de soporte**:
   - `apps/api/run-migration.ts` - Ejecutor de migración
   - `apps/api/verificar_huerfanos_pre_migracion.js` - Verificación pre-vuelo
   - `apps/api/test-integrity-constraints.js` - Tests de regresión

3. **Código modificado**:
   - `apps/api/src/solicitudes/solicitudes.service.ts` - Sanitización de DTO

---

## 🚀 PRÓXIMOS PASOS

La integridad está cerrada. **Antes de implementar el servicio de créditos**:

1. **Diseñar flujo de desembolso**:
   - Método que calcule `numero_credito` automáticamente
   - Solo llamarlo cuando el desembolso sea REAL
   - Nunca asignar en solicitudes rechazadas/canceladas

2. **Implementar lógica de incremento**:
   ```typescript
   async function calcularNumeroCredito(personaId: string): Promise<number> {
     const ultimo = await this.dataSource.query(`
       SELECT MAX(s.numero_credito) AS ultimo
       FROM solicitudes s
       INNER JOIN creditos c ON c.id = s.credito_id
       WHERE s.persona_id = $1
         AND c.fecha_desembolso IS NOT NULL
     `, [personaId]);

     return (ultimo[0]?.ultimo || 0) + 1;
   }
   ```

3. **Query de validación continua**:
   - Ejecutar antes de cada desembolso
   - Verificar ausencia de duplicados y gaps
   - Ver `query_progresion_creditos.sql`

---

## 📞 VERIFICACIÓN POST-MIGRACIÓN

```sql
-- Ver constraints aplicadas
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'solicitudes'::regclass
ORDER BY conname;
```

**Resultado esperado**:
- ✅ 5 FK constraints
- ✅ 1 UNIQUE constraint
- ✅ 1 PRIMARY KEY

---

**Migración ejecutada**: 05 de agosto de 2026, 1:05 PM  
**Resultado**: ✅ EXITOSA  
**Tiempo de ejecución**: ~2 segundos  
**Downtime**: 0 segundos (base vacía)
