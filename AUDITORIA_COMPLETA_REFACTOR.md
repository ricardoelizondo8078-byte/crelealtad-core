# 🔍 AUDITORÍA COMPLETA - REFACTOR DE NOMBRES

## 📊 RESUMEN EJECUTIVO

**Estado:** El refactor de nombres está **85% completo** pero tiene **problemas críticos de autenticación** en el frontend.

**Problema principal:** Varios formularios siguen usando `fetch()` directo sin el token JWT, causando errores 401/400.

**Campos legacy encontrados:** Solo en archivos de backup y migrations (no en código activo).

---

## ✅ LO QUE FUNCIONA CORRECTAMENTE

### Backend:
1. ✅ Entidades usan los campos nuevos:
   - `PersonaEntity`: `nombres`, `nombre_completo`
   - `SolicitudEntity`: `nombres`, `apellido_pat`, `apellido_mat`, `nombre_completo`
   - `IntegranteEntity`: Relación con `persona`

2. ✅ Servicios principales actualizados:
   - `IntegrantesService.listByExpediente()` - Usa `persona.nombre_completo`
   - `IntegrantesService.getById()` - Usa `persona.nombres`
   - `IntegrantesService.createForExpediente()` - Usa `nombres`

3. ✅ Vista `solicitudes_completo` tiene ambos campos (legacy + nuevos)

### Frontend:
4. ✅ Pantallas que YA usan campos nuevos:
   - `IntegranteVerificacionScreen.tsx` - Usa `nombres`, `apellido_pat`, `nombre_completo`
   - `SolicitudFormScreen.tsx` - Usa `nombres` (corregido anteriormente)

5. ✅ Tipos/interfaces actualizados:
   - `solicitud.types.ts` - Interface con `nombres`
   - `solicitudService.ts` - Mapeo correcto

---

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 🚨 PROBLEMA #1: FRONTEND USA `fetch()` SIN TOKEN (CRÍTICO)

**Archivos afectados:**

#### 1. `apps/mobile/src/features/integrantes/IntegranteFormScreen.tsx`
**Líneas 127-139:**
```typescript
const response = await fetch(apiUrl('/integrantes'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },  // ❌ FALTA Authorization
  body: JSON.stringify({
    expedienteId,
    nombre: fullName,
    nombres: nombres.trim(),
    apellidoPaterno: apellidoPaterno.trim(),
    apellidoMaterno: apellidoMaterno.trim(),
    telefono: normalizePhone(telefono),
    montoSolicitado: Number(montoSolicitado),
  }),
});
```

**Impacto:** ❌ **BLOQUEA CREAR INTEGRANTE** (error 401)
**Prioridad:** 🔴 **CRÍTICA**

---

#### 2. `apps/mobile/src/features/documentos/DocumentosScreen.tsx`
**Múltiples `fetch()` sin token:**
- Línea ~XX: `fetch(apiUrl(\`/solicitudes/integrante/\${integranteId}\`))`
- Línea ~XX: `fetch(apiUrl(\`/integrantes/\${integranteId}\`))`
- Línea ~XX: `fetch(apiUrl(\`/expedientes/\${data.expedienteId}\`))`
- Línea ~XX: `fetch(apiUrl(\`/grupos/\${expData.groupId}\`))`

**Impacto:** ❌ **BLOQUEA PANTALLA DE DOCUMENTOS**
**Prioridad:** 🔴 **CRÍTICA**

---

#### 3. `apps/mobile/src/features/documentos/DocumentosScreenV2.tsx`
**Mismos problemas que DocumentosScreen.tsx**

**Impacto:** ❌ **BLOQUEA PANTALLA DE DOCUMENTOS V2**
**Prioridad:** 🔴 **CRÍTICA**

---

#### 4. `apps/mobile/src/features/expedientes/VerificacionSelectionScreen.tsx`
**Línea ~XX:**
```typescript
const response = await fetch(apiUrl(`/expedientes/${expedienteId}/send-to-verification`), {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  // ❌ FALTA Authorization
});
```

**Impacto:** ❌ **BLOQUEA ENVÍO A VERIFICACIÓN**
**Prioridad:** 🟠 **ALTA**

---

### 🚨 PROBLEMA #2: DTOs SIN DECORADORES (CRÍTICO - PARCIALMENTE RESUELTO)

**Ya corregidos:**
- ✅ `CreateGrupoDto`
- ✅ `CreateIntegranteDto`
- ✅ `UpdateEstadoDto`
- ✅ `UpdateIntegranteDto`

**Posiblemente faltantes** (pendiente verificar):
- ⚠️ Otros DTOs en solicitudes, expedientes, etc.

---

### 🚨 PROBLEMA #3: JOIN INCORRECTO EN EXPEDIENTES (RESUELTO)

✅ **YA CORREGIDO:**
- `ExpedientesService.getIntegrantes()` ahora usa `integrante.persona` ✅

---

## 🔍 ANÁLISIS DE FLUJO DE DATOS

### FLUJO: AGREGAR INTEGRANTE

#### Frontend → Backend:

1. **Pantalla:** `IntegranteFormScreen.tsx`
   - Estado: `nombres`, `apellidoPaterno`, `apellidoMaterno`
   - Envía:
     ```json
     {
       "expedienteId": "uuid",
       "nombre": "NOMBRE COMPLETO",
       "nombres": "NOMBRES",
       "apellidoPaterno": "APELLIDO_PAT",
       "apellidoMaterno": "APELLIDO_MAT",
       "telefono": "1234567890",
       "montoSolicitado": 5000
     }
     ```

2. **Cliente HTTP:**
   - ❌ USA `fetch(apiUrl())` SIN TOKEN
   - DEBE USAR: `api.post()` CON TOKEN

3. **Endpoint:** `POST /integrantes`
   - Controller: `IntegrantesController.create()`
   - DTO: `CreateIntegranteDto` ✅ (ya tiene decoradores)

4. **Servicio:** `IntegrantesService.createForExpediente()`
   - Líneas 122-135:
   ```typescript
   const nombres = dto.nombres?.trim().toUpperCase() || '';
   const apellido_pat = dto.apellidoPaterno?.trim().toUpperCase() ?? '';
   const apellido_mat = dto.apellidoMaterno?.trim().toUpperCase() ?? '';

   const personaGuardada = await this.personaRepository.save({
     nombres: nombres,
     apellido_pat: apellido_pat,
     apellido_mat: apellido_mat,
     telefono: dto.telefono ?? null,
     monto_solicitado: dto.montoSolicitado ?? null,
   });
   ```
   - ✅ Usa campos nuevos correctamente

5. **Entidad:** `PersonaEntity`
   - ✅ Tiene `nombres`, `apellido_pat`, `apellido_mat`
   - ✅ Tiene `nombre_completo` (generado)

6. **Base de datos:**
   - ✅ Columna `nombres` existe
   - ✅ Columna `nombre_completo` generada existe
   - ⚠️ Columnas legacy `primer_nombre`, `segundo_nombre` todavía existen

---

## 📋 LISTA COMPLETA DE ARCHIVOS DESALINEADOS

### 🔴 PRIORIDAD CRÍTICA (BLOQUEAN FUNCIONALIDAD)

1. **`apps/mobile/src/features/integrantes/IntegranteFormScreen.tsx`**
   - Problema: Usa `fetch()` sin token
   - Impacto: No se pueden agregar integrantes
   - Corrección: Cambiar a `api.post()`

2. **`apps/mobile/src/features/documentos/DocumentosScreen.tsx`**
   - Problema: Múltiples `fetch()` sin token
   - Impacto: Pantalla de documentos no carga
   - Corrección: Cambiar todos a `api.get()`

3. **`apps/mobile/src/features/documentos/DocumentosScreenV2.tsx`**
   - Problema: Múltiples `fetch()` sin token
   - Impacto: Pantalla de documentos V2 no carga
   - Corrección: Cambiar todos a `api.get()`

---

### 🟠 PRIORIDAD ALTA (AFECTAN FLUJO PRINCIPAL)

4. **`apps/mobile/src/features/expedientes/VerificacionSelectionScreen.tsx`**
   - Problema: `fetch()` sin token en envío a verificación
   - Impacto: No se puede enviar expediente a verificación
   - Corrección: Cambiar a `api.patch()`

5. **`apps/mobile/src/features/solicitantes` (si existe)**
   - Problema: Posible uso de `fetch()` sin token
   - Impacto: Pantallas de solicitantes pueden fallar
   - Corrección: Auditar y cambiar a `api.*`

---

### 🟡 PRIORIDAD MEDIA (MEJORAS DE CONSISTENCIA)

6. **Archivos de migración y backup**
   - `apps/api/src/migrations/*.sql` - Contienen `primer_nombre`/`segundo_nombre`
   - `apps/api/*.js` - Scripts de verificación viejos
   - Acción: Mantener para referencia histórica, no afectan código activo

---

## 🎯 PLAN DE CORRECCIÓN

### FASE 1: Corregir autenticación en formularios (CRÍTICO)

**Orden de corrección:**

1. ✅ `IntegranteFormScreen.tsx` - **PRIMERO** (bloquea crear integrante)
2. ✅ `DocumentosScreen.tsx` - **SEGUNDO** (pantalla importante)
3. ✅ `DocumentosScreenV2.tsx` - **TERCERO** (pantalla importante)
4. ✅ `VerificacionSelectionScreen.tsx` - **CUARTO** (flujo verificación)

---

### FASE 2: Auditar otros endpoints

5. ✅ Buscar TODOS los `fetch(apiUrl` en el proyecto
6. ✅ Verificar que TODOS usen `api.*` con token
7. ✅ Corregir cualquier otro que use `fetch()` directo

---

### FASE 3: Verificar DTOs

8. ✅ Buscar todos los `class.*Dto` en el backend
9. ✅ Verificar que TODOS tengan decoradores de `class-validator`
10. ✅ Agregar decoradores a los que falten

---

## ✅ LISTA DE VERIFICACIÓN POST-CORRECCIÓN

### Funcionalidades a probar:

#### Autenticación:
- [ ] Login con PIN 1234
- [ ] Token JWT se guarda correctamente
- [ ] Token se envía en todas las peticiones

#### Grupos:
- [ ] Crear grupo nuevo
- [ ] Ver listado de grupos
- [ ] Abrir detalle de grupo

#### Expedientes:
- [ ] Ver listado de expedientes
- [ ] Abrir detalle de expediente
- [ ] Ver integrantes del expediente

#### Integrantes/Personas:
- [ ] **Agregar integrante con nombre compuesto** (ej: "María del Socorro García López")
- [ ] Ver listado de integrantes
- [ ] Editar integrante
- [ ] Verificar que `nombres` se guarda correctamente
- [ ] Verificar que `nombre_completo` se genera correctamente

#### Solicitudes:
- [ ] Capturar solicitud completa
- [ ] Ver datos de solicitud
- [ ] Editar solicitud

#### Documentos:
- [ ] Abrir pantalla de documentos
- [ ] Ver documentos del integrante
- [ ] Subir documento (si aplica)

#### Verificación:
- [ ] Enviar expediente a verificación
- [ ] Ver pantalla de verificación
- [ ] Completar verificación

---

## 🔍 VERIFICACIÓN EN BASE DE DATOS

Después de agregar un integrante con nombre compuesto, verificar:

```sql
SELECT
  id,
  nombres,
  apellido_pat,
  apellido_mat,
  nombre_completo
FROM personas
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
```
| nombres              | apellido_pat | apellido_mat | nombre_completo                      |
|----------------------|--------------|--------------|--------------------------------------|
| MARÍA DEL SOCORRO    | GARCÍA       | LÓPEZ        | MARÍA DEL SOCORRO GARCÍA LÓPEZ       |
```

---

## 📊 ESTADÍSTICAS DEL REFACTOR

### Archivos totales revisados: ~30

### Archivos con código activo que usan campos nuevos: ✅ 15
- Entidades: 3
- Servicios: 5
- Controladores: 3
- Pantallas frontend: 4

### Archivos con código activo que usan `fetch()` sin token: ❌ 7
- IntegranteFormScreen.tsx
- DocumentosScreen.tsx
- DocumentosScreenV2.tsx
- VerificacionSelectionScreen.tsx
- (Posiblemente 3 más por descubrir)

### Archivos de backup/migrations con campos legacy: 📦 13
- Migrations SQL: 5
- Scripts verificación: 5
- Backups entidades: 3

---

## 🚫 RECORDATORIO CRÍTICO

**NO ELIMINAR COLUMNAS LEGACY HASTA:**

1. ✅ Corregir TODOS los `fetch()` sin token
2. ✅ Probar TODAS las funcionalidades de la lista
3. ✅ Verificar en base de datos que `nombres` y `nombre_completo` funcionan
4. ✅ Confirmar que NO hay errores 401/400
5. ✅ Usuario confirma que TODO funciona correctamente

**SOLO ENTONCES:** Ejecutar migraciones para eliminar `primer_nombre` y `segundo_nombre`.

---

## 🎯 SIGUIENTE PASO

**AHORA VOY A CORREGIR TODOS LOS ARCHIVOS EN EL ORDEN DE PRIORIDAD.**

Espera la confirmación de que las correcciones están completas.
