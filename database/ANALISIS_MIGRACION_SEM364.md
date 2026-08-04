# ANÁLISIS DE MIGRACIÓN - BASE DE DATOS SEM 364

## Resumen Ejecutivo

**Archivo origen**: `BASE DE DATOS SEM 364.xlsm`  
**Hoja principal**: `BASE DE DATOS`  
**Fila de encabezados**: 11  
**Columna ID Grupo**: C (`# GPO`)  
**Total aproximado de registros**: 500+  

---

## 1. ESTRUCTURA DEL ARCHIVO ORIGEN

### Encabezados Principales (Primeras 70 columnas)

| # | Columna | Encabezado | Descripción | Mapeo Posible |
|---|---------|------------|-------------|---------------|
| 1 | A | # | Identificador único del registro | - |
| 2 | B | SEM | Semana | grupos.semana_cobro? |
| 3 | C | **# GPO** | **ID del Grupo** | **grupos.folio** |
| 4 | D | CICLO | Número de ciclo del grupo | expedientes.ciclo_numero |
| 5 | E | NOMBRE GRUPO | Nombre del grupo | **grupos.nombre** |
| 6 | F | GRUPO Y CICLO | Concatenación nombre + ciclo | - (derivado) |
| 7 | G | SRAS | Número de integrantes | - (contar integrantes) |
| 8 | H | #ASE | ID del asesor | - |
| 9 | I | ASESOR | Nombre/código del asesor | expedientes.asesora_id (buscar) |
| 10 | J | FECHA DE DESEMBOLSO | Fecha de desembolso | creditos.fecha_desembolso |
| 11 | K | SEMANA DESEMBOLSO | Semana de desembolso | creditos.semana_desembolso |
| 12 | L | TASA | Tasa aplicada | creditos.tasa |
| 13 | M | RETENCION INICIAL | Monto retenido inicial | creditos.retencion_inicial |
| 14 | N | APERTURA | Costo de apertura | creditos.costo_apertura |
| 15 | O | SEGURO X PERSONA | Seguro por persona | creditos.seguro_persona |
| 16 | P | PLAZO | Plazo del crédito | creditos.plazo_semanas |
| 17 | Q | DOC | Documentación | - |
| 18 | R | PRESTAMO | Monto del préstamo | creditos.monto_prestamo |
| 19 | S | TASA REC CAPITAL | Tasa recuperación capital | - |
| 20 | T | TOTAL DE LA CUENTA | Total de la cuenta | creditos.monto_total |
| 21 | U | SEM VENCIMIENTO | Semana de vencimiento | creditos.semana_vencimiento |
| 22 | V | FECHA VENCIMIENTO | Fecha de vencimiento | creditos.fecha_vencimiento |
| 23 | W | DIA PAGO | Día de pago | expedientes.dias_visita |
| 24 | X | HORA PAGO | Hora de pago | expedientes.horario_visita |
| 25 | Y | PAGO MINIMO | Pago mínimo semanal | creditos.pago_semanal |
| 26 | Z | MONTO SEGURO | Monto del seguro | creditos.monto_seguro |
| 27 | AA | % COM | Porcentaje de comisión | - |
| 28 | AB | FECHA DE COBRO | Fecha de cobro | - |
| 29 | AC | TOTAL PAGADO | Total pagado a la fecha | creditos.total_pagado |
| 37 | AK | GRUPO VIGENTE | Si el grupo está vigente | grupos.estado |
| 44 | AR | TOTAL DEL CREDITO | Total del crédito | creditos.monto_total |
| 45 | AS | CREDITO PAGADO ACUM | Crédito pagado acumulado | creditos.pagado_acumulado |
| 46 | AT | % PAGADO | Porcentaje pagado | - (calculado) |
| 47 | AU | SALDO X LIQUIDAR | Saldo por liquidar | creditos.saldo_pendiente |
| 65 | BM | NOMBRE CONTACTO | Nombre de contacto | - |
| 66 | BN | TEL. CONTACTO | Teléfono de contacto | - |

---

## 2. MAPEO A TABLAS DEL SISTEMA

### 2.1 Tabla: `grupos`

| Campo Destino | Columna Origen | Transformación Requerida |
|---------------|----------------|--------------------------|
| `folio` | C (`# GPO`) | Convertir a formato estándar |
| `nombre` | E (`NOMBRE GRUPO`) | Limpiar espacios |
| `fecha_inicio` | J (`FECHA DE DESEMBOLSO`) | Convertir fecha Excel a DATE |
| `estado` | AK (`GRUPO VIGENTE`) | Mapear: Sí→ACTIVO, No→LIQUIDADO |
| `zona_id` | - | NULL (no disponible) |
| `sucursal_id` | - | NULL (no disponible) |

**Nota**: El campo `# GPO` es el identificador único del grupo. Puede haber múltiples filas por grupo (una por ciclo).

---

### 2.2 Tabla: `expedientes`

| Campo Destino | Columna Origen | Transformación Requerida |
|---------------|----------------|--------------------------|
| `grupo_id` | C (`# GPO`) | Buscar en tabla grupos por folio |
| `ciclo_numero` | D (`CICLO`) | INT |
| `asesora_id` | I (`ASESOR`) | Buscar usuario por código/nombre |
| `horario_visita` | X (`HORA PAGO`) | VARCHAR |
| `dias_visita` | W (`DIA PAGO`) | VARCHAR |
| `semana_cobro` | B (`SEM`) | Convertir a DATE |
| `estado` | AK (`GRUPO VIGENTE`) | Mapear según estado del crédito |

---

### 2.3 Tabla: `creditos` (datos financieros del grupo/ciclo)

| Campo Destino | Columna Origen | Transformación Requerida |
|---------------|----------------|--------------------------|
| `grupo_id` | C (`# GPO`) | Buscar en tabla grupos |
| `expediente_id` | - | Buscar expediente por grupo+ciclo |
| `monto_prestamo` | R (`PRESTAMO`) | DECIMAL, limpiar formato moneda |
| `monto_total` | T (`TOTAL DE LA CUENTA`) | DECIMAL, limpiar formato |
| `tasa` | L (`TASA`) | INT |
| `plazo_semanas` | P (`PLAZO`) | INT |
| `pago_semanal` | Y (`PAGO MINIMO`) | DECIMAL |
| `fecha_desembolso` | J (`FECHA DE DESEMBOLSO`) | DATE |
| `semana_desembolso` | K (`SEMANA DESEMBOLSO`) | INT |
| `fecha_vencimiento` | V (`FECHA VENCIMIENTO`) | DATE |
| `semana_vencimiento` | U (`SEM VENCIMIENTO`) | INT |
| `retencion_inicial` | M (`RETENCION INICIAL`) | DECIMAL |
| `costo_apertura` | N (`APERTURA`) | DECIMAL |
| `seguro_persona` | O (`SEGURO X PERSONA`) | DECIMAL |
| `monto_seguro` | Z (`MONTO SEGURO`) | DECIMAL |
| `total_pagado` | AC (`TOTAL PAGADO`) | DECIMAL |
| `saldo_pendiente` | AU (`SALDO X LIQUIDAR`) | DECIMAL |

---

### 2.4 Tabla: `integrantes` (NO DISPONIBLE EN ESTE ARCHIVO)

**IMPORTANTE**: El archivo `BASE DE DATOS SEM 364.xlsm` contiene datos **agregados por grupo**, no datos individuales de integrantes.

**Datos que sí están disponibles**:
- Número total de integrantes por grupo (columna G: `SRAS`)
- No hay nombres individuales
- No hay teléfonos individuales
- No hay montos individuales

**Conclusión**: Para migrar datos de integrantes individuales, se necesitaría un archivo diferente o una hoja diferente.

---

## 3. CAMPOS NO MAPEABLES

Los siguientes campos del Excel **NO** tienen correspondencia directa en el esquema actual:

| Columna | Encabezado | Razón |
|---------|------------|-------|
| 19 | TASA REC CAPITAL | No existe campo equivalente |
| 27 | % COM | Comisiones no están en modelo actual |
| 28 | FECHA DE COBRO | No está en modelo |
| 30-36 | Fichas, Ahorros, Seguros semanales | Requeriría tabla de pagos detallados |
| 38-43 | Comisiones detalladas | No en modelo actual |
| 56 | CALIFICACION | No en modelo |
| 57-60 | Tareas y seguimiento | No en modelo |

---

## 4. CAMPOS FALTANTES EN EL SCHEMA ACTUAL

### Tabla `grupos` - Campos que deberían agregarse:

```sql
ALTER TABLE grupos ADD COLUMN semana_cobro DATE;
ALTER TABLE grupos ADD COLUMN numero_integrantes INTEGER;
```

### Tabla `creditos` - Crear si no existe con estos campos:

```sql
CREATE TABLE creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID REFERENCES grupos(id),
    expediente_id UUID REFERENCES expedientes(id),
    ciclo_numero INTEGER,
    monto_prestamo DECIMAL(10,2),
    monto_total DECIMAL(10,2),
    tasa INTEGER,
    plazo_semanas INTEGER,
    pago_semanal DECIMAL(10,2),
    fecha_desembolso DATE,
    semana_desembolso INTEGER,
    fecha_vencimiento DATE,
    semana_vencimiento INTEGER,
    retencion_inicial DECIMAL(10,2),
    costo_apertura DECIMAL(10,2),
    seguro_persona DECIMAL(10,2),
    monto_seguro DECIMAL(10,2),
    total_pagado DECIMAL(10,2),
    saldo_pendiente DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'VIGENTE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. ESTRATEGIA DE MIGRACIÓN RECOMENDADA

### Fase 1: Preparación
1. ✅ Analizar estructura del archivo (COMPLETADO)
2. ⬜ Actualizar schema de PostgreSQL con campos faltantes
3. ⬜ Crear tabla `creditos` si no existe
4. ⬜ Crear tabla de mapeo `migracion_grupos_legacy` para tracking

### Fase 2: Extracción
1. ⬜ Exportar datos del Excel a CSV limpio
2. ⬜ Limpiar formatos de moneda (quitar $, comas)
3. ⬜ Convertir fechas de Excel a formato ISO
4. ⬜ Normalizar nombres de grupos y asesores

### Fase 3: Migración de Grupos
1. ⬜ Insertar grupos únicos (agrupar por # GPO)
2. ⬜ Crear mapeo entre # GPO (legacy) y nuevo UUID

### Fase 4: Migración de Expedientes
1. ⬜ Crear expediente por cada grupo+ciclo
2. ⬜ Vincular con grupos migrados
3. ⬜ Buscar y vincular asesoras por nombre/código

### Fase 5: Migración de Créditos
1. ⬜ Insertar datos financieros por cada grupo+ciclo
2. ⬜ Vincular con expedientes creados

### Fase 6: Validación
1. ⬜ Contar registros: Excel vs PostgreSQL
2. ⬜ Validar sumas: Total préstamos, total pagado
3. ⬜ Verificar integridad referencial

---

## 6. SCRIPT SQL PRELIMINAR

```sql
-- 1. Crear tabla de mapeo temporal
CREATE TABLE IF NOT EXISTS migracion_grupos_legacy (
    id SERIAL PRIMARY KEY,
    gpo_numero_legacy INTEGER,
    grupo_uuid UUID REFERENCES grupos(id),
    nombre_grupo_legacy VARCHAR(255),
    migrado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Actualizar grupos con campos necesarios
ALTER TABLE grupos 
    ADD COLUMN IF NOT EXISTS semana_cobro DATE,
    ADD COLUMN IF NOT EXISTS numero_integrantes INTEGER;

-- 3. Actualizar expedientes con campos necesarios
ALTER TABLE expedientes
    ADD COLUMN IF NOT EXISTS ciclo_numero INTEGER;

-- 4. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_grupos_folio ON grupos(folio);
CREATE INDEX IF NOT EXISTS idx_expedientes_grupo_ciclo ON expedientes(grupo_id, ciclo_numero);
CREATE INDEX IF NOT EXISTS idx_migracion_gpo_legacy ON migracion_grupos_legacy(gpo_numero_legacy);
```

---

## 7. CONSIDERACIONES IMPORTANTES

### ⚠️ Datos de Integrantes Individuales
- **NO están disponibles** en BASE DE DATOS SEM 364.xlsm
- Este archivo solo contiene datos agregados por grupo
- Se necesita otra fuente para migrar integrantes individuales

### ✅ Datos que SÍ se pueden migrar
- ✅ Grupos (nombre, número)
- ✅ Expedientes por ciclo
- ✅ Datos financieros completos
- ✅ Fechas de desembolso y vencimiento
- ✅ Montos y tasas
- ✅ Estado de pagos (totales por grupo)

### ⚠️ Datos parciales
- ⚠️ Asesoras (solo código/nombre, hay que buscar el ID)
- ⚠️ Sucursales (no disponibles)
- ⚠️ Zonas (no disponibles)

---

## 8. PRÓXIMOS PASOS

1. **Validar con el usuario**: Confirmar que este archivo es la fuente correcta para grupos
2. **Buscar archivo de integrantes**: Necesitamos otra fuente para datos individuales
3. **Actualizar schema**: Ejecutar ALTER TABLEs necesarios
4. **Crear script de migración**: Python/Node.js para leer Excel y poblar BD
5. **Ejecutar migración piloto**: Con 10-20 registros para validar
6. **Migración completa**: Una vez validado el piloto

---

**Fecha de análisis**: 2026-08-02  
**Analizado por**: Claude Code  
**Archivo revisado**: BASE DE DATOS SEM 364.xlsm  
