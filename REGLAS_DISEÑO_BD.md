# 🎯 REGLAS DE DISEÑO DE BD - CRELEALTAD

## Para NUNCA volver a tener tablas con 45+ columnas

---

## ✅ REGLA #1: MÁXIMO 20 COLUMNAS POR TABLA

**Antes de crear una tabla, pregúntate:**

```
¿Esta tabla tiene más de 20 columnas?
  ├─ SÍ → DIVIDIR en múltiples tablas
  └─ NO → Continuar
```

**Excepciones permitidas (máximo 25):**
- Tablas de configuración muy complejas
- Auditoría completa de eventos

---

## ✅ REGLA #2: TEST DE "GRUPOS DE CAMPOS"

Si encuentras **3+ campos con el mismo prefijo**, necesitas tabla separada:

```
❌ MAL:
solicitudes:
  - dom_calle
  - dom_numero
  - dom_colonia
  - dom_municipio
  - dom_estado
  - dom_cp

✅ BIEN:
solicitudes:
  - id
  - (solo datos de solicitud)

solicitudes_domicilios:
  - solicitud_id (FK)
  - calle
  - numero
  - colonia
  - municipio
  - estado
  - codigo_postal
```

---

## ✅ REGLA #3: TEST DE "CAMPOS REPETIDOS CON NÚMERO"

Si tienes **campo1, campo2, campo3...**, necesitas tabla separada:

```
❌ MAL:
solicitudes:
  - referencia1_nombre
  - referencia1_telefono
  - referencia2_nombre
  - referencia2_telefono

✅ BIEN:
solicitudes:
  - id

solicitudes_referencias:
  - id
  - solicitud_id (FK)
  - orden (1, 2, 3)
  - nombre
  - telefono
```

---

## ✅ REGLA #4: TEST DE "DATOS OPCIONALES POR CONTEXTO"

Si **<30% de registros** usan ciertos campos, tabla separada:

```
❌ MAL:
solicitudes:
  - id
  - tiene_medidor_luz
  - medidor_numero
  - compania_luz
  - tiene_agua
  - agua_numero
  - compania_agua
  (solo 20% de solicitudes tienen medidores)

✅ BIEN:
solicitudes:
  - id

solicitudes_servicios:
  - solicitud_id (FK)
  - tipo_servicio (LUZ, AGUA, GAS)
  - tiene_medidor
  - numero_medidor
  - compania
```

---

## ✅ REGLA #5: TEST DE "ARCHIVOS/DOCUMENTOS"

Si tienes **campos de rutas de archivos**, SIEMPRE tabla separada:

```
❌ MAL:
asesoras:
  - foto_perfil_ruta
  - foto_ine_frente_ruta
  - foto_ine_reverso_ruta
  - foto_comprobante_ruta

✅ BIEN:
asesoras:
  - id

asesoras_documentos:
  - id
  - asesor_id (FK)
  - tipo_documento
  - ruta_archivo
  - fecha_captura
  - estado (VIGENTE, VENCIDO)
```

**Ventajas:**
- Múltiples versiones del mismo documento
- Historial completo
- Marcar documentos vencidos
- Agregar nuevos tipos sin alterar esquema

---

## ✅ REGLA #6: TEST DE "FRECUENCIA DE CAMBIO"

Agrupa campos por **cuánto cambian**:

```
CAMBIA RARAMENTE → Tabla principal
  - nombre, CURP, fecha_nacimiento

CAMBIA OCASIONALMENTE → Tabla separada
  - teléfono, email, domicilio

CAMBIA FRECUENTEMENTE → Tabla separada
  - metas, evaluaciones, observaciones

CAMBIA TODO EL TIEMPO → Tabla de historial
  - geolocalización, check-ins
```

---

## ✅ REGLA #7: LISTA DE VERIFICACIÓN PRE-CREACIÓN

Antes de ejecutar `CREATE TABLE`, responde:

```
☐ ¿Menos de 20 columnas?
☐ ¿No hay grupos de campos con prefijo común?
☐ ¿No hay campo1, campo2, campo3?
☐ ¿No hay campos que solo usan <30% de registros?
☐ ¿No hay múltiples rutas de archivos?
☐ ¿Todos los campos cambian con similar frecuencia?
☐ ¿Puedo explicar CADA campo en 1 frase?

Si alguna respuesta es NO → REVISAR DISEÑO
```

---

## 🎯 PROCESO DE 3 PASOS (Siempre seguir)

### PASO 1: DISEÑAR EN PAPEL PRIMERO

```
ANTES de escribir CREATE TABLE:
  1. Listar TODOS los campos que necesitas
  2. Agrupar por "tema" o "responsabilidad"
  3. Contar columnas por grupo
  4. Si un grupo tiene >20 campos → dividir
```

### PASO 2: VALIDAR CON CHECKLIST

```
Aplicar las 7 reglas de arriba
  - Revisar prefijos
  - Revisar campos numerados
  - Revisar archivos
  - Revisar frecuencia de cambio
```

### PASO 3: CREAR DIAGRAMA

```
Dibujar relaciones:
  tabla_principal ──┬── tabla_contacto (1:1)
                    ├── tabla_domicilios (1:N)
                    └── tabla_documentos (1:N)

¿Tiene sentido visualmente?
¿Fácil de explicar a alguien más?
```

---

## 🚨 SEÑALES DE ALERTA (Red flags)

Si ves esto, DETENTE y rediseña:

🔴 **Tabla con >25 columnas**
🔴 **Campos NULL en >50% de registros**
🔴 **Prefijos repetidos (dom_, negocio_, ref1_, ref2_)**
🔴 **Más de 3 campos de fecha con mismo sufijo (_fecha, _fecha_inicio)**
🔴 **Comentario en código: "Esta tabla es muy grande pero..."**

---

## ✅ EJEMPLO: CÓMO ANALIZAR `solicitudes` (81 columnas)

### 1. Listar todos los campos

```
solicitudes (81 columnas):
  Identificación: id, folio, integrante_id, estado (4)
  Datos personales: nombre, apellidos, CURP, fecha_nac... (8)
  Domicilio personal: dom_calle, dom_numero, dom_colonia... (8)
  Negocio: negocio_nombre, negocio_giro, negocio_domicilio... (10)
  Referencias: ref1_nombre, ref1_tel, ref2_nombre, ref2_tel... (12)
  Beneficiario: benef_nombre, benef_parentesco... (6)
  Documentos: doc_ine_ruta, doc_comprobante_ruta... (12)
  Servicios: tiene_luz, medidor_luz, tiene_agua... (8)
  Crédito: monto, plazo, destino... (6)
  Control: created_at, updated_at, firma... (7)
```

### 2. Agrupar y contar

```
GRUPOS DETECTADOS:
  ✅ Identificación (4) → OK en solicitudes
  🔴 Datos personales (8) → Ya están en tabla personas
  🔴 Domicilio (8) → Tabla separada: solicitudes_domicilios
  🔴 Negocio (10) → Tabla separada: solicitudes_negocios
  🔴 Referencias (12) → Tabla separada: solicitudes_referencias
  🔴 Beneficiario (6) → Tabla separada: solicitudes_beneficiarios
  🔴 Documentos (12) → Tabla separada: solicitudes_documentos
  🔴 Servicios (8) → Tabla separada: solicitudes_servicios
  ✅ Crédito (6) → OK en solicitudes
  ✅ Control (7) → OK en solicitudes
```

### 3. Resultado normalizado

```
solicitudes (17 columnas)
  ├── solicitudes_domicilios (10 cols, 1:N)
  ├── solicitudes_negocios (8 cols, 1:1)
  ├── solicitudes_referencias (6 cols, 1:N)
  ├── solicitudes_beneficiarios (7 cols, 1:N)
  ├── solicitudes_documentos (7 cols, 1:N)
  └── solicitudes_servicios (6 cols, 1:N)
```

---

## 🎯 TEMPLATE DE DISEÑO (Usar siempre)

```markdown
# TABLA: [nombre_tabla]

## Propósito
[En 1 frase: qué guarda esta tabla]

## Campos (objetivo: <20)
- id
- [campo1]
- [campo2]
...

## Relaciones
- FK a [otra_tabla]
- 1:N con [tabla_hijos]

## Validaciones
☐ <20 columnas
☐ No hay prefijos repetidos
☐ No hay campo1, campo2
☐ No hay archivos múltiples
☐ Frecuencia de cambio similar

## Preguntas
- ¿Puedo explicar cada campo?
- ¿Tiene un solo propósito claro?
- ¿Fácil de mantener?
```

---

## 💡 RESUMEN: 3 PREGUNTAS MÁGICAS

Antes de crear tabla, pregunta:

1. **¿Puedo dividir esto en grupos lógicos de <15 campos?**
   - Si SÍ → hazlo

2. **¿Cuántos de estos campos son opcionales/raros?**
   - Si >30% → tabla separada

3. **¿En 6 meses, podré entender esta tabla fácilmente?**
   - Si NO → rediseñar

---

## 🔄 POLÍTICA DE REVISIÓN

**Cada 3 meses:**
- Revisar tablas con >20 columnas
- Revisar tablas con >30% NULLs
- Planear normalización gradual

**Nunca:**
- Agregar "solo un campo más" a tabla >25 columnas
- Decir "ya después lo arreglamos"
- Crear campo_1, campo_2, campo_3

---

Esta guía se sigue **SIN EXCEPCIÓN** en todos los desarrollos futuros.
