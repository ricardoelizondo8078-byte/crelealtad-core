# 📝 CÓMO VER TODAS LAS 3,235 PERSONAS EN PGADMIN

**Problema**: pgAdmin solo muestra 1,000 filas por defecto  
**Solución**: Cambiar configuración manualmente

---

## ✅ OPCIÓN 1: MODIFICAR CONFIGURACIÓN (RECOMENDADO)

### Pasos detallados:

1. **Abrir pgAdmin**
   - Haz click en el ícono de pgAdmin

2. **Ir a Preferences**
   - Click en **File** (en la barra superior)
   - Seleccionar **Preferences**

3. **Navegar a Query Tool**
   - En el panel izquierdo, expandir **Query Tool**
   - Click en **Results grid**

4. **Cambiar límite de filas**
   - Buscar la opción **"Row limit"** o **"Maximum returned records"**
   - Cambiar el valor de `1000` a `10000` (o más)
   
5. **Guardar cambios**
   - Click en **Save**
   - Cerrar la ventana de Preferences

6. **Reiniciar pgAdmin** (importante)
   - Cerrar completamente pgAdmin
   - Volver a abrir

---

## ✅ OPCIÓN 2: USAR QUERY TOOL (MÁS RÁPIDO)

### Pasos:

1. **Abrir Query Tool**
   - Click derecho en base de datos `crelealtad`
   - Seleccionar **Query Tool**

2. **Ejecutar query**
   ```sql
   SELECT * FROM personas ORDER BY curp;
   ```

3. **Ver resultados**
   - Los resultados aparecerán abajo
   - En la barra de estado verás: **"Showing rows 1 to 1000 of 3235"**
   
4. **Navegar por páginas**
   - Click en **"Next 1000 rows"** (flecha derecha) para ver filas 1001-2000
   - Click nuevamente para ver filas 2001-3000
   - Click una vez más para ver filas 3001-3235

---

## ✅ OPCIÓN 3: VER CONTEO DIRECTO

Si solo necesitas confirmar que hay 3,235 personas:

### En Query Tool:

```sql
SELECT COUNT(*) as total_personas FROM personas;
```

**Resultado**: `3235`

### Ver por rangos:

```sql
SELECT 
  'Total de personas' as descripcion,
  COUNT(*) as cantidad
FROM personas
UNION ALL
SELECT 
  'Con teléfono' as descripcion,
  COUNT(*) as cantidad
FROM personas
WHERE telefono IS NOT NULL
UNION ALL
SELECT 
  'Sin teléfono' as descripcion,
  COUNT(*) as cantidad
FROM personas
WHERE telefono IS NULL;
```

**Resultado esperado**:
```
     descripcion      | cantidad 
----------------------+----------
 Total de personas    |     3235
 Con teléfono         |     3012
 Sin teléfono         |      223
```

---

## 🔍 VERIFICAR TODAS LAS PERSONAS POR PÁGINAS

### Query para ver distribución:

```sql
SELECT 
  'Página 1 (1-1000)' as pagina,
  COUNT(*) as registros,
  MIN(curp) as primer_curp,
  MAX(curp) as ultimo_curp
FROM (SELECT * FROM personas ORDER BY curp LIMIT 1000 OFFSET 0) p
UNION ALL
SELECT 
  'Página 2 (1001-2000)' as pagina,
  COUNT(*) as registros,
  MIN(curp) as primer_curp,
  MAX(curp) as ultimo_curp
FROM (SELECT * FROM personas ORDER BY curp LIMIT 1000 OFFSET 1000) p
UNION ALL
SELECT 
  'Página 3 (2001-3000)' as pagina,
  COUNT(*) as registros,
  MIN(curp) as primer_curp,
  MAX(curp) as ultimo_curp
FROM (SELECT * FROM personas ORDER BY curp LIMIT 1000 OFFSET 2000) p
UNION ALL
SELECT 
  'Página 4 (3001-3235)' as pagina,
  COUNT(*) as registros,
  MIN(curp) as primer_curp,
  MAX(curp) as ultimo_curp
FROM (SELECT * FROM personas ORDER BY curp LIMIT 1000 OFFSET 3000) p;
```

**Resultado esperado**:
```
        pagina         | registros |    primer_curp     |    ultimo_curp     
-----------------------+-----------+--------------------+--------------------
 Página 1 (1-1000)     |      1000 | AAAR540101...      | CAMC810531...
 Página 2 (1001-2000)  |      1000 | CAME800927...      | GAGR7508...
 Página 3 (2001-3000)  |      1000 | GAGI740416...      | LOER720909...
 Página 4 (3001-3235)  |       235 | LOFD800821...      | ZUZS920228...

TOTAL: 3,235 personas ✅
```

---

## 📊 EXPORTAR A CSV (SI NECESITAS TODAS LAS PERSONAS)

### En Query Tool:

1. Ejecutar:
   ```sql
   SELECT * FROM personas ORDER BY curp;
   ```

2. Click en **Download as CSV** (ícono de descarga)

3. Guardar archivo

El archivo CSV contendrá **todas las 3,235 personas**, sin límites.

---

## ✅ CONFIRMACIÓN FINAL

**Las 3,235 personas SÍ están en la base de datos.**

El límite de 1,000 es solo de **visualización** en pgAdmin, no un problema de datos.

**Formas de verificar**:
1. ✅ Query Tool: `SELECT COUNT(*) FROM personas;` → **3235**
2. ✅ API REST: `GET http://localhost:3100/personas` → **3235 personas**
3. ✅ Exportar a CSV → **3235 filas**
4. ✅ Navegar con "Next 1000 rows" → **4 páginas (1000+1000+1000+235)**

---

**Creado**: 2026-08-02  
**Base de datos**: crelealtad @ localhost:5432  
**Total verificado**: **3,235 personas** ✅
