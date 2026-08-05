# 🔍 DIAGNÓSTICO FINAL - DATOS NO CARGAN

## 📋 ESTADO ACTUAL

### ✅ LO QUE FUNCIONA:
1. Login con PIN 1234 ✅
2. Autenticación JWT (ya no hay error 401) ✅
3. Validación del DTO (error 400 resuelto) ✅
4. API corriendo en puerto 3100 ✅

### ❌ LO QUE NO FUNCIONA:
1. Los listados NO cargan
2. NO se puede crear un grupo

---

## 🔧 CORRECCIONES APLICADAS HASTA AHORA

### Backend (2 archivos):
1. ✅ `apps/api/src/expedientes/expedientes.service.ts`
   - JOIN corregido: `integrante.solicitud` → `integrante.persona`
   - Usa campos nuevos: `persona.nombres`, `persona.nombre_completo`

2. ✅ `apps/api/src/grupos/grupos.controller.ts`
   - Decoradores de validación agregados al DTO

### Frontend (3 archivos):
3. ✅ `apps/mobile/src/features/grupos/CreateGroupScreen.tsx`
   - Cambiado de `fetch()` a `api.post()` con token

4. ✅ `apps/mobile/src/features/expedientes/ExpedientesListScreen.tsx`
   - Cambiado de `fetch()` a `api.get()` con token

5. ✅ `apps/mobile/src/features/expedientes/ExpedienteDetailScreen.tsx`
   - Cambiadas 4 llamadas a `api.get()` con token

---

## 🎯 SIGUIENTE PASO: MONITOREO DE LOGS

### INSTRUCCIONES PARA EL USUARIO:

**Por favor, haz lo siguiente:**

1. **Abre AMBAS ventanas de PowerShell:**
   - Verde = API
   - Cyan = Expo

2. **Reinicia la app móvil:**
   - En la ventana de Expo, presiona: `r`

3. **Entra a la app:**
   - Email: `admin@crelealtad.com`
   - PIN: `1234`

4. **Intenta VER EL LISTADO de grupos/expedientes**

5. **OBSERVA LA VENTANA VERDE de la API:**
   - ¿Ves una petición GET a `/grupos`?
   - ¿Hay algún error en rojo?
   - **Copia TODO lo que aparezca**

6. **Intenta CREAR UN GRUPO:**
   - Ve a "Crear Grupo"
   - Ingresa: "GRUPO PRUEBA"
   - Presiona "Crear grupo"

7. **OBSERVA LA VENTANA VERDE de la API:**
   - ¿Ves una petición POST a `/grupos`?
   - ¿Hay algún error en rojo?
   - **Copia TODO lo que aparezca**

8. **OBSERVA LA VENTANA CYAN de Expo:**
   - ¿Hay errores con `❌`?
   - **Copia los logs con `❌`**

---

## 🔍 QUÉ BUSCAR EN LOS LOGS

### En la ventana de la API (verde):

**CASO 1: No aparece NINGUNA petición**
→ Significa que el móvil NO está llegando a la API
→ Problema de red/conexión

**CASO 2: Aparece la petición pero con error 401**
→ El token JWT no se está enviando correctamente

**CASO 3: Aparece la petición pero con error 400**
→ Problema de validación (otro DTO sin decoradores)

**CASO 4: Aparece la petición pero con error 500**
→ Error interno del servidor (probablemente en el servicio)

**CASO 5: Aparece la petición con status 200 pero no hay datos**
→ La consulta SQL está retornando vacío

---

### En la ventana de Expo (cyan):

**Buscar líneas como:**
```
❌ Error completo: ...
❌ Error message: ...
❌ Error status: ...
❌ Error data: ...
```

---

## 🧪 PRUEBAS ALTERNATIVAS

Si no ves NADA en los logs de la API, prueba esto:

### Test 1: Verificar endpoint directamente

**En una terminal nueva:**
```bash
curl http://localhost:3100/grupos
```

**Resultado esperado:**
- Si funciona: Verás un JSON con datos
- Si da error: Verás el error exacto

---

### Test 2: Verificar con token real

**Primero, obtén el token:**
1. Entra a la app
2. En la ventana de Expo, busca el token en los logs

**Luego prueba:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3100/grupos
```

---

## 📝 INFORMACIÓN NECESARIA

**Por favor, reporta:**

1. **¿Qué aparece en la ventana VERDE de la API cuando:**
   - Intentas ver el listado
   - Intentas crear un grupo

2. **¿Qué aparece en la ventana CYAN de Expo con `❌`?**

3. **¿Qué aparece si ejecutas `curl http://localhost:3100/grupos`?**

---

## 🚨 POSIBLES CAUSAS RESTANTES

### Causa #1: Frontend no está usando los archivos corregidos
**Síntoma:** Todavía usa `fetch()` en lugar de `api`
**Verificación:** Buscar en logs si hay `🔵 apiUrl generada`

### Causa #2: La API no se reinició con los cambios
**Síntoma:** Los cambios no se aplicaron
**Verificación:** Ver si el código tiene los decoradores

### Causa #3: Error en otro DTO sin decoradores
**Síntoma:** Error 400 en otros endpoints
**Verificación:** Ver el mensaje de error del backend

### Causa #4: Tabla vacía
**Síntoma:** Status 200 pero sin datos
**Verificación:** Query directa a la base de datos

### Causa #5: Problema de red
**Síntoma:** No llegan peticiones a la API
**Verificación:** Curl directo funciona pero la app no

---

## 🎯 PLAN DE ACCIÓN

Dependiendo de lo que reportes:

### Si NO llegan peticiones a la API:
→ Problema de red/configuración IP
→ Verificar `apps/mobile/.env`

### Si llegan con error 401:
→ Token no se envía correctamente
→ Revisar cliente `api`

### Si llegan con error 400:
→ Otro DTO sin decoradores
→ Agregar decoradores al DTO

### Si llegan con error 500:
→ Error en el servicio/base de datos
→ Revisar el stack trace completo

### Si llegan con status 200 pero sin datos:
→ Consulta SQL retorna vacío
→ Verificar datos en la base de datos

---

**Esperando los logs de la API y Expo...** 🔍
