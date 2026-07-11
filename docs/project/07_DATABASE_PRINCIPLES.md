# 07 Database Principles - Principios de Base de Datos

Version: 1.0.0
Estado: Vigente

## Principios

1. Modelo relacional como fuente de verdad operacional.
2. Llaves UUID para interoperabilidad.
3. Auditoria en todas las tablas.
4. Soft delete para preservar historial.
5. Politicas operativas fuera de hardcode.
6. Estados de negocio controlados por catalogos canonicos.

## Modelo actual inventariado

Tablas en schema principal:
- personas
- usuarios
- roles
- usuarios_roles
- productos
- parametros
- reglas
- expedientes
- solicitantes
- grupos
- ciclos
- creditos
- desembolsos
- pagos
- documentos

## Relacionamiento clave

- solicitantes -> expedientes
- grupos -> expedientes
- creditos -> grupos, productos
- pagos -> creditos
- desembolsos -> creditos
- documentos -> persona|solicitante|expediente|grupo|credito

## Principios de normalizacion

- 3FN como base.
- Catalogos separados para tipos de documentos y estados en evolucion.
- Evitar columnas polimorficas ambiguas sin control funcional.

## Indices minimos recomendados

- PK por id en todas las tablas.
- Indices por FK: persona_id, expediente_id, grupo_id, credito_id, parametro_id.
- Indices operativos: status, created_at.
- Indices compuestos en consultas recurrentes de expediente y solicitante.

## Restricciones minimas

- Integridad referencial con FK.
- Restriccion de estados validos por entidad.
- No permitir datos huerfanos en entidades criticas.

## Brechas actuales detectadas

- Entidad Solicitud esta en API/mobile pero no en schema principal.
- Persistencia aun no implementada en servicios backend actuales.

## Decision de arquitectura de datos

Se conserva modelo actual y se documenta roadmap para alinear implementacion sin cambiar flujo operativo.

## Referencias cruzadas

- project/05_ENTITY_CATALOG.md
- project/16_ARCHITECT_REVIEW.md
- database/schema/init.sql
