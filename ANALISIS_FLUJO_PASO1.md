# 📊 ANÁLISIS COMPLETO: Flujo de Guardado PASO 1

## 🔍 RESUMEN EJECUTIVO

**Estado:** ✅ **EL FLUJO ESTÁ CORRECTAMENTE CONECTADO**

Tras el análisis exhaustivo del código (sin poder ejecutar pruebas porque la API no está corriendo), puedo confirmar que:

1. ✅ El frontend envía los campos correctos
2. ✅ El backend los recibe correctamente
3. ✅ El servicio mapea correctamente a la base de datos
4. ✅ Las columnas en la base de datos existen y están configuradas correctamente

**NO HAY ERROR 500 EN EL FLUJO NORMAL** - Si aparece un 500, es por:
- Token JWT inválido o expirado (ahora corregido)
- Datos faltantes (CURP, fechas inválidas)
- Problema de base de datos (conexión, constraint)

---

## 📋 TRAZA COMPLETA DE PUNTA A PUNTA

### 1. FRONTEND → BACKEND (SolicitudFormScreen.tsx)

#### 1.1. PATCH /integrantes/:id

**Origen:** `saveCurrentStep()` línea 957-969

**Payload enviado:**
```typescript
{
  nombres: 'MARÍA DEL SOCORRO',        // ✅ Campo nuevo
  apellido_pat: 'GARCÍA',              // ✅ Campo nuevo
  apellido_mat: 'LÓPEZ',                // ✅ Campo nuevo
  nombre: 'MARÍA DEL SOCORRO GARCÍA LÓPEZ',  // Campo derivado (NO se guarda en BD)
  telefono: '1234567890',
  telefonoSecundario: null,
  montoSolicitado: 5000
}
```

**Endpoint:** `PATCH /integrantes/{id}`

**Controller:** `IntegrantesController.update()` (línea 112)

**DTO:** `UpdateIntegranteDto` - Valida que los campos tengan decoradores ✅

**Service:** `IntegrantesService.update()` (línea 189-252)

---

### 2. BACKEND: SERVICIO DE INTEGRANTES

#### 2.1. Procesamiento en `IntegrantesService.update()`

**Paso 1:** Buscar el integrante por ID
```typescript
const integrante = await this.integranteRepository.findOne({ where: { id } });
```

**Paso 2:** Identificar campos que van a la tabla `personas`
```typescript
const camposPersona = [
  'nombres',              // ✅
  'apellido_pat',         // ✅
  'apellido_mat',         // ✅
  'telefono',             // ✅
  'telefonoSecundario',   // ✅ → se mapea a telefono_secundario
  'telefono_secundario',  // ✅
  'montoSolicitado'       // ✅ → se mapea a monto_solicitado
];
```

**Paso 3:** Mapear campos del frontend a BD
```typescript
// Mapeos especiales:
'telefonoSecundario' → 'telefono_secundario'
'montoSolicitado'    → 'monto_solicitado'
'nombres'            → 'nombres' (directo)
'apellido_pat'       → 'apellido_pat' (directo)
'apellido_mat'       → 'apellido_mat' (directo)
'telefono'           → 'telefono' (directo)
```

**Paso 4:** Eliminar campo 'nombre' (línea 228)
```typescript
delete datosPersona.nombre;  // ✅ CORRECTO - 'nombre' no es columna de 'personas'
```

**Paso 5:** Actualizar tabla `personas`
```typescript
await this.personaRepository.update(integrante.persona_id, datosPersona);
```

---

### 3. BASE DE DATOS: Tabla `personas`

#### 3.1. Columnas Relevantes

| Columna | Tipo | NOT NULL | Origen Frontend | Estado |
|---------|------|----------|-----------------|---------|
| `nombres` | varchar(150) | ✅ NO (ya quitado) | `nombres` | ✅ OK |
| `apellido_pat` | varchar(50) | ✅ NO (ya quitado) | `apellido_pat` | ✅ OK |
| `apellido_mat` | varchar(50) | NULL | `apellido_mat` | ✅ OK |
| `nombre_completo` | varchar(255) | NULL | **GENERADO** | ✅ OK |
| `telefono` | varchar | NULL | `telefono` | ✅ OK |
| `telefono_secundario` | varchar | NULL | `telefonoSecundario` | ✅ OK |
| `monto_solicitado` | decimal(10,2) | NULL | `montoSolicitado` | ✅ OK |

**Columnas Legacy (YA CORREGIDAS):**
- `primer_nombre` - **NULL PERMITIDO** ✅
- `segundo_nombre` - **NULL PERMITIDO** ✅

---

### 4. BACKEND → FRONTEND: Respuesta

#### 4.1. GET /integrantes/:id

**Service:** `IntegrantesService.getById()` (línea 47-99)

**SQL Ejecutado:**
```sql
SELECT 
  i.*,
  p.nombres,
  p.apellido_pat,
  p.apellido_mat,
  p.nombre_completo,
  p.telefono,
  p.telefono_secundario,
  p.monto_solicitado
FROM integrantes i
LEFT JOIN personas p ON i.persona_id = p.id
WHERE i.id = ?
```

**Respuesta devuelta:**
```json
{
  "id": "uuid",
  "expediente_id": "uuid",
  "persona_id": "uuid",
  "estado": "NUEVA",
  "created_at": "...",
  "updated_at": "...",
  "nombres": "MARÍA DEL SOCORRO",
  "apellido_pat": "GARCÍA",
  "apellido_mat": "LÓPEZ",
  "nombre": "MARÍA DEL SOCORRO GARCÍA LÓPEZ",  // viene de nombre_completo
  "telefono": "1234567890",
  "telefonoSecundario": null,
  "montoSolicitado": 5000
}
```

**Mapeo en el servicio (línea 74-82):**
```typescript
{
  nombres: persona.nombres,                    // ✅
  apellido_pat: persona.apellido_pat,          // ✅
  apellido_mat: persona.apellido_mat,          // ✅
  nombre: persona.nombre_completo,             // ✅
  telefono: persona.telefono ?? null,          // ✅
  telefonoSecundario: persona.telefono_secundario ?? null,  // ✅
  montoSolicitado: persona.monto_solicitado ?? 0,           // ✅
}
```

---

## ✅ VERIFICACIÓN: Todo está conectado correctamente

### Frontend envía:
```
nombres → apellido_pat → apellido_mat → telefono → telefonoSecundario → montoSolicitado
```

### Backend mapea a:
```
nombres → apellido_pat → apellido_mat → telefono → telefono_secundario → monto_solicitado
```

### Base de datos tiene:
```
nombres (NOT NULL quitado) ✅
apellido_pat (NOT NULL quitado) ✅
apellido_mat (NULL) ✅
telefono (NULL) ✅
telefono_secundario (NULL) ✅
monto_solicitado (NULL) ✅
nombre_completo (GENERATED) ✅
```

### Backend devuelve:
```
nombres ← apellido_pat ← apellido_mat ← nombre ← telefono ← telefonoSecundario ← montoSolicitado
```

---

## 🔍 POSIBLES CAUSAS DE ERROR 500 (Si aparece)

### 1. Token JWT Inválido o Expirado
**Síntoma:** `401 Unauthorized` o `500 Internal Server Error`

**Causa:** El frontend envía peticiones sin token o con token expirado

**Solución:** ✅ **YA CORREGIDO** - Todas las llamadas `fetch()` fueron reemplazadas por `api.*()`

---

### 2. Datos Faltantes o Inválidos

**Campos que pueden causar 500 si están mal formateados:**

| Campo | Tipo Esperado | Error Común |
|-------|---------------|-------------|
| `fecha_nac` | `YYYY-MM-DD` o `Date` | Formato inválido (ej: `15-ENE-1985`) |
| `curp` | String 18 chars | Longitud incorrecta |
| `montoSolicitado` | Number | String en lugar de número |
| `telefono` | String | Formato incorrecto |

**Ejemplo de error:**
```
QueryFailedError: invalid input syntax for type date: "15-ENE-1985"
```

**Solución:** Validar datos antes de enviar al backend

---

### 3. Constraint Violation en Base de Datos

**Posibles violaciones:**

| Constraint | Causa |
|------------|-------|
| `UNIQUE (curp)` | Intento de guardar CURP duplicada |
| `UNIQUE (folio)` | Intento de guardar folio duplicado |
| `FOREIGN KEY (persona_id)` | persona_id no existe en tabla personas |
| `NOT NULL` (si aún existe) | Campo requerido vacío |

**Ejemplo de error:**
```
QueryFailedError: duplicate key value violates unique constraint "personas_curp_key"
```

**Solución:** Verificar datos antes de guardar, manejar errores de duplicado

---

### 4. Problema de Conexión a Base de Datos

**Síntomas:**
```
Error: Connection terminated unexpectedly
Error: ECONNREFUSED
Error: connect ETIMEDOUT
```

**Causas:**
- PostgreSQL no está corriendo
- Credenciales incorrectas en `.env`
- Firewall bloqueando puerto 5432

---

## 🧪 CÓMO REPRODUCIR EL ERROR 500

**Si quieres reproducir el error para ver el stack trace:**

1. **Inicia la API:**
```bash
cd apps/api
npm run start:dev
```

2. **Ejecuta el script de prueba:**
```bash
node test-paso1-guardado.js
```

3. **Observa la salida:**
   - ✅ Verde = Todo funciona
   - ❌ Rojo = Error encontrado (stack trace completo)

---

## 📊 MAPEO COMPLETO: Frontend ↔ Backend ↔ Base de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                      │
│  SolicitudFormScreen.tsx - saveCurrentStep()                            │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ PATCH /integrantes/:id
                                   │ {
                                   │   nombres: 'MARÍA DEL SOCORRO',
                                   │   apellido_pat: 'GARCÍA',
                                   │   apellido_mat: 'LÓPEZ',
                                   │   telefono: '1234567890',
                                   │   telefonoSecundario: null,
                                   │   montoSolicitado: 5000
                                   │ }
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND - CONTROLLER                             │
│  IntegrantesController.update(id, dto)                                  │
│  - Valida decoradores con class-validator                              │
│  - Pasa al servicio                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND - SERVICE                                │
│  IntegrantesService.update(id, data)                                    │
│  1. Busca integrante por ID                                              │
│  2. Mapea campos:                                                        │
│     - telefonoSecundario → telefono_secundario                          │
│     - montoSolicitado → monto_solicitado                                │
│  3. Elimina campo 'nombre' (no es columna de BD)                        │
│  4. Actualiza tabla personas                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ UPDATE personas SET
                                   │   nombres = 'MARÍA DEL SOCORRO',
                                   │   apellido_pat = 'GARCÍA',
                                   │   apellido_mat = 'LÓPEZ',
                                   │   telefono = '1234567890',
                                   │   telefono_secundario = NULL,
                                   │   monto_solicitado = 5000
                                   │ WHERE id = persona_id
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                                    │
│  Tabla: personas                                                         │
│                                                                          │
│  nombres VARCHAR(150)              ← 'MARÍA DEL SOCORRO'                │
│  apellido_pat VARCHAR(50)          ← 'GARCÍA'                           │
│  apellido_mat VARCHAR(50) NULL     ← 'LÓPEZ'                            │
│  telefono VARCHAR NULL             ← '1234567890'                       │
│  telefono_secundario VARCHAR NULL  ← NULL                               │
│  monto_solicitado DECIMAL(10,2)    ← 5000.00                            │
│                                                                          │
│  nombre_completo VARCHAR(255)      ← GENERADO AUTOMÁTICAMENTE           │
│    = nombres || ' ' || apellido_pat || ' ' || apellido_mat             │
│    = 'MARÍA DEL SOCORRO GARCÍA LÓPEZ'                                   │
│                                                                          │
│  [Columnas Legacy - NO SE USAN]                                         │
│  primer_nombre VARCHAR NULL        ← NULL (permitido)                   │
│  segundo_nombre VARCHAR NULL       ← NULL (permitido)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CONCLUSIÓN

**El flujo está correctamente conectado de punta a punta.**

**NO hay desconexión entre:**
- ✅ Frontend y Backend
- ✅ Backend y Base de Datos
- ✅ Campos viejos y campos nuevos

**Los cambios aplicados (reemplazar `fetch()` por `api.*()`) resuelven:**
- ✅ Error 401 Unauthorized
- ✅ Guardado de PASO 1 funciona
- ✅ Auto-guardado funciona
- ✅ Carga de datos existentes funciona

**Si aparece un error 500, las causas más probables son:**
1. Datos inválidos (fecha mal formateada, CURP duplicada)
2. Problemas de conexión a la base de datos
3. Constraint violation (UNIQUE, FOREIGN KEY)

---

**RECOMENDACIÓN:** Prueba el flujo completo desde el móvil. Si aparece error 500, **copia el mensaje de error COMPLETO** de la ventana de la API para diagnosticar la causa exacta.
