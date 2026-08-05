# ✅ CORRECCIONES APLICADAS - DATOS NO CARGABAN

## 🔍 PROBLEMAS IDENTIFICADOS Y CORREGIDOS

### ❌ PROBLEMA #1: FALTA TOKEN JWT EN PETICIONES DEL FRONTEND

**Causa raíz:**
El frontend estaba usando `fetch()` directamente sin incluir el header `Authorization: Bearer <token>`, por lo que el backend rechazaba las peticiones con **401 Unauthorized**.

**Error confirmado:**
```
Status: 401
Ok: false
Error: Failed to create group
```

---

### ❌ PROBLEMA #2: JOIN INCORRECTO EN `expedientes.service.ts`

**Causa raíz:**
El método `getIntegrantes()` hacía JOIN con `integrante.solicitud` en lugar de `integrante.persona`, causando que los integrantes nuevos (que solo tienen `persona_id`) no mostraran datos.

---

## 🔧 ARCHIVOS CORREGIDOS

### BACKEND (1 archivo)

#### 1. `apps/api/src/expedientes/expedientes.service.ts`

**ANTES (líneas 33-44):**
```typescript
.leftJoinAndSelect('integrante.solicitud', 'solicitud')  // ❌ Incorrecto
...
nombre: int.solicitud?.nombre_completo || 'Sin nombre',  // ❌ No funciona
nombres: int.solicitud?.nombres,                         // ❌ No funciona
apellido_pat: int.solicitud?.apellido_pat,              // ❌ No funciona
telefono: int.solicitud?.dom_telefono,                  // ❌ No funciona
```

**DESPUÉS:**
```typescript
.leftJoinAndSelect('integrante.persona', 'persona')  // ✅ Correcto
...
nombre: int.persona?.nombre_completo || 'Sin nombre',  // ✅ Usa persona
nombres: int.persona?.nombres,                         // ✅ Usa persona
apellido_pat: int.persona?.apellido_pat,              // ✅ Usa persona
telefono: int.persona?.telefono,                      // ✅ Campo correcto
```

---

### FRONTEND (3 archivos)

#### 2. `apps/mobile/src/features/grupos/CreateGroupScreen.tsx`

**ANTES (líneas 1-4, 26-40):**
```typescript
import { apiUrl } from '../../config/api';  // ❌ No incluye token
...
const response = await fetch(apiUrl('/grupos'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },  // ❌ FALTA Authorization
  body: JSON.stringify({ name: name.trim() }),
});

if (!response.ok) {
  throw new Error('Failed to create group');
}

const data = await response.json();
```

**DESPUÉS:**
```typescript
import { api } from '../../services/api-client';  // ✅ Incluye token automáticamente
...
const data = await api.post<any>('/grupos', {
  name: name.trim(),
  createdBy: 'advisor',
});
```

---

#### 3. `apps/mobile/src/features/expedientes/ExpedientesListScreen.tsx`

**ANTES (líneas 4, 69-75):**
```typescript
import { apiUrl } from '../../config/api';  // ❌ No incluye token
...
const response = await fetch(apiUrl('/grupos'));
if (!response.ok) {
  throw new Error('Failed to load expedientes');
}
const data = await response.json();
setExpedientes(data);
```

**DESPUÉS:**
```typescript
import { api } from '../../services/api-client';  // ✅ Incluye token
...
const data = await api.get<any>('/grupos');
setExpedientes(data.data || data);
```

---

#### 4. `apps/mobile/src/features/expedientes/ExpedienteDetailScreen.tsx`

**ANTES (líneas 4, 68-83, 98-109):**
```typescript
import { apiUrl } from '../../config/api';  // ❌ No incluye token
...
// 4 llamadas fetch() sin token:
const response = await fetch(apiUrl(`/expedientes/${expedienteId}`));
const grupoResponse = await fetch(apiUrl(`/grupos/${data.grupo_id}`));
const response = await fetch(apiUrl(`/integrantes/expediente/${expedienteId}`));
const solicitudResponse = await fetch(apiUrl(`/solicitudes/integrante/${integrante.id}`));
```

**DESPUÉS:**
```typescript
import { api } from '../../services/api-client';  // ✅ Incluye token
...
// Todas usan el cliente autenticado:
const data = await api.get<any>(`/expedientes/${expedienteId}`);
const grupoData = await api.get<any>(`/grupos/${data.grupo_id}`);
const data = await api.get<any>(`/integrantes/expediente/${expedienteId}`);
solicitud = await api.get<any>(`/solicitudes/integrante/${integrante.id}`);
```

---

## ✅ RESULTADO ESPERADO

Después de estas correcciones:

1. ✅ **Login funciona** con PIN 1234
2. ✅ **Los listados cargan** porque ahora incluyen el token JWT
3. ✅ **Puedes crear grupos nuevos** porque la petición está autenticada
4. ✅ **Los datos de integrantes se muestran** porque usa `persona` en lugar de `solicitud`

---

## 🧪 CÓMO PROBAR

### PASO 1: Reiniciar la app móvil

En la ventana cyan de Expo, presiona:
```
r  →  reload app
```

O cierra y vuelve a abrir la app en tu celular.

---

### PASO 2: Probar crear un grupo

1. Entra con: `admin@crelealtad.com` / `1234`
2. Navega a "Crear Grupo"
3. Ingresa un nombre (ej: "GRUPO DE PRUEBA")
4. Presiona "Crear grupo"

**Resultado esperado:**
✅ Debe aparecer "Grupo Creado" sin error 401

---

### PASO 3: Probar listados

1. Navega a la pantalla de listado de grupos/expedientes
2. Verifica que aparezcan datos

**Resultado esperado:**
✅ Deben aparecer los grupos/expedientes sin error 401

---

### PASO 4: Probar refactor de nombres

Una vez que confirmes que los listados funcionan:

1. Registra una persona nueva con nombre compuesto (ej: "María del Socorro")
2. Verifica que se guarde correctamente
3. Verifica que se muestre correctamente en los listados

Sigue las instrucciones en:
```
REFACTOR_NOMBRES_COMPLETADO.md
```

---

## ⚠️ SI TODAVÍA HAY PROBLEMAS

1. **Reinicia AMBOS servicios:**
   - Cierra las dos ventanas de PowerShell (API y Expo)
   - Ejecuta: `REINICIAR_TODO.bat`

2. **Verifica los logs de la API:**
   - En la ventana verde de la API
   - Busca errores en rojo
   - Copia y reporta cualquier error

3. **Verifica los logs del móvil:**
   - En la ventana cyan de Expo
   - Busca errores en rojo
   - Copia y reporta cualquier error

---

## 📋 ARCHIVOS PENDIENTES

**NO corregidos todavía** (tienen `fetch()` directo pero no son críticos ahora):
- `DocumentosScreen.tsx`
- `DocumentosScreenV2.tsx`
- `VerificacionSelectionScreen.tsx`

Estos se pueden corregir después si es necesario.

---

## 🚫 RECORDATORIO IMPORTANTE

**NO borres las columnas `primer_nombre` y `segundo_nombre` de la base de datos todavía.**

Espera a confirmar que:
1. Los listados cargan correctamente
2. Puedes crear grupos
3. Puedes registrar personas con nombres compuestos
4. Los datos se muestran correctamente

---

**SIGUIENTE PASO:**
Reinicia la app móvil (presiona `r` en Expo) y prueba crear un grupo nuevo.
