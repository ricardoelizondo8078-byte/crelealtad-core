## 🔧 Instrucciones para Aplicar Correcciones de Schema

**Proyecto:** CRELEALTAD CORE  
**Objetivo:** Corregir discrepancias entre entidades TypeORM y schema PostgreSQL  
**Fecha:** 2026-07-23

---

## ⚠️ ANTES DE COMENZAR

### 1. Hacer Backup de la Base de Datos

```bash
# Conectar a PostgreSQL y crear backup
pg_dump -h localhost -U postgres -d crelealtad_db -F c -b -v -f "backup_crelealtad_$(date +%Y%m%d_%H%M%S).backup"

# O backup en formato SQL
pg_dump -h localhost -U postgres -d crelealtad_db > "backup_crelealtad_$(date +%Y%m%d_%H%M%S).sql"
```

### 2. Verificar Estado Actual

```bash
cd apps/api/src/migrations/schema-v2
psql -h localhost -U postgres -d crelealtad_db -f ../../../analisis-discrepancias.sql
```

Esto mostrará el estado actual de todas las tablas.

---

## 📋 OPCIÓN 1: Aplicación Automática (Recomendada)

### Paso 1: Ejecutar Script Maestro

```bash
cd apps/api/src/migrations/schema-v2
psql -h localhost -U postgres -d crelealtad_db -f APLICAR-CORRECCIONES.sql
```

Este script:
- ✅ Inicia una transacción
- ✅ Aplica todas las correcciones en orden
- ✅ Muestra verificaciones en cada paso
- ⏸️ Pausa para revisión antes de confirmar

### Paso 2: Revisar Resultados

El script mostrará:
- Estado de cada tabla ANTES y DESPUÉS
- Columnas en camelCase detectadas (debería estar vacío)
- Columnas con sufijo `_nuevo` (debería estar vacío)
- Foreign keys actualizadas

### Paso 3: Confirmar o Revertir

Si todo se ve bien:
```sql
COMMIT;
```

Si algo salió mal:
```sql
ROLLBACK;
```

---

## 📋 OPCIÓN 2: Aplicación Manual (Paso a Paso)

### Fase 1: Corregir Tabla PERSONAS

```bash
psql -h localhost -U postgres -d crelealtad_db -f 09-fix-personas-columns.sql
```

**Verifica:**
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'personas' AND column_name IN ('telefono', 'monto_solicitado');
```

Deberías ver:
```
   column_name    |  data_type
------------------+---------------
 telefono         | character varying
 monto_solicitado | numeric
```

---

### Fase 2: Corregir Tabla DOCUMENTOS

```bash
psql -h localhost -U postgres -d crelealtad_db -f 10-fix-documentos-naming.sql
```

**Verifica:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY column_name;
```

**NO deberías ver:**
- ❌ `solicitanteId`
- ❌ `archivoBase64`
- ❌ `archivoNombre`
- ❌ `fechaCarga`
- ❌ `createdAt`
- ❌ `updatedAt`

**SÍ deberías ver:**
- ✅ `integrante_id`
- ✅ `archivo_base64`
- ✅ `archivo_nombre`
- ✅ `fecha_carga`
- ✅ `created_at`
- ✅ `updated_at`

---

### Fase 3: Corregir Tabla SOLICITUDES

```bash
psql -h localhost -U postgres -d crelealtad_db -f 11-fix-solicitudes-naming.sql
```

**Verifica:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'solicitudes'
  AND (column_name ~ '[A-Z]' OR column_name LIKE '%_nuevo')
ORDER BY column_name;
```

**Resultado esperado:** Sin filas (lista vacía)

---

## 🔄 Actualizar Entidades TypeORM

### Paso 1: Reemplazar Entidades

```bash
cd apps/api/src

# Backup de archivos originales
cp documentos/documento.entity.ts documentos/documento.entity.BACKUP.ts
cp solicitudes/solicitud.entity.ts solicitudes/solicitud.entity.BACKUP.ts

# Aplicar versiones corregidas
cp documentos/documento.entity.FIXED.ts documentos/documento.entity.ts
cp solicitudes/solicitud.entity.FIXED.ts solicitudes/solicitud.entity.ts
```

### Paso 2: Actualizar Servicios que Usan las Entidades

Buscar y reemplazar en los servicios:

#### Para `documentos.service.ts`:
```typescript
// ❌ ANTES
solicitanteId → integrante_id
archivoBase64 → archivo_base64
archivoNombre → archivo_nombre
fechaCarga → fecha_carga
createdAt → created_at
updatedAt → updated_at
```

#### Para `solicitudes.service.ts`:
```typescript
// ❌ ANTES (en queries o asignaciones)
fechaNacimiento → fecha_nac
estadoCivil → estado_civil
nivelEstudio → nivel_estudio
estado_nacimiento_nuevo → estado_nacimiento
negocio_giro_nuevo → negocio_giro
negocio_gastos_nuevo → negocio_gastos
```

### Paso 3: Buscar Referencias en Todo el Proyecto

```bash
# Buscar usos de nombres antiguos
cd apps/api
grep -r "solicitanteId" src/
grep -r "archivoBase64" src/
grep -r "fechaNacimiento" src/
grep -r "_nuevo" src/
```

Reemplazar cada ocurrencia con el nombre correcto en snake_case.

---

## ✅ Verificación Post-Aplicación

### 1. Verificar Schema con TypeORM

```bash
cd apps/api
npm run typeorm:schema:log
```

Esto mostrará el schema que TypeORM espera crear.

### 2. Comparar con Base de Datos

```bash
npm run typeorm:schema:sync -- --dry-run
```

**Resultado esperado:** Sin cambios pendientes

### 3. Ejecutar Tests

```bash
npm run test
npm run test:e2e
```

### 4. Probar API Manualmente

```bash
# Iniciar servidor
npm run start:dev

# Probar endpoints críticos
curl http://localhost:3000/api/personas
curl http://localhost:3000/api/grupos
curl http://localhost:3000/api/expedientes
curl http://localhost:3000/api/integrantes
curl http://localhost:3000/api/solicitudes
curl http://localhost:3000/api/documentos
```

---

## 🚨 Solución de Problemas

### Problema: "Column does not exist"

**Síntoma:**
```
ERROR: column "solicitanteId" does not exist
```

**Causa:** El código TypeScript aún usa nombres antiguos

**Solución:**
```bash
# Buscar en todo el proyecto
grep -r "solicitanteId" apps/api/src/
# Reemplazar con: integrante_id
```

---

### Problema: "Relation does not exist"

**Síntoma:**
```
ERROR: relation "documentos_solicitanteId_fkey" does not exist
```

**Causa:** Foreign key con nombre antiguo

**Solución:**
```sql
-- Verificar constraints existentes
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'documentos' AND constraint_type = 'FOREIGN KEY';

-- Eliminar constraint antiguo si existe
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS "documentos_solicitanteId_fkey";
```

---

### Problema: TypeORM quiere crear/modificar tablas

**Síntoma:**
```
npm run typeorm:schema:sync -- --dry-run
Shows: ALTER TABLE documentos ADD COLUMN integrante_id...
```

**Causa:** Las entidades TypeORM no coinciden con la DB

**Solución:**
1. Verifica que aplicaste TODAS las migraciones SQL
2. Verifica que reemplazaste los archivos `.entity.ts` con las versiones `.FIXED.ts`
3. Reinicia el servidor de desarrollo

---

## 📊 Checklist de Validación Final

- [ ] Backup de base de datos creado
- [ ] Script `APLICAR-CORRECCIONES.sql` ejecutado exitosamente
- [ ] No existen columnas en camelCase en la DB
- [ ] No existen columnas con sufijo `_nuevo`
- [ ] Entidades TypeORM actualizadas (`.FIXED.ts` → `.entity.ts`)
- [ ] Servicios actualizados (sin referencias a nombres antiguos)
- [ ] DTOs actualizados (si es necesario)
- [ ] `typeorm:schema:sync --dry-run` no muestra cambios
- [ ] Tests pasan correctamente
- [ ] API responde correctamente en todos los endpoints
- [ ] Frontend funciona sin errores (si aplica)

---

## 📚 Archivos Creados/Modificados

### Archivos de Análisis:
- ✅ `ANALISIS_DISCREPANCIAS_SCHEMA.md` - Análisis detallado de problemas
- ✅ `analisis-discrepancias.sql` - Script de verificación de schema

### Scripts de Corrección SQL:
- ✅ `apps/api/src/migrations/schema-v2/09-fix-personas-columns.sql`
- ✅ `apps/api/src/migrations/schema-v2/10-fix-documentos-naming.sql`
- ✅ `apps/api/src/migrations/schema-v2/11-fix-solicitudes-naming.sql`
- ✅ `apps/api/src/migrations/schema-v2/APLICAR-CORRECCIONES.sql`

### Entidades TypeORM Corregidas:
- ✅ `apps/api/src/documentos/documento.entity.FIXED.ts`
- ✅ `apps/api/src/solicitudes/solicitud.entity.FIXED.ts`

### Documentación:
- ✅ `INSTRUCCIONES_CORRECCION_SCHEMA.md` - Este archivo

---

## 🎯 Próximos Pasos Recomendados

### 1. Después de Aplicar Correcciones

- Generar migraciones TypeORM para mantener sincronización:
  ```bash
  npm run typeorm:migration:generate -- -n PostSchemaV2Fixes
  ```

- Documentar los cambios en el changelog del proyecto

### 2. Prevención Futura

- Agregar linter/validator para detectar camelCase en columnas
- Crear script de CI que valide schema vs entidades
- Documentar convención de nomenclatura en CONTRIBUTING.md

### 3. Monitoreo

- Revisar logs de aplicación post-deployment
- Monitorear errores de base de datos
- Validar que queries complejas sigan funcionando

---

## 💬 Soporte

Si encuentras problemas durante la aplicación:

1. **NO ejecutes COMMIT** hasta estar seguro
2. Ejecuta `ROLLBACK;` si algo salió mal
3. Revisa los logs de PostgreSQL: `/var/log/postgresql/`
4. Verifica el backup antes de reintentar

---

## 📞 Contacto

Cualquier duda sobre estas correcciones, consulta:
- `ANALISIS_DISCREPANCIAS_SCHEMA.md` para detalles técnicos
- Documentación de TypeORM: https://typeorm.io
- PostgreSQL docs: https://www.postgresql.org/docs/

---

**¡Éxito con las correcciones!** 🚀
