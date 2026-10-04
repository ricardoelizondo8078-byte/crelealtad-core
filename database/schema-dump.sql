--
-- PostgreSQL database dump
--

\restrict S6GLnGI5qk1bjYvVR70KkQZa0T9WrteXE8fuSvB5mdUnzVyBFLPFPK8bAtIDU0I

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: documentos_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.documentos_estado_enum AS ENUM (
    'PENDIENTE',
    'CARGADO',
    'VERIFICADO'
);


--
-- Name: documentos_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.documentos_tipo_enum AS ENUM (
    'INE',
    'COMPROBANTE_DOMICILIO',
    'IDENTIFICACION_BENEFICIARIO',
    'COMPROBANTE_CREDITO_ANTERIOR'
);


--
-- Name: grupos_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.grupos_status_enum AS ENUM (
    'FORMANDO',
    'LISTO_PARA_REVISION',
    'EN_REVISION',
    'AUTORIZADO'
);


--
-- Name: solicitantes_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.solicitantes_estado_enum AS ENUM (
    'DOCUMENTANDO',
    'SUJETA_CREDITO',
    'EN_VERIFICACION',
    'AUTORIZADA',
    'RECHAZADA',
    'RETIRADA'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tabla character varying(50) NOT NULL,
    registro_id uuid NOT NULL,
    accion character varying(20) NOT NULL,
    datos_antes jsonb,
    datos_despues jsonb,
    usuario_id uuid,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: backup_tesoreras_20260802; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_tesoreras_20260802 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    integrante_id uuid,
    persona_id uuid,
    expediente_id uuid,
    curp character varying(18),
    nombre_completo character varying(200),
    grupo_nombre character varying,
    telefono character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: caja_movimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caja_movimientos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    tipo character varying(20) NOT NULL,
    concepto character varying(150) NOT NULL,
    monto numeric(10,2) NOT NULL,
    referencia_id uuid,
    referencia_tipo character varying(30),
    sucursal_id uuid,
    registrado_por uuid NOT NULL,
    fecha_movimiento timestamp without time zone DEFAULT now() NOT NULL,
    es_corte boolean DEFAULT false NOT NULL,
    saldo_al_corte numeric(10,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: calendario_pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario_pagos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    credito_id uuid NOT NULL,
    numero_pago integer NOT NULL,
    fecha_programada date NOT NULL,
    monto_programado numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ciclos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ciclos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    grupo_id uuid NOT NULL,
    numero_ciclo integer NOT NULL,
    expediente_id uuid NOT NULL,
    asesora_id uuid NOT NULL,
    tesorera_id uuid NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    dia_pago character varying(15) NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN ciclos.expediente_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ciclos.expediente_id IS 'Expediente único que originó el ciclo durante el desembolso real.';


--
-- Name: codigos_postales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_postales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    codigo character varying(5) NOT NULL,
    colonia character varying(100) NOT NULL,
    municipio character varying(100) NOT NULL,
    estado character varying(50) DEFAULT 'Nuevo León'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: creditos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creditos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: empleados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    usuario_id uuid NOT NULL,
    zona_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    fecha_nacimiento date,
    genero character varying(10),
    curp character varying(18),
    rfc character varying(13),
    fecha_ingreso date,
    tipo_empleado character varying(50) NOT NULL
);


--
-- Name: TABLE empleados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empleados IS 'Datos personales de todos los empleados (11 columnas)';


--
-- Name: COLUMN empleados.usuario_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.usuario_id IS 'FK → usuarios (login y permisos)';


--
-- Name: COLUMN empleados.zona_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.zona_id IS 'FK → zonas (zona geográfica asignada)';


--
-- Name: COLUMN empleados.curp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.curp IS 'CURP de 18 caracteres (ÚNICO)';


--
-- Name: COLUMN empleados.rfc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.rfc IS 'RFC de 13 caracteres (ÚNICO)';


--
-- Name: COLUMN empleados.fecha_ingreso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.fecha_ingreso IS 'Fecha de ingreso a la empresa';


--
-- Name: COLUMN empleados.tipo_empleado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados.tipo_empleado IS 'Tipo: ASESOR | COORDINADOR | GERENTE | RECOLECTOR | VERIFICADOR | COBRADOR | DESEMBOLSADOR';


--
-- Name: empleados_contacto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados_contacto (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empleado_id uuid NOT NULL,
    telefono_celular character varying(20) NOT NULL,
    telefono_casa character varying(20),
    telefono_emergencia character varying(20),
    emergencia_nombre character varying(100),
    emergencia_parentesco character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE empleados_contacto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empleados_contacto IS 'Información de contacto del empleado';


--
-- Name: empleados_datos_laborales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados_datos_laborales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empleado_id uuid NOT NULL,
    sucursal_id uuid,
    jefe_inmediato_id uuid,
    tipo_contrato character varying(50),
    nivel character varying(50),
    meta_mensual_grupos integer,
    meta_mensual_monto numeric(12,2),
    observaciones text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE empleados_datos_laborales; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empleados_datos_laborales IS 'Información laboral, jerarquía y metas del empleado';


--
-- Name: empleados_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados_documentos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empleado_id uuid NOT NULL,
    tipo_documento character varying(50) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    fecha_captura timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'VIGENTE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE empleados_documentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empleados_documentos IS 'Fotografías y documentos del empleado con historial';


--
-- Name: COLUMN empleados_documentos.tipo_documento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empleados_documentos.tipo_documento IS 'FOTO_PERFIL | INE_FRENTE | INE_REVERSO | COMPROBANTE_DOMICILIO | CURP | RFC | CONTRATO';


--
-- Name: empleados_domicilios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados_domicilios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    coordenadas_google_maps text GENERATED ALWAYS AS (
CASE
    WHEN ((latitud IS NOT NULL) AND (longitud IS NOT NULL)) THEN (((latitud)::text || ', '::text) || (longitud)::text)
    ELSE NULL::text
END) STORED
);


--
-- Name: TABLE empleados_domicilios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empleados_domicilios IS 'Domicilio completo y geolocalización del empleado';


--
-- Name: expedientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expedientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    grupo_id uuid NOT NULL,
    estado character varying DEFAULT 'En proceso'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
    CONSTRAINT ck_expedientes_origen_historico_completo CHECK ((((ciclo_historico_origen_id IS NULL) AND (importacion_integrantes_id IS NULL)) OR ((ciclo_historico_origen_id IS NOT NULL) AND (importacion_integrantes_id IS NOT NULL))))
);


--
-- Name: COLUMN expedientes.ciclo_historico_origen_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expedientes.ciclo_historico_origen_id IS 'Ciclo grupal importado al que pertenece este expediente histórico fuente.';


--
-- Name: COLUMN expedientes.importacion_integrantes_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expedientes.importacion_integrantes_id IS 'Importación individual que originó integrantes y montos autorizados históricos.';


--
-- Name: COLUMN expedientes.tesorera_integrante_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expedientes.tesorera_integrante_id IS 'Integrante del mismo expediente seleccionada como tesorera para Documentacion y Verificacion; la tesorera definitiva del ciclo se confirma en Desembolso.';


--
-- Name: grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying NOT NULL,
    created_by character varying,
    estado public.grupos_status_enum DEFAULT 'FORMANDO'::public.grupos_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    folio character varying(20),
    zona_id uuid,
    sucursal_id uuid,
    fecha_inicio date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: historial_grupos_ciclos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_grupos_ciclos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_historial_grupos_ciclos_numero CHECK (((numero_grupo_legacy > 0) AND (numero_ciclo > 0))),
    CONSTRAINT ck_historial_grupos_ciclos_semanas CHECK (((primera_semana > 0) AND (ultima_semana >= primera_semana) AND (total_semanas_registradas > 0)))
);


--
-- Name: TABLE historial_grupos_ciclos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.historial_grupos_ciclos IS 'Resumen de cada ciclo grupal tal como existía en un corte Excel; no sustituye ciclos transaccionales nacidos por desembolso.';


--
-- Name: COLUMN historial_grupos_ciclos.vigente_en_corte; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historial_grupos_ciclos.vigente_en_corte IS 'Refleja exclusivamente GRUPO VIGENTE=1 en el archivo; FALSE no implica LIQUIDADO.';


--
-- Name: historial_grupos_ciclos_semanas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_grupos_ciclos_semanas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_historial_grupos_ciclos_semanas_semana CHECK ((semana > 0))
);


--
-- Name: TABLE historial_grupos_ciclos_semanas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.historial_grupos_ciclos_semanas IS 'Comportamiento semanal agregado del grupo; no representa créditos individuales.';


--
-- Name: importaciones_excel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.importaciones_excel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_fuente character varying(50) NOT NULL,
    archivo_nombre character varying(255) NOT NULL,
    archivo_sha256 character(64) NOT NULL,
    semana_corte integer NOT NULL,
    estado character varying(20) DEFAULT 'VALIDADO'::character varying NOT NULL,
    es_base_activa boolean DEFAULT false NOT NULL,
    manifest jsonb NOT NULL,
    creado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activated_at timestamp with time zone,
    CONSTRAINT ck_importaciones_excel_estado CHECK (((estado)::text = ANY ((ARRAY['VALIDADO'::character varying, 'CARGADO'::character varying, 'ACTIVO'::character varying, 'RECHAZADO'::character varying])::text[]))),
    CONSTRAINT ck_importaciones_excel_semana CHECK ((semana_corte > 0)),
    CONSTRAINT ck_importaciones_excel_tipo CHECK (((tipo_fuente)::text = ANY ((ARRAY['HISTORIAL_GRUPOS'::character varying, 'HISTORIAL_INTEGRANTES'::character varying])::text[])))
);


--
-- Name: TABLE importaciones_excel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.importaciones_excel IS 'Cortes inmutables y auditables importados desde archivos Excel operativos.';


--
-- Name: integrantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrantes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    expediente_id uuid NOT NULL,
    estado public.solicitantes_estado_enum DEFAULT 'DOCUMENTANDO'::public.solicitantes_estado_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    folio character varying(20),
    persona_id uuid,
    motivo_retiro character varying(40),
    motivo_retiro_detalle character varying(250),
    retirada_at timestamp with time zone,
    retirada_por uuid,
    CONSTRAINT integrantes_motivo_retiro_check CHECK (((motivo_retiro IS NULL) OR ((motivo_retiro)::text = ANY ((ARRAY['DESCANSA_RENOVACION'::character varying, 'DOCUMENTACION_INCOMPLETA'::character varying, 'DECIDIO_NO_CONTINUAR'::character varying, 'OTRO'::character varying])::text[])))),
    CONSTRAINT integrantes_retiro_contexto_check CHECK (((((estado)::text = 'RETIRADA'::text) AND (motivo_retiro IS NOT NULL) AND (retirada_at IS NOT NULL) AND (retirada_por IS NOT NULL) AND ((((motivo_retiro)::text = 'OTRO'::text) AND (NULLIF(btrim((motivo_retiro_detalle)::text), ''::text) IS NOT NULL)) OR (((motivo_retiro)::text <> 'OTRO'::text) AND (motivo_retiro_detalle IS NULL)))) OR (((estado)::text <> 'RETIRADA'::text) AND (motivo_retiro IS NULL) AND (motivo_retiro_detalle IS NULL) AND (retirada_at IS NULL) AND (retirada_por IS NULL))))
);


--
-- Name: COLUMN integrantes.motivo_retiro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.integrantes.motivo_retiro IS 'Motivo controlado por el que la persona no participa en este expediente.';


--
-- Name: COLUMN integrantes.motivo_retiro_detalle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.integrantes.motivo_retiro_detalle IS 'Detalle obligatorio únicamente cuando motivo_retiro es OTRO.';


--
-- Name: COLUMN integrantes.retirada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.integrantes.retirada_at IS 'Fecha del retiro formal de la participación en este expediente.';


--
-- Name: COLUMN integrantes.retirada_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.integrantes.retirada_por IS 'Usuario que confirmó el retiro; referencia auditada con borrado restringido.';


--
-- Name: mora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mora (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    credito_id uuid NOT NULL,
    calendario_id uuid NOT NULL,
    fecha_inicio_mora date NOT NULL,
    fecha_fin_mora date,
    dias_mora integer DEFAULT 0 NOT NULL,
    monto_mora numeric(10,2) DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    calendario_id uuid NOT NULL,
    credito_id uuid NOT NULL,
    persona_id uuid NOT NULL,
    fecha_pago date NOT NULL,
    monto_pagado numeric(10,2) NOT NULL,
    dias_atraso integer DEFAULT 0 NOT NULL,
    metodo_pago character varying(30),
    recibido_por uuid,
    estado character varying(20) DEFAULT 'REGISTRADO'::character varying NOT NULL,
    observaciones text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    curp character varying(18),
    primer_nombre character varying(50),
    segundo_nombre character varying(50),
    apellido_pat character varying(50) NOT NULL,
    apellido_mat character varying(50),
    fecha_nac date,
    genero character varying(15),
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    telefono character varying(20),
    monto_solicitado numeric(10,2),
    telefono_secundario character varying,
    nombres character varying(150) NOT NULL,
    nombre_completo character varying(255) GENERATED ALWAYS AS (btrim(((((nombres)::text || ' '::text) || (apellido_pat)::text) || COALESCE((' '::text || NULLIF((apellido_mat)::text, ''::text)), ''::text)))) STORED
);


--
-- Name: COLUMN personas.primer_nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.personas.primer_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';


--
-- Name: COLUMN personas.segundo_nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.personas.segundo_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';


--
-- Name: productos_credito; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos_credito (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    min_integrantes integer DEFAULT 6 NOT NULL,
    max_integrantes integer DEFAULT 12 NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reestructuras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reestructuras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    credito_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    motivo text,
    nuevo_monto numeric(10,2),
    nuevas_semanas integer,
    nueva_tasa numeric(5,2),
    fecha_acuerdo date NOT NULL,
    autorizado_por uuid,
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    nombre character varying(50) NOT NULL,
    descripcion character varying(200),
    permisos jsonb,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT roles_permisos_formato_check CHECK (((permisos IS NULL) OR ((jsonb_typeof(permisos) = 'object'::text) AND (jsonb_typeof((permisos -> 'modulos'::text)) = 'array'::text) AND (jsonb_typeof((permisos -> 'acciones'::text)) = 'array'::text) AND (NOT jsonb_path_exists(permisos, '$."modulos"[*]?(@.type() != "string")'::jsonpath)) AND (NOT jsonb_path_exists(permisos, '$."acciones"[*]?(@.type() != "string")'::jsonpath)))))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL,
    checksum character(64) NOT NULL,
    source character varying(20) DEFAULT 'MIGRATION'::character varying NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_by text DEFAULT CURRENT_USER NOT NULL,
    execution_ms integer,
    CONSTRAINT ck_schema_migrations_checksum CHECK ((checksum ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT ck_schema_migrations_execution_ms CHECK (((execution_ms IS NULL) OR (execution_ms >= 0))),
    CONSTRAINT ck_schema_migrations_source CHECK (((source)::text = ANY ((ARRAY['MIGRATION'::character varying, 'BASELINE'::character varying])::text[])))
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schema_migrations IS 'Ledger técnico de migraciones aplicadas; no contiene reglas ni datos operativos.';


--
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    monto_solicitado_confirmado_at timestamp with time zone
);


--
-- Name: TABLE solicitudes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes IS 'Solicitudes de crédito (core) - 14 columnas';


--
-- Name: COLUMN solicitudes.monto_solicitado_confirmado_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes.monto_solicitado_confirmado_at IS 'Fecha en que el asesor capturo explicitamente el monto solicitado; NULL indica una referencia precargada aun no confirmada.';


--
-- Name: solicitudes_beneficiarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_beneficiarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    solicitud_id uuid NOT NULL,
    beneficiario_nombre character varying(150),
    beneficiario_parentesco character varying(50),
    beneficiario_telefono character varying(20),
    beneficiario_direccion character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE solicitudes_beneficiarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_beneficiarios IS 'Beneficiario designado - 8 columnas';


--
-- Name: solicitudes_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.solicitudes_completo AS
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
   FROM public.solicitudes s;


--
-- Name: solicitudes_datos_personales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_datos_personales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nombres character varying(150),
    nombre_completo character varying(255) GENERATED ALWAYS AS (
CASE
    WHEN (nombres IS NOT NULL) THEN btrim(((((nombres)::text || ' '::text) || (COALESCE(apellido_pat, ''::character varying))::text) || COALESCE((' '::text || NULLIF((apellido_mat)::text, ''::text)), ''::text)))
    ELSE NULL::text
END) STORED
);


--
-- Name: TABLE solicitudes_datos_personales; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_datos_personales IS 'Datos personales del solicitante - 17 columnas';


--
-- Name: COLUMN solicitudes_datos_personales.primer_nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_datos_personales.primer_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';


--
-- Name: COLUMN solicitudes_datos_personales.segundo_nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_datos_personales.segundo_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';


--
-- Name: COLUMN solicitudes_datos_personales.nombres; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_datos_personales.nombres IS 'Nombres completos (refactor: reemplaza primer_nombre + segundo_nombre)';


--
-- Name: COLUMN solicitudes_datos_personales.nombre_completo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_datos_personales.nombre_completo IS 'COLUMNA GENERADA: Nombre completo = nombres + apellido_pat + apellido_mat';


--
-- Name: solicitudes_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_documentos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    solicitud_id uuid NOT NULL,
    doc_ine_ruta character varying(500),
    doc_ine_fecha date,
    doc_comprobante_ruta character varying(500),
    doc_comprobante_fecha date,
    doc_ine_beneficiario_ruta character varying(500),
    doc_ine_beneficiario_fecha date,
    doc_solicitud_firmada_ruta character varying(500),
    doc_solicitud_firmada_fecha date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    doc_comprobante_credito_ruta character varying(500),
    doc_comprobante_credito_fecha date
);


--
-- Name: TABLE solicitudes_documentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_documentos IS 'Documentos capturados - 12 columnas';


--
-- Name: COLUMN solicitudes_documentos.doc_comprobante_credito_ruta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_documentos.doc_comprobante_credito_ruta IS 'Ruta del comprobante de crédito (ej: historial crediticio)';


--
-- Name: COLUMN solicitudes_documentos.doc_comprobante_credito_fecha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_documentos.doc_comprobante_credito_fecha IS 'Fecha de captura del comprobante de crédito';


--
-- Name: solicitudes_domicilios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_domicilios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    dom_latitud numeric(10,7),
    dom_longitud numeric(11,7),
    dom_geocodificacion_fuente character varying(40),
    dom_geocodificacion_fecha timestamp with time zone,
    CONSTRAINT solicitudes_domicilios_coordenadas_pareadas CHECK ((((dom_latitud IS NULL) AND (dom_longitud IS NULL)) OR ((dom_latitud IS NOT NULL) AND (dom_longitud IS NOT NULL) AND ((dom_latitud >= ('-90'::integer)::numeric) AND (dom_latitud <= (90)::numeric)) AND ((dom_longitud >= ('-180'::integer)::numeric) AND (dom_longitud <= (180)::numeric)))))
);


--
-- Name: TABLE solicitudes_domicilios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_domicilios IS 'Domicilio del solicitante - 14 columnas';


--
-- Name: COLUMN solicitudes_domicilios.dom_latitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_domicilios.dom_latitud IS 'Latitud aproximada obtenida al geocodificar la direccion capturada; no representa GPS del dispositivo.';


--
-- Name: COLUMN solicitudes_domicilios.dom_longitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_domicilios.dom_longitud IS 'Longitud aproximada obtenida al geocodificar la direccion capturada; no representa GPS del dispositivo.';


--
-- Name: COLUMN solicitudes_domicilios.dom_geocodificacion_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_domicilios.dom_geocodificacion_fuente IS 'Proveedor o mecanismo que convirtio la direccion capturada en coordenadas.';


--
-- Name: COLUMN solicitudes_domicilios.dom_geocodificacion_fecha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solicitudes_domicilios.dom_geocodificacion_fecha IS 'Fecha de la ultima geocodificacion exitosa del domicilio capturado.';


--
-- Name: solicitudes_negocios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_negocios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE solicitudes_negocios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_negocios IS 'Datos del negocio del solicitante - 18 columnas';


--
-- Name: solicitudes_referencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_referencias (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE solicitudes_referencias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_referencias IS 'Referencias personales y pareja - 15 columnas';


--
-- Name: solicitudes_validaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_validaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    solicitud_id uuid NOT NULL,
    tiene_medidor_luz character varying(20),
    vive_max_5km_tesorera character varying(20),
    tiene_menos_70_anios character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE solicitudes_validaciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.solicitudes_validaciones IS 'Validaciones de campo - 7 columnas';


--
-- Name: sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sucursales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    nombre character varying(100) NOT NULL,
    direccion character varying(200),
    telefono character varying(20),
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    nombre character varying(100),
    apellido_paterno character varying(100),
    apellido_materno character varying(100),
    email character varying(100),
    password_hash character varying(255) NOT NULL,
    rol_id uuid NOT NULL,
    sucursal_id uuid NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    ultimo_login timestamp with time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    abreviatura character varying(100),
    requiere_cambio_pin boolean DEFAULT false NOT NULL,
    permisos_personalizados jsonb,
    CONSTRAINT usuarios_permisos_personalizados_elementos_check CHECK (((permisos_personalizados IS NULL) OR ((NOT jsonb_path_exists(permisos_personalizados, '$."modulos"[*]?(@.type() != "string")'::jsonpath)) AND (NOT jsonb_path_exists(permisos_personalizados, '$."acciones"[*]?(@.type() != "string")'::jsonpath))))),
    CONSTRAINT usuarios_permisos_personalizados_formato_check CHECK (((permisos_personalizados IS NULL) OR ((jsonb_typeof(permisos_personalizados) = 'object'::text) AND (jsonb_typeof((permisos_personalizados -> 'modulos'::text)) = 'array'::text) AND (jsonb_typeof((permisos_personalizados -> 'acciones'::text)) = 'array'::text))))
);


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema con nombre separado en posiciones 3, 4, 5';


--
-- Name: COLUMN usuarios.nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.nombre IS 'Nombre(s) - Posición 3';


--
-- Name: COLUMN usuarios.apellido_paterno; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.apellido_paterno IS 'Apellido paterno - Posición 4';


--
-- Name: COLUMN usuarios.apellido_materno; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.apellido_materno IS 'Apellido materno - Posición 5';


--
-- Name: COLUMN usuarios.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.password_hash IS 'Hash bcrypt del PIN o credencial. Nunca contiene el PIN en texto plano.';


--
-- Name: COLUMN usuarios.abreviatura; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.abreviatura IS 'Identificador operativo de login. Para asesores proviene de la abreviatura oficial.';


--
-- Name: COLUMN usuarios.requiere_cambio_pin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.requiere_cambio_pin IS 'Indica que la credencial actual es temporal y debe sustituirse cuando el flujo este disponible.';


--
-- Name: COLUMN usuarios.permisos_personalizados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.permisos_personalizados IS 'Permisos efectivos opcionales del usuario; no cambian su rol operativo';


--
-- Name: verificacion_entrevista_desacuerdos_montos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_entrevista_desacuerdos_montos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entrevista_id uuid NOT NULL,
    expediente_id uuid NOT NULL,
    integrante_objetivo_id uuid NOT NULL,
    motivo character varying(120),
    activo boolean NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_entrevista_desacuerdos_motivo_check CHECK ((((activo = true) AND (NULLIF(btrim((motivo)::text), ''::text) IS NOT NULL)) OR ((activo = false) AND (motivo IS NULL))))
);


--
-- Name: TABLE verificacion_entrevista_desacuerdos_montos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_entrevista_desacuerdos_montos IS 'Historial inmutable de integrantes cuyo monto no acepta la entrevistada, con una causa individual.';


--
-- Name: verificacion_entrevista_evidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_entrevista_evidencias (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integrante_id uuid NOT NULL,
    ruta character varying(500) NOT NULL,
    mime_type character varying(20) NOT NULL,
    tamano_bytes integer NOT NULL,
    sha256 character(64) NOT NULL,
    captura_fuente character varying(20) NOT NULL,
    idempotency_key character varying(100) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tipo character varying(40) DEFAULT 'NEGOCIO'::character varying NOT NULL,
    foto_capturada_at timestamp with time zone,
    ubicacion_latitud numeric(10,7),
    ubicacion_longitud numeric(11,7),
    ubicacion_precision_metros numeric(10,2),
    ubicacion_capturada_at timestamp with time zone,
    ubicacion_fuente character varying(20),
    legado_sin_ubicacion boolean DEFAULT false NOT NULL,
    CONSTRAINT verificacion_entrevista_evidencias_fuente_check CHECK (((captura_fuente)::text = ANY ((ARRAY['GALERIA'::character varying, 'CAMARA'::character varying])::text[]))),
    CONSTRAINT verificacion_entrevista_evidencias_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['NEGOCIO'::character varying, 'HISTORIAL_CREDITO_ACTIVO'::character varying, 'HISTORIAL_CREDITO_INACTIVO'::character varying, 'CONTROL_PAGOS'::character varying, 'FOLLETO_PREMIO_TESORERA'::character varying])::text[]))),
    CONSTRAINT verificacion_entrevista_evidencias_ubicacion_check CHECK (((legado_sin_ubicacion = true) OR (((captura_fuente)::text = 'CAMARA'::text) AND (foto_capturada_at IS NOT NULL) AND ((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric)) AND ((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric)) AND (ubicacion_capturada_at IS NOT NULL) AND ((ubicacion_fuente)::text = 'DISPOSITIVO'::text)))),
    CONSTRAINT verificacion_entrevista_negocio_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_entrevista_negocio_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_entrevista_negocio_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_entrevista_negocio_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760)))
);


--
-- Name: TABLE verificacion_entrevista_evidencias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_entrevista_evidencias IS 'Historial de fotografias propias de Entrevista, con actor, fecha, hash, idempotencia y ubicacion por captura nueva.';


--
-- Name: COLUMN verificacion_entrevista_evidencias.ruta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevista_evidencias.ruta IS 'Ruta protegida del archivo; no es una URL publica.';


--
-- Name: COLUMN verificacion_entrevista_evidencias.captura_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevista_evidencias.captura_fuente IS 'CAMARA es la unica fuente permitida para nuevas capturas; GALERIA se conserva solo para historial previo.';


--
-- Name: COLUMN verificacion_entrevista_evidencias.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevista_evidencias.tipo IS 'Clasifica la evidencia de Entrevista; el historial crediticio separa fotos de un credito activo y de uno inactivo.';


--
-- Name: COLUMN verificacion_entrevista_evidencias.legado_sin_ubicacion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevista_evidencias.legado_sin_ubicacion IS 'Marca exclusivamente filas anteriores a esta migracion cuya ubicacion no puede reconstruirse sin inventar datos.';


--
-- Name: verificacion_entrevista_familiares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_entrevista_familiares (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entrevista_id uuid NOT NULL,
    expediente_id uuid NOT NULL,
    familiar_integrante_id uuid NOT NULL,
    activo boolean NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE verificacion_entrevista_familiares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_entrevista_familiares IS 'Historial inmutable de altas y retiros de integrantes declaradas como familiares de la entrevistada.';


--
-- Name: verificacion_entrevista_telefono_confirmaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_entrevista_telefono_confirmaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integrante_id uuid NOT NULL,
    llamada_id uuid NOT NULL,
    tipo_telefono character varying(20) NOT NULL,
    telefono character varying(10) NOT NULL,
    ruta character varying(500) NOT NULL,
    mime_type character varying(20) NOT NULL,
    tamano_bytes integer NOT NULL,
    sha256 character(64) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    evidencia_id uuid NOT NULL,
    CONSTRAINT verificacion_entrevista_telefono_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_entrevista_telefono_numero_check CHECK (((telefono)::text ~ '^[0-9]{10}$'::text)),
    CONSTRAINT verificacion_entrevista_telefono_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_entrevista_telefono_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760))),
    CONSTRAINT verificacion_entrevista_telefono_tipo_check CHECK (((tipo_telefono)::text = ANY ((ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying])::text[])))
);


--
-- Name: TABLE verificacion_entrevista_telefono_confirmaciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_entrevista_telefono_confirmaciones IS 'Historial de números confirmados durante Entrevista mediante una llamada contestada y evidencia protegida.';


--
-- Name: verificacion_entrevistas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_entrevistas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    convivientes character varying(20)[] DEFAULT '{}'::character varying[] NOT NULL,
    saben_del_credito boolean,
    otro_ingreso_hogar boolean,
    otro_ingreso_semanal numeric(12,2),
    capacidad_pago_semanal numeric(12,2),
    uso_credito text,
    fuentes_ingreso character varying(20)[] DEFAULT '{}'::character varying[] NOT NULL,
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
    revision integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_entrevistas_condicionales_check CHECK ((((conoce_asesora IS DISTINCT FROM false) OR (como_conocio_asesora IS NULL)) AND ((conoce_integrantes IS DISTINCT FROM false) OR (tiempo_conoce_integrantes IS NULL)) AND ((tiene_otro_credito_grupal IS DISTINCT FROM false) OR ((financiera_credito_grupal IS NULL) AND (credito_grupal_anterior_activo IS NULL) AND (valor_ficha_credito_grupal IS NULL) AND (semana_actual_credito_grupal IS NULL) AND (mes_desembolso_credito_grupal IS NULL) AND (mes_ultimo_pago_credito_grupal IS NULL) AND (anio_ultimo_pago_credito_grupal IS NULL) AND (numero_ciclos_credito_grupal IS NULL) AND (tasa_credito_grupal IS NULL) AND (nombre_asesora_credito_grupal IS NULL) AND (telefono_asesora_credito_grupal IS NULL) AND (motivo_no_renovacion_credito_grupal IS NULL))) AND ((vive_en_domicilio IS DISTINCT FROM true) OR (motivo_no_vive_domicilio IS NULL)) AND (((tipo_domicilio)::text = 'FAMILIAR'::text) OR (familiar_domicilio IS NULL)) AND ((otro_ingreso_hogar IS DISTINCT FROM false) OR (otro_ingreso_semanal IS NULL)) AND (('SUELDO'::text = ANY ((fuentes_ingreso)::text[])) OR ((sueldo_semanal IS NULL) AND (lugar_trabajo IS NULL) AND (antiguedad_laboral IS NULL))) AND (('NEGOCIO'::text = ANY ((fuentes_ingreso)::text[])) OR ((tipo_negocio IS NULL) AND (ingreso_libre_semanal_negocio IS NULL) AND (ubicacion_negocio IS NULL))) AND ((tiene_control_pagos IS DISTINCT FROM true) OR (motivo_sin_control_pagos IS NULL)))),
    CONSTRAINT verificacion_entrevistas_convivientes_check CHECK ((convivientes <@ ARRAY['CONYUGE'::character varying, 'HIJOS'::character varying, 'PADRES'::character varying, 'HERMANOS'::character varying, 'OTROS'::character varying])),
    CONSTRAINT verificacion_entrevistas_credito_externo_rangos_check CHECK ((((semana_actual_credito_grupal IS NULL) OR ((semana_actual_credito_grupal >= 1) AND (semana_actual_credito_grupal <= 16))) AND ((mes_desembolso_credito_grupal IS NULL) OR ((mes_desembolso_credito_grupal >= 1) AND (mes_desembolso_credito_grupal <= 12))) AND ((mes_ultimo_pago_credito_grupal IS NULL) OR ((mes_ultimo_pago_credito_grupal >= 1) AND (mes_ultimo_pago_credito_grupal <= 12))) AND ((anio_ultimo_pago_credito_grupal IS NULL) OR ((anio_ultimo_pago_credito_grupal >= 1900) AND (anio_ultimo_pago_credito_grupal <= 2200))) AND ((numero_ciclos_credito_grupal IS NULL) OR ((numero_ciclos_credito_grupal >= 1) AND (numero_ciclos_credito_grupal <= 40))) AND ((tasa_credito_grupal IS NULL) OR ((tasa_credito_grupal >= 65) AND (tasa_credito_grupal <= 100))))),
    CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_check CHECK ((NOT ((domicilio_recoleccion_integrante_id IS NOT NULL) AND (desconoce_domicilio_recoleccion IS TRUE)))),
    CONSTRAINT verificacion_entrevistas_fuentes_ingreso_check CHECK ((fuentes_ingreso <@ ARRAY['SUELDO'::character varying, 'NEGOCIO'::character varying])),
    CONSTRAINT verificacion_entrevistas_importes_check CHECK ((((valor_ficha_credito_grupal IS NULL) OR (valor_ficha_credito_grupal >= (0)::numeric)) AND ((otro_ingreso_semanal IS NULL) OR (otro_ingreso_semanal >= (0)::numeric)) AND ((capacidad_pago_semanal IS NULL) OR (capacidad_pago_semanal >= (0)::numeric)) AND ((sueldo_semanal IS NULL) OR (sueldo_semanal >= (0)::numeric)) AND ((ingreso_libre_semanal_negocio IS NULL) OR (ingreso_libre_semanal_negocio >= (0)::numeric)))),
    CONSTRAINT verificacion_entrevistas_revision_check CHECK ((revision > 0)),
    CONSTRAINT verificacion_entrevistas_telefono_asesora_check CHECK (((telefono_asesora_credito_grupal IS NULL) OR ((telefono_asesora_credito_grupal)::text ~ '^[0-9]{10}$'::text))),
    CONSTRAINT verificacion_entrevistas_tesorera_consistencia_check CHECK (((conoce_tesorera IS DISTINCT FROM false) OR (tesorera_reconocida_integrante_id IS NULL)))
);


--
-- Name: TABLE verificacion_entrevistas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_entrevistas IS 'Captura parcial autoguardada de la Entrevista de Verificacion; una fila por integrante y expediente.';


--
-- Name: COLUMN verificacion_entrevistas.entrevistada_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevistas.entrevistada_por IS 'Usuario autenticado que inicio la entrevista; nunca se acepta desde el cliente.';


--
-- Name: COLUMN verificacion_entrevistas.actualizada_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevistas.actualizada_por IS 'Ultimo usuario autenticado que modifico respuestas de la entrevista.';


--
-- Name: COLUMN verificacion_entrevistas.revision; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_entrevistas.revision IS 'Revision monotona incrementada por el servidor en cada guardado confirmado.';


--
-- Name: verificacion_imagenes_domicilio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_imagenes_domicilio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_imagenes_domicilio_captura_fuente_check CHECK (((captura_fuente)::text = 'CAMARA'::text)),
    CONSTRAINT verificacion_imagenes_domicilio_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_imagenes_domicilio_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_imagenes_domicilio_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_imagenes_domicilio_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760))),
    CONSTRAINT verificacion_imagenes_domicilio_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['NOMENCLATURAS_CALLES'::character varying, 'FACHADA'::character varying, 'MEDIDOR_LUZ'::character varying, 'FACHADA_CON_INTEGRANTE'::character varying])::text[]))),
    CONSTRAINT verificacion_imagenes_domicilio_ubicacion_fuente_check CHECK (((ubicacion_fuente)::text = 'DISPOSITIVO'::text)),
    CONSTRAINT verificacion_imagenes_domicilio_ubicacion_precision CHECK (((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric))),
    CONSTRAINT verificacion_imagenes_domicilio_ubicacion_rango CHECK ((((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric))))
);


--
-- Name: TABLE verificacion_imagenes_domicilio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_imagenes_domicilio IS 'Historial de imagenes geolocalizadas del domicilio capturadas durante Verificacion.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.tipo IS 'Tipo controlado: nomenclaturas, fachada, medidor de luz o fachada con la integrante.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.ruta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.ruta IS 'Ruta protegida del archivo; no es una URL publica.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.captura_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.captura_fuente IS 'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.foto_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.foto_capturada_at IS 'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.registrada_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.registrada_por IS 'Usuario autenticado que realizo y registro esta evidencia de Verificacion.';


--
-- Name: COLUMN verificacion_imagenes_domicilio.ubicacion_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_imagenes_domicilio.ubicacion_capturada_at IS 'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';


--
-- Name: verificacion_llamada_caracteristicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_llamada_caracteristicas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    encuesta_id uuid NOT NULL,
    clave character varying(40) NOT NULL,
    coincide boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_llamada_caracteristicas_clave_check CHECK (((clave)::text = ANY ((ARRAY['NUMERO_PLANTAS'::character varying, 'COLOR_DOMICILIO'::character varying, 'COCHERA_ENTRADA'::character varying, 'BANQUETA_FRENTE'::character varying, 'OBJETO_VISIBLE'::character varying, 'REFERENCIA_EXTERIOR'::character varying])::text[])))
);


--
-- Name: TABLE verificacion_llamada_caracteristicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_llamada_caracteristicas IS 'Respuestas normalizadas de coincidencia que componen la pregunta 3.';


--
-- Name: verificacion_llamada_encuestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_llamada_encuestas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    llamada_id uuid NOT NULL,
    identidad_coincide boolean NOT NULL,
    domicilio_coincide boolean NOT NULL,
    accion_posterior character varying(30) NOT NULL,
    registrada_por uuid NOT NULL,
    completada_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_llamada_encuestas_accion_check CHECK (((accion_posterior)::text = ANY ((ARRAY['AGENDO_VISITA'::character varying, 'ENTREVISTA_CORTA'::character varying, 'ENTREVISTA_LARGA'::character varying, 'LLAMAR_MAS_TARDE'::character varying])::text[]))),
    CONSTRAINT verificacion_llamada_encuestas_completada_check CHECK (((completada_at IS NULL) OR ((accion_posterior)::text = ANY ((ARRAY['AGENDO_VISITA'::character varying, 'ENTREVISTA_CORTA'::character varying, 'ENTREVISTA_LARGA'::character varying])::text[]))))
);


--
-- Name: TABLE verificacion_llamada_encuestas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_llamada_encuestas IS 'Respuestas de las preguntas 1, 2 y 4 de una llamada contestada de verificacion.';


--
-- Name: COLUMN verificacion_llamada_encuestas.completada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamada_encuestas.completada_at IS 'Se informa solo cuando todas las coincidencias son positivas, existe evidencia y la accion no es LLAMAR_MAS_TARDE.';


--
-- Name: verificacion_llamada_evidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_llamada_evidencias (
    id uuid NOT NULL,
    encuesta_id uuid,
    ruta character varying(500) NOT NULL,
    mime_type character varying(100) NOT NULL,
    tamano_bytes integer NOT NULL,
    sha256 character(64) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    llamada_id uuid NOT NULL,
    proposito character varying(30) NOT NULL,
    version integer NOT NULL,
    tipo_telefono character varying(20),
    telefono character varying(10),
    CONSTRAINT verificacion_llamada_evidencias_contexto_check CHECK (((((proposito)::text = 'ENCUESTA'::text) AND (encuesta_id IS NOT NULL) AND (tipo_telefono IS NULL) AND (telefono IS NULL)) OR (((proposito)::text = 'CONFIRMACION_TELEFONO'::text) AND (encuesta_id IS NULL) AND (tipo_telefono IS NOT NULL) AND (telefono IS NOT NULL)))),
    CONSTRAINT verificacion_llamada_evidencias_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_llamada_evidencias_proposito_check CHECK (((proposito)::text = ANY ((ARRAY['ENCUESTA'::character varying, 'CONFIRMACION_TELEFONO'::character varying])::text[]))),
    CONSTRAINT verificacion_llamada_evidencias_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_llamada_evidencias_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760))),
    CONSTRAINT verificacion_llamada_evidencias_telefono_check CHECK (((telefono IS NULL) OR ((telefono)::text ~ '^[0-9]{10}$'::text))),
    CONSTRAINT verificacion_llamada_evidencias_tipo_check CHECK (((tipo_telefono IS NULL) OR ((tipo_telefono)::text = ANY ((ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying])::text[])))),
    CONSTRAINT verificacion_llamada_evidencias_version_check CHECK ((version > 0))
);


--
-- Name: TABLE verificacion_llamada_evidencias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_llamada_evidencias IS 'Historial unificado y versionado de imágenes de Llamada, incluidas encuesta y confirmación telefónica desde Entrevista.';


--
-- Name: verificacion_llamadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_llamadas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integrante_id uuid NOT NULL,
    canal character varying(20) NOT NULL,
    resultado character varying(20) NOT NULL,
    idempotency_key character varying(100) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ubicacion_latitud numeric(10,7),
    ubicacion_longitud numeric(11,7),
    ubicacion_precision_metros numeric(10,2),
    ubicacion_capturada_at timestamp with time zone,
    ubicacion_fuente character varying(20),
    tipo_telefono character varying(20),
    telefono character varying(10),
    CONSTRAINT verificacion_llamadas_canal_check CHECK (((canal)::text = ANY ((ARRAY['TELEFONICA'::character varying, 'WHATSAPP'::character varying])::text[]))),
    CONSTRAINT verificacion_llamadas_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_llamadas_resultado_check CHECK (((resultado)::text = ANY ((ARRAY['CONTESTADA'::character varying, 'NO_CONTESTADA'::character varying])::text[]))),
    CONSTRAINT verificacion_llamadas_telefono_check CHECK (((telefono IS NULL) OR ((telefono)::text ~ '^[0-9]{10}$'::text))),
    CONSTRAINT verificacion_llamadas_telefono_par_check CHECK (((tipo_telefono IS NULL) = (telefono IS NULL))),
    CONSTRAINT verificacion_llamadas_tipo_telefono_check CHECK (((tipo_telefono IS NULL) OR ((tipo_telefono)::text = ANY ((ARRAY['PRINCIPAL'::character varying, 'SECUNDARIO'::character varying])::text[])))),
    CONSTRAINT verificacion_llamadas_ubicacion_completa CHECK ((((ubicacion_latitud IS NULL) AND (ubicacion_longitud IS NULL) AND (ubicacion_precision_metros IS NULL) AND (ubicacion_capturada_at IS NULL) AND (ubicacion_fuente IS NULL)) OR ((ubicacion_latitud IS NOT NULL) AND (ubicacion_longitud IS NOT NULL) AND (ubicacion_capturada_at IS NOT NULL) AND (ubicacion_fuente IS NOT NULL)))),
    CONSTRAINT verificacion_llamadas_ubicacion_fuente_check CHECK (((ubicacion_fuente IS NULL) OR ((ubicacion_fuente)::text = 'DISPOSITIVO'::text))),
    CONSTRAINT verificacion_llamadas_ubicacion_precision CHECK (((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric))),
    CONSTRAINT verificacion_llamadas_ubicacion_rango CHECK (((ubicacion_latitud IS NULL) OR (((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric)))))
);


--
-- Name: TABLE verificacion_llamadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_llamadas IS 'Intentos de llamada declarados por el verificador durante la verificacion individual.';


--
-- Name: COLUMN verificacion_llamadas.canal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.canal IS 'Canal utilizado: TELEFONICA o WHATSAPP.';


--
-- Name: COLUMN verificacion_llamadas.resultado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.resultado IS 'Resultado declarado: CONTESTADA o NO_CONTESTADA.';


--
-- Name: COLUMN verificacion_llamadas.idempotency_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.idempotency_key IS 'Clave estable del intento para evitar duplicados ante reintentos de red.';


--
-- Name: COLUMN verificacion_llamadas.ubicacion_latitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.ubicacion_latitud IS 'Latitud actual del dispositivo obtenida al confirmar el resultado de la llamada.';


--
-- Name: COLUMN verificacion_llamadas.ubicacion_longitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.ubicacion_longitud IS 'Longitud actual del dispositivo obtenida al confirmar el resultado de la llamada.';


--
-- Name: COLUMN verificacion_llamadas.ubicacion_precision_metros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.ubicacion_precision_metros IS 'Precision horizontal en metros informada por el sistema operativo; puede ser NULL si no fue reportada.';


--
-- Name: COLUMN verificacion_llamadas.ubicacion_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.ubicacion_capturada_at IS 'Fecha y hora informada por el dispositivo para la lectura de ubicacion.';


--
-- Name: COLUMN verificacion_llamadas.ubicacion_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.ubicacion_fuente IS 'Fuente general de la coordenada; DISPOSITIVO puede combinar GPS, Wi-Fi y red movil.';


--
-- Name: COLUMN verificacion_llamadas.tipo_telefono; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.tipo_telefono IS 'Tipo del número utilizado: PRINCIPAL o SECUNDARIO. NULL sólo para intentos históricos sin este dato.';


--
-- Name: COLUMN verificacion_llamadas.telefono; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_llamadas.telefono IS 'Número normalizado de diez dígitos utilizado en el intento. NULL sólo para intentos históricos sin este dato.';


--
-- Name: verificacion_medidor_luz_respuestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_medidor_luz_respuestas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integrante_id uuid NOT NULL,
    fachada_id uuid NOT NULL,
    tiene_medidor boolean NOT NULL,
    motivo character varying(50),
    idempotency_key character varying(100) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_medidor_luz_respuestas_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_medidor_luz_respuestas_motivo_check CHECK ((((tiene_medidor = true) AND (motivo IS NULL)) OR ((tiene_medidor = false) AND ((motivo)::text = ANY ((ARRAY['SIN_SERVICIO_ELECTRICO'::character varying, 'SERVICIO_COMPARTIDO'::character varying, 'MEDIDOR_EN_OTRO_DOMICILIO'::character varying, 'MEDIDOR_RETIRADO_O_PENDIENTE'::character varying, 'UBICACION_DESCONOCIDA'::character varying])::text[])))))
);


--
-- Name: TABLE verificacion_medidor_luz_respuestas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_medidor_luz_respuestas IS 'Historial de respuestas sobre la existencia del medidor de luz para la fachada vigente en Verificacion.';


--
-- Name: COLUMN verificacion_medidor_luz_respuestas.fachada_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_medidor_luz_respuestas.fachada_id IS 'Fachada vigente a la que corresponde la respuesta; la API valida integrante y actualidad.';


--
-- Name: COLUMN verificacion_medidor_luz_respuestas.motivo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_medidor_luz_respuestas.motivo IS 'Causa controlada y obligatoria cuando el domicilio no tiene medidor de luz.';


--
-- Name: COLUMN verificacion_medidor_luz_respuestas.idempotency_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_medidor_luz_respuestas.idempotency_key IS 'Clave estable para evitar duplicados ante reintentos de red.';


--
-- Name: verificacion_visita_vecino_evidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_visita_vecino_evidencias (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_visita_vecino_evidencias_captura_fuente_check CHECK (((captura_fuente)::text = 'CAMARA'::text)),
    CONSTRAINT verificacion_visita_vecino_evidencias_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_visita_vecino_evidencias_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_visita_vecino_evidencias_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_visita_vecino_evidencias_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760))),
    CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_fuente_check CHECK (((ubicacion_fuente)::text = 'DISPOSITIVO'::text)),
    CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_precision CHECK (((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric))),
    CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_rango CHECK ((((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric))))
);


--
-- Name: TABLE verificacion_visita_vecino_evidencias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_visita_vecino_evidencias IS 'Fotografias geolocalizadas tomadas desde la camara despues de responder la pregunta al vecino.';


--
-- Name: COLUMN verificacion_visita_vecino_evidencias.ruta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_evidencias.ruta IS 'Ruta protegida del archivo; no es una URL publica.';


--
-- Name: COLUMN verificacion_visita_vecino_evidencias.captura_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_evidencias.captura_fuente IS 'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';


--
-- Name: COLUMN verificacion_visita_vecino_evidencias.foto_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_evidencias.foto_capturada_at IS 'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';


--
-- Name: COLUMN verificacion_visita_vecino_evidencias.ubicacion_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_evidencias.ubicacion_capturada_at IS 'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';


--
-- Name: verificacion_visita_vecino_fachadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_visita_vecino_fachadas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verificacion_visita_vecino_fachadas_captura_fuente_check CHECK (((captura_fuente)::text = 'CAMARA'::text)),
    CONSTRAINT verificacion_visita_vecino_fachadas_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_visita_vecino_fachadas_mime_check CHECK (((mime_type)::text = ANY ((ARRAY['image/jpeg'::character varying, 'image/png'::character varying])::text[]))),
    CONSTRAINT verificacion_visita_vecino_fachadas_sha256_check CHECK ((sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT verificacion_visita_vecino_fachadas_tamano_check CHECK (((tamano_bytes > 0) AND (tamano_bytes <= 10485760))),
    CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_fuente_check CHECK (((ubicacion_fuente)::text = 'DISPOSITIVO'::text)),
    CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_precision CHECK (((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric))),
    CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_rango CHECK ((((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric))))
);


--
-- Name: TABLE verificacion_visita_vecino_fachadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_visita_vecino_fachadas IS 'Fotografias de fachada capturadas desde la camara como primer paso de Visita al vecino.';


--
-- Name: COLUMN verificacion_visita_vecino_fachadas.ruta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_fachadas.ruta IS 'Ruta protegida del archivo; no es una URL publica.';


--
-- Name: COLUMN verificacion_visita_vecino_fachadas.captura_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_fachadas.captura_fuente IS 'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';


--
-- Name: COLUMN verificacion_visita_vecino_fachadas.foto_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_fachadas.foto_capturada_at IS 'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';


--
-- Name: COLUMN verificacion_visita_vecino_fachadas.ubicacion_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visita_vecino_fachadas.ubicacion_capturada_at IS 'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';


--
-- Name: verificacion_visitas_vecino; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificacion_visitas_vecino (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    integrante_id uuid NOT NULL,
    conoce_y_sabe_donde_vive boolean NOT NULL,
    idempotency_key character varying(100) NOT NULL,
    registrada_por uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ubicacion_latitud numeric(10,7) NOT NULL,
    ubicacion_longitud numeric(11,7) NOT NULL,
    ubicacion_precision_metros numeric(10,2),
    ubicacion_capturada_at timestamp with time zone NOT NULL,
    ubicacion_fuente character varying(20) NOT NULL,
    fachada_id uuid,
    CONSTRAINT verificacion_visitas_vecino_idempotencia_check CHECK (((char_length((idempotency_key)::text) >= 16) AND (char_length((idempotency_key)::text) <= 100))),
    CONSTRAINT verificacion_visitas_vecino_ubicacion_fuente_check CHECK (((ubicacion_fuente)::text = 'DISPOSITIVO'::text)),
    CONSTRAINT verificacion_visitas_vecino_ubicacion_precision CHECK (((ubicacion_precision_metros IS NULL) OR (ubicacion_precision_metros >= (0)::numeric))),
    CONSTRAINT verificacion_visitas_vecino_ubicacion_rango CHECK ((((ubicacion_latitud >= ('-90'::integer)::numeric) AND (ubicacion_latitud <= (90)::numeric)) AND ((ubicacion_longitud >= ('-180'::integer)::numeric) AND (ubicacion_longitud <= (180)::numeric))))
);


--
-- Name: TABLE verificacion_visitas_vecino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verificacion_visitas_vecino IS 'Confirmaciones declaradas por el verificador durante una visita al vecino.';


--
-- Name: COLUMN verificacion_visitas_vecino.conoce_y_sabe_donde_vive; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.conoce_y_sabe_donde_vive IS 'Respuesta a la pregunta combinada: conoce a la integrante y sabe donde vive.';


--
-- Name: COLUMN verificacion_visitas_vecino.idempotency_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.idempotency_key IS 'Clave estable de la confirmacion para evitar duplicados ante reintentos de red.';


--
-- Name: COLUMN verificacion_visitas_vecino.ubicacion_latitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.ubicacion_latitud IS 'Latitud actual del dispositivo obtenida al confirmar la respuesta de la visita al vecino.';


--
-- Name: COLUMN verificacion_visitas_vecino.ubicacion_longitud; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.ubicacion_longitud IS 'Longitud actual del dispositivo obtenida al confirmar la respuesta de la visita al vecino.';


--
-- Name: COLUMN verificacion_visitas_vecino.ubicacion_precision_metros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.ubicacion_precision_metros IS 'Precision horizontal en metros informada por el sistema operativo; puede ser NULL si no fue reportada.';


--
-- Name: COLUMN verificacion_visitas_vecino.ubicacion_capturada_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.ubicacion_capturada_at IS 'Fecha y hora informada por el dispositivo para la lectura de ubicacion.';


--
-- Name: COLUMN verificacion_visitas_vecino.ubicacion_fuente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.ubicacion_fuente IS 'Fuente general de la coordenada; DISPOSITIVO puede combinar GPS, Wi-Fi y red movil.';


--
-- Name: COLUMN verificacion_visitas_vecino.fachada_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.verificacion_visitas_vecino.fachada_id IS 'Fachada confirmada antes de responder al vecino; NULL unicamente para registros anteriores a la migracion 020.';


--
-- Name: zonas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zonas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    folio character varying(20),
    nombre character varying(100) NOT NULL,
    sucursal_id uuid NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVA'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: grupos PK_34de64ec8a5ecd99afb23b2bd62; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT "PK_34de64ec8a5ecd99afb23b2bd62" PRIMARY KEY (id);


--
-- Name: integrantes PK_84a7c0e72463897c53d0e1f4416; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT "PK_84a7c0e72463897c53d0e1f4416" PRIMARY KEY (id);


--
-- Name: expedientes PK_a5ea29a2665df2319ecbb8f4408; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT "PK_a5ea29a2665df2319ecbb8f4408" PRIMARY KEY (id);


--
-- Name: empleados_contacto asesoras_contacto_asesor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_contacto
    ADD CONSTRAINT asesoras_contacto_asesor_id_key UNIQUE (empleado_id);


--
-- Name: empleados_contacto asesoras_contacto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_contacto
    ADD CONSTRAINT asesoras_contacto_pkey PRIMARY KEY (id);


--
-- Name: empleados_datos_laborales asesoras_datos_laborales_asesor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_datos_laborales
    ADD CONSTRAINT asesoras_datos_laborales_asesor_id_key UNIQUE (empleado_id);


--
-- Name: empleados_datos_laborales asesoras_datos_laborales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_datos_laborales
    ADD CONSTRAINT asesoras_datos_laborales_pkey PRIMARY KEY (id);


--
-- Name: empleados_documentos asesoras_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_documentos
    ADD CONSTRAINT asesoras_documentos_pkey PRIMARY KEY (id);


--
-- Name: empleados_domicilios asesoras_domicilios_asesor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_domicilios
    ADD CONSTRAINT asesoras_domicilios_asesor_id_key UNIQUE (empleado_id);


--
-- Name: empleados_domicilios asesoras_domicilios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_domicilios
    ADD CONSTRAINT asesoras_domicilios_pkey PRIMARY KEY (id);


--
-- Name: empleados asesoras_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT asesoras_folio_key UNIQUE (folio);


--
-- Name: empleados asesoras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT asesoras_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: backup_tesoreras_20260802 backup_tesoreras_20260802_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_tesoreras_20260802
    ADD CONSTRAINT backup_tesoreras_20260802_pkey PRIMARY KEY (id);


--
-- Name: caja_movimientos caja_movimientos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_movimientos
    ADD CONSTRAINT caja_movimientos_folio_key UNIQUE (folio);


--
-- Name: caja_movimientos caja_movimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_movimientos
    ADD CONSTRAINT caja_movimientos_pkey PRIMARY KEY (id);


--
-- Name: calendario_pagos calendario_pagos_credito_id_numero_pago_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_pagos
    ADD CONSTRAINT calendario_pagos_credito_id_numero_pago_key UNIQUE (credito_id, numero_pago);


--
-- Name: calendario_pagos calendario_pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_pagos
    ADD CONSTRAINT calendario_pagos_pkey PRIMARY KEY (id);


--
-- Name: ciclos ciclos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_folio_key UNIQUE (folio);


--
-- Name: ciclos ciclos_grupo_id_numero_ciclo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_grupo_id_numero_ciclo_key UNIQUE (grupo_id, numero_ciclo);


--
-- Name: ciclos ciclos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_pkey PRIMARY KEY (id);


--
-- Name: codigos_postales codigos_postales_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_postales
    ADD CONSTRAINT codigos_postales_folio_key UNIQUE (folio);


--
-- Name: codigos_postales codigos_postales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_postales
    ADD CONSTRAINT codigos_postales_pkey PRIMARY KEY (id);


--
-- Name: creditos creditos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos
    ADD CONSTRAINT creditos_folio_key UNIQUE (folio);


--
-- Name: creditos creditos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos
    ADD CONSTRAINT creditos_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_usuario_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_usuario_id_unique UNIQUE (usuario_id);


--
-- Name: expedientes expedientes_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_folio_key UNIQUE (folio);


--
-- Name: grupos grupos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_folio_key UNIQUE (folio);


--
-- Name: historial_grupos_ciclos historial_grupos_ciclos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT historial_grupos_ciclos_pkey PRIMARY KEY (id);


--
-- Name: historial_grupos_ciclos_semanas historial_grupos_ciclos_semanas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos_semanas
    ADD CONSTRAINT historial_grupos_ciclos_semanas_pkey PRIMARY KEY (id);


--
-- Name: importaciones_excel importaciones_excel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importaciones_excel
    ADD CONSTRAINT importaciones_excel_pkey PRIMARY KEY (id);


--
-- Name: integrantes integrantes_expediente_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT integrantes_expediente_id_id_key UNIQUE (expediente_id, id);


--
-- Name: integrantes integrantes_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT integrantes_folio_key UNIQUE (folio);


--
-- Name: mora mora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mora
    ADD CONSTRAINT mora_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_folio_key UNIQUE (folio);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: personas personas_curp_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_curp_key UNIQUE (curp);


--
-- Name: personas personas_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_folio_key UNIQUE (folio);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: productos_credito productos_credito_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos_credito
    ADD CONSTRAINT productos_credito_folio_key UNIQUE (folio);


--
-- Name: productos_credito productos_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos_credito
    ADD CONSTRAINT productos_credito_pkey PRIMARY KEY (id);


--
-- Name: reestructuras reestructuras_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reestructuras
    ADD CONSTRAINT reestructuras_folio_key UNIQUE (folio);


--
-- Name: reestructuras reestructuras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reestructuras
    ADD CONSTRAINT reestructuras_pkey PRIMARY KEY (id);


--
-- Name: roles roles_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_folio_key UNIQUE (folio);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: solicitudes_beneficiarios solicitudes_beneficiarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_beneficiarios
    ADD CONSTRAINT solicitudes_beneficiarios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_beneficiarios solicitudes_beneficiarios_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_beneficiarios
    ADD CONSTRAINT solicitudes_beneficiarios_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes_datos_personales solicitudes_datos_personales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_datos_personales
    ADD CONSTRAINT solicitudes_datos_personales_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_datos_personales solicitudes_datos_personales_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_datos_personales
    ADD CONSTRAINT solicitudes_datos_personales_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes_documentos solicitudes_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_documentos
    ADD CONSTRAINT solicitudes_documentos_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_documentos solicitudes_documentos_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_documentos
    ADD CONSTRAINT solicitudes_documentos_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes_domicilios solicitudes_domicilios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_domicilios
    ADD CONSTRAINT solicitudes_domicilios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_domicilios solicitudes_domicilios_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_domicilios
    ADD CONSTRAINT solicitudes_domicilios_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes_negocios solicitudes_negocios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_negocios
    ADD CONSTRAINT solicitudes_negocios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_negocios solicitudes_negocios_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_negocios
    ADD CONSTRAINT solicitudes_negocios_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes solicitudes_persona_numero_credito_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_persona_numero_credito_unique UNIQUE (persona_id, numero_credito);


--
-- Name: solicitudes solicitudes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_referencias solicitudes_referencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_referencias
    ADD CONSTRAINT solicitudes_referencias_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_referencias solicitudes_referencias_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_referencias
    ADD CONSTRAINT solicitudes_referencias_unique UNIQUE (solicitud_id);


--
-- Name: solicitudes_validaciones solicitudes_validaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_validaciones
    ADD CONSTRAINT solicitudes_validaciones_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_validaciones solicitudes_validaciones_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_validaciones
    ADD CONSTRAINT solicitudes_validaciones_unique UNIQUE (solicitud_id);


--
-- Name: sucursales sucursales_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_folio_key UNIQUE (folio);


--
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id);


--
-- Name: ciclos uq_ciclos_expediente_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT uq_ciclos_expediente_id UNIQUE (expediente_id);


--
-- Name: expedientes uq_expedientes_ciclo_historico_origen; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT uq_expedientes_ciclo_historico_origen UNIQUE (ciclo_historico_origen_id);


--
-- Name: expedientes uq_expedientes_id_grupo_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT uq_expedientes_id_grupo_id UNIQUE (id, grupo_id);


--
-- Name: historial_grupos_ciclos uq_historial_grupos_ciclos_id_grupo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT uq_historial_grupos_ciclos_id_grupo UNIQUE (id, grupo_id);


--
-- Name: historial_grupos_ciclos uq_historial_grupos_ciclos_importacion_clave; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT uq_historial_grupos_ciclos_importacion_clave UNIQUE (importacion_id, clave_origen);


--
-- Name: historial_grupos_ciclos_semanas uq_historial_grupos_ciclos_semanas_fila; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos_semanas
    ADD CONSTRAINT uq_historial_grupos_ciclos_semanas_fila UNIQUE (ciclo_historico_id, fila_excel);


--
-- Name: importaciones_excel uq_importaciones_excel_fuente_hash; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importaciones_excel
    ADD CONSTRAINT uq_importaciones_excel_fuente_hash UNIQUE (tipo_fuente, archivo_sha256);


--
-- Name: integrantes uq_integrante_expediente_persona; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT uq_integrante_expediente_persona UNIQUE (expediente_id, persona_id);


--
-- Name: usuarios usuarios_new_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_new_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_new_pkey PRIMARY KEY (id);


--
-- Name: verificacion_entrevista_telefono_confirmaciones ux_verificacion_entrevista_telefono_llamada; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT ux_verificacion_entrevista_telefono_llamada UNIQUE (llamada_id);


--
-- Name: verificacion_llamada_caracteristicas ux_verificacion_llamada_caracteristica; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_caracteristicas
    ADD CONSTRAINT ux_verificacion_llamada_caracteristica UNIQUE (encuesta_id, clave);


--
-- Name: verificacion_entrevista_desacuerdos_montos verificacion_entrevista_desacuerdos_montos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_desacuerdos_montos
    ADD CONSTRAINT verificacion_entrevista_desacuerdos_montos_pkey PRIMARY KEY (id);


--
-- Name: verificacion_entrevista_familiares verificacion_entrevista_familiares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_familiares
    ADD CONSTRAINT verificacion_entrevista_familiares_pkey PRIMARY KEY (id);


--
-- Name: verificacion_entrevista_evidencias verificacion_entrevista_negocio_evidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_evidencias
    ADD CONSTRAINT verificacion_entrevista_negocio_evidencias_pkey PRIMARY KEY (id);


--
-- Name: verificacion_entrevista_telefono_confirmaciones verificacion_entrevista_telefono_confirmaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT verificacion_entrevista_telefono_confirmaciones_pkey PRIMARY KEY (id);


--
-- Name: verificacion_entrevistas verificacion_entrevistas_id_expediente_unico; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_id_expediente_unico UNIQUE (id, expediente_id);


--
-- Name: verificacion_entrevistas verificacion_entrevistas_integrante_unica; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_integrante_unica UNIQUE (integrante_id);


--
-- Name: verificacion_entrevistas verificacion_entrevistas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_imagenes_domicilio verificacion_imagenes_domicilio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_imagenes_domicilio
    ADD CONSTRAINT verificacion_imagenes_domicilio_pkey PRIMARY KEY (id);


--
-- Name: verificacion_llamada_caracteristicas verificacion_llamada_caracteristicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_caracteristicas
    ADD CONSTRAINT verificacion_llamada_caracteristicas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_llamada_encuestas verificacion_llamada_encuestas_llamada_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_encuestas
    ADD CONSTRAINT verificacion_llamada_encuestas_llamada_id_key UNIQUE (llamada_id);


--
-- Name: verificacion_llamada_encuestas verificacion_llamada_encuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_encuestas
    ADD CONSTRAINT verificacion_llamada_encuestas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_llamada_evidencias verificacion_llamada_evidencias_encuesta_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_evidencias
    ADD CONSTRAINT verificacion_llamada_evidencias_encuesta_id_key UNIQUE (encuesta_id);


--
-- Name: verificacion_llamada_evidencias verificacion_llamada_evidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_evidencias
    ADD CONSTRAINT verificacion_llamada_evidencias_pkey PRIMARY KEY (id);


--
-- Name: verificacion_llamadas verificacion_llamadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamadas
    ADD CONSTRAINT verificacion_llamadas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_medidor_luz_respuestas verificacion_medidor_luz_respuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_medidor_luz_respuestas
    ADD CONSTRAINT verificacion_medidor_luz_respuestas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_visita_vecino_evidencias verificacion_visita_vecino_evidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_evidencias
    ADD CONSTRAINT verificacion_visita_vecino_evidencias_pkey PRIMARY KEY (id);


--
-- Name: verificacion_visita_vecino_fachadas verificacion_visita_vecino_fachadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_fachadas
    ADD CONSTRAINT verificacion_visita_vecino_fachadas_pkey PRIMARY KEY (id);


--
-- Name: verificacion_visitas_vecino verificacion_visitas_vecino_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visitas_vecino
    ADD CONSTRAINT verificacion_visitas_vecino_pkey PRIMARY KEY (id);


--
-- Name: zonas zonas_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_folio_key UNIQUE (folio);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: idx_asesoras_curp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_curp ON public.empleados USING btree (curp);


--
-- Name: idx_asesoras_documentos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_documentos_estado ON public.empleados_documentos USING btree (estado);


--
-- Name: idx_asesoras_documentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_documentos_tipo ON public.empleados_documentos USING btree (tipo_documento);


--
-- Name: idx_asesoras_domicilios_latlon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_domicilios_latlon ON public.empleados_domicilios USING btree (latitud, longitud);


--
-- Name: idx_asesoras_laborales_jefe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_laborales_jefe ON public.empleados_datos_laborales USING btree (jefe_inmediato_id);


--
-- Name: idx_asesoras_laborales_sucursal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_laborales_sucursal ON public.empleados_datos_laborales USING btree (sucursal_id);


--
-- Name: idx_asesoras_zona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asesoras_zona ON public.empleados USING btree (zona_id);


--
-- Name: idx_audit_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_fecha ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_tabla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_tabla ON public.audit_log USING btree (tabla, registro_id);


--
-- Name: idx_audit_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_usuario ON public.audit_log USING btree (usuario_id);


--
-- Name: idx_beneficiarios_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beneficiarios_solicitud ON public.solicitudes_beneficiarios USING btree (solicitud_id);


--
-- Name: idx_caja_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_caja_fecha ON public.caja_movimientos USING btree (fecha_movimiento);


--
-- Name: idx_caja_sucursal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_caja_sucursal ON public.caja_movimientos USING btree (sucursal_id);


--
-- Name: idx_calendario_credito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendario_credito ON public.calendario_pagos USING btree (credito_id);


--
-- Name: idx_cp_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_codigo ON public.codigos_postales USING btree (codigo);


--
-- Name: idx_cp_colonia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_colonia ON public.codigos_postales USING btree (colonia);


--
-- Name: idx_cp_municipio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_municipio ON public.codigos_postales USING btree (municipio);


--
-- Name: idx_creditos_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creditos_expediente ON public.creditos USING btree (expediente_id);


--
-- Name: idx_creditos_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_creditos_persona ON public.creditos USING btree (persona_id);


--
-- Name: idx_datos_personales_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datos_personales_solicitud ON public.solicitudes_datos_personales USING btree (solicitud_id);


--
-- Name: idx_documentos_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_solicitud ON public.solicitudes_documentos USING btree (solicitud_id);


--
-- Name: idx_empleados_contacto_empleado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empleados_contacto_empleado ON public.empleados_contacto USING btree (empleado_id);


--
-- Name: idx_empleados_documentos_empleado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empleados_documentos_empleado ON public.empleados_documentos USING btree (empleado_id);


--
-- Name: idx_empleados_domicilios_empleado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empleados_domicilios_empleado ON public.empleados_domicilios USING btree (empleado_id);


--
-- Name: idx_empleados_laborales_empleado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empleados_laborales_empleado ON public.empleados_datos_laborales USING btree (empleado_id);


--
-- Name: idx_expedientes_grupo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expedientes_grupo_id ON public.expedientes USING btree (grupo_id);


--
-- Name: idx_grupos_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grupos_nombre ON public.grupos USING btree (nombre);


--
-- Name: idx_integrantes_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_integrantes_expediente ON public.integrantes USING btree (expediente_id);


--
-- Name: idx_integrantes_expediente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_integrantes_expediente_id ON public.integrantes USING btree (expediente_id);


--
-- Name: idx_integrantes_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_integrantes_persona ON public.integrantes USING btree (persona_id);


--
-- Name: idx_integrantes_persona_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_integrantes_persona_id ON public.integrantes USING btree (persona_id);


--
-- Name: idx_pagos_credito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_credito ON public.pagos USING btree (credito_id);


--
-- Name: idx_pagos_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_persona ON public.pagos USING btree (persona_id);


--
-- Name: idx_personas_curp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personas_curp ON public.personas USING btree (curp);


--
-- Name: idx_personas_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personas_nombre ON public.personas USING btree (apellido_pat, primer_nombre);


--
-- Name: idx_personas_nombre_completo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personas_nombre_completo ON public.personas USING gin (to_tsvector('spanish'::regconfig, (nombre_completo)::text));


--
-- Name: idx_personas_nombre_completo_btree; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_personas_nombre_completo_btree ON public.personas USING btree (nombre_completo);


--
-- Name: idx_referencias_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referencias_solicitud ON public.solicitudes_referencias USING btree (solicitud_id);


--
-- Name: idx_solicitudes_datos_personales_nombre_completo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_datos_personales_nombre_completo ON public.solicitudes_datos_personales USING gin (to_tsvector('spanish'::regconfig, (nombre_completo)::text)) WHERE (nombre_completo IS NOT NULL);


--
-- Name: idx_solicitudes_domicilios_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_domicilios_solicitud ON public.solicitudes_domicilios USING btree (solicitud_id);


--
-- Name: idx_solicitudes_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_expediente ON public.solicitudes USING btree (expediente_id);


--
-- Name: idx_solicitudes_folio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_folio ON public.solicitudes USING btree (folio);


--
-- Name: idx_solicitudes_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_grupo ON public.solicitudes USING btree (grupo_id);


--
-- Name: idx_solicitudes_negocios_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_negocios_solicitud ON public.solicitudes_negocios USING btree (solicitud_id);


--
-- Name: idx_solicitudes_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitudes_persona ON public.solicitudes USING btree (persona_id);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol_id);


--
-- Name: idx_usuarios_sucursal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_sucursal ON public.usuarios USING btree (sucursal_id);


--
-- Name: idx_validaciones_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validaciones_solicitud ON public.solicitudes_validaciones USING btree (solicitud_id);


--
-- Name: ix_expedientes_importacion_integrantes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_expedientes_importacion_integrantes ON public.expedientes USING btree (importacion_integrantes_id) WHERE (importacion_integrantes_id IS NOT NULL);


--
-- Name: ix_expedientes_tesorera_integrante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_expedientes_tesorera_integrante ON public.expedientes USING btree (tesorera_integrante_id) WHERE (tesorera_integrante_id IS NOT NULL);


--
-- Name: ix_historial_grupos_ciclos_asesora_vigente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_historial_grupos_ciclos_asesora_vigente ON public.historial_grupos_ciclos USING btree (asesora_id, vigente_en_corte);


--
-- Name: ix_historial_grupos_ciclos_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_historial_grupos_ciclos_grupo ON public.historial_grupos_ciclos USING btree (grupo_id, numero_ciclo);


--
-- Name: ix_historial_grupos_ciclos_importacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_historial_grupos_ciclos_importacion ON public.historial_grupos_ciclos USING btree (importacion_id);


--
-- Name: ix_historial_grupos_ciclos_semanas_ciclo_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_historial_grupos_ciclos_semanas_ciclo_semana ON public.historial_grupos_ciclos_semanas USING btree (ciclo_historico_id, semana);


--
-- Name: ix_verificacion_entrevista_desacuerdos_integrante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_entrevista_desacuerdos_integrante ON public.verificacion_entrevista_desacuerdos_montos USING btree (entrevista_id, integrante_objetivo_id, created_at DESC);


--
-- Name: ix_verificacion_entrevista_evidencia_integrante_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_entrevista_evidencia_integrante_fecha ON public.verificacion_entrevista_evidencias USING btree (integrante_id, created_at);


--
-- Name: ix_verificacion_entrevista_familiares_integrante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_entrevista_familiares_integrante ON public.verificacion_entrevista_familiares USING btree (entrevista_id, familiar_integrante_id, created_at DESC);


--
-- Name: ix_verificacion_entrevista_telefono_integrante_tipo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_entrevista_telefono_integrante_tipo_fecha ON public.verificacion_entrevista_telefono_confirmaciones USING btree (integrante_id, tipo_telefono, created_at DESC);


--
-- Name: ix_verificacion_entrevistas_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_entrevistas_expediente ON public.verificacion_entrevistas USING btree (expediente_id, updated_at DESC);


--
-- Name: ix_verificacion_imagenes_domicilio_integrante_tipo_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_imagenes_domicilio_integrante_tipo_fecha ON public.verificacion_imagenes_domicilio USING btree (integrante_id, tipo, created_at DESC);


--
-- Name: ix_verificacion_llamada_caracteristicas_encuesta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_llamada_caracteristicas_encuesta ON public.verificacion_llamada_caracteristicas USING btree (encuesta_id);


--
-- Name: ix_verificacion_llamada_encuestas_completada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_llamada_encuestas_completada ON public.verificacion_llamada_encuestas USING btree (completada_at DESC) WHERE (completada_at IS NOT NULL);


--
-- Name: ix_verificacion_llamada_evidencias_llamada_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_llamada_evidencias_llamada_fecha ON public.verificacion_llamada_evidencias USING btree (llamada_id, created_at DESC);


--
-- Name: ix_verificacion_llamadas_integrante_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_llamadas_integrante_fecha ON public.verificacion_llamadas USING btree (integrante_id, created_at DESC);


--
-- Name: ix_verificacion_llamadas_integrante_tipo_telefono_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_llamadas_integrante_tipo_telefono_fecha ON public.verificacion_llamadas USING btree (integrante_id, tipo_telefono, created_at DESC) WHERE (telefono IS NOT NULL);


--
-- Name: ix_verificacion_medidor_luz_integrante_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_medidor_luz_integrante_fecha ON public.verificacion_medidor_luz_respuestas USING btree (integrante_id, created_at DESC);


--
-- Name: ix_verificacion_visita_vecino_evidencias_visita_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_visita_vecino_evidencias_visita_fecha ON public.verificacion_visita_vecino_evidencias USING btree (visita_id, created_at DESC);


--
-- Name: ix_verificacion_visita_vecino_fachadas_integrante_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_visita_vecino_fachadas_integrante_fecha ON public.verificacion_visita_vecino_fachadas USING btree (integrante_id, created_at DESC);


--
-- Name: ix_verificacion_visitas_vecino_fachada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_visitas_vecino_fachada ON public.verificacion_visitas_vecino USING btree (fachada_id) WHERE (fachada_id IS NOT NULL);


--
-- Name: ix_verificacion_visitas_vecino_integrante_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_verificacion_visitas_vecino_integrante_fecha ON public.verificacion_visitas_vecino USING btree (integrante_id, created_at DESC);


--
-- Name: solicitudes_integrante_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX solicitudes_integrante_unique ON public.solicitudes USING btree (integrante_id) WHERE (integrante_id IS NOT NULL);


--
-- Name: uq_importaciones_excel_base_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_importaciones_excel_base_activa ON public.importaciones_excel USING btree (tipo_fuente) WHERE (es_base_activa = true);


--
-- Name: ux_usuarios_abreviatura_ci; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_usuarios_abreviatura_ci ON public.usuarios USING btree (upper((abreviatura)::text)) WHERE (abreviatura IS NOT NULL);


--
-- Name: ux_verificacion_entrevista_evidencia_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_entrevista_evidencia_actor_idempotencia ON public.verificacion_entrevista_evidencias USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_imagenes_domicilio_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_imagenes_domicilio_actor_idempotencia ON public.verificacion_imagenes_domicilio USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_llamada_evidencias_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_llamada_evidencias_version ON public.verificacion_llamada_evidencias USING btree (llamada_id, proposito, version);


--
-- Name: ux_verificacion_llamadas_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_llamadas_actor_idempotencia ON public.verificacion_llamadas USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_medidor_luz_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_medidor_luz_actor_idempotencia ON public.verificacion_medidor_luz_respuestas USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_visita_vecino_evidencias_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_visita_vecino_evidencias_actor_idempotencia ON public.verificacion_visita_vecino_evidencias USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_visita_vecino_fachadas_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_visita_vecino_fachadas_actor_idempotencia ON public.verificacion_visita_vecino_fachadas USING btree (registrada_por, idempotency_key);


--
-- Name: ux_verificacion_visitas_vecino_actor_idempotencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_verificacion_visitas_vecino_actor_idempotencia ON public.verificacion_visitas_vecino USING btree (registrada_por, idempotency_key);


--
-- Name: integrantes FK_2ce578059a16ac9921991c307b1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT "FK_2ce578059a16ac9921991c307b1" FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id);


--
-- Name: expedientes FK_aca6e52d776906c1c5eb57dd6c7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT "FK_aca6e52d776906c1c5eb57dd6c7" FOREIGN KEY (grupo_id) REFERENCES public.grupos(id);


--
-- Name: empleados asesoras_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT asesoras_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- Name: caja_movimientos caja_movimientos_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_movimientos
    ADD CONSTRAINT caja_movimientos_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: calendario_pagos calendario_pagos_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_pagos
    ADD CONSTRAINT calendario_pagos_credito_id_fkey FOREIGN KEY (credito_id) REFERENCES public.creditos(id);


--
-- Name: ciclos ciclos_asesora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_asesora_id_fkey FOREIGN KEY (asesora_id) REFERENCES public.empleados(id);


--
-- Name: ciclos ciclos_grupo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id);


--
-- Name: ciclos ciclos_tesorera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT ciclos_tesorera_id_fkey FOREIGN KEY (tesorera_id) REFERENCES public.personas(id);


--
-- Name: creditos creditos_expediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos
    ADD CONSTRAINT creditos_expediente_id_fkey FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id);


--
-- Name: creditos creditos_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos
    ADD CONSTRAINT creditos_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id);


--
-- Name: expedientes expedientes_asesora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_asesora_id_fkey FOREIGN KEY (asesora_id) REFERENCES public.empleados(id);


--
-- Name: expedientes expedientes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos_credito(id);


--
-- Name: expedientes expedientes_tesorera_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_tesorera_integrante_fkey FOREIGN KEY (id, tesorera_integrante_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: solicitudes_beneficiarios fk_beneficiario_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_beneficiarios
    ADD CONSTRAINT fk_beneficiario_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: ciclos fk_ciclos_expediente_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciclos
    ADD CONSTRAINT fk_ciclos_expediente_grupo FOREIGN KEY (expediente_id, grupo_id) REFERENCES public.expedientes(id, grupo_id) ON DELETE RESTRICT;


--
-- Name: empleados_contacto fk_contacto_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_contacto
    ADD CONSTRAINT fk_contacto_empleado FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: creditos fk_creditos_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos
    ADD CONSTRAINT fk_creditos_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE RESTRICT;


--
-- Name: solicitudes_datos_personales fk_datos_personales_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_datos_personales
    ADD CONSTRAINT fk_datos_personales_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: empleados_documentos fk_documento_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_documentos
    ADD CONSTRAINT fk_documento_empleado FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: solicitudes_documentos fk_documentos_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_documentos
    ADD CONSTRAINT fk_documentos_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: empleados_domicilios fk_domicilio_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_domicilios
    ADD CONSTRAINT fk_domicilio_empleado FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: solicitudes_domicilios fk_domicilio_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_domicilios
    ADD CONSTRAINT fk_domicilio_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: empleados fk_empleados_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT fk_empleados_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: expedientes fk_expedientes_ciclo_historico_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expedientes_ciclo_historico_grupo FOREIGN KEY (ciclo_historico_origen_id, grupo_id) REFERENCES public.historial_grupos_ciclos(id, grupo_id) ON DELETE RESTRICT;


--
-- Name: expedientes fk_expedientes_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expedientes_grupo FOREIGN KEY (grupo_id) REFERENCES public.grupos(id);


--
-- Name: expedientes fk_expedientes_importacion_integrantes; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expedientes_importacion_integrantes FOREIGN KEY (importacion_integrantes_id) REFERENCES public.importaciones_excel(id) ON DELETE RESTRICT;


--
-- Name: historial_grupos_ciclos fk_historial_grupos_ciclos_asesora; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT fk_historial_grupos_ciclos_asesora FOREIGN KEY (asesora_id) REFERENCES public.empleados(id) ON DELETE RESTRICT;


--
-- Name: historial_grupos_ciclos fk_historial_grupos_ciclos_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT fk_historial_grupos_ciclos_grupo FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON DELETE RESTRICT;


--
-- Name: historial_grupos_ciclos fk_historial_grupos_ciclos_importacion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos
    ADD CONSTRAINT fk_historial_grupos_ciclos_importacion FOREIGN KEY (importacion_id) REFERENCES public.importaciones_excel(id) ON DELETE RESTRICT;


--
-- Name: historial_grupos_ciclos_semanas fk_historial_grupos_ciclos_semanas_ciclo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_grupos_ciclos_semanas
    ADD CONSTRAINT fk_historial_grupos_ciclos_semanas_ciclo FOREIGN KEY (ciclo_historico_id) REFERENCES public.historial_grupos_ciclos(id) ON DELETE RESTRICT;


--
-- Name: importaciones_excel fk_importaciones_excel_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importaciones_excel
    ADD CONSTRAINT fk_importaciones_excel_usuario FOREIGN KEY (creado_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: empleados_datos_laborales fk_laboral_empleado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_datos_laborales
    ADD CONSTRAINT fk_laboral_empleado FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: empleados_datos_laborales fk_laboral_jefe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_datos_laborales
    ADD CONSTRAINT fk_laboral_jefe FOREIGN KEY (jefe_inmediato_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: empleados_datos_laborales fk_laboral_sucursal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados_datos_laborales
    ADD CONSTRAINT fk_laboral_sucursal FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE SET NULL;


--
-- Name: solicitudes_negocios fk_negocio_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_negocios
    ADD CONSTRAINT fk_negocio_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: solicitudes_referencias fk_referencias_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_referencias
    ADD CONSTRAINT fk_referencias_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: solicitudes fk_solicitudes_credito; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT fk_solicitudes_credito FOREIGN KEY (credito_id) REFERENCES public.creditos(id) ON DELETE RESTRICT;


--
-- Name: solicitudes_domicilios fk_solicitudes_domicilios_dom_cp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_domicilios
    ADD CONSTRAINT fk_solicitudes_domicilios_dom_cp FOREIGN KEY (dom_cp_id) REFERENCES public.codigos_postales(id) ON DELETE RESTRICT;


--
-- Name: solicitudes fk_solicitudes_expediente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT fk_solicitudes_expediente FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id) ON DELETE RESTRICT;


--
-- Name: solicitudes fk_solicitudes_grupo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT fk_solicitudes_grupo FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON DELETE RESTRICT;


--
-- Name: solicitudes fk_solicitudes_integrante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT fk_solicitudes_integrante FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: solicitudes_negocios fk_solicitudes_negocios_negocio_cp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_negocios
    ADD CONSTRAINT fk_solicitudes_negocios_negocio_cp FOREIGN KEY (negocio_cp_id) REFERENCES public.codigos_postales(id) ON DELETE RESTRICT;


--
-- Name: solicitudes fk_solicitudes_persona; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT fk_solicitudes_persona FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE RESTRICT;


--
-- Name: usuarios fk_usuarios_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: usuarios fk_usuarios_sucursal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_sucursal FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE RESTRICT;


--
-- Name: solicitudes_validaciones fk_validaciones_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_validaciones
    ADD CONSTRAINT fk_validaciones_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: grupos grupos_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: grupos grupos_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- Name: integrantes integrantes_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT integrantes_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id);


--
-- Name: integrantes integrantes_retirada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrantes
    ADD CONSTRAINT integrantes_retirada_por_fkey FOREIGN KEY (retirada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: mora mora_calendario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mora
    ADD CONSTRAINT mora_calendario_id_fkey FOREIGN KEY (calendario_id) REFERENCES public.calendario_pagos(id);


--
-- Name: mora mora_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mora
    ADD CONSTRAINT mora_credito_id_fkey FOREIGN KEY (credito_id) REFERENCES public.creditos(id);


--
-- Name: pagos pagos_calendario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_calendario_id_fkey FOREIGN KEY (calendario_id) REFERENCES public.calendario_pagos(id);


--
-- Name: pagos pagos_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_credito_id_fkey FOREIGN KEY (credito_id) REFERENCES public.creditos(id);


--
-- Name: pagos pagos_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id);


--
-- Name: reestructuras reestructuras_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reestructuras
    ADD CONSTRAINT reestructuras_credito_id_fkey FOREIGN KEY (credito_id) REFERENCES public.creditos(id);


--
-- Name: verificacion_entrevista_desacuerdos_montos verificacion_entrevista_desacuerdos_entrevista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_desacuerdos_montos
    ADD CONSTRAINT verificacion_entrevista_desacuerdos_entrevista_fkey FOREIGN KEY (entrevista_id, expediente_id) REFERENCES public.verificacion_entrevistas(id, expediente_id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_desacuerdos_montos verificacion_entrevista_desacuerdos_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_desacuerdos_montos
    ADD CONSTRAINT verificacion_entrevista_desacuerdos_integrante_fkey FOREIGN KEY (expediente_id, integrante_objetivo_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_desacuerdos_montos verificacion_entrevista_desacuerdos_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_desacuerdos_montos
    ADD CONSTRAINT verificacion_entrevista_desacuerdos_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_familiares verificacion_entrevista_familiares_entrevista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_familiares
    ADD CONSTRAINT verificacion_entrevista_familiares_entrevista_fkey FOREIGN KEY (entrevista_id, expediente_id) REFERENCES public.verificacion_entrevistas(id, expediente_id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_familiares verificacion_entrevista_familiares_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_familiares
    ADD CONSTRAINT verificacion_entrevista_familiares_integrante_fkey FOREIGN KEY (expediente_id, familiar_integrante_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_familiares verificacion_entrevista_familiares_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_familiares
    ADD CONSTRAINT verificacion_entrevista_familiares_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_evidencias verificacion_entrevista_negocio_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_evidencias
    ADD CONSTRAINT verificacion_entrevista_negocio_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_evidencias verificacion_entrevista_negocio_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_evidencias
    ADD CONSTRAINT verificacion_entrevista_negocio_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_telefono_confirmaciones verificacion_entrevista_telefono_evidencia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT verificacion_entrevista_telefono_evidencia_fkey FOREIGN KEY (evidencia_id) REFERENCES public.verificacion_llamada_evidencias(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_telefono_confirmaciones verificacion_entrevista_telefono_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT verificacion_entrevista_telefono_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_telefono_confirmaciones verificacion_entrevista_telefono_llamada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT verificacion_entrevista_telefono_llamada_fkey FOREIGN KEY (llamada_id) REFERENCES public.verificacion_llamadas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevista_telefono_confirmaciones verificacion_entrevista_telefono_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevista_telefono_confirmaciones
    ADD CONSTRAINT verificacion_entrevista_telefono_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevistas verificacion_entrevistas_actualizada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_actualizada_por_fkey FOREIGN KEY (actualizada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevistas verificacion_entrevistas_domicilio_recoleccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_fkey FOREIGN KEY (expediente_id, domicilio_recoleccion_integrante_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevistas verificacion_entrevistas_entrevistada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_entrevistada_por_fkey FOREIGN KEY (entrevistada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevistas verificacion_entrevistas_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_integrante_fkey FOREIGN KEY (expediente_id, integrante_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: verificacion_entrevistas verificacion_entrevistas_tesorera_reconocida_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_entrevistas
    ADD CONSTRAINT verificacion_entrevistas_tesorera_reconocida_fkey FOREIGN KEY (expediente_id, tesorera_reconocida_integrante_id) REFERENCES public.integrantes(expediente_id, id) ON DELETE RESTRICT;


--
-- Name: verificacion_imagenes_domicilio verificacion_imagenes_domicilio_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_imagenes_domicilio
    ADD CONSTRAINT verificacion_imagenes_domicilio_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_imagenes_domicilio verificacion_imagenes_domicilio_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_imagenes_domicilio
    ADD CONSTRAINT verificacion_imagenes_domicilio_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_caracteristicas verificacion_llamada_caracteristicas_encuesta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_caracteristicas
    ADD CONSTRAINT verificacion_llamada_caracteristicas_encuesta_fkey FOREIGN KEY (encuesta_id) REFERENCES public.verificacion_llamada_encuestas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_encuestas verificacion_llamada_encuestas_llamada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_encuestas
    ADD CONSTRAINT verificacion_llamada_encuestas_llamada_fkey FOREIGN KEY (llamada_id) REFERENCES public.verificacion_llamadas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_encuestas verificacion_llamada_encuestas_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_encuestas
    ADD CONSTRAINT verificacion_llamada_encuestas_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_evidencias verificacion_llamada_evidencias_encuesta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_evidencias
    ADD CONSTRAINT verificacion_llamada_evidencias_encuesta_fkey FOREIGN KEY (encuesta_id) REFERENCES public.verificacion_llamada_encuestas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_evidencias verificacion_llamada_evidencias_llamada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_evidencias
    ADD CONSTRAINT verificacion_llamada_evidencias_llamada_fkey FOREIGN KEY (llamada_id) REFERENCES public.verificacion_llamadas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamada_evidencias verificacion_llamada_evidencias_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamada_evidencias
    ADD CONSTRAINT verificacion_llamada_evidencias_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamadas verificacion_llamadas_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamadas
    ADD CONSTRAINT verificacion_llamadas_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_llamadas verificacion_llamadas_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_llamadas
    ADD CONSTRAINT verificacion_llamadas_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_medidor_luz_respuestas verificacion_medidor_luz_respuestas_fachada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_medidor_luz_respuestas
    ADD CONSTRAINT verificacion_medidor_luz_respuestas_fachada_fkey FOREIGN KEY (fachada_id) REFERENCES public.verificacion_imagenes_domicilio(id) ON DELETE RESTRICT;


--
-- Name: verificacion_medidor_luz_respuestas verificacion_medidor_luz_respuestas_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_medidor_luz_respuestas
    ADD CONSTRAINT verificacion_medidor_luz_respuestas_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_medidor_luz_respuestas verificacion_medidor_luz_respuestas_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_medidor_luz_respuestas
    ADD CONSTRAINT verificacion_medidor_luz_respuestas_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visita_vecino_evidencias verificacion_visita_vecino_evidencias_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_evidencias
    ADD CONSTRAINT verificacion_visita_vecino_evidencias_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visita_vecino_evidencias verificacion_visita_vecino_evidencias_visita_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_evidencias
    ADD CONSTRAINT verificacion_visita_vecino_evidencias_visita_fkey FOREIGN KEY (visita_id) REFERENCES public.verificacion_visitas_vecino(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visita_vecino_fachadas verificacion_visita_vecino_fachadas_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_fachadas
    ADD CONSTRAINT verificacion_visita_vecino_fachadas_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visita_vecino_fachadas verificacion_visita_vecino_fachadas_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visita_vecino_fachadas
    ADD CONSTRAINT verificacion_visita_vecino_fachadas_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visitas_vecino verificacion_visitas_vecino_fachada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visitas_vecino
    ADD CONSTRAINT verificacion_visitas_vecino_fachada_fkey FOREIGN KEY (fachada_id) REFERENCES public.verificacion_visita_vecino_fachadas(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visitas_vecino verificacion_visitas_vecino_integrante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visitas_vecino
    ADD CONSTRAINT verificacion_visitas_vecino_integrante_fkey FOREIGN KEY (integrante_id) REFERENCES public.integrantes(id) ON DELETE RESTRICT;


--
-- Name: verificacion_visitas_vecino verificacion_visitas_vecino_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificacion_visitas_vecino
    ADD CONSTRAINT verificacion_visitas_vecino_usuario_fkey FOREIGN KEY (registrada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: zonas zonas_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- PostgreSQL database dump complete
--

\unrestrict S6GLnGI5qk1bjYvVR70KkQZa0T9WrteXE8fuSvB5mdUnzVyBFLPFPK8bAtIDU0I

