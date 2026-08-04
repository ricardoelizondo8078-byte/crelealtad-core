# 🔍 CÓMO VER LAS TABLAS NUEVAS EN PGADMIN

## ✅ Las tablas SÍ EXISTEN en PostgreSQL

Verificado:
- ✅ asesoras (14 columnas, 5 registros)
- ✅ asesoras_contacto (9 columnas, 5 registros)
- ✅ asesoras_domicilios (15 columnas, 5 registros)
- ✅ asesoras_documentos (8 columnas, 0 registros)
- ✅ asesoras_datos_laborales (11 columnas, 5 registros)

---

## 🔄 PASO 1: REFRESCAR PGADMIN

### Opción A: Refrescar solo el nodo de Tablas

1. En pgAdmin, abre el árbol de la izquierda:
   ```
   Servers
     └─ PostgreSQL 16 (o tu versión)
         └─ Databases
             └─ crelealtad
                 └─ Schemas
                     └─ public
                         └─ Tables  ◄── Clic derecho aquí
   ```

2. **Clic derecho** en "Tables"

3. Selecciona **"Refresh"** (o presiona F5)

4. Expande el nodo "Tables" y deberías ver las 25 tablas

---

### Opción B: Refrescar toda la base de datos

1. Clic derecho en **"crelealtad"** (la base de datos)

2. Selecciona **"Refresh"**

3. Espera unos segundos

4. Navega a: Schemas → public → Tables

---

### Opción C: Reconectar al servidor

1. Clic derecho en **"PostgreSQL 16"** (el servidor)

2. Selecciona **"Disconnect"**

3. Espera 2 segundos

4. Clic derecho nuevamente

5. Selecciona **"Connect"**

6. Ingresa password: `postgres`

7. Navega a: Databases → crelealtad → Schemas → public → Tables

---

## 🔍 PASO 2: BUSCAR LAS TABLAS

### Deberías ver en orden alfabético:

```
Tables (25)
  ├─ asesoras                         ◄── NUEVA (14 columnas)
  ├─ asesoras_contacto                ◄── NUEVA (9 columnas)
  ├─ asesoras_datos_laborales         ◄── NUEVA (11 columnas)
  ├─ asesoras_documentos              ◄── NUEVA (8 columnas)
  ├─ asesoras_domicilios              ◄── NUEVA (15 columnas)
  ├─ audit_log
  ├─ caja_movimientos
  ├─ calendario_pagos
  ├─ ciclos
  ├─ codigos_postales
  ├─ creditos
  ├─ documentos
  ├─ expedientes
  ├─ grupos
  ├─ integrantes
  ├─ mora
  ├─ pagos
  ├─ personas
  ├─ productos_credito
  ├─ reestructuras
  ├─ roles
  ├─ solicitudes
  ├─ sucursales
  ├─ usuarios
  └─ zonas
```

---

## 📊 PASO 3: VERIFICAR DATOS

### 1. Ver datos en asesoras

1. Clic derecho en **asesoras**
2. Selecciona **"View/Edit Data"** → **"All Rows"**
3. Deberías ver 5 registros (los asesores de ejemplo)

### 2. Ver datos en asesoras_contacto

1. Clic derecho en **asesoras_contacto**
2. Selecciona **"View/Edit Data"** → **"All Rows"**
3. Deberías ver 5 registros con teléfonos

### 3. Ver datos en asesoras_domicilios

1. Clic derecho en **asesoras_domicilios**
2. Selecciona **"View/Edit Data"** → **"All Rows"**
3. Deberías ver 5 registros con domicilios completos

### 4. Ver datos en asesoras_datos_laborales

1. Clic derecho en **asesoras_datos_laborales**
2. Selecciona **"View/Edit Data"** → **"All Rows"**
3. Deberías ver 5 registros con metas y tipo de contrato

---

## 🔗 PASO 4: VERIFICAR RELACIONES (Foreign Keys)

### Ver foreign keys de asesoras_contacto

1. Clic derecho en **asesoras_contacto**
2. Selecciona **"Properties"**
3. Ve a la pestaña **"Constraints"**
4. Deberías ver:
   - `fk_contacto_asesor` → asesoras(id)

### Ver foreign keys de asesoras_domicilios

1. Clic derecho en **asesoras_domicilios**
2. Properties → Constraints
3. Deberías ver:
   - `fk_domicilio_asesor` → asesoras(id)

### Ver foreign keys de asesoras_documentos

1. Clic derecho en **asesoras_documentos**
2. Properties → Constraints
3. Deberías ver:
   - `fk_documento_asesor` → asesoras(id)

### Ver foreign keys de asesoras_datos_laborales

1. Clic derecho en **asesoras_datos_laborales**
2. Properties → Constraints
3. Deberías ver:
   - `fk_laboral_asesor` → asesoras(id)
   - `fk_laboral_sucursal` → sucursales(id)
   - `fk_laboral_jefe` → usuarios(id)

---

## 🔍 PASO 5: QUERY PARA VER TODO JUNTO

Abre **Query Tool** (Tools → Query Tool) y ejecuta:

```sql
-- Ver un asesor completo con todas sus relaciones
SELECT 
  a.nombre || ' ' || a.apellido_paterno AS asesor,
  a.curp,
  c.telefono_celular,
  c.emergencia_nombre,
  d.calle || ' ' || d.numero_ext AS domicilio,
  d.colonia,
  d.municipio,
  d.latitud,
  d.longitud,
  l.tipo_contrato,
  l.nivel,
  l.meta_mensual_grupos,
  s.nombre AS sucursal
FROM asesoras a
LEFT JOIN asesoras_contacto c ON c.asesor_id = a.id
LEFT JOIN asesoras_domicilios d ON d.asesor_id = a.id
LEFT JOIN asesoras_datos_laborales l ON l.asesor_id = a.id
LEFT JOIN sucursales s ON s.id = l.sucursal_id
LIMIT 5;
```

Deberías ver 5 filas con toda la información unida.

---

## 🚨 SI AÚN NO LAS VES

### Verifica que estás en el schema correcto:

1. En el árbol de pgAdmin, asegúrate de estar viendo:
   ```
   Servers
     └─ PostgreSQL 16
         └─ Databases
             └─ crelealtad        ◄── Esta base de datos
                 └─ Schemas
                     └─ public    ◄── Este schema
                         └─ Tables
   ```

2. **NO** busques en:
   - ❌ postgres (otra base de datos)
   - ❌ template1 (otra base de datos)
   - ❌ Otro schema que no sea `public`

---

## 🔧 SI SIGUES SIN VERLAS

### Ejecuta este query para listar todas las tablas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name LIKE 'asesoras%'
ORDER BY table_name;
```

Deberías ver:
```
asesoras
asesoras_contacto
asesoras_datos_laborales
asesoras_documentos
asesoras_domicilios
```

---

## ✅ RESUMEN

**Las tablas existen al 100%.**

Solo necesitas **refrescar pgAdmin**:
1. Clic derecho en "Tables" → Refresh
2. O: Clic derecho en "crelealtad" → Refresh
3. O: Reconectar al servidor

**Después de refrescar, verás 25 tablas en total** (antes tenías 21, ahora 25).
