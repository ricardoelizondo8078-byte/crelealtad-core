-- Schema dump de crelealtad (estructura completa)
-- Generado: 2026-08-05T22:36:05.657Z
-- Base: crelealtad (producción)

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE documentos_estado_enum AS ENUM ('PENDIENTE', 'CARGADO', 'VERIFICADO');
CREATE TYPE documentos_tipo_enum AS ENUM ('INE', 'COMPROBANTE_DOMICILIO', 'IDENTIFICACION_BENEFICIARIO', 'COMPROBANTE_CREDITO_ANTERIOR');
CREATE TYPE grupos_status_enum AS ENUM ('FORMANDO', 'LISTO_PARA_REVISION', 'EN_REVISION', 'AUTORIZADO');
CREATE TYPE solicitantes_estado_enum AS ENUM ('DOCUMENTANDO', 'SUJETA_CREDITO', 'EN_VERIFICACION', 'AUTORIZADA', 'RECHAZADA');

-- Tabla: audit_log
CREATE TABLE audit_log (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tabla VARCHAR NOT NULL,
  registro_id UUID NOT NULL,
  accion VARCHAR NOT NULL,
  datos_antes JSONB,
  datos_despues JSONB,
  usuario_id UUID,
  ip_address VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: backup_tesoreras_20260802
CREATE TABLE backup_tesoreras_20260802 (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  integrante_id UUID,
  persona_id UUID,
  expediente_id UUID,
  curp VARCHAR,
  nombre_completo VARCHAR,
  grupo_nombre VARCHAR,
  telefono VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: caja_movimientos
CREATE TABLE caja_movimientos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  tipo VARCHAR NOT NULL,
  concepto VARCHAR NOT NULL,
  monto NUMERIC NOT NULL,
  referencia_id UUID,
  referencia_tipo VARCHAR,
  sucursal_id UUID,
  registrado_por UUID NOT NULL,
  fecha_movimiento TIMESTAMP NOT NULL DEFAULT now(),
  es_corte BOOLEAN NOT NULL DEFAULT false,
  saldo_al_corte NUMERIC,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: calendario_pagos
CREATE TABLE calendario_pagos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  credito_id UUID NOT NULL,
  numero_pago INTEGER NOT NULL,
  fecha_programada DATE NOT NULL,
  monto_programado NUMERIC NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'PENDIENTE'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: ciclos
CREATE TABLE ciclos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  grupo_id UUID NOT NULL,
  numero_ciclo INTEGER NOT NULL,
  expediente_id UUID,
  asesora_id UUID NOT NULL,
  tesorera_id UUID NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  dia_pago VARCHAR NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: codigos_postales
CREATE TABLE codigos_postales (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  codigo VARCHAR NOT NULL,
  colonia VARCHAR NOT NULL,
  municipio VARCHAR NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'Nuevo León'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: creditos
CREATE TABLE creditos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  solicitud_id UUID NOT NULL,
  persona_id UUID NOT NULL,
  expediente_id UUID NOT NULL,
  monto_autorizado NUMERIC NOT NULL,
  tasa NUMERIC NOT NULL,
  num_semanas INTEGER NOT NULL,
  monto_seguro NUMERIC NOT NULL,
  costo_apertura NUMERIC NOT NULL,
  retencion NUMERIC NOT NULL,
  fecha_desembolso DATE NOT NULL,
  monto_desembolsado NUMERIC NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados
CREATE TABLE empleados (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  usuario_id UUID NOT NULL,
  zona_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  fecha_nacimiento DATE,
  genero VARCHAR,
  curp VARCHAR,
  rfc VARCHAR,
  fecha_ingreso DATE,
  tipo_empleado VARCHAR NOT NULL,
  PRIMARY KEY (id)
);

-- Tabla: empleados_contacto
CREATE TABLE empleados_contacto (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL,
  telefono_celular VARCHAR NOT NULL,
  telefono_casa VARCHAR,
  telefono_emergencia VARCHAR,
  emergencia_nombre VARCHAR,
  emergencia_parentesco VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_datos_laborales
CREATE TABLE empleados_datos_laborales (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL,
  sucursal_id UUID,
  jefe_inmediato_id UUID,
  tipo_contrato VARCHAR,
  nivel VARCHAR,
  meta_mensual_grupos INTEGER,
  meta_mensual_monto NUMERIC,
  observaciones TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_documentos
CREATE TABLE empleados_documentos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL,
  tipo_documento VARCHAR NOT NULL,
  ruta_archivo VARCHAR NOT NULL,
  fecha_captura TIMESTAMP NOT NULL DEFAULT now(),
  estado VARCHAR NOT NULL DEFAULT 'VIGENTE'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: empleados_domicilios
CREATE TABLE empleados_domicilios (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL,
  calle VARCHAR,
  numero_ext VARCHAR,
  numero_int VARCHAR,
  colonia VARCHAR,
  municipio VARCHAR,
  estado VARCHAR,
  codigo_postal VARCHAR,
  referencias TEXT,
  latitud NUMERIC,
  longitud NUMERIC,
  geolocalizacion_fecha TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  coordenadas_google_maps TEXT,
  PRIMARY KEY (id)
);

-- Tabla: expedientes
CREATE TABLE expedientes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  grupo_id UUID NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'En proceso'::character varying,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  folio VARCHAR,
  producto_id UUID,
  asesora_id UUID,
  horario_visita VARCHAR,
  dias_visita VARCHAR,
  semana_cobro DATE,
  observaciones TEXT,
  estado_fecha TIMESTAMP DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: grupos
CREATE TABLE grupos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  nombre VARCHAR NOT NULL,
  created_by VARCHAR,
  estado grupos_status_enum NOT NULL DEFAULT 'FORMANDO'::grupos_status_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  folio VARCHAR,
  zona_id UUID,
  sucursal_id UUID,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (id)
);

-- Tabla: integrantes
CREATE TABLE integrantes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  expediente_id UUID NOT NULL,
  estado solicitantes_estado_enum NOT NULL DEFAULT 'DOCUMENTANDO'::solicitantes_estado_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  folio VARCHAR,
  persona_id UUID,
  PRIMARY KEY (id)
);

-- Tabla: mora
CREATE TABLE mora (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  credito_id UUID NOT NULL,
  calendario_id UUID NOT NULL,
  fecha_inicio_mora DATE NOT NULL,
  fecha_fin_mora DATE,
  dias_mora INTEGER NOT NULL DEFAULT 0,
  monto_mora NUMERIC NOT NULL DEFAULT 0,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: pagos
CREATE TABLE pagos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  calendario_id UUID NOT NULL,
  credito_id UUID NOT NULL,
  persona_id UUID NOT NULL,
  fecha_pago DATE NOT NULL,
  monto_pagado NUMERIC NOT NULL,
  dias_atraso INTEGER NOT NULL DEFAULT 0,
  metodo_pago VARCHAR,
  recibido_por UUID,
  estado VARCHAR NOT NULL DEFAULT 'REGISTRADO'::character varying,
  observaciones TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: personas
CREATE TABLE personas (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  curp VARCHAR,
  primer_nombre VARCHAR,
  segundo_nombre VARCHAR,
  apellido_pat VARCHAR NOT NULL,
  apellido_mat VARCHAR,
  fecha_nac DATE,
  genero VARCHAR,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  telefono VARCHAR,
  monto_solicitado NUMERIC,
  telefono_secundario VARCHAR,
  nombres VARCHAR NOT NULL,
  nombre_completo VARCHAR,
  PRIMARY KEY (id)
);

-- Tabla: productos_credito
CREATE TABLE productos_credito (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  tasa NUMERIC NOT NULL,
  precio_seguro NUMERIC NOT NULL,
  costo_apertura NUMERIC NOT NULL,
  retencion NUMERIC NOT NULL,
  num_semanas INTEGER NOT NULL,
  monto_minimo NUMERIC NOT NULL,
  monto_maximo NUMERIC NOT NULL,
  min_integrantes INTEGER NOT NULL DEFAULT 6,
  max_integrantes INTEGER NOT NULL DEFAULT 12,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: reestructuras
CREATE TABLE reestructuras (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  credito_id UUID NOT NULL,
  tipo VARCHAR NOT NULL,
  motivo TEXT,
  nuevo_monto NUMERIC,
  nuevas_semanas INTEGER,
  nueva_tasa NUMERIC,
  fecha_acuerdo DATE NOT NULL,
  autorizado_por UUID,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: roles
CREATE TABLE roles (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  nombre VARCHAR NOT NULL,
  descripcion VARCHAR,
  permisos JSONB,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVO'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes
CREATE TABLE solicitudes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  integrante_id UUID NOT NULL,
  persona_id UUID NOT NULL,
  expediente_id UUID NOT NULL,
  grupo_id UUID NOT NULL,
  credito_id UUID,
  ciclo_numero INTEGER,
  numero_credito INTEGER,
  monto_solicitado NUMERIC,
  monto_autorizado NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_beneficiarios
CREATE TABLE solicitudes_beneficiarios (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  beneficiario_nombre VARCHAR,
  beneficiario_parentesco VARCHAR,
  beneficiario_telefono VARCHAR,
  beneficiario_direccion VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_datos_personales
CREATE TABLE solicitudes_datos_personales (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  primer_nombre VARCHAR,
  segundo_nombre VARCHAR,
  apellido_pat VARCHAR,
  apellido_mat VARCHAR,
  curp VARCHAR,
  fecha_nac DATE,
  genero VARCHAR,
  nacionalidad VARCHAR,
  estado_nacimiento VARCHAR,
  estado_civil VARCHAR,
  ocupacion VARCHAR,
  nivel_estudio VARCHAR,
  telefono VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombres VARCHAR,
  nombre_completo VARCHAR,
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_documentos
CREATE TABLE solicitudes_documentos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  doc_ine_ruta VARCHAR,
  doc_ine_fecha DATE,
  doc_comprobante_ruta VARCHAR,
  doc_comprobante_fecha DATE,
  doc_ine_beneficiario_ruta VARCHAR,
  doc_ine_beneficiario_fecha DATE,
  doc_solicitud_firmada_ruta VARCHAR,
  doc_solicitud_firmada_fecha DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  doc_comprobante_credito_ruta VARCHAR,
  doc_comprobante_credito_fecha DATE,
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_domicilios
CREATE TABLE solicitudes_domicilios (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  dom_calle VARCHAR,
  dom_num_ext VARCHAR,
  dom_num_int VARCHAR,
  dom_entre_calles VARCHAR,
  dom_colonia VARCHAR,
  dom_municipio VARCHAR,
  dom_estado VARCHAR,
  dom_codigo_postal VARCHAR,
  dom_cp_id UUID,
  dom_telefono VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_negocios
CREATE TABLE solicitudes_negocios (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  negocio_giro VARCHAR,
  negocio_domicilio VARCHAR,
  negocio_colonia VARCHAR,
  negocio_municipio VARCHAR,
  negocio_estado VARCHAR,
  negocio_codigo_postal VARCHAR,
  negocio_cp_id UUID,
  negocio_num_ext VARCHAR,
  negocio_num_int VARCHAR,
  negocio_desde_cuando VARCHAR,
  negocio_ingreso_semanal NUMERIC,
  negocio_otros_ingresos NUMERIC,
  negocio_gastos NUMERIC,
  negocio_total NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_referencias
CREATE TABLE solicitudes_referencias (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  ref1_nombre VARCHAR,
  ref1_parentesco VARCHAR,
  ref1_telefono VARCHAR,
  ref1_direccion VARCHAR,
  ref2_nombre VARCHAR,
  ref2_parentesco VARCHAR,
  ref2_telefono VARCHAR,
  ref2_direccion VARCHAR,
  pareja_nombre VARCHAR,
  pareja_actividad VARCHAR,
  pareja_ingreso_semanal NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: solicitudes_validaciones
CREATE TABLE solicitudes_validaciones (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id UUID NOT NULL,
  tiene_medidor_luz VARCHAR,
  vive_max_5km_tesorera VARCHAR,
  tiene_menos_70_anios VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: sucursales
CREATE TABLE sucursales (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  nombre VARCHAR NOT NULL,
  direccion VARCHAR,
  telefono VARCHAR,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: usuarios
CREATE TABLE usuarios (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  nombre VARCHAR,
  apellido_paterno VARCHAR,
  apellido_materno VARCHAR,
  email VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  rol_id UUID NOT NULL,
  sucursal_id UUID NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVO'::character varying,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabla: zonas
CREATE TABLE zonas (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  folio VARCHAR,
  nombre VARCHAR NOT NULL,
  sucursal_id UUID NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'ACTIVA'::character varying,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Foreign Keys
ALTER TABLE caja_movimientos ADD CONSTRAINT caja_movimientos_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
ALTER TABLE calendario_pagos ADD CONSTRAINT calendario_pagos_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_asesora_id_fkey
  FOREIGN KEY (asesora_id) REFERENCES empleados(id);
ALTER TABLE ciclos ADD CONSTRAINT fk_ciclo_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_grupo_id_fkey
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_tesorera_id_fkey
  FOREIGN KEY (tesorera_id) REFERENCES personas(id);
ALTER TABLE creditos ADD CONSTRAINT creditos_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);
ALTER TABLE creditos ADD CONSTRAINT creditos_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
ALTER TABLE empleados ADD CONSTRAINT fk_empleados_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE empleados ADD CONSTRAINT asesoras_zona_id_fkey
  FOREIGN KEY (zona_id) REFERENCES zonas(id);
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
ALTER TABLE expedientes ADD CONSTRAINT expedientes_asesora_id_fkey
  FOREIGN KEY (asesora_id) REFERENCES empleados(id);
ALTER TABLE expedientes ADD CONSTRAINT FK_aca6e52d776906c1c5eb57dd6c7
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE expedientes ADD CONSTRAINT fk_expedientes_grupo
  FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_producto_id_fkey
  FOREIGN KEY (producto_id) REFERENCES productos_credito(id);
ALTER TABLE grupos ADD CONSTRAINT grupos_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
ALTER TABLE grupos ADD CONSTRAINT grupos_zona_id_fkey
  FOREIGN KEY (zona_id) REFERENCES zonas(id);
ALTER TABLE integrantes ADD CONSTRAINT FK_2ce578059a16ac9921991c307b1
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
ALTER TABLE mora ADD CONSTRAINT mora_calendario_id_fkey
  FOREIGN KEY (calendario_id) REFERENCES calendario_pagos(id);
ALTER TABLE mora ADD CONSTRAINT mora_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE pagos ADD CONSTRAINT pagos_calendario_id_fkey
  FOREIGN KEY (calendario_id) REFERENCES calendario_pagos(id);
ALTER TABLE pagos ADD CONSTRAINT pagos_credito_id_fkey
  FOREIGN KEY (credito_id) REFERENCES creditos(id);
ALTER TABLE pagos ADD CONSTRAINT pagos_persona_id_fkey
  FOREIGN KEY (persona_id) REFERENCES personas(id);
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
ALTER TABLE solicitudes_negocios ADD CONSTRAINT fk_negocio_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_referencias ADD CONSTRAINT fk_referencias_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE solicitudes_validaciones ADD CONSTRAINT fk_validaciones_solicitud
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE;
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT;
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_sucursal
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT;
ALTER TABLE zonas ADD CONSTRAINT zonas_sucursal_id_fkey
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);

-- Unique Constraints
ALTER TABLE caja_movimientos ADD CONSTRAINT caja_movimientos_folio_key UNIQUE (folio);
ALTER TABLE calendario_pagos ADD CONSTRAINT calendario_pagos_credito_id_numero_pago_key UNIQUE (credito_id, numero_pago);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_folio_key UNIQUE (folio);
ALTER TABLE ciclos ADD CONSTRAINT ciclos_grupo_id_numero_ciclo_key UNIQUE (grupo_id, numero_ciclo);
ALTER TABLE codigos_postales ADD CONSTRAINT codigos_postales_folio_key UNIQUE (folio);
ALTER TABLE creditos ADD CONSTRAINT creditos_folio_key UNIQUE (folio);
ALTER TABLE empleados ADD CONSTRAINT asesoras_folio_key UNIQUE (folio);
ALTER TABLE empleados ADD CONSTRAINT empleados_usuario_id_unique UNIQUE (usuario_id);
ALTER TABLE empleados_contacto ADD CONSTRAINT asesoras_contacto_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE empleados_datos_laborales ADD CONSTRAINT asesoras_datos_laborales_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE empleados_domicilios ADD CONSTRAINT asesoras_domicilios_asesor_id_key UNIQUE (empleado_id);
ALTER TABLE expedientes ADD CONSTRAINT expedientes_folio_key UNIQUE (folio);
ALTER TABLE grupos ADD CONSTRAINT grupos_folio_key UNIQUE (folio);
ALTER TABLE integrantes ADD CONSTRAINT integrantes_folio_key UNIQUE (folio);
ALTER TABLE integrantes ADD CONSTRAINT uq_integrante_expediente_persona UNIQUE (expediente_id, persona_id);
ALTER TABLE pagos ADD CONSTRAINT pagos_folio_key UNIQUE (folio);
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
ALTER TABLE zonas ADD CONSTRAINT zonas_folio_key UNIQUE (folio);

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

