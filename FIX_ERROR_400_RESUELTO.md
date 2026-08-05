# ✅ ERROR 400 RESUELTO - CREAR GRUPO

## ❌ PROBLEMA ORIGINAL

Al intentar crear un grupo, el backend respondía con:

```json
{
  "message": [
    "property name should not exist",
    "property createdBy should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🔍 CAUSA RAÍZ

El backend tiene un **ValidationPipe global** con la opción `forbidNonWhitelisted: true`.

Esto significa que **rechaza cualquier propiedad del body que NO tenga decoradores de validación** en el DTO.

**Ubicación probable del ValidationPipe:**
- `apps/api/src/main.ts` - Configuración global

**Ejemplo de configuración que causa esto:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Elimina propiedades no decoradas
  forbidNonWhitelisted: true, // ← RECHAZA si hay propiedades no decoradas
  transform: true,
}));
```

---

## 🔧 SOLUCIÓN APLICADA

**Archivo:** `apps/api/src/grupos/grupos.controller.ts`

**ANTES:**
```typescript
export class CreateGrupoDto {
  name: string;              // ❌ Sin decoradores
  advisorName?: string;      // ❌ Sin decoradores
  createdBy?: string;        // ❌ Sin decoradores
}
```

**DESPUÉS:**
```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateGrupoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;              // ✅ Con decoradores

  @IsOptional()
  @IsString()
  advisorName?: string;      // ✅ Con decoradores

  @IsOptional()
  @IsString()
  createdBy?: string;        // ✅ Con decoradores
}
```

---

## ✅ RESULTADO

Ahora el ValidationPipe acepta las propiedades porque tienen decoradores:

- ✅ `name` es validado como string con longitud mínima 1
- ✅ `advisorName` es opcional y string
- ✅ `createdBy` es opcional y string

---

## 📋 VALIDACIONES AGREGADAS

| Campo | Validación |
|-------|------------|
| `name` | Required, String, MinLength: 1, MaxLength: 255 |
| `advisorName` | Optional, String |
| `createdBy` | Optional, String |

---

## 🧪 CÓMO PROBAR

1. **Reinicia la app móvil:**
   ```
   En Expo: presiona 'r'
   ```

2. **Intenta crear un grupo:**
   - Email: `admin@crelealtad.com`
   - PIN: `1234`
   - Nombre: "GRUPO PRUEBA"
   - Presiona "Crear grupo"

**Resultado esperado:**
✅ Debe aparecer "Grupo Creado" sin error 400

---

## 🎯 PRÓXIMOS PASOS

Una vez que confirmes que crear grupos funciona:

1. **Verificar listados** - Deben cargar los grupos correctamente
2. **Probar refactor de nombres** - Registrar persona con nombre compuesto
3. **Confirmar que todo funciona** antes de eliminar columnas legacy

---

## 📝 ARCHIVOS MODIFICADOS EN ESTA SESIÓN

### Backend (2 archivos)
1. ✅ `apps/api/src/expedientes/expedientes.service.ts`
   - JOIN corregido: `integrante.solicitud` → `integrante.persona`

2. ✅ `apps/api/src/grupos/grupos.controller.ts`
   - Decoradores de validación agregados al DTO

### Frontend (3 archivos)
3. ✅ `apps/mobile/src/features/grupos/CreateGroupScreen.tsx`
   - Usa `api.post()` en lugar de `fetch()`

4. ✅ `apps/mobile/src/features/expedientes/ExpedientesListScreen.tsx`
   - Usa `api.get()` en lugar de `fetch()`

5. ✅ `apps/mobile/src/features/expedientes/ExpedienteDetailScreen.tsx`
   - 4 llamadas cambiadas a `api.get()`

---

## 🚫 RECORDATORIO

**NO borres las columnas `primer_nombre` y `segundo_nombre`** hasta confirmar que:
1. ✅ Crear grupos funciona
2. ✅ Listados cargan correctamente
3. ✅ Puedes registrar personas con nombres compuestos
4. ✅ Los datos se muestran correctamente

---

**¡Listo para probar!** 🚀
