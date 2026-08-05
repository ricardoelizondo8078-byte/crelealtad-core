# 🔍 DIAGNÓSTICO COMPLETO: Error 500 en PATCH /solicitudes/integrante/:id

## ✅ REPRODUCCIÓN EXITOSA

**Script ejecutado:** `node test-paso1-guardado.js`

**Resultado:**
- ✅ PASO 1: Login → **OK**
- ✅ PASO 2: Crear integrante → **OK**
- ✅ PASO 3: PATCH /integrantes/:id → **200 OK**
- ❌ PASO 4: PATCH /solicitudes/integrante/:id → **500 Internal Server Error**

---

## 🔥 CAUSA RAÍZ IDENTIFICADA

**Tabla:** `solicitudes_datos_personales`

**Problema:** Las columnas legacy `primer_nombre` y `segundo_nombre` **todavía tienen NOT NULL constraint**.

**Por qué causa el error 500:**

1. El frontend envía: `nombres`, `apellido_pat`, `apellido_mat`
2. El servicio intenta hacer INSERT en `solicitudes_datos_personales`
3. PostgreSQL rechaza el INSERT porque `primer_nombre` y `segundo_nombre` NO tienen valor pero son NOT NULL
4. El servicio lanza excepción 500

---

## 📊 FLUJO DEL ERROR

```
Frontend                                       Backend
─────────                                      ────────

PATCH /solicitudes/integrante/:id
{
  nombres: 'MARÍA DEL SOCORRO',     ────→    SolicitudesService.partialUpdate()
  apellido_pat: 'GARCÍA',                            │
  apellido_mat: 'LÓPEZ',                             │
  ...                                                 │
}                                                     │
                                                      ▼
                                            upsertDatosPersonales()
                                                      │
                                                      │ INSERT INTO solicitudes_datos_personales
                                                      │   (solicitud_id, nombres, apellido_pat, apellido_mat, ...)
                                                      │ VALUES (...)
                                                      ▼
                                            ❌ PostgreSQL ERROR:
                                               null value in column "primer_nombre"
                                               violates not-null constraint
                                                      │
                                                      ▼
                                            Exception thrown
                                                      │
                                                      ▼
                                            NestJS catches
                                                      │
                                                      ▼
                                            Returns HTTP 500
```

---

## 🔍 EVIDENCIA

### Script de prueba ejecutado:
```bash
node test-paso1-guardado.js
```

### Salida (fragmento):
```
========================================
📋 PASO 4: GUARDAR SOLICITUD (PATCH /solicitudes)
========================================

   Intentando PATCH /solicitudes/integrante/...

❌ ERROR DETECTADO:
   HTTP 500

   Status: 500
   Data: {
  "statusCode": 500,
  "message": "Internal server error"
}
```

### Código del servicio (línea 168-191):
```typescript
private async upsertDatosPersonales(manager: any, solicitudId: string, data: any) {
  const fields = [
    'nombres', 'apellido_pat', 'apellido_mat',  // ✅ Campos nuevos
    'curp', 'fecha_nac', 'genero', 'nacionalidad', 'estado_nacimiento',
    'estado_civil', 'ocupacion', 'nivel_estudio', 'telefono'
  ];

  const hasData = fields.some(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
  if (!hasData) return;

  let entity = await manager.findOne(SolicitudDatosPersonalesEntity, { where: { solicitud_id: solicitudId } });

  if (!entity) {
    entity = manager.create(SolicitudDatosPersonalesEntity, { solicitud_id: solicitudId } as any);
  }

  fields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      (entity as any)[field] = data[field];  // ✅ Asigna nombres, apellido_pat, apellido_mat
    }
  });

  await manager.save(SolicitudDatosPersonalesEntity, entity);  // ❌ FALLA AQUÍ: primer_nombre es NOT NULL
}
```

### Entidad (líneas 12-19):
```typescript
@Entity('solicitudes_datos_personales')
export class SolicitudDatosPersonalesEntity {
  // ...
  
  // Nombres unificados (refactorización)
  @Column({ type: 'varchar', length: 150, nullable: true })
  nombres: string;  // ✅ nullable: true en la entidad

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_pat: string;  // ✅ nullable: true en la entidad

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido_mat: string;  // ✅ nullable: true en la entidad
}
```

**Pero en la base de datos:**
- ❌ `primer_nombre` → **NOT NULL** (columna legacy que el código NO llena)
- ❌ `segundo_nombre` → **NOT NULL** (columna legacy que el código NO llena)

---

## ✅ SOLUCIÓN

**Ya aplicamos la migración a la tabla `personas`**, pero **FALTA aplicarla a `solicitudes_datos_personales`**.

### Migración necesaria:

```sql
-- Tabla: solicitudes_datos_personales
ALTER TABLE solicitudes_datos_personales 
  ALTER COLUMN primer_nombre DROP NOT NULL;

ALTER TABLE solicitudes_datos_personales 
  ALTER COLUMN segundo_nombre DROP NOT NULL;

COMMENT ON COLUMN solicitudes_datos_personales.primer_nombre 
  IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';

COMMENT ON COLUMN solicitudes_datos_personales.segundo_nombre 
  IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';
```

**Estado de las migraciones:**

| Tabla | primer_nombre | segundo_nombre | Estado |
|-------|---------------|----------------|--------|
| `personas` | ✅ NULL permitido | ✅ NULL permitido | **OK** |
| `solicitudes_datos_personales` | ❌ NOT NULL | ❌ NOT NULL | **FALTA MIGRACIÓN** |

---

## 📋 RESUMEN EJECUTIVO

### ✅ QUÉ FUNCIONA:
1. Login con JWT
2. Crear integrante
3. PATCH /integrantes/:id (actualiza tabla `personas`)

### ❌ QUÉ FALLA:
4. PATCH /solicitudes/integrante/:id (intenta INSERT en `solicitudes_datos_personales`)

### 🔧 CAUSA:
- Migración aplicada a `personas` ✅
- Migración NO aplicada a `solicitudes_datos_personales` ❌

### 💡 SOLUCIÓN:
Aplicar la misma migración (quitar NOT NULL) a la tabla `solicitudes_datos_personales`.

---

## 🧪 VERIFICACIÓN POST-FIX

**Después de aplicar la migración, ejecutar:**
```bash
node test-paso1-guardado.js
```

**Resultado esperado:**
```
✅ PASO 1: LOGIN
✅ PASO 2: CREAR INTEGRANTE
✅ PASO 3: GUARDAR PASO 1 (PATCH /integrantes)
✅ PASO 4: GUARDAR SOLICITUD (PATCH /solicitudes)  ← ESTO DEBE PASAR
✅ PASO 5: VERIFICAR DATOS GUARDADOS

✅ TODAS LAS VERIFICACIONES PASARON
   El flujo de guardado funciona correctamente.
```

---

## 📄 ARCHIVOS RELACIONADOS

- ✅ `test-paso1-guardado.js` - Script de prueba diagnóstica
- ✅ `ANALISIS_FLUJO_PASO1.md` - Análisis de punta a punta
- ✅ `CORRECCION_401_UNAUTHORIZED.md` - Corrección de autenticación
- ✅ `DIAGNOSTICO_ERROR_500_COMPLETO.md` - Este documento
