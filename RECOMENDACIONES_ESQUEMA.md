# 🔍 RECOMENDACIONES Y OBSERVACIONES DEL ESQUEMA

**Fecha de análisis:** 26 de Julio 2026

---

## ✅ TABLAS CON DATOS (Activas)

### 1. **grupos** (9 registros)
- ✅ Tabla activa y en uso
- **Observación:** Grupos de prueba creados durante desarrollo
- **Recomendación:** Listo para datos reales

### 2. **expedientes** (9 registros)
- ✅ Vinculados con grupos
- **Observación:** 1 expediente por grupo
- **Recomendación:** Funcionando correctamente

### 3. **integrantes** (10 registros)
- ✅ Integrantes de los grupos de prueba
- **Observación:** Vinculados con personas
- **Recomendación:** OK

### 4. **personas** (10 registros)
- ✅ Datos personales de integrantes
- **Observación:** Incluye nombres de prueba (Juan Cero Cero, Pedro Cero Cero, etc.)
- **Recomendación:** Limpiar datos de prueba antes de producción

### 5. **solicitudes** (6 registros)
- ✅ Solicitudes de crédito en proceso
- **Observación:** 81 columnas (tabla más grande)
- **Recomendación:** Revisar si todas las columnas son necesarias

### 6. **usuarios** (1 registro)
- ✅ Usuario admin existente
- **Observación:** Solo 1 usuario (admin@crelealtad.com)
- **Recomendación:** ⚠️ PENDIENTE - Importar asesores reales

### 7. **roles** (1 registro)
- ✅ Rol ADMINISTRADOR creado
- **Observación:** Falta crear más roles
- **Recomendación:** ⚠️ PENDIENTE - Crear roles: ASESOR, COORDINADOR, GERENTE

### 8. **sucursales** (1 registro)
- ✅ Sucursal MATRIZ creada
- **Observación:** Solo una sucursal
- **Recomendación:** ⚠️ PENDIENTE - ¿Tienes más sucursales?

---

## ⚪ TABLAS VACÍAS (Sin usar aún)

### MÓDULO DE ASESORAS
#### **asesoras** (0 registros) - ⚠️ PRIORIDAD ALTA
- **Estado:** Tabla ampliada recientemente (45 columnas)
- **Observación:** Lista para recibir datos
- **Recomendación:** 🎯 **PRÓXIMO PASO** - Importar asesores reales
- **Acción:** Completar TEMPLATE_ASESORES_COMPLETO.csv

#### **zonas** (0 registros)
- **Estado:** Tabla creada pero sin zonas definidas
- **Observación:** Referencias desde asesoras
- **Recomendación:** ⚠️ Definir zonas geográficas si se usan
- **Acción:** Crear zonas antes de importar asesores

---

### MÓDULO DE CRÉDITOS (Sin implementar)
#### **creditos** (0 registros)
- **Estado:** Tabla creada, no usada
- **Observación:** 16 columnas definidas
- **Recomendación:** ⏳ Fase 2 - Módulo de Desembolso

#### **productos_credito** (0 registros)
- **Estado:** Catálogo de productos vacío
- **Observación:** Necesita productos definidos
- **Recomendación:** ⚠️ Crear productos antes de desembolsar
- **Ejemplos:** Crédito Individual, Crédito Grupal, Microcrédito

---

### MÓDULO DE PAGOS Y COBRANZA (Sin implementar)
#### **pagos** (0 registros)
- **Estado:** Tabla lista, sin datos
- **Observación:** 14 columnas para registro de pagos
- **Recomendación:** ⏳ Fase 3 - Módulo de Cobranza

#### **calendario_pagos** (0 registros)
- **Estado:** Calendarios de amortización
- **Recomendación:** ⏳ Se genera al desembolsar crédito

#### **mora** (0 registros)
- **Estado:** Control de mora
- **Recomendación:** ⏳ Se calcula automáticamente

---

### MÓDULO DE CAJA (Sin implementar)
#### **caja_movimientos** (0 registros)
- **Estado:** 13 columnas definidas
- **Observación:** Movimientos de entrada/salida
- **Recomendación:** ⏳ Fase 4 - Módulo de Caja

---

### MÓDULO DE AUDITORÍA
#### **audit_log** (0 registros)
- **Estado:** Log de auditoría
- **Observación:** Importante para trazabilidad
- **Recomendación:** ⚠️ Implementar triggers para auditoría automática

---

### OTROS
#### **ciclos** (0 registros)
- **Estado:** Control de ciclos de crédito
- **Observación:** 13 columnas
- **Recomendación:** ⏳ Implementar en renovación de grupos

#### **reestructuras** (0 registros)
- **Estado:** Reestructuras de créditos
- **Recomendación:** ⏳ Función avanzada

#### **documentos** (0 registros)
- **Estado:** ⚠️ CONFLICTO - Ya existe lógica en solicitudes
- **Observación:** Tabla separada vs columnas en solicitudes
- **Recomendación:** 🔴 **REVISAR** - Decidir enfoque único

#### **codigos_postales** (0 registros)
- **Estado:** Catálogo de códigos postales
- **Observación:** Útil para validación de direcciones
- **Recomendación:** 💡 Opcional - Importar catálogo SEPOMEX

---

## 🚨 PROBLEMAS DETECTADOS

### 1. **Tabla solicitudes - 81 columnas** 🔴
- **Problema:** Tabla muy grande, difícil de mantener
- **Observación:** Incluye datos de documentos, domicilio, negocio, referencias
- **Recomendación:** ⚠️ **CONSIDERAR** normalizar en fases futuras:
  - `solicitudes_domicilios`
  - `solicitudes_negocios`
  - `solicitudes_referencias`
  - `solicitudes_documentos`

### 2. **Duplicación: documentos vs doc_*_ruta en solicitudes** 🔴
- **Problema:** Hay tabla `documentos` pero también campos `doc_ine_ruta`, `doc_comprobante_ruta` en solicitudes
- **Observación:** Dos enfoques mezclados
- **Recomendación:** 🎯 **DECIDIR:**
  - Opción A: Usar solo columnas en solicitudes (enfoque actual)
  - Opción B: Migrar todo a tabla documentos (más normalizado)
  - **No usar ambos** - genera confusión

### 3. **Relación asesoras ↔ usuarios** ⚠️
- **Problema:** asesoras.usuario_id → usuarios.id
- **Observación:** Un asesor debe tener un usuario para login
- **Recomendación:** Al importar asesores, crear usuarios automáticamente

### 4. **Falta validación de roles** ⚠️
- **Problema:** Solo existe rol ADMINISTRADOR
- **Observación:** No hay ASESOR, COORDINADOR, GERENTE
- **Recomendación:** Crear roles antes de importar usuarios

---

## 📋 PLAN DE ACCIÓN SUGERIDO

### ✅ FASE 1: PREPARACIÓN (ANTES DE IMPORTAR ASESORES)

#### Paso 1.1: Crear Roles Faltantes
```sql
INSERT INTO roles (id, nombre, descripcion, permisos, estado)
VALUES
  (uuid_generate_v4(), 'ASESOR', 'Asesor de campo', '{}', 'ACTIVO'),
  (uuid_generate_v4(), 'COORDINADOR', 'Coordinador de sucursal', '{}', 'ACTIVO'),
  (uuid_generate_v4(), 'GERENTE', 'Gerente regional', '{}', 'ACTIVO');
```

#### Paso 1.2: Crear Sucursales (si hay más allá de MATRIZ)
- Pregunta pendiente: **¿Tienes más sucursales?**

#### Paso 1.3: Crear Zonas Geográficas (si se usan)
- Pregunta pendiente: **¿Usas zonas?**
- Ejemplos: ZONA_NORTE, ZONA_SUR, ZONA_CENTRO, ZONA_ESTE, ZONA_OESTE

#### Paso 1.4: Crear Productos de Crédito
```sql
INSERT INTO productos_credito (id, nombre, descripcion, ...)
VALUES
  (..., 'Crédito Grupal', 'Crédito solidario grupal', ...),
  (..., 'Crédito Individual', 'Crédito individual', ...);
```

---

### ✅ FASE 2: IMPORTACIÓN DE ASESORES

#### Paso 2.1: Completar Excel
- Archivo: `TEMPLATE_ASESORES_COMPLETO.csv`
- Llenar datos reales de asesores

#### Paso 2.2: Ejecutar Importación
- Script SQL generará:
  - Registros en `asesoras`
  - Usuarios en `usuarios` (con PIN hasheado)
  - Vinculación usuario_id

---

### ✅ FASE 3: DECIDIR ENFOQUE DE DOCUMENTOS

#### Opción A: Mantener columnas en solicitudes (RECOMENDADO)
- ✅ Ya funciona
- ✅ Más simple para MVP
- ✅ No requiere migración
- ⚠️ Tabla solicitudes sigue grande

#### Opción B: Migrar a tabla documentos
- ✅ Más normalizado
- ✅ Escalable
- ⚠️ Requiere migración de datos existentes
- ⚠️ Cambios en backend y app móvil

**Recomendación:** Mantener Opción A por ahora, migrar en versión 2.0

---

### ✅ FASE 4: LIMPIEZA DE DATOS DE PRUEBA

Antes de producción:
```sql
-- Limpiar datos de prueba
DELETE FROM solicitudes;
DELETE FROM integrantes;
DELETE FROM expedientes;
DELETE FROM grupos WHERE name LIKE '%Cero%' OR name LIKE '%prueba%';
DELETE FROM personas WHERE nombre LIKE '%Cero%';
```

---

## 💡 CAMPOS QUE PODRÍAN FALTAR

### En tabla **asesoras** ✅ (ya ampliada)
- ✅ Todos los campos necesarios agregados (45 columnas)

### En tabla **solicitudes** (revisar después)
- Posible: `garantia_tipo`, `garantia_descripcion`
- Posible: `seguro_vida`, `seguro_monto`

### En tabla **grupos**
- Posible: `ciclo_numero` (para renovaciones)
- Posible: `grupo_anterior_id` (referencia a grupo renovado)
- Posible: `asesor_id` (¿quién maneja este grupo?)

### En tabla **creditos**
- Revisar cuando se implemente módulo de desembolso

---

## ❓ PREGUNTAS PENDIENTES PARA TI

1. **¿Tienes más sucursales además de MATRIZ?**
   - Si sí → dime nombres y datos para crearlas

2. **¿Usas zonas geográficas para organizar asesores?**
   - Si sí → dime nombres de zonas (NORTE, SUR, etc.)

3. **¿Qué productos de crédito ofreces?**
   - Nombres y características básicas

4. **¿Los grupos tienen asesor asignado?**
   - Si sí → agregar `asesor_id` en tabla grupos

5. **¿Documentos: tabla separada o columnas en solicitudes?**
   - Recomendación: mantener columnas por ahora

---

## 🎯 SIGUIENTE PASO INMEDIATO

**OPCIÓN 1: Crear roles, sucursales y zonas primero**
- Dime qué necesitas y lo creo

**OPCIÓN 2: Ir directo a importar asesores**
- Completa el Excel y lo importamos
- Roles/sucursales/zonas se crean sobre la marcha

**¿Qué prefieres?**
