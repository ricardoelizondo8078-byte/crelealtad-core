# 🔍 DIAGNÓSTICO: integrante_id_old

**Fecha**: 05 de agosto de 2026  
**Contexto**: Migración de integridad - Paso 3 (verificar campos legacy)

---

## 📋 RESUMEN EJECUTIVO

**Campo**: `solicitudes.integrante_id_old`  
**Estado actual**: ✅ **NO está en uso en la base de datos** (todas las solicitudes usan `integrante_id`)  
**Recomendación**: ⚠️ **MANTENER temporalmente** - El código lo usa como fallback y puede recibirse del frontend legacy

---

## 🔎 HALLAZGOS

### 1. USO EN CÓDIGO BACKEND

#### ✅ **apps/api/src/solicitudes/solicitudes.service.ts**

**Línea 55** - Fallback en `createOrUpdateForSolicitante()`:
```typescript
const integranteId = dto.integrante_id || dto.solicitanteId || dto.integrante_id_old;
```

**Línea 72** - Persistencia al crear solicitud:
```typescript
solicitudCore = manager.create(SolicitudCoreEntity, {
  integrante_id: integranteId,
  integrante_id_old: sanitizedDto.integrante_id_old,  // ← Se persiste si viene en DTO
  // ...
});
```

**Razón**: El código acepta 3 formas de enviar el integrante:
1. `integrante_id` (preferido - schema v2)
2. `solicitanteId` (legacy)
3. `integrante_id_old` (legacy)

### 2. USO EN CÓDIGO FRONTEND

#### ✅ **apps/mobile** - NO ENCONTRADO

El frontend React Native **NO envía** `integrante_id_old` en ninguna solicitud.

**Grep result**: `No files found`

### 3. DATOS EN BASE DE DATOS

#### ✅ **Estado actual de solicitudes**:

```
Total solicitudes: 2
├── Con integrante_id: 2 (100%)
├── Con integrante_id_old: 0 (0%)
├── Valores iguales: 0
└── Valores diferentes: 0

Referencias huérfanas en integrante_id_old: 0
Referencias huérfanas en integrante_id: 0
```

**Conclusión**: 
- ✅ Todas las solicitudes existentes usan `integrante_id`
- ✅ NINGUNA solicitud tiene `integrante_id_old` poblado
- ✅ El campo existe en el schema pero está vacío

### 4. USO EN ENTIDADES

#### ✅ **Declarado en entities**:

1. `apps/api/src/solicitudes/solicitud.entity.ts:30`
2. `apps/api/src/solicitudes/entities/solicitud-core.entity.ts:15`

**Ambas** lo declaran como:
```typescript
@Column({ type: 'uuid', nullable: true })
integrante_id_old: string;
```

---

## 🤔 ¿POR QUÉ SE MANTIENE?

### Razón 1: **Compatibilidad con sistema legacy**

El código acepta 3 nombres de campo para el integrante:

```typescript
// Orden de prioridad:
1. dto.integrante_id      // ← Schema v2 (actual)
2. dto.solicitanteId      // ← Legacy nombre anterior
3. dto.integrante_id_old  // ← Legacy fallback final
```

Si un cliente viejo (mobile app anterior, Postman, curl) envía `integrante_id_old`, el código lo acepta.

### Razón 2: **No está causando problemas**

- ✅ No está en uso en datos actuales
- ✅ No lo envía el frontend actual
- ✅ No hay restricciones de integridad sobre él
- ✅ Es nullable, no ocupa espacio si es NULL

---

## ⚖️ ¿SE PUEDE ELIMINAR?

### 🚫 NO AHORA - Riesgos:

1. **Clientes desconocidos**: Puede haber un script, Postman collection, o cliente móvil viejo que aún lo envíe
2. **Sin telemetría**: No sabemos si alguna solicitud llega con este campo
3. **Base vacía**: Con solo 2 solicitudes de prueba, no hay datos históricos para validar

### ✅ SÍ EN EL FUTURO - Cuándo:

**Después de** verificar que:
1. No hay solicitudes con `integrante_id_old` poblado
2. El frontend móvil está 100% actualizado en producción
3. No hay clientes API legacy activos

---

## 📝 ANÁLISIS POR ESCENARIO

### Escenario A: Consolidar AHORA

**Cambios requeridos**:

1. **Backend** - Eliminar de DTO y service:
```typescript
// ❌ ELIMINAR
interface SolicitudPayload {
  // ...
  integrante_id_old?: string;  // ← ELIMINAR ESTA LÍNEA
}

// ❌ ELIMINAR del fallback
const integranteId = dto.integrante_id || dto.solicitanteId;  // ← Sin integrante_id_old
```

2. **Entity** - Eliminar columna:
```typescript
// ❌ ELIMINAR
@Column({ type: 'uuid', nullable: true })
integrante_id_old: string;
```

3. **Migración** - DROP COLUMN:
```typescript
await queryRunner.query(`ALTER TABLE solicitudes DROP COLUMN integrante_id_old`);
```

4. **Frontend** - NO REQUIERE CAMBIOS (ya no lo usa)

**Riesgo**: 🔴 **ALTO**
- Si existe un cliente legacy enviando este campo, deja de funcionar
- No hay forma de saber si existe sin telemetría

### Escenario B: Consolidar DESPUÉS (Recomendado)

**Cuándo**: Después del documento de flujo de datos completo

**Ventajas**:
- ✅ El flujo de datos mostrará si algún cliente lo usa
- ✅ Más tiempo para validar que no hay clientes legacy
- ✅ Más solicitudes en base para analizar

**Plan**:
1. Agregar logging cuando `integrante_id_old` se use:
   ```typescript
   if (dto.integrante_id_old) {
     logger.warn('LEGACY: solicitud usando integrante_id_old', { dto });
   }
   ```
2. Monitorear por 1-2 semanas
3. Si no se usa, proceder con Escenario A

---

## 🎯 RECOMENDACIÓN FINAL

### ✅ **MANTENER `integrante_id_old` POR AHORA**

**Razones**:
1. No está causando problemas
2. No sabemos si hay clientes legacy
3. La base está prácticamente vacía (2 solicitudes)
4. El costo de mantenerlo es cero (nullable, no ocupa espacio)

### 📋 **PLAN DE CONSOLIDACIÓN FUTURA**

**Paso 1** - Agregar telemetría (AHORA):
```typescript
if (dto.integrante_id_old) {
  this.logger.warn('⚠️  LEGACY FIELD: integrante_id_old recibido', {
    folio: dto.folio,
    value: dto.integrante_id_old
  });
}
```

**Paso 2** - Monitorear (1-2 semanas)

**Paso 3** - Si no se usa, eliminar:
- Eliminar de DTO
- Eliminar de entity
- Crear migración DROP COLUMN
- Actualizar documentación

---

## 📊 TABLA COMPARATIVA

| Campo | Estado en DB | Enviado por frontend | Usado en fallback | Eliminar ahora |
|-------|-------------|---------------------|-------------------|----------------|
| `integrante_id` | ✅ 2/2 solicitudes | ✅ Sí | ✅ Prioridad 1 | ❌ NO |
| `solicitanteId` | ❌ 0/2 solicitudes | ❌ No | ✅ Prioridad 2 | ⚠️ Después |
| `integrante_id_old` | ❌ 0/2 solicitudes | ❌ No | ✅ Prioridad 3 | ⚠️ Después |

---

## 📁 ARCHIVOS INVOLUCRADOS

### Backend (TypeScript)
- `apps/api/src/solicitudes/solicitudes.service.ts:18,55,72` - Uso en DTO y fallback
- `apps/api/src/solicitudes/solicitud.entity.ts:30` - Declaración en entity
- `apps/api/src/solicitudes/entities/solicitud-core.entity.ts:15` - Declaración en core entity

### Archivos BACKUP (ignorar)
- `apps/api/src/solicitudes/solicitudes.service.BACKUP.ts`
- `apps/api/src/solicitudes/solicitudes.service.NEW.ts`
- `apps/api/src/solicitudes/solicitud.entity.BACKUP-20260723-162959.ts`
- `apps/api/src/solicitudes/solicitud.entity.FIXED.ts`

### Frontend (React Native)
- ❌ **Ningún archivo** - NO se usa

---

## ✅ CONCLUSIÓN

**`integrante_id_old` es un campo residual de migración que:**
- ✅ Existe en el código como fallback de compatibilidad
- ✅ NO está en uso en la base de datos actual
- ✅ NO lo envía el frontend actual
- ⚠️ PODRÍA ser enviado por clientes legacy desconocidos

**Acción**: **MANTENER** hasta tener telemetría que confirme que no se usa.

**Siguiente paso**: Agregar logging y monitorear antes de eliminar.
