# 📊 ESQUEMA COMPLETO DE BASE DE DATOS - CRELEALTAD

**Fecha:** 26/7/2026

**Total de tablas:** 21

---

## 📋 RESUMEN EJECUTIVO

| # | TABLA | COLUMNAS | REGISTROS | ESTADO |
|---|-------|----------|-----------|--------|
| 1 | **asesoras** | 45 | 0 | ⚪ VACÍA |
| 2 | **audit_log** | 9 | 0 | ⚪ VACÍA |
| 3 | **caja_movimientos** | 13 | 0 | ⚪ VACÍA |
| 4 | **calendario_pagos** | 7 | 0 | ⚪ VACÍA |
| 5 | **ciclos** | 13 | 0 | ⚪ VACÍA |
| 6 | **codigos_postales** | 7 | 0 | ⚪ VACÍA |
| 7 | **creditos** | 16 | 0 | ⚪ VACÍA |
| 8 | **documentos** | 9 | 0 | ⚪ VACÍA |
| 9 | **expedientes** | 12 | 9 | ✅ CON DATOS |
| 10 | **grupos** | 11 | 9 | ✅ CON DATOS |
| 11 | **integrantes** | 7 | 10 | ✅ CON DATOS |
| 12 | **mora** | 10 | 0 | ⚪ VACÍA |
| 13 | **pagos** | 14 | 0 | ⚪ VACÍA |
| 14 | **personas** | 15 | 10 | ✅ CON DATOS |
| 15 | **productos_credito** | 16 | 0 | ⚪ VACÍA |
| 16 | **reestructuras** | 13 | 0 | ⚪ VACÍA |
| 17 | **roles** | 8 | 1 | ✅ CON DATOS |
| 18 | **solicitudes** | 81 | 6 | ✅ CON DATOS |
| 19 | **sucursales** | 8 | 1 | ✅ CON DATOS |
| 20 | **usuarios** | 11 | 1 | ✅ CON DATOS |
| 21 | **zonas** | 7 | 0 | ⚪ VACÍA |

**TOTALES:** 21 tablas, 332 columnas, 47 registros

---

## 📑 DETALLE POR TABLA

### asesoras

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| usuario_id | uuid | ✗ | - | → usuarios.id |
| zona_id | uuid | ✓ | - | → zonas.id |
| telefono | character varying(20) | ✓ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |
| nombre | character varying(100) | ✓ | - | - |
| apellido_paterno | character varying(100) | ✓ | - | - |
| apellido_materno | character varying(100) | ✓ | - | - |
| fecha_nacimiento | date | ✓ | - | - |
| genero | character varying(10) | ✓ | - | - |
| curp | character varying(18) | ✓ | - | - |
| rfc | character varying(13) | ✓ | - | - |
| email | character varying(255) | ✓ | - | - |
| telefono_celular | character varying(20) | ✓ | - | - |
| telefono_casa | character varying(20) | ✓ | - | - |
| telefono_emergencia | character varying(20) | ✓ | - | - |
| contacto_emergencia_nombre | character varying(100) | ✓ | - | - |
| contacto_emergencia_parentesco | character varying(50) | ✓ | - | - |
| dom_calle | character varying(200) | ✓ | - | - |
| dom_numero_ext | character varying(20) | ✓ | - | - |
| dom_numero_int | character varying(20) | ✓ | - | - |
| dom_colonia | character varying(100) | ✓ | - | - |
| dom_municipio | character varying(100) | ✓ | - | - |
| dom_estado | character varying(100) | ✓ | - | - |
| dom_codigo_postal | character varying(10) | ✓ | - | - |
| dom_referencias | text | ✓ | - | - |
| dom_latitud | numeric | ✓ | - | - |
| dom_longitud | numeric | ✓ | - | - |
| dom_geolocalizacion_fecha | timestamp without time zone | ✓ | - | - |
| foto_perfil_ruta | character varying(500) | ✓ | - | - |
| foto_ine_frente_ruta | character varying(500) | ✓ | - | - |
| foto_ine_reverso_ruta | character varying(500) | ✓ | - | - |
| foto_comprobante_domicilio_ruta | character varying(500) | ✓ | - | - |
| fecha_ingreso | date | ✓ | - | - |
| sucursal_id | uuid | ✓ | - | → sucursales.id |
| jefe_inmediato_id | uuid | ✓ | - | → usuarios.id |
| tipo_contrato | character varying(50) | ✓ | - | - |
| nivel | character varying(50) | ✓ | - | - |
| meta_mensual_grupos | integer | ✓ | - | - |
| meta_mensual_monto | numeric | ✓ | - | - |
| observaciones | text | ✓ | - | - |
| activo | boolean | ✓ | true | - |

### audit_log

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| tabla | character varying(50) | ✗ | - | - |
| registro_id | uuid | ✗ | - | - |
| accion | character varying(20) | ✗ | - | - |
| datos_antes | jsonb | ✓ | - | - |
| datos_despues | jsonb | ✓ | - | - |
| usuario_id | uuid | ✓ | - | → usuarios.id |
| ip_address | character varying(45) | ✓ | - | - |
| created_at | timestamp without time zone | ✗ | now() | - |

### caja_movimientos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| tipo | character varying(20) | ✗ | - | - |
| concepto | character varying(150) | ✗ | - | - |
| monto | numeric | ✗ | - | - |
| referencia_id | uuid | ✓ | - | - |
| referencia_tipo | character varying(30) | ✓ | - | - |
| sucursal_id | uuid | ✓ | - | → sucursales.id |
| registrado_por | uuid | ✗ | - | → usuarios.id |
| fecha_movimiento | timestamp without time zone | ✗ | now() | - |
| es_corte | boolean | ✗ | false | - |
| saldo_al_corte | numeric | ✓ | - | - |
| created_at | timestamp without time zone | ✗ | now() | - |

### calendario_pagos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| credito_id | uuid | ✗ | - | → creditos.id |
| numero_pago | integer | ✗ | - | - |
| fecha_programada | date | ✗ | - | - |
| monto_programado | numeric | ✗ | - | - |
| estado | character varying(20) | ✗ | 'PENDIENTE'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |

### ciclos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| grupo_id | uuid | ✗ | - | → grupos.id |
| numero_ciclo | integer | ✗ | - | - |
| expediente_id | uuid | ✓ | - | → expedientes.id |
| asesora_id | uuid | ✗ | - | → asesoras.id |
| tesorera_id | uuid | ✗ | - | → personas.id |
| fecha_inicio | date | ✗ | - | - |
| fecha_fin | date | ✓ | - | - |
| dia_pago | character varying(15) | ✗ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVO'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### codigos_postales

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| codigo | character varying(5) | ✗ | - | - |
| colonia | character varying(100) | ✗ | - | - |
| municipio | character varying(100) | ✗ | - | - |
| estado | character varying(50) | ✗ | 'Nuevo León'::character varyin | - |
| created_at | timestamp without time zone | ✗ | now() | - |

### creditos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| solicitud_id | uuid | ✗ | - | → solicitudes.id |
| persona_id | uuid | ✗ | - | → personas.id |
| expediente_id | uuid | ✗ | - | → expedientes.id |
| monto_autorizado | numeric | ✗ | - | - |
| tasa | numeric | ✗ | - | - |
| num_semanas | integer | ✗ | - | - |
| monto_seguro | numeric | ✗ | - | - |
| costo_apertura | numeric | ✗ | - | - |
| retencion | numeric | ✗ | - | - |
| fecha_desembolso | date | ✗ | - | - |
| monto_desembolsado | numeric | ✗ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVO'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### documentos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| solicitanteId | uuid | ✓ | - | - |
| tipo | character varying(50) | ✓ | - | - |
| estado | character varying(50) | ✓ | 'PENDIENTE'::character varying | - |
| archivoBase64 | text | ✓ | - | - |
| archivoNombre | character varying(255) | ✓ | - | - |
| fechaCarga | timestamp without time zone | ✓ | - | - |
| createdAt | timestamp without time zone | ✓ | now() | - |
| updatedAt | timestamp without time zone | ✓ | now() | - |

### expedientes

**Registros actuales:** 9

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| grupo_id | uuid | ✗ | - | → grupos.id |
| estado | character varying | ✗ | 'En proceso'::character varyin | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| folio | character varying(20) | ✓ | - | - |
| producto_id | uuid | ✓ | - | → productos_credito.id |
| asesora_id | uuid | ✓ | - | → asesoras.id |
| horario_visita | character varying(20) | ✓ | - | - |
| dias_visita | character varying(50) | ✓ | - | - |
| semana_cobro | date | ✓ | - | - |
| observaciones | text | ✓ | - | - |

### grupos

**Registros actuales:** 9

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| nombre | character varying | ✗ | - | - |
| created_by | character varying | ✓ | - | - |
| estado | USER-DEFINED | ✗ | 'FORMANDO'::grupos_status_enum | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| deleted_at | timestamp with time zone | ✓ | - | - |
| folio | character varying(20) | ✓ | - | - |
| zona_id | uuid | ✓ | - | → zonas.id |
| sucursal_id | uuid | ✓ | - | → sucursales.id |
| fecha_inicio | date | ✗ | CURRENT_DATE | - |

### integrantes

**Registros actuales:** 10

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| expediente_id | uuid | ✗ | - | → expedientes.id |
| estado | USER-DEFINED | ✗ | 'DOCUMENTANDO'::solicitantes_e | - |
| created_at | timestamp with time zone | ✗ | now() | - |
| updated_at | timestamp with time zone | ✗ | now() | - |
| folio | character varying(20) | ✓ | - | - |
| persona_id | uuid | ✓ | - | → personas.id |

### mora

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| credito_id | uuid | ✗ | - | → creditos.id |
| calendario_id | uuid | ✗ | - | → calendario_pagos.id |
| fecha_inicio_mora | date | ✗ | - | - |
| fecha_fin_mora | date | ✓ | - | - |
| dias_mora | integer | ✗ | 0 | - |
| monto_mora | numeric | ✗ | 0 | - |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### pagos

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| calendario_id | uuid | ✗ | - | → calendario_pagos.id |
| credito_id | uuid | ✗ | - | → creditos.id |
| persona_id | uuid | ✗ | - | → personas.id |
| fecha_pago | date | ✗ | - | - |
| monto_pagado | numeric | ✗ | - | - |
| dias_atraso | integer | ✗ | 0 | - |
| metodo_pago | character varying(30) | ✓ | - | - |
| recibido_por | uuid | ✓ | - | → usuarios.id |
| estado | character varying(20) | ✗ | 'REGISTRADO'::character varyin | - |
| observaciones | text | ✓ | - | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### personas

**Registros actuales:** 10

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| curp | character varying(18) | ✓ | - | - |
| primer_nombre | character varying(50) | ✗ | - | - |
| segundo_nombre | character varying(50) | ✓ | - | - |
| apellido_pat | character varying(50) | ✗ | - | - |
| apellido_mat | character varying(50) | ✓ | - | - |
| fecha_nac | date | ✓ | - | - |
| genero | character varying(15) | ✓ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |
| telefono | character varying(20) | ✓ | - | - |
| monto_solicitado | numeric | ✓ | - | - |
| telefono_secundario | character varying | ✓ | - | - |

### productos_credito

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| nombre | character varying(100) | ✗ | - | - |
| descripcion | text | ✓ | - | - |
| tasa | numeric | ✗ | - | - |
| precio_seguro | numeric | ✗ | - | - |
| costo_apertura | numeric | ✗ | - | - |
| retencion | numeric | ✗ | - | - |
| num_semanas | integer | ✗ | - | - |
| monto_minimo | numeric | ✗ | - | - |
| monto_maximo | numeric | ✗ | - | - |
| min_integrantes | integer | ✗ | 6 | - |
| max_integrantes | integer | ✗ | 12 | - |
| estado | character varying(20) | ✗ | 'ACTIVO'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### reestructuras

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| credito_id | uuid | ✗ | - | → creditos.id |
| tipo | character varying(20) | ✗ | - | - |
| motivo | text | ✓ | - | - |
| nuevo_monto | numeric | ✓ | - | - |
| nuevas_semanas | integer | ✓ | - | - |
| nueva_tasa | numeric | ✓ | - | - |
| fecha_acuerdo | date | ✗ | - | - |
| autorizado_por | uuid | ✓ | - | → usuarios.id |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### roles

**Registros actuales:** 1

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| nombre | character varying(50) | ✗ | - | - |
| descripcion | character varying(200) | ✓ | - | - |
| permisos | jsonb | ✓ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVO'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### solicitudes

**Registros actuales:** 6

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| integrante_id_old | uuid | ✓ | - | → integrantes.id |
| curp | character varying | ✓ | - | - |
| fecha_nac | character varying | ✓ | - | - |
| estado_civil | character varying | ✓ | - | - |
| colonia | character varying | ✓ | - | - |
| municipio | character varying | ✓ | - | - |
| estado | character varying | ✓ | - | - |
| nacionalidad | character varying | ✓ | - | - |
| estado_nacimiento | character varying | ✓ | - | - |
| genero | character varying | ✓ | - | - |
| ocupacion | character varying | ✓ | - | - |
| nivel_estudio | character varying | ✓ | - | - |
| calle | character varying | ✓ | - | - |
| dom_codigo_postal | character varying | ✓ | - | - |
| telefono | character varying | ✓ | - | - |
| negocio_num_ext | character varying | ✓ | - | - |
| negocio_num_int | character varying | ✓ | - | - |
| negocio_estado | character varying | ✓ | - | - |
| negocio_giro | character varying | ✓ | - | - |
| negocio_gastos | character varying | ✓ | - | - |
| folio | character varying(20) | ✓ | - | - |
| integrante_id | uuid | ✓ | - | → integrantes.id |
| persona_id | uuid | ✓ | - | → personas.id |
| expediente_id | uuid | ✓ | - | → expedientes.id |
| grupo_id | uuid | ✓ | - | → grupos.id |
| ciclo_numero | integer | ✓ | - | - |
| numero_credito | integer | ✓ | - | - |
| credito_id | uuid | ✓ | - | → creditos.id |
| primer_nombre | character varying(50) | ✓ | - | - |
| segundo_nombre | character varying(50) | ✓ | - | - |
| apellido_pat | character varying(50) | ✓ | - | - |
| apellido_mat | character varying(50) | ✓ | - | - |
| dom_calle | character varying(150) | ✓ | - | - |
| dom_num_ext | character varying(20) | ✓ | - | - |
| dom_num_int | character varying(20) | ✓ | - | - |
| dom_entre_calles | character varying(150) | ✓ | - | - |
| dom_cp_id | uuid | ✓ | - | → codigos_postales.id |
| dom_colonia | character varying(100) | ✓ | - | - |
| dom_municipio | character varying(100) | ✓ | - | - |
| dom_estado | character varying(50) | ✓ | - | - |
| dom_telefono | character varying(20) | ✓ | - | - |
| ref1_nombre | character varying(150) | ✓ | - | - |
| ref1_parentesco | character varying(50) | ✓ | - | - |
| ref1_telefono | character varying(20) | ✓ | - | - |
| ref1_direccion | character varying(200) | ✓ | - | - |
| ref2_nombre | character varying(150) | ✓ | - | - |
| ref2_parentesco | character varying(50) | ✓ | - | - |
| ref2_telefono | character varying(20) | ✓ | - | - |
| ref2_direccion | character varying(200) | ✓ | - | - |
| pareja_nombre | character varying(150) | ✓ | - | - |
| pareja_actividad | character varying(100) | ✓ | - | - |
| pareja_ingreso_semanal | numeric | ✓ | - | - |
| negocio_domicilio | character varying(200) | ✓ | - | - |
| negocio_cp_id | uuid | ✓ | - | → codigos_postales.id |
| negocio_colonia | character varying(100) | ✓ | - | - |
| negocio_municipio | character varying(100) | ✓ | - | - |
| negocio_desde_cuando | character varying | ✓ | - | - |
| negocio_ingreso_semanal | numeric | ✓ | - | - |
| negocio_otros_ingresos | numeric | ✓ | - | - |
| negocio_total | numeric | ✓ | - | - |
| beneficiario_nombre | character varying(150) | ✓ | - | - |
| beneficiario_parentesco | character varying(50) | ✓ | - | - |
| beneficiario_telefono | character varying(20) | ✓ | - | - |
| beneficiario_direccion | character varying(200) | ✓ | - | - |
| monto_autorizado | numeric | ✓ | - | - |
| doc_ine_ruta | character varying(500) | ✓ | - | - |
| doc_ine_fecha | date | ✓ | - | - |
| doc_comprobante_ruta | character varying(500) | ✓ | - | - |
| doc_comprobante_fecha | date | ✓ | - | - |
| doc_ine_beneficiario_ruta | character varying(500) | ✓ | - | - |
| doc_ine_beneficiario_fecha | date | ✓ | - | - |
| doc_solicitud_firmada_ruta | character varying(500) | ✓ | - | - |
| doc_solicitud_firmada_fecha | date | ✓ | - | - |
| tiene_medidor_luz | boolean | ✓ | - | - |
| vive_max_5km_tesorera | boolean | ✓ | - | - |
| tiene_menos_70_anios | boolean | ✓ | - | - |
| monto_solicitado | numeric | ✓ | - | - |
| created_at | timestamp with time zone | ✓ | now() | - |
| updated_at | timestamp with time zone | ✓ | now() | - |
| negocio_codigo_postal | character varying(5) | ✓ | - | - |

### sucursales

**Registros actuales:** 1

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| nombre | character varying(100) | ✗ | - | - |
| direccion | character varying(200) | ✓ | - | - |
| telefono | character varying(20) | ✓ | - | - |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

### usuarios

**Registros actuales:** 1

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| nombre | character varying(100) | ✗ | - | - |
| email | character varying(100) | ✗ | - | - |
| password_hash | character varying(255) | ✗ | - | - |
| rol_id | uuid | ✗ | - | → roles.id |
| sucursal_id | uuid | ✓ | - | → sucursales.id |
| estado | character varying(20) | ✗ | 'ACTIVO'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |
| ultimo_login | timestamp with time zone | ✓ | - | - |

### zonas

**Registros actuales:** 0

| COLUMNA | TIPO | NULL | DEFAULT | RELACIÓN |
|---------|------|------|---------|----------|
| id | uuid | ✗ | uuid_generate_v4() | - |
| folio | character varying(20) | ✓ | - | - |
| nombre | character varying(100) | ✗ | - | - |
| sucursal_id | uuid | ✗ | - | → sucursales.id |
| estado | character varying(20) | ✗ | 'ACTIVA'::character varying | - |
| created_at | timestamp without time zone | ✗ | now() | - |
| updated_at | timestamp without time zone | ✗ | now() | - |

