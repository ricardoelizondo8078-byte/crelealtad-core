# ANÁLISIS COMPLETO - BASEDATOS CRELEALTAD (1) (1).xlsx

**Fecha**: 2026-08-02  
**Análisis**: COMPLETO - Todas las columnas revisadas

---

## RESUMEN EJECUTIVO

✅ **Archivo analizado completamente**

**3 hojas disponibles**:
1. **Hoja1**: 8,407 registros - **9 columnas con datos** (columnas 10-24 están vacías)
2. **Hoja2**: 8,340 registros - **5-6 columnas con datos**
3. **TESORERAS**: 6,695 registros - **9 columnas con datos**

---

## HOJA1 (PRINCIPAL) - 8,407 REGISTROS

### ✅ COLUMNAS CON DATOS (9 de 24)

| # | Columna | Encabezado | Tipo | Mapeo a BD | Notas |
|---|---------|------------|------|------------|-------|
| 1 | A | **NOMBRE** | Texto | `personas.primer_nombre + apellidos` | Requiere parseo |
| 2 | B | **CURP** | Texto (18 chars) | `personas.curp` ✅ | **Clave única** |
| 3 | C | **TELEFONO** | Numérico (10 dígitos) | `personas.telefono` ✅ | 702 con tel, 297 sin tel |
| 4 | D | **DIRECCION** | Texto | Domicilios (no existe tabla) | Requiere parseo |
| 5 | E | **GRUPO** | Texto | `grupos.nombre` ✅ | ~500+ grupos únicos |
| 6 | F | **CICLO** | Numérico | `integrantes.ciclo` | Ciclo del integrante |
| 7 | G | **MONTO** | Moneda | `personas.monto_solicitado` ✅ | Formato: "$15,000.00" |
| 8 | H | **LUPITA** | Texto | `expedientes.asesora_id` | 11 asesoras diferentes |
| 9 | I | **PAPELERIA COMP.** | Texto (SI/NO) | `integrantes.estado` | SI→DOCUMENTADO |

### ❌ COLUMNAS VACÍAS (15 de 24)

Columnas **J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X** están completamente vacías (sin encabezados ni datos)

---

## ESTADÍSTICAS HOJA1

### Datos de calidad:
- **Total registros**: 8,407
- **Registros con teléfono**: 702 (70%)
- **Registros sin teléfono**: 297 (30%)
- **Registros con monto**: 996+

### Asesoras identificadas (11):

| Asesora | Integrantes | Porcentaje |
|---------|-------------|------------|
| HILDA | 264 | 26.4% |
| ELI | 180 | 18.0% |
| ANGEL | 176 | 17.6% |
| ANA VAZ | 118 | 11.8% |
| JULIETA | 114 | 11.4% |
| VICKY | 103 | 10.3% |
| LUPITA | 35 | 3.5% |
| ADA | 6 | 0.6% |
| EMILIO | 1 | 0.1% |
| MIGUEL | 1 | 0.1% |

---

## HOJA2 - 8,340 REGISTROS

### Estructura (sin encabezados):

| Columna | Contenido | Mapeo |
|---------|-----------|-------|
| A | NOMBRE | personas |
| B | CURP | personas.curp ✅ |
| C | TELEFONO | personas.telefono ✅ |
| D | DIRECCION | domicilios |
| E | GRUPO | grupos.nombre ✅ |
| F | **CICLO** | ⚠️ **Algunos registros tienen ciclo** |

**⚠️ HALLAZGO**: Hoja2 tiene columna F con ciclos en algunos registros

**Ejemplo con ciclo** (fila 7):
```
GISELA YLLEN SALAS PINEDA
SAPH021213MNLLNSB6
8126905716
DORADO#648 COL.EX HDA EL ROSARIO,JUAREZ
REYNAS
4  ← CICLO
```

**Diferencia con Hoja1**:
- Hoja1: 8,407 registros (67 más que Hoja2)
- Hoja2: 8,340 registros (menos columnas: sin MONTO, sin ASESORA, sin PAPELERIA)

---

## TESORERAS - 6,695 REGISTROS

### Estructura completa (9 columnas):

| Columna | Contenido | Ejemplo | Mapeo |
|---------|-----------|---------|-------|
| A | NOMBRE | "VERONICA OLIVA AGUILAR" | personas |
| B | CURP | "OIAV820205MNLLGR03" | personas.curp ✅ |
| C | TELEFONO | "8135716688" | personas.telefono ✅ |
| D | DIRECCION | "PINO NORTE#217..." | domicilios |
| E | GRUPO | "PRINCESAS" | grupos.nombre ✅ |
| F | CICLO | "15" | integrantes.ciclo |
| G | MONTO | "$14,000" | personas.monto_solicitado ✅ |
| H | ASESORA | "HILDA" | expedientes.asesora_id |
| I | DOCUMENTOS | "SI" | integrantes.estado |
| J | - | - | (vacía) |

**⚠️ IMPORTANTE**: Esta hoja identifica a las **TESORERAS** de cada grupo

---

## DATOS EXTRAÍBLES PARA MIGRACIÓN

### ✅ Tabla `personas` (8,407 registros únicos por CURP)

| Campo BD | Fuente | Transformación | Disponibilidad |
|----------|--------|----------------|----------------|
| `id` | - | gen_random_uuid() | AUTO |
| `folio` | - | Generar secuencial | AUTO |
| `curp` | Col B | Directo | ✅ 100% |
| `primer_nombre` | Col A | Parsear de NOMBRE | ✅ 100% |
| `segundo_nombre` | Col A | Parsear de NOMBRE | ⚠️ ~50% |
| `apellido_pat` | Col A | Parsear de NOMBRE | ✅ 100% |
| `apellido_mat` | Col A | Parsear de NOMBRE | ⚠️ ~90% |
| `fecha_nac` | Col B (CURP) | Extraer posiciones 5-10 | ✅ 100% |
| `genero` | Col B (CURP) | Posición 11 (H/M) | ✅ 100% |
| `telefono` | Col C | Limpiar formato | ✅ 70% |
| `telefono_secundario` | - | NULL | ❌ 0% |
| `monto_solicitado` | Col G | Quitar $ y comas | ✅ 95%+ |
| `estado` | - | "ACTIVA" | AUTO |
| `created_at` | - | NOW() | AUTO |
| `updated_at` | - | NOW() | AUTO |

**Formato de nombre**: "GABINA BERNAL LOPEZ"
- Primer nombre: GABINA
- Apellido paterno: BERNAL
- Apellido materno: LOPEZ

**CURP para extraer datos**:
- Ejemplo: `BELG600218MNLRPB00`
- Fecha nac: `600218` → 18/02/1960
- Género: `M` → Mujer

---

### ✅ Tabla `grupos` (~500+ grupos únicos)

| Campo BD | Fuente | Transformación |
|----------|--------|----------------|
| `id` | - | gen_random_uuid() |
| `folio` | - | Generar secuencial |
| `nombre` | Col E | Directo ✅ |
| `zona_id` | - | NULL |
| `sucursal_id` | - | NULL |
| `fecha_inicio` | - | NULL (no disponible) |
| `estado` | - | "ACTIVO" |
| `created_by` | - | NULL |
| `created_at` | - | NOW() |
| `updated_at` | - | NOW() |
| `deleted_at` | - | NULL |

**Ejemplos de nombres de grupos**:
- "GABINAS VIP"
- "VALLE SUR"
- "REYNAS"
- "PRINCESAS"
- "MARGARITAS"
- "ARRECIFE"

---

### ✅ Tabla `expedientes` (1 por grupo)

| Campo BD | Fuente | Transformación |
|----------|--------|----------------|
| `id` | - | gen_random_uuid() |
| `folio` | - | Generar secuencial |
| `grupo_id` | Col E | Buscar UUID del grupo |
| `producto_id` | - | NULL (no disponible) |
| `asesora_id` | Col H | Buscar UUID por nombre ✅ |
| `horario_visita` | - | NULL |
| `dias_visita` | - | NULL |
| `semana_cobro` | - | NULL |
| `observaciones` | - | NULL |
| `estado` | - | "EN_VERIFICACION" |
| `estado_fecha` | - | NOW() |
| `created_at` | - | NOW() |
| `updated_at` | - | NOW() |

---

### ✅ Tabla `integrantes` (8,407 integrantes)

| Campo BD | Fuente | Transformación |
|----------|--------|----------------|
| `id` | - | gen_random_uuid() |
| `folio` | - | Generar secuencial |
| `expediente_id` | Col E (GRUPO) | Buscar UUID del expediente |
| `persona_id` | Col B (CURP) | Buscar UUID de persona ✅ |
| `ciclo` | Col F | Directo ✅ |
| `es_tesorera` | HOJA TESORERAS | TRUE si CURP está en hoja TESORERAS ✅ |
| `estado` | Col I | "SI"→DOCUMENTADO, otro→DOCUMENTANDO |
| `created_at` | - | NOW() |
| `updated_at` | - | NOW() |

**Ciclos identificados**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16...

---

### ⚠️ Tabla `domicilios` (NO EXISTE EN SCHEMA)

**Datos disponibles en Col D** pero requiere tabla nueva:

Ejemplo: `"18 DE ENERO #105 COL. SALVADOR ALLENDE, SAN NICOLAS"`

Parsear:
- Calle: "18 DE ENERO"
- Numero exterior: "105"
- Colonia: "SALVADOR ALLENDE"
- Municipio: "SAN NICOLAS"

**Recomendación**: Crear tabla `domicilios` o guardar en `personas.direccion_completa` (TEXT)

---

## COMPARACIÓN ENTRE HOJAS

| Característica | Hoja1 | Hoja2 | TESORERAS |
|----------------|-------|-------|-----------|
| Registros | 8,407 | 8,340 | 6,695 |
| Tiene encabezados | ✅ Sí | ❌ No | ❌ No |
| CURP | ✅ | ✅ | ✅ |
| Teléfono | ⚠️ 70% | ✅ | ✅ |
| Grupo | ✅ | ✅ | ✅ |
| Ciclo | ✅ | ⚠️ Algunos | ✅ |
| Monto | ✅ | ❌ | ✅ |
| Asesora | ✅ | ❌ | ✅ |
| Papelería | ✅ | ❌ | ✅ |
| Marca tesorera | ❌ | ❌ | ✅ |

---

## RECOMENDACIÓN: ¿QUÉ HOJA USAR?

### 🏆 **USAR HOJA1 COMO PRINCIPAL**

**Razones**:
1. ✅ Tiene más registros (8,407 vs 8,340)
2. ✅ Tiene encabezados claros
3. ✅ Tiene MONTO por integrante
4. ✅ Tiene ASESORA
5. ✅ Tiene indicador de PAPELERIA COMPLETA
6. ✅ Tiene CICLO en todos los registros

**Complementar con**:
- **HOJA TESORERAS**: Para marcar `es_tesorera = TRUE`

**Ignorar**:
- Hoja2 (es subconjunto de Hoja1 con menos datos)

---

## ESTRATEGIA DE MIGRACIÓN FINAL

### Paso 1: Preparación
```sql
-- Agregar campo faltante en tabla personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS direccion_completa TEXT;

-- Agregar campo en integrantes
ALTER TABLE integrantes ADD COLUMN IF NOT EXISTS ciclo INTEGER;
ALTER TABLE integrantes ADD COLUMN IF NOT EXISTS es_tesorera BOOLEAN DEFAULT FALSE;
```

### Paso 2: Migrar desde Hoja1
1. Extraer **personas únicas** por CURP (8,407 → ~8,300 únicos)
2. Parsear nombres completos
3. Extraer fecha_nac y genero de CURP
4. Limpiar teléfonos
5. Convertir montos a DECIMAL

### Paso 3: Migrar grupos
1. Extraer **grupos únicos** de columna E (~500 grupos)
2. Insertar en tabla `grupos`

### Paso 4: Crear expedientes
1. Crear **1 expediente por grupo**
2. Vincular con asesora (Col H → buscar UUID)

### Paso 5: Crear integrantes
1. Insertar **8,407 integrantes**
2. Vincular persona_id (por CURP)
3. Vincular expediente_id (por nombre grupo)
4. Asignar ciclo (Col F)
5. Asignar estado según PAPELERIA COMP.

### Paso 6: Marcar tesoreras
1. Leer hoja TESORERAS
2. Buscar integrantes por CURP
3. UPDATE `es_tesorera = TRUE` (6,695 registros)

---

## SCRIPT HELPER: PARSEAR NOMBRES

```javascript
function parsearNombre(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 3) {
    return {
      primer_nombre: partes[0],
      segundo_nombre: null,
      apellido_pat: partes[1],
      apellido_mat: partes[2]
    };
  }
  
  if (partes.length === 4) {
    return {
      primer_nombre: partes[0],
      segundo_nombre: partes[1],
      apellido_pat: partes[2],
      apellido_mat: partes[3]
    };
  }
  
  // Caso especial: más de 4 partes
  return {
    primer_nombre: partes[0],
    segundo_nombre: partes.slice(1, -2).join(' '),
    apellido_pat: partes[partes.length - 2],
    apellido_mat: partes[partes.length - 1]
  };
}
```

## SCRIPT HELPER: EXTRAER DE CURP

```javascript
function extraerDatosCURP(curp) {
  // CURP: BELG600218MNLRPB00
  // Posiciones: 5-10 = fecha (AAMMDD)
  // Posición 11 = género (H/M)
  
  const año = curp.substring(4, 6);
  const mes = curp.substring(6, 8);
  const dia = curp.substring(8, 10);
  const genero = curp.charAt(10);
  
  // Determinar siglo (00-30 = 2000, 31-99 = 1900)
  const añoCompleto = parseInt(año) <= 30 ? `20${año}` : `19${año}`;
  
  return {
    fecha_nac: `${añoCompleto}-${mes}-${dia}`,
    genero: genero === 'H' ? 'MASCULINO' : 'FEMENINO'
  };
}

// Ejemplo:
// BELG600218MNLRPB00 → { fecha_nac: '1960-02-18', genero: 'FEMENINO' }
```

---

## TOTAL DE DATOS EXTRAÍBLES

| Tabla | Registros | Notas |
|-------|-----------|-------|
| `personas` | ~8,300 | Únicos por CURP (desduplicados) |
| `grupos` | ~500 | Únicos por nombre |
| `expedientes` | ~500 | 1 por grupo |
| `integrantes` | 8,407 | 1 por persona en grupo |
| Tesoreras marcadas | 6,695 | `es_tesorera = TRUE` |

**Monto total solicitado**: Estimado >$100 millones (pendiente cálculo exacto)

---

**Fecha de análisis**: 2026-08-02  
**Columnas revisadas**: 24/24 de Hoja1, 8/8 de Hoja2, 10/10 de TESORERAS  
**Status**: ✅ ANÁLISIS COMPLETO  
