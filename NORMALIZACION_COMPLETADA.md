# ✅ NORMALIZACIÓN COMPLETADA - ASESORAS

## 🎯 OBJETIVO CUMPLIDO

Transformar tabla `asesoras` de **45 columnas → 5 tablas bien diseñadas**

---

## 📊 ANTES vs DESPUÉS

### ❌ ANTES (Tabla monstruosa)

```
asesoras (45 columnas) 🔴
  - Todo mezclado: datos personales, contacto, domicilio, 
    documentos, datos laborales, metas...
  - Difícil de mantener
  - Performance pobre
  - No escalable
```

### ✅ DESPUÉS (Normalizado)

```
asesoras (14 columnas) ✅
  ├── asesoras_contacto (9 columnas) ✅
  ├── asesoras_domicilios (15 columnas) ✅
  ├── asesoras_documentos (8 columnas) ✅
  └── asesoras_datos_laborales (11 columnas) ✅

Total: 57 columnas en 5 tablas especializadas
```

---

## 🗂️ ESTRUCTURA FINAL

### 1. **asesoras** (Tabla principal - 14 columnas)

```sql
id, folio, usuario_id, zona_id,
nombre, apellido_paterno, apellido_materno,
fecha_nacimiento, genero, curp, rfc, fecha_ingreso,
created_at, updated_at
```

**Responsabilidad:** Datos personales básicos e identificación oficial

---

### 2. **asesoras_contacto** (9 columnas)

```sql
id, asesor_id,
telefono_celular, telefono_casa, telefono_emergencia,
emergencia_nombre, emergencia_parentesco,
created_at, updated_at
```

**Responsabilidad:** Información de contacto y emergencias

**Relación:** 1:1 con asesoras (FK: asesor_id)

---

### 3. **asesoras_domicilios** (15 columnas)

```sql
id, asesor_id,
calle, numero_ext, numero_int, colonia, municipio, estado, codigo_postal, referencias,
latitud, longitud, geolocalizacion_fecha,
created_at, updated_at
```

**Responsabilidad:** Domicilio completo y geolocalización

**Relación:** 1:1 con asesoras (FK: asesor_id)

**Índices:** latitud+longitud para búsquedas geográficas

---

### 4. **asesoras_documentos** (8 columnas)

```sql
id, asesor_id,
tipo_documento, ruta_archivo, fecha_captura, estado,
created_at, updated_at
```

**Tipos de documento:**
- FOTO_PERFIL
- INE_FRENTE
- INE_REVERSO
- COMPROBANTE_DOMICILIO
- CURP
- RFC
- CONTRATO

**Responsabilidad:** Fotografías y documentos con historial

**Relación:** 1:N con asesoras (FK: asesor_id)

**Ventaja:** Múltiples versiones del mismo documento, marcar vencidos

---

### 5. **asesoras_datos_laborales** (11 columnas)

```sql
id, asesor_id,
sucursal_id, jefe_inmediato_id,
tipo_contrato, nivel,
meta_mensual_grupos, meta_mensual_monto,
observaciones,
created_at, updated_at
```

**Responsabilidad:** Datos laborales, jerarquía y metas

**Relación:** 1:1 con asesoras (FK: asesor_id)

---

## ✅ VENTAJAS OBTENIDAS

### 1. **Performance mejorado**
- Login solo lee 14 columnas (antes 45)
- Queries más rápidas (solo lees lo que necesitas)
- Índices más eficientes

### 2. **Mantenibilidad**
- Cada tabla <20 columnas (fácil de entender)
- Cambios aislados (actualizar teléfono no toca domicilio)
- Código más limpio

### 3. **Escalabilidad**
- Fácil agregar nuevos tipos de documentos
- Historial de documentos (múltiples versiones)
- Nuevos campos laborales sin afectar otras tablas

### 4. **Flexibilidad**
- Documentos vencidos (ej: INE expirada)
- Múltiples domicilios en el futuro
- Auditoría por tabla

---

## 🚀 ARCHIVOS GENERADOS

### Scripts de migración:
1. **normalizar-asesoras.sql** → Migración completa
   - Crea 4 tablas nuevas
   - Migra datos existentes
   - Limpia columnas duplicadas

### Scripts de importación:
2. **crear-roles.js** → Crea roles ASESOR, COORDINADOR, GERENTE
3. **importar-asesores.js** → Importa asesores desde CSV

### Templates:
4. **TEMPLATE_ASESORES_NORMALIZADO.csv** → Template actualizado

### Documentación:
5. **REGLAS_DISEÑO_BD.md** → Reglas para NUNCA repetir este error
6. **ASESORAS_NORMALIZADO.md** → Diseño detallado
7. **FLUJO_USUARIOS_VS_ASESORAS.md** → Arquitectura usuarios/asesoras

---

## 📋 DATOS DE PRUEBA IMPORTADOS

Se importaron **5 asesores de ejemplo:**

| Email | PIN | Rol | Nivel |
|-------|-----|-----|-------|
| juan.perez@crelealtad.com | 1234 | ASESOR | SENIOR |
| maria.lopez@crelealtad.com | 5678 | ASESOR | JUNIOR |
| carlos.ramirez@crelealtad.com | 9999 | ASESOR | COORDINADOR |
| ana.martinez@crelealtad.com | 4321 | ASESOR | JUNIOR |
| luis.torres@crelealtad.com | 5555 | ASESOR | SENIOR |

**Cada asesor tiene:**
- ✅ Usuario en tabla `usuarios` (login)
- ✅ Datos personales en `asesoras`
- ✅ Contacto en `asesoras_contacto`
- ✅ Domicilio en `asesoras_domicilios`
- ✅ Datos laborales en `asesoras_datos_laborales`

---

## 🔑 ROLES CREADOS

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMINISTRADOR | Acceso total al sistema | Todo |
| ASESOR | Asesor de campo | Documentación, expedientes, solicitudes |
| COORDINADOR | Coordinador de sucursal | + Reportes, exportar |
| GERENTE | Gerente regional | Gestión completa |

---

## 📱 SIGUIENTE PASO: Probar en la app

### 1. Reiniciar backend
```bash
cd apps/api
npm run start:dev
```

### 2. En el teléfono: Reload la app

### 3. Login con cualquiera de los 5 asesores
```
Ejemplos:
- Selecciona: "Juan Pérez García" → PIN: 1234
- Selecciona: "María López Hernández" → PIN: 5678
```

### 4. Verificar que funciona el login

---

## ⚠️ CAMBIOS EN BACKEND (Futuro)

Cuando implementes endpoints de perfil de asesor:

```javascript
// ❌ ANTES (1 query pesada):
const asesor = await db.asesoras.findOne({ where: { id } });
// Retorna: 45 columnas

// ✅ AHORA (queries específicas):

// Para mostrar perfil básico:
const asesor = await db.asesoras.findOne({ 
  where: { id },
  include: ['usuario'] // Solo 14 cols + datos usuario
});

// Solo cuando necesites contacto:
const contacto = await db.asesoras_contacto.findOne({ 
  where: { asesor_id: id } 
});

// Solo cuando necesites domicilio:
const domicilio = await db.asesoras_domicilios.findOne({ 
  where: { asesor_id: id } 
});

// Solo cuando necesites documentos:
const documentos = await db.asesoras_documentos.findAll({ 
  where: { asesor_id: id, estado: 'VIGENTE' } 
});

// Solo cuando necesites datos laborales:
const laboral = await db.asesoras_datos_laborales.findOne({ 
  where: { asesor_id: id },
  include: ['sucursal', 'jefe'] 
});
```

---

## 🎓 LECCIÓN APRENDIDA

### ❌ NO VOLVER A HACER:
- Crear tablas con >30 columnas
- Mezclar responsabilidades (contacto + domicilio + documentos)
- Campos repetidos con número (campo1, campo2)
- Agregar "solo un campo más" a tabla grande

### ✅ SIEMPRE HACER:
- Aplicar TEST DE GRUPOS antes de CREATE TABLE
- Máximo 20 columnas por tabla
- Una responsabilidad por tabla
- Documentos siempre en tabla separada
- Revisar `REGLAS_DISEÑO_BD.md` antes de diseñar

---

## 📊 MÉTRICAS FINALES

| Métrica | Antes | Después |
|---------|-------|---------|
| Columnas por tabla principal | 🔴 45 | ✅ 14 |
| Tablas relacionadas | 🔴 0 | ✅ 4 |
| Queries para perfil completo | 🔴 1 pesada | ✅ 5 ligeras |
| Historial de documentos | ❌ No | ✅ Sí |
| Escalabilidad | 🔴 Baja | ✅ Alta |
| Mantenibilidad | 🔴 Difícil | ✅ Fácil |

---

## ✅ ESTADO ACTUAL

```
NORMALIZACIÓN: ✅ COMPLETADA
ROLES: ✅ CREADOS
DATOS DE PRUEBA: ✅ IMPORTADOS
SCRIPTS: ✅ FUNCIONANDO
DOCUMENTACIÓN: ✅ GENERADA
```

**LISTO PARA:**
- Importar asesores reales
- Probar login en app móvil
- Desarrollar endpoints de perfil
- Continuar con siguiente fase del proyecto

---

Fecha de normalización: 26 de Julio 2026
Tiempo de ejecución: < 10 minutos
Datos migrados: 0 registros existentes + 5 de prueba
Errores: 0
