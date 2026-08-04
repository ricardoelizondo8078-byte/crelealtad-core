# 🔧 ASESORAS - DISEÑO NORMALIZADO CORRECTO

## ❌ AHORA: 1 tabla monstruosa (45 columnas)

```sql
asesoras:
  - id, folio, usuario_id, zona_id
  - nombre, apellido_paterno, apellido_materno
  - fecha_nacimiento, genero, curp, rfc
  - email, telefono_celular, telefono_casa, telefono_emergencia
  - contacto_emergencia_nombre, contacto_emergencia_parentesco
  - dom_calle, dom_numero_ext, dom_numero_int, dom_colonia
  - dom_municipio, dom_estado, dom_codigo_postal, dom_referencias
  - dom_latitud, dom_longitud, dom_geolocalizacion_fecha
  - foto_perfil_ruta, foto_ine_frente_ruta, foto_ine_reverso_ruta
  - foto_comprobante_domicilio_ruta
  - fecha_ingreso, sucursal_id, jefe_inmediato_id
  - tipo_contrato, nivel, meta_mensual_grupos, meta_mensual_monto
  - observaciones, activo, estado
  - created_at, updated_at, telefono
  (45 columnas totales - CRÍTICO 🔴)
```

---

## ✅ PROPUESTA: 5 tablas bien diseñadas

### 1️⃣ **asesoras** (TABLA PRINCIPAL - 15 columnas)

```sql
asesoras:
  -- Identificación
  ✅ id (UUID, PK)
  ✅ usuario_id (UUID, FK → usuarios, UNIQUE)
  ✅ folio (VARCHAR, opcional, para RH)
  
  -- Datos personales básicos
  ✅ nombre (VARCHAR 100)
  ✅ apellido_paterno (VARCHAR 100)
  ✅ apellido_materno (VARCHAR 100)
  ✅ fecha_nacimiento (DATE)
  ✅ genero (VARCHAR 10: MASCULINO, FEMENINO)
  ✅ curp (VARCHAR 18, UNIQUE)
  ✅ rfc (VARCHAR 13, UNIQUE)
  
  -- Datos laborales básicos
  ✅ fecha_ingreso (DATE)
  ✅ zona_id (UUID, FK → zonas)
  
  -- Control
  ✅ created_at (TIMESTAMP)
  ✅ updated_at (TIMESTAMP)
```

**Responsabilidad:** Datos personales básicos e identificación oficial

---

### 2️⃣ **asesoras_contacto** (NUEVA - 9 columnas)

```sql
asesoras_contacto:
  ✅ id (UUID, PK)
  ✅ asesor_id (UUID, FK → asesoras, UNIQUE)
  
  -- Teléfonos
  ✅ telefono_celular (VARCHAR 20, NOT NULL)
  ✅ telefono_casa (VARCHAR 20)
  ✅ telefono_emergencia (VARCHAR 20)
  
  -- Contacto de emergencia
  ✅ emergencia_nombre (VARCHAR 100)
  ✅ emergencia_parentesco (VARCHAR 50)
  
  -- Control
  ✅ created_at (TIMESTAMP)
  ✅ updated_at (TIMESTAMP)
```

**Responsabilidad:** Información de contacto y emergencias

**Ventaja:** Si cambia un teléfono, solo actualizas esta tabla

---

### 3️⃣ **asesoras_domicilios** (NUEVA - 13 columnas)

```sql
asesoras_domicilios:
  ✅ id (UUID, PK)
  ✅ asesor_id (UUID, FK → asesoras, UNIQUE)
  
  -- Dirección
  ✅ calle (VARCHAR 200)
  ✅ numero_ext (VARCHAR 20)
  ✅ numero_int (VARCHAR 20)
  ✅ colonia (VARCHAR 100)
  ✅ municipio (VARCHAR 100)
  ✅ estado (VARCHAR 100)
  ✅ codigo_postal (VARCHAR 10)
  ✅ referencias (TEXT)
  
  -- Geolocalización
  ✅ latitud (DECIMAL 10,8)
  ✅ longitud (DECIMAL 11,8)
  ✅ geolocalizacion_fecha (TIMESTAMP)
```

**Responsabilidad:** Domicilio completo y geolocalización

**Ventaja:** Si el asesor se muda, actualizas solo esta tabla

---

### 4️⃣ **asesoras_documentos** (NUEVA - 8 columnas)

```sql
asesoras_documentos:
  ✅ id (UUID, PK)
  ✅ asesor_id (UUID, FK → asesoras)
  ✅ tipo_documento (VARCHAR 50: FOTO_PERFIL, INE_FRENTE, INE_REVERSO, COMPROBANTE_DOM)
  
  -- Archivo
  ✅ ruta_archivo (VARCHAR 500)
  ✅ fecha_captura (TIMESTAMP)
  ✅ estado (VARCHAR 20: PENDIENTE, VIGENTE, VENCIDO)
  
  -- Control
  ✅ created_at (TIMESTAMP)
  ✅ updated_at (TIMESTAMP)
```

**Responsabilidad:** Fotografías y documentos del asesor

**Ventajas:**
- Puedes tener múltiples versiones del mismo documento (historial)
- Agregar nuevos tipos de documentos sin alterar esquema
- Marcar documentos como vencidos (ej: INE vencida)

---

### 5️⃣ **asesoras_datos_laborales** (NUEVA - 11 columnas)

```sql
asesoras_datos_laborales:
  ✅ id (UUID, PK)
  ✅ asesor_id (UUID, FK → asesoras, UNIQUE)
  
  -- Jerarquía y organización
  ✅ sucursal_id (UUID, FK → sucursales)
  ✅ jefe_inmediato_id (UUID, FK → usuarios)
  
  -- Contrato
  ✅ tipo_contrato (VARCHAR 50: PLANTA, HONORARIOS, COMISION)
  ✅ nivel (VARCHAR 50: JUNIOR, SENIOR, COORDINADOR)
  
  -- Metas
  ✅ meta_mensual_grupos (INTEGER)
  ✅ meta_mensual_monto (DECIMAL 12,2)
  
  -- Observaciones
  ✅ observaciones (TEXT)
  
  -- Control
  ✅ created_at (TIMESTAMP)
  ✅ updated_at (TIMESTAMP)
```

**Responsabilidad:** Datos laborales, jerarquía y metas

**Ventaja:** Si cambian las metas, solo actualizas esta tabla

---

## 📊 COMPARACIÓN

| ASPECTO | ANTES (1 tabla) | DESPUÉS (5 tablas) |
|---------|-----------------|---------------------|
| **Total columnas** | 45 en 1 tabla | 56 en 5 tablas |
| **Columnas por tabla** | 🔴 45 | ✅ 15, 9, 13, 8, 11 |
| **Mantenibilidad** | 🔴 Difícil | ✅ Fácil |
| **Performance reads** | 🔴 Lento (lee todo) | ✅ Rápido (lee solo lo necesario) |
| **Performance updates** | 🔴 Lento | ✅ Rápido |
| **Escalabilidad** | 🔴 Difícil agregar campos | ✅ Fácil agregar tablas |
| **Historial** | ❌ No | ✅ Sí (documentos versionados) |

---

## 🎯 VENTAJAS DEL DISEÑO NORMALIZADO

### 1. **Queries más rápidas**

```sql
-- ❌ ANTES: Login carga TODAS las 45 columnas
SELECT * FROM asesoras WHERE usuario_id = 'abc-123';

-- ✅ DESPUÉS: Login solo carga lo básico (15 columnas)
SELECT * FROM asesoras WHERE usuario_id = 'abc-123';

-- Solo cuando necesites contacto:
SELECT * FROM asesoras_contacto WHERE asesor_id = 'def-456';

-- Solo cuando necesites domicilio:
SELECT * FROM asesoras_domicilios WHERE asesor_id = 'def-456';
```

### 2. **Updates más eficientes**

```sql
-- ❌ ANTES: Actualizar teléfono = UPDATE en tabla de 45 columnas
UPDATE asesoras SET telefono_celular = '8112345678' WHERE id = 'abc';

-- ✅ DESPUÉS: UPDATE en tabla de solo 9 columnas
UPDATE asesoras_contacto SET telefono_celular = '8112345678' WHERE asesor_id = 'abc';
```

### 3. **Historial de documentos**

```sql
-- ✅ Puedes tener múltiples versiones
asesoras_documentos:
  { asesor_id: 'abc', tipo: 'INE_FRENTE', ruta: 'ine_2020.jpg', estado: 'VENCIDO' }
  { asesor_id: 'abc', tipo: 'INE_FRENTE', ruta: 'ine_2024.jpg', estado: 'VIGENTE' }
```

### 4. **Agregar campos sin romper todo**

```sql
-- Quieres agregar "seguro_vida_numero"?
-- ✅ Solo agregas 1 columna a asesoras_datos_laborales (11 → 12 columnas)
-- ❌ Antes agregarías a tabla de 45 columnas (45 → 46)
```

---

## 🔄 MIGRACIÓN GRADUAL (Sin romper nada)

### Fase 1: Crear nuevas tablas
```sql
CREATE TABLE asesoras_contacto (...);
CREATE TABLE asesoras_domicilios (...);
CREATE TABLE asesoras_documentos (...);
CREATE TABLE asesoras_datos_laborales (...);
```

### Fase 2: Migrar datos existentes
```sql
-- Para cada asesor en asesoras, copiar datos a nuevas tablas
INSERT INTO asesoras_contacto (asesor_id, telefono_celular, ...)
SELECT id, telefono_celular, ... FROM asesoras;
```

### Fase 3: Actualizar código
- Backend lee de nuevas tablas
- App móvil no cambia (el backend abstrae esto)

### Fase 4: Deprecar columnas viejas
```sql
-- Marcar como obsoletas, eliminar en versión futura
ALTER TABLE asesoras DROP COLUMN telefono_celular;
ALTER TABLE asesoras DROP COLUMN dom_calle;
...
```

### Fase 5: Tabla final limpia (15 columnas)
```sql
asesoras:
  - Solo datos personales básicos
  - Todo lo demás en tablas especializadas
```

---

## 💡 RECOMENDACIÓN FINAL

### OPCIÓN A: NORMALIZAR AHORA (RECOMENDADO)
**Antes de importar datos**

✅ Ventajas:
- Empiezas con diseño correcto
- No necesitas migración después
- Base sólida para escalar

⚠️ Desventajas:
- Toma 1-2 horas implementar
- Cambios en backend (pero frontend no cambia)

---

### OPCIÓN B: IMPORTAR AHORA, NORMALIZAR DESPUÉS
**Dejar tabla monstruosa temporalmente**

✅ Ventajas:
- Empiezas a trabajar inmediatamente
- Puedes probar con datos reales

⚠️ Desventajas:
- Tendrás que migrar datos después
- Más riesgo de bugs
- Performance peor desde el inicio

---

## 📋 RESUMEN EJECUTIVO

| MÉTRICA | TABLA ACTUAL | NORMALIZADO |
|---------|--------------|-------------|
| Columnas por tabla | 🔴 45 | ✅ 8-15 |
| Mantenibilidad | 🔴 Baja | ✅ Alta |
| Performance | 🔴 Regular | ✅ Óptimo |
| Escalabilidad | 🔴 Limitada | ✅ Excelente |
| Historial docs | ❌ No | ✅ Sí |
| Tiempo implementar | ✅ Ya está | ⚠️ 1-2 horas |

---

## ❓ TU DECISIÓN

**¿Qué prefieres?**

**A) NORMALIZAR AHORA** (recomendado)
- Divido asesoras en 5 tablas
- Toma 1-2 horas
- Base sólida desde el inicio

**B) DEJAR COMO ESTÁ POR AHORA**
- Importamos asesores ya
- Normalizamos en versión 2.0
- Empezamos a probar rápido

**C) OPCIÓN INTERMEDIA**
- Normalizar solo lo crítico (documentos)
- Dejar resto junto
- Balance entre tiempo y calidad

¿Cuál eliges?
