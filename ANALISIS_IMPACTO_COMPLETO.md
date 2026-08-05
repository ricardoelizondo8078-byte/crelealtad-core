# 📊 ANÁLISIS DE IMPACTO COMPLETO

## ✅ ESTADO ACTUAL DE LAS MIGRACIONES

### Base de Datos
- ✅ Tabla `personas`: Tiene `nombres` y `nombre_completo` (nuevos) + `primer_nombre` y `segundo_nombre` (legacy)
- ✅ Tabla `solicitudes_datos_personales`: Tiene `nombres` y `nombre_completo` (nuevos) + `primer_nombre` y `segundo_nombre` (legacy)
- ✅ Vista `solicitudes_completo`: Redefinida correctamente con ambos sets de columnas

### Código
- ❌ **TODOS los archivos siguen usando `primer_nombre` y `segundo_nombre`**
- ⚠️ **Si borras las columnas ahora, la app SE ROMPE**

---

## 📁 ARCHIVOS QUE DEBEN ACTUALIZARSE

**Total: 9 archivos con 26 ocurrencias**

### 🔴 CRÍTICO: Backend - Entidades TypeORM (3 archivos)

Estos archivos definen el schema de TypeORM. Si no se actualizan, TypeORM intentará leer columnas que ya no existen.

#### 1. `apps/api/src/personas/persona.entity.ts` (2 ocurrencias)
```typescript
Línea 15:   @Column({ type: 'varchar', length: 50, nullable: false })
Línea 15:   primer_nombre: string;

Línea 18:   @Column({ type: 'varchar', length: 50, nullable: true })
Línea 18:   segundo_nombre: string;
```

**Acción requerida:**
- ❌ Eliminar: `primer_nombre` y `segundo_nombre`
- ✅ Agregar: `nombres: string` y `nombre_completo: string`

---

#### 2. `apps/api/src/solicitudes/entities/solicitud-datos-personales.entity.ts` (2 ocurrencias)
```typescript
Línea 12:   primer_nombre: string;
Línea 15:   segundo_nombre: string;
```

**Acción requerida:**
- ❌ Eliminar: `primer_nombre` y `segundo_nombre`
- ✅ Agregar: `nombres: string` y `nombre_completo: string`

---

#### 3. `apps/api/src/solicitudes/solicitud.entity.ts` (2 ocurrencias)
```typescript
Línea 55:   primer_nombre: string;
Línea 58:   segundo_nombre: string;
```

**Acción requerida:**
- ❌ Eliminar: `primer_nombre` y `segundo_nombre`
- ✅ Agregar: `nombres: string` y `nombre_completo: string`

---

### 🟠 IMPORTANTE: Backend - Servicios (3 archivos)

Estos servicios construyen queries, asignan valores, o formatean datos usando los campos viejos.

#### 4. `apps/api/src/solicitudes/solicitudes.service.ts` (1 ocurrencia)
```typescript
Línea 170: 'primer_nombre', 'segundo_nombre', 'apellido_pat', 'apellido_mat',
```

**Contexto:** Lista de campos para upsert en `solicitudes_datos_personales`.

**Acción requerida:**
- Cambiar de: `'primer_nombre', 'segundo_nombre'`
- A: `'nombres'`

---

#### 5. `apps/api/src/integrantes/integrantes.service.ts` (5 ocurrencias)
```typescript
Línea 31:  ? `${persona.primer_nombre} ${persona.apellido_pat} ${persona.apellido_mat || ''}...
Línea 77:  nombres: persona.primer_nombre,
Línea 80:  nombre: `${persona.primer_nombre} ${persona.apellido_pat} ${persona.apellido_mat...
Línea 134: primer_nombre: nombres,
Línea 228: datosPersona.primer_nombre = data[campo];
```

**Acción requerida:**
- Línea 31, 80: Usar `persona.nombre_completo` en lugar de concatenar manualmente
- Línea 77: Cambiar `nombres: persona.primer_nombre` a `nombres: persona.nombres`
- Línea 134, 228: Cambiar referencias de `primer_nombre` a `nombres`

---

#### 6. `apps/api/src/expedientes/expedientes.service.ts` (2 ocurrencias)
```typescript
Línea 42: ? `${int.solicitud.primer_nombre || ''} ${int.solicitud.segundo_nombre || ''} ${...
Línea 44: primer_nombre: int.solicitud?.primer_nombre,
```

**Acción requerida:**
- Línea 42: Usar `int.solicitud.nombre_completo` en lugar de concatenar
- Línea 44: Cambiar a `nombres: int.solicitud?.nombres`

---

### 🟡 MEDIO: Frontend - Pantallas React Native (2 archivos)

Estas pantallas capturan o muestran nombres de personas.

#### 7. `apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx` (1 ocurrencia)
```typescript
Línea 1032: primer_nombre: form.nombres,
```

**Acción requerida:**
- Cambiar de: `primer_nombre: form.nombres`
- A: `nombres: form.nombres`
- Verificar que el campo de entrada en el formulario se llame "Nombre(s)" (no "Primer Nombre")

---

#### 8. `apps/mobile/src/features/verificacion/IntegranteVerificacionScreen.tsx` (7 ocurrencias)
```typescript
Línea 61:  primer_nombre: string;
Línea 62:  segundo_nombre?: string;
Línea 236: primer_nombre: solicitudData.primer_nombre,
Línea 237: segundo_nombre: solicitudData.segundo_nombre,
Línea 322: nombre: int.nombre || `${int.primer_nombre || ''} ${int.apellido_pat || ''}`.tri...
```

**Acción requerida:**
- Líneas 61-62: Actualizar interface para usar `nombres: string` y `nombre_completo?: string`
- Líneas 236-237: Cambiar a `nombres: solicitudData.nombres`
- Línea 322: Usar `int.nombre_completo` en lugar de concatenar

---

### 🟢 BAJO: Frontend - Servicios/API (1 archivo)

Servicio que transforma datos entre frontend y backend.

#### 9. `apps/mobile/src/modules/asesor/services/solicitudService.ts` (4 ocurrencias)
```typescript
Línea 48:  primerNombre: data.primer_nombre,
Línea 49:  segundoNombre: data.segundo_nombre,
Línea 115: primer_nombre: formData.primerNombre,
Línea 116: segundo_nombre: formData.segundoNombre,
```

**Acción requerida:**
- Cambiar de: `primerNombre` y `segundoNombre`
- A: `nombres` (un solo campo)
- Actualizar interfaces TypeScript correspondientes

---

## ⚠️ RIESGOS SI SE ELIMINAN LAS COLUMNAS SIN ACTUALIZAR EL CÓDIGO

### 1. **Errores de TypeORM** ✖️
```
QueryFailedError: column "primer_nombre" does not exist
```
- Las entidades intentarán leer/escribir columnas que ya no existen
- Falla en **TODAS** las operaciones CRUD de personas y solicitudes

### 2. **Errores en Servicios** ✖️
```
TypeError: Cannot read property 'primer_nombre' of undefined
```
- Concatenaciones manuales de nombres fallarán
- Inserts/updates con campos inexistentes romperán transacciones

### 3. **Frontend sin datos** ✖️
```
- Pantallas de registro/edición no guardarán nombres
- Listados mostrarán nombres en blanco
- Validaciones de formularios fallarán
```

---

## ✅ ORDEN DE EJECUCIÓN SEGURO

### FASE A: Actualizar CÓDIGO (sin romper nada)
1. ✅ Actualizar entidades TypeORM para incluir `nombres` y `nombre_completo` (AGREGAR, no eliminar todavía)
2. ✅ Actualizar servicios para usar los nuevos campos
3. ✅ Actualizar pantallas frontend
4. ✅ Probar TODA la aplicación end-to-end
5. ✅ Confirmar que los nuevos campos funcionan correctamente

### FASE B: Limpiar campos legacy (una vez probado)
6. ✅ Eliminar referencias a `primer_nombre` y `segundo_nombre` del código
7. ✅ Eliminar las columnas de las tablas de BD
8. ✅ Redefinir vista `solicitudes_completo` sin columnas legacy
9. ✅ Rebuild y redeploy

---

## 🚀 SIGUIENTE PASO RECOMENDADO

**NO eliminar columnas todavía.**

En su lugar:
1. Primero actualiza LAS ENTIDADES TypeORM (agregar `nombres` y `nombre_completo`, MANTENER los campos viejos)
2. Luego actualiza LOS SERVICIOS uno por uno
3. Después actualiza EL FRONTEND
4. Prueba TODO end-to-end
5. SOLO ENTONCES elimina las columnas de la BD

**¿Quieres que proceda con la actualización del código ahora, o prefieres revisar este reporte primero?**
