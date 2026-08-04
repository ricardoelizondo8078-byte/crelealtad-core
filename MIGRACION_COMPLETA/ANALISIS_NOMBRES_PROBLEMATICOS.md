# 🔍 ANÁLISIS DE NOMBRES PROBLEMÁTICOS EN TABLA PERSONAS

**Fecha**: 2026-08-02  
**Total personas**: 3,235  
**Registros con problemas**: ~601 (18.58%)

---

## 📊 TIPOS DE PROBLEMAS DETECTADOS

### 1. Nombres Compuestos mal Divididos (Mayor problema)

**Ejemplos encontrados**:

```
❌ ACTUAL:
   primer_nombre: "MARIA"
   segundo_nombre: "GUADALUPE"
   apellido_pat: "QUINTERO"

✅ DEBERÍA SER:
   primer_nombre: "MARIA GUADALUPE"
   segundo_nombre: null
   apellido_pat: "QUINTERO"
```

**Casos comunes**:
- MARIA GUADALUPE → dividido incorrectamente
- MARIA DE JESUS → dividido incorrectamente
- MARIA DE LOURDES → dividido incorrectamente
- MA GUADALUPE → dividido incorrectamente
- JOSE LUIS → dividido incorrectamente
- ROSA MARIA → dividido incorrectamente

**Total estimado**: ~317 registros con "DE" en segundo_nombre

---

### 2. Apellidos Compuestos con Partículas

**Ejemplos encontrados**:

```
❌ ACTUAL (ROHG760416):
   primer_nombre: "MA"
   segundo_nombre: "GUADALUPE DE LA"
   apellido_pat: "ROSA"
   apellido_mat: "HINOJOSA"

✅ DEBERÍA SER:
   primer_nombre: "MA GUADALUPE"
   segundo_nombre: null
   apellido_pat: "DE LA ROSA"
   apellido_mat: "HINOJOSA"
```

**Partículas comunes**:
- DE LA (ej: DE LA ROSA, DE LA GARZA)
- DEL (ej: DEL TORO, DEL CARMEN)
- DE (ej: DE JESUS cuando es apellido)
- DE LOS/DE LAS (ej: DE LOS SANTOS)

---

### 3. Segundo Nombre Mezclado con Apellidos

**Ejemplo encontrado**:

```
❌ ACTUAL (VARC940623):
   primer_nombre: "CLARIZA"
   segundo_nombre: "MELINA VARGAS"
   apellido_pat: "VARGAS"
   apellido_mat: "ROMO"

✅ DEBERÍA SER:
   primer_nombre: "CLARIZA"
   segundo_nombre: "MELINA"
   apellido_pat: "VARGAS"
   apellido_mat: "ROMO"
```

---

### 4. Comas en Apellidos

**Ejemplo encontrado**:

```
❌ ACTUAL (CACT720430):
   apellido_mat: "CARRILLO,CORONADO"

✅ DEBERÍA SER:
   apellido_mat: "CORONADO"
```

**Total encontrado**: 1 registro

---

## 🎯 ESTRATEGIA DE CORRECCIÓN RECOMENDADA

### Opción 1: Corrección Manual (MÁS SEGURO)

Dado que son solo **601 registros** con problemas (18.58%), se recomienda:

1. Exportar los 601 registros problemáticos a Excel
2. Revisar y corregir manualmente
3. Importar las correcciones

**Ventajas**:
- ✅ 100% de precisión
- ✅ Control total sobre cada cambio
- ✅ Sin riesgo de errores adicionales

**Tiempo estimado**: ~2-3 horas

---

### Opción 2: Corrección Semiautomática

1. Crear reglas específicas para casos comunes:
   - Nombres compuestos conocidos (MARIA GUADALUPE, etc.)
   - Apellidos compuestos con partículas (DE LA, DEL, etc.)
   - Quitar comas

2. Generar archivo de correcciones para revisión
3. Aplicar solo las correcciones aprobadas

**Ventajas**:
- ✅ Más rápido que manual total
- ✅ Aún permite revisión antes de aplicar
- ✅ Reduce trabajo manual a casos complejos

---

### Opción 3: Corrección Automática (NO RECOMENDADO)

Aplicar algoritmo automático sin revisión.

**Desventajas**:
- ❌ Alto riesgo de errores
- ❌ Casos complejos mal manejados
- ❌ Difícil de revertir

---

## 📝 REGLAS DE CORRECCIÓN PROPUESTAS

### REGLA 1: Nombres Compuestos Conocidos

Si `primer_nombre + segundo_nombre` coincide con:
- MARIA GUADALUPE
- MARIA DE JESUS
- MARIA DE LOURDES
- MARIA DE LA LUZ
- MARIA DEL CARMEN
- MARIA DE LOS ANGELES
- MA GUADALUPE
- JOSE LUIS
- JUAN CARLOS
- ROSA MARIA
- MARIA TERESA
- MARIA ELENA
- MARIA ISABEL
- MARIA LUISA
- MARIA CRISTINA

**Acción**: Unir en `primer_nombre`, dejar `segundo_nombre = null`

---

### REGLA 2: Apellidos Compuestos

Si `apellido_pat` o las últimas palabras antes de apellidos son:
- DE LA + [palabra]
- DEL + [palabra]
- DE + [palabra que empieza con letra del CURP]

**Acción**: Unir como apellido compuesto

---

### REGLA 3: Limpiar Comas

**Acción**: Reemplazar "," por espacio en todos los campos

---

### REGLA 4: Usar CURP como Validación

El CURP tiene la estructura:
- `Posición 0-1`: Apellido Paterno
- `Posición 2`: Apellido Materno
- `Posición 3`: Primer Nombre

**Acción**: Validar que las primeras letras coincidan

---

## 📊 ESTADÍSTICAS DETALLADAS

```sql
-- Casos con "DE" en segundo nombre
SELECT COUNT(*) FROM personas 
WHERE segundo_nombre LIKE '%DE%'; 
-- Resultado: 317

-- Casos con comas
SELECT COUNT(*) FROM personas 
WHERE apellido_pat LIKE '%,%' OR apellido_mat LIKE '%,%';
-- Resultado: 1

-- Total con problemas potenciales estimado: 601
```

---

## ✅ SIGUIENTE PASO RECOMENDADO

**OPCIÓN RECOMENDADA**: Corrección Semiautomática

1. Generar archivo Excel con los 601 casos
2. Aplicar reglas automáticas para casos obvios
3. Marcar casos que requieren revisión manual
4. Revisar y aprobar
5. Ejecutar correcciones

**¿Deseas que proceda con esta opción?**

---

## 📁 ARCHIVOS GENERADOS

- `data/logs/correcciones_nombres.json` - Análisis V1 (601 casos)
- `ANALISIS_NOMBRES_PROBLEMATICOS.md` - Este archivo

---

**Creado**: 2026-08-02  
**Análisis realizado por**: Claude Code  
**Estado**: ⚠️ REQUIERE DECISIÓN SOBRE ESTRATEGIA DE CORRECCIÓN
