# 🔍 TROUBLESHOOTING: ERROR 400 AL CREAR GRUPO

## ✅ PROGRESO

1. ✅ **401 resuelto** - La autenticación funciona (ya no es 401 Unauthorized)
2. ❌ **400 Bad Request** - Hay un error de validación o de datos

---

## 🔎 QUÉ SIGNIFICA HTTP 400

**400 Bad Request** significa que el backend recibió la petición pero rechazó los datos por alguna de estas razones:

1. **Validación de class-validator** - Algún campo no cumple las reglas
2. **Restricción de base de datos** - Violación de NOT NULL, UNIQUE, CHECK, etc.
3. **Error de lógica de negocio** - El servicio rechazó los datos

---

## 📋 NECESITO VER EL ERROR EXACTO

**POR FAVOR, HAZ ESTO:**

1. **Abre la ventana de PowerShell de la API** (la verde que dice "API - MODO DESARROLLO")

2. **Intenta crear un grupo de nuevo** en la app móvil

3. **Copia TODO el mensaje en rojo** que aparece en la ventana de la API

4. **Pégamelo aquí**

El error va a verse algo así:

```
[Nest] 12345  - 04/08/2026, 1:30:00 PM   ERROR [ExceptionsHandler] ...
Error: ...
    at ...
```

---

## 🔧 MEJORAS APLICADAS

He mejorado el manejo de errores en el frontend para que muestre más detalles:

**Archivo modificado:**
- `apps/mobile/src/features/grupos/CreateGroupScreen.tsx`

**Cambios:**
- Ahora muestra el mensaje de error completo del backend
- Muestra detalles en la consola de Expo

---

## 🧪 PRUEBA OTRA VEZ

1. **Reinicia la app móvil:**
   - En la ventana cyan de Expo, presiona: `r`

2. **Intenta crear un grupo:**
   - Entra con: `admin@crelealtad.com` / `1234`
   - Ve a "Crear Grupo"
   - Ingresa un nombre (ej: "GRUPO PRUEBA")
   - Presiona "Crear grupo"

3. **Revisa AMBAS ventanas:**
   - **Ventana de la API** (verde) → Copia el error en rojo
   - **Ventana de Expo** (cyan) → Busca logs que digan `❌ Error`

---

## 🤔 POSIBLES CAUSAS DEL ERROR 400

### Causa #1: Validación de class-validator

Si el backend tiene validaciones activadas globalmente, puede estar rechazando el DTO.

**Solución:** Agregar decoradores de validación al DTO o desactivar la validación global.

---

### Causa #2: Campo requerido faltante

La entidad `GrupoEntity` tiene estos campos NOT NULL:
- `nombre` ✅ (lo estamos enviando)
- `fecha_inicio` ✅ (el servicio lo setea)
- `estado` ✅ (el servicio lo setea con default)

**Posible problema:** Algún otro campo que no veo o una restricción de base de datos.

---

### Causa #3: Error al crear el expediente

El servicio intenta crear un expediente automáticamente después del grupo:

```typescript
const expediente = this.expedienteRepository.create({
  grupo_id: entity.id,
  estado: 'EN_DOCUMENTACION',
  asesora_id: null,
  producto_id: null,
} as any);
```

**Posible problema:** La tabla `expedientes` puede tener campos NOT NULL que faltan.

---

## 🎯 SIGUIENTE PASO

**Copia el error de la ventana de la API** y pégamelo para que pueda ver exactamente qué está fallando.

---

## 📝 INFORMACIÓN DEL SISTEMA

**Entorno:**
- NODE_ENV: development
- Bypass PIN 1234: Activo ✅
- Token JWT: Funcionando ✅ (ya no es 401)

**Archivos relevantes:**
- `apps/api/src/grupos/grupos.controller.ts` - Controlador
- `apps/api/src/grupos/grupos.service.ts` - Servicio
- `apps/api/src/grupos/grupo.entity.ts` - Entidad
- `apps/mobile/src/features/grupos/CreateGroupScreen.tsx` - Frontend

---

**Esperando el error del backend para continuar...** 🔍
