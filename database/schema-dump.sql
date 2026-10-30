-- Schema dump de crelealtad (estructura completa)
-- Generado: 2026-10-30T17:10:03.074Z
-- Base: crelealtad (producción)

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE documentos_estado_enum AS ENUM ('PENDIENTE', 'CARGADO', 'VERIFICADO');
CREATE TYPE documentos_tipo_enum AS ENUM ('INE', 'COMPROBANTE_DOMICILIO', 'IDENTIFICACION_BENEFICIARIO', 'COMPROBANTE_CREDITO_ANTERIOR');
CREATE TYPE grupos_status_enum AS ENUM ('FORMANDO', 'LISTO_PARA_REVISION', 'EN_REVISION', 'AUTORIZADO');
CREATE TYPE solicitantes_estado_enum AS ENUM ('DOCUMENTANDO', 'SUJETA_CREDITO', 'EN_VERIFICACION', 'AUTORIZADA', 'RECHAZADA', 'RETIRADA');

-- Tabla: audit_log
CREATE TABLE audit_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tabla character varying(50) NOT NULL,
  registro_id uuid NOT NULL,
  accion character varying(20) NOT NULL,
  datos_antes jsonb,
  datos_despues jsonb,
  usuario_id uuid,
  ip_address character varying(45),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: backup_tesoreras_20260802
CREATE TABLE backup_tesoreras_20260802 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  integrante_id uuid,
  persona_id uuid,
  expediente_id uuid,
  curp character varying(18),
  nombre_completo character varying(200),
  grupo_nombre character varying,
  telefono character varying,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: caja_movimientos
CREATE TABLE caja_movimientos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  tipo character varying(20) NOT NULL,
  concepto character varying(150) NOT NULL,
  monto numeric(10,2) NOT NULL,
  referencia_id uuid,
  referencia_tipo character varying(30),
  sucursal_id uuid,
  registrado_por uuid NOT NULL,
  fecha_movimiento timestamp without time zone NOT NULL DEFAULT now(),
  es_corte boolean NOT NULL DEFAULT false,
  saldo_al_corte numeric(10,2),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: calendario_pagos
CREATE TABLE calendario_pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  credito_id uuid NOT NULL,
  numero_pago integer NOT NULL,
  fecha_programada date NOT NULL,
  monto_programado numeric(10,2) NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'PENDIENTE'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: ciclos
CREATE TABLE ciclos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  grupo_id uuid NOT NULL,
  numero_ciclo integer NOT NULL,
  expediente_id uuid NOT NULL,
  asesora_id uuid NOT NULL,
  tesorera_id uuid NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  dia_pago character varying(15) NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: codigos_postales
CREATE TABLE codigos_postales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  codigo character varying(5) NOT NULL,
  colonia character varying(100) NOT NULL,
  municipio character varying(100) NOT NULL,
  estado character varying(50) NOT NULL DEFAULT 'Nuevo León'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: creditos
CREATE TABLE creditos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  solicitud_id uuid NOT NULL,
  persona_id uuid NOT NULL,
  expediente_id uuid NOT NULL,
  monto_autorizado numeric(10,2) NOT NULL,
  tasa numeric(5,2) NOT NULL,
  num_semanas integer NOT NULL,
  monto_seguro numeric(10,2) NOT NULL,
  costo_apertura numeric(10,2) NOT NULL,
  retencion numeric(10,2) NOT NULL,
  fecha_desembolso date NOT NULL,
  monto_desembolsado numeric(10,2) NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'BORRADOR'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados
CREATE TABLE empleados (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  usuario_id uuid NOT NULL,
  zona_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  fecha_nacimiento date,
  genero character varying(10),
  curp character varying(18),
  rfc character varying(13),
  fecha_ingreso date,
  tipo_empleado character varying(50) NOT NULL,
  PRIMARY KEY (id)
);

-- Tabla: empleados_contacto
CREATE TABLE empleados_contacto (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id uuid NOT NULL,
  telefono_celular character varying(20) NOT NULL,
  telefono_casa character varying(20),
  telefono_emergencia character varying(20),
  emergencia_nombre character varying(100),
  emergencia_parentesco character varying(50),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_datos_laborales
CREATE TABLE empleados_datos_laborales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id uuid NOT NULL,
  sucursal_id uuid,
  jefe_inmediato_id uuid,
  tipo_contrato character varying(50),
  nivel character varying(50),
  meta_mensual_grupos integer,
  meta_mensual_monto numeric(12,2),
  observaciones text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_documentos
CREATE TABLE empleados_documentos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id uuid NOT NULL,
  tipo_documento character varying(50) NOT NULL,
  ruta_archivo character varying(500) NOT NULL,
  fecha_captura timestamp without time zone NOT NULL DEFAULT now(),
  estado character varying(20) NOT NULL DEFAULT 'VIGENTE'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_domicilios
CREATE TABLE empleados_domicilios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id uuid NOT NULL,
  calle character varying(200),
  numero_ext character varying(20),
  numero_int character varying(20),
  colonia character varying(100),
  municipio character varying(100),
  estado character varying(100),
  codigo_postal character varying(10),
  referencias text,
  latitud numeric(10,8),
  longitud numeric(11,8),
  geolocalizacion_fecha timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  coordenadas_google_maps text,
  PRIMARY KEY (id)
);

-- Tabla: expedientes
CREATE TABLE expedientes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  grupo_id uuid NOT NULL,
  estado character varying NOT NULL DEFAULT 'En proceso'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  folio character varying(20),
  producto_id uuid,
  asesora_id uuid,
  horario_visita character varying(20),
  dias_visita character varying(50),
  semana_cobro date,
  observaciones text,
  estado_fecha timestamp without time zone DEFAULT now(),
  ciclo_historico_origen_id uuid,
  importacion_integrantes_id uuid,
  tesorera_integrante_id uuid,
  PRIMARY KEY (id)
);

-- Tabla: financieras_competidoras
CREATE TABLE financieras_competidoras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_oficial character varying(120) NOT NULL,
  nombre_normalizado character varying(120) NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  catalogo_base boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

-- Tabla: financieras_competidoras_sucursales_version
CREATE TABLE financieras_competidoras_sucursales_version (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL,
  orden smallint NOT NULL,
  zona character varying(120),
  direccion character varying(250),
  numero_asesoras integer,
  valor_sucursal character varying(120),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: financieras_competidoras_versiones
CREATE TABLE financieras_competidoras_versiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  financiera_id uuid NOT NULL,
  revision integer NOT NULL,
  clasificacion character varying(24),
  motivo character varying(500),
  aliases character varying(120)[] NOT NULL DEFAULT (ARRAY[]::character varying[])::character varying(120)[],
  aliases_normalizados character varying(120)[] NOT NULL DEFAULT (ARRAY[]::character varying[])::character varying(120)[],
  activa boolean NOT NULL DEFAULT true,
  vigencia_desde date NOT NULL,
  vigencia_hasta date,
  estado character varying(24) NOT NULL DEFAULT 'PENDIENTE_APROBACION'::character varying,
  propuesta_por uuid NOT NULL,
  propuesta_at timestamp with time zone NOT NULL DEFAULT now(),
  decidida_por uuid,
  decidida_at timestamp with time zone,
  motivo_rechazo character varying(500),
  publicada_por uuid,
  publicada_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nombre_oficial character varying(120) NOT NULL,
  nombre_normalizado character varying(120) NOT NULL,
  semanas character varying(120),
  tasa character varying(120),
  seguro character varying(120),
  apertura character varying(120),
  retencion character varying(120),
  base character varying(120),
  refinanciamiento character varying(120),
  descripcion text,
  PRIMARY KEY (id)
);

-- Tabla: grupos
CREATE TABLE grupos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  created_by uuid,
  estado grupos_status_enum NOT NULL DEFAULT 'FORMANDO'::grupos_status_enum,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  folio character varying(20),
  zona_id uuid,
  sucursal_id uuid,
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id)
);

-- Tabla: historial_grupos_ciclos
CREATE TABLE historial_grupos_ciclos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  importacion_id uuid NOT NULL,
  grupo_id uuid NOT NULL,
  asesora_id uuid,
  clave_origen character varying(80) NOT NULL,
  numero_grupo_legacy integer NOT NULL,
  numero_ciclo integer NOT NULL,
  nombre_grupo_origen character varying(255) NOT NULL,
  asesora_origen character varying(100) NOT NULL,
  fecha_desembolso date NOT NULL,
  fecha_vencimiento date,
  dia_pago character varying(20),
  hora_pago time without time zone,
  numero_integrantes integer,
  plazo_semanas integer,
  prestamo numeric(14,2),
  total_cuenta numeric(14,2),
  vigente_en_corte boolean NOT NULL,
  primera_semana integer NOT NULL,
  ultima_semana integer NOT NULL,
  total_semanas_registradas integer NOT NULL,
  ultima_fila_excel integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: historial_grupos_ciclos_semanas
CREATE TABLE historial_grupos_ciclos_semanas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ciclo_historico_id uuid NOT NULL,
  fila_excel integer NOT NULL,
  clave_fila_origen character varying(100),
  semana integer NOT NULL,
  numero_documento integer,
  fecha_cobro date,
  pago_minimo numeric(14,2),
  total_pagado_semana numeric(14,2),
  ficha_pagada_semana numeric(14,2),
  ahorro_pagado_semana numeric(14,2),
  seguro_pagado_semana numeric(14,2),
  semanas_sin_pago integer,
  total_credito numeric(14,2),
  credito_pagado_acumulado numeric(14,2),
  porcentaje_pagado numeric(12,8),
  saldo_por_liquidar numeric(14,2),
  porcentaje_por_liquidar numeric(12,8),
  capital_cobrado_semana numeric(14,2),
  capital_cobrado_acumulado numeric(14,2),
  capital_pendiente numeric(14,2),
  utilidad_cobrada_semana numeric(14,2),
  utilidad_cobrada_acumulada numeric(14,2),
  seguro_cobrado_acumulado numeric(14,2),
  hash_semantico character(64) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: importaciones_excel
CREATE TABLE importaciones_excel (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo_fuente character varying(50) NOT NULL,
  archivo_nombre character varying(255) NOT NULL,
  archivo_sha256 character(64) NOT NULL,
  semana_corte integer NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'VALIDADO'::character varying,
  es_base_activa boolean NOT NULL DEFAULT false,
  manifest jsonb NOT NULL,
  creado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  activated_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- Tabla: integrantes
CREATE TABLE integrantes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  expediente_id uuid NOT NULL,
  estado solicitantes_estado_enum NOT NULL DEFAULT 'DOCUMENTANDO'::solicitantes_estado_enum,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  folio character varying(20),
  persona_id uuid,
  motivo_retiro character varying(40),
  motivo_retiro_detalle character varying(250),
  retirada_at timestamp with time zone,
  retirada_por uuid,
  PRIMARY KEY (id)
);

-- Tabla: mora
CREATE TABLE mora (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  credito_id uuid NOT NULL,
  calendario_id uuid NOT NULL,
  fecha_inicio_mora date NOT NULL,
  fecha_fin_mora date,
  dias_mora integer NOT NULL DEFAULT 0,
  monto_mora numeric(10,2) NOT NULL DEFAULT 0,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: motivos_clasificacion_evidencia
CREATE TABLE motivos_clasificacion_evidencia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clasificacion character varying(10) NOT NULL,
  concepto character varying(120) NOT NULL,
  concepto_normalizado character varying(120) NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  orden integer NOT NULL,
  PRIMARY KEY (id)
);

-- Tabla: pagos
CREATE TABLE pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  calendario_id uuid NOT NULL,
  credito_id uuid NOT NULL,
  persona_id uuid NOT NULL,
  fecha_pago date NOT NULL,
  monto_pagado numeric(10,2) NOT NULL,
  dias_atraso integer NOT NULL DEFAULT 0,
  metodo_pago character varying(30),
  recibido_por uuid,
  estado character varying(20) NOT NULL DEFAULT 'PENDIENTE'::character varying,
  observaciones text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_ciclos_credito
CREATE TABLE parametros_conclusiones_ciclos_credito (
  id smallint NOT NULL DEFAULT 1,
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_concordancia_ficha
CREATE TABLE parametros_conclusiones_concordancia_ficha (
  id smallint NOT NULL DEFAULT 1,
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_concordancia_prestamo
CREATE TABLE parametros_conclusiones_concordancia_prestamo (
  id smallint NOT NULL DEFAULT 1,
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_promedio_evidencias
CREATE TABLE parametros_conclusiones_promedio_evidencias (
  id smallint NOT NULL DEFAULT 1,
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_semana_credito
CREATE TABLE parametros_conclusiones_semana_credito (
  id smallint NOT NULL DEFAULT 1,
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_conclusiones_tolerancia_semana_desembolso
CREATE TABLE parametros_conclusiones_tolerancia_semana_desembolso (
  id smallint NOT NULL DEFAULT 1,
  audit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  verde_desde smallint NOT NULL,
  verde_hasta smallint NOT NULL,
  amarillo_desde smallint NOT NULL,
  amarillo_hasta smallint NOT NULL,
  rojo_desde smallint NOT NULL,
  rojo_hasta smallint NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_entrevista_opciones
CREATE TABLE parametros_entrevista_opciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  familia character varying(60) NOT NULL,
  codigo character varying(80) NOT NULL,
  etiqueta character varying(120) NOT NULL,
  etiqueta_normalizada character varying(120) NOT NULL,
  orden integer NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_verificacion_cierre_grupo_versiones
CREATE TABLE parametros_verificacion_cierre_grupo_versiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  revision integer NOT NULL,
  integrantes_verificadas_requeridas integer NOT NULL,
  publicada_por uuid,
  publicada_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: parametros_verificacion_pasos_reglas
CREATE TABLE parametros_verificacion_pasos_reglas (
  version_id uuid NOT NULL,
  tipo_integrante character varying(40) NOT NULL,
  paso character varying(40) NOT NULL,
  obligatorio boolean NOT NULL,
  modalidad character varying(40) NOT NULL,
  dias_para_obligatorio integer,
  PRIMARY KEY (version_id, tipo_integrante, paso)
);

-- Tabla: parametros_verificacion_pasos_versiones
CREATE TABLE parametros_verificacion_pasos_versiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  revision integer NOT NULL,
  publicada_por uuid,
  publicada_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: personas
CREATE TABLE personas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  curp character varying(18),
  primer_nombre character varying(50),
  segundo_nombre character varying(50),
  apellido_pat character varying(50) NOT NULL,
  apellido_mat character varying(50),
  fecha_nac date,
  genero character varying(15),
  estado character varying(20) NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  telefono character varying(20),
  monto_solicitado numeric(10,2),
  telefono_secundario character varying,
  nombres character varying(150) NOT NULL,
  nombre_completo character varying(255),
  PRIMARY KEY (id)
);

-- Tabla: productos_credito
CREATE TABLE productos_credito (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  nombre character varying(100) NOT NULL,
  descripcion text,
  tasa numeric(5,2) NOT NULL,
  precio_seguro numeric(10,2) NOT NULL,
  costo_apertura numeric(10,2) NOT NULL,
  retencion numeric(5,2) NOT NULL,
  num_semanas integer NOT NULL,
  monto_minimo numeric(10,2) NOT NULL,
  monto_maximo numeric(10,2) NOT NULL,
  min_integrantes integer NOT NULL DEFAULT 6,
  max_integrantes integer NOT NULL DEFAULT 12,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: reestructuras
CREATE TABLE reestructuras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  credito_id uuid NOT NULL,
  tipo character varying(20) NOT NULL,
  motivo text,
  nuevo_monto numeric(10,2),
  nuevas_semanas integer,
  nueva_tasa numeric(5,2),
  fecha_acuerdo date NOT NULL,
  autorizado_por uuid,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: roles
CREATE TABLE roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  nombre character varying(50) NOT NULL,
  descripcion character varying(200),
  permisos jsonb,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: schema_migrations
CREATE TABLE schema_migrations (
  version character varying(255) NOT NULL,
  checksum character(64) NOT NULL,
  source character varying(20) NOT NULL DEFAULT 'MIGRATION'::character varying,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_by text NOT NULL DEFAULT CURRENT_USER,
  execution_ms integer,
  PRIMARY KEY (version)
);

-- Tabla: solicitudes
CREATE TABLE solicitudes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  integrante_id uuid NOT NULL,
  persona_id uuid NOT NULL,
  expediente_id uuid NOT NULL,
  grupo_id uuid NOT NULL,
  credito_id uuid,
  ciclo_numero integer,
  numero_credito integer,
  monto_solicitado numeric(10,2),
  monto_autorizado numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  monto_solicitado_confirmado_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_beneficiarios
CREATE TABLE solicitudes_beneficiarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  beneficiario_nombre character varying(150),
  beneficiario_parentesco character varying(50),
  beneficiario_telefono character varying(20),
  beneficiario_direccion character varying(200),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_datos_personales
CREATE TABLE solicitudes_datos_personales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  primer_nombre character varying(50),
  segundo_nombre character varying(50),
  apellido_pat character varying(50),
  apellido_mat character varying(50),
  curp character varying(18),
  fecha_nac date,
  genero character varying(20),
  nacionalidad character varying(50),
  estado_nacimiento character varying(50),
  estado_civil character varying(50),
  ocupacion character varying(100),
  nivel_estudio character varying(50),
  telefono character varying(20),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  nombres character varying(150),
  nombre_completo character varying(255),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_documentos
CREATE TABLE solicitudes_documentos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  doc_ine_ruta character varying(500),
  doc_ine_fecha date,
  doc_comprobante_ruta character varying(500),
  doc_comprobante_fecha date,
  doc_ine_beneficiario_ruta character varying(500),
  doc_ine_beneficiario_fecha date,
  doc_solicitud_firmada_ruta character varying(500),
  doc_solicitud_firmada_fecha date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  doc_comprobante_credito_ruta character varying(500),
  doc_comprobante_credito_fecha date,
  doc_control_pagos_ruta character varying(500),
  doc_control_pagos_fecha date,
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_domicilios
CREATE TABLE solicitudes_domicilios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  dom_calle character varying(150),
  dom_num_ext character varying(20),
  dom_num_int character varying(20),
  dom_entre_calles character varying(150),
  dom_colonia character varying(100),
  dom_municipio character varying(100),
  dom_estado character varying(50),
  dom_codigo_postal character varying(5),
  dom_cp_id uuid,
  dom_telefono character varying(20),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  dom_latitud numeric(10,7),
  dom_longitud numeric(11,7),
  dom_geocodificacion_fuente character varying(40),
  dom_geocodificacion_fecha timestamp with time zone,
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_negocios
CREATE TABLE solicitudes_negocios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  negocio_giro character varying(100),
  negocio_domicilio character varying(200),
  negocio_colonia character varying(100),
  negocio_municipio character varying(100),
  negocio_estado character varying(50),
  negocio_codigo_postal character varying(5),
  negocio_cp_id uuid,
  negocio_num_ext character varying(20),
  negocio_num_int character varying(20),
  negocio_desde_cuando character varying(50),
  negocio_ingreso_semanal numeric(10,2),
  negocio_otros_ingresos numeric(10,2),
  negocio_gastos numeric(10,2),
  negocio_total numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_referencias
CREATE TABLE solicitudes_referencias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  ref1_nombre character varying(150),
  ref1_parentesco character varying(50),
  ref1_telefono character varying(20),
  ref1_direccion character varying(200),
  ref2_nombre character varying(150),
  ref2_parentesco character varying(50),
  ref2_telefono character varying(20),
  ref2_direccion character varying(200),
  pareja_nombre character varying(150),
  pareja_actividad character varying(100),
  pareja_ingreso_semanal numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_validaciones
CREATE TABLE solicitudes_validaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  tiene_medidor_luz character varying(20),
  vive_max_5km_tesorera character varying(20),
  tiene_menos_70_anios character varying(20),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: sucursales
CREATE TABLE sucursales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  nombre character varying(100) NOT NULL,
  direccion character varying(200),
  telefono character varying(20),
  estado character varying(20) NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: usuarios
CREATE TABLE usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  nombre character varying(100),
  apellido_paterno character varying(100),
  apellido_materno character varying(100),
  email character varying(100),
  password_hash character varying(255) NOT NULL,
  rol_id uuid NOT NULL,
  sucursal_id uuid NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVO'::character varying,
  ultimo_login timestamp with time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  abreviatura character varying(100),
  requiere_cambio_pin boolean NOT NULL DEFAULT false,
  permisos_personalizados jsonb,
  PRIMARY KEY (id)
);

-- Tabla: verificacion_entrevista_desacuerdos_montos
CREATE TABLE verificacion_entrevista_desacuerdos_montos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entrevista_id uuid NOT NULL,
  expediente_id uuid NOT NULL,
  integrante_objetivo_id uuid NOT NULL,
  motivo character varying(120),
  activo boolean NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_entrevista_evidencia_integrantes
CREATE TABLE verificacion_entrevista_evidencia_integrantes (
  evidencia_id uuid NOT NULL,
  expediente_id uuid NOT NULL,
  integrante_id uuid NOT NULL,
  asociada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  actualizada_por uuid NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  calificacion_revision character varying(10),
  calificada_por uuid,
  calificada_at timestamp with time zone,
  PRIMARY KEY (evidencia_id, integrante_id)
);

-- Tabla: verificacion_entrevista_evidencias
CREATE TABLE verificacion_entrevista_evidencias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  ruta character varying(500) NOT NULL,
  mime_type character varying(20) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  captura_fuente character varying(20) NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tipo character varying(40) NOT NULL DEFAULT 'NEGOCIO'::character varying,
  foto_capturada_at timestamp with time zone,
  ubicacion_latitud numeric(10,7),
  ubicacion_longitud numeric(11,7),
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone,
  ubicacion_fuente character varying(20),
  legado_sin_ubicacion boolean NOT NULL DEFAULT false,
  expediente_id uuid NOT NULL,
  clasificacion_semaforo character varying(10),
  motivo_clasificacion_id uuid,
  PRIMARY KEY (id)
);

-- Tabla: verificacion_entrevista_familiares
CREATE TABLE verificacion_entrevista_familiares (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entrevista_id uuid NOT NULL,
  expediente_id uuid NOT NULL,
  familiar_integrante_id uuid NOT NULL,
  activo boolean NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_entrevista_telefono_confirmaciones
CREATE TABLE verificacion_entrevista_telefono_confirmaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  llamada_id uuid NOT NULL,
  tipo_telefono character varying(20) NOT NULL,
  telefono character varying(10) NOT NULL,
  ruta character varying(500) NOT NULL,
  mime_type character varying(20) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  evidencia_id uuid NOT NULL,
  PRIMARY KEY (id)
);

-- Tabla: verificacion_entrevistas
CREATE TABLE verificacion_entrevistas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  expediente_id uuid NOT NULL,
  integrante_id uuid NOT NULL,
  conoce_asesora boolean,
  como_conocio_asesora character varying(40),
  conoce_integrantes boolean,
  tiempo_conoce_integrantes character varying(20),
  sabe_montos_companeras boolean,
  acuerdo_montos_companeras boolean,
  conoce_tesorera boolean,
  tesorera_reconocida_integrante_id uuid,
  domicilio_recoleccion_integrante_id uuid,
  desconoce_domicilio_recoleccion boolean,
  tiene_familiares_grupo boolean,
  tiene_otro_credito_grupal boolean,
  financiera_credito_grupal character varying(100),
  credito_grupal_anterior_activo boolean,
  valor_ficha_credito_grupal numeric(12,2),
  semana_actual_credito_grupal smallint,
  mes_desembolso_credito_grupal smallint,
  mes_ultimo_pago_credito_grupal smallint,
  anio_ultimo_pago_credito_grupal smallint,
  numero_ciclos_credito_grupal smallint,
  tasa_credito_grupal smallint,
  nombre_asesora_credito_grupal character varying(200),
  telefono_asesora_credito_grupal character varying(10),
  motivo_no_renovacion_credito_grupal character varying(120),
  vive_en_domicilio boolean,
  motivo_no_vive_domicilio character varying(120),
  tipo_domicilio character varying(20),
  familiar_domicilio character varying(30),
  antiguedad_domicilio character varying(20),
  personas_viven_casa character varying(10),
  convivientes character varying(20)[] NOT NULL DEFAULT '{}'::character varying[],
  saben_del_credito boolean,
  otro_ingreso_hogar boolean,
  otro_ingreso_semanal numeric(12,2),
  capacidad_pago_semanal numeric(12,2),
  uso_credito text,
  fuentes_ingreso character varying(20)[] NOT NULL DEFAULT '{}'::character varying[],
  sueldo_semanal numeric(12,2),
  lugar_trabajo character varying(250),
  antiguedad_laboral character varying(20),
  tipo_negocio character varying(250),
  ingreso_libre_semanal_negocio numeric(12,2),
  ubicacion_negocio text,
  tiene_control_pagos boolean,
  motivo_sin_control_pagos character varying(120),
  asesora_acudio_semanalmente character varying(20),
  firmaban_control_semanalmente character varying(20),
  trato_asesora_tesorera character varying(20),
  conoce_premio_tesorera boolean,
  opinion_credito character varying(20),
  trato_desembolso character varying(20),
  rapidez_desembolso character varying(20),
  informacion_credito_clara boolean,
  recomendaria boolean,
  motivo_recomendacion character varying(120),
  oportunidad_mejora text,
  entrevistada_por uuid NOT NULL,
  actualizada_por uuid NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  monto_ultimo_prestamo_credito_grupal numeric(12,2),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_imagenes_domicilio
CREATE TABLE verificacion_imagenes_domicilio (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  tipo character varying(40) NOT NULL,
  ruta character varying(500) NOT NULL,
  mime_type character varying(20) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  captura_fuente character varying(20) NOT NULL,
  foto_capturada_at timestamp with time zone NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  ubicacion_latitud numeric(10,7) NOT NULL,
  ubicacion_longitud numeric(11,7) NOT NULL,
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone NOT NULL,
  ubicacion_fuente character varying(20) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_llamada_caracteristicas
CREATE TABLE verificacion_llamada_caracteristicas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  encuesta_id uuid NOT NULL,
  clave character varying(40) NOT NULL,
  coincide boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_llamada_encuestas
CREATE TABLE verificacion_llamada_encuestas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  llamada_id uuid NOT NULL,
  identidad_coincide boolean NOT NULL,
  domicilio_coincide boolean NOT NULL,
  accion_posterior character varying(30) NOT NULL,
  registrada_por uuid NOT NULL,
  completada_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_llamada_evidencias
CREATE TABLE verificacion_llamada_evidencias (
  id uuid NOT NULL,
  encuesta_id uuid,
  ruta character varying(500) NOT NULL,
  mime_type character varying(100) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  llamada_id uuid NOT NULL,
  proposito character varying(30) NOT NULL,
  version integer NOT NULL,
  tipo_telefono character varying(20),
  telefono character varying(10),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_llamadas
CREATE TABLE verificacion_llamadas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  canal character varying(20) NOT NULL,
  resultado character varying(20) NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ubicacion_latitud numeric(10,7),
  ubicacion_longitud numeric(11,7),
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone,
  ubicacion_fuente character varying(20),
  tipo_telefono character varying(20),
  telefono character varying(10),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_medidor_luz_respuestas
CREATE TABLE verificacion_medidor_luz_respuestas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  fachada_id uuid NOT NULL,
  tiene_medidor boolean NOT NULL,
  motivo character varying(50),
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_visita_vecino_evidencias
CREATE TABLE verificacion_visita_vecino_evidencias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  visita_id uuid NOT NULL,
  ruta character varying(500) NOT NULL,
  mime_type character varying(20) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  captura_fuente character varying(20) NOT NULL,
  foto_capturada_at timestamp with time zone NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  ubicacion_latitud numeric(10,7) NOT NULL,
  ubicacion_longitud numeric(11,7) NOT NULL,
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone NOT NULL,
  ubicacion_fuente character varying(20) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_visita_vecino_fachadas
CREATE TABLE verificacion_visita_vecino_fachadas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  ruta character varying(500) NOT NULL,
  mime_type character varying(20) NOT NULL,
  tamano_bytes integer NOT NULL,
  sha256 character(64) NOT NULL,
  captura_fuente character varying(20) NOT NULL,
  foto_capturada_at timestamp with time zone NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  ubicacion_latitud numeric(10,7) NOT NULL,
  ubicacion_longitud numeric(11,7) NOT NULL,
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone NOT NULL,
  ubicacion_fuente character varying(20) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: verificacion_visita_vecino_opciones
CREATE TABLE verificacion_visita_vecino_opciones (
  visita_id uuid NOT NULL,
  opcion_id uuid NOT NULL,
  etiqueta_snapshot character varying(120) NOT NULL,
  orden_snapshot integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (visita_id, opcion_id)
);

-- Tabla: verificacion_visitas_vecino
CREATE TABLE verificacion_visitas_vecino (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  integrante_id uuid NOT NULL,
  conoce_y_sabe_donde_vive boolean NOT NULL,
  idempotency_key character varying(100) NOT NULL,
  registrada_por uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ubicacion_latitud numeric(10,7) NOT NULL,
  ubicacion_longitud numeric(11,7) NOT NULL,
  ubicacion_precision_metros numeric(10,2),
  ubicacion_capturada_at timestamp with time zone NOT NULL,
  ubicacion_fuente character varying(20) NOT NULL,
  fachada_id uuid,
  PRIMARY KEY (id)
);

-- Tabla: zonas
CREATE TABLE zonas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folio character varying(20),
  nombre character varying(100) NOT NULL,
  sucursal_id uuid NOT NULL,
  estado character varying(20) NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Funciones
CREATE OR REPLACE FUNCTION public.validar_opcion_respuesta_visita_vecino()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  respuesta_visita BOOLEAN;
  familia_esperada VARCHAR(60);
  opcion_actual RECORD;
BEGIN
  SELECT conoce_y_sabe_donde_vive
    INTO respuesta_visita
  FROM public.verificacion_visitas_vecino
  WHERE id = NEW.visita_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La visita al vecino indicada no existe';
  END IF;

  familia_esperada := CASE
    WHEN respuesta_visita THEN 'VISITA_VECINO_RESPUESTA_SI'
    ELSE 'VISITA_VECINO_RESPUESTA_NO'
  END;

  SELECT familia, etiqueta, orden, activo
    INTO opcion_actual
  FROM public.parametros_entrevista_opciones
  WHERE id = NEW.opcion_id;

  IF NOT FOUND OR opcion_actual.familia <> familia_esperada THEN
    RAISE EXCEPTION 'La opción no corresponde a la respuesta de la visita al vecino';
  END IF;

  IF opcion_actual.activo IS NOT TRUE THEN
    RAISE EXCEPTION 'La opción de la visita al vecino está inactiva';
  END IF;

  NEW.etiqueta_snapshot := opcion_actual.etiqueta;
  NEW.orden_snapshot := opcion_actual.orden;
  RETURN NEW;
END;
$function$;

-- Unique Constraints
ALTER TABLE caja_movimientos ADD CONSTRAINT caja_movimientos_folio_key UNIQUE (folio);
ALTER TABLE calendario_pagos ADD CONSTRAINT calendario_pagos_credito_id_numero_pago_key UNIQUE (credito_id, numero_pago);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_folio_key UNIQUE (folio);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_grupo_id_numero_ciclo_key UNIQUE (grupo_id, numero_ciclo);
ALTER TABLE ciclos ADD CONSTRAINT uq_ciclos_expediente_id UNIQUE (expediente_id);
ALTER TABLE codigos_postales ADD CONSTRAINT codigos_postales_folio_key UNIQUE (folio);
ALTER TABLE creditos ADD CONSTRAINT creditos_folio_key UNIQUE (folio);
ALTER TABLE empleados ADD CONSTRAINT asesoras_folio_key UNIQUE (folio);
ALTER TABLE empleados ADD CONSTRAINT empleados_usuario_id_unique UNIQUE (usuario_id);
ALTER TABLE empleados_contacto ADD CONSTRAINT asesoras_contacto_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE empleados_datos_laborales ADD CONSTRAINT asesoras_datos_laborales_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE empleados_domicilios ADD CONSTRAINT asesoras_domicilios_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_folio_key UNIQUE (folio);
ALTER TABLE expedientes ADD CONSTRAINT uq_expedientes_ciclo_historico_origen UNIQUE (ciclo_historico_origen_id);
ALTER TABLE expedientes ADD CONSTRAINT uq_expedientes_id_grupo_id UNIQUE (id, grupo_id);
ALTER TABLE financieras_competidoras ADD CONSTRAINT uq_financieras_competidoras_nombre_normalizado UNIQUE (nombre_normalizado);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT uq_financieras_sucursales_version_orden UNIQUE (version_id, orden);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT uq_financieras_competidoras_version UNIQUE (financiera_id, revision);
ALTER TABLE grupos ADD CONSTRAINT grupos_folio_key UNIQUE (folio);
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT uq_historial_grupos_ciclos_id_grupo UNIQUE (id, grupo_id);
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT uq_historial_grupos_ciclos_importacion_clave UNIQUE (importacion_id, clave_origen);
ALTER TABLE historial_grupos_ciclos_semanas ADD CONSTRAINT uq_historial_grupos_ciclos_semanas_fila UNIQUE (ciclo_historico_id, fila_excel);
ALTER TABLE importaciones_excel ADD CONSTRAINT uq_importaciones_excel_fuente_hash UNIQUE (tipo_fuente, archivo_sha256);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_expediente_id_id_key UNIQUE (expediente_id, id);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_folio_key UNIQUE (folio);
ALTER TABLE integrantes ADD CONSTRAINT uq_integrante_expediente_persona UNIQUE (expediente_id, persona_id);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_color_concepto_unique UNIQUE (clasificacion, concepto_normalizado);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_id_color_unique UNIQUE (id, clasificacion);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT uq_motivos_clasificacion_evidencia_clasificacion_orden UNIQUE (clasificacion, orden) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE pagos ADD CONSTRAINT pagos_folio_key UNIQUE (folio);
ALTER TABLE parametros_conclusiones_ciclos_credito ADD CONSTRAINT uq_parametros_conclusiones_ciclos_audit_id UNIQUE (audit_id);
ALTER TABLE parametros_conclusiones_concordancia_ficha ADD CONSTRAINT uq_par_con_concordancia_ficha_audit UNIQUE (audit_id);
ALTER TABLE parametros_conclusiones_concordancia_prestamo ADD CONSTRAINT uq_par_con_concordancia_prestamo_audit UNIQUE (audit_id);
ALTER TABLE parametros_conclusiones_promedio_evidencias ADD CONSTRAINT uq_par_con_promedio_evidencias_audit UNIQUE (audit_id);
ALTER TABLE parametros_conclusiones_semana_credito ADD CONSTRAINT uq_parametros_conclusiones_semana_audit_id UNIQUE (audit_id);
ALTER TABLE parametros_conclusiones_tolerancia_semana_desembolso ADD CONSTRAINT uq_parametros_conclusiones_tolerancia_desembolso_audit_id UNIQUE (audit_id);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT uq_parametros_entrevista_codigo UNIQUE (familia, codigo);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT uq_parametros_entrevista_etiqueta UNIQUE (familia, etiqueta_normalizada);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT uq_parametros_entrevista_orden UNIQUE (familia, orden) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE parametros_verificacion_cierre_grupo_versiones ADD CONSTRAINT parametros_verificacion_cierre_grupo_versiones_revision_key UNIQUE (revision);
ALTER TABLE parametros_verificacion_pasos_versiones ADD CONSTRAINT parametros_verificacion_pasos_versiones_revision_key UNIQUE (revision);
ALTER TABLE personas ADD CONSTRAINT personas_curp_key UNIQUE (curp);
ALTER TABLE personas ADD CONSTRAINT personas_folio_key UNIQUE (folio);
ALTER TABLE productos_credito ADD CONSTRAINT productos_credito_folio_key UNIQUE (folio);
ALTER TABLE reestructuras ADD CONSTRAINT reestructuras_folio_key UNIQUE (folio);
ALTER TABLE roles ADD CONSTRAINT roles_folio_key UNIQUE (folio);
ALTER TABLE roles ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);
ALTER TABLE solicitudes ADD CONSTRAINT solicitudes_persona_numero_credito_unique UNIQUE (persona_id, numero_credito);
ALTER TABLE solicitudes_beneficiarios ADD CONSTRAINT solicitudes_beneficiarios_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_datos_personales ADD CONSTRAINT solicitudes_datos_personales_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_documentos ADD CONSTRAINT solicitudes_documentos_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_domicilios ADD CONSTRAINT solicitudes_domicilios_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_negocios ADD CONSTRAINT solicitudes_negocios_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_referencias ADD CONSTRAINT solicitudes_referencias_unique UNIQUE (solicitud_id);
ALTER TABLE solicitudes_validaciones ADD CONSTRAINT solicitudes_validaciones_unique UNIQUE (solicitud_id);
ALTER TABLE sucursales ADD CONSTRAINT sucursales_folio_key UNIQUE (folio);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_new_email_key UNIQUE (email);
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_id_expediente_key UNIQUE (id, expediente_id);
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT ux_verificacion_entrevista_telefono_llamada UNIQUE (llamada_id);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_id_expediente_unico UNIQUE (id, expediente_id);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_integrante_unica UNIQUE (integrante_id);
ALTER TABLE verificacion_llamada_caracteristicas ADD CONSTRAINT ux_verificacion_llamada_caracteristica UNIQUE (encuesta_id, clave);
ALTER TABLE verificacion_llamada_encuestas ADD CONSTRAINT verificacion_llamada_encuestas_llamada_id_key UNIQUE (llamada_id);
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_encuesta_id_key UNIQUE (encuesta_id);
ALTER TABLE verificacion_visita_vecino_opciones ADD CONSTRAINT uq_verificacion_visita_vecino_opcion_unica UNIQUE (visita_id);
ALTER TABLE zonas ADD CONSTRAINT zonas_folio_key UNIQUE (folio);

-- Indexes
CREATE INDEX idx_audit_fecha ON public.audit_log USING btree (created_at);
CREATE INDEX idx_audit_tabla ON public.audit_log USING btree (tabla, registro_id);
CREATE INDEX idx_audit_usuario ON public.audit_log USING btree (usuario_id);
CREATE INDEX idx_caja_fecha ON public.caja_movimientos USING btree (fecha_movimiento);
CREATE INDEX idx_caja_sucursal ON public.caja_movimientos USING btree (sucursal_id);
CREATE INDEX idx_calendario_credito ON public.calendario_pagos USING btree (credito_id);
CREATE INDEX idx_cp_codigo ON public.codigos_postales USING btree (codigo);
CREATE INDEX idx_cp_colonia ON public.codigos_postales USING btree (colonia);
CREATE INDEX idx_cp_municipio ON public.codigos_postales USING btree (municipio);
CREATE INDEX idx_creditos_expediente ON public.creditos USING btree (expediente_id);
CREATE INDEX idx_creditos_persona ON public.creditos USING btree (persona_id);
CREATE INDEX idx_asesoras_curp ON public.empleados USING btree (curp);
CREATE INDEX idx_asesoras_zona ON public.empleados USING btree (zona_id);
CREATE INDEX idx_empleados_contacto_empleado ON public.empleados_contacto USING btree (empleado_id);
CREATE INDEX idx_asesoras_laborales_jefe ON public.empleados_datos_laborales USING btree (jefe_inmediato_id);
CREATE INDEX idx_asesoras_laborales_sucursal ON public.empleados_datos_laborales USING btree (sucursal_id);
CREATE INDEX idx_empleados_laborales_empleado ON public.empleados_datos_laborales USING btree (empleado_id);
CREATE INDEX idx_asesoras_documentos_estado ON public.empleados_documentos USING btree (estado);
CREATE INDEX idx_asesoras_documentos_tipo ON public.empleados_documentos USING btree (tipo_documento);
CREATE INDEX idx_empleados_documentos_empleado ON public.empleados_documentos USING btree (empleado_id);
CREATE INDEX idx_asesoras_domicilios_latlon ON public.empleados_domicilios USING btree (latitud, longitud);
CREATE INDEX idx_empleados_domicilios_empleado ON public.empleados_domicilios USING btree (empleado_id);
CREATE INDEX idx_expedientes_grupo_id ON public.expedientes USING btree (grupo_id);
CREATE INDEX ix_expedientes_importacion_integrantes ON public.expedientes USING btree (importacion_integrantes_id) WHERE (importacion_integrantes_id IS NOT NULL);
CREATE INDEX ix_expedientes_tesorera_integrante ON public.expedientes USING btree (tesorera_integrante_id) WHERE (tesorera_integrante_id IS NOT NULL);
CREATE INDEX idx_financieras_sucursales_version ON public.financieras_competidoras_sucursales_version USING btree (version_id, orden);
CREATE INDEX idx_financieras_competidoras_version_aliases ON public.financieras_competidoras_versiones USING gin (aliases_normalizados);
CREATE INDEX idx_financieras_competidoras_version_vigencia ON public.financieras_competidoras_versiones USING btree (financiera_id, estado, vigencia_desde DESC, vigencia_hasta);
CREATE UNIQUE INDEX uq_financieras_competidoras_version_abierta ON public.financieras_competidoras_versiones USING btree (financiera_id) WHERE ((estado)::text = ANY ((ARRAY['PENDIENTE_APROBACION'::character varying, 'APROBADA'::character varying])::text[]));
CREATE INDEX idx_grupos_created_by ON public.grupos USING btree (created_by) WHERE (created_by IS NOT NULL);
CREATE INDEX idx_grupos_nombre ON public.grupos USING btree (nombre);
CREATE INDEX ix_historial_grupos_ciclos_asesora_vigente ON public.historial_grupos_ciclos USING btree (asesora_id, vigente_en_corte);
CREATE INDEX ix_historial_grupos_ciclos_grupo ON public.historial_grupos_ciclos USING btree (grupo_id, numero_ciclo);
CREATE INDEX ix_historial_grupos_ciclos_importacion ON public.historial_grupos_ciclos USING btree (importacion_id);
CREATE INDEX ix_historial_grupos_ciclos_semanas_ciclo_semana ON public.historial_grupos_ciclos_semanas USING btree (ciclo_historico_id, semana);
CREATE UNIQUE INDEX uq_importaciones_excel_base_activa ON public.importaciones_excel USING btree (tipo_fuente) WHERE (es_base_activa = true);
CREATE INDEX idx_integrantes_expediente ON public.integrantes USING btree (expediente_id);
CREATE INDEX idx_integrantes_expediente_id ON public.integrantes USING btree (expediente_id);
CREATE INDEX idx_integrantes_persona ON public.integrantes USING btree (persona_id);
CREATE INDEX idx_integrantes_persona_id ON public.integrantes USING btree (persona_id);
CREATE INDEX ix_motivos_clasificacion_evidencia_color_activo ON public.motivos_clasificacion_evidencia USING btree (clasificacion, activo, concepto_normalizado);
CREATE INDEX idx_pagos_credito ON public.pagos USING btree (credito_id);
CREATE INDEX idx_pagos_persona ON public.pagos USING btree (persona_id);
CREATE INDEX idx_parametros_entrevista_activos ON public.parametros_entrevista_opciones USING btree (familia, orden) WHERE (activo = true);
CREATE INDEX idx_personas_curp ON public.personas USING btree (curp);
CREATE INDEX idx_personas_nombre ON public.personas USING btree (apellido_pat, primer_nombre);
CREATE INDEX idx_personas_nombre_completo ON public.personas USING gin (to_tsvector('spanish'::regconfig, (nombre_completo)::text));
CREATE INDEX idx_personas_nombre_completo_btree ON public.personas USING btree (nombre_completo);
CREATE INDEX idx_solicitudes_expediente ON public.solicitudes USING btree (expediente_id);
CREATE INDEX idx_solicitudes_folio ON public.solicitudes USING btree (folio);
CREATE INDEX idx_solicitudes_grupo ON public.solicitudes USING btree (grupo_id);
CREATE INDEX idx_solicitudes_persona ON public.solicitudes USING btree (persona_id);
CREATE UNIQUE INDEX solicitudes_integrante_unique ON public.solicitudes USING btree (integrante_id) WHERE (integrante_id IS NOT NULL);
CREATE INDEX idx_beneficiarios_solicitud ON public.solicitudes_beneficiarios USING btree (solicitud_id);
CREATE INDEX idx_datos_personales_solicitud ON public.solicitudes_datos_personales USING btree (solicitud_id);
CREATE INDEX idx_solicitudes_datos_personales_nombre_completo ON public.solicitudes_datos_personales USING gin (to_tsvector('spanish'::regconfig, (nombre_completo)::text)) WHERE (nombre_completo IS NOT NULL);
CREATE INDEX idx_documentos_solicitud ON public.solicitudes_documentos USING btree (solicitud_id);
CREATE INDEX idx_solicitudes_domicilios_solicitud ON public.solicitudes_domicilios USING btree (solicitud_id);
CREATE INDEX idx_solicitudes_negocios_solicitud ON public.solicitudes_negocios USING btree (solicitud_id);
CREATE INDEX idx_referencias_solicitud ON public.solicitudes_referencias USING btree (solicitud_id);
CREATE INDEX idx_validaciones_solicitud ON public.solicitudes_validaciones USING btree (solicitud_id);
CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);
CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);
CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol_id);
CREATE INDEX idx_usuarios_sucursal ON public.usuarios USING btree (sucursal_id);
CREATE UNIQUE INDEX ux_usuarios_abreviatura_ci ON public.usuarios USING btree (upper((abreviatura)::text)) WHERE (abreviatura IS NOT NULL);
CREATE INDEX ix_verificacion_entrevista_desacuerdos_integrante ON public.verificacion_entrevista_desacuerdos_montos USING btree (entrevista_id, integrante_objetivo_id, created_at DESC);
CREATE INDEX ix_verificacion_entrevista_evidencia_integrantes_consulta ON public.verificacion_entrevista_evidencia_integrantes USING btree (integrante_id, created_at, evidencia_id);
CREATE INDEX ix_verificacion_entrevista_evidencia_integrante_fecha ON public.verificacion_entrevista_evidencias USING btree (integrante_id, created_at);
CREATE INDEX ix_verificacion_entrevista_evidencias_motivo_clasificacion ON public.verificacion_entrevista_evidencias USING btree (motivo_clasificacion_id) WHERE (motivo_clasificacion_id IS NOT NULL);
CREATE UNIQUE INDEX ux_verificacion_entrevista_evidencia_actor_idempotencia ON public.verificacion_entrevista_evidencias USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_entrevista_familiares_integrante ON public.verificacion_entrevista_familiares USING btree (entrevista_id, familiar_integrante_id, created_at DESC);
CREATE INDEX ix_verificacion_entrevista_telefono_integrante_tipo_fecha ON public.verificacion_entrevista_telefono_confirmaciones USING btree (integrante_id, tipo_telefono, created_at DESC);
CREATE INDEX ix_verificacion_entrevistas_expediente ON public.verificacion_entrevistas USING btree (expediente_id, updated_at DESC);
CREATE INDEX ix_verificacion_imagenes_domicilio_integrante_tipo_fecha ON public.verificacion_imagenes_domicilio USING btree (integrante_id, tipo, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_imagenes_domicilio_actor_idempotencia ON public.verificacion_imagenes_domicilio USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_llamada_caracteristicas_encuesta ON public.verificacion_llamada_caracteristicas USING btree (encuesta_id);
CREATE INDEX ix_verificacion_llamada_encuestas_completada ON public.verificacion_llamada_encuestas USING btree (completada_at DESC) WHERE (completada_at IS NOT NULL);
CREATE INDEX ix_verificacion_llamada_evidencias_llamada_fecha ON public.verificacion_llamada_evidencias USING btree (llamada_id, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_llamada_evidencias_version ON public.verificacion_llamada_evidencias USING btree (llamada_id, proposito, version);
CREATE INDEX ix_verificacion_llamadas_integrante_fecha ON public.verificacion_llamadas USING btree (integrante_id, created_at DESC);
CREATE INDEX ix_verificacion_llamadas_integrante_tipo_telefono_fecha ON public.verificacion_llamadas USING btree (integrante_id, tipo_telefono, created_at DESC) WHERE (telefono IS NOT NULL);
CREATE UNIQUE INDEX ux_verificacion_llamadas_actor_idempotencia ON public.verificacion_llamadas USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_medidor_luz_integrante_fecha ON public.verificacion_medidor_luz_respuestas USING btree (integrante_id, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_medidor_luz_actor_idempotencia ON public.verificacion_medidor_luz_respuestas USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_visita_vecino_evidencias_visita_fecha ON public.verificacion_visita_vecino_evidencias USING btree (visita_id, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_visita_vecino_evidencias_actor_idempotencia ON public.verificacion_visita_vecino_evidencias USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_visita_vecino_fachadas_integrante_fecha ON public.verificacion_visita_vecino_fachadas USING btree (integrante_id, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_visita_vecino_fachadas_actor_idempotencia ON public.verificacion_visita_vecino_fachadas USING btree (registrada_por, idempotency_key);
CREATE INDEX ix_verificacion_visita_vecino_opciones_opcion ON public.verificacion_visita_vecino_opciones USING btree (opcion_id);
CREATE INDEX ix_verificacion_visitas_vecino_fachada ON public.verificacion_visitas_vecino USING btree (fachada_id) WHERE (fachada_id IS NOT NULL);
CREATE INDEX ix_verificacion_visitas_vecino_integrante_fecha ON public.verificacion_visitas_vecino USING btree (integrante_id, created_at DESC);
CREATE UNIQUE INDEX ux_verificacion_visitas_vecino_actor_idempotencia ON public.verificacion_visitas_vecino USING btree (registrada_por, idempotency_key);

-- Foreign Keys
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE caja_movimientos ADD CONSTRAINT caja_movimientos_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
ALTER TABLE calendario_pagos ADD CONSTRAINT calendario_pagos_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_asesora_id_fkey
  FOREIGN KEY (asesora_id) REFERENCES empleados(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_grupo_id_fkey
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_tesorera_id_fkey
  FOREIGN KEY (tesorera_id) REFERENCES personas(id);
ALTER TABLE ciclos ADD CONSTRAINT fk_ciclos_expediente_grupo
  FOREIGN KEY (expediente_id, grupo_id) REFERENCES expedientes(id, grupo_id) ON DELETE RESTRICT;
ALTER TABLE creditos ADD CONSTRAINT creditos_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);
ALTER TABLE creditos ADD CONSTRAINT creditos_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
ALTER TABLE creditos ADD CONSTRAINT fk_creditos_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE RESTRICT;
ALTER TABLE empleados ADD CONSTRAINT asesoras_zona_id_fkey
  FOREIGN KEY (zona_id) REFERENCES zonas(id);
ALTER TABLE empleados ADD CONSTRAINT fk_empleados_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE empleados_contacto ADD CONSTRAINT fk_contacto_empleado
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE;
ALTER TABLE empleados_datos_laborales ADD CONSTRAINT fk_laboral_empleado
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE;
ALTER TABLE empleados_datos_laborales ADD CONSTRAINT fk_laboral_jefe
  FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE empleados_datos_laborales ADD CONSTRAINT fk_laboral_sucursal
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;
ALTER TABLE empleados_documentos ADD CONSTRAINT fk_documento_empleado
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE;
ALTER TABLE empleados_domicilios ADD CONSTRAINT fk_domicilio_empleado
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE;
ALTER TABLE expedientes ADD CONSTRAINT FK_aca6e52d776906c1c5eb57dd6c7
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_asesora_id_fkey
  FOREIGN KEY (asesora_id) REFERENCES empleados(id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_producto_id_fkey
  FOREIGN KEY (producto_id) REFERENCES productos_credito(id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_tesorera_integrante_fkey
  FOREIGN KEY (id, tesorera_integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE expedientes ADD CONSTRAINT fk_expedientes_ciclo_historico_grupo
  FOREIGN KEY (ciclo_historico_origen_id, grupo_id) REFERENCES historial_grupos_ciclos(id, grupo_id) ON DELETE RESTRICT;
ALTER TABLE expedientes ADD CONSTRAINT fk_expedientes_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE expedientes ADD CONSTRAINT fk_expedientes_importacion_integrantes
  FOREIGN KEY (importacion_integrantes_id) REFERENCES importaciones_excel(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras ADD CONSTRAINT fk_financieras_competidoras_created_by
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT fk_financieras_sucursales_version
  FOREIGN KEY (version_id) REFERENCES financieras_competidoras_versiones(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT fk_financieras_competidoras_version_decidida_por
  FOREIGN KEY (decidida_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT fk_financieras_competidoras_version_financiera
  FOREIGN KEY (financiera_id) REFERENCES financieras_competidoras(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT fk_financieras_competidoras_version_propuesta_por
  FOREIGN KEY (propuesta_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT fk_financieras_competidoras_version_publicada_por
  FOREIGN KEY (publicada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE grupos ADD CONSTRAINT fk_grupos_created_by
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE grupos ADD CONSTRAINT grupos_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
ALTER TABLE grupos ADD CONSTRAINT grupos_zona_id_fkey
  FOREIGN KEY (zona_id) REFERENCES zonas(id);
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT fk_historial_grupos_ciclos_asesora
  FOREIGN KEY (asesora_id) REFERENCES empleados(id) ON DELETE RESTRICT;
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT fk_historial_grupos_ciclos_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT;
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT fk_historial_grupos_ciclos_importacion
  FOREIGN KEY (importacion_id) REFERENCES importaciones_excel(id) ON DELETE RESTRICT;
ALTER TABLE historial_grupos_ciclos_semanas ADD CONSTRAINT fk_historial_grupos_ciclos_semanas_ciclo
  FOREIGN KEY (ciclo_historico_id) REFERENCES historial_grupos_ciclos(id) ON DELETE RESTRICT;
ALTER TABLE importaciones_excel ADD CONSTRAINT fk_importaciones_excel_usuario
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE integrantes ADD CONSTRAINT FK_2ce578059a16ac9921991c307b1
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_retirada_por_fkey
  FOREIGN KEY (retirada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE mora ADD CONSTRAINT mora_calendario_id_fkey
  FOREIGN KEY (calendario_id) REFERENCES calendario_pagos(id);
ALTER TABLE mora ADD CONSTRAINT mora_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE pagos ADD CONSTRAINT pagos_calendario_id_fkey
  FOREIGN KEY (calendario_id) REFERENCES calendario_pagos(id);
ALTER TABLE pagos ADD CONSTRAINT pagos_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE pagos ADD CONSTRAINT pagos_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
ALTER TABLE parametros_conclusiones_ciclos_credito ADD CONSTRAINT parametros_conclusiones_ciclos_credito_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_conclusiones_concordancia_ficha ADD CONSTRAINT parametros_conclusiones_concordancia_ficha_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_conclusiones_concordancia_prestamo ADD CONSTRAINT parametros_conclusiones_concordancia_prestamo_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_conclusiones_promedio_evidencias ADD CONSTRAINT parametros_conclusiones_promedio_evidencias_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_conclusiones_semana_credito ADD CONSTRAINT parametros_conclusiones_semana_credito_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_conclusiones_tolerancia_semana_desembolso ADD CONSTRAINT parametros_conclusiones_tolerancia_semana_desem_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT parametros_entrevista_opciones_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT parametros_entrevista_opciones_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_verificacion_cierre_grupo_versiones ADD CONSTRAINT parametros_verificacion_cierre_grupo_version_publicada_por_fkey
  FOREIGN KEY (publicada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT parametros_verificacion_pasos_reglas_version_id_fkey
  FOREIGN KEY (version_id) REFERENCES parametros_verificacion_pasos_versiones(id) ON DELETE RESTRICT;
ALTER TABLE parametros_verificacion_pasos_versiones ADD CONSTRAINT parametros_verificacion_pasos_versiones_publicada_por_fkey
  FOREIGN KEY (publicada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE reestructuras ADD CONSTRAINT reestructuras_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE solicitudes ADD CONSTRAINT fk_solicitudes_credito
  FOREIGN KEY (credito_id) REFERENCES creditos(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes ADD CONSTRAINT fk_solicitudes_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes ADD CONSTRAINT fk_solicitudes_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes ADD CONSTRAINT fk_solicitudes_integrante
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes ADD CONSTRAINT fk_solicitudes_persona
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes_beneficiarios ADD CONSTRAINT fk_beneficiario_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_datos_personales ADD CONSTRAINT fk_datos_personales_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_documentos ADD CONSTRAINT fk_documentos_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_domicilios ADD CONSTRAINT fk_domicilio_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_domicilios ADD CONSTRAINT fk_solicitudes_domicilios_dom_cp
  FOREIGN KEY (dom_cp_id) REFERENCES codigos_postales(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes_negocios ADD CONSTRAINT fk_negocio_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_negocios ADD CONSTRAINT fk_solicitudes_negocios_negocio_cp
  FOREIGN KEY (negocio_cp_id) REFERENCES codigos_postales(id) ON DELETE RESTRICT;
ALTER TABLE solicitudes_referencias ADD CONSTRAINT fk_referencias_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_validaciones ADD CONSTRAINT fk_validaciones_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT;
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_sucursal
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_desacuerdos_montos ADD CONSTRAINT verificacion_entrevista_desacuerdos_entrevista_fkey
  FOREIGN KEY (entrevista_id, expediente_id) REFERENCES verificacion_entrevistas(id, expediente_id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_desacuerdos_montos ADD CONSTRAINT verificacion_entrevista_desacuerdos_integrante_fkey
  FOREIGN KEY (expediente_id, integrante_objetivo_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_desacuerdos_montos ADD CONSTRAINT verificacion_entrevista_desacuerdos_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT fk_ver_ent_evid_int_calificada_por
  FOREIGN KEY (calificada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT verificacion_entrevista_evidencia_integrantes_actualizada_por_f
  FOREIGN KEY (actualizada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT verificacion_entrevista_evidencia_integrantes_evidencia_fkey
  FOREIGN KEY (evidencia_id, expediente_id) REFERENCES verificacion_entrevista_evidencias(id, expediente_id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT verificacion_entrevista_evidencia_integrantes_integrante_fkey
  FOREIGN KEY (expediente_id, integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT verificacion_entrevista_evidencia_integrantes_usuario_fkey
  FOREIGN KEY (asociada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_expediente_integrante_fkey
  FOREIGN KEY (expediente_id, integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_motivo_color_fkey
  FOREIGN KEY (motivo_clasificacion_id, clasificacion_semaforo) REFERENCES motivos_clasificacion_evidencia(id, clasificacion) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_familiares ADD CONSTRAINT verificacion_entrevista_familiares_entrevista_fkey
  FOREIGN KEY (entrevista_id, expediente_id) REFERENCES verificacion_entrevistas(id, expediente_id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_familiares ADD CONSTRAINT verificacion_entrevista_familiares_integrante_fkey
  FOREIGN KEY (expediente_id, familiar_integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_familiares ADD CONSTRAINT verificacion_entrevista_familiares_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_evidencia_fkey
  FOREIGN KEY (evidencia_id) REFERENCES verificacion_llamada_evidencias(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_llamada_fkey
  FOREIGN KEY (llamada_id) REFERENCES verificacion_llamadas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_actualizada_por_fkey
  FOREIGN KEY (actualizada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_fkey
  FOREIGN KEY (expediente_id, domicilio_recoleccion_integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_entrevistada_por_fkey
  FOREIGN KEY (entrevistada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_integrante_fkey
  FOREIGN KEY (expediente_id, integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_tesorera_reconocida_fkey
  FOREIGN KEY (expediente_id, tesorera_reconocida_integrante_id) REFERENCES integrantes(expediente_id, id) ON DELETE RESTRICT;
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_caracteristicas ADD CONSTRAINT verificacion_llamada_caracteristicas_encuesta_fkey
  FOREIGN KEY (encuesta_id) REFERENCES verificacion_llamada_encuestas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_encuestas ADD CONSTRAINT verificacion_llamada_encuestas_llamada_fkey
  FOREIGN KEY (llamada_id) REFERENCES verificacion_llamadas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_encuestas ADD CONSTRAINT verificacion_llamada_encuestas_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_encuesta_fkey
  FOREIGN KEY (encuesta_id) REFERENCES verificacion_llamada_encuestas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_llamada_fkey
  FOREIGN KEY (llamada_id) REFERENCES verificacion_llamadas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_medidor_luz_respuestas ADD CONSTRAINT verificacion_medidor_luz_respuestas_fachada_fkey
  FOREIGN KEY (fachada_id) REFERENCES verificacion_imagenes_domicilio(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_medidor_luz_respuestas ADD CONSTRAINT verificacion_medidor_luz_respuestas_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_medidor_luz_respuestas ADD CONSTRAINT verificacion_medidor_luz_respuestas_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_visita_fkey
  FOREIGN KEY (visita_id) REFERENCES verificacion_visitas_vecino(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_opciones ADD CONSTRAINT verificacion_visita_vecino_opciones_opcion_fkey
  FOREIGN KEY (opcion_id) REFERENCES parametros_entrevista_opciones(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visita_vecino_opciones ADD CONSTRAINT verificacion_visita_vecino_opciones_visita_fkey
  FOREIGN KEY (visita_id) REFERENCES verificacion_visitas_vecino(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_fachada_fkey
  FOREIGN KEY (fachada_id) REFERENCES verificacion_visita_vecino_fachadas(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_integrante_fkey
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT;
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_usuario_fkey
  FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE zonas ADD CONSTRAINT zonas_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);

-- Check Constraints
ALTER TABLE ciclos ADD CONSTRAINT ck_ciclos_estado CHECK (estado::text = ANY (ARRAY['PLANEADO'::character varying, 'ACTIVO'::character varying, 'EN_CIERRE'::character varying, 'CERRADO'::character varying]::text[]));
ALTER TABLE creditos ADD CONSTRAINT ck_creditos_estado CHECK (estado::text = ANY (ARRAY['BORRADOR'::character varying, 'PREPARADO_DESEMBOLSO'::character varying, 'DESEMBOLSADO'::character varying, 'VIGENTE'::character varying, 'VENCIDO'::character varying, 'LIQUIDADO'::character varying, 'REESTRUCTURADO'::character varying, 'CANCELADO'::character varying]::text[]));
ALTER TABLE expedientes ADD CONSTRAINT ck_expedientes_origen_historico_completo CHECK (ciclo_historico_origen_id IS NULL AND importacion_integrantes_id IS NULL OR ciclo_historico_origen_id IS NOT NULL AND importacion_integrantes_id IS NOT NULL);
ALTER TABLE financieras_competidoras ADD CONSTRAINT ck_financieras_competidoras_nombre CHECK (btrim(nombre_oficial::text) <> ''::text AND btrim(nombre_normalizado::text) <> ''::text);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT ck_financieras_sucursales_direccion CHECK (direccion IS NULL OR btrim(direccion::text) <> ''::text);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT ck_financieras_sucursales_numero_asesoras CHECK (numero_asesoras IS NULL OR numero_asesoras >= 0);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT ck_financieras_sucursales_valor CHECK (valor_sucursal IS NULL OR btrim(valor_sucursal::text) <> ''::text);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT ck_financieras_sucursales_version_orden CHECK (orden >= 1 AND orden <= 10);
ALTER TABLE financieras_competidoras_sucursales_version ADD CONSTRAINT ck_financieras_sucursales_zona CHECK (zona IS NULL OR btrim(zona::text) <> ''::text);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_aliases CHECK (cardinality(aliases) = cardinality(aliases_normalizados));
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_clasificacion CHECK (clasificacion IS NULL OR (clasificacion::text = ANY (ARRAY['OBJETIVO'::character varying, 'REVISION'::character varying, 'NO_PRIORITARIA'::character varying]::text[])));
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_decision CHECK (estado::text = 'PENDIENTE_APROBACION'::text AND decidida_por IS NULL AND decidida_at IS NULL OR (estado::text = ANY (ARRAY['APROBADA'::character varying, 'RECHAZADA'::character varying, 'PUBLICADA'::character varying]::text[])) AND decidida_por IS NOT NULL AND decidida_at IS NOT NULL);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_motivo CHECK (motivo IS NULL OR btrim(motivo::text) <> ''::text);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_publicacion CHECK (estado::text <> 'PUBLICADA'::text AND publicada_por IS NULL AND publicada_at IS NULL OR estado::text = 'PUBLICADA'::text AND publicada_por IS NOT NULL AND publicada_at IS NOT NULL);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_rechazo CHECK (estado::text <> 'RECHAZADA'::text AND motivo_rechazo IS NULL OR estado::text = 'RECHAZADA'::text AND btrim(COALESCE(motivo_rechazo, ''::character varying)::text) <> ''::text);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_revision CHECK (revision > 0);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_version_estado CHECK (estado::text = ANY (ARRAY['PENDIENTE_APROBACION'::character varying, 'APROBADA'::character varying, 'RECHAZADA'::character varying, 'PUBLICADA'::character varying]::text[]));
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_version_nombre CHECK (btrim(nombre_oficial::text) <> ''::text AND btrim(nombre_normalizado::text) <> ''::text);
ALTER TABLE financieras_competidoras_versiones ADD CONSTRAINT ck_financieras_competidoras_vigencia CHECK (vigencia_hasta IS NULL OR vigencia_hasta >= vigencia_desde);
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT ck_historial_grupos_ciclos_numero CHECK (numero_grupo_legacy > 0 AND numero_ciclo > 0);
ALTER TABLE historial_grupos_ciclos ADD CONSTRAINT ck_historial_grupos_ciclos_semanas CHECK (primera_semana > 0 AND ultima_semana >= primera_semana AND total_semanas_registradas > 0);
ALTER TABLE historial_grupos_ciclos_semanas ADD CONSTRAINT ck_historial_grupos_ciclos_semanas_semana CHECK (semana > 0);
ALTER TABLE importaciones_excel ADD CONSTRAINT ck_importaciones_excel_estado CHECK (estado::text = ANY (ARRAY['VALIDADO'::character varying, 'CARGADO'::character varying, 'ACTIVO'::character varying, 'RECHAZADO'::character varying]::text[]));
ALTER TABLE importaciones_excel ADD CONSTRAINT ck_importaciones_excel_semana CHECK (semana_corte > 0);
ALTER TABLE importaciones_excel ADD CONSTRAINT ck_importaciones_excel_tipo CHECK (tipo_fuente::text = ANY (ARRAY['HISTORIAL_GRUPOS'::character varying, 'HISTORIAL_INTEGRANTES'::character varying]::text[]));
ALTER TABLE integrantes ADD CONSTRAINT integrantes_motivo_retiro_check CHECK (motivo_retiro IS NULL OR (motivo_retiro::text = ANY (ARRAY['DESCANSA_RENOVACION'::character varying, 'DOCUMENTACION_INCOMPLETA'::character varying, 'DECIDIO_NO_CONTINUAR'::character varying, 'OTRO'::character varying]::text[])));
ALTER TABLE integrantes ADD CONSTRAINT integrantes_retiro_contexto_check CHECK (estado::text = 'RETIRADA'::text AND motivo_retiro IS NOT NULL AND retirada_at IS NOT NULL AND retirada_por IS NOT NULL AND (motivo_retiro::text = 'OTRO'::text AND NULLIF(btrim(motivo_retiro_detalle::text), ''::text) IS NOT NULL OR motivo_retiro::text <> 'OTRO'::text AND motivo_retiro_detalle IS NULL) OR estado::text <> 'RETIRADA'::text AND motivo_retiro IS NULL AND motivo_retiro_detalle IS NULL AND retirada_at IS NULL AND retirada_por IS NULL);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT chk_motivos_clasificacion_evidencia_orden CHECK (orden >= 1);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_clasificacion_check CHECK (clasificacion::text = ANY (ARRAY['VERDE'::character varying, 'AMARILLO'::character varying, 'ROJO'::character varying]::text[]));
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_concepto_check CHECK (char_length(btrim(concepto::text)) >= 2 AND char_length(btrim(concepto::text)) <= 120);
ALTER TABLE motivos_clasificacion_evidencia ADD CONSTRAINT motivos_clasificacion_evidencia_concepto_normalizado_check CHECK (char_length(btrim(concepto_normalizado::text)) >= 2 AND char_length(btrim(concepto_normalizado::text)) <= 120);
ALTER TABLE pagos ADD CONSTRAINT ck_pagos_estado CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'APLICADO'::character varying, 'PARCIAL'::character varying, 'VENCIDO'::character varying, 'REVERSADO'::character varying]::text[]));
ALTER TABLE parametros_conclusiones_ciclos_credito ADD CONSTRAINT chk_parametros_conclusiones_ciclos_limites CHECK (verde_desde >= 1 AND verde_desde <= 40 AND verde_hasta >= 1 AND verde_hasta <= 40 AND amarillo_desde >= 1 AND amarillo_desde <= 40 AND amarillo_hasta >= 1 AND amarillo_hasta <= 40 AND rojo_desde >= 1 AND rojo_desde <= 40 AND rojo_hasta >= 1 AND rojo_hasta <= 40);
ALTER TABLE parametros_conclusiones_ciclos_credito ADD CONSTRAINT chk_parametros_conclusiones_ciclos_sin_traslapes CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_ciclos_credito ADD CONSTRAINT chk_parametros_conclusiones_ciclos_unico CHECK (id = 1);
ALTER TABLE parametros_conclusiones_concordancia_ficha ADD CONSTRAINT chk_par_con_concordancia_ficha_limites CHECK (verde_desde >= 0 AND verde_desde <= 100 AND verde_hasta >= 0 AND verde_hasta <= 100 AND amarillo_desde >= 0 AND amarillo_desde <= 100 AND amarillo_hasta >= 0 AND amarillo_hasta <= 100 AND rojo_desde >= 0 AND rojo_desde <= 100 AND rojo_hasta >= 0 AND rojo_hasta <= 100);
ALTER TABLE parametros_conclusiones_concordancia_ficha ADD CONSTRAINT chk_par_con_concordancia_ficha_rangos CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_concordancia_ficha ADD CONSTRAINT chk_par_con_concordancia_ficha_unico CHECK (id = 1);
ALTER TABLE parametros_conclusiones_concordancia_prestamo ADD CONSTRAINT chk_par_con_concordancia_prestamo_limites CHECK (verde_desde >= 0 AND verde_desde <= 100 AND verde_hasta >= 0 AND verde_hasta <= 100 AND amarillo_desde >= 0 AND amarillo_desde <= 100 AND amarillo_hasta >= 0 AND amarillo_hasta <= 100 AND rojo_desde >= 0 AND rojo_desde <= 100 AND rojo_hasta >= 0 AND rojo_hasta <= 100);
ALTER TABLE parametros_conclusiones_concordancia_prestamo ADD CONSTRAINT chk_par_con_concordancia_prestamo_rangos CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_concordancia_prestamo ADD CONSTRAINT chk_par_con_concordancia_prestamo_unico CHECK (id = 1);
ALTER TABLE parametros_conclusiones_promedio_evidencias ADD CONSTRAINT chk_par_con_promedio_evidencias_limites CHECK (verde_desde >= 0 AND verde_desde <= 100 AND verde_hasta >= 0 AND verde_hasta <= 100 AND amarillo_desde >= 0 AND amarillo_desde <= 100 AND amarillo_hasta >= 0 AND amarillo_hasta <= 100 AND rojo_desde >= 0 AND rojo_desde <= 100 AND rojo_hasta >= 0 AND rojo_hasta <= 100);
ALTER TABLE parametros_conclusiones_promedio_evidencias ADD CONSTRAINT chk_par_con_promedio_evidencias_rangos CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_promedio_evidencias ADD CONSTRAINT chk_par_con_promedio_evidencias_unico CHECK (id = 1);
ALTER TABLE parametros_conclusiones_semana_credito ADD CONSTRAINT chk_parametros_conclusiones_semana_limites CHECK (verde_desde >= 1 AND verde_desde <= 16 AND verde_hasta >= 1 AND verde_hasta <= 16 AND amarillo_desde >= 1 AND amarillo_desde <= 16 AND amarillo_hasta >= 1 AND amarillo_hasta <= 16 AND rojo_desde >= 1 AND rojo_desde <= 16 AND rojo_hasta >= 1 AND rojo_hasta <= 16);
ALTER TABLE parametros_conclusiones_semana_credito ADD CONSTRAINT chk_parametros_conclusiones_semana_sin_traslapes CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_semana_credito ADD CONSTRAINT chk_parametros_conclusiones_semana_unica CHECK (id = 1);
ALTER TABLE parametros_conclusiones_tolerancia_semana_desembolso ADD CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_limites CHECK (verde_desde >= 0 AND verde_desde <= 10 AND verde_hasta >= 0 AND verde_hasta <= 10 AND amarillo_desde >= 0 AND amarillo_desde <= 10 AND amarillo_hasta >= 0 AND amarillo_hasta <= 10 AND rojo_desde >= 0 AND rojo_desde <= 10 AND rojo_hasta >= 0 AND rojo_hasta <= 10);
ALTER TABLE parametros_conclusiones_tolerancia_semana_desembolso ADD CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_sin_traslapes CHECK (verde_desde <= verde_hasta AND amarillo_desde <= amarillo_hasta AND rojo_desde <= rojo_hasta AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde) AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde) AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde));
ALTER TABLE parametros_conclusiones_tolerancia_semana_desembolso ADD CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_unico CHECK (id = 1);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT chk_parametros_entrevista_codigo CHECK (btrim(codigo::text) <> ''::text);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT chk_parametros_entrevista_etiqueta CHECK (char_length(btrim(etiqueta::text)) >= 1);
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT chk_parametros_entrevista_familia CHECK (familia::text = ANY (ARRAY['COMO_CONOCIO_ASESORA'::character varying, 'ANTIGUEDAD_CONOCE_GRUPO'::character varying, 'MOTIVO_DESACUERDO_MONTOS'::character varying, 'MOTIVO_NO_RENOVACION'::character varying, 'MOTIVO_NO_VIVE_DOMICILIO'::character varying, 'TIPO_DOMICILIO'::character varying, 'FAMILIAR_DOMICILIO'::character varying, 'ANTIGUEDAD_DOMICILIO'::character varying, 'PERSONAS_VIVEN_CASA'::character varying, 'CONVIVIENTES'::character varying, 'FUENTES_INGRESO'::character varying, 'ANTIGUEDAD_LABORAL'::character varying, 'MOTIVO_SIN_CONTROL_PAGOS'::character varying, 'FRECUENCIA_SERVICIO'::character varying, 'CALIFICACION_SERVICIO'::character varying, 'RAPIDEZ_DESEMBOLSO'::character varying, 'MOTIVO_RECOMENDACION_SI'::character varying, 'MOTIVO_RECOMENDACION_NO'::character varying, 'VISITA_VECINO_RESPUESTA_SI'::character varying, 'VISITA_VECINO_RESPUESTA_NO'::character varying]::text[]));
ALTER TABLE parametros_entrevista_opciones ADD CONSTRAINT chk_parametros_entrevista_orden CHECK (orden >= 1);
ALTER TABLE parametros_verificacion_cierre_grupo_versiones ADD CONSTRAINT chk_parametros_verificacion_cierre_integrantes CHECK (integrantes_verificadas_requeridas >= 0 AND integrantes_verificadas_requeridas <= 12);
ALTER TABLE parametros_verificacion_cierre_grupo_versiones ADD CONSTRAINT chk_parametros_verificacion_cierre_revision CHECK (revision > 0);
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT chk_parametros_verificacion_paso CHECK (paso::text = ANY (ARRAY['DOCUMENTOS'::character varying, 'LLAMADA'::character varying, 'VISITA_VECINO'::character varying, 'IMAGENES_DOMICILIO'::character varying, 'ENTREVISTA'::character varying, 'CONCLUSIONES'::character varying]::text[]));
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT chk_parametros_verificacion_pasos_compatibilidad CHECK (obligatorio = (modalidad::text = 'OBLIGATORIO'::text));
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT chk_parametros_verificacion_pasos_dias CHECK (modalidad::text = 'OBLIGATORIO_DESPUES_DIAS'::text AND dias_para_obligatorio >= 1 AND dias_para_obligatorio <= 3650 OR modalidad::text <> 'OBLIGATORIO_DESPUES_DIAS'::text AND dias_para_obligatorio IS NULL);
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT chk_parametros_verificacion_pasos_modalidad CHECK (modalidad::text = ANY (ARRAY['OBLIGATORIO'::character varying, 'OPCIONAL'::character varying, 'OBLIGATORIO_DESPUES_DIAS'::character varying]::text[]));
ALTER TABLE parametros_verificacion_pasos_reglas ADD CONSTRAINT chk_parametros_verificacion_tipo_integrante CHECK (tipo_integrante::text = ANY (ARRAY['NUEVA'::character varying, 'NUEVA_CON_EVIDENCIA'::character varying, 'CICLO_2_MAS'::character varying, 'CICLO_2_MAS_CON_EVIDENCIA'::character varying]::text[]));
ALTER TABLE parametros_verificacion_pasos_versiones ADD CONSTRAINT chk_parametros_verificacion_pasos_revision CHECK (revision > 0);
ALTER TABLE personas ADD CONSTRAINT ck_personas_estado CHECK (estado::text = ANY (ARRAY['ACTIVA'::character varying, 'INACTIVA'::character varying, 'BLOQUEADA'::character varying, 'DEPURADA_LOGICA'::character varying]::text[]));
ALTER TABLE productos_credito ADD CONSTRAINT ck_productos_credito_estado CHECK (estado::text = ANY (ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying, 'SUSPENDIDO'::character varying]::text[]));
ALTER TABLE roles ADD CONSTRAINT ck_roles_estado CHECK (estado::text = ANY (ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying]::text[]));
ALTER TABLE roles ADD CONSTRAINT roles_permisos_capacidades_formato_check CHECK (permisos IS NULL OR NOT permisos ? 'capacidades'::text OR jsonb_typeof(permisos -> 'capacidades'::text) = 'array'::text AND NOT jsonb_path_exists(permisos, '$."capacidades"[*]?(@.type() != "string")'::jsonpath));
ALTER TABLE roles ADD CONSTRAINT roles_permisos_formato_check CHECK (permisos IS NULL OR jsonb_typeof(permisos) = 'object'::text AND jsonb_typeof(permisos -> 'modulos'::text) = 'array'::text AND jsonb_typeof(permisos -> 'acciones'::text) = 'array'::text AND NOT jsonb_path_exists(permisos, '$."modulos"[*]?(@.type() != "string")'::jsonpath) AND NOT jsonb_path_exists(permisos, '$."acciones"[*]?(@.type() != "string")'::jsonpath));
ALTER TABLE schema_migrations ADD CONSTRAINT ck_schema_migrations_checksum CHECK (checksum ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE schema_migrations ADD CONSTRAINT ck_schema_migrations_execution_ms CHECK (execution_ms IS NULL OR execution_ms >= 0);
ALTER TABLE schema_migrations ADD CONSTRAINT ck_schema_migrations_source CHECK (source::text = ANY (ARRAY['MIGRATION'::character varying, 'BASELINE'::character varying]::text[]));
ALTER TABLE solicitudes_domicilios ADD CONSTRAINT solicitudes_domicilios_coordenadas_pareadas CHECK (dom_latitud IS NULL AND dom_longitud IS NULL OR dom_latitud IS NOT NULL AND dom_longitud IS NOT NULL AND dom_latitud >= '-90'::integer::numeric AND dom_latitud <= 90::numeric AND dom_longitud >= '-180'::integer::numeric AND dom_longitud <= 180::numeric);
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_estado CHECK (estado::text = ANY (ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying, 'SUSPENDIDO'::character varying, 'BLOQUEADO'::character varying]::text[]));
ALTER TABLE usuarios ADD CONSTRAINT usuarios_permisos_capacidades_formato_check CHECK (permisos_personalizados IS NULL OR NOT permisos_personalizados ? 'capacidades'::text OR jsonb_typeof(permisos_personalizados -> 'capacidades'::text) = 'array'::text AND NOT jsonb_path_exists(permisos_personalizados, '$."capacidades"[*]?(@.type() != "string")'::jsonpath));
ALTER TABLE usuarios ADD CONSTRAINT usuarios_permisos_personalizados_elementos_check CHECK (permisos_personalizados IS NULL OR NOT jsonb_path_exists(permisos_personalizados, '$."modulos"[*]?(@.type() != "string")'::jsonpath) AND NOT jsonb_path_exists(permisos_personalizados, '$."acciones"[*]?(@.type() != "string")'::jsonpath));
ALTER TABLE usuarios ADD CONSTRAINT usuarios_permisos_personalizados_formato_check CHECK (permisos_personalizados IS NULL OR jsonb_typeof(permisos_personalizados) = 'object'::text AND jsonb_typeof(permisos_personalizados -> 'modulos'::text) = 'array'::text AND jsonb_typeof(permisos_personalizados -> 'acciones'::text) = 'array'::text);
ALTER TABLE verificacion_entrevista_desacuerdos_montos ADD CONSTRAINT verificacion_entrevista_desacuerdos_motivo_check CHECK (activo = true AND NULLIF(btrim(motivo::text), ''::text) IS NOT NULL OR activo = false AND motivo IS NULL);
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT chk_ver_ent_evid_int_calificacion CHECK (calificacion_revision IS NULL OR (calificacion_revision::text = ANY (ARRAY['TACHA'::character varying, 'AMARILLO'::character varying, 'PALOMITA'::character varying]::text[])));
ALTER TABLE verificacion_entrevista_evidencia_integrantes ADD CONSTRAINT chk_ver_ent_evid_int_calificacion_actor CHECK (calificacion_revision IS NULL AND calificada_por IS NULL AND calificada_at IS NULL OR calificacion_revision IS NOT NULL AND calificada_por IS NOT NULL AND calificada_at IS NOT NULL);
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_clasificacion_semaforo_check CHECK (clasificacion_semaforo IS NULL OR (tipo::text = ANY (ARRAY['HISTORIAL_CREDITO_ACTIVO'::character varying, 'HISTORIAL_CREDITO_INACTIVO'::character varying]::text[])) AND (clasificacion_semaforo::text = ANY (ARRAY['VERDE'::character varying, 'AMARILLO'::character varying, 'ROJO'::character varying]::text[])));
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_fuente_check CHECK (captura_fuente::text = ANY (ARRAY['GALERIA'::character varying, 'CAMARA'::character varying]::text[]));
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_motivo_tipo_check CHECK (motivo_clasificacion_id IS NULL OR (tipo::text = ANY (ARRAY['HISTORIAL_CREDITO_ACTIVO'::character varying, 'HISTORIAL_CREDITO_INACTIVO'::character varying]::text[])));
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_nuevas_con_motivo_check CHECK ((tipo::text <> ALL (ARRAY['HISTORIAL_CREDITO_ACTIVO'::character varying, 'HISTORIAL_CREDITO_INACTIVO'::character varying]::text[])) OR clasificacion_semaforo IS NOT NULL AND motivo_clasificacion_id IS NOT NULL) NOT VALID;
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_tipo_check CHECK (tipo::text = ANY (ARRAY['NEGOCIO'::character varying, 'HISTORIAL_CREDITO_ACTIVO'::character varying, 'HISTORIAL_CREDITO_INACTIVO'::character varying, 'CONTROL_PAGOS'::character varying, 'FOLLETO_PREMIO_TESORERA'::character varying]::text[]));
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_evidencias_ubicacion_check CHECK (legado_sin_ubicacion = true OR captura_fuente::text = 'CAMARA'::text AND foto_capturada_at IS NOT NULL AND ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric AND (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric) AND ubicacion_capturada_at IS NOT NULL AND ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_entrevista_evidencias ADD CONSTRAINT verificacion_entrevista_negocio_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_numero_check CHECK (telefono::text ~ '^[0-9]{10}$'::text);
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_entrevista_telefono_confirmaciones ADD CONSTRAINT verificacion_entrevista_telefono_tipo_check CHECK (tipo_telefono::text = ANY (ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying]::text[]));
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_condicionales_check CHECK ((conoce_asesora IS DISTINCT FROM false OR como_conocio_asesora IS NULL) AND (conoce_integrantes IS DISTINCT FROM false OR tiempo_conoce_integrantes IS NULL) AND (tiene_otro_credito_grupal IS DISTINCT FROM false OR financiera_credito_grupal IS NULL AND credito_grupal_anterior_activo IS NULL AND valor_ficha_credito_grupal IS NULL AND semana_actual_credito_grupal IS NULL AND mes_desembolso_credito_grupal IS NULL AND mes_ultimo_pago_credito_grupal IS NULL AND anio_ultimo_pago_credito_grupal IS NULL AND numero_ciclos_credito_grupal IS NULL AND tasa_credito_grupal IS NULL AND nombre_asesora_credito_grupal IS NULL AND telefono_asesora_credito_grupal IS NULL AND motivo_no_renovacion_credito_grupal IS NULL) AND (vive_en_domicilio IS DISTINCT FROM true OR motivo_no_vive_domicilio IS NULL) AND (tipo_domicilio::text = 'FAMILIAR'::text OR familiar_domicilio IS NULL) AND (otro_ingreso_hogar IS DISTINCT FROM false OR otro_ingreso_semanal IS NULL) AND (('SUELDO'::text = ANY (fuentes_ingreso::text[])) OR sueldo_semanal IS NULL AND lugar_trabajo IS NULL AND antiguedad_laboral IS NULL) AND (('NEGOCIO'::text = ANY (fuentes_ingreso::text[])) OR tipo_negocio IS NULL AND ingreso_libre_semanal_negocio IS NULL AND ubicacion_negocio IS NULL) AND (tiene_control_pagos IS DISTINCT FROM true OR motivo_sin_control_pagos IS NULL));
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_convivientes_check CHECK (convivientes <@ ARRAY['CONYUGE'::character varying, 'HIJOS'::character varying, 'PADRES'::character varying, 'HERMANOS'::character varying, 'OTROS'::character varying]);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_credito_externo_rangos_check CHECK ((semana_actual_credito_grupal IS NULL OR semana_actual_credito_grupal >= 1 AND semana_actual_credito_grupal <= 16) AND (mes_desembolso_credito_grupal IS NULL OR mes_desembolso_credito_grupal >= 1 AND mes_desembolso_credito_grupal <= 12) AND (mes_ultimo_pago_credito_grupal IS NULL OR mes_ultimo_pago_credito_grupal >= 1 AND mes_ultimo_pago_credito_grupal <= 12) AND (anio_ultimo_pago_credito_grupal IS NULL OR anio_ultimo_pago_credito_grupal >= 1900 AND anio_ultimo_pago_credito_grupal <= 2200) AND (numero_ciclos_credito_grupal IS NULL OR numero_ciclos_credito_grupal >= 1 AND numero_ciclos_credito_grupal <= 40) AND (tasa_credito_grupal IS NULL OR tasa_credito_grupal >= 65 AND tasa_credito_grupal <= 100));
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_check CHECK (NOT (domicilio_recoleccion_integrante_id IS NOT NULL AND desconoce_domicilio_recoleccion IS TRUE));
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_fuentes_ingreso_check CHECK (fuentes_ingreso <@ ARRAY['SUELDO'::character varying, 'NEGOCIO'::character varying]);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_importes_check CHECK ((valor_ficha_credito_grupal IS NULL OR valor_ficha_credito_grupal >= 0::numeric) AND (otro_ingreso_semanal IS NULL OR otro_ingreso_semanal >= 0::numeric) AND (capacidad_pago_semanal IS NULL OR capacidad_pago_semanal >= 0::numeric) AND (sueldo_semanal IS NULL OR sueldo_semanal >= 0::numeric) AND (ingreso_libre_semanal_negocio IS NULL OR ingreso_libre_semanal_negocio >= 0::numeric));
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_monto_ultimo_prestamo_check CHECK (monto_ultimo_prestamo_credito_grupal IS NULL OR monto_ultimo_prestamo_credito_grupal >= 0::numeric);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_revision_check CHECK (revision > 0);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_telefono_asesora_check CHECK (telefono_asesora_credito_grupal IS NULL OR telefono_asesora_credito_grupal::text ~ '^[0-9]{10}$'::text);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_tesorera_consistencia_check CHECK (conoce_tesorera IS DISTINCT FROM false OR tesorera_reconocida_integrante_id IS NULL);
ALTER TABLE verificacion_entrevistas ADD CONSTRAINT verificacion_entrevistas_ultimo_prestamo_cond_check CHECK (tiene_otro_credito_grupal IS DISTINCT FROM false OR monto_ultimo_prestamo_credito_grupal IS NULL);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_captura_fuente_check CHECK (captura_fuente::text = 'CAMARA'::text);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_tipo_check CHECK (tipo::text = ANY (ARRAY['NOMENCLATURAS_CALLES'::character varying, 'FACHADA'::character varying, 'MEDIDOR_LUZ'::character varying, 'FACHADA_CON_INTEGRANTE'::character varying]::text[]));
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_ubicacion_fuente_check CHECK (ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_ubicacion_precision CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric);
ALTER TABLE verificacion_imagenes_domicilio ADD CONSTRAINT verificacion_imagenes_domicilio_ubicacion_rango CHECK (ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric);
ALTER TABLE verificacion_llamada_caracteristicas ADD CONSTRAINT verificacion_llamada_caracteristicas_clave_check CHECK (clave::text = ANY (ARRAY['NUMERO_PLANTAS'::character varying, 'COLOR_DOMICILIO'::character varying, 'COCHERA_ENTRADA'::character varying, 'BANQUETA_FRENTE'::character varying, 'OBJETO_VISIBLE'::character varying, 'REFERENCIA_EXTERIOR'::character varying]::text[]));
ALTER TABLE verificacion_llamada_encuestas ADD CONSTRAINT verificacion_llamada_encuestas_accion_check CHECK (accion_posterior::text = ANY (ARRAY['AGENDO_VISITA'::character varying, 'ENTREVISTA_CORTA'::character varying, 'ENTREVISTA_LARGA'::character varying, 'LLAMAR_MAS_TARDE'::character varying]::text[]));
ALTER TABLE verificacion_llamada_encuestas ADD CONSTRAINT verificacion_llamada_encuestas_completada_check CHECK (completada_at IS NULL OR (accion_posterior::text = ANY (ARRAY['AGENDO_VISITA'::character varying, 'ENTREVISTA_CORTA'::character varying, 'ENTREVISTA_LARGA'::character varying]::text[])));
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_contexto_check CHECK (proposito::text = 'ENCUESTA'::text AND encuesta_id IS NOT NULL AND tipo_telefono IS NULL AND telefono IS NULL OR proposito::text = 'CONFIRMACION_TELEFONO'::text AND encuesta_id IS NULL AND tipo_telefono IS NOT NULL AND telefono IS NOT NULL);
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_proposito_check CHECK (proposito::text = ANY (ARRAY['ENCUESTA'::character varying, 'CONFIRMACION_TELEFONO'::character varying]::text[]));
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_telefono_check CHECK (telefono IS NULL OR telefono::text ~ '^[0-9]{10}$'::text);
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_tipo_check CHECK (tipo_telefono IS NULL OR (tipo_telefono::text = ANY (ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying]::text[])));
ALTER TABLE verificacion_llamada_evidencias ADD CONSTRAINT verificacion_llamada_evidencias_version_check CHECK (version > 0);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_canal_check CHECK (canal::text = ANY (ARRAY['TELEFONICA'::character varying, 'WHATSAPP'::character varying]::text[]));
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_resultado_check CHECK (resultado::text = ANY (ARRAY['CONTESTADA'::character varying, 'NO_CONTESTADA'::character varying]::text[]));
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_telefono_check CHECK (telefono IS NULL OR telefono::text ~ '^[0-9]{10}$'::text);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_telefono_par_check CHECK ((tipo_telefono IS NULL) = (telefono IS NULL));
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_tipo_telefono_check CHECK (tipo_telefono IS NULL OR (tipo_telefono::text = ANY (ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying]::text[])));
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_ubicacion_completa CHECK (ubicacion_latitud IS NULL AND ubicacion_longitud IS NULL AND ubicacion_precision_metros IS NULL AND ubicacion_capturada_at IS NULL AND ubicacion_fuente IS NULL OR ubicacion_latitud IS NOT NULL AND ubicacion_longitud IS NOT NULL AND ubicacion_capturada_at IS NOT NULL AND ubicacion_fuente IS NOT NULL);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_ubicacion_fuente_check CHECK (ubicacion_fuente IS NULL OR ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_ubicacion_precision CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric);
ALTER TABLE verificacion_llamadas ADD CONSTRAINT verificacion_llamadas_ubicacion_rango CHECK (ubicacion_latitud IS NULL OR ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric);
ALTER TABLE verificacion_medidor_luz_respuestas ADD CONSTRAINT verificacion_medidor_luz_respuestas_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_medidor_luz_respuestas ADD CONSTRAINT verificacion_medidor_luz_respuestas_motivo_check CHECK (tiene_medidor = true AND motivo IS NULL OR tiene_medidor = false AND (motivo::text = ANY (ARRAY['SIN_SERVICIO_ELECTRICO'::character varying, 'SERVICIO_COMPARTIDO'::character varying, 'MEDIDOR_EN_OTRO_DOMICILIO'::character varying, 'MEDIDOR_RETIRADO_O_PENDIENTE'::character varying, 'UBICACION_DESCONOCIDA'::character varying]::text[])));
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_captura_fuente_check CHECK (captura_fuente::text = 'CAMARA'::text);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_fuente_check CHECK (ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_precision CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric);
ALTER TABLE verificacion_visita_vecino_evidencias ADD CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_rango CHECK (ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_captura_fuente_check CHECK (captura_fuente::text = 'CAMARA'::text);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_mime_check CHECK (mime_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying]::text[]));
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_fuente_check CHECK (ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_precision CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric);
ALTER TABLE verificacion_visita_vecino_fachadas ADD CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_rango CHECK (ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric);
ALTER TABLE verificacion_visita_vecino_opciones ADD CONSTRAINT verificacion_visita_vecino_opciones_etiqueta_check CHECK (char_length(btrim(etiqueta_snapshot::text)) >= 1);
ALTER TABLE verificacion_visita_vecino_opciones ADD CONSTRAINT verificacion_visita_vecino_opciones_orden_check CHECK (orden_snapshot >= 1);
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_idempotencia_check CHECK (char_length(idempotency_key::text) >= 16 AND char_length(idempotency_key::text) <= 100);
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_fuente_check CHECK (ubicacion_fuente::text = 'DISPOSITIVO'::text);
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_precision CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0::numeric);
ALTER TABLE verificacion_visitas_vecino ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_rango CHECK (ubicacion_latitud >= '-90'::integer::numeric AND ubicacion_latitud <= 90::numeric AND ubicacion_longitud >= '-180'::integer::numeric AND ubicacion_longitud <= 180::numeric);

-- Triggers
CREATE TRIGGER trg_validar_opcion_respuesta_visita_vecino BEFORE INSERT OR UPDATE ON verificacion_visita_vecino_opciones FOR EACH ROW EXECUTE FUNCTION validar_opcion_respuesta_visita_vecino();

-- Vistas
CREATE OR REPLACE VIEW solicitudes_completo AS
 SELECT id,
    folio,
    integrante_id,
    persona_id,
    expediente_id,
    grupo_id,
    credito_id,
    ciclo_numero,
    numero_credito,
    monto_solicitado,
    monto_autorizado,
    created_at,
    updated_at
   FROM solicitudes s;;

