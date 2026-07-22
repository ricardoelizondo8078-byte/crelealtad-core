# DIAGRAMA ER - CRELEALTAD CORE Schema v2.0

## Relaciones entre Tablas (41 Foreign Keys)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MÓDULO: CATÁLOGOS                             │
└─────────────────────────────────────────────────────────────────────┘

sucursales
  └──→ zonas (sucursal_id)
       └──→ asesoras (zona_id)
       └──→ grupos (zona_id)

sucursales
  └──→ grupos (sucursal_id)
  └──→ usuarios (sucursal_id)
  └──→ caja_movimientos (sucursal_id)

roles
  └──→ usuarios (rol_id)
       └──→ asesoras (usuario_id)
       └──→ caja_movimientos (registrado_por)
       └──→ pagos (recibido_por)
       └──→ reestructuras (autorizado_por)
       └──→ audit_log (usuario_id)

codigos_postales
  └──→ solicitudes (dom_cp_id)
  └──→ solicitudes (negocio_cp_id)

productos_credito
  └──→ expedientes (producto_id)


┌─────────────────────────────────────────────────────────────────────┐
│                        MÓDULO: PERSONAS                              │
└─────────────────────────────────────────────────────────────────────┘

personas
  └──→ integrantes (persona_id)
  └──→ solicitudes (persona_id)
  └──→ creditos (persona_id)
  └──→ pagos (persona_id)
  └──→ ciclos (tesorera_id)


┌─────────────────────────────────────────────────────────────────────┐
│                    MÓDULO: GRUPOS Y CICLOS                           │
└─────────────────────────────────────────────────────────────────────┘

grupos
  └──→ expedientes (grupo_id)
       └──→ integrantes (expediente_id)
       │    └──→ documentos (solicitanteId) [legacy FK]
       │    └──→ solicitudes (integrante_id)
       │    └──→ solicitudes (integrante_id_old) [temporal]
       │
       └──→ solicitudes (expediente_id)
       │    └──→ creditos (solicitud_id)
       │         └──→ calendario_pagos (credito_id)
       │         │    └──→ pagos (calendario_id)
       │         │    └──→ mora (calendario_id)
       │         │
       │         └──→ pagos (credito_id)
       │         └──→ mora (credito_id)
       │         └──→ reestructuras (credito_id)
       │
       └──→ creditos (expediente_id)
       └──→ ciclos (expediente_id)

grupos
  └──→ solicitudes (grupo_id)
  └──→ ciclos (grupo_id)

asesoras
  └──→ expedientes (asesora_id)
  └──→ ciclos (asesora_id)


┌─────────────────────────────────────────────────────────────────────┐
│                 MÓDULO: SOLICITUDES Y CRÉDITOS                       │
└─────────────────────────────────────────────────────────────────────┘

solicitudes
  └──→ creditos (solicitud_id)
       │
       └──→ calendario_pagos (credito_id)
       │    │
       │    └──→ pagos (calendario_id)
       │    └──→ mora (calendario_id)
       │
       └──→ pagos (credito_id)
       └──→ mora (credito_id)
       └──→ reestructuras (credito_id)
       └──→ solicitudes (credito_id) [back-reference]


┌─────────────────────────────────────────────────────────────────────┐
│                   RESUMEN DE CARDINALIDADES                          │
└─────────────────────────────────────────────────────────────────────┘

1:N (Uno a Muchos)
├── sucursales → zonas
├── sucursales → usuarios
├── sucursales → grupos
├── zonas → asesoras
├── zonas → grupos
├── roles → usuarios
├── usuarios → asesoras
├── usuarios → caja_movimientos
├── usuarios → pagos
├── usuarios → reestructuras
├── usuarios → audit_log
├── codigos_postales → solicitudes (dom_cp_id)
├── codigos_postales → solicitudes (negocio_cp_id)
├── productos_credito → expedientes
├── personas → integrantes
├── personas → solicitudes
├── personas → creditos
├── personas → pagos
├── personas → ciclos (tesorera)
├── grupos → expedientes
├── grupos → solicitudes
├── grupos → ciclos
├── asesoras → expedientes
├── asesoras → ciclos
├── expedientes → integrantes
├── expedientes → solicitudes
├── expedientes → creditos
├── expedientes → ciclos
├── integrantes → documentos
├── integrantes → solicitudes (integrante_id)
├── integrantes → solicitudes (integrante_id_old)
├── solicitudes → creditos
├── creditos → solicitudes (back-reference)
├── creditos → calendario_pagos
├── creditos → pagos
├── creditos → mora
├── creditos → reestructuras
├── calendario_pagos → pagos
└── calendario_pagos → mora

1:1 (Uno a Uno - Opcional)
├── usuarios ← asesoras (usuario_id UNIQUE)
├── solicitudes ← creditos (solicitud_id UNIQUE)
└── expedientes ← ciclos (expediente_id UNIQUE)


┌─────────────────────────────────────────────────────────────────────┐
│                    TABLAS POR NIVEL DE JERARQUÍA                     │
└─────────────────────────────────────────────────────────────────────┘

NIVEL 1 (Sin dependencias)
├── codigos_postales
├── sucursales
├── roles
├── personas
└── productos_credito

NIVEL 2 (Dependen de Nivel 1)
├── zonas (sucursales)
├── usuarios (roles, sucursales)
└── grupos (zonas, sucursales)

NIVEL 3 (Dependen de Nivel 2)
├── asesoras (usuarios, zonas)
├── expedientes (grupos, productos_credito, asesoras)
├── ciclos (grupos, asesoras, personas)
├── caja_movimientos (sucursales, usuarios)
└── audit_log (usuarios)

NIVEL 4 (Dependen de Nivel 3)
├── integrantes (expedientes, personas)
└── solicitudes (integrantes, personas, expedientes, grupos, codigos_postales)

NIVEL 5 (Dependen de Nivel 4)
├── documentos (integrantes)
└── creditos (solicitudes, personas, expedientes)

NIVEL 6 (Dependen de Nivel 5)
├── calendario_pagos (creditos)
├── reestructuras (creditos, usuarios)
└── mora (creditos, calendario_pagos)

NIVEL 7 (Dependen de Nivel 6)
└── pagos (calendario_pagos, creditos, personas, usuarios)


┌─────────────────────────────────────────────────────────────────────┐
│                     ÍNDICES IMPORTANTES                              │
└─────────────────────────────────────────────────────────────────────┘

Búsquedas por CURP
├── personas.curp (UNIQUE)
└── solicitudes.curp

Búsquedas por Nombre
└── personas (apellido_pat, primer_nombre)

Búsquedas por Código Postal
└── codigos_postales.codigo

Búsquedas por Expediente/Grupo
├── integrantes.expediente_id
├── solicitudes.expediente_id
├── creditos.expediente_id
├── ciclos.expediente_id
└── ciclos.grupo_id

Búsquedas por Persona
├── integrantes.persona_id
├── solicitudes.persona_id
├── creditos.persona_id
└── pagos.persona_id

Búsquedas por Crédito
├── calendario_pagos.credito_id
├── pagos.credito_id
├── mora.credito_id
└── reestructuras.credito_id

Búsquedas por Fecha
├── caja_movimientos.fecha_movimiento
├── audit_log.created_at

Constraints Únicos Compuestos
├── ciclos (grupo_id, numero_ciclo)
├── calendario_pagos (credito_id, numero_pago)
├── integrantes (expediente_id, persona_id)
└── solicitudes (persona_id, numero_credito) WHERE numero_credito IS NOT NULL


┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS PRINCIPAL                          │
└─────────────────────────────────────────────────────────────────────┘

1. FORMACIÓN DE GRUPO
   zonas → grupos → expedientes

2. CAPTURA DE INTEGRANTES
   personas → integrantes → solicitudes

3. AUTORIZACIÓN Y DESEMBOLSO
   solicitudes → creditos → calendario_pagos

4. COBRANZA
   calendario_pagos → pagos
                   → mora (si hay atraso)

5. CASOS ESPECIALES
   creditos → reestructuras (si hay problema de pago)

6. CICLOS DE CRÉDITO
   grupos → ciclos (al desembolsar)
   expedientes → ciclos (vinculación)

7. CAJA Y AUDITORÍA
   pagos → caja_movimientos
   [todas las modificaciones] → audit_log


┌─────────────────────────────────────────────────────────────────────┐
│                      CONVENCIONES DE NOMBRES                         │
└─────────────────────────────────────────────────────────────────────┘

Columnas en snake_case:
✅ fecha_inicio, primer_nombre, apellido_pat
❌ fechaInicio, primerNombre, apellidoPat

Estados en MAYÚSCULAS:
✅ ACTIVO, FORMANDO, EN_DOCUMENTACION
❌ activo, Formando, enDocumentacion

Tablas en plural (español):
✅ grupos, expedientes, integrantes, solicitudes
❌ grupo, expediente, integrante, solicitud

Foreign Keys con sufijo _id:
✅ zona_id, grupo_id, persona_id
❌ zona, grupo, persona

Columnas de auditoría:
✅ created_at, updated_at, deleted_at
❌ createdAt, updatedAt, deletedAt

Folios únicos por tabla:
✅ GRP-2024-0001, PER-2024-00001, SOL-2024-00001
```

---

## Notas de Implementación

### Migraciones Pendientes

1. **tabla `documentos`:**
   - Tiene FK a `solicitanteId` → debería ser `integrante_id`
   - Funciona porque `solicitantes` se renombró a `integrantes`
   - Pendiente: Renombrar columna para consistencia

2. **Columnas `_old` en `solicitudes`:**
   - Mantener temporalmente para referencia
   - Eliminar después de verificar migración

3. **Columnas con nombre mixto en `solicitudes`:**
   - Algunas quedaron con `camelCase` original
   - Migración intentó renombrarlas pero algunas ya existían
   - Opción: Renombrar manualmente o dejar así

### Triggers Recomendados

```sql
-- Auto-calcular número de crédito por persona
CREATE OR REPLACE FUNCTION auto_numero_credito()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_credito IS NULL THEN
    SELECT COALESCE(MAX(numero_credito), 0) + 1
    INTO NEW.numero_credito
    FROM solicitudes
    WHERE persona_id = NEW.persona_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_numero_credito
BEFORE INSERT ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION auto_numero_credito();

-- Auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    tabla, registro_id, accion,
    datos_antes, datos_despues,
    usuario_id, created_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.current_user_id', TRUE)::UUID,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_grupos AFTER INSERT OR UPDATE OR DELETE ON grupos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_expedientes AFTER INSERT OR UPDATE OR DELETE ON expedientes
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_solicitudes AFTER INSERT OR UPDATE OR DELETE ON solicitudes
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_creditos AFTER INSERT OR UPDATE OR DELETE ON creditos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

**Diagrama generado por:** Claude Code  
**Fecha:** 2026-07-13  
**Versión:** Schema SQL v2.0
