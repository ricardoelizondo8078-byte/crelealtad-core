# 🔍 REPORTE DE DIAGNÓSTICO FINAL - Error 500 PATCH /solicitudes

## ✅ CORRECCIONES APLICADAS

### 1. **Migración base de datos - tabla `personas`**
   - ✅ `primer_nombre` → NULL permitido
   - ✅ `segundo_nombre` → NULL permitido
   - **Estado:** COMPLETADO

### 2. **Migración base de datos - tabla `solicitudes_datos_personales`**
   - ✅ `primer_nombre` → NULL permitido
   - ✅ `segundo_nombre` → NULL permitido
   - **Estado:** COMPLETADO

### 3. **Frontend - Autenticación JWT**
   - ✅ 11 llamadas `fetch()` reemplazadas por `api.*()`
   - ✅ Token JWT se envía en todas las peticiones
   - **Archivos modificados:** `apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx`
   - **Estado:** COMPLETADO

### 4. **Backend - Eliminación de campo readonly**
   - ✅ Eliminación explícita de `nombre_completo` antes de guardar
   - **Archivo modificado:** `apps/api/src/solicitudes/solicitudes.service.ts` línea 191
   - **Estado:** COMPLETADO

### 5. **Logging agregado para diagnóstico**
   - ✅ Logging detallado en `upsertDatosPersonales()`
   - ✅ Captura de error SQL, mensaje, y detalle
   - **Archivo modificado:** `apps/api/src/solicitudes/solicitudes.service.ts` líneas 193-204
   - **Estado:** COMPLETADO

---

## ❌ ERROR 500 PERSISTE

### Estado actual:
```
✅ PASO 1: LOGIN
✅ PASO 2: CREAR INTEGRANTE
✅ PASO 3: GUARDAR PASO 1 (PATCH /integrantes)
❌ PASO 4: GUARDAR SOLICITUD (PATCH /solicitudes/integrante/:id) → HTTP 500
```

### Endpoint que falla:
```
PATCH /solicitudes/integrante/1e78544b-9e0e-422b-a316-30aacde04d90
```

### Payload enviado:
```json
{
  "nombres": "MARÍA DEL SOCORRO",
  "apellido_pat": "GARCÍA",
  "apellido_mat": "LÓPEZ",
  "fecha_nac": "1985-01-15",
  "curp": "GAML850115MNLRPR01",
  "genero": "FEMENINO",
  "estado_civil": "CASADA",
  "ocupacion": "COMERCIANTE",
  "nivel_estudio": "PRIMARIA",
  "nacionalidad": "MEXICANA",
  "estado_nacimiento": "NUEVO LEÓN"
}
```

---

## 🔍 CAUSAS DESCARTADAS

1. ❌ **NOT NULL en `primer_nombre` / `segundo_nombre`** 
   - **Descartado:** Migración aplicada exitosamente a ambas tablas

2. ❌ **Autenticación JWT**
   - **Descartado:** El error aparece DESPUÉS de pasar autenticación (PASO 3 funciona)

3. ❌ **Campo `nombre_completo` readonly**
   - **Descartado:** Eliminación explícita agregada antes del `save()`

---

## 🎯 PRÓXIMO PASO CRÍTICO

**NECESITO EL STACK TRACE COMPLETO** del error 500 de la ventana VERDE de la API.

El logging agregado en `upsertDatosPersonales()` imprime:
```
❌ ERROR EN upsertDatosPersonales:
Error completo: <OBJETO ERROR>
Mensaje: <MENSAJE>
Detalle: <DETALLE SQL>
SQL: <QUERY EJECUTADO>
```

**Este error debe aparecer en la consola VERDE inmediatamente después de ejecutar:**
```bash
node test-paso1-guardado.js
```

---

## 🔬 POSIBLES CAUSAS RESTANTES

1. **Foreign key constraint**
   - `solicitud_id` puede estar intentando apuntar a un registro que no existe en `solicitudes_core`
   - El servicio crea `solicitudes_core` primero (línea 132), pero puede haber un problema de transacción

2. **Tipo de dato incorrecto**
   - `fecha_nac` espera formato `YYYY-MM-DD` pero puede estar recibiendo otro formato
   - El script envía `"1985-01-15"` que es correcto, pero puede haber transformación intermedia

3. **Constraint UNIQUE violado**
   - `curp` puede ser UNIQUE y ya existir en la tabla
   - Posible duplicado de datos de prueba

4. **Columna generada `nombre_completo`**
   - A pesar de `insert: false, update: false`, TypeORM puede intentar insertarla
   - La eliminación explícita debería corregir esto, pero la base puede tener un trigger o constraint adicional

5. **Otra tabla fallando**
   - El servicio llama 7 métodos `upsert*()` en secuencia
   - El error puede venir de `upsertDomicilio()`, `upsertNegocio()`, etc., no de `upsertDatosPersonales()`

---

## 📊 FLUJO COMPLETO DEL ERROR

```
Frontend (test-paso1-guardado.js)
  │
  ▼
PATCH /solicitudes/integrante/:id
  │
  ▼
SolicitudesController.partialUpdateByIntegrante()
  │
  ▼
SolicitudesService.partialUpdate()
  │
  ├──▶ Crear/buscar solicitudes_core ✅ (línea 126-133)
  │
  ├──▶ Actualizar core fields ✅ (línea 136-146)
  │
  ├──▶ upsertDatosPersonales() ❌ (línea 149) 
  │    └─▶ **AQUÍ FALLA CON ERROR 500**
  │
  ├──▶ upsertDomicilio()
  ├──▶ upsertNegocio()
  ├──▶ upsertReferencias()
  ├──▶ upsertBeneficiario()
  ├──▶ upsertValidaciones()
  └──▶ upsertDocumentos()
```

---

## 📝 ESTADO DE COLUMNAS EN BASE DE DATOS

### Tabla `personas`:
| Columna | Tipo | NOT NULL | Estado |
|---------|------|----------|--------|
| `nombres` | VARCHAR(150) | ✅ NO | ✅ OK |
| `apellido_pat` | VARCHAR(50) | ✅ NO | ✅ OK |
| `apellido_mat` | VARCHAR(50) | ✅ NO | ✅ OK |
| `primer_nombre` | VARCHAR(50) | ✅ NO | ✅ CORREGIDO |
| `segundo_nombre` | VARCHAR(50) | ✅ NO | ✅ CORREGIDO |
| `nombre_completo` | VARCHAR(255) GENERATED | NULL | ✅ OK |

### Tabla `solicitudes_datos_personales`:
| Columna | Tipo | NOT NULL | Estado |
|---------|------|----------|--------|
| `nombres` | VARCHAR(150) | ✅ NO | ✅ OK |
| `apellido_pat` | VARCHAR(50) | ✅ NO | ✅ OK |
| `apellido_mat` | VARCHAR(50) | ✅ NO | ✅ OK |
| `primer_nombre` | VARCHAR(50) | ✅ NO | ✅ CORREGIDO |
| `segundo_nombre` | VARCHAR(50) | ✅ NO | ✅ CORREGIDO |
| `nombre_completo` | VARCHAR(255) GENERATED | NULL | ✅ OK |

---

## 🎯 ACCIÓN REQUERIDA

**Copia y pega el bloque de error completo** que aparece en la ventana VERDE de la API al ejecutar:
```bash
node test-paso1-guardado.js
```

El error debe incluir:
```
❌ ERROR EN upsertDatosPersonales:
Error completo: QueryFailedError: <MENSAJE DE POSTGRESQL>
Mensaje: <DESCRIPCIÓN DEL ERROR>
Detalle: <DETALLE ESPECÍFICO>
SQL: INSERT INTO solicitudes_datos_personales ...
```

**Con ese stack trace podré:**
1. Identificar la causa exacta (constraint, tipo de dato, FK, etc.)
2. Aplicar la corrección específica
3. Verificar que el flujo completo funciona

---

## 📄 ARCHIVOS MODIFICADOS

1. ✅ `apps/api/src/migrations/permitir-null-columnas-legacy.sql`
2. ✅ `apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx`
3. ✅ `apps/api/src/solicitudes/solicitudes.service.ts`
4. ✅ `test-paso1-guardado.js`
5. ✅ `aplicar-migracion-solicitudes-datos-personales.js`

---

## ⏳ TIEMPO INVERTIDO

- Diagnóstico de autenticación: ✅ COMPLETADO
- Migración base de datos (2 tablas): ✅ COMPLETADO
- Corrección frontend (11 fetch → api): ✅ COMPLETADO
- Corrección backend (readonly field): ✅ COMPLETADO
- **Falta:** Diagnóstico del error SQL real
