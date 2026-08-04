# 08 Architecture Guide - Guia de Arquitectura

Version: 1.1.0
Estado: Vigente y auditada
Fecha de auditoria: 2026-07-10

## Arquitectura mayor

- Mobile: React Native + Expo + TypeScript.
- Backend: NestJS + TypeScript.
- Datos: PostgreSQL.
- Monorepo: apps, packages, database, docs, scripts, assets.

## Inventario verificado del repositorio

- apps/api: modulo NestJS con grupos, expedientes, solicitantes, solicitudes, documentos y health.
- apps/mobile: shell funcional en App.tsx, flujo MVP de Documentacion y componentes UI reutilizables.
- database: schema inicial, migracion base y ERD conceptual.
- packages/shared: presente, sin contenido funcional verificado.
- scripts: dev-runner.js.
- docs/modules: carpetas por dominio sin archivos markdown dedicados verificados.

## Backend

Modulos implementados actualmente:
- grupos
- expedientes
- solicitantes
- solicitudes
- documentos
- health

Condicion actual:
- servicios in-memory en etapa semilla;
- sin autenticacion productiva;
- sin autorizacion por rol;
- sin repositorios de persistencia;
- sin ORM o cliente SQL declarado en apps/api/package.json.

## Frontend Mobile

Estado actual:
- shell operativo en App.tsx;
- flujo de Documentacion con crear grupo, listar expedientes, detalle de expediente y captura parcial de solicitantes, solicitudes y documentos;
- componentes UI reutilizables en components/ui;
- discovery de API local implementado;
- sin estrategia offline persistente verificada.

## Database

- schema inicial en database/schema/init.sql.
- migracion inicial disponible en database/migrations/001_initial_schema.sql.
- 15 tablas base verificadas en el estado actual del repositorio.
- entidad Solicitud no cuenta con tabla dedicada en el schema actual.

## Offline y conectividad variable

Requerimientos arquitectonicos oficiales:
- guardado resiliente de captura;
- reintentos controlados;
- mensajes claros de sincronizacion.

Estado actual verificado:
- no se verifico persistencia local offline;
- no se verifico cola de sincronizacion;
- la necesidad sigue vigente a nivel arquitectonico.

## Deployment e integraciones

Objetivo recomendado:
- backend en Railway;
- mobile por Expo EAS;
- repositorio en GitHub como troncal.

Integraciones previstas:
- almacenamiento documental compatible con S3;
- parametros configurables centralizados.

Estado actual:
- integraciones no verificadas en codigo productivo.

## Decisiones de consistencia

1. Operacion constitucional prevalece sobre implementacion temporal.
2. Estado temporal in-memory se documenta, no se eleva a contrato final.
3. Evolucion hacia persistencia debe ser incremental y compatible.
4. Los borradores iniciales de arquitectura se preservan en archive y no sustituyen esta guia vigente.

## Referencias cruzadas

- architecture/DOMAIN_MODEL.md
- docs/archive/ARCHITECTURE_INITIAL_PROPOSAL.md
- project/08_ENTITY_CATALOG.md
- project/90_ARCHITECT_REVIEW.md
