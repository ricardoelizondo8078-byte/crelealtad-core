-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 3: TABLAS DE CRÉDITOS Y COBRANZA
-- ============================================================

-- 14. creditos
CREATE TABLE creditos (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio               VARCHAR(20)   UNIQUE,
  solicitud_id        UUID          NOT NULL REFERENCES solicitudes(id),
  persona_id          UUID          NOT NULL REFERENCES personas(id),
  expediente_id       UUID          NOT NULL REFERENCES expedientes(id),
  monto_autorizado    DECIMAL(10,2) NOT NULL,
  tasa                DECIMAL(5,2)  NOT NULL,
  num_semanas         INTEGER       NOT NULL,
  monto_seguro        DECIMAL(10,2) NOT NULL,
  costo_apertura      DECIMAL(10,2) NOT NULL,
  retencion           DECIMAL(10,2) NOT NULL,
  fecha_desembolso    DATE          NOT NULL,
  monto_desembolsado  DECIMAL(10,2) NOT NULL,
  estado              VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_creditos_persona    ON creditos(persona_id);
CREATE INDEX idx_creditos_expediente ON creditos(expediente_id);

-- FK de solicitudes hacia creditos (diferida porque creditos no existía antes)
ALTER TABLE solicitudes
  ADD CONSTRAINT fk_solicitud_credito
  FOREIGN KEY (credito_id) REFERENCES creditos(id);

-- FK de ciclos hacia expedientes (diferida)
ALTER TABLE ciclos
  ADD CONSTRAINT fk_ciclo_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id);

-- 15. calendario_pagos
CREATE TABLE calendario_pagos (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  credito_id        UUID          NOT NULL REFERENCES creditos(id),
  numero_pago       INTEGER       NOT NULL,
  fecha_programada  DATE          NOT NULL,
  monto_programado  DECIMAL(10,2) NOT NULL,
  estado            VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (credito_id, numero_pago)
);
CREATE INDEX idx_calendario_credito ON calendario_pagos(credito_id);

-- 16. pagos
CREATE TABLE pagos (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio          VARCHAR(20)   UNIQUE,
  calendario_id  UUID          NOT NULL REFERENCES calendario_pagos(id),
  credito_id     UUID          NOT NULL REFERENCES creditos(id),
  persona_id     UUID          NOT NULL REFERENCES personas(id),
  fecha_pago     DATE          NOT NULL,
  monto_pagado   DECIMAL(10,2) NOT NULL,
  dias_atraso    INTEGER       NOT NULL DEFAULT 0,
  metodo_pago    VARCHAR(30),
  recibido_por   UUID          REFERENCES usuarios(id),
  estado         VARCHAR(20)   NOT NULL DEFAULT 'REGISTRADO',
  observaciones  TEXT,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pagos_credito ON pagos(credito_id);
CREATE INDEX idx_pagos_persona ON pagos(persona_id);

-- 17. mora
CREATE TABLE mora (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  credito_id        UUID          NOT NULL REFERENCES creditos(id),
  calendario_id     UUID          NOT NULL REFERENCES calendario_pagos(id),
  fecha_inicio_mora DATE          NOT NULL,
  fecha_fin_mora    DATE,
  dias_mora         INTEGER       NOT NULL DEFAULT 0,
  monto_mora        DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado            VARCHAR(20)   NOT NULL DEFAULT 'ACTIVA',
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 18. reestructuras
CREATE TABLE reestructuras (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio           VARCHAR(20)   UNIQUE,
  credito_id      UUID          NOT NULL REFERENCES creditos(id),
  tipo            VARCHAR(20)   NOT NULL,
  motivo          TEXT,
  nuevo_monto     DECIMAL(10,2),
  nuevas_semanas  INTEGER,
  nueva_tasa      DECIMAL(5,2),
  fecha_acuerdo   DATE          NOT NULL,
  autorizado_por  UUID          REFERENCES usuarios(id),
  estado          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVA',
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
