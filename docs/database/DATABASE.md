# DATABASE - CRELEALTAD CORE

## Objetivo

Documentar la base de datos como soporte del flujo operativo de credito grupal.

## Fuente actual

- Schema: database/schema/init.sql
- ERD: database/schema/erd.md
- Migracion base: database/migrations/001_initial_schema.sql

## Entidades base

personas, usuarios, roles, usuarios_roles, productos, parametros, reglas, expedientes, solicitantes, grupos, ciclos, creditos, desembolsos, pagos, documentos.

## Hallazgos de consistencia

- Entidad Solicitud se usa en API y mobile, pendiente de consolidacion en schema principal.
- Persistencia backend en evolucion desde prototipo in-memory.

## Referencias

- project/05_ENTITY_CATALOG.md
- project/07_DATABASE_PRINCIPLES.md
- project/16_ARCHITECT_REVIEW.md
