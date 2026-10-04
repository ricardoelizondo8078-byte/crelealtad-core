BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_entrevista_telefono_confirmaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  llamada_id UUID NOT NULL,
  tipo_telefono VARCHAR(20) NOT NULL,
  telefono VARCHAR(10) NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  mime_type VARCHAR(20) NOT NULL,
  tamano_bytes INTEGER NOT NULL,
  sha256 CHAR(64) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_entrevista_telefono_integrante_fkey
    FOREIGN KEY (integrante_id) REFERENCES integrantes(id) ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_telefono_llamada_fkey
    FOREIGN KEY (llamada_id) REFERENCES verificacion_llamadas(id) ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_telefono_usuario_fkey
    FOREIGN KEY (registrada_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_telefono_tipo_check
    CHECK (tipo_telefono IN ('PRINCIPAL', 'SECUNDARIO')),
  CONSTRAINT verificacion_entrevista_telefono_numero_check
    CHECK (telefono ~ '^[0-9]{10}$'),
  CONSTRAINT verificacion_entrevista_telefono_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_entrevista_telefono_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_entrevista_telefono_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT ux_verificacion_entrevista_telefono_llamada UNIQUE (llamada_id)
);

CREATE INDEX IF NOT EXISTS ix_verificacion_entrevista_telefono_integrante_tipo_fecha
  ON verificacion_entrevista_telefono_confirmaciones(
    integrante_id,
    tipo_telefono,
    created_at DESC
  );

COMMENT ON TABLE verificacion_entrevista_telefono_confirmaciones IS
  'Historial de números confirmados durante Entrevista mediante una llamada contestada y evidencia protegida.';

COMMIT;
