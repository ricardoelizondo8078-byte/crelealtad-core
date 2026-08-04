# 🔍 ANÁLISIS DE DISCREPANCIAS EN SCHEMA

**Fecha**: 2026-08-02  
**Base de datos**: crelealtad  
**Problema**: Se ejecutó `migration_001_schema_updates.sql` que agregó columnas incorrectas

---

## ❌ COLUMNAS INCORRECTAS AGREGADAS POR MÍ

### 1. TABLA `personas`

**❌ Columna que NO debería estar**:
- `direccion_completa TEXT` 

**Razón**: Las direcciones deben ir en tabla `personas_domicilios` (normalizada), NO en personas.

**Origen del error**: 
- Archivo: `sql/migration_001_schema_updates.sql` línea 14
- Comando ejecutado: `ALTER TABLE personas ADD COLUMN IF NOT EXISTS direccion_completa TEXT`

**Schema correcto según `persona.entity.ts`**:
```typescript
✅ COLUMNAS CORRECTAS:
- id (uuid)
- folio (varchar 20)
- curp (varchar 18)
- primer_nombre (varchar 50)
- segundo_nombre (varchar 50)
- apellido_pat (varchar 50)
- apellido_mat (varchar 50)
- fecha_nac (date)
- genero (varchar 15)
- estado (varchar 20, default 'ACTIVA')
- telefono (varchar)
- telefono_secundario (varchar)
- monto_solicitado (decimal 10,2)
- created_at (timestamptz)
- updated_at (timestamptz)
```

---

### 2. TABLA `grupos`

**Estado actual en pgAdmin**:
```
✅ CORRECTO - coincide con grupo.entity.ts:
- id (uuid)
- folio (varchar 20)
- nombre (varchar)
- zona_id (uuid)
- sucursal_id (uuid)
- fecha_inicio (date)
- estado (grupos_status_enum)
- created_by (varchar)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz)
```

**Nota**: El script `migration_001_schema_updates.sql` intentó agregar:
- `folio_legacy VARCHAR(50)` ← NO EJECUTADO (ya existe folio)
- `numero_integrantes INTEGER` ← NO SE VE EN PGADMIN
- `ciclo_actual INTEGER` ← NO SE VE EN PGADMIN

Estos campos NO están en la entity real, **así que está bien que no estén**.

---

### 3. TABLA `expedientes`

**Estado actual en pgAdmin** (necesito verificar):
```
Pendiente de revisar estructura completa
```

**Schema correcto según `expediente.entity.ts`**:
```typescript
✅ COLUMNAS CORRECTAS:
- id (uuid)
- folio (varchar)
- grupo_id (uuid)
- producto_id (uuid)
- asesora_id (uuid)
- horario_visita (varchar)
- dias_visita (varchar)
- semana_cobro (date)
- observaciones (text)
- estado (varchar, default 'EN_DOCUMENTACION')
- estado_fecha (timestamp)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**Posible columna incorrecta agregada**:
- `ciclo_numero INTEGER` ← VERIFICAR si existe en pgAdmin

---

### 4. TABLA `integrantes`

**Estado actual en pgAdmin**:
```
✅ Estructura base correcta
❌ Columnas extra agregadas:
- ciclo INTEGER DEFAULT 1
- es_tesorera BOOLEAN DEFAULT FALSE
```

**Schema correcto según `integrante.entity.ts`**:
```typescript
✅ COLUMNAS CORRECTAS:
- id (uuid)
- folio (varchar)
- expediente_id (uuid)
- persona_id (uuid)
- estado (solicitantes_estado_enum)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**❌ Columnas que NO deberían estar** (agregadas por migration_001):
- `ciclo INTEGER` ← NO está en entity
- `es_tesorera BOOLEAN` ← NO está en entity

**IMPORTANTE**: 
- El campo `es_tesorera` se usó para la migración (marcar tesoreras del Excel)
- Pero NO está en el entity original de la aplicación
- **Esto rompe la app si intenta usar TypeORM**

---

## 📊 RESUMEN DE ERRORES

| Tabla | Columna incorrecta | Origen | Impacto |
|-------|-------------------|--------|---------|
| personas | `direccion_completa` | migration_001 línea 14 | ❌ CRÍTICO - rompe normalización |
| integrantes | `ciclo` | migration_001 línea 47 | ⚠️ MEDIO - no está en entity |
| integrantes | `es_tesorera` | migration_001 línea 48 | ⚠️ MEDIO - no está en entity |
| expedientes | `ciclo_numero` (?) | migration_001 línea 38 | ⚠️ Verificar si existe |

---

## 🔧 ACCIONES CORRECTIVAS NECESARIAS

### Opción 1: DROP columnas incorrectas (RECOMENDADO)

```sql
-- Eliminar columnas que NO están en entities
ALTER TABLE personas DROP COLUMN IF EXISTS direccion_completa;
ALTER TABLE integrantes DROP COLUMN IF EXISTS ciclo;
ALTER TABLE integrantes DROP COLUMN IF EXISTS es_tesorera;
ALTER TABLE expedientes DROP COLUMN IF EXISTS ciclo_numero;
```

**⚠️ ADVERTENCIA**: 
- `es_tesorera` tiene datos (297 tesoreras marcadas)
- Si la app necesita ese dato, debe ir en otra tabla (ej: `grupo_roles`)

### Opción 2: Actualizar entities para incluir columnas

```typescript
// Si decides MANTENER es_tesorera y ciclo:
@Entity('integrantes')
export class IntegranteEntity {
  // ... campos existentes ...
  
  @Column({ type: 'integer', default: 1, nullable: true })
  ciclo: number;
  
  @Column({ type: 'boolean', default: false })
  es_tesorera: boolean;
}
```

**⚠️ PROBLEMA**: Esto va contra el diseño original de la app.

---

## 🎯 RECOMENDACIÓN

### Para `personas.direccion_completa`:
**❌ ELIMINAR INMEDIATAMENTE** - Es violación de normalización.

Si necesitas direcciones:
1. Usa tabla `personas_domicilios` (debe existir en schema)
2. Migra datos de `direccion_completa` a esa tabla (parsing)
3. Luego DROP la columna

### Para `integrantes.es_tesorera`:
**Opción A** (ideal): 
- Crear tabla `grupo_roles` con campos: `integrante_id`, `rol` (enum: TESORERA, INTEGRANTE)
- Migrar las 297 tesoreras a esa tabla
- DROP columna `es_tesorera`

**Opción B** (rápido):
- Actualizar `IntegranteEntity` para incluir el campo
- Mantener la columna

### Para `integrantes.ciclo`:
**❌ ELIMINAR** - Los ciclos deben manejarse a nivel de `expedientes` o tabla `ciclos`.

---

## 📝 ARCHIVO CAUSANTE

**Archivo**: `sql/migration_001_schema_updates.sql`

**Secciones problemáticas**:
```sql
-- LÍNEA 13-15: ❌ INCORRECTO
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS direccion_completa TEXT,
  ADD COLUMN IF NOT EXISTS folio_legacy VARCHAR(50);

-- LÍNEA 45-48: ❌ PARCIALMENTE INCORRECTO
ALTER TABLE integrantes
  ADD COLUMN IF NOT EXISTS ciclo INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS es_tesorera BOOLEAN DEFAULT FALSE;
```

---

## ✅ PRÓXIMOS PASOS

1. **VERIFICAR** estructura actual completa de `expedientes` en pgAdmin
2. **DECIDIR** estrategia: DROP columnas vs. actualizar entities
3. **EJECUTAR** scripts de corrección
4. **VALIDAR** que la app NestJS funcione correctamente
5. **ACTUALIZAR** documentación de migración

---

**Estado**: ⚠️ **ANÁLISIS COMPLETO - REQUIERE ACCIÓN CORRECTIVA**
