# PLAN MAESTRO DE MIGRACIÓN - CRELEALTAD

**Fecha**: 2026-08-02  
**Objetivo**: Migrar datos desde archivos Excel a PostgreSQL/Supabase  
**Archivos fuente**: 
- `BASE DE DATOS SEM 364.xlsm` (datos de grupos y créditos)
- `BASEDATOS CRELEALTAD (1) (1).xlsx` (datos de integrantes)

---

## RESUMEN EJECUTIVO

### Datos a migrar:
- **~8,300 personas** únicas (por CURP)
- **~500 grupos** únicos
- **~500 expedientes** (1 por grupo)
- **8,407 integrantes** (vinculaciones persona-grupo)
- **~500 créditos** (datos financieros por grupo/ciclo)
- **6,695 tesoreras** marcadas

### Origen de datos:

| Tabla destino | Archivo origen | Registros |
|---------------|----------------|-----------|
| `personas` | BASEDATOS CRELEALTAD - Hoja1 | ~8,300 |
| `grupos` | Ambos archivos (vincular por nombre) | ~500 |
| `expedientes` | BASEDATOS CRELEALTAD - Hoja1 | ~500 |
| `integrantes` | BASEDATOS CRELEALTAD - Hoja1 | 8,407 |
| `creditos` | BASE DE DATOS SEM 364 | ~500 |

---

## FASES DE MIGRACIÓN

### FASE 0: PREPARACIÓN (CRÍTICA)
**Duración estimada**: 2 horas  
**Responsable**: Desarrollador + DBA

#### 0.1. Backup completo
```bash
# Backup de base de datos actual
pg_dump -h [host] -U [user] -d [database] > backup_pre_migracion_$(date +%Y%m%d_%H%M%S).sql
```

#### 0.2. Actualizar schema
- Ejecutar `migration_001_schema_updates.sql`
- Agregar campos faltantes en tablas existentes
- Crear índices para optimizar búsquedas

#### 0.3. Validar archivos Excel
- ✅ Verificar que ambos archivos estén en el repositorio
- ✅ Verificar integridad (contar registros)
- ✅ Identificar hojas a usar

#### 0.4. Crear tablas temporales
- Ejecutar `migration_002_temp_tables.sql`
- Crear tablas de staging para carga masiva
- Crear tablas de mapeo legacy

---

### FASE 1: EXTRACCIÓN Y LIMPIEZA
**Duración estimada**: 4 horas  
**Archivos**: Scripts Node.js/TypeScript

#### 1.1. Extraer datos de Excel
```bash
node scripts/migration/01_extract_from_excel.js
```

**Output**:
- `data/staging/personas_raw.json`
- `data/staging/grupos_raw.json`
- `data/staging/integrantes_raw.json`
- `data/staging/creditos_raw.json`

#### 1.2. Limpiar y transformar datos
```bash
node scripts/migration/02_clean_and_transform.js
```

**Transformaciones**:
- Parsear nombres completos → (primer_nombre, apellidos)
- Extraer fecha_nac y género de CURP
- Limpiar teléfonos (quitar espacios, guiones)
- Convertir montos (quitar $, comas) → DECIMAL
- Normalizar nombres de grupos

**Output**:
- `data/staging/personas_clean.json`
- `data/staging/grupos_clean.json`
- `data/staging/integrantes_clean.json`
- `data/staging/creditos_clean.json`

#### 1.3. Validar datos limpios
```bash
node scripts/migration/03_validate_data.js
```

**Validaciones**:
- CURPs válidos (18 caracteres, formato correcto)
- Teléfonos válidos (10 dígitos)
- Montos > 0
- No hay valores NULL en campos requeridos
- No hay duplicados por CURP

---

### FASE 2: MIGRACIÓN DE GRUPOS
**Duración estimada**: 30 minutos  
**Orden**: 1º (sin dependencias)

#### 2.1. Insertar grupos
```bash
node scripts/migration/04_migrate_grupos.js
```

**Proceso**:
1. Leer `grupos_clean.json`
2. Generar folios secuenciales
3. INSERT INTO grupos
4. Guardar mapeo: `nombre_grupo → uuid`

**Output**:
- `data/mapeo/grupos_legacy_to_uuid.json`

#### 2.2. Validación
```sql
-- Contar grupos insertados
SELECT COUNT(*) FROM grupos;  -- Debe ser ~500

-- Verificar no hay duplicados
SELECT nombre, COUNT(*) FROM grupos GROUP BY nombre HAVING COUNT(*) > 1;
```

---

### FASE 3: MIGRACIÓN DE PERSONAS
**Duración estimada**: 1 hora  
**Orden**: 2º (sin dependencias)

#### 3.1. Insertar personas
```bash
node scripts/migration/05_migrate_personas.js
```

**Proceso**:
1. Leer `personas_clean.json`
2. Generar folios secuenciales
3. Extraer fecha_nac y género de CURP
4. INSERT INTO personas
5. Guardar mapeo: `curp → uuid`

**Output**:
- `data/mapeo/personas_curp_to_uuid.json`

#### 3.2. Validación
```sql
-- Contar personas insertadas
SELECT COUNT(*) FROM personas;  -- Debe ser ~8,300

-- Verificar CURPs únicos
SELECT curp, COUNT(*) FROM personas GROUP BY curp HAVING COUNT(*) > 1;

-- Verificar fechas de nacimiento válidas
SELECT COUNT(*) FROM personas WHERE fecha_nac IS NULL OR fecha_nac > CURRENT_DATE;
```

---

### FASE 4: MIGRACIÓN DE EXPEDIENTES
**Duración estimada**: 45 minutos  
**Orden**: 3º (depende de grupos)

#### 4.1. Crear expedientes
```bash
node scripts/migration/06_migrate_expedientes.js
```

**Proceso**:
1. Por cada grupo, crear 1 expediente
2. Buscar grupo_id desde mapeo
3. Buscar asesora_id por nombre (tabla usuarios)
4. INSERT INTO expedientes
5. Guardar mapeo: `grupo_id → expediente_uuid`

**Output**:
- `data/mapeo/expedientes_grupo_to_uuid.json`

#### 4.2. Validación
```sql
-- Contar expedientes (debe ser = grupos)
SELECT COUNT(*) FROM expedientes;

-- Verificar todos tienen grupo_id
SELECT COUNT(*) FROM expedientes WHERE grupo_id IS NULL;

-- Verificar relación 1:1 con grupos
SELECT g.nombre, COUNT(e.id) as num_expedientes
FROM grupos g
LEFT JOIN expedientes e ON e.grupo_id = g.id
GROUP BY g.id, g.nombre
HAVING COUNT(e.id) != 1;
```

---

### FASE 5: MIGRACIÓN DE INTEGRANTES
**Duración estimada**: 1 hora  
**Orden**: 4º (depende de personas y expedientes)

#### 5.1. Insertar integrantes
```bash
node scripts/migration/07_migrate_integrantes.js
```

**Proceso**:
1. Leer `integrantes_clean.json`
2. Buscar persona_id desde mapeo (por CURP)
3. Buscar expediente_id desde mapeo (por grupo)
4. Asignar ciclo
5. Determinar estado según PAPELERIA COMP.
6. INSERT INTO integrantes

#### 5.2. Marcar tesoreras
```bash
node scripts/migration/08_mark_tesoreras.js
```

**Proceso**:
1. Leer hoja TESORERAS
2. Por cada CURP en TESORERAS:
   - Buscar persona_id
   - UPDATE integrantes SET es_tesorera = TRUE

#### 5.3. Validación
```sql
-- Contar integrantes
SELECT COUNT(*) FROM integrantes;  -- Debe ser 8,407

-- Verificar todos tienen persona_id y expediente_id
SELECT COUNT(*) FROM integrantes WHERE persona_id IS NULL OR expediente_id IS NULL;

-- Contar tesoreras
SELECT COUNT(*) FROM integrantes WHERE es_tesorera = TRUE;  -- Debe ser 6,695

-- Verificar no hay duplicados (misma persona en mismo expediente)
SELECT persona_id, expediente_id, COUNT(*)
FROM integrantes
GROUP BY persona_id, expediente_id
HAVING COUNT(*) > 1;
```

---

### FASE 6: MIGRACIÓN DE CRÉDITOS (OPCIONAL)
**Duración estimada**: 1 hora  
**Orden**: 5º (depende de expedientes)

#### 6.1. Crear tabla créditos
```bash
node scripts/migration/09_migrate_creditos.js
```

**Proceso**:
1. Leer datos de `BASE DE DATOS SEM 364.xlsm`
2. Vincular por nombre de grupo
3. INSERT INTO creditos

#### 6.2. Validación
```sql
-- Contar créditos
SELECT COUNT(*) FROM creditos;

-- Verificar montos
SELECT 
  COUNT(*) as total,
  MIN(monto_prestamo) as monto_min,
  MAX(monto_prestamo) as monto_max,
  AVG(monto_prestamo) as monto_promedio
FROM creditos;
```

---

### FASE 7: VALIDACIÓN FINAL
**Duración estimada**: 1 hora

#### 7.1. Verificar integridad referencial
```bash
node scripts/migration/10_validate_all.js
```

**Verificaciones**:
- ✅ Todas las FKs son válidas
- ✅ No hay registros huérfanos
- ✅ Conteos coinciden con Excel
- ✅ Sumas de montos coinciden

#### 7.2. Generar reporte de migración
```bash
node scripts/migration/11_generate_report.js
```

**Output**: `REPORTE_MIGRACION_[fecha].md`

**Contenido**:
- Total de registros migrados por tabla
- Registros con errores/advertencias
- Datos que no se pudieron migrar
- Estadísticas de calidad

---

## ROLLBACK EN CASO DE ERROR

### Si algo falla en FASE 0-1 (preparación):
```bash
# No hay datos en BD, solo reintentar
```

### Si algo falla en FASE 2-6 (migración):
```sql
-- Opción 1: Eliminar datos migrados
DELETE FROM integrantes WHERE created_at > '[fecha_inicio_migracion]';
DELETE FROM expedientes WHERE created_at > '[fecha_inicio_migracion]';
DELETE FROM personas WHERE created_at > '[fecha_inicio_migracion]';
DELETE FROM grupos WHERE created_at > '[fecha_inicio_migracion]';

-- Opción 2: Restaurar desde backup
psql -h [host] -U [user] -d [database] < backup_pre_migracion_[timestamp].sql
```

---

## ARCHIVOS GENERADOS

### Scripts de migración:
- `scripts/migration/01_extract_from_excel.js`
- `scripts/migration/02_clean_and_transform.js`
- `scripts/migration/03_validate_data.js`
- `scripts/migration/04_migrate_grupos.js`
- `scripts/migration/05_migrate_personas.js`
- `scripts/migration/06_migrate_expedientes.js`
- `scripts/migration/07_migrate_integrantes.js`
- `scripts/migration/08_mark_tesoreras.js`
- `scripts/migration/09_migrate_creditos.js` (opcional)
- `scripts/migration/10_validate_all.js`
- `scripts/migration/11_generate_report.js`

### Scripts SQL:
- `database/migrations/migration_001_schema_updates.sql`
- `database/migrations/migration_002_temp_tables.sql`
- `database/migrations/migration_003_cleanup.sql`

### Datos de staging:
- `data/staging/personas_raw.json`
- `data/staging/personas_clean.json`
- `data/staging/grupos_raw.json`
- `data/staging/grupos_clean.json`
- `data/staging/integrantes_raw.json`
- `data/staging/integrantes_clean.json`

### Mapeos:
- `data/mapeo/grupos_legacy_to_uuid.json`
- `data/mapeo/personas_curp_to_uuid.json`
- `data/mapeo/expedientes_grupo_to_uuid.json`

---

## ESTIMACIÓN TOTAL

| Fase | Duración | Crítico |
|------|----------|---------|
| Fase 0: Preparación | 2h | ⚠️ Sí |
| Fase 1: Extracción | 4h | ⚠️ Sí |
| Fase 2: Grupos | 30min | No |
| Fase 3: Personas | 1h | ⚠️ Sí |
| Fase 4: Expedientes | 45min | No |
| Fase 5: Integrantes | 1h | ⚠️ Sí |
| Fase 6: Créditos | 1h | No |
| Fase 7: Validación | 1h | ⚠️ Sí |
| **TOTAL** | **~11h** | - |

**Recomendación**: Ejecutar en horario no productivo (fin de semana)

---

## RESPONSABLES Y APROBACIONES

| Fase | Responsable | Requiere aprobación |
|------|-------------|---------------------|
| Fase 0 | DBA + Dev Lead | ✅ Sí (backup) |
| Fase 1-6 | Developer | No |
| Fase 7 | QA + Product Owner | ✅ Sí (validación) |

---

## CRITERIOS DE ÉXITO

- ✅ 100% de grupos migrados (~500)
- ✅ >95% de personas migradas (~8,300)
- ✅ 100% de expedientes creados (~500)
- ✅ >98% de integrantes migrados (8,407)
- ✅ 100% de tesoreras marcadas (6,695)
- ✅ 0 errores de integridad referencial
- ✅ Sumas de montos coinciden con Excel

---

## SIGUIENTE PASO

👉 **Revisar y aprobar este plan**  
👉 **Crear scripts SQL (migration_001, migration_002)**  
👉 **Crear scripts de extracción (01_extract_from_excel.js)**  
👉 **Ejecutar en ambiente de desarrollo primero**

---

**Actualizado**: 2026-08-02  
**Version**: 1.0  
**Status**: 📋 PENDIENTE APROBACIÓN  
