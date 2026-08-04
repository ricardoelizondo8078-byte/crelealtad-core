# 🔄 FLUJO DE TABLAS CORE - CRELEALTAD

## 📊 DIAGRAMA DE RELACIONES

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DEL SISTEMA                    │
└──────────────────────────────────────────────────────────────────┘

1️⃣ GRUPOS (El grupo solidario)
    ├─ nombre: "Grupo Las Rosas"
    ├─ estado: ACTIVO
    └─ created_at: 2025-01-15
         │
         │ 1:N (un grupo tiene muchos ciclos)
         ▼
2️⃣ CICLOS (Renovaciones del grupo)
    ├─ grupo_id → GRUPOS
    ├─ numero_ciclo: 1, 2, 3...
    ├─ fecha_inicio: 2025-01-15
    └─ estado: ACTIVO
         │
         │ 1:1 (un ciclo = un expediente)
         ▼
3️⃣ EXPEDIENTES (Carpeta de documentación)
    ├─ group_id → GRUPOS
    ├─ estado: DOCUMENTANDO
    └─ fecha_apertura: 2025-01-15
         │
         │ 1:N (un expediente tiene muchos integrantes)
         ▼
4️⃣ INTEGRANTES (Miembros del grupo)
    ├─ expediente_id → EXPEDIENTES
    ├─ persona_id → PERSONAS
    ├─ posicion: 1, 2, 3... (orden en el grupo)
    └─ rol: TITULAR, SUPLENTE
         │
         │ N:1 (muchos integrantes → una persona)
         ├────────────────────────┐
         │                        │
         ▼                        ▼
5️⃣ PERSONAS                  6️⃣ SOLICITUDES
    (Catálogo)                  (Solicitud individual)
    ├─ nombre                   ├─ integrante_id → INTEGRANTES
    ├─ curp                     ├─ monto_solicitado: $5,000
    ├─ fecha_nac                ├─ domicilio completo
    └─ genero                   ├─ negocio
                                ├─ referencias
                                └─ beneficiario
                                     │
                                     │ 1:N (una solicitud = muchos docs)
                                     ▼
                                7️⃣ DOCUMENTOS
                                    (Archivos capturados)
                                    ├─ solicitud_id (o integrante_id)
                                    ├─ tipo: INE, COMPROBANTE
                                    ├─ ruta_archivo
                                    └─ estado: CAPTURADO
```

---

## 📋 EXPLICACIÓN TABLA POR TABLA

### 1️⃣ **GRUPOS** (El grupo solidario)

**¿Qué es?**
El grupo de personas que solicitan crédito en forma solidaria.

**Información:**
```sql
grupos:
  - id
  - name: "Grupo Las Rosas"
  - estado: ACTIVO, DOCUMENTANDO, COMPLETADO
  - created_at
```

**Ejemplo:**
- Grupo Las Rosas (5 señoras del mercado)
- Grupo San Pedro (8 comerciantes)

**Se crea cuando:**
El asesor forma un nuevo grupo.

---

### 2️⃣ **CICLOS** (Renovaciones del grupo)

**¿Qué es?**
Cada vez que un grupo renueva su crédito, es un nuevo ciclo.

**Información:**
```sql
ciclos:
  - id
  - grupo_id → FK a GRUPOS
  - numero_ciclo: 1, 2, 3, 4...
  - fecha_inicio
  - fecha_fin
  - monto_total
  - estado: ACTIVO, COMPLETADO
```

**Ejemplo:**
- Grupo Las Rosas - Ciclo 1 (Enero 2025, $25,000)
- Grupo Las Rosas - Ciclo 2 (Julio 2025, $30,000)
- Grupo Las Rosas - Ciclo 3 (Enero 2026, $35,000)

**Se crea cuando:**
- Primera vez: al formar el grupo (ciclo 1)
- Renovación: cuando el grupo termina de pagar y renueva (ciclo 2, 3...)

---

### 3️⃣ **EXPEDIENTES** (Carpeta de documentación)

**¿Qué es?**
La carpeta que contiene toda la documentación del grupo en un ciclo específico.

**Información:**
```sql
expedientes:
  - id
  - group_id → FK a GRUPOS
  - estado: DOCUMENTANDO, COMPLETADO, VERIFICACION
  - fecha_apertura
  - fecha_cierre
```

**Relación con ciclos:**
- 1 Ciclo = 1 Expediente
- Cada renovación = nuevo expediente

**Se crea cuando:**
El asesor abre un expediente para documentar al grupo.

**Ejemplo:**
- Expediente #001 → Grupo Las Rosas, Ciclo 1
- Expediente #045 → Grupo Las Rosas, Ciclo 2

---

### 4️⃣ **INTEGRANTES** (Miembros del grupo)

**¿Qué es?**
Cada persona que forma parte del grupo EN ESTE CICLO.

**Información:**
```sql
integrantes:
  - id
  - expediente_id → FK a EXPEDIENTES
  - persona_id → FK a PERSONAS
  - posicion: 1, 2, 3, 4, 5... (orden en el grupo)
  - rol: TITULAR, SUPLENTE
  - monto_solicitado
```

**Importante:**
- Un grupo puede tener DISTINTOS integrantes en cada ciclo
- María puede estar en Ciclo 1, pero no en Ciclo 2
- Pedro puede entrar nuevo en Ciclo 3

**Ejemplo:**
```
Grupo Las Rosas - Ciclo 1:
  1. María (TITULAR)
  2. Ana (TITULAR)
  3. Lucía (TITULAR)
  4. Carmen (TITULAR)
  5. Rosa (TITULAR)

Grupo Las Rosas - Ciclo 2:
  1. María (TITULAR)  ← se quedó
  2. Ana (TITULAR)    ← se quedó
  3. Lucía (TITULAR)  ← se quedó
  4. Carmen (TITULAR) ← se quedó
  5. Juana (TITULAR)  ← nueva (Rosa salió)
```

**Se crea cuando:**
El asesor agrega una persona al expediente.

---

### 5️⃣ **PERSONAS** (Catálogo de personas)

**¿Qué es?**
Tabla catálogo con datos personales básicos de todas las personas.

**Información:**
```sql
personas:
  - id
  - nombre
  - apellido_paterno
  - apellido_materno
  - curp (ÚNICO)
  - fecha_nacimiento
  - genero
  - telefono
```

**Propósito:**
- Evitar duplicar datos personales
- Una persona puede estar en MÚLTIPLES grupos/ciclos
- Datos personales SE COMPARTEN entre ciclos

**Ejemplo:**
```
Persona: María López García (CURP: LOGM850515...)
  ↓
Integrante en:
  - Grupo Las Rosas, Ciclo 1
  - Grupo Las Rosas, Ciclo 2
  - Grupo San Pedro, Ciclo 1 (puede estar en 2 grupos!)
```

**Se crea cuando:**
Es la primera vez que una persona entra al sistema.

**NO se duplica:**
Si María ya existe, al agregarla a un nuevo grupo, se REUTILIZA el registro.

---

### 6️⃣ **SOLICITUDES** (Solicitud de crédito individual)

**¿Qué es?**
Los datos de la solicitud de crédito de CADA integrante.

**Información:**
```sql
solicitudes:
  - id
  - integrante_id → FK a INTEGRANTES (1:1)
  
  -- Datos CURP (pueden venir de personas o capturarse aquí)
  - curp, fecha_nac, genero
  
  -- Domicilio (ESPECÍFICO de esta solicitud)
  - dom_calle, dom_numero, dom_colonia, dom_municipio
  
  -- Negocio
  - negocio_nombre, negocio_giro, negocio_domicilio
  
  -- Referencias (2 personas de contacto)
  - referencia1_nombre, referencia1_telefono
  - referencia2_nombre, referencia2_telefono
  
  -- Beneficiario
  - beneficiario_nombre, beneficiario_parentesco
  
  -- Servicios
  - tiene_medidor_luz, tiene_agua
  
  -- Crédito
  - monto_solicitado, destino_credito, plazo_meses
```

**Propósito:**
Capturar TODA la información necesaria para aprobar un crédito.

**Importante:**
- 1 Integrante = 1 Solicitud
- Los datos de domicilio/negocio son ESPECÍFICOS de ESTE ciclo
- Si María renueva en Ciclo 2, tendrá una NUEVA solicitud
  (su domicilio pudo haber cambiado)

**Se crea cuando:**
El asesor captura la solicitud del integrante.

---

### 7️⃣ **DOCUMENTOS** (Archivos capturados)

**¿Qué es?**
Las fotografías/PDFs de los documentos de cada solicitud.

**Información:**
```sql
documentos:
  - id
  - tipo: INE, COMPROBANTE_DOMICILIO, SOLICITUD_FIRMADA
  - ruta_archivo: "uploads/2025/01/ine_frente_123.jpg"
  - fecha_captura
  - estado: PENDIENTE, CAPTURADO
```

**Actualmente hay 2 enfoques (⚠️ necesitas decidir):**

#### Opción A: Tabla documentos (separada)
```sql
documentos:
  - integrante_id o solicitud_id
  - tipo
  - ruta_archivo
```

#### Opción B: Columnas en solicitudes (actual)
```sql
solicitudes:
  - doc_ine_ruta
  - doc_comprobante_ruta
  - doc_solicitud_firmada_ruta
```

**Se crea cuando:**
El asesor captura foto de INE, comprobante, etc. desde la app móvil.

---

## 🔄 FLUJO COMPLETO PASO A PASO

### PASO 1: Crear Grupo
```
ASESOR: "Voy a formar un grupo nuevo"
  ↓
SISTEMA crea:
  ✓ Registro en GRUPOS: "Grupo Las Rosas"
  ✓ Estado: ACTIVO
```

### PASO 2: Crear Expediente
```
ASESOR: "Voy a documentar este grupo"
  ↓
SISTEMA crea:
  ✓ Registro en EXPEDIENTES
  ✓ Vinculado a: Grupo Las Rosas
  ✓ Estado: DOCUMENTANDO
```

### PASO 3: Agregar Integrantes
```
ASESOR: "María López García va a entrar al grupo"
  ↓
SISTEMA:
  1. Busca en PERSONAS por CURP
     - ¿Existe? → Reutiliza el registro
     - ¿No existe? → Crea nuevo en PERSONAS
  
  2. Crea en INTEGRANTES:
     ✓ expediente_id → Expediente actual
     ✓ persona_id → María
     ✓ posicion → 1

Repetir para Ana (pos 2), Lucía (pos 3), etc.
```

### PASO 4: Capturar Solicitud
```
ASESOR: "Voy a capturar los datos de María"
  ↓
SISTEMA crea en SOLICITUDES:
  ✓ integrante_id → María (integrante #1)
  ✓ CURP, domicilio, negocio, referencias
  ✓ Monto solicitado: $5,000
  ✓ Estado: capturando paso a paso (7 pasos)
```

### PASO 5: Capturar Documentos
```
ASESOR: "Tomo foto de INE de María"
  ↓
SISTEMA guarda:
  ✓ En tabla DOCUMENTOS (o columnas de SOLICITUDES)
  ✓ tipo: INE_FRENTE
  ✓ ruta_archivo: "uploads/maria_ine_frente.jpg"
```

### PASO 6: Completar Expediente
```
TODOS los integrantes tienen:
  ✓ Solicitud completa
  ✓ Documentos capturados
  ↓
SISTEMA:
  ✓ Estado de EXPEDIENTE → COMPLETADO
  ✓ Listo para verificación
```

### PASO 7: Renovación (Ciclo 2)
```
6 meses después...
ASESOR: "Grupo Las Rosas quiere renovar"
  ↓
SISTEMA:
  1. Crea CICLO nuevo:
     ✓ grupo_id → Grupo Las Rosas
     ✓ numero_ciclo → 2
  
  2. Crea EXPEDIENTE nuevo:
     ✓ group_id → Grupo Las Rosas
     ✓ Estado: DOCUMENTANDO
  
  3. ASESOR selecciona quiénes renuevan:
     - María → SÍ renueva
     - Ana → SÍ renueva
     - Rosa → NO renueva (sale del grupo)
     - Juana → NUEVA integrante
  
  4. Crea INTEGRANTES nuevos:
     ✓ María (persona_id existente, NUEVO integrante)
     ✓ Ana (persona_id existente, NUEVO integrante)
     ✓ Juana (persona_id nuevo, NUEVO integrante)
  
  5. Crea SOLICITUDES nuevas para cada una:
     ✓ Datos pueden haber cambiado
     ✓ Nuevo monto solicitado
     ✓ Captura todo de nuevo
```

---

## 📊 EJEMPLO REAL COMPLETO

### Grupo Las Rosas - Ciclo 1

**1. GRUPOS**
```
id: abc-123
name: "Grupo Las Rosas"
estado: ACTIVO
```

**2. EXPEDIENTES**
```
id: exp-001
group_id: abc-123
estado: COMPLETADO
```

**3. PERSONAS**
```
id: per-001 | nombre: María | curp: LOGM850515...
id: per-002 | nombre: Ana   | curp: GAHA900822...
id: per-003 | nombre: Lucía | curp: ROLL780315...
```

**4. INTEGRANTES**
```
id: int-001 | expediente: exp-001 | persona: per-001 | posicion: 1
id: int-002 | expediente: exp-001 | persona: per-002 | posicion: 2
id: int-003 | expediente: exp-001 | persona: per-003 | posicion: 3
```

**5. SOLICITUDES**
```
id: sol-001 | integrante: int-001 | monto: $5,000 | domicilio: Av. Juárez 123
id: sol-002 | integrante: int-002 | monto: $4,500 | domicilio: Calle 5 de Mayo 456
id: sol-003 | integrante: int-003 | monto: $6,000 | domicilio: Av. Hidalgo 789
```

**6. DOCUMENTOS** (o columnas)
```
doc-001 | solicitud: sol-001 | tipo: INE_FRENTE     | ruta: maria_ine_f.jpg
doc-002 | solicitud: sol-001 | tipo: INE_REVERSO    | ruta: maria_ine_r.jpg
doc-003 | solicitud: sol-001 | tipo: COMPROBANTE    | ruta: maria_comp.jpg
... (x3 integrantes = ~12 documentos)
```

---

## 🎯 QUERIES DE EJEMPLO

### Ver todos los integrantes de un expediente
```sql
SELECT 
  i.posicion,
  p.nombre || ' ' || p.apellido_paterno as nombre_completo,
  s.monto_solicitado
FROM integrantes i
JOIN personas p ON p.id = i.persona_id
LEFT JOIN solicitudes s ON s.integrante_id = i.id
WHERE i.expediente_id = 'exp-001'
ORDER BY i.posicion;
```

### Ver historial de ciclos de un grupo
```sql
SELECT 
  c.numero_ciclo,
  c.fecha_inicio,
  c.monto_total,
  c.estado,
  COUNT(i.id) as total_integrantes
FROM ciclos c
LEFT JOIN expedientes e ON e.group_id = c.grupo_id
LEFT JOIN integrantes i ON i.expediente_id = e.id
WHERE c.grupo_id = 'abc-123'
GROUP BY c.id
ORDER BY c.numero_ciclo;
```

### Ver todos los grupos donde María ha participado
```sql
SELECT 
  g.name as grupo,
  c.numero_ciclo,
  i.posicion,
  s.monto_solicitado
FROM personas p
JOIN integrantes i ON i.persona_id = p.id
JOIN expedientes e ON e.id = i.expediente_id
JOIN grupos g ON g.id = e.group_id
LEFT JOIN ciclos c ON c.grupo_id = g.id
WHERE p.curp = 'LOGM850515...'
ORDER BY c.fecha_inicio;
```

---

## ⚠️ DECISIONES PENDIENTES

### 1. ¿DOCUMENTOS en tabla separada o columnas en SOLICITUDES?

**Actualmente:**
- Tabla `documentos` existe PERO está vacía
- Columnas `doc_*_ruta` en `solicitudes` están en uso

**Recomendación:**
- Usar SOLO tabla `documentos` (más escalable)
- O eliminar tabla `documentos` y usar solo columnas
- **NO tener ambos** (duplicación confusa)

### 2. ¿Relación CICLOS ↔ EXPEDIENTES?

**Actualmente:**
- `ciclos.grupo_id` existe
- `expedientes.group_id` existe
- Pero NO hay FK directa entre ciclos ↔ expedientes

**Recomendación:**
- Agregar `expedientes.ciclo_id` → FK a ciclos
- O agregar `ciclos.expediente_id` → FK a expedientes
- Relación 1:1 (un ciclo = un expediente)

---

## 📋 RESUMEN EJECUTIVO

| TABLA | PROPÓSITO | SE CREA CUANDO | RELACIÓN |
|-------|-----------|----------------|----------|
| **GRUPOS** | Grupo solidario | Asesor forma grupo | Raíz del árbol |
| **CICLOS** | Renovaciones | Ciclo 1 o renovación | 1 grupo → N ciclos |
| **EXPEDIENTES** | Carpeta de docs | Abrir documentación | 1 grupo → N expedientes |
| **PERSONAS** | Catálogo de personas | Primera vez en sistema | Reutilizable |
| **INTEGRANTES** | Miembros en un ciclo | Agregar al expediente | N integrantes → 1 expediente |
| **SOLICITUDES** | Solicitud individual | Capturar datos | 1 integrante → 1 solicitud |
| **DOCUMENTOS** | Fotos/PDFs | Capturar documento | N docs → 1 solicitud |

---

¿Quieres que profundice en alguna tabla específica o que diseñe queries para casos de uso específicos?
