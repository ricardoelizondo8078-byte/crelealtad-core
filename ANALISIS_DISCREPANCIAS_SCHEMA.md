# Análisis de Discrepancias entre Schema SQL y Entidades TypeORM

**Fecha:** 2026-07-23  
**Proyecto:** CRELEALTAD CORE  
**Estado:** Schema V2 Migration

---

## Resumen Ejecutivo

Se encontraron **múltiples discrepancias críticas** entre las definiciones de las entidades TypeORM y el schema SQL de PostgreSQL. Estas discrepancias pueden causar:

- ✗ **Errores de sincronización** con TypeORM
- ✗ **Fallos en inserción/actualización** de datos
- ✗ **Incompatibilidad** entre migraciones SQL y código TypeScript
- ✗ **Problemas de validación** en el API

---

## 🔴 Discrepancias Críticas Encontradas

### 1. **Tabla: `personas`**

#### ❌ **Problema 1: Columnas faltantes en SQL**

**Entidad TypeORM tiene:**
```typescript
@Column({ type: 'varchar', nullable: true })
telefono: string;

@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
monto_solicitado: number;
```

**Schema SQL NO tiene estas columnas:**
```sql
CREATE TABLE personas (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio          VARCHAR(20)  UNIQUE,
  curp           VARCHAR(18)  UNIQUE,
  primer_nombre  VARCHAR(50)  NOT NULL,
  segundo_nombre VARCHAR(50),
  apellido_pat   VARCHAR(50)  NOT NULL,
  apellido_mat   VARCHAR(50),
  fecha_nac      DATE,
  genero         VARCHAR(15),
  estado         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- ❌ Falta: telefono, monto_solicitado
```

**Impacto:**
- Inserción de personas fallará si se intenta guardar `telefono` o `monto_solicitado`
- Existe migración `1721001000000-AddTelefonoMontoToPersonas.ts` pero no está en el schema base

**Solución:**
```sql
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monto_solicitado DECIMAL(10,2);
```

---

### 2. **Tabla: `grupos`**

#### ✅ **Estado:** Correcta después de migración
- La migración `02-migrar-grupos.sql` corrige todos los nombres de columnas
- No se encontraron discrepancias críticas

#### ⚠️ **Advertencia:**
La entidad TypeORM tiene `deleted_at` pero el schema base no lo documenta explícitamente:

```typescript
@DeleteDateColumn({ type: 'timestamptz', nullable: true })
deleted_at: Date;
```

**Verificar:** ¿La tabla `grupos` tiene la columna `deleted_at`?

---

### 3. **Tabla: `expedientes`**

#### ✅ **Estado:** Correcta después de migración
- La migración `03-migrar-expedientes.sql` renombra correctamente las columnas
- El schema está alineado con la entidad TypeORM

---

### 4. **Tabla: `integrantes`**

#### ✅ **Estado:** Correcta después de migración
- Renombrada de `solicitantes` a `integrantes`
- Columnas eliminadas correctamente (`nombre`, `apellidoPaterno`, etc.)
- Se agregaron `folio` y `persona_id`

---

### 5. **Tabla: `solicitudes`**

#### ❌ **Problema 2: Nombres de columnas inconsistentes (camelCase vs snake_case)**

**Entidad TypeORM usa AMBOS estilos:**
```typescript
// ❌ Usa camelCase en @Column name
@Column({ type: 'date', nullable: true, name: 'fechaNacimiento' })
fecha_nac: Date;

@Column({ type: 'varchar', nullable: true, name: 'estadoCivil' })
estado_civil: string;

@Column({ type: 'varchar', nullable: true, name: 'nivelEstudio' })
nivel_estudio: string;
```

**Impacto:**
- La base de datos tendrá columnas con nombres en camelCase: `fechaNacimiento`, `estadoCivil`, `nivelEstudio`
- Rompe la convención de snake_case del resto del proyecto
- Dificulta queries SQL directas

**Solución:**
```typescript
// ✅ Cambiar a snake_case consistente
@Column({ type: 'date', nullable: true })
fecha_nac: Date;

@Column({ type: 'varchar', nullable: true })
estado_civil: string;

@Column({ type: 'varchar', nullable: true })
nivel_estudio: string;
```

#### ❌ **Problema 3: Columnas con nombres antiguos**

```typescript
@Column({ type: 'varchar', nullable: true, name: 'estado_nacimiento_nuevo' })
estado_nacimiento: string;

@Column({ type: 'varchar', nullable: true })
negocio_giro_nuevo: string;

@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
negocio_gastos_nuevo: number;
```

**Impacto:**
- Nombres de columna con sufijo `_nuevo` indican migración incompleta
- Genera confusión sobre cuál es la columna actual

**Solución:**
```sql
-- Si las columnas antiguas ya fueron eliminadas:
ALTER TABLE solicitudes RENAME COLUMN estado_nacimiento_nuevo TO estado_nacimiento;
ALTER TABLE solicitudes RENAME COLUMN negocio_giro_nuevo TO negocio_giro;
ALTER TABLE solicitudes RENAME COLUMN negocio_gastos_nuevo TO negocio_gastos;
```

```typescript
// Actualizar entidad
@Column({ type: 'varchar', nullable: true })
estado_nacimiento: string;

@Column({ type: 'varchar', nullable: true })
negocio_giro: string;

@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
negocio_gastos: number;
```

---

### 6. **Tabla: `documentos`**

#### ❌ **Problema 4: Nombres de columnas en camelCase**

**Entidad TypeORM usa camelCase en TODAS las columnas:**
```typescript
@Entity('documentos')
export class DocumentoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  solicitanteId: string;  // ❌ Debería ser: integrante_id

  @Column({ type: 'text', nullable: true })
  archivoBase64: string;  // ❌ Debería ser: archivo_base64

  @Column({ type: 'varchar', nullable: true })
  archivoNombre: string;  // ❌ Debería ser: archivo_nombre

  @Column({ type: 'timestamptz', nullable: true })
  fechaCarga: Date;  // ❌ Debería ser: fecha_carga

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;  // ❌ Debería ser: created_at

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;  // ❌ Debería ser: updated_at
}
```

**Impacto:**
- **CRÍTICO:** Rompe completamente la convención de nomenclatura del proyecto
- Todas las demás tablas usan snake_case
- Queries SQL directas fallarán
- Inconsistencia total con el resto del sistema

**Solución:**
```typescript
@Entity('documentos')
export class DocumentoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  integrante_id: string;  // ✅ Cambio de solicitanteId a integrante_id

  @Column({
    type: 'enum',
    enum: DocumentoTipo,
  })
  tipo: DocumentoTipo;

  @Column({
    type: 'enum',
    enum: DocumentoEstado,
    default: DocumentoEstado.PENDIENTE,
  })
  estado: DocumentoEstado;

  @Column({ type: 'text', nullable: true })
  archivo_base64: string;  // ✅ snake_case

  @Column({ type: 'varchar', nullable: true })
  archivo_nombre: string;  // ✅ snake_case

  @Column({ type: 'timestamptz', nullable: true })
  fecha_carga: Date;  // ✅ snake_case

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;  // ✅ snake_case

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;  // ✅ snake_case

  @ManyToOne(() => IntegranteEntity, (integrante) => integrante.documentos)
  @JoinColumn({ name: 'integrante_id' })
  integrante: IntegranteEntity;
}
```

```sql
-- Migración SQL necesaria
ALTER TABLE documentos RENAME COLUMN "solicitanteId" TO integrante_id;
ALTER TABLE documentos RENAME COLUMN "archivoBase64" TO archivo_base64;
ALTER TABLE documentos RENAME COLUMN "archivoNombre" TO archivo_nombre;
ALTER TABLE documentos RENAME COLUMN "fechaCarga" TO fecha_carga;
ALTER TABLE documentos RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE documentos RENAME COLUMN "updatedAt" TO updated_at;
```

---

## 📋 Resumen de Problemas por Prioridad

### 🔴 **Prioridad CRÍTICA** (Bloquea operaciones básicas)

1. **`personas`**: Falta columnas `telefono` y `monto_solicitado`
2. **`documentos`**: Toda la tabla usa camelCase (inconsistente con el resto)
3. **`solicitudes`**: Mezcla de camelCase y snake_case

### 🟡 **Prioridad ALTA** (Causa confusión y problemas futuros)

4. **`solicitudes`**: Columnas con sufijo `_nuevo` que deberían renombrarse
5. **`grupos`**: Verificar existencia de `deleted_at`

### 🟢 **Prioridad MEDIA** (Mejoras de calidad)

6. Falta documentación de todas las tablas del Schema V2
7. No hay migraciones TypeORM que correspondan a los scripts SQL

---

## 🛠️ Plan de Corrección

### Fase 1: Correcciones Críticas (Inmediatas)

#### 1.1 Agregar columnas faltantes a `personas`
```sql
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monto_solicitado DECIMAL(10,2);
```

#### 1.2 Corregir tabla `documentos` - Migración SQL
```sql
-- Crear script: apps/api/src/migrations/fix-documentos-naming.sql
ALTER TABLE documentos RENAME COLUMN "solicitanteId" TO integrante_id;
ALTER TABLE documentos RENAME COLUMN "archivoBase64" TO archivo_base64;
ALTER TABLE documentos RENAME COLUMN "archivoNombre" TO archivo_nombre;
ALTER TABLE documentos RENAME COLUMN "fechaCarga" TO fecha_carga;
ALTER TABLE documentos RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE documentos RENAME COLUMN "updatedAt" TO updated_at;

-- Actualizar FK si existe
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_solicitanteId_fkey;
ALTER TABLE documentos
  ADD CONSTRAINT fk_documentos_integrante
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id);
```

#### 1.3 Actualizar entidad TypeORM `documento.entity.ts`
Ver código de solución arriba en "Problema 4"

#### 1.4 Corregir `solicitudes` - Eliminar camelCase
```sql
-- Crear script: apps/api/src/migrations/fix-solicitudes-naming.sql
ALTER TABLE solicitudes RENAME COLUMN "fechaNacimiento" TO fecha_nac;
ALTER TABLE solicitudes RENAME COLUMN "estadoCivil" TO estado_civil;
ALTER TABLE solicitudes RENAME COLUMN "nivelEstudio" TO nivel_estudio;
```

```typescript
// Actualizar solicitud.entity.ts
@Column({ type: 'date', nullable: true })
fecha_nac: Date;

@Column({ type: 'varchar', nullable: true })
estado_civil: string;

@Column({ type: 'varchar', nullable: true })
nivel_estudio: string;
```

### Fase 2: Limpieza de nombres con sufijo `_nuevo`

```sql
-- Verificar si columnas antiguas existen
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'solicitudes'
  AND column_name IN ('estado_nacimiento', 'negocio_giro', 'negocio_gastos');

-- Si NO existen las antiguas, renombrar:
ALTER TABLE solicitudes RENAME COLUMN estado_nacimiento_nuevo TO estado_nacimiento;
ALTER TABLE solicitudes RENAME COLUMN negocio_giro_nuevo TO negocio_giro;
ALTER TABLE solicitudes RENAME COLUMN negocio_gastos_nuevo TO negocio_gastos;
```

### Fase 3: Verificación y Validación

```sql
-- Ejecutar script de análisis
\i analisis-discrepancias.sql

-- Verificar que todas las columnas estén en snake_case
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos')
  AND column_name ~ '[A-Z]'  -- Detectar camelCase
ORDER BY table_name, column_name;
```

### Fase 4: Sincronización TypeORM

```bash
# Generar migraciones TypeORM basadas en las entidades corregidas
cd apps/api
npm run typeorm:migration:generate -- -n FixColumnNaming

# Revisar y ajustar la migración generada
# Aplicar
npm run typeorm:migration:run
```

---

## 🔍 Scripts de Verificación

### Verificar Schema Actual
```bash
# Conectar a PostgreSQL y ejecutar
psql -h localhost -U postgres -d crelealtad_db -f analisis-discrepancias.sql
```

### Verificar Entidades TypeORM
```bash
cd apps/api
npm run typeorm:schema:log
```

### Comparar diferencias
```bash
# Este comando mostrará las diferencias entre entidades y DB
npm run typeorm:schema:sync -- --dry-run
```

---

## 📝 Archivos a Modificar

### Archivos de Entidades TypeORM
1. ✅ `apps/api/src/personas/persona.entity.ts` - Ya está correcto
2. ✅ `apps/api/src/grupos/grupo.entity.ts` - Ya está correcto
3. ✅ `apps/api/src/expedientes/expediente.entity.ts` - Ya está correcto
4. ✅ `apps/api/src/integrantes/integrante.entity.ts` - Ya está correcto
5. ❌ `apps/api/src/solicitudes/solicitud.entity.ts` - **REQUIERE CORRECCIÓN**
6. ❌ `apps/api/src/documentos/documento.entity.ts` - **REQUIERE CORRECCIÓN CRÍTICA**

### Scripts de Migración SQL a Crear
1. `apps/api/src/migrations/fix-personas-add-columns.sql`
2. `apps/api/src/migrations/fix-documentos-naming.sql`
3. `apps/api/src/migrations/fix-solicitudes-naming.sql`
4. `apps/api/src/migrations/fix-solicitudes-remove-nuevo-suffix.sql`

### Scripts de Migración TypeORM a Generar
1. `apps/api/src/migrations/[timestamp]-FixPersonasColumns.ts`
2. `apps/api/src/migrations/[timestamp]-FixDocumentosNaming.ts`
3. `apps/api/src/migrations/[timestamp]-FixSolicitudesNaming.ts`

---

## ⚠️ Riesgos y Consideraciones

### Riesgos de No Corregir
1. **Datos existentes** podrían perderse o corromperse
2. **Queries SQL** fallarán en producción
3. **TypeORM sync** destruirá y recreará tablas
4. **Inconsistencias** entre ambientes (dev, staging, prod)

### Consideraciones al Corregir
1. **Backup de base de datos** antes de ejecutar migraciones
2. **Verificar datos existentes** en cada tabla
3. **Probar en desarrollo** antes de aplicar en producción
4. **Actualizar servicios y DTOs** que usen los nombres antiguos
5. **Revisar frontend** si accede directamente a nombres de columnas

---

## ✅ Checklist de Validación Post-Corrección

- [ ] Todas las tablas usan snake_case consistentemente
- [ ] No hay columnas con sufijos temporales (`_nuevo`, `_old`)
- [ ] Foreign keys apuntan a las tablas y columnas correctas
- [ ] Índices están creados en todas las columnas necesarias
- [ ] TypeORM sync no genera cambios (`typeorm:schema:sync --dry-run`)
- [ ] Todos los servicios del API funcionan correctamente
- [ ] Tests de integración pasan
- [ ] Documentación actualizada

---

## 📊 Estadísticas

- **Total de tablas analizadas:** 6
- **Tablas con problemas críticos:** 2 (documentos, solicitudes)
- **Tablas con problemas menores:** 1 (personas)
- **Columnas a renombrar:** ~15
- **Columnas a agregar:** 2
- **Tiempo estimado de corrección:** 4-6 horas
- **Nivel de riesgo:** MEDIO-ALTO

---

## 📞 Siguiente Paso Recomendado

**ACCIÓN INMEDIATA:**

1. Ejecutar `analisis-discrepancias.sql` en la base de datos para confirmar estado actual
2. Crear backup completo de la base de datos
3. Aplicar correcciones en orden de prioridad (Fase 1 → Fase 2 → Fase 3)
4. Validar con checklist

**¿Quieres que proceda a crear los scripts de corrección automáticamente?**
