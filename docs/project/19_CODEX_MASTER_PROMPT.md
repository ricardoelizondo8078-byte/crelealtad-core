# 19 CODEX MASTER PROMPT — CRELEALTAD CORE

Versión: 2.0.0  
Estado: Vigente  
Fecha: 2026-07-31

Copiar el bloque siguiente al inicio de cada tarea de programación.

```text
Trabaja dentro del repositorio CRELEALTAD CORE.

ANTES DE MODIFICAR CÓDIGO:
1. Lee completamente docs/project/00_START_HERE.md.
2. Sigue el orden de lectura que corresponde a esta tarea.
3. Inspecciona el código real involucrado y sus componentes, tipos, servicios y pruebas.
4. Declara brevemente: alcance, archivos probables, componentes reutilizables y validaciones que ejecutarás.

AUTORIDAD:
- La documentación oficial del repositorio prevalece sobre la conversación.
- No inventes reglas de negocio, estados, campos, permisos ni patrones visuales.
- No copies como estándar una pantalla existente que contradiga los documentos oficiales.
- Si detectas contradicción, regístrala y aplica la autoridad superior; no la resuelvas silenciosamente.

REGLAS DE IMPLEMENTACIÓN:
- Realiza exclusivamente la tarea solicitada.
- Conserva compatibilidad con la arquitectura existente.
- Reutiliza componentes y tokens oficiales.
- Está prohibido crear apariencia base dentro de una pantalla.
- Si falta un componente UI, créalo o amplíalo en la biblioteca compartida antes de usarlo.
- No introduzcas colores, tipografías, radios, sombras, botones, inputs, badges, chips o modales locales.
- Mantén lógica de negocio fuera de componentes visuales cuando sea razonable.
- No hagas refactors masivos no solicitados.
- No borres historial ni documentación vigente.

CIERRE OBLIGATORIO:
1. Ejecuta las validaciones aplicables (tipos, compilación, lint y pruebas).
2. Revisa docs/project/22_CHANGE_CHECKLIST.md.
3. Informa archivos modificados, comportamiento implementado, pruebas ejecutadas y cualquier pendiente real.
4. Actualiza estado, decisión, módulo o changelog sólo cuando el cambio lo requiera.

TAREA ESPECÍFICA:
[PEGAR AQUÍ LA TAREA CONCRETA]

CRITERIOS DE ACEPTACIÓN:
[PEGAR AQUÍ RESULTADOS OBSERVABLES]

FUERA DE ALCANCE:
[PEGAR AQUÍ LO QUE NO DEBE CAMBIAR]
```

## Versión mínima

```text
Lee docs/project/00_START_HERE.md y cumple todos los documentos aplicables.
Realiza exclusivamente esta tarea: [TAREA].
Criterios de aceptación: [RESULTADOS].
Fuera de alcance: [LÍMITES].
Valida y cierra con docs/project/22_CHANGE_CHECKLIST.md.
```
