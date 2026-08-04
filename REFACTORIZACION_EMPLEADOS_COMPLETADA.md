# ✅ REFACTORIZACIÓN COMPLETADA: ASESORAS → EMPLEADOS

## 🎯 CAMBIOS REALIZADOS

### 1️⃣ **ASESORAS → EMPLEADOS** (Genérico para todos los roles)

**ANTES:**
```
asesoras (14 columnas) - Solo para asesores
```

**AHORA:**
```
empleados (12 columnas) - Para TODOS los empleados
  + Columna: tipo_empleado
```

**Valores de tipo_empleado:**
- ASESOR
- COORDINADOR
- GERENTE
- RECOLECTOR
- VERIFICADOR
- COBRADOR
- DESEMBOLSADOR

---

### 2️⃣ **USUARIOS: Nombre separado en 3 columnas**

**ANTES:**
```
usuarios:
  - nombre (VARCHAR 100)  → "Juan Pérez García"
```

**AHORA:**
```
usuarios:
  - nombre (VARCHAR 100)           → "Juan"
  - apellido_paterno (VARCHAR 100) → "Pérez"
  - apellido_materno (VARCHAR 100) → "García"
  - nombre_completo (DEPRECADO)    → "Juan Pérez García"
```

---

### 3️⃣ **ELIMINADA DUPLICACIÓN DE NOMBRES**

**ANTES:**
```
usuarios:
  - nombre ✗ DUPLICADO

empleados:
  - nombre ✗ DUPLICADO
  - apellido_paterno ✗ DUPLICADO
  - apellido_materno ✗ DUPLICADO
```

**AHORA:**
```
usuarios:
  - nombre ✅ ÚNICA FUENTE DE VERDAD
  - apellido_paterno ✅ ÚNICA FUENTE DE VERDAD
  - apellido_materno ✅ ÚNICA FUENTE DE VERDAD

empleados:
  - (sin campos de nombre) ✅
  - Solo datos que NO están en usuarios
```

---

### 4️⃣ **TABLAS RENOMBRADAS**

| ANTES | AHORA |
|-------|-------|
| asesoras | empleados |
| asesoras_contacto | empleados_contacto |
| asesoras_domicilios | empleados_domicilios |
| asesoras_documentos | empleados_documentos |
| asesoras_datos_laborales | empleados_datos_laborales |

---

### 5️⃣ **COLUMNAS FK RENOMBRADAS**

| ANTES | AHORA |
|-------|-------|
| asesor_id | empleado_id |

---

## 📊 ESTRUCTURA FINAL

### **USUARIOS** (14 columnas)

```sql
id, folio,
nombre, apellido_paterno, apellido_materno,
email, password_hash,
rol_id, sucursal_id, estado,
ultimo_login,
created_at, updated_at,
nombre_completo (DEPRECADO)
```

**Responsabilidad:** Login, autenticación, permisos, nombre completo

---

### **EMPLEADOS** (12 columnas) ✅

```sql
id, folio, usuario_id, zona_id,
tipo_empleado,
fecha_nacimiento, genero,
curp, rfc,
fecha_ingreso,
created_at, updated_at
```

**Responsabilidad:** Datos personales e identificación oficial

**Valores de tipo_empleado:**
- ASESOR, COORDINADOR, GERENTE
- RECOLECTOR, VERIFICADOR
- COBRADOR, DESEMBOLSADOR

---

### **EMPLEADOS_CONTACTO** (9 columnas)

```sql
id, empleado_id,
telefono_celular, telefono_casa, telefono_emergencia,
emergencia_nombre, emergencia_parentesco,
created_at, updated_at
```

---

### **EMPLEADOS_DOMICILIOS** (15 columnas)

```sql
id, empleado_id,
calle, numero_ext, numero_int, colonia, municipio, estado, codigo_postal, referencias,
latitud, longitud, geolocalizacion_fecha,
created_at, updated_at
```

---

### **EMPLEADOS_DOCUMENTOS** (8 columnas)

```sql
id, empleado_id,
tipo_documento, ruta_archivo, fecha_captura, estado,
created_at, updated_at
```

---

### **EMPLEADOS_DATOS_LABORALES** (11 columnas)

```sql
id, empleado_id,
sucursal_id, jefe_inmediato_id,
tipo_contrato, nivel,
meta_mensual_grupos, meta_mensual_monto,
observaciones,
created_at, updated_at
```

---

## 🎯 ROLES CREADOS (8 roles)

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMINISTRADOR | Administrador del sistema | Todo |
| ASESOR | Asesor de campo | Documentación, expedientes |
| COORDINADOR | Coordinador de sucursal | + Reportes |
| GERENTE | Gerente regional | Gestión completa |
| RECOLECTOR | Recolector de pagos | Cobranza, pagos |
| VERIFICADOR | Verificador de docs | Verificación, aprobar/rechazar |
| COBRADOR | Cobrador | Cobranza, pagos, mora |
| DESEMBOLSADOR | Desembolsador | Desembolso, créditos, caja |

---

## 🔍 VISTA CREADA: empleados_completo

Vista que UNE usuarios + empleados con toda la información:

```sql
SELECT * FROM empleados_completo;
```

**Columnas:**
- empleado_id, folio, usuario_id, zona_id, tipo_empleado
- nombre, apellido_paterno, apellido_materno, nombre_completo
- fecha_nacimiento, genero, curp, rfc, fecha_ingreso
- email, usuario_estado, rol_id, usuario_sucursal_id
- created_at, updated_at

**Uso:**
```sql
-- Ver todos los empleados con nombres
SELECT * FROM empleados_completo ORDER BY apellido_paterno;

-- Ver solo asesores
SELECT * FROM empleados_completo WHERE tipo_empleado = 'ASESOR';

-- Ver solo cobradores
SELECT * FROM empleados_completo WHERE tipo_empleado = 'COBRADOR';
```

---

## ✅ VENTAJAS DE LA REFACTORIZACIÓN

### 1. **Genérico para todos los empleados**
- ✅ Un solo sistema para TODOS (asesores, cobradores, verificadores, etc.)
- ✅ No necesitas crear tablas separadas por tipo
- ✅ Fácil agregar nuevos tipos de empleado

### 2. **Nombre en UN solo lugar**
- ✅ usuarios.nombre es la ÚNICA fuente de verdad
- ✅ No hay riesgo de inconsistencia
- ✅ Actualizar nombre = 1 UPDATE, no 2

### 3. **Nombre separado en 3 columnas**
- ✅ Fácil ordenar por apellido_paterno
- ✅ Queries más limpias (no necesitas SPLIT)
- ✅ Reportes con formato correcto

### 4. **Escalabilidad**
- ✅ Agregar RECOLECTOR, VERIFICADOR, etc. = solo insertar registro
- ✅ No necesitas modificar esquema
- ✅ Un mismo empleado puede cambiar de tipo_empleado

---

## 🔄 COMPARACIÓN: ANTES vs DESPUÉS

### ANTES (Problemas)
```
❌ asesoras → solo para asesores
❌ usuarios.nombre = "Juan Pérez García" (todo junto)
❌ empleados.nombre duplicado
❌ Si contrato un COBRADOR, ¿nueva tabla?
```

### DESPUÉS (Solución)
```
✅ empleados → para TODOS
✅ usuarios.nombre = "Juan"
✅ usuarios.apellido_paterno = "Pérez"
✅ usuarios.apellido_materno = "García"
✅ empleados sin nombres (vienen de usuarios)
✅ tipo_empleado = 'COBRADOR' o 'ASESOR' o 'VERIFICADOR'
```

---

## 📋 MIGRACIÓN DE DATOS EXISTENTES

**Datos migrados automáticamente:**
- ✅ 5 empleados existentes → ahora son tipo 'ASESOR'
- ✅ Todas las relaciones mantenidas (FK intactas)
- ✅ Contactos, domicilios, datos laborales → sin cambios

**NO migrado (requiere UPDATE manual):**
- ⚠️ usuarios.nombre_completo → separar en nombre/apellidos
- ⚠️ Se mantiene nombre_completo como DEPRECADO por compatibilidad

---

## 🚀 PRÓXIMOS PASOS

### 1. Actualizar script de importación

Modificar `importar-asesores.js` para:
- Separar nombre en 3 campos al crear usuario
- Asignar tipo_empleado = 'ASESOR'
- NO insertar nombres en tabla empleados

### 2. Crear script de importación genérico

Nuevo: `importar-empleados.js` que permita importar cualquier tipo:
- RECOLECTORES
- VERIFICADORES
- COBRADORES
- DESEMBOLSADORES

### 3. Actualizar datos existentes

Ejecutar UPDATE para separar nombres de los 5 empleados actuales:
```sql
UPDATE usuarios SET
  nombre = 'Juan',
  apellido_paterno = 'Pérez',
  apellido_materno = 'García'
WHERE email = 'juan.perez@crelealtad.com';
```

---

## 💡 EJEMPLOS DE USO

### Crear un ASESOR
```sql
-- 1. Crear usuario
INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, ...)
VALUES ('Juan', 'Pérez', 'García', 'juan@...', ..., ROL_ASESOR_ID, ...);

-- 2. Crear empleado
INSERT INTO empleados (usuario_id, tipo_empleado, curp, rfc, ...)
VALUES (usuario_id, 'ASESOR', 'CURP...', 'RFC...', ...);
```

### Crear un COBRADOR
```sql
-- 1. Crear usuario
INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, ...)
VALUES ('María', 'López', 'Sánchez', 'maria@...', ..., ROL_COBRADOR_ID, ...);

-- 2. Crear empleado
INSERT INTO empleados (usuario_id, tipo_empleado, curp, rfc, ...)
VALUES (usuario_id, 'COBRADOR', 'CURP...', 'RFC...', ...);
```

### Buscar todos los RECOLECTORES
```sql
SELECT * FROM empleados_completo
WHERE tipo_empleado = 'RECOLECTOR'
ORDER BY apellido_paterno;
```

### Cambiar tipo de empleado (promoción)
```sql
-- Un ASESOR se vuelve COORDINADOR
UPDATE empleados SET tipo_empleado = 'COORDINADOR' WHERE id = '...';

-- También actualizar su rol
UPDATE usuarios SET rol_id = ROL_COORDINADOR_ID WHERE id = '...';
```

---

## 📊 ESTADO ACTUAL

```
REFACTORIZACIÓN: ✅ COMPLETADA
TABLAS RENOMBRADAS: ✅ 5 tablas
COLUMNAS ELIMINADAS: ✅ 3 (nombres duplicados)
COLUMNAS AGREGADAS: ✅ 4 (nombre separado + tipo_empleado)
ROLES CREADOS: ✅ 8 roles
VISTA CREADA: ✅ empleados_completo
DATOS MIGRADOS: ✅ 5 empleados
```

**LISTO PARA:**
- Importar cualquier tipo de empleado
- Separar nombres en sistema de login
- Gestión unificada de TODO el personal

---

Fecha de refactorización: 26 de Julio 2026
Tablas afectadas: 6
Datos migrados: 5 empleados
Errores: 0
