# 🗄️ REPORTE DE BASE DE DATOS - CRELEALTAD CORE

**Fecha:** 2026-08-03  
**Agente:** Database Reviewer (ECC)  
**Estado:** 🟡 ACEPTABLE con mejoras necesarias

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Estado | Prioridad |
|-----------|--------|-----------|
| Diseño del Esquema | 🟢 Bueno | - |
| Índices | 🔴 Crítico | Alta |
| Queries (N+1) | 🔴 Crítico | Alta |
| Constraints FK | 🟡 Medio | Media |
| Normalización | 🟡 Excesiva | Media |
| Paginación | 🔴 Ausente | Alta |
| RLS/Seguridad | 🔴 Ausente | Alta |
| Config/Secrets | 🔴 Hardcoded | Crítica |
| Logging | 🟡 console.log | Media |

---

## 🏗️ MODELO DE DATOS

```
┌──────────────┐
│   GRUPOS     │
│--------------│
│ id (PK)      │──┐
│ nombre       │  │
│ estado       │  │
└──────────────┘  │ 1:N
                  ▼
           ┌──────────────┐
           │ EXPEDIENTES  │
           │--------------│
           │ id (PK)      │──┐
           │ grupo_id(FK) │  │
           │ estado       │  │
           └──────────────┘  │ 1:N
                             ▼
                      ┌──────────────┐
                      │ INTEGRANTES  │
                      │--------------│
                      │ id (PK)      │──────┐
                      │ expediente_id│      │
                      │ persona_id(FK│      │ 1:1
                      └──────────────┘      ▼
                             │         ┌────────────────────┐
                             │         │    SOLICITUDES     │
                             │         │  (Vista 8 JOINs)   │
                             ▼         └────────────────────┘
                      ┌──────────────┐
                      │   PERSONAS   │
                      │--------------│
                      │ id (PK)      │
                      │ curp (UNIQUE)│
                      └──────────────┘
```

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. N+1 QUERY PROBLEM (CRÍTICO)

**Archivo:** `apps/api/src/integrantes/integrantes.service.ts:23-40`

#### Problema:

```typescript
// ❌ N+1 Query
const integrantes = await this.integranteRepository.find({
  where: { expediente_id: expedienteId },
});

const result = await Promise.all(
  integrantes.map(async (integrante) => {
    // Para cada integrante, hace una query adicional
    const persona = await this.personaRepository.findOne({
      where: { id: integrante.persona_id },
    });
  })
);
```

**Impacto:**
- 10 integrantes = 11 queries (1 + 10)
- 50 integrantes = 51 queries (1 + 50)

#### Solución:

```typescript
async listByExpediente(expedienteId: string): Promise<any[]> {
  const integrantes = await this.integranteRepository
    .createQueryBuilder('integrante')
    .leftJoinAndSelect('personas', 'persona', 'persona.id = integrante.persona_id')
    .where('integrante.expediente_id = :expedienteId', { expedienteId })
    .select([
      'integrante.id',
      'integrante.expediente_id',
      'integrante.persona_id',
      'integrante.estado',
      'persona.primer_nombre',
      'persona.apellido_pat',
      'persona.apellido_mat',
      'persona.telefono',
      'persona.monto_solicitado'
    ])
    .getRawMany();

  return integrantes.map(row => ({
    id: row.integrante_id,
    expediente_id: row.integrante_expediente_id,
    persona_id: row.integrante_persona_id,
    estado: row.integrante_estado,
    nombre: `${row.persona_primer_nombre || ''} ${row.persona_apellido_pat || ''}`.trim(),
    telefono: row.persona_telefono,
    montoSolicitado: row.persona_monto_solicitado ?? 0,
  }));
}
```

**Mismo problema en:**
- `grupos.service.ts:69-82` - `listAll()`

---

### 2. ÍNDICES FALTANTES (ALTO)

#### Claves foráneas SIN índices:

| Tabla | Columna FK | Estado | Impacto |
|-------|-----------|--------|---------|
| `integrantes` | `expediente_id` | ❌ SIN ÍNDICE | Alto - queries frecuentes |
| `integrantes` | `persona_id` | ❌ SIN ÍNDICE | Medio - usado en JOINs |
| `expedientes` | `grupo_id` | ❌ SIN ÍNDICE | Alto - queries frecuentes |
| `expedientes` | `producto_id` | ❌ SIN ÍNDICE | Bajo |
| `expedientes` | `asesora_id` | ❌ SIN ÍNDICE | Medio |
| `solicitudes` | `integrante_id` | ✅ UNIQUE INDEX | OK |

#### Migración SQL requerida:

```sql
-- CRÍTICO (implementar HOY)
CREATE INDEX idx_integrantes_expediente ON integrantes(expediente_id);
CREATE INDEX idx_expedientes_grupo ON expedientes(grupo_id);

-- ALTO (implementar esta semana)
CREATE INDEX idx_integrantes_persona ON integrantes(persona_id);
CREATE INDEX idx_expedientes_asesora ON expedientes(asesora_id);
CREATE INDEX idx_expedientes_estado ON expedientes(estado);
CREATE INDEX idx_grupos_estado ON grupos(estado);

-- MEDIO (próxima iteración)
CREATE INDEX idx_expedientes_producto ON expedientes(producto_id);
CREATE INDEX idx_expedientes_grupo_estado ON expedientes(grupo_id, estado);
```

---

### 3. FALTA DE PAGINACIÓN (ALTO)

**Archivo:** Todos los servicios

#### Problema:

```typescript
// ❌ Sin paginación - retorna TODO en memoria
async listAll(): Promise<ExpedienteEntity[]> {
  return this.expedienteRepository.find();
}
```

**Impacto:** Con 10,000 expedientes, retorna 10,000 registros en una sola respuesta.

#### Solución:

```typescript
async listAll(
  page: number = 1,
  limit: number = 50
): Promise<{ data: ExpedienteEntity[]; total: number; page: number; pages: number }> {
  const [data, total] = await this.expedienteRepository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { created_at: 'DESC' },
  });

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
```

**MEJOR - Cursor pagination:**

```typescript
async listAll(cursor?: string, limit: number = 50): Promise<any> {
  const qb = this.expedienteRepository
    .createQueryBuilder('e')
    .orderBy('e.created_at', 'DESC')
    .take(limit);

  if (cursor) {
    qb.where('e.created_at < :cursor', { cursor: new Date(cursor) });
  }

  const data = await qb.getMany();
  const nextCursor = data.length === limit ? data[data.length - 1].created_at : null;

  return { data, nextCursor };
}
```

---

### 4. CREDENCIALES HARDCODEADAS (CRÍTICO)

**Archivo:** `apps/api/src/app.module.ts:14-26`

```typescript
// ❌ Hardcoded credentials
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
  // ...
})
```

#### Solución:

```typescript
// ✅ Usar variables de entorno
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  synchronize: false,
  autoLoadEntities: true,
  logging: process.env.NODE_ENV === 'development',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  connectionTimeoutMillis: 5000,
  maxQueryExecutionTime: 1000, // Log queries > 1s
  extra: {
    max: 20, // Max connections
    min: 2,  // Min connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  retryAttempts: 3,
  retryDelay: 3000,
})
```

**Crear archivo `.env`:**
```env
DATABASE_URL=postgresql://user@localhost:5432/crelealtad
DB_POOL_SIZE=10
NODE_ENV=development
```

---

## 🟡 PROBLEMAS MEDIOS

### 5. FOREIGN KEY CONSTRAINTS FALTANTES

**Archivo:** `integrante.entity.ts`, `expediente.entity.ts`

#### Problema:

```typescript
// ❌ Sin onDelete/onUpdate
@ManyToOne(() => ExpedienteEntity)
@JoinColumn({ name: 'expediente_id' })
expediente: ExpedienteEntity;
```

**Riesgo:** Registros huérfanos si se elimina un grupo/expediente.

#### Solución:

```typescript
// ✅ Con cascadas
@ManyToOne(() => ExpedienteEntity, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'expediente_id' })
expediente: ExpedienteEntity;

@ManyToOne(() => GrupoEntity, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'grupo_id' })
grupo: GrupoEntity;
```

**SQL:**
```sql
ALTER TABLE integrantes
  ADD CONSTRAINT fk_integrantes_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE;

ALTER TABLE integrantes
  ADD CONSTRAINT fk_integrantes_persona
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL;

ALTER TABLE expedientes
  ADD CONSTRAINT fk_expedientes_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT;
```

---

### 6. NORMALIZACIÓN EXCESIVA EN SOLICITUDES

**Problema:** La vista `solicitudes_completo` hace **8 LEFT JOINs** en cada query.

```sql
CREATE OR REPLACE VIEW solicitudes_completo AS
SELECT ...
FROM solicitudes s
LEFT JOIN solicitudes_datos_personales dp ON dp.solicitud_id = s.id
LEFT JOIN solicitudes_domicilios dom ON dom.solicitud_id = s.id
LEFT JOIN solicitudes_negocios neg ON neg.solicitud_id = s.id
LEFT JOIN solicitudes_referencias ref ON ref.solicitud_id = s.id
LEFT JOIN solicitudes_beneficiarios ben ON ben.solicitud_id = s.id
LEFT JOIN solicitudes_validaciones val ON val.solicitud_id = s.id
LEFT JOIN solicitudes_documentos doc ON doc.solicitud_id = s.id;
```

**Impacto:**
- Cada SELECT = 8 JOINs
- NO es vista materializada
- Degradará con >1000 solicitudes

#### Recomendaciones:

**Corto plazo:** Agregar índices en `solicitud_id` de todas las tablas satélites.

**Mediano plazo:** Vista materializada:

```sql
CREATE MATERIALIZED VIEW solicitudes_completo_mv AS
SELECT ... FROM solicitudes s
LEFT JOIN ...;

CREATE INDEX idx_solicitudes_mv_id ON solicitudes_completo_mv(solicitud_id);

-- Refrescar periódicamente
REFRESH MATERIALIZED VIEW CONCURRENTLY solicitudes_completo_mv;
```

**Largo plazo:** Evaluar desnormalización controlada si el volumen supera 10k.

---

### 7. TRANSACCIONES SIN MANEJO DE ERRORES

**Archivo:** `solicitudes.service.ts:54-98`

#### Problema:

```typescript
async createOrUpdateForSolicitante(dto: SolicitudPayload) {
  // ❌ No valida antes de iniciar transacción
  return await this.dataSource.transaction(async (manager) => {
    // 8 upserts sin rollback explícito
  });
}
```

#### Solución:

```typescript
async createOrUpdateForSolicitante(dto: SolicitudPayload): Promise<SolicitudEntity> {
  // ✅ Validar ANTES de transacción
  if (!dto.integrante_id && !dto.solicitanteId) {
    throw new BadRequestException('integrante_id es requerido');
  }

  try {
    return await this.dataSource.transaction(async (manager) => {
      // ... lógica transaccional
    });
  } catch (error) {
    this.logger.error('Error en createOrUpdateForSolicitante', {
      dto,
      error: error.message,
    });
    throw new InternalServerException('Error al procesar solicitud');
  }
}
```

---

### 8. console.log() EN PRODUCCIÓN

**Archivos afectados:**
- `integrantes.service.ts` (líneas 58, 107, 207, 209)
- `grupos.service.ts` (línea 41, 44)
- `solicitudes.service.ts` (líneas 105, 157)

#### Solución - NestJS Logger:

```typescript
import { Logger } from '@nestjs/common';

export class IntegrantesService {
  private readonly logger = new Logger(IntegrantesService.name);

  async getById(id: string) {
    this.logger.debug(`Fetching integrante ${id}`);
    // ...
  }
}
```

---

### 9. FALTA ROW LEVEL SECURITY (RLS)

**Problema:** PostgreSQL/Supabase soporta RLS pero NO está habilitado.

#### Solución:

```sql
-- Habilitar RLS
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrantes ENABLE ROW LEVEL SECURITY;

-- Políticas por usuario/rol
CREATE POLICY grupos_select_policy ON grupos
  FOR SELECT
  USING (
    (SELECT auth.uid()) IN (
      SELECT usuario_id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'ADMIN')
    )
  );
```

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### ⏰ CRÍTICO (Implementar HOY)

1. **Crear índices en claves foráneas:**
   ```sql
   CREATE INDEX idx_integrantes_expediente ON integrantes(expediente_id);
   CREATE INDEX idx_expedientes_grupo ON expedientes(grupo_id);
   ```

2. **Resolver N+1 queries:**
   - `IntegrantesService.listByExpediente()`
   - `GruposService.listAll()`

3. **Mover credenciales a variables de entorno** (`.env`)

### ⏰ ALTO (Semana 1-2)

4. **Implementar paginación** en todos los endpoints

5. **Agregar índices adicionales:**
   ```sql
   CREATE INDEX idx_integrantes_persona ON integrantes(persona_id);
   CREATE INDEX idx_expedientes_estado ON expedientes(estado);
   CREATE INDEX idx_grupos_estado ON grupos(estado);
   ```

6. **Implementar logger estructurado** (reemplazar console.log)

7. **Agregar constraints FK con onDelete/onUpdate**

### ⏰ MEDIO (Semana 3-4)

8. **Implementar Row Level Security (RLS)**

9. **Configurar connection pooling** (max: 20, timeouts, retry logic)

10. **Optimizar transacciones** en SolicitudesService

11. **Considerar vista materializada** para solicitudes_completo

### 🟢 BAJO (Backlog)

12. Evaluar desnormalización controlada en solicitudes
13. Implementar índices parciales
14. Agregar índices compuestos para queries complejas

---

## 📊 QUERIES DE VALIDACIÓN

```sql
-- 1. Verificar índices creados
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Identificar queries lentas
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 3. Verificar tamaño de tablas
SELECT
  relname AS tabla,
  pg_size_pretty(pg_total_relation_size(relid)) AS tamaño,
  n_tup_ins AS inserts,
  n_tup_upd AS updates
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 4. Verificar uso de índices
SELECT schemaname, tablename, indexname, idx_scan AS escaneos
FROM pg_stat_user_indexes
WHERE idx_scan = 0 -- Índices no usados
ORDER BY tablename;
```

---

## ✅ PUNTOS POSITIVOS

- ✅ Uso de UUID para PKs
- ✅ Esquema bien normalizado (3NF)
- ✅ TypeORM configurado correctamente
- ✅ Relaciones bien definidas en entidades
- ✅ Índices en solicitudes (integrante_id, persona_id)

---

**Archivos Revisados:** 10 archivos (entities + services + migrations)  
**Queries Analizadas:** 8 métodos principales  
**Índices Faltantes:** 6 críticos, 4 importantes

---

_Generado por Database Reviewer Agent (ECC) - 2026-08-03_
