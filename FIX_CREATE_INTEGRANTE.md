# ✅ FIX: ERROR AL CREAR INTEGRANTE

## ❌ PROBLEMA

Al intentar crear un integrante/persona, aparece el error:
```
FAILED TO CREATE INTEGRANTE
```

---

## 🔍 CAUSA RAÍZ

**MISMO PROBLEMA QUE CON CREAR GRUPO:**

El `CreateIntegranteDto` NO tenía decoradores de validación, y el `ValidationPipe` global con `forbidNonWhitelisted: true` rechaza las propiedades sin decoradores.

---

## 🔧 SOLUCIÓN APLICADA

**Archivo:** `apps/api/src/integrantes/integrantes.controller.ts`

**ANTES:**
```typescript
class CreateIntegranteDto {
  expedienteId?: string;        // ❌ Sin decoradores
  expediente_id?: string;       // ❌ Sin decoradores
  nombre?: string;              // ❌ Sin decoradores
  nombres?: string;             // ❌ Sin decoradores
  // ... etc
}
```

**DESPUÉS:**
```typescript
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

class CreateIntegranteDto {
  @IsOptional()
  @IsString()
  expedienteId?: string;        // ✅ Con decoradores

  @IsOptional()
  @IsString()
  expediente_id?: string;       // ✅ Con decoradores

  @IsOptional()
  @IsString()
  nombre?: string;              // ✅ Con decoradores

  @IsOptional()
  @IsString()
  nombres?: string;             // ✅ Con decoradores

  @IsOptional()
  @IsString()
  apellidoPaterno?: string;     // ✅ Con decoradores

  @IsOptional()
  @IsString()
  apellidoMaterno?: string;     // ✅ Con decoradores

  @IsOptional()
  @IsString()
  telefono?: string;            // ✅ Con decoradores

  @IsOptional()
  @IsNumber()
  montoSolicitado?: number;     // ✅ Con decoradores

  @IsOptional()
  @IsUUID()
  persona_id?: string;          // ✅ Con decoradores
}
```

---

**También corregí:**

```typescript
class UpdateEstadoDto {
  @IsEnum(IntegranteEstado)    // ✅ Validación de enum
  estado: IntegranteEstado;
}

class UpdateIntegranteDto {
  @IsOptional()
  @IsUUID()
  persona_id?: string;

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellido_pat?: string;

  @IsOptional()
  @IsString()
  apellido_mat?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  telefonoSecundario?: string;

  @IsOptional()
  @IsNumber()
  montoSolicitado?: number;
}
```

---

## ✅ RESULTADO

Ahora el ValidationPipe acepta todas las propiedades porque tienen decoradores.

---

## 🧪 CÓMO PROBAR

1. **La API debería reiniciarse automáticamente** (modo watch activo)

2. **Reinicia la app móvil:**
   - En Expo: presiona `r`

3. **Entra a la app:**
   - Email: `admin@crelealtad.com`
   - PIN: `1234`

4. **Intenta crear un integrante/persona:**
   - Ve a un grupo/expediente
   - Presiona "Agregar integrante"
   - Llena los datos:
     - Nombres: "MARÍA DEL SOCORRO"
     - Apellido Paterno: "GARCÍA"
     - Apellido Materno: "LÓPEZ"
     - Teléfono: "1234567890"
     - Monto: "5000"
   - Presiona "Guardar"

**Resultado esperado:**
✅ Debe guardarse sin error "FAILED TO CREATE INTEGRANTE"

---

## 📋 TODOS LOS DTOs CORREGIDOS HASTA AHORA

1. ✅ `CreateGrupoDto` - Decoradores agregados
2. ✅ `CreateIntegranteDto` - Decoradores agregados
3. ✅ `UpdateEstadoDto` - Decoradores agregados
4. ✅ `UpdateIntegranteDto` - Decoradores agregados

---

## 🚨 PENDIENTE: VERIFICAR OTROS DTOs

Si encuentras más errores 400 en otros endpoints, probablemente sean otros DTOs sin decoradores.

**Patrón del error:**
```json
{
  "message": ["property <nombre> should not exist"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Solución:** Agregar decoradores de `class-validator` al DTO correspondiente.

---

## 🎯 PRÓXIMOS PASOS

Una vez que confirmes que crear integrantes funciona:

1. **Verifica que los listados carguen** correctamente
2. **Prueba registrar una persona con nombre compuesto** (ej: "María del Socorro")
3. **Verifica que se guarde en el campo `nombres`** (no `primer_nombre`/`segundo_nombre`)
4. **Verifica que se muestre el `nombre_completo` generado**

---

## 📝 ARCHIVOS MODIFICADOS EN TODA LA SESIÓN

### Backend (3 archivos):
1. ✅ `apps/api/src/expedientes/expedientes.service.ts` - JOIN corregido
2. ✅ `apps/api/src/grupos/grupos.controller.ts` - Decoradores DTO
3. ✅ `apps/api/src/integrantes/integrantes.controller.ts` - Decoradores DTOs

### Frontend (3 archivos):
4. ✅ `apps/mobile/src/features/grupos/CreateGroupScreen.tsx` - Usar `api.post()`
5. ✅ `apps/mobile/src/features/expedientes/ExpedientesListScreen.tsx` - Usar `api.get()`
6. ✅ `apps/mobile/src/features/expedientes/ExpedienteDetailScreen.tsx` - Usar `api.get()`

---

## 🚫 RECORDATORIO

**NO borres las columnas `primer_nombre` y `segundo_nombre`** hasta confirmar que TODO funciona:
- ✅ Login
- ✅ Crear grupos
- ✅ Crear integrantes
- ✅ Listados cargan
- ✅ Nombres compuestos se guardan bien
- ✅ `nombre_completo` se genera correctamente

---

**¡Prueba crear un integrante ahora!** 🚀
