# 🔍 DIAGNÓSTICO: DATOS NO APARECEN EN LA APP

## ❌ PROBLEMA REPORTADO

Después de hacer login exitoso con PIN 1234:
1. Los listados NO cargan (no aparecen datos)
2. NO se puede registrar un grupo nuevo

---

## 🔎 HALLAZGOS DE LA INVESTIGACIÓN

### ✅ Backend: CÓDIGO CORRECTO

Revisé todos los servicios críticos del backend y **están usando los campos correctos** del refactor:

#### 1. `grupos.service.ts` ✅
- Líneas 20-48: Método `create()` - Correcto, no usa campos de nombres
- Líneas 68-97: Método `listAll()` - Correcto, usa paginación y JOIN

#### 2. `integrantes.service.ts` ✅
- Líneas 16-51: Método `listByExpediente()` - USA CORRECTAMENTE:
  ```typescript
  const nombre = persona?.nombre_completo || '';  // ✅ Campo nuevo
  ```

#### 3. `expedientes.service.ts` ⚠️ POTENCIAL PROBLEMA
- Líneas 32-48: Método `getIntegrantes()` - Código SOSPECHOSO:
  ```typescript
  .leftJoinAndSelect('integrante.solicitud', 'solicitud')  // ← JOIN a solicitud
  ...
  nombre: int.solicitud?.nombre_completo || 'Sin nombre',  // ← Usa solicitud
  nombres: int.solicitud?.nombres,                         // ← Usa solicitud
  apellido_pat: int.solicitud?.apellido_pat,              // ← Usa solicitud
  ```

**PROBLEMA IDENTIFICADO:**
Este método está haciendo JOIN con `integrante.solicitud`, pero **los integrantes nuevos NO tienen solicitudes** todavía (solo tienen `persona_id`).

La relación correcta debería ser:
```typescript
.leftJoinAndSelect('integrante.persona', 'persona')  // ← Correcto
```

---

### ❌ Frontend: FALTA TOKEN DE AUTENTICACIÓN

#### Problema 1: `CreateGroupScreen.tsx` NO usa el cliente autenticado

**Archivo:** `apps/mobile/src/features/grupos/CreateGroupScreen.tsx`

**Código actual (líneas 26-33):**
```typescript
const response = await fetch(apiUrl('/grupos'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },  // ❌ FALTA Authorization
  body: JSON.stringify({
    name: name.trim(),
    createdBy: 'advisor',
  }),
});
```

**PROBLEMA:**
- Usa `fetch()` directamente sin el token JWT
- NO incluye el header `Authorization: Bearer <token>`
- El backend rechaza la petición con 401 Unauthorized

**SOLUCIÓN:**
Debe usar el cliente `api` que SÍ incluye autenticación:

```typescript
import { api } from '../../services/api-client';

// ...

const data = await api.post('/grupos', {
  name: name.trim(),
  createdBy: 'advisor',
});
```

---

#### Problema 2: Listados probablemente tienen el mismo problema

Necesito verificar cómo se están haciendo las peticiones de listado (grupos, integrantes, etc.).

---

## 🎯 CAUSA RAÍZ IDENTIFICADA

### CAUSA #1: FALTA TOKEN DE AUTENTICACIÓN EN PETICIONES

El frontend está usando `fetch()` directamente sin incluir el token JWT, por lo que el backend rechaza las peticiones con `401 Unauthorized`.

**Archivos afectados:**
- `CreateGroupScreen.tsx` - Confirmado
- Probablemente otros listados también

---

### CAUSA #2 (POTENCIAL): JOIN INCORRECTO EN EXPEDIENTES.SERVICE.TS

El método `getIntegrantes()` hace JOIN con `solicitud` en lugar de `persona`, lo que causa que no se muestren los datos de integrantes nuevos.

**Archivo:** `apps/api/src/expedientes/expedientes.service.ts`
**Líneas:** 32-48

---

## 📋 VERIFICACIÓN PENDIENTE

Antes de hacer cambios, necesito verificar:

1. **¿Qué errores EXACTOS aparecen en la ventana de la API cuando intentas:**
   - Cargar un listado
   - Crear un grupo nuevo

2. **¿Los listados están usando `fetch()` directo o el cliente `api`?**
   - Necesito revisar las pantallas de listado

3. **¿Hay errores de autenticación (401) en los logs?**
   - Esto confirmaría el problema del token

---

## 🔧 SOLUCIONES PROPUESTAS

### Solución 1: Usar el cliente `api` autenticado en todo el frontend

**Archivos a modificar:**

1. **`CreateGroupScreen.tsx`:**
   ```diff
   - import { apiUrl } from '../../config/api';
   + import { api } from '../../services/api-client';
   
   - const response = await fetch(apiUrl('/grupos'), {
   -   method: 'POST',
   -   headers: { 'Content-Type': 'application/json' },
   -   body: JSON.stringify({
   -     name: name.trim(),
   -     createdBy: 'advisor',
   -   }),
   - });
   + const data = await api.post('/grupos', {
   +   name: name.trim(),
   +   createdBy: 'advisor',
   + });
   ```

2. **Todos los demás archivos que usan `fetch()` directamente**
   - Necesito buscarlos y cambiarlos también

---

### Solución 2: Corregir el JOIN en `expedientes.service.ts`

**Archivo:** `apps/api/src/expedientes/expedientes.service.ts`

**Cambio (líneas 32-48):**

```diff
async getIntegrantes(expedienteId: string): Promise<any[]> {
  const integrantes = await this.integranteRepository
    .createQueryBuilder('integrante')
-   .leftJoinAndSelect('integrante.solicitud', 'solicitud')
+   .leftJoinAndSelect('integrante.persona', 'persona')
    .where('integrante.expediente_id = :expedienteId', { expedienteId })
    .getMany();

  return integrantes.map(int => ({
    id: int.id,
-   nombre: int.solicitud?.nombre_completo || 'Sin nombre',
-   nombres: int.solicitud?.nombres,
-   apellido_pat: int.solicitud?.apellido_pat,
-   telefono: int.solicitud?.dom_telefono,
-   monto_solicitado: int.solicitud?.monto_autorizado || 0,
+   nombre: int.persona?.nombre_completo || 'Sin nombre',
+   nombres: int.persona?.nombres,
+   apellido_pat: int.persona?.apellido_pat,
+   telefono: int.persona?.telefono,
+   monto_solicitado: int.persona?.monto_solicitado || 0,
    es_tesorera: false,
    ciclo: 1,
  }));
}
```

---

## ⏸️ ANTES DE HACER CAMBIOS

**POR FAVOR, RESPONDE:**

1. **Copia el ERROR EXACTO que aparece en la ventana de la API** cuando:
   - Intentas cargar un listado en la app
   - Intentas crear un grupo nuevo

2. **¿Ves errores 401 Unauthorized?**

3. **¿Ves algún otro error en rojo?**

Esto confirmará el diagnóstico antes de aplicar los cambios.

---

## 🚫 RECORDATORIO

**NO borres las columnas `primer_nombre` y `segundo_nombre` todavía.** Esperamos tu confirmación de que todo funciona correctamente.

---

**SIGUIENTE PASO:**
Reporta los errores exactos que aparecen en la ventana de la API.
