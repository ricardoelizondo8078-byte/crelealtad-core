# CHECKLIST PRE-MIGRACIÓN

**Fecha de creación**: 2026-08-02  
**Objetivo**: Verificar que TODO esté listo antes de ejecutar la migración

---

## ☑️ FASE 0: PREPARACIÓN DEL ENTORNO

### 0.1. Verificación de archivos Excel

- [ ] **Archivo 1 ubicado**: `BASE DE DATOS SEM 364.xlsm` está en el repositorio
- [ ] **Archivo 2 ubicado**: `BASEDATOS CRELEALTAD (1) (1).xlsx` está en el repositorio
- [ ] **Hoja correcta archivo 1**: Verificar que hoja "BASE DE DATOS" existe
- [ ] **Hoja correcta archivo 2**: Verificar que hoja "Hoja1" existe
- [ ] **Hoja tesoreras**: Verificar que hoja "TESORERAS" existe
- [ ] **No hay corrupción**: Ambos archivos se abren correctamente en Excel

**Comando para verificar**:
```powershell
Test-Path "C:\Users\Admin\Desktop\CRELEALTAD CORE\BASE DE DATOS SEM 364.xlsm"
Test-Path "C:\Users\Admin\Desktop\CRELEALTAD CORE\BASEDATOS CRELEALTAD (1) (1).xlsx"
```

---

### 0.2. Verificación de Base de Datos

- [ ] **Conexión a Supabase**: Verificar conectividad
- [ ] **Credenciales correctas**: Probar conexión con usuario migracion
- [ ] **Schema existe**: Verificar que schema `public` está disponible
- [ ] **Tablas base existen**: personas, grupos, expedientes, integrantes, usuarios

**Comando para verificar**:
```bash
# Desde NestJS
npm run test:db-connection

# O directamente con psql
psql -h [host] -U [user] -d [database] -c "SELECT version();"
```

---

### 0.3. Backup Completo

- [ ] **Backup de base de datos**: Ejecutar `pg_dump`
- [ ] **Guardar backup**: Copiar a ubicación segura
- [ ] **Verificar backup**: Comprobar que archivo no está vacío
- [ ] **Documentar ubicación**: Anotar ruta completa del backup

**Comando**:
```bash
pg_dump -h [host] -U [user] -d [database] -F c -b -v -f backup_pre_migracion_$(date +%Y%m%d_%H%M%S).dump
```

**Ubicación sugerida**: `C:\backups\crelealtad\backup_pre_migracion_[fecha].dump`

---

### 0.4. Verificación de Scripts SQL

- [ ] **Script existe**: `migration_001_schema_updates.sql`
- [ ] **Script existe**: `migration_002_temp_tables.sql`
- [ ] **Scripts sin errores de sintaxis**: Validar con editor SQL
- [ ] **Scripts revisados**: Por DBA o Lead Developer

**Comando para validar sintaxis**:
```bash
psql -h [host] -U [user] -d [database] --set=ON_ERROR_STOP=on --dry-run -f migration_001_schema_updates.sql
```

---

### 0.5. Dependencias de Node.js

- [ ] **Node.js instalado**: Versión >= 18
- [ ] **npm instalado**: Versión >= 9
- [ ] **Dependencias instaladas**: `npm install` ejecutado
- [ ] **Librería Excel instalada**: `xlsx` o `exceljs`
- [ ] **TypeORM configurado**: Conexión a Supabase funcional

**Comando**:
```bash
node --version  # Debe ser >= v18.0.0
npm --version   # Debe ser >= 9.0.0
npm install
```

**Dependencias necesarias**:
```json
{
  "xlsx": "^0.18.5",
  "date-fns": "^2.30.0"
}
```

---

## ☑️ FASE 1: EJECUCIÓN DE SCRIPTS SQL

### 1.1. Ejecutar migration_001_schema_updates.sql

- [ ] **Conectado a BD**: Como usuario con permisos DDL
- [ ] **Ejecutar script**: Sin errores
- [ ] **Verificar campos agregados**: `personas.direccion_completa` existe
- [ ] **Verificar tabla creditos**: Tabla `creditos` creada
- [ ] **Verificar índices**: Índices creados correctamente

**Comando**:
```bash
psql -h [host] -U [user] -d [database] -f database/migrations/migration_001_schema_updates.sql
```

**Verificación manual**:
```sql
-- Verificar campos en personas
\d personas

-- Verificar tabla creditos
\d creditos

-- Verificar índices
\di
```

---

### 1.2. Ejecutar migration_002_temp_tables.sql

- [ ] **Ejecutar script**: Sin errores
- [ ] **Verificar schema staging**: Schema `staging` creado
- [ ] **Verificar tablas staging**: 10+ tablas creadas
- [ ] **Verificar funciones**: Funciones `log_migration_error` y `start_migration_phase` creadas

**Comando**:
```bash
psql -h [host] -U [user] -d [database] -f database/migrations/migration_002_temp_tables.sql
```

**Verificación manual**:
```sql
-- Listar tablas staging
\dt staging.*

-- Verificar funciones
\df staging.*
```

---

## ☑️ FASE 2: VERIFICACIÓN DE DATOS

### 2.1. Conteo de registros en Excel

- [ ] **Contar Hoja1**: Registros totales (debe ser ~8,407)
- [ ] **Contar TESORERAS**: Registros totales (debe ser ~6,695)
- [ ] **Contar SEM 364**: Registros totales (debe ser ~500)

**Resultado esperado**:
```
Hoja1 (BASEDATOS CRELEALTAD): 8,407 registros
TESORERAS: 6,695 registros
BASE DE DATOS (SEM 364): ~500 registros
```

---

### 2.2. Verificación de datos en usuarios

- [ ] **Tabla usuarios poblada**: Debe tener al menos 11 registros (asesoras)
- [ ] **Nombres de asesoras**: HILDA, ANGEL, ELI, LUPITA, etc. existen
- [ ] **IDs disponibles**: UUIDs asignados

**Verificación**:
```sql
SELECT id, nombre, email FROM usuarios WHERE nombre IN ('HILDA', 'ANGEL', 'ELI', 'LUPITA', 'ANA VAZ', 'JULIETA', 'VICKY');
```

**Si falta**: Crear usuarios manualmente primero

---

## ☑️ FASE 3: CREACIÓN DE DIRECTORIOS

### 3.1. Directorios para staging

- [ ] **Directorio data/staging**: Creado
- [ ] **Directorio data/mapeo**: Creado
- [ ] **Directorio data/logs**: Creado
- [ ] **Directorio scripts/migration**: Creado

**Comando**:
```bash
mkdir -p data/staging data/mapeo data/logs scripts/migration
```

---

## ☑️ FASE 4: PERMISOS Y ACCESOS

### 4.1. Permisos de base de datos

- [ ] **Usuario tiene permisos SELECT**: En todas las tablas
- [ ] **Usuario tiene permisos INSERT**: En personas, grupos, expedientes, integrantes, creditos
- [ ] **Usuario tiene permisos UPDATE**: En integrantes (para marcar tesoreras)
- [ ] **Usuario tiene permisos CREATE**: Para tablas staging

**Verificación**:
```sql
-- Probar INSERT
INSERT INTO staging.personas_raw (nombre_completo, curp) VALUES ('TEST', 'TEST123456HDFRRL00');

-- Si falla, otorgar permisos
GRANT ALL ON SCHEMA staging TO [usuario];
GRANT ALL ON ALL TABLES IN SCHEMA staging TO [usuario];
```

---

### 4.2. Permisos de archivos

- [ ] **Lectura Excel**: Script tiene permisos para leer archivos .xlsx y .xlsm
- [ ] **Escritura JSON**: Script puede escribir en `data/staging/`
- [ ] **Escritura logs**: Script puede escribir en `data/logs/`

---

## ☑️ FASE 5: PLAN DE CONTINGENCIA

### 5.1. Plan de rollback

- [ ] **Backup creado**: Y ubicación documentada
- [ ] **Script rollback preparado**: Para revertir cambios
- [ ] **Tiempo de ventana**: Definir cuánto tiempo se tiene para migración
- [ ] **Contacto de soporte**: DBA disponible durante migración

**Script de rollback**:
```sql
-- Eliminar datos migrados
DELETE FROM integrantes WHERE created_at > '[fecha_inicio]';
DELETE FROM expedientes WHERE created_at > '[fecha_inicio]';
DELETE FROM personas WHERE created_at > '[fecha_inicio]';
DELETE FROM grupos WHERE created_at > '[fecha_inicio]';

-- O restaurar desde backup
-- pg_restore -h [host] -U [user] -d [database] backup_file.dump
```

---

### 5.2. Monitoreo durante migración

- [ ] **Log de errores activo**: `staging.migration_errors` visible
- [ ] **Estadísticas activas**: `staging.migration_stats` registrando
- [ ] **Consola visible**: Ver output de scripts en tiempo real
- [ ] **Herramienta de monitoreo**: pgAdmin o DBeaver abierto

---

## ☑️ FASE 6: VALIDACIONES PRE-EJECUCIÓN

### 6.1. Verificar datos actuales en BD

- [ ] **Contar personas actuales**: `SELECT COUNT(*) FROM personas;`
- [ ] **Contar grupos actuales**: `SELECT COUNT(*) FROM grupos;`
- [ ] **Contar expedientes actuales**: `SELECT COUNT(*) FROM expedientes;`
- [ ] **Contar integrantes actuales**: `SELECT COUNT(*) FROM integrantes;`

**Resultado actual**:
```
personas: ___ registros
grupos: ___ registros
expedientes: ___ registros
integrantes: ___ registros
```

---

### 6.2. Definir criterios de éxito

- [ ] **Meta personas**: Llegar a ~8,300 personas únicas
- [ ] **Meta grupos**: Llegar a ~500 grupos
- [ ] **Meta expedientes**: Llegar a ~500 expedientes
- [ ] **Meta integrantes**: Llegar a 8,407 integrantes
- [ ] **Meta tesoreras**: 6,695 marcadas con `es_tesorera = TRUE`
- [ ] **Tasa de error aceptable**: Definir (sugerido: <2%)

---

## ☑️ FASE 7: COMUNICACIÓN

### 7.1. Stakeholders informados

- [ ] **Product Owner notificado**: Sabe que habrá migración
- [ ] **Equipo de desarrollo notificado**: Por si hay errores
- [ ] **Usuarios finales notificados**: Si habrá downtime

---

### 7.2. Documentación disponible

- [ ] **PLAN_MAESTRO_MIGRACION.md**: Leído y entendido
- [ ] **MAPEO_DATOS_MIGRACION.md**: Disponible para consulta
- [ ] **ANALISIS_COMPLETO_INTEGRANTES.md**: Para referencia
- [ ] **ANALISIS_MIGRACION_SEM364.md**: Para referencia

---

## ☑️ FASE 8: TIMELINE

### 8.1. Horario de ejecución

- [ ] **Fecha definida**: _______________
- [ ] **Hora de inicio**: _______________
- [ ] **Ventana de mantenimiento**: ___ horas
- [ ] **Horario no productivo**: Preferible fin de semana

---

### 8.2. Recursos disponibles

- [ ] **Desarrollador principal**: Disponible durante migración
- [ ] **DBA**: Disponible en caso de emergencia
- [ ] **Computadora con recursos**: RAM >= 8GB, Disco >= 20GB libre

---

## ☑️ RESUMEN FINAL

### Antes de ejecutar, TODOS estos items deben estar marcados:

**CRÍTICOS** (bloquean migración):
- ✅ Backup de base de datos creado
- ✅ Archivos Excel verificados y accesibles
- ✅ Scripts SQL ejecutados sin errores
- ✅ Conexión a base de datos funcional
- ✅ Permisos de usuario correctos

**IMPORTANTES** (pueden continuar con advertencias):
- ⚠️ Usuarios/asesoras creados (se puede hacer manual después)
- ⚠️ Directorios creados (se crean automáticamente)
- ⚠️ Plan de rollback documentado

**OPCIONALES** (mejoran el proceso):
- ℹ️ Monitoreo configurado
- ℹ️ Stakeholders notificados
- ℹ️ Timeline definido

---

## 📋 SIGN-OFF

**Antes de ejecutar la migración, completar**:

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Desarrollador Lead | __________ | __________ | __________ |
| DBA (si aplica) | __________ | __________ | __________ |
| Product Owner | __________ | __________ | __________ |

---

## 🚀 COMANDO PARA INICIAR MIGRACIÓN

Una vez TODO esté verificado:

```bash
# Paso 1: Extraer datos de Excel
npm run migration:extract

# Paso 2: Limpiar y transformar
npm run migration:clean

# Paso 3: Validar datos
npm run migration:validate

# Paso 4: Migrar grupos
npm run migration:grupos

# Paso 5: Migrar personas
npm run migration:personas

# Paso 6: Migrar expedientes
npm run migration:expedientes

# Paso 7: Migrar integrantes
npm run migration:integrantes

# Paso 8: Marcar tesoreras
npm run migration:tesoreras

# Paso 9: Validación final
npm run migration:validate-all

# Paso 10: Generar reporte
npm run migration:report
```

---

**Creado**: 2026-08-02  
**Versión**: 1.0  
**Status**: 📋 CHECKLIST LISTO PARA USO  
