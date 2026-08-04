# 📝 INSTRUCCIONES PASO A PASO - MIGRACIÓN CRELEALTAD

**Para ejecutar la migración sin errores**

---

## 🎯 OBJETIVO

Migrar **8,407 integrantes** desde archivos Excel a la base de datos PostgreSQL.

---

## ⏱️ TIEMPO TOTAL: 2-3 HORAS

---

## 📋 PASO 1: PREPARACIÓN INICIAL (30 minutos)

### 1.1. Verificar archivos Excel

```powershell
# Verificar que ambos archivos existan
Test-Path "C:\Users\Admin\Desktop\CRELEALTAD CORE\BASEDATOS CRELEALTAD (1) (1).xlsx"
Test-Path "C:\Users\Admin\Desktop\CRELEALTAD CORE\BASE DE DATOS SEM 364.xlsm"
```

✅ **Debe decir**: `True` para ambos

---

### 1.2. Instalar dependencias

```powershell
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA"
npm install
```

✅ **Esperar**: ~1-2 minutos  
✅ **Debe decir**: "added X packages"

---

### 1.3. Configurar variables de entorno

```powershell
# Copiar ejemplo
copy .env.example .env

# Abrir para editar
notepad .env
```

**Editar con tus datos**:

```env
# Supabase
DB_HOST=tu-proyecto-id.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu-password-seguro
DB_NAME=postgres

# Rutas Excel (verificar que sean correctas)
EXCEL_INTEGRANTES=C:\Users\Admin\Desktop\CRELEALTAD CORE\BASEDATOS CRELEALTAD (1) (1).xlsx
EXCEL_SEM364=C:\Users\Admin\Desktop\CRELEALTAD CORE\BASE DE DATOS SEM 364.xlsm

# Configuración
BATCH_SIZE=500
LOG_LEVEL=info
DRY_RUN=false
```

✅ **Guardar** y cerrar

---

### 1.4. Hacer BACKUP de base de datos

**OPCIÓN A: Desde Supabase Dashboard**

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Database → Backups
4. Clic en "Create backup"
5. ✅ Esperar confirmación

**OPCIÓN B: Desde línea de comandos**

```powershell
pg_dump -h tu-proyecto.supabase.co -U postgres -d postgres > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

✅ **Verificar**: Archivo .sql creado

---

### 1.5. Ejecutar scripts SQL

**Conectar a Supabase**:

1. Ir a Supabase Dashboard → SQL Editor
2. Clic en "New query"

**Script 1: Actualizar schema**

```sql
-- Copiar COMPLETO de: sql/migration_001_schema_updates.sql
-- Pegar en SQL Editor
-- Clic en "Run"
```

✅ **Debe decir**: "Success. No rows returned"  
✅ **O**: "MIGRATION 001: Verificación exitosa"

**Script 2: Crear tablas staging**

```sql
-- Copiar COMPLETO de: sql/migration_002_temp_tables.sql
-- Pegar en SQL Editor
-- Clic en "Run"
```

✅ **Debe decir**: "MIGRATION 002: Verificación exitosa"

---

## 🚀 PASO 2: EJECUTAR MIGRACIÓN (1-2 horas)

### 2.1. Extracción de Excel (2-5 minutos)

```powershell
npm run migration:extract
```

✅ **Debe mostrar**:
```
[INFO] === FASE 1: EXTRACCIÓN DE EXCEL ===
[INFO] Archivos Excel encontrados ✓
[INFO] ✓ Hoja1: 8407 registros
[INFO] ✓ TESORERAS: 6695 registros
[SUCCESS] === EXTRACCIÓN COMPLETADA ===
```

✅ **Verificar archivos creados**:
- `data/staging/integrantes_raw.json`
- `data/staging/tesoreras_raw.json`
- `data/staging/grupos_raw.json`
- `data/staging/creditos_raw.json`

---

### 2.2. Limpieza y transformación (1-2 minutos)

```powershell
npm run migration:clean
```

✅ **Debe mostrar**:
```
[INFO] === FASE 2: LIMPIEZA Y TRANSFORMACIÓN ===
[INFO] ✓ Personas limpiadas: ~8300
[SUCCESS] === LIMPIEZA COMPLETADA ===
```

✅ **Verificar**:
- `data/staging/personas_clean.json`
- `data/staging/grupos_clean.json`
- `data/logs/errores_limpieza.json`

---

### 2.3. Validación de datos (1 minuto)

```powershell
npm run migration:validate
```

✅ **Debe terminar con**:
```
[SUCCESS] ✓ DATOS VÁLIDOS - SE PUEDE CONTINUAR CON MIGRACIÓN
```

⚠️ **Si dice errores críticos**:
- ❌ **NO CONTINUAR**
- Ver `data/logs/validaciones.json`
- Corregir problemas
- Re-ejecutar limpieza y validación

---

### 2.4. Migrar grupos (1-2 minutos)

```powershell
npm run migration:grupos
```

✅ **Debe mostrar**:
```
[INFO] Conexión a BD exitosa ✓
[SUCCESS] === MIGRACIÓN DE GRUPOS COMPLETADA ===
[INFO] Grupos insertados: ~500
[INFO] Total grupos en BD: ~500
```

✅ **Verificar**:
- `data/mapeo/grupos_legacy_to_uuid.json` creado

---

### 2.5. Migrar personas (10-15 minutos)

```powershell
npm run migration:personas
```

✅ **Debe mostrar progreso**:
```
[INFO] Personas únicas (por CURP): ~8300
[INFO] Progreso: 500/8300
[INFO] Progreso: 1000/8300
...
[SUCCESS] === MIGRACIÓN DE PERSONAS COMPLETADA ===
[INFO] Personas insertadas: ~8300
```

✅ **Verificar**:
- `data/mapeo/personas_curp_to_uuid.json` creado

---

### 2.6. Migrar expedientes (1-2 minutos)

```powershell
npm run migration:expedientes
```

✅ **Debe mostrar**:
```
[SUCCESS] === MIGRACIÓN DE EXPEDIENTES COMPLETADA ===
[INFO] Expedientes insertados: ~500
```

✅ **Verificar**:
- `data/mapeo/expedientes_grupo_to_uuid.json` creado

---

### 2.7. Migrar integrantes (15-20 minutos)

```powershell
npm run migration:integrantes
```

✅ **Debe mostrar progreso**:
```
[INFO] Integrantes a migrar: 8407
[INFO] Progreso: 500/8407
[INFO] Progreso: 1000/8407
...
[SUCCESS] === MIGRACIÓN DE INTEGRANTES COMPLETADA ===
[INFO] Integrantes insertados: ~8407
```

---

### 2.8. Marcar tesoreras (5-10 minutos)

```powershell
npm run migration:tesoreras
```

✅ **Debe mostrar**:
```
[SUCCESS] === MARCADO DE TESORERAS COMPLETADO ===
[INFO] Integrantes marcados como tesoreras: ~6695
[INFO] Total tesoreras en BD: ~6695
```

---

### 2.9. Migrar créditos - OPCIONAL (10-15 minutos)

```powershell
npm run migration:creditos
```

✅ **Puede saltarse si no necesita datos financieros**

---

### 2.10. Validación final (1 minuto)

```powershell
npm run migration:validate-all
```

✅ **Debe mostrar**:
```
[SUCCESS] === VALIDACIÓN FINAL COMPLETADA ===
[INFO] Errores críticos: 0
[INFO] Advertencias: X
[SUCCESS] ✅ MIGRACIÓN EXITOSA - SIN ERRORES CRÍTICOS
```

⚠️ **Si hay errores críticos**:
- Ver `data/logs/validacion_final.json`
- Revisar integridad referencial
- Puede requerir rollback

---

### 2.11. Generar reporte (30 segundos)

```powershell
npm run migration:report
```

✅ **Debe crear**:
- `data/logs/REPORTE_MIGRACION_[fecha].md`

**Abrir reporte**:
```powershell
notepad data/logs/REPORTE_MIGRACION_*.md
```

---

## ✅ PASO 3: VERIFICACIÓN (15 minutos)

### 3.1. Verificar conteos en BD

**Ejecutar en Supabase SQL Editor**:

```sql
SELECT 
  (SELECT COUNT(*) FROM personas) as personas,
  (SELECT COUNT(*) FROM grupos) as grupos,
  (SELECT COUNT(*) FROM expedientes) as expedientes,
  (SELECT COUNT(*) FROM integrantes) as integrantes,
  (SELECT COUNT(*) FROM integrantes WHERE es_tesorera = TRUE) as tesoreras;
```

✅ **Resultado esperado**:
```
personas:     ~8,300
grupos:       ~500
expedientes:  ~500
integrantes:  8,407
tesoreras:    6,695
```

---

### 3.2. Verificar integridad referencial

```sql
-- NO debe devolver filas
SELECT 'Integrantes sin persona' as issue, COUNT(*) as count
FROM integrantes i
LEFT JOIN personas p ON p.id = i.persona_id
WHERE p.id IS NULL

UNION ALL

SELECT 'Integrantes sin expediente', COUNT(*)
FROM integrantes i
LEFT JOIN expedientes e ON e.id = i.expediente_id
WHERE e.id IS NULL

UNION ALL

SELECT 'Expedientes sin grupo', COUNT(*)
FROM expedientes e
LEFT JOIN grupos g ON g.id = e.grupo_id
WHERE g.id IS NULL;
```

✅ **Todos los conteos deben ser 0**

---

### 3.3. Verificar datos de muestra

```sql
-- Ver primeras 5 personas
SELECT 
  curp, 
  primer_nombre, 
  apellido_pat, 
  telefono, 
  monto_solicitado
FROM personas
LIMIT 5;

-- Ver primeros 5 grupos
SELECT nombre, estado
FROM grupos
LIMIT 5;

-- Ver primeros 5 integrantes con sus datos
SELECT 
  p.primer_nombre,
  p.apellido_pat,
  g.nombre as grupo,
  i.ciclo,
  i.es_tesorera
FROM integrantes i
JOIN personas p ON p.id = i.persona_id
JOIN expedientes e ON e.id = i.expediente_id
JOIN grupos g ON g.id = e.grupo_id
LIMIT 5;
```

✅ **Debe mostrar datos coherentes**

---

## 🎉 PASO 4: FINALIZACIÓN

### Si TODO está OK:

```powershell
Write-Host "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
```

✅ **Ya puedes**:
- Usar los datos en la aplicación
- Eliminar archivos staging (opcional)
- Celebrar 🎉

---

### Si hubo errores:

1. **Revisar** `data/logs/REPORTE_MIGRACION_*.md`
2. **Ver** `docs/ERRORES_COMUNES_MIGRACION.md`
3. **Decidir**:
   - Corregir errores manualmente
   - Hacer rollback y reintentar

---

## 🆘 ROLLBACK (Solo si es necesario)

### Restaurar desde backup

**Supabase Dashboard**:
1. Database → Backups
2. Seleccionar backup anterior
3. Restore

**O desde línea de comandos**:

```powershell
psql -h tu-proyecto.supabase.co -U postgres -d postgres < backup_[fecha].sql
```

---

## 📊 RESUMEN DE COMANDOS

```powershell
# PREPARACIÓN
npm install
copy .env.example .env
notepad .env

# MIGRACIÓN
npm run migration:extract
npm run migration:clean
npm run migration:validate
npm run migration:grupos
npm run migration:personas
npm run migration:expedientes
npm run migration:integrantes
npm run migration:tesoreras
npm run migration:creditos        # OPCIONAL
npm run migration:validate-all
npm run migration:report

# O TODO DE UNA VEZ (no recomendado para primera vez)
npm run migration:all
```

---

## ✅ CHECKLIST FINAL

- [ ] Backup creado
- [ ] Scripts SQL ejecutados
- [ ] `.env` configurado
- [ ] Extracción exitosa
- [ ] Limpieza exitosa
- [ ] Validación sin errores críticos
- [ ] Grupos migrados (~500)
- [ ] Personas migradas (~8,300)
- [ ] Expedientes migrados (~500)
- [ ] Integrantes migrados (8,407)
- [ ] Tesoreras marcadas (6,695)
- [ ] Validación final: 0 errores
- [ ] Reporte generado
- [ ] Verificación SQL OK
- [ ] Integridad referencial OK

---

**¡LISTO! MIGRACIÓN COMPLETA**

---

**Creado**: 2026-08-02  
**Última actualización**: 2026-08-02  
