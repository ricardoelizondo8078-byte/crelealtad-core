# 24 Changelog - Historial de Cambios del Proyecto

## [2026-07-31] - Reorganización de autoridad documental y continuidad UI

### Agregado

- `00_START_HERE.md` como entrada obligatoria.
- `02_DEVELOPMENT_HANDBOOK.md`.
- `14_DESIGN_SYSTEM.md`.
- `16_UI_COMPONENT_STANDARD.md`.
- `17_SCREEN_TEMPLATES.md`.
- `19_CODEX_MASTER_PROMPT.md` versión compacta.
- `21_MODULE_SPEC_TEMPLATE.md`.
- `22_CHANGE_CHECKLIST.md`.
- `92_UI_AUDIT_2026-07-31.md`.

### Reorganizado

- Renumeración completa del paquete oficial para mantener un orden único de lectura.
- Referencias internas actualizadas a los nuevos nombres.
- Conservación del contenido funcional y de auditoría anterior.

### Objetivo

- Hacer que cada sesión de programación pueda reiniciarse sin depender del historial del chat.
- Convertir continuidad visual, plantillas y componentes compartidos en reglas obligatorias.

---

## [2026-07-10] - Auditoria integral y consolidacion documental

### Modificado

- docs/project/01_PROJECT_CONSTITUTION.md
- docs/project/05_BUSINESS_RULES.md
- docs/project/08_ENTITY_CATALOG.md
- docs/project/09_STATE_MACHINE.md
- docs/project/11_ARCHITECTURE_GUIDE.md
- docs/project/03_PROJECT_STATUS.md
- docs/project/23_DECISION_LOG.md
- docs/project/18_CODEX_WORKFLOW.md
- docs/project/20_MODULE_CATALOG.md
- docs/project/91_PROJECT_AUDIT_REPORT.md

### Movido (sin borrado)

- docs/business/BUSINESS_RULES.md -> docs/archive/BUSINESS_RULES_INITIAL_DRAFT.md
- docs/architecture/ARCHITECTURE.md -> docs/archive/ARCHITECTURE_INITIAL_PROPOSAL.md
- PROJECT_FILES.txt -> docs/archive/ROOT_PROJECT_FILES.txt
- PROJECT_FILES_LIMPIO.txt -> docs/archive/ROOT_PROJECT_FILES_LIMPIO.txt

### Observaciones

- No se modifico codigo funcional.
- No se agregaron reglas de negocio nuevas.
- Se mantuvo la autoridad documental en docs/project.
- Se preservo historial documental en docs/archive.

## [2026-07-09] - Reorganizacion documental mayor

### Agregado

- Nueva estructura empresarial en docs/project.
- Catalogo de reglas normalizado.
- Manual operativo y flujo operacional completo.
- Catalogo integral de entidades y maquinas de estado.
- Estandares de desarrollo, UX, seguridad y flujo Codex.
- Catalogo de modulos y glosario.
- Reporte final de auditoria de arquitectura.

### Movido (sin borrado)

- docs/PROJECT_STATUS.md -> docs/archive/PROJECT_STATUS.md
- docs/PROJECT_TREE.txt -> docs/archive/PROJECT_TREE.txt
- docs/PROJECT_FILES.txt -> docs/archive/PROJECT_FILES.txt

### Conservado

- Constitucion vigente original en docs/01_PROJECT_CONSTITUTION.md
- Copia de trabajo oficial en docs/project/01_PROJECT_CONSTITUTION.md

### Observaciones

- No se modifico la operacion del negocio.
- No se alteraron endpoints ni estructura funcional de produccion.
- Se preservo historial documental.

## Politica de versionado del changelog

- Mayor: cambios de arquitectura o gobierno.
- Menor: nuevas secciones o ampliaciones.
- Parche: correcciones de precision sin cambio de politica.

## Referencias cruzadas

- project/23_DECISION_LOG.md
- project/03_PROJECT_STATUS.md
