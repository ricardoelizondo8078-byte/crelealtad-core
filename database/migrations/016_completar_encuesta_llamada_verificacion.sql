BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_llamada_encuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  llamada_id UUID NOT NULL UNIQUE,
  identidad_coincide BOOLEAN NOT NULL,
  domicilio_coincide BOOLEAN NOT NULL,
  accion_posterior VARCHAR(30) NOT NULL,
  registrada_por UUID NOT NULL,
  completada_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_llamada_encuestas_llamada_fkey
    FOREIGN KEY (llamada_id)
    REFERENCES verificacion_llamadas(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamada_encuestas_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamada_encuestas_accion_check
    CHECK (accion_posterior IN (
      'AGENDO_VISITA',
      'ENTREVISTA_CORTA',
      'ENTREVISTA_LARGA',
      'LLAMAR_MAS_TARDE'
    )),
  CONSTRAINT verificacion_llamada_encuestas_completada_check
    CHECK (
      completada_at IS NULL
      OR accion_posterior IN ('AGENDO_VISITA', 'ENTREVISTA_CORTA', 'ENTREVISTA_LARGA')
    )
);

CREATE TABLE IF NOT EXISTS verificacion_llamada_caracteristicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  encuesta_id UUID NOT NULL,
  clave VARCHAR(40) NOT NULL,
  coincide BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_llamada_caracteristicas_encuesta_fkey
    FOREIGN KEY (encuesta_id)
    REFERENCES verificacion_llamada_encuestas(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamada_caracteristicas_clave_check
    CHECK (clave IN (
      'NUMERO_PLANTAS',
      'COLOR_DOMICILIO',
      'COCHERA_ENTRADA',
      'BANQUETA_FRENTE',
      'OBJETO_VISIBLE',
      'REFERENCIA_EXTERIOR'
    )),
  CONSTRAINT ux_verificacion_llamada_caracteristica UNIQUE (encuesta_id, clave)
);

CREATE TABLE IF NOT EXISTS verificacion_llamada_evidencias (
  id UUID PRIMARY KEY,
  encuesta_id UUID NOT NULL UNIQUE,
  ruta VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  tamano_bytes INTEGER NOT NULL,
  sha256 CHAR(64) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_llamada_evidencias_encuesta_fkey
    FOREIGN KEY (encuesta_id)
    REFERENCES verificacion_llamada_encuestas(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamada_evidencias_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamada_evidencias_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_llamada_evidencias_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_llamada_evidencias_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS ix_verificacion_llamada_encuestas_completada
  ON verificacion_llamada_encuestas(completada_at DESC)
  WHERE completada_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_verificacion_llamada_caracteristicas_encuesta
  ON verificacion_llamada_caracteristicas(encuesta_id);

COMMENT ON TABLE verificacion_llamada_encuestas IS
  'Respuestas de las preguntas 1, 2 y 4 de una llamada contestada de verificacion.';
COMMENT ON COLUMN verificacion_llamada_encuestas.completada_at IS
  'Se informa solo cuando todas las coincidencias son positivas, existe evidencia y la accion no es LLAMAR_MAS_TARDE.';
COMMENT ON TABLE verificacion_llamada_caracteristicas IS
  'Respuestas normalizadas de coincidencia que componen la pregunta 3.';
COMMENT ON TABLE verificacion_llamada_evidencias IS
  'Metadatos de la fotografia de evidencia; el archivo se conserva fuera de PostgreSQL en almacenamiento protegido.';

COMMIT;
