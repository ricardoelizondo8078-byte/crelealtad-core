-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 1: CREAR TABLAS NUEVAS (16 tablas)
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MÓDULO 1: CATÁLOGOS
-- ============================================================

-- 1. codigos_postales
CREATE TABLE codigos_postales (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio       VARCHAR(20)  UNIQUE,
  codigo      VARCHAR(5)   NOT NULL,
  colonia     VARCHAR(100) NOT NULL,
  municipio   VARCHAR(100) NOT NULL,
  estado      VARCHAR(50)  NOT NULL DEFAULT 'Nuevo León',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cp_codigo ON codigos_postales(codigo);

-- 2. sucursales
CREATE TABLE sucursales (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio       VARCHAR(20)  UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  direccion   VARCHAR(200),
  telefono    VARCHAR(20),
  estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 3. zonas
CREATE TABLE zonas (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio        VARCHAR(20)  UNIQUE,
  nombre       VARCHAR(100) NOT NULL,
  sucursal_id  UUID         NOT NULL REFERENCES sucursales(id),
  estado       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA',
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. roles
CREATE TABLE roles (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio        VARCHAR(20)  UNIQUE,
  nombre       VARCHAR(50)  NOT NULL UNIQUE,
  descripcion  VARCHAR(200),
  permisos     JSONB,
  estado       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 5. usuarios
CREATE TABLE usuarios (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio         VARCHAR(20)  UNIQUE,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id        UUID         NOT NULL REFERENCES roles(id),
  sucursal_id   UUID         REFERENCES sucursales(id),
  estado        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 6. asesoras
CREATE TABLE asesoras (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio       VARCHAR(20)  UNIQUE,
  usuario_id  UUID         NOT NULL REFERENCES usuarios(id),
  zona_id     UUID         REFERENCES zonas(id),
  telefono    VARCHAR(20),
  estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 7. productos_credito
CREATE TABLE productos_credito (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio            VARCHAR(20)   UNIQUE,
  nombre           VARCHAR(100)  NOT NULL,
  descripcion      TEXT,
  tasa             DECIMAL(5,2)  NOT NULL,
  precio_seguro    DECIMAL(10,2) NOT NULL,
  costo_apertura   DECIMAL(10,2) NOT NULL,
  retencion        DECIMAL(5,2)  NOT NULL,
  num_semanas      INTEGER       NOT NULL,
  monto_minimo     DECIMAL(10,2) NOT NULL,
  monto_maximo     DECIMAL(10,2) NOT NULL,
  min_integrantes  INTEGER       NOT NULL DEFAULT 6,
  max_integrantes  INTEGER       NOT NULL DEFAULT 12,
  estado           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 2: PERSONAS
-- ============================================================

-- 8. personas
CREATE TABLE personas (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio          VARCHAR(20)  UNIQUE,
  curp           VARCHAR(18)  UNIQUE,
  primer_nombre  VARCHAR(50)  NOT NULL,
  segundo_nombre VARCHAR(50),
  apellido_pat   VARCHAR(50)  NOT NULL,
  apellido_mat   VARCHAR(50),
  fecha_nac      DATE,
  genero         VARCHAR(15),
  estado         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_personas_curp   ON personas(curp);
CREATE INDEX idx_personas_nombre ON personas(apellido_pat, primer_nombre);

-- ============================================================
-- MÓDULO 3: GRUPOS
-- ============================================================

-- 9. ciclos
CREATE TABLE ciclos (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio          VARCHAR(20)  UNIQUE,
  grupo_id       UUID         NOT NULL REFERENCES grupos(id),
  numero_ciclo   INTEGER      NOT NULL,
  expediente_id  UUID,
  asesora_id     UUID         NOT NULL REFERENCES asesoras(id),
  tesorera_id    UUID         NOT NULL REFERENCES personas(id),
  fecha_inicio   DATE         NOT NULL,
  fecha_fin      DATE,
  dia_pago       VARCHAR(15)  NOT NULL,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (grupo_id, numero_ciclo)
);

-- ============================================================
-- MÓDULO 7: CAJA
-- ============================================================

-- 10. caja_movimientos
CREATE TABLE caja_movimientos (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio             VARCHAR(20)   UNIQUE,
  tipo              VARCHAR(20)   NOT NULL,
  concepto          VARCHAR(150)  NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  referencia_id     UUID,
  referencia_tipo   VARCHAR(30),
  sucursal_id       UUID          REFERENCES sucursales(id),
  registrado_por    UUID          NOT NULL REFERENCES usuarios(id),
  fecha_movimiento  TIMESTAMP     NOT NULL DEFAULT NOW(),
  es_corte          BOOLEAN       NOT NULL DEFAULT FALSE,
  saldo_al_corte    DECIMAL(10,2),
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_caja_fecha    ON caja_movimientos(fecha_movimiento);
CREATE INDEX idx_caja_sucursal ON caja_movimientos(sucursal_id);

-- ============================================================
-- MÓDULO 8: AUDITORÍA
-- ============================================================

-- 11. audit_log
CREATE TABLE audit_log (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla         VARCHAR(50)  NOT NULL,
  registro_id   UUID         NOT NULL,
  accion        VARCHAR(20)  NOT NULL,
  datos_antes   JSONB,
  datos_despues JSONB,
  usuario_id    UUID         REFERENCES usuarios(id),
  ip_address    VARCHAR(45),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_tabla   ON audit_log(tabla, registro_id);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_fecha   ON audit_log(created_at);
