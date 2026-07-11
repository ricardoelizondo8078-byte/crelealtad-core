# API - CRELEALTAD CORE

Este documento resume la API vigente y referencia el catalogo oficial ampliado.

## Endpoints implementados actualmente

- GET /health
- POST /grupos
- GET /expedientes/group/:groupId
- GET /expedientes/:id
- PATCH /expedientes/:id/send-to-verification
- GET /solicitantes/expediente/:expedienteId
- POST /solicitantes
- GET /solicitudes/solicitante/:solicitanteId
- POST /solicitudes
- GET /documentos/solicitante/:solicitanteId
- PATCH /documentos/solicitante/:solicitanteId/:clave

## Contratos y gobierno

- Estados y reglas en project/06_STATE_MACHINE.md y project/02_BUSINESS_RULES.md.
- Seguridad y permisos en project/11_SECURITY_MODEL.md.
- Estandares de desarrollo y validacion en project/09_DEVELOPMENT_STANDARDS.md.

## Referencias

- project/18_MODULE_CATALOG.md
- project/PROJECT_AUDIT_REPORT.md
