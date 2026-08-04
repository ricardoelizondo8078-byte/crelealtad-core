# 📊 DOCUMENTACIÓN TABLAS CORE DEL SISTEMA

## 📋 TABLAS INCLUIDAS

Este documento explica las 6 tablas principales del flujo operativo de CRELEALTAD:

1. **GRUPOS** - Grupos solidarios
2. **CICLOS** - Renovaciones de grupos
3. **EXPEDIENTES** - Carpetas de documentación
4. **PERSONAS** - Catálogo de personas
5. **INTEGRANTES** - Miembros de un expediente
6. **DOCUMENTOS** - Archivos capturados

**Archivo CSV:** `ESQUEMA_TABLAS_CORE.csv` (67 columnas documentadas)

---

## 1️⃣ GRUPOS (11 columnas)

**Responsabilidad:** Representa un grupo solidario de crédito.

### Estructura:

```sql
grupos:
  -- Identificación
  id (UUID PK)
  name (VARCHAR 100)
  
  -- Ubicación
  zona_id → FK zonas
  sucursal_id → FK sucursales
  
  -- Estado
  status (VARCHAR 20)
  
  -- Datos operativos
  numero_integrantes (INTEGER)
  monto_total (NUMERIC)
  fecha_formacion (DATE)
  
  -- Timestamps
  created_at (TIMESTAMPTZ)
  updated_at (TIMESTAMPTZ)
  deleted_at (TIMESTAMPTZ) - Soft delete
```

### Datos Actuales:
- **9 grupos** registrados

### Ejemplo:
```
Grupo: "Las Rosas"
Zona: Norte
Sucursal: Guadalajara Centro
Integrantes: 5 personas
Estado: ACTIVO
```

---

## 2️⃣ CICLOS (13 columnas)

**Responsabilidad:** Representa una renovación/ciclo de un grupo.

### Estructura:

```sql
ciclos:
  -- Identificación
  id (UUID PK)
  grupo_id → FK grupos
  numero (INTEGER) - 1, 2, 3, 4...
  
  -- Relación con expediente
  expediente_id → FK expedientes
  
  -- Fechas
  fecha_inicio (DATE)
  fecha_fin (DATE)
  fecha_desembolso (DATE)
  
  -- Montos
  monto_total (NUMERIC)
  monto_desembolsado (NUMERIC)
  
  -- Personal
  asesora_id → FK empleados
  tesorera_id → FK personas
  
  -- Estado
  estado (VARCHAR 50)
  
  -- Timestamps
  created_at, updated_at
```

### Datos Actuales:
- **0 ciclos** registrados (aún no hay renovaciones)

### Ejemplo:
```
Grupo: "Las Rosas"
Ciclo: 1 (primer préstamo)
Fecha inicio: 2026-01-15
Monto total: $25,000
Asesor: Juan Pérez
Estado: ACTIVO
```

### Flujo:
1. Ciclo 1: Primer crédito del grupo
2. Ciclo 2: Primera renovación (después de pagar)
3. Ciclo 3: Segunda renovación
4. ...y así sucesivamente

---

## 3️⃣ EXPEDIENTES (12 columnas)

**Responsabilidad:** Carpeta que contiene la documentación de un grupo en un ciclo.

### Estructura:

```sql
expedientes:
  -- Identificación
  id (UUID PK)
  folio (VARCHAR 50)
  grupo_id → FK grupos
  
  -- Relaciones
  producto_id → FK productos_credito
  asesora_id → FK empleados
  
  -- Fechas
  fecha_apertura (DATE)
  fecha_cierre (DATE)
  fecha_ultimo_cambio (TIMESTAMPTZ)
  
  -- Estado
  estado (VARCHAR 50) - DOCUMENTANDO, COMPLETADO, etc.
  numero_integrantes (INTEGER)
  
  -- Timestamps
  created_at, updated_at
```

### Datos Actuales:
- **9 expedientes** registrados

### Estados Posibles:
- `DOCUMENTANDO` - En proceso de captura
- `COMPLETADO` - Toda la documentación capturada
- `EN_VERIFICACION` - Siendo revisado
- `APROBADO` - Listo para desembolso
- `RECHAZADO` - No cumple requisitos

### Ejemplo:
```
Expediente: #EXP-2026-001
Grupo: "Las Rosas"
Producto: Crédito Grupal
Integrantes: 5
Estado: DOCUMENTANDO
Asesor: Juan Pérez
```

---

## 4️⃣ PERSONAS (15 columnas)

**Responsabilidad:** Catálogo de todas las personas del sistema (solicitantes, empleados, referencias).

### Estructura:

```sql
personas:
  -- Identificación
  id (UUID PK)
  curp (VARCHAR 18) UNIQUE
  
  -- Nombre completo
  nombre (VARCHAR 100)
  apellido_paterno (VARCHAR 100)
  apellido_materno (VARCHAR 100)
  
  -- Datos personales
  fecha_nacimiento (DATE)
  genero (VARCHAR 10)
  estado_civil (VARCHAR 20)
  
  -- Contacto
  telefono (VARCHAR 20)
  email (VARCHAR 100)
  
  -- Dirección básica
  estado (VARCHAR 50)
  municipio (VARCHAR 100)
  
  -- Control
  tipo_persona (VARCHAR 20) - SOLICITANTE, EMPLEADO, REFERENCIA
  
  -- Timestamps
  created_at, updated_at
```

### Datos Actuales:
- **10 personas** registradas

### Tipos de Persona:
- `SOLICITANTE` - Persona que solicita crédito
- `EMPLEADO` - Empleado de la empresa
- `REFERENCIA` - Referencia de un solicitante
- `BENEFICIARIO` - Beneficiario de un solicitante

### Ejemplo:
```
Persona: María López García
CURP: LOGM850515MDFXXX01
Tipo: SOLICITANTE
Teléfono: 3312345678
```

### Importante:
- ✅ **ÚNICA FUENTE DE VERDAD** para datos personales básicos
- ✅ **REUTILIZABLE** - Una persona puede estar en múltiples grupos/ciclos
- ✅ **NO SE DUPLICA** - Si María ya existe, se reutiliza el registro

---

## 5️⃣ INTEGRANTES (7 columnas)

**Responsabilidad:** Relaciona una persona con un expediente (quién está en qué grupo).

### Estructura:

```sql
integrantes:
  -- Identificación
  id (UUID PK)
  
  -- Relaciones
  expediente_id → FK expedientes
  persona_id → FK personas
  
  -- Posición en el grupo
  posicion (INTEGER) - 1, 2, 3, 4, 5...
  
  -- Rol
  rol (VARCHAR 20) - TITULAR, SUPLENTE
  
  -- Monto
  monto_solicitado (NUMERIC)
  
  -- Timestamps
  created_at, updated_at
```

### Datos Actuales:
- **10 integrantes** registrados

### Ejemplo:
```
Expediente: #EXP-2026-001
Persona: María López García
Posición: 1 (primera en el grupo)
Rol: TITULAR
Monto solicitado: $5,000
```

### Flujo:
```
Grupo "Las Rosas" - Expediente #001
  ├─ Integrante 1: María López (pos 1, TITULAR, $5,000)
  ├─ Integrante 2: Ana García (pos 2, TITULAR, $4,500)
  ├─ Integrante 3: Lucía Martínez (pos 3, TITULAR, $6,000)
  ├─ Integrante 4: Carmen Rodríguez (pos 4, TITULAR, $5,500)
  └─ Integrante 5: Rosa Hernández (pos 5, TITULAR, $4,000)
```

### Renovaciones:
Si el grupo renueva (Ciclo 2):
- Se crea un NUEVO expediente
- Se crean NUEVOS integrantes
- Las personas pueden ser las mismas O diferentes

```
Ciclo 1 (Expediente #001):
  - María, Ana, Lucía, Carmen, Rosa

Ciclo 2 (Expediente #045):
  - María, Ana, Lucía, Carmen, Juana (Rosa salió, Juana entró)
```

---

## 6️⃣ DOCUMENTOS (9 columnas)

**Responsabilidad:** Almacena las rutas de archivos capturados (fotos, PDFs).

### Estructura:

```sql
documentos:
  -- Identificación
  id (UUID PK)
  
  -- Relaciones
  solicitud_id (UUID) - Puede ser NULL
  integrante_id (UUID) - Puede ser NULL
  
  -- Tipo de documento
  tipo (VARCHAR 50) - INE, COMPROBANTE_DOMICILIO, etc.
  
  -- Archivo
  ruta_archivo (VARCHAR 500)
  fecha_captura (DATE)
  
  -- Estado
  estado (VARCHAR 20) - PENDIENTE, CAPTURADO, VALIDADO
  
  -- Timestamps
  created_at, updated_at
```

### Datos Actuales:
- **0 documentos** registrados

### Tipos de Documento:
- `INE` - Identificación oficial
- `COMPROBANTE_DOMICILIO` - Recibo de luz, agua, etc.
- `COMPROBANTE_INGRESOS` - Ticket de negocio
- `SOLICITUD_FIRMADA` - Formato de solicitud firmado
- `INE_BENEFICIARIO` - INE del beneficiario
- `FOTO_DOMICILIO` - Foto de la casa
- `FOTO_NEGOCIO` - Foto del negocio

### Ejemplo:
```
Documento: INE María López
Tipo: INE
Ruta: uploads/2026/01/ine_maria_lopez_frente_abc123.jpg
Fecha captura: 2026-01-15
Estado: CAPTURADO
```

### Relación con Solicitudes:
- ⚠️ **DECISIÓN PENDIENTE**: ¿Relacionar con `solicitud_id` o con `integrante_id`?
- **Opción A**: `solicitud_id` → Documentos son parte de la solicitud
- **Opción B**: `integrante_id` → Documentos son del integrante (reutilizables entre ciclos)

---

## 🔄 FLUJO COMPLETO DE DATOS

### Paso 1: Crear Grupo
```sql
INSERT INTO grupos (name, zona_id, sucursal_id, status)
VALUES ('Grupo Las Rosas', zona_id, sucursal_id, 'ACTIVO');
```

### Paso 2: Crear Expediente
```sql
INSERT INTO expedientes (grupo_id, producto_id, asesora_id, estado)
VALUES (grupo_id, producto_id, asesora_id, 'DOCUMENTANDO');
```

### Paso 3: Agregar Personas (si no existen)
```sql
-- Buscar por CURP primero
SELECT id FROM personas WHERE curp = 'LOGM850515...';

-- Si NO existe, crear
INSERT INTO personas (curp, nombre, apellido_paterno, ...)
VALUES ('LOGM850515...', 'María', 'López', ...);
```

### Paso 4: Crear Integrantes
```sql
INSERT INTO integrantes (expediente_id, persona_id, posicion, rol, monto_solicitado)
VALUES (expediente_id, persona_id, 1, 'TITULAR', 5000);
```

### Paso 5: Capturar Solicitud
```sql
-- Se crea en las 8 tablas de solicitudes (normalización)
INSERT INTO solicitudes (integrante_id, monto_solicitado, ...)
VALUES (integrante_id, 5000, ...);

INSERT INTO solicitudes_datos_personales (solicitud_id, curp, ...)
VALUES (solicitud_id, 'LOGM850515...', ...);
-- ... etc (8 tablas)
```

### Paso 6: Capturar Documentos
```sql
INSERT INTO documentos (integrante_id, tipo, ruta_archivo, estado)
VALUES (integrante_id, 'INE', 'uploads/...', 'CAPTURADO');
```

---

## 📊 RELACIONES ENTRE TABLAS

```
GRUPOS (9 registros)
  ├─→ zona_id → ZONAS
  ├─→ sucursal_id → SUCURSALES
  │
  └─→ 1:N EXPEDIENTES (9 registros)
       ├─→ grupo_id → GRUPOS
       ├─→ producto_id → PRODUCTOS_CREDITO
       ├─→ asesora_id → EMPLEADOS
       │
       └─→ 1:N INTEGRANTES (10 registros)
            ├─→ expediente_id → EXPEDIENTES
            ├─→ persona_id → PERSONAS (10 registros)
            │
            ├─→ 1:1 SOLICITUDES
            │    └─→ 1:1 (cada) SOLICITUDES_* (8 tablas)
            │
            └─→ 1:N DOCUMENTOS (0 registros)

CICLOS (0 registros)
  ├─→ grupo_id → GRUPOS
  ├─→ expediente_id → EXPEDIENTES
  ├─→ asesora_id → EMPLEADOS
  └─→ tesorera_id → PERSONAS
```

---

## 📈 ESTADÍSTICAS ACTUALES

| Tabla | Columnas | Registros | Normalizada |
|-------|----------|-----------|-------------|
| grupos | 11 | 9 | ✅ |
| ciclos | 13 | 0 | ✅ |
| expedientes | 12 | 9 | ✅ |
| personas | 15 | 10 | ✅ |
| integrantes | 7 | 10 | ✅ |
| documentos | 9 | 0 | ✅ |

**Total:** 67 columnas documentadas

---

## ✅ REGLAS DE NORMALIZACIÓN CUMPLIDAS

1. ✅ **<20 columnas por tabla** - Todas cumplen
2. ✅ **Sin duplicación de datos** - Personas reutilizables
3. ✅ **Foreign keys bien definidas** - Integridad referencial
4. ✅ **Timestamps en todas** - Auditoría completa
5. ✅ **IDs UUID** - Seguridad y escalabilidad

---

## 📚 ARCHIVOS RELACIONADOS

- **CSV Esquema:** `ESQUEMA_TABLAS_CORE.csv`
- **Flujo completo:** `FLUJO_TABLAS_CORE.md`
- **Solicitudes normalizadas:** `ESQUEMA_SOLICITUDES_NORMALIZADO.csv`
- **Este documento:** `DOCUMENTACION_TABLAS_CORE.md`

---

Fecha: 26 de Julio 2026  
Tablas documentadas: 6  
Columnas totales: 67  
Estado: ✅ Documentación completa
