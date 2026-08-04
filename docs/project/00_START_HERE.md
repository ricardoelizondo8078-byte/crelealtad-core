# 00 START HERE — CRELEALTAD CORE

Versión: 1.0.0  
Estado: Autoridad de entrada obligatoria  
Fecha: 2026-07-31

## Propósito

Este es el primer archivo que debe leer cualquier desarrollador, asistente de IA o sesión de Codex antes de modificar CRELEALTAD CORE. La conversación no es la fuente de verdad: la autoridad está en este directorio y en el código vigente.

## Orden obligatorio de lectura

### Para cualquier cambio

1. `01_PROJECT_CONSTITUTION.md`
2. `02_DEVELOPMENT_HANDBOOK.md`
3. `03_PROJECT_STATUS.md`
4. `23_DECISION_LOG.md`
5. El documento específico de la tarea.

### Para cambios de interfaz móvil

Leer además, en este orden:

1. `14_DESIGN_SYSTEM.md`
2. `15_UI_UX_STANDARDS.md`
3. `16_UI_COMPONENT_STANDARD.md`
4. `17_SCREEN_TEMPLATES.md`
5. Revisar `apps/mobile/src/theme/tokens.ts`.
6. Revisar `apps/mobile/src/components/ui/` y su `index.ts`.
7. Identificar una pantalla de referencia del mismo tipo.

### Para backend, datos o reglas

Leer además:

- Backend/arquitectura: `11_ARCHITECTURE_GUIDE.md` y `13_DEVELOPMENT_STANDARDS.md`.
- Base de datos: `08_ENTITY_CATALOG.md`, `09_STATE_MACHINE.md` y `10_DATABASE_PRINCIPLES.md`.
- Reglas de negocio: `05_BUSINESS_RULES.md`, `06_OPERATION_MANUAL.md` y `07_OPERATION_FLOW.md`.
- Seguridad: `12_SECURITY_MODEL.md`.

### Para un módulo nuevo o ampliación importante

1. Leer `20_MODULE_CATALOG.md`.
2. Crear o actualizar una especificación basada en `21_MODULE_SPEC_TEMPLATE.md`.
3. Ejecutar la tarea con `19_CODEX_MASTER_PROMPT.md`.
4. Cerrar usando `22_CHANGE_CHECKLIST.md`.
5. Registrar decisiones y cambios cuando corresponda.

## Reglas que nunca deben omitirse

- No inventar reglas de negocio.
- No crear un patrón visual nuevo dentro de una pantalla.
- Reutilizar componentes antes de crear otros.
- Cuando falte un componente compartido, construirlo primero en la biblioteca UI.
- No usar colores, tipografía, radios o espaciados arbitrarios en pantallas.
- No cambiar archivos fuera del alcance solicitado.
- No declarar una tarea terminada sin ejecutar las validaciones aplicables.
- Toda contradicción debe documentarse; no resolverse silenciosamente.

## Prompt mínimo para iniciar una sesión

```text
Lee completamente docs/project/00_START_HERE.md y sigue su orden de lectura.
La documentación del repositorio es la autoridad y prevalece sobre la conversación.
Después realiza exclusivamente esta tarea:
[DESCRIBIR TAREA]
```

## Criterio de cierre

Una tarea no está terminada hasta que:

- cumple la constitución y los estándares aplicables;
- conserva continuidad visual y arquitectónica;
- pasa las validaciones técnicas disponibles;
- explica archivos modificados, pruebas realizadas y pendientes reales;
- actualiza documentación cuando cambió una decisión, contrato o estado del proyecto.
