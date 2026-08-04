# 📝 INSTRUCCIONES: CORRECCIÓN SEMIAUTOMÁTICA DE NOMBRES

**Fecha**: 2026-08-02  
**Total personas**: 3,235  
**Correcciones propuestas**: 282  
**Sistema**: Semiautomático con revisión

---

## 🎯 RESUMEN DEL PROCESO

Se generaron **282 correcciones propuestas** divididas en:

- **188 ALTA Confianza** - Nombres compuestos conocidos (se pueden aplicar directamente)
- **10 MEDIA Confianza** - Requieren revisión rápida
- **84 BAJA Confianza** - Requieren revisión manual detallada

---

## ✅ PASO 1: REVISAR ARCHIVO EXCEL

### Ubicación:
```
C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA\data\logs\CORRECCIONES_PARA_REVISION.xlsx
```

### Hojas del archivo:

1. **INSTRUCCIONES** - Lee esto primero
2. **ALTA Confianza** (188 casos) - Revisa rápidamente
3. **Requieren Revisión** (94 casos) - Revisa con atención
4. **Todas las Correcciones** (282 casos) - Vista completa

---

## 📋 PASO 2: REVISAR Y APROBAR CORRECCIONES

### Hoja "ALTA Confianza"

Estos son casos de **nombres compuestos conocidos**:
- MARIA GUADALUPE
- MARIA DE JESUS
- MARIA DE LOURDES
- JOSE LUIS
- ROSA MARIA
- etc.

**Acción recomendada**: Revisar rápidamente y aprobar todos marcando "SI" en columna "aprobar"

### Hoja "Requieren Revisión"

Casos que necesitan validación manual:
- Apellidos compuestos (DE LA, DEL, etc.)
- Segundo nombre largo
- Casos complejos

**Acción recomendada**: Revisar cada uno individualmente

### Cómo marcar las aprobaciones:

En la columna **"aprobar"**:
- **SI** = Aplicar la corrección propuesta
- **NO** = NO cambiar, mantener como está
- **(vacío)** = Se ignora, no se aplica

---

## ✅ EJEMPLO DE REVISIÓN

### Caso de ALTA Confianza:

```
CURP: QUAG730714MCLNRD05

ACTUAL:
  primer_nombre: MARIA
  segundo_nombre: GUADALUPE
  apellido_pat: QUINTERO
  apellido_mat: ARREOLA

PROPUESTO:
  primer_nombre: MARIA GUADALUPE
  segundo_nombre: (vacío)
  apellido_pat: QUINTERO
  apellido_mat: ARREOLA

aprobar: SI  ← Marcar aquí
```

### Caso que Requiere Revisión:

```
CURP: ROHG760416MTSSND09

ACTUAL:
  primer_nombre: MA
  segundo_nombre: GUADALUPE DE LA
  apellido_pat: ROSA
  apellido_mat: HINOJOSA

PROPUESTO:
  primer_nombre: MA GUADALUPE
  segundo_nombre: (vacío)
  apellido_pat: DE LA ROSA
  apellido_mat: HINOJOSA

aprobar: SI  ← Revisar y decidir
```

---

## ✅ PASO 3: GUARDAR ARCHIVO EXCEL

1. Después de revisar, **guarda el archivo Excel**
2. Mantén el mismo nombre: `CORRECCIONES_PARA_REVISION.xlsx`
3. Mantén en la misma ubicación: `data/logs/`

---

## ✅ PASO 4: APLICAR CORRECCIONES

### Opción A: Usando npm (Recomendado)

```bash
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA"
npm run corregir:aplicar
```

### Opción B: Usando ts-node directamente

```bash
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA"
npx ts-node aplicar_correcciones.ts
```

### Qué hace el script:

1. Lee el archivo Excel
2. Filtra solo las correcciones marcadas con "SI"
3. Muestra resumen de lo que se aplicará
4. Aplica los cambios a la base de datos
5. Genera reporte de lo aplicado

---

## ✅ PASO 5: VERIFICAR RESULTADOS

Después de aplicar, el script mostrará:

```
✅ Correcciones aplicadas:
   Exitosas: 188
   Errores: 0

📄 Reporte de aplicación guardado: data/logs/reporte_aplicacion_[fecha].json
```

### Verificar en base de datos:

```sql
-- Ver algunos casos corregidos
SELECT 
  curp,
  primer_nombre,
  segundo_nombre,
  apellido_pat,
  apellido_mat
FROM personas
WHERE primer_nombre LIKE 'MARIA%'
  AND segundo_nombre IS NULL
LIMIT 10;
```

---

## 🔄 REVERTIR CAMBIOS (SI ES NECESARIO)

Si algo sale mal, puedes revertir:

### Opción 1: Restaurar desde backup

```bash
# Si hiciste backup antes de aplicar
psql -h localhost -U postgres -d crelealtad < backup_personas.sql
```

### Opción 2: Re-migrar personas

```bash
cd "C:\Users\Admin\Desktop\CRELEALTAD CORE\MIGRACION_COMPLETA"

# Truncar tabla personas
psql -h localhost -U postgres -d crelealtad -c "TRUNCATE TABLE personas CASCADE;"

# Re-ejecutar migración
npm run migration:personas
```

---

## 📊 ESTADÍSTICAS DE CORRECCIONES

### Por tipo de corrección:

| Tipo | Cantidad | Confianza | Acción |
|------|----------|-----------|--------|
| Nombres compuestos (MARIA GUADALUPE, etc.) | 188 | ALTA | Aplicar directamente |
| Apellidos compuestos (DE LA, DEL) | 10 | MEDIA | Revisar antes |
| Casos complejos | 84 | BAJA | Revisar manualmente |
| **TOTAL** | **282** | - | - |

### Ejemplos de correcciones ALTA confianza:

1. MARIA GUADALUPE → Unir en primer_nombre
2. MARIA DE JESUS → Unir en primer_nombre
3. MARIA DE LOURDES → Unir en primer_nombre
4. JOSE LUIS → Unir en primer_nombre
5. ROSA MARIA → Unir en primer_nombre

---

## ⚠️ IMPORTANTE

### Antes de aplicar:

- ✅ Revisar al menos las correcciones de ALTA confianza
- ✅ Revisar TODAS las de MEDIA/BAJA confianza
- ✅ Guardar el archivo Excel después de marcar aprobaciones
- ⚠️ Opcional: Hacer backup de la tabla personas

### Durante aplicación:

- El script solo aplicará las marcadas con "SI"
- Se generará un reporte detallado
- Los cambios son permanentes
- Se actualiza `updated_at` automáticamente

### Después de aplicar:

- Verificar en base de datos
- Revisar el reporte generado
- Confirmar que los cambios son correctos

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Abrir Excel**: `data/logs/CORRECCIONES_PARA_REVISION.xlsx`
2. ✅ **Revisar**: Hojas de ALTA Confianza y Requieren Revisión
3. ✅ **Marcar**: "SI" en columna "aprobar" para las que quieres aplicar
4. ✅ **Guardar**: El archivo Excel
5. ✅ **Ejecutar**: `npm run corregir:aplicar`
6. ✅ **Verificar**: Resultados en base de datos

---

## 📞 COMANDOS ÚTILES

```bash
# Generar nuevamente el archivo de correcciones (si necesitas)
npm run corregir:generar

# Aplicar correcciones después de revisar
npm run corregir:aplicar

# Ver personas con nombres compuestos en DB
psql -h localhost -U postgres -d crelealtad -c "
SELECT curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat
FROM personas
WHERE primer_nombre LIKE 'MARIA%'
LIMIT 20;
"
```

---

**Creado**: 2026-08-02  
**Sistema**: Corrección semiautomática con revisión  
**Estado**: ⏳ Esperando revisión y aprobación del archivo Excel
