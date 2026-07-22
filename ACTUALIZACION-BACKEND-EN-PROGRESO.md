# 🚧 ACTUALIZACIÓN BACKEND TypeORM - EN PROGRESO

**Estado:** PARCIALMENTE COMPLETADO  
**Fecha:** 2026-07-13  
**Prioridad:** ⚠️ CRÍTICA

---

## ✅ COMPLETADO

### 1. **`synchronize: false` ACTIVADO** ⚠️
**Archivo:** `apps/api/src/app.module.ts`
- ✅ Cambiado de `synchronize: true` → `synchronize: false`
- ✅ Schema protegido contra sobrescritura accidental
- ✅ **CRÍTICO:** El API ya no puede destruir el schema migrado

### 2. **Entidades Actualizadas (3/5)**

#### ✅ `GrupoEntity` - COMPLETADO
**Archivo:** `apps/api/src/grupos/grupo.entity.ts`
- ✅ `name` → `nombre`
- ✅ `createdBy` → `created_by`
- ✅ `createdAt` → `created_at`
- ✅ `updatedAt` → `updated_at`
- ✅ `deletedAt` → `deleted_at`
- ✅ `status` → `estado`
- ✅ Agregado: `folio`, `zona_id`, `sucursal_id`, `fecha_inicio`
- ✅ Eliminado: `advisorName`
- ✅ Enum actualizado: `GrupoStatus` → `GrupoEstado`

#### ✅ `ExpedienteEntity` - COMPLETADO
**Archivo:** `apps/api/src/expedientes/expediente.entity.ts`
- ✅ `groupId` → `grupo_id`
- ✅ `createdAt` → `created_at`
- ✅ `updatedAt` → `updated_at`
- ✅ `status` → `estado`
- ✅ Agregado: `folio`, `producto_id`, `asesora_id`, `horario_visita`, `dias_visita`, `semana_cobro`, `observaciones`
- ✅ Eliminado: `title`
- ✅ Enum agregado: `ExpedienteEstado`

#### ✅ `IntegranteEntity` - COMPLETADO (antes `SolicitanteEntity`)
**Archivo:** `apps/api/src/integrantes/integrante.entity.ts`
- ✅ Carpeta renombrada: `solicitantes/` → `integrantes/`
- ✅ Archivo renombrado: `solicitante.entity.ts` → `integrante.entity.ts`
- ✅ Tabla: `@Entity('solicitantes')` → `@Entity('integrantes')`
- ✅ Clase: `SolicitanteEntity` → `IntegranteEntity`
- ✅ Enum: `SolicitanteEstado` → `IntegranteEstado`
- ✅ `expedienteId` → `expediente_id`
- ✅ `createdAt` → `created_at`
- ✅ `updatedAt` → `updated_at`
- ✅ Agregado: `folio`, `persona_id`
- ✅ Eliminado: `nombre`, `nombres`, `apellidoPaterno`, `apellidoMaterno`, `telefono`, `telefonoSecundario`, `montoSolicitado`, `seccionActual`

---

## ⚠️ PENDIENTE - TRABAJO RESTANTE

### 3. **Actualizar Entidades Restantes (2/5)**

#### ⏳ `SolicitudEntity` - PENDIENTE
**Archivo:** `apps/api/src/solicitudes/solicitud.entity.ts`

**Cambios necesarios:**
- [ ] Renombrar todas las columnas a `snake_case`
- [ ] Agregar 60+ columnas nuevas (persona_id, expediente_id, grupo_id, ciclo_numero, numero_credito, credito_id, es_nuevo)
- [ ] Agregar columnas de snapshot (primer_nombre, apellido_pat, dom_*, ref1_*, ref2_*, pareja_*, negocio_*, beneficiario_*, doc_*)
- [ ] Renombrar: `solicitanteId` → `integrante_id`
- [ ] Cambiar relación: `@OneToOne(() => SolicitanteEntity)` → `@OneToOne(() => IntegranteEntity)`

#### ⏳ `DocumentoEntity` - PENDIENTE
**Archivo:** `apps/api/src/documentos/documento.entity.ts`

**Cambios necesarios:**
- [ ] Renombrar: `solicitanteId` → `integrante_id`
- [ ] Cambiar relación: `@ManyToOne(() => SolicitanteEntity)` → `@ManyToOne(() => IntegranteEntity)`
- [ ] Actualizar todas las columnas a `snake_case`

### 4. **Crear Entidades Nuevas (0/16)**

Estas tablas NO tienen entidad TypeORM todavía:

#### Módulo Catálogos (7 entidades)
- [ ] `CodigoPostalEntity` - `codigos_postales`
- [ ] `SucursalEntity` - `sucursales`
- [ ] `ZonaEntity` - `zonas`
- [ ] `RolEntity` - `roles`
- [ ] `UsuarioEntity` - `usuarios`
- [ ] `AsesoraEntity` - `asesoras`
- [ ] `ProductoCreditoEntity` - `productos_credito`

#### Módulo Personas (1 entidad)
- [ ] `PersonaEntity` - `personas`

#### Módulo Ciclos (1 entidad)
- [ ] `CicloEntity` - `ciclos`

#### Módulo Créditos (3 entidades)
- [ ] `CreditoEntity` - `creditos`
- [ ] `CalendarioPagoEntity` - `calendario_pagos`
- [ ] `PagoEntity` - `pagos`

#### Módulo Cobranza (2 entidades)
- [ ] `MoraEntity` - `mora`
- [ ] `ReestructuraEntity` - `reestructuras`

#### Módulo Caja (1 entidad)
- [ ] `CajaMovimientoEntity` - `caja_movimientos`

#### Módulo Auditoría (1 entidad)
- [ ] `AuditLogEntity` - `audit_log`

### 5. **Actualizar Módulos y Servicios**

#### ⏳ Renombrar `SolicitantesModule` → `IntegrantesModule`
**Archivos:**
- [ ] `apps/api/src/integrantes/solicitantes.module.ts` → `integrantes.module.ts`
- [ ] `apps/api/src/integrantes/solicitantes.service.ts` → `integrantes.service.ts`
- [ ] `apps/api/src/integrantes/solicitantes.controller.ts` → `integrantes.controller.ts`
- [ ] `apps/api/src/app.module.ts` - Actualizar import: `SolicitantesModule` → `IntegrantesModule`

#### ⏳ Actualizar todos los imports
En TODOS los archivos que usan `SolicitanteEntity`:
- [ ] `documentos/documento.entity.ts`
- [ ] `documentos/documentos.service.ts`
- [ ] `solicitudes/solicitud.entity.ts`
- [ ] `solicitudes/solicitudes.service.ts`

Cambiar:
```typescript
// ANTES
import { SolicitanteEntity } from '../solicitantes/solicitante.entity';

// DESPUÉS
import { IntegranteEntity } from '../integrantes/integrante.entity';
```

### 6. **Actualizar DTOs**

Todos los DTOs deben usar `snake_case` para coincidir con la BD:

**Archivos:**
- [ ] `grupos/dto/*.dto.ts`
- [ ] `expedientes/dto/*.dto.ts`
- [ ] `integrantes/dto/*.dto.ts`
- [ ] `solicitudes/dto/*.dto.ts`
- [ ] `documentos/dto/*.dto.ts`

**Ejemplo:**
```typescript
// ANTES
export class UpdateSolicitanteDto {
  nombre?: string;
  apellidoPaterno?: string;
  montoSolicitado?: number;
}

// DESPUÉS
export class UpdateIntegranteDto {
  persona_id?: string;
  // nombre, apellidoPaterno, montoSolicitado ya NO existen en integrantes
}
```

---

## 🚨 RIESGOS ACTUALES

### 1. **API NO PUEDE INICIARSE** ⚠️
Las entidades actualizadas (`GrupoEntity`, `ExpedienteEntity`, `IntegranteEntity`) están en **snake_case** pero:
- Los servicios/controladores todavía usan nombres viejos
- Los módulos no están actualizados
- Los imports están rotos

**Solución:** Completar la actualización de servicios/controladores O revertir las entidades temporalmente.

### 2. **Frontend Desconectado** ⚠️
El frontend mobile todavía apunta a:
- `/solicitantes` (ahora es `/integrantes`)
- Campos en `camelCase` (ahora son `snake_case`)

**Solución:** Actualizar frontend después de completar backend.

---

## 📋 PLAN DE ACCIÓN INMEDIATA

### Opción A: **Completar Backend (20-30 min)**
1. Actualizar `SolicitudEntity` y `DocumentoEntity`
2. Renombrar módulo `solicitantes` → `integrantes` completo
3. Actualizar todos los imports y referencias
4. Crear las 16 entidades nuevas (opcional, puede hacerse después)
5. Probar que el API inicia correctamente

### Opción B: **Revertir Temporalmente (5 min)**
1. Deshacer cambios en las 3 entidades
2. Dejar solo `synchronize: false`
3. Planear migración gradual

---

## ✅ VERIFICACIÓN POST-ACTUALIZACIÓN

Cuando completes el backend, verificar:

```bash
# 1. El API debe iniciar sin errores
npm run start

# 2. TypeORM debe reconocer las 21 tablas
# (revisar logs de inicio)

# 3. No debe intentar crear/modificar tablas
# (porque synchronize: false)

# 4. Los endpoints deben responder
curl http://localhost:3000/grupos
curl http://localhost:3000/expedientes
curl http://localhost:3000/integrantes  # antes: /solicitantes
```

---

## 📚 RECURSOS

- **Schema SQL v2.0:** `apps/api/src/migrations/schema-v2/`
- **Migración completada:** `MIGRACION-SCHEMA-V2-COMPLETADA.md`
- **Diagrama ER:** `DIAGRAMA-ER-SCHEMA-V2.md`

---

**Estado Actual:** Backend PARCIALMENTE actualizado, API NO puede iniciarse  
**Próximo Paso:** Completar actualización de entidades y módulos  
**Tiempo Estimado:** 20-30 minutos
