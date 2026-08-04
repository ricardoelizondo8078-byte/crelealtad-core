# 🚀 MIGRACIÓN COMPLETA - CRELEALTAD

**Versión**: 1.0  
**Fecha**: 2026-08-02  
**Status**: ✅ LISTA PARA EJECUTAR

---

## 📋 CONTENIDO DE ESTA CARPETA

```
MIGRACION_COMPLETA/
├── README.md                          ← ESTE ARCHIVO (EMPEZAR AQUÍ)
├── package.json                       ← Dependencias y scripts npm
├── tsconfig.json                      ← Configuración TypeScript
├── .env.example                       ← Ejemplo de variables de entorno
│
├── docs/                              ← Documentación completa
│   ├── README_MIGRACION.md           ← Índice de documentación
│   ├── PLAN_MAESTRO_MIGRACION.md     ← Plan general
│   ├── CHECKLIST_PRE_MIGRACION.md    ← Checklist obligatorio
│   ├── MAPEO_DATOS_MIGRACION.md      ← Transformaciones
│   ├── ERRORES_COMUNES_MIGRACION.md  ← Troubleshooting
│   ├── ANALISIS_COMPLETO_INTEGRANTES.md
│   └── ANALISIS_MIGRACION_SEM364.md
│
├── sql/                               ← Scripts SQL
│   ├── migration_001_schema_updates.sql
│   └── migration_002_temp_tables.sql
│
├── scripts/migration/                 ← Scripts TypeScript
│   ├── config.ts                     ← Configuración
│   ├── utils.ts                      ← Utilidades
│   ├── 01_extract_from_excel.ts      ← Extracción
│   ├── 02_clean_and_transform.ts     ← Limpieza
│   ├── 03_validate_data.ts           ← Validación
│   ├── 04_migrate_grupos.ts          ← Migrar grupos
│   ├── 05_migrate_personas.ts        ← Migrar personas
│   ├── 06_migrate_expedientes.ts     ← Migrar expedientes
│   ├── 07_migrate_integrantes.ts     ← Migrar integrantes
│   ├── 08_mark_tesoreras.ts          ← Marcar tesoreras
│   ├── 09_migrate_creditos.ts        ← Migrar créditos
│   ├── 10_validate_all.ts            ← Validación final
│   └── 11_generate_report.ts         ← Generar reporte
│
└── data/                              ← Datos generados
    ├── staging/                      ← JSONs intermedios
    ├── mapeo/                        ← Mapeos UUID
    └── logs/                         ← Logs y reportes
```

---

## ⚡ INICIO RÁPIDO

### PASO 1: Instalación (5 minutos)

```bash
# 1. Navegar a esta carpeta
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA"

# 2. Instalar dependencias
npm install

# 3. Copiar y configurar variables de entorno
copy .env.example .env

# 4. Editar .env con tus credenciales
notepad .env
```

**Configurar en `.env`**:
```env
DB_HOST=tu-proyecto.supabase.co
DB_USER=postgres
DB_PASSWORD=tu-password-seguro
DB_NAME=postgres

EXCEL_INTEGRANTES=C:\Users\Admin\Desktop\CRELEALTAD CORE\BASEDATOS CRELEALTAD (1) (1).xlsx
EXCEL_SEM364=C:\Users\Admin\Desktop\CRELEALTAD CORE\BASE DE DATOS SEM 364.xlsm
```

---

### PASO 2: Preparación BD (10 minutos)

```bash
# 1. Hacer backup de la base de datos
# (Desde tu herramienta de BD o Supabase Dashboard)

# 2. Ejecutar scripts SQL
# Opción A: Desde psql
psql -h [host] -U postgres -d postgres -f sql/migration_001_schema_updates.sql
psql -h [host] -U postgres -d postgres -f sql/migration_002_temp_tables.sql

# Opción B: Desde Supabase Dashboard
# Copiar y ejecutar el contenido de los archivos SQL
```

---

### PASO 3: Ejecutar migración (1-2 horas)

#### Opción A: Ejecutar todo de una vez

```bash
npm run migration:all
```

#### Opción B: Ejecutar paso por paso (RECOMENDADO)

```bash
# 1. Extraer datos de Excel
npm run migration:extract

# 2. Limpiar y transformar
npm run migration:clean

# 3. Validar datos
npm run migration:validate

# 4. Migrar grupos
npm run migration:grupos

# 5. Migrar personas
npm run migration:personas

# 6. Migrar expedientes
npm run migration:expedientes

# 7. Migrar integrantes
npm run migration:integrantes

# 8. Marcar tesoreras
npm run migration:tesoreras

# 9. Migrar créditos (opcional)
npm run migration:creditos

# 10. Validación final
npm run migration:validate-all

# 11. Generar reporte
npm run migration:report
```

---

### PASO 4: Verificación (15 minutos)

```bash
# 1. Revisar reporte generado
# Ubicación: data/logs/REPORTE_MIGRACION_[fecha].md

# 2. Verificar en BD
# Ver sección "Verificación SQL" abajo
```

---

## 📊 VERIFICACIÓN SQL

Después de la migración, ejecutar estas queries:

```sql
-- Conteos
SELECT 
  (SELECT COUNT(*) FROM personas) as personas,
  (SELECT COUNT(*) FROM grupos) as grupos,
  (SELECT COUNT(*) FROM expedientes) as expedientes,
  (SELECT COUNT(*) FROM integrantes) as integrantes,
  (SELECT COUNT(*) FROM integrantes WHERE es_tesorera = TRUE) as tesoreras;

-- Integridad referencial
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

**Resultado esperado**:
- personas: ~8,300
- grupos: ~500
- expedientes: ~500
- integrantes: 8,407
- tesoreras: 6,695
- Todos los conteos de integridad: 0

---

## 📖 DOCUMENTACIÓN

### Antes de ejecutar (OBLIGATORIO):

1. **docs/CHECKLIST_PRE_MIGRACION.md** (15 min)
   - Verificar TODO antes de iniciar

2. **docs/PLAN_MAESTRO_MIGRACION.md** (30 min)
   - Entender las 7 fases

### Durante la ejecución:

3. **docs/ERRORES_COMUNES_MIGRACION.md**
   - Tener a mano para troubleshooting

### Para entender los datos:

4. **docs/ANALISIS_COMPLETO_INTEGRANTES.md**
5. **docs/ANALISIS_MIGRACION_SEM364.md**
6. **docs/MAPEO_DATOS_MIGRACION.md**

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### 🔴 CRÍTICO

- ✅ **HACER BACKUP** antes de ejecutar
- ✅ **PROBAR EN DESARROLLO** primero, NO en producción
- ✅ **LEER EL CHECKLIST** completo

### 🟡 RECOMENDACIONES

- ⚠️ Ejecutar en horario no productivo
- ⚠️ Tener DBA disponible durante migración
- ⚠️ Monitorear logs en tiempo real
- ⚠️ No interrumpir la migración una vez iniciada

---

## 🆘 SI ALGO FALLA

### Si falla en FASE 1-3 (preparación/validación):

```bash
# No hay datos en BD, solo reintentar
npm run migration:clean
npm run migration:validate
```

### Si falla en FASE 4-9 (migración):

**Opción 1: Limpiar y reintentar**

```sql
-- Eliminar datos migrados (cuidado!)
DELETE FROM integrantes WHERE created_at > '2026-08-02 08:00:00';
DELETE FROM expedientes WHERE created_at > '2026-08-02 08:00:00';
DELETE FROM personas WHERE created_at > '2026-08-02 08:00:00';
DELETE FROM grupos WHERE created_at > '2026-08-02 08:00:00';
```

**Opción 2: Restaurar backup** (RECOMENDADO)

```bash
# Restaurar desde backup
psql -h [host] -U postgres -d postgres < backup_pre_migracion.sql
```

### Consultar documentación:

```bash
# Ver errores comunes
cat docs/ERRORES_COMUNES_MIGRACION.md
```

---

## 📞 SOPORTE

| Problema | Solución |
|----------|----------|
| Error de conexión BD | Verificar credenciales en `.env` |
| Archivo Excel no encontrado | Verificar rutas en `.env` |
| CURP inválido | Ver `data/logs/errores_limpieza.json` |
| Integridad referencial rota | Ver `docs/ERRORES_COMUNES_MIGRACION.md` |
| Timeout | Reducir `BATCH_SIZE` en `.env` |

---

## ✅ CRITERIOS DE ÉXITO

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| Personas migradas | >95% (~8,300) | ✅ Sí |
| Grupos migrados | 100% (~500) | ✅ Sí |
| Integrantes migrados | >98% (8,407) | ✅ Sí |
| Tesoreras marcadas | 100% (6,695) | ⚠️ No |
| Errores de integridad | 0 | ✅ Sí |

---

## 📈 ESTIMACIÓN DE TIEMPO

| Fase | Tiempo | Pausable |
|------|--------|----------|
| Instalación | 5 min | ✅ Sí |
| Preparación BD | 10 min | ✅ Sí |
| Extracción | 2-5 min | ✅ Sí |
| Limpieza | 1-2 min | ✅ Sí |
| Validación | 1 min | ✅ Sí |
| Migración grupos | 1-2 min | ⚠️ No |
| Migración personas | 10-15 min | ⚠️ No |
| Migración expedientes | 1-2 min | ⚠️ No |
| Migración integrantes | 15-20 min | ⚠️ No |
| Marcar tesoreras | 5-10 min | ⚠️ No |
| Validación final | 1 min | ✅ Sí |
| **TOTAL** | **~1-2 horas** | - |

---

## 🎯 SIGUIENTE PASO

1. **Leer** `docs/CHECKLIST_PRE_MIGRACION.md`
2. **Configurar** `.env` con tus credenciales
3. **Ejecutar** `npm install`
4. **Hacer** backup de la BD
5. **Ejecutar** scripts SQL
6. **Iniciar** migración con `npm run migration:extract`

---

**Creado**: 2026-08-02  
**Versión**: 1.0  
**Status**: ✅ LISTO PARA USAR  

**IMPORTANTE**: Lee la documentación en `docs/` antes de ejecutar.

