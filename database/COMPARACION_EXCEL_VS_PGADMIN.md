# COMPARACIÓN: TABLAS NUEVAS EN REVISION.xlsx vs pgAdmin

**Fecha**: 2026-08-02  
**Propósito**: Verificar si el Excel tiene TODAS las columnas de pgAdmin

---

## RESUMEN EJECUTIVO

⚠️ **RESPUESTA: NO, EL ARCHIVO EXCEL NO ESTÁ COMPLETO**

El archivo `TABLAS NUEVAS EN REVISION.xlsx` **solo incluye las tablas de SOLICITUDES**, pero le faltan muchas otras tablas que están implementadas en TypeORM y deberían estar en pgAdmin.

---

## TABLAS EN EL EXCEL

### Hoja: ESQUEMA_SOLICITUDES_NORMALI (2)
✅ `solicitudes` (14 columnas)  
✅ `solicitudes_beneficiarios` (8 columnas)  
✅ `solicitudes_datos_personales` (17 columnas)  
✅ `solicitudes_documentos` (12 columnas)  
✅ `solicitudes_domicilios` (14 columnas)  
✅ `solicitudes_negocios` (18 columnas)  
✅ `solicitudes_referencias` (15 columnas)  
✅ `solicitudes_validaciones` (7 columnas)

### Hoja: TABLAS_EMPLEADOS_ESQUEMA
✅ `usuarios` (13-14 columnas)  
✅ `empleados` (12 columnas)  
✅ `empleados_contacto` (9 columnas)  
✅ `empleados_datos_laborales` (11 columnas)  
✅ `empleados_documentos` (8 columnas)  
✅ `empleados_domicilios` (15-16 columnas)

**Total de tablas en Excel**: ~14 tablas

---

## TABLAS EN TYPEORM/PGADMIN

### ✅ Tablas que SÍ están en el Excel:

1. ✅ `solicitudes` (completa)
2. ✅ `solicitudes_beneficiarios` (completa)
3. ✅ `solicitudes_datos_personales` (completa)
4. ✅ `solicitudes_documentos` (completa - pero le falta `doc_comprobante_credito_ruta/fecha`)
5. ✅ `solicitudes_domicilios` (completa)
6. ✅ `solicitudes_negocios` (completa)
7. ✅ `solicitudes_referencias` (completa)
8. ✅ `solicitudes_validaciones` (completa)
9. ✅ `usuarios` (completa)

### ❌ Tablas FALTANTES en el Excel:

10. ❌ **`personas`** - FALTA COMPLETAMENTE
11. ❌ **`grupos`** - FALTA COMPLETAMENTE
12. ❌ **`expedientes`** - FALTA COMPLETAMENTE
13. ❌ **`integrantes`** - FALTA COMPLETAMENTE
14. ❌ **`codigos_postales`** - FALTA COMPLETAMENTE
15. ❌ **`roles`** - FALTA (está en init.sql)
16. ❌ **`usuarios_roles`** - FALTA (está en init.sql)
17. ❌ **`productos`** - FALTA (está en init.sql)
18. ❌ **`parametros`** - FALTA (está en init.sql)
19. ❌ **`reglas`** - FALTA (está en init.sql)
20. ❌ **`ciclos`** - FALTA (está en init.sql)
21. ❌ **`creditos`** - FALTA (está en init.sql)
22. ❌ **`desembolsos`** - FALTA (está en init.sql)
23. ❌ **`pagos`** - FALTA (está en init.sql)
24. ❌ **`documentos`** - FALTA (está en init.sql)

---

## COMPARACIÓN DETALLADA: SOLICITUDES_DOCUMENTOS

### En el Excel:
```
- doc_ine_ruta
- doc_ine_fecha
- doc_comprobante_ruta
- doc_comprobante_fecha
- doc_ine_beneficiario_ruta
- doc_ine_beneficiario_fecha
- doc_solicitud_firmada_ruta
- doc_solicitud_firmada_fecha
```

### En TypeORM (SolicitudDocumentosEntity):
```
- doc_ine_ruta ✅
- doc_ine_fecha ✅
- doc_comprobante_ruta ✅
- doc_comprobante_fecha ✅
- doc_ine_beneficiario_ruta ✅
- doc_ine_beneficiario_fecha ✅
- doc_solicitud_firmada_ruta ✅
- doc_solicitud_firmada_fecha ✅
- doc_comprobante_credito_ruta ❌ FALTA EN EXCEL
- doc_comprobante_credito_fecha ❌ FALTA EN EXCEL
```

---

## TABLAS NÚCLEO QUE FALTAN EN EL EXCEL

### 1. Tabla `personas` (PersonaEntity)
```typescript
id: UUID
folio: VARCHAR(20)
curp: VARCHAR(18)
primer_nombre: VARCHAR(50) ❌
segundo_nombre: VARCHAR(50) ❌
apellido_pat: VARCHAR(50) ❌
apellido_mat: VARCHAR(50) ❌
fecha_nac: DATE ❌
genero: VARCHAR(15) ❌
estado: VARCHAR(20) ❌
telefono: VARCHAR ❌
telefono_secundario: VARCHAR ❌
monto_solicitado: DECIMAL(10,2) ❌
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### 2. Tabla `grupos` (GrupoEntity)
```typescript
id: UUID ❌
folio: VARCHAR ❌
nombre: VARCHAR ❌
zona_id: UUID ❌
sucursal_id: UUID ❌
fecha_inicio: DATE ❌
estado: VARCHAR (FORMANDO, ACTIVO, etc.) ❌
created_by: VARCHAR ❌
created_at: TIMESTAMPTZ ❌
updated_at: TIMESTAMPTZ ❌
deleted_at: TIMESTAMPTZ ❌
```

### 3. Tabla `expedientes` (ExpedienteEntity)
```typescript
id: UUID ❌
folio: VARCHAR ❌
grupo_id: UUID ❌
producto_id: UUID ❌
asesora_id: UUID ❌
horario_visita: VARCHAR ❌
dias_visita: VARCHAR ❌
semana_cobro: DATE ❌
observaciones: TEXT ❌
estado: VARCHAR (EN_DOCUMENTACION, EN_VERIFICACION, etc.) ❌
estado_fecha: TIMESTAMP ❌
created_at: TIMESTAMPTZ ❌
updated_at: TIMESTAMPTZ ❌
```

### 4. Tabla `integrantes` (IntegranteEntity)
```typescript
id: UUID ❌
folio: VARCHAR ❌
expediente_id: UUID ❌
persona_id: UUID ❌
estado: VARCHAR (DOCUMENTANDO, SUJETA_CREDITO, etc.) ❌
created_at: TIMESTAMPTZ ❌
updated_at: TIMESTAMPTZ ❌
```

### 5. Tabla `codigos_postales` (CodigoPostalEntity)
```typescript
id: UUID ❌
folio: VARCHAR(20) ❌
codigo: VARCHAR(5) ❌
colonia: VARCHAR(100) ❌
municipio: VARCHAR(100) ❌
estado: VARCHAR(50) ❌
created_at: TIMESTAMPTZ ❌
```

---

## TABLAS DE INIT.SQL QUE FALTAN

### Tablas de configuración:
- ❌ `roles`
- ❌ `usuarios_roles`
- ❌ `productos`
- ❌ `parametros`
- ❌ `reglas`

### Tablas operativas:
- ❌ `ciclos`
- ❌ `creditos`
- ❌ `desembolsos`
- ❌ `pagos`
- ❌ `documentos` (tabla general de documentos)

---

## CONCLUSIÓN

### ❌ NO, EL EXCEL NO ESTÁ COMPLETO

**Tablas que SÍ tiene** (9):
1. solicitudes (con todas sus sub-tablas: 8 tablas)
2. usuarios

**Tablas que FALTAN** (15+):
1. personas ⚠️ **CRÍTICA**
2. grupos ⚠️ **CRÍTICA**
3. expedientes ⚠️ **CRÍTICA**
4. integrantes ⚠️ **CRÍTICA**
5. codigos_postales ⚠️ **CRÍTICA**
6. roles
7. usuarios_roles
8. productos
9. parametros
10. reglas
11. ciclos
12. creditos
13. desembolsos
14. pagos
15. documentos

**Columnas faltantes en tablas existentes**:
- `solicitudes_documentos`: Faltan 2 columnas (`doc_comprobante_credito_ruta`, `doc_comprobante_credito_fecha`)

---

## RECOMENDACIÓN

### ⚠️ ACCIÓN REQUERIDA: Actualizar el Excel

El archivo `TABLAS NUEVAS EN REVISION.xlsx` debe actualizarse para incluir:

1. **Crear nueva hoja**: `ESQUEMA_CORE_TABLAS` con:
   - personas
   - grupos
   - expedientes
   - integrantes
   - codigos_postales

2. **Crear nueva hoja**: `ESQUEMA_OPERACIONES` con:
   - roles
   - usuarios_roles
   - productos
   - parametros
   - reglas
   - ciclos
   - creditos
   - desembolsos
   - pagos
   - documentos

3. **Actualizar hoja existente**: `ESQUEMA_SOLICITUDES_NORMALI (2)`
   - Agregar las 2 columnas faltantes en `solicitudes_documentos`

---

## PRIORIDAD DE ACTUALIZACIÓN

### 🔴 ALTA PRIORIDAD (tablas núcleo):
1. **personas** - Base de todo el sistema
2. **grupos** - Entidad principal
3. **expedientes** - Proceso core
4. **integrantes** - Vinculación persona-expediente

### 🟡 MEDIA PRIORIDAD (tablas operativas):
5. creditos
6. ciclos
7. codigos_postales

### 🟢 BAJA PRIORIDAD (configuración):
8. roles
9. productos
10. parametros
11. reglas
12. desembolsos
13. pagos
14. documentos

---

**¿Quieres que genere el Excel completo con todas las tablas faltantes?**
