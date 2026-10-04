# 02 DEVELOPMENT HANDBOOK — CRELEALTAD CORE

Versión: 1.1.0
Estado: Vigente  
Fecha: 2026-10-04

## Función

Este handbook es el índice operativo de ingeniería. No duplica todo el contenido: define qué documento gobierna cada decisión y cómo debe ejecutarse un cambio.

## Jerarquía de autoridad

1. `01_PROJECT_CONSTITUTION.md`.
2. Reglas de negocio, flujo y estados aprobados.
3. Arquitectura, datos y seguridad.
4. Sistema de diseño, UX y biblioteca de componentes.
5. Decisiones registradas.
6. Código vigente.
7. Conversaciones, bocetos y prompts temporales.

Cuando el código contradiga una autoridad superior, no se copiará el error como patrón. Se documentará la brecha y se corregirá sólo dentro del alcance autorizado.

## Mapa documental

| Tema | Documento principal |
|---|---|
| Entrada obligatoria | `00_START_HERE.md` |
| Principios inmutables | `01_PROJECT_CONSTITUTION.md` |
| Estado real | `03_PROJECT_STATUS.md` |
| Visión de producto | `04_PRODUCT_VISION.md` |
| Reglas de negocio | `05_BUSINESS_RULES.md` |
| Operación | `06_OPERATION_MANUAL.md`, `07_OPERATION_FLOW.md` |
| Entidades y estados | `08_ENTITY_CATALOG.md`, `09_STATE_MACHINE.md` |
| Datos | `10_DATABASE_PRINCIPLES.md` |
| Arquitectura | `11_ARCHITECTURE_GUIDE.md` |
| Seguridad | `12_SECURITY_MODEL.md` |
| Código | `13_DEVELOPMENT_STANDARDS.md` |
| Diseño visual | `14_DESIGN_SYSTEM.md` |
| UX | `15_UI_UX_STANDARDS.md` |
| Componentes | `16_UI_COMPONENT_STANDARD.md` |
| Pantallas | `17_SCREEN_TEMPLATES.md` |
| Flujo de Codex | `18_CODEX_WORKFLOW.md` |
| Prompt base | `19_CODEX_MASTER_PROMPT.md` |
| Módulos | `20_MODULE_CATALOG.md`, `21_MODULE_SPEC_TEMPLATE.md` |
| Cierre y control | `22_CHANGE_CHECKLIST.md` |
| Decisiones e historial | `23_DECISION_LOG.md`, `24_CHANGELOG.md` |

## Flujo obligatorio de trabajo

1. Entender el alcance y listar explícitamente lo que no se modificará.
2. Leer las autoridades aplicables.
3. Inspeccionar el código real antes de proponer cambios.
4. Identificar componentes, servicios, tipos y patrones reutilizables.
5. Implementar el cambio más pequeño que resuelva la tarea.
6. Validar compilación, tipos, pruebas y comportamiento afectado.
7. Comparar el resultado contra el checklist.
8. Actualizar estado, decisiones o changelog cuando aplique.

## Puerta reproducible de calidad

Desde la raíz, `npm run verify` es el cierre mínimo: escanea secretos, ejecuta lint mobile,
TypeScript API/mobile y las suites API/mobile. Para diagnóstico focal en la aplicación móvil pueden
usarse `npm --prefix apps/mobile run lint`, `npm --prefix apps/mobile run typecheck` y
`npm --prefix apps/mobile test`.

## Regla de continuidad visual

Las pantallas ensamblan componentes; no inventan apariencia. Los tokens y componentes compartidos son contratos. Una excepción local requiere justificación, aprobación y registro explícito.

## Regla para sesiones interrumpidas

Cada sesión debe dejar el repositorio autosuficiente. El siguiente desarrollador debe poder continuar leyendo `00_START_HERE.md`, `03_PROJECT_STATUS.md`, la especificación del módulo y el historial de cambios, sin depender del chat anterior.
