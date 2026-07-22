-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 4: DATOS SEMILLA (SEED)
-- ============================================================

-- Rol administrador
INSERT INTO roles (nombre, descripcion, permisos) VALUES
  ('ADMIN',       'Acceso total al sistema',                    '{"todo": true}'),
  ('GERENTE',     'Reportes y autorización de créditos',        '{"reportes": true, "creditos": true}'),
  ('ASESORA',     'Captura de grupos y expedientes en campo',   '{"grupos": true, "expedientes": true}'),
  ('VERIFICADOR', 'Revisión y validación de expedientes',       '{"expedientes": true, "lectura": true}'),
  ('CAJA',        'Registro de pagos y movimientos de caja',    '{"pagos": true, "caja": true}');

-- Sucursal principal
INSERT INTO sucursales (nombre, estado) VALUES
  ('Matriz', 'ACTIVA');

-- Zona inicial
INSERT INTO zonas (nombre, sucursal_id)
  SELECT 'Zona Centro', id FROM sucursales WHERE nombre = 'Matriz';

-- Producto de crédito grupal
INSERT INTO productos_credito (
  nombre, descripcion, tasa, precio_seguro,
  costo_apertura, retencion, num_semanas,
  monto_minimo, monto_maximo, min_integrantes, max_integrantes
) VALUES (
  'Crédito Grupal',
  'Producto principal de crédito solidario grupal',
  15.00, 20.00, 100.00, 10.00, 16,
  3000.00, 100000.00, 6, 12
);
