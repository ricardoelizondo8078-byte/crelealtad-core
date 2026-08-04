# ANÁLISIS: BASEDATOS CRELEALTAD (1) (1).xlsx

**Fecha**: 2026-08-02  
**Archivo**: `BASEDATOS CRELEALTAD (1) (1).xlsx`  
**Tamaño**: 0.65 MB  
**Propósito**: Determinar qué datos de integrantes se pueden migrar

---

## RESUMEN EJECUTIVO

✅ **EXCELENTE NOTICIA: Este archivo contiene datos INDIVIDUALES de integrantes**

El archivo tiene **3 hojas** con información detallada de personas:
- **Hoja1**: 8,407 registros con datos completos (NOMBRE, CURP, TELÉFONO, DIRECCIÓN, GRUPO, CICLO, MONTO)
- **Hoja2**: 8,340 registros (parece ser versión simplificada sin ciclo/monto)
- **TESORERAS**: 6,695 registros de tesoreras con indicador especial

---

## ESTRUCTURA DE LAS HOJAS

### 1. HOJA1 (8,407 registros) ⭐ **PRINCIPAL**

**Tiene encabezados en fila 1**, datos desde fila 2

#### Columnas disponibles:

| # | Columna | Encabezado | Ejemplo | Mapeo a BD |
|---|---------|------------|---------|------------|
| A | A | NOMBRE | "GABINA BERNAL LOPEZ" | **personas.primer_nombre + apellidos** |
| B | B | CURP | "BELG600218MNLRPB00" | **personas.curp** ✅ |
| C | C | TELEFONO | "8126473334" | **personas.telefono** ✅ |
| D | D | DIRECCION | "18 DE ENERO #105 COL. SALVADOR ALLENDE, SAN NICOLAS" | domicilios.calle + colonia |
| E | E | GRUPO | "GABINAS VIP" | **grupos.nombre** ✅ |
| F | F | CICLO | "1" | **expedientes.ciclo_numero** ✅ |
| G | G | MONTO | "$15,000.00" | **personas.monto_solicitado** ✅ |
| H | H | LUPITA | "ANGEL" | asesora? |
| I | I | PAPELERIA COMP. | "SI" | documentos completos? |
| J-X | ... | (18 columnas más) | ... | Por revisar |

**Ejemplo de registro completo**:
```
NOMBRE: GABINA BERNAL LOPEZ
CURP: BELG600218MNLRPB00
TELEFONO: 8126473334
DIRECCION: 18 DE ENERO #105 COL. SALVADOR ALLENDE, SAN NICOLAS
GRUPO: GABINAS VIP
CICLO: 1
MONTO: $15,000.00
LUPITA: ANGEL
PAPELERIA COMP.: SI
```

---

### 2. HOJA2 (8,340 registros)

**NO tiene encabezados**, datos desde fila 1

#### Estructura inferida:

| Columna | Contenido | Mapeo a BD |
|---------|-----------|------------|
| A | NOMBRE COMPLETO | personas.primer_nombre + apellidos |
| B | CURP | personas.curp ✅ |
| C | TELEFONO | personas.telefono ✅ |
| D | DIRECCION | domicilios |
| E | GRUPO | grupos.nombre ✅ |
| F-H | (vacías) | - |

**Ejemplo**:
```
MARIA VIRGINIA RUIZ ALMANZA
RUAV791108MNLZLR08
8139083420
PALMA SUR#332 COL..VALLE SUR,JUAREZA
VALLE SUR
```

---

### 3. TESORERAS (6,695 registros)

**NO tiene encabezados**, datos desde fila 1

#### Estructura inferida:

| Columna | Contenido | Ejemplo | Mapeo a BD |
|---------|-----------|---------|------------|
| A | NOMBRE | "VERONICA OLIVA AGUILAR" | personas |
| B | CURP | "OIAV820205MNLLGR03" | personas.curp ✅ |
| C | TELEFONO | "8135716688" | personas.telefono ✅ |
| D | DIRECCION | "PINO NORTE#217 COL.VALLE DEL VIRREY ,JUAREZ" | domicilios |
| E | GRUPO | "PRINCESAS" | grupos.nombre ✅ |
| F | CICLO | "15" | expedientes.ciclo_numero ✅ |
| G | MONTO | "$14,000" | personas.monto_solicitado ✅ |
| H | ASESORA | "HILDA" | expedientes.asesora_id (buscar) |
| I | DOCUMENTOS | "SI" | - |

**⚠️ IMPORTANTE**: Esta hoja marca integrantes que son **TESORERAS DEL GRUPO**

---

## DATOS QUE SE PUEDEN MIGRAR

### ✅ Tabla: `personas`

**Campos disponibles** (de Hoja1):

| Campo BD | Columna Excel | Transformación |
|----------|---------------|----------------|
| `curp` | B (CURP) | Directo ✅ |
| `primer_nombre` | A (NOMBRE) | Extraer primer nombre |
| `segundo_nombre` | A (NOMBRE) | Extraer segundo nombre (si existe) |
| `apellido_pat` | A (NOMBRE) | Extraer apellido paterno |
| `apellido_mat` | A (NOMBRE) | Extraer apellido materno |
| `telefono` | C (TELEFONO) | Limpiar formato ✅ |
| `monto_solicitado` | G (MONTO) | Quitar $ y comas, convertir a DECIMAL ✅ |
| `fecha_nac` | B (CURP) | **Extraer de CURP (posiciones 5-10)** ✅ |
| `genero` | B (CURP) | **Extraer de CURP (posición 11: H/M)** ✅ |
| `estado` | - | Default: "ACTIVA" |

**Total de personas únicas**: ~8,407 registros (considerar duplicados por CURP)

---

### ✅ Tabla: `grupos`

**Campos disponibles**:

| Campo BD | Columna Excel | Transformación |
|----------|---------------|----------------|
| `nombre` | E (GRUPO) | Directo ✅ |
| `folio` | - | Generar automático |
| `fecha_inicio` | - | NULL (no disponible) |
| `estado` | - | Default: "ACTIVO" |
| `zona_id` | - | NULL |
| `sucursal_id` | - | NULL |

**Total de grupos únicos**: ~500+ grupos diferentes

---

### ✅ Tabla: `expedientes`

**Relación**: 1 expediente por GRUPO

| Campo BD | Columna Excel | Transformación |
|----------|---------------|----------------|
| `grupo_id` | E (GRUPO) | Buscar UUID del grupo por nombre |
| `ciclo_numero` | F (CICLO) | **NO** - El ciclo es por integrante, no por grupo |
| `asesora_id` | H (LUPITA) | Buscar UUID de usuario por nombre |
| `estado` | - | Default: "EN_VERIFICACION" |

---

### ✅ Tabla: `integrantes`

**Relación**: 1 integrante por PERSONA en un EXPEDIENTE (grupo+ciclo)

| Campo BD | Columna Excel | Transformación |
|----------|---------------|----------------|
| `persona_id` | A+B (NOMBRE+CURP) | Buscar UUID de persona por CURP |
| `expediente_id` | E (GRUPO) | Buscar UUID de expediente por nombre grupo |
| `estado` | I (PAPELERIA COMP.) | SI→"DOCUMENTADO", NO→"DOCUMENTANDO" |
| `es_tesorera` | - | **TRUE si está en hoja TESORERAS** ✅ |

---

### ⚠️ Tabla: `domicilios` (NO EXISTE EN SCHEMA ACTUAL)

**Datos disponibles** pero falta tabla:

| Campo | Columna Excel | Nota |
|-------|---------------|------|
| direccion_completa | D (DIRECCION) | Requiere parsear calle, número, colonia, municipio |

**Ejemplo**: "18 DE ENERO #105 COL. SALVADOR ALLENDE, SAN NICOLAS"
- Calle: "18 DE ENERO"
- Número: "105"
- Colonia: "SALVADOR ALLENDE"
- Municipio: "SAN NICOLAS"

---

## CAMPOS NO DISPONIBLES

Los siguientes campos de `personas` **NO** están en el Excel:

| Campo BD | Disponible |
|----------|------------|
| `curp` | ✅ Sí |
| `primer_nombre` | ✅ Sí (derivado) |
| `apellido_pat` | ✅ Sí (derivado) |
| `apellido_mat` | ✅ Sí (derivado) |
| `fecha_nac` | ✅ Sí (extraer de CURP) |
| `genero` | ✅ Sí (extraer de CURP) |
| `telefono` | ✅ Sí |
| `telefono_secundario` | ❌ No |
| `monto_solicitado` | ✅ Sí |

---

## COLUMNAS ADICIONALES EN HOJA1 (POR REVISAR)

La HOJA1 tiene **24 columnas**, solo vimos las primeras 9.

**Columnas 10-24 pendientes de revisar**:
- Podrían contener: fechas, observaciones, validaciones, etc.

---

## ESTRATEGIA DE MIGRACIÓN

### Fase 1: Preparación
1. ⬜ Revisar todas las 24 columnas de Hoja1
2. ⬜ Decidir qué hoja usar como principal (Hoja1 recomendada)
3. ⬜ Crear tabla `domicilios` en schema si se quiere guardar direcciones
4. ⬜ Crear script para parsear nombres (NOMBRE COMPLETO → primer_nombre, apellidos)
5. ⬜ Crear script para extraer fecha_nac y genero desde CURP

### Fase 2: Limpieza de Datos
1. ⬜ Identificar duplicados por CURP
2. ⬜ Limpiar formatos de teléfono (quitar espacios, guiones)
3. ⬜ Limpiar montos (quitar $, comas)
4. ⬜ Normalizar nombres de grupos

### Fase 3: Migración de Grupos
1. ⬜ Extraer lista única de grupos (columna E)
2. ⬜ Insertar en tabla `grupos`
3. ⬜ Crear mapeo: nombre_grupo → grupo_uuid

### Fase 4: Migración de Personas
1. ⬜ Insertar registros únicos por CURP en tabla `personas`
2. ⬜ Parsear nombres completos
3. ⬜ Extraer fecha_nac y genero de CURP
4. ⬜ Crear mapeo: curp → persona_uuid

### Fase 5: Migración de Expedientes
1. ⬜ Crear 1 expediente por grupo
2. ⬜ Vincular con grupo_id
3. ⬜ Buscar asesora por nombre
4. ⬜ Crear mapeo: grupo_id → expediente_uuid

### Fase 6: Migración de Integrantes
1. ⬜ Insertar integrantes vinculando persona_id + expediente_id
2. ⬜ Marcar como tesorera si está en hoja TESORERAS
3. ⬜ Asignar estado según columna PAPELERIA COMP.

### Fase 7: Validación
1. ⬜ Verificar que no hay CURPs duplicados en personas
2. ⬜ Verificar que todos los integrantes tienen persona_id y expediente_id
3. ⬜ Contar: Total personas, Total grupos, Total integrantes
4. ⬜ Comparar con Excel: 8,407 registros → X personas + Y integrantes

---

## HALLAZGOS IMPORTANTES

### ✅ DATOS DISPONIBLES PARA MIGRACIÓN:

1. **8,407 integrantes** con datos completos
2. **CURP único** por persona (clave para evitar duplicados)
3. **Nombre del grupo** (para vincular con expedientes)
4. **Teléfono** de contacto
5. **Monto solicitado** por persona
6. **Ciclo** (indica cuántas veces ha participado)
7. **Indicador de tesorera** (hoja TESORERAS)
8. **Fecha de nacimiento y género** (extraíble de CURP)

### ⚠️ DATOS FALTANTES:

1. ❌ Fecha de inicio del grupo
2. ❌ Zona y Sucursal
3. ❌ Teléfono secundario
4. ❌ Domicilio estructurado (está como texto libre)
5. ❌ Producto asignado
6. ❌ Fechas de desembolso (están en BASE DE DATOS SEM 364.xlsm)

---

## COMPLEMENTARIEDAD CON "BASE DE DATOS SEM 364.xlsm"

### Este archivo (INTEGRANTES) tiene:
✅ Nombres de personas  
✅ CURPs  
✅ Teléfonos  
✅ Montos individuales  
✅ Indicador de tesorera  

### BASE DE DATOS SEM 364.xlsm tiene:
✅ Fechas de desembolso  
✅ Tasa y plazo  
✅ Montos totales del grupo  
✅ Fecha de vencimiento  
✅ Saldo pendiente  

### ✅ **SE COMPLEMENTAN PERFECTAMENTE**

**Estrategia de migración conjunta**:
1. Migrar grupos desde SEM 364 (con fechas y montos totales)
2. Migrar personas desde BASEDATOS CRELEALTAD (con nombres, CURPs, teléfonos)
3. Vincular integrantes relacionando por **NOMBRE DEL GRUPO**

---

## PRÓXIMOS PASOS

1. **Revisar columnas 10-24 de Hoja1** para ver si hay más datos útiles
2. **Decidir hoja principal**: Hoja1 (recomendada por tener ciclo y monto)
3. **Crear script de migración** que combine ambos archivos Excel
4. **Parsear nombres** correctamente (primer_nombre, segundo_nombre, apellidos)
5. **Extraer datos de CURP** (fecha_nac, genero)
6. **Ejecutar migración piloto** con 10-20 registros

---

**Fecha de análisis**: 2026-08-02  
**Archivo analizado**: BASEDATOS CRELEALTAD (1) (1).xlsx  
**Total de registros**: 8,407 integrantes + 6,695 tesoreras  
