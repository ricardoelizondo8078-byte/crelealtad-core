# INCONSISTENCIAS TÉCNICAS - CRELEALTAD CORE

Deuda técnica registrada. NO implementar sin aprobación explícita.

---

## IMPORTANTE: Validaciones como VARCHAR en lugar de BOOLEAN

### Estado actual
Las 3 validaciones de solicitudes están definidas como VARCHAR(20) en PostgreSQL:
- `solicitudes_validaciones.tiene_medidor_luz`
- `solicitudes_validaciones.vive_max_5km_tesorera`
- `solicitudes_validaciones.tiene_menos_70_anios`

Valores permitidos actualmente: "SI", "NO" (strings sin restricción formal).

### Problema
- **Esquema de diseño original**: Estas columnas deberían ser BOOLEAN.
- **Riesgo actual**: VARCHAR libre acepta "Si", "si", "S", "YES", "1", o cualquier basura.
- **Causa**: Deriva en sesiones anteriores, NO fue decisión de diseño.

### Opciones de corrección

#### Opción A: Migrar a BOOLEAN
```sql
-- Migración segura con conversión de datos existentes
ALTER TABLE solicitudes_validaciones
  ALTER COLUMN tiene_medidor_luz TYPE BOOLEAN
  USING (tiene_medidor_luz = 'SI');

ALTER TABLE solicitudes_validaciones
  ALTER COLUMN vive_max_5km_tesorera TYPE BOOLEAN
  USING (vive_max_5km_tesorera = 'SI');

ALTER TABLE solicitudes_validaciones
  ALTER COLUMN tiene_menos_70_anios TYPE BOOLEAN
  USING (tiene_menos_70_anios = 'SI');
```

**Ventajas**:
- Alineado con diseño original
- Tipo de dato semánticamente correcto
- PostgreSQL valida automáticamente
- Menor espacio de almacenamiento

**Desventajas**:
- Requiere migración de datos existentes
- Backend debe cambiar de "SI"/"NO" a true/false
- Frontend debe interpretar boolean en lugar de string

#### Opción B: Mantener VARCHAR con CHECK constraint
```sql
ALTER TABLE solicitudes_validaciones
  ADD CONSTRAINT chk_tiene_medidor_luz CHECK (tiene_medidor_luz IN ('SI', 'NO'));

ALTER TABLE solicitudes_validaciones
  ADD CONSTRAINT chk_vive_max_5km_tesorera CHECK (vive_max_5km_tesorera IN ('SI', 'NO'));

ALTER TABLE solicitudes_validaciones
  ADD CONSTRAINT chk_tiene_menos_70_anios CHECK (tiene_menos_70_anios IN ('SI', 'NO'));
```

**Ventajas**:
- Mínimo cambio en backend/frontend
- Protege contra basura manteniendo valores actuales
- Sin migración de datos

**Desventajas**:
- No corrige la desalineación con diseño
- Tipo de dato sigue siendo semánticamente incorrecto
- Mayor espacio que BOOLEAN

### Recomendación
**Opción A (BOOLEAN)** para alinearse al diseño original. Implementar en ventana de mantenimiento.

---

## Otras desviaciones de esquema

### A verificar
Auditar todas las columnas del esquema para detectar:
- Columnas diseñadas como BOOLEAN que se implementaron como VARCHAR
- Columnas diseñadas como VARCHAR con valores controlados que no tienen CHECK
- Columnas diseñadas como DATE que se implementaron como VARCHAR
- Columnas diseñadas como NUMERIC que se implementaron como VARCHAR

Ejecutar query de auditoría:
```sql
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'solicitudes%'
  AND data_type IN ('character varying', 'text')
ORDER BY table_name, ordinal_position;
```

### Candidatos conocidos
- `solicitudes_validaciones.*`: 3 columnas VARCHAR que deberían ser BOOLEAN (documentado arriba)
- `solicitudes_datos_personales.nombre_completo`: VARCHAR no-generated que debería ser GENERATED o eliminarse

---

## POLÍTICA

- NO implementar correcciones sin aprobación explícita del usuario.
- NO modificar constraints en producción sin backup y plan de rollback.
- NO cambiar tipos de datos sin migración completa (BD + backend + frontend).
- Priorizar por riesgo: columnas SIN constraint > columnas con tipo incorrecto > columnas redundantes.

---

**Última actualización**: 2026-08-06
**Responsable**: Sistema backend CRELEALTAD CORE
