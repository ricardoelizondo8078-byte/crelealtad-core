# 17 Codex Workflow - Reglas para IA y Codex

Version: 1.1.0
Estado: Vigente y auditado
Fecha de actualizacion: 2026-07-10

## Objetivo

Definir flujo obligatorio para uso de IA y Codex en CRELEALTAD CORE sin romper reglas de negocio, trazabilidad ni gobierno documental.

## Principios

1. IA asiste, no gobierna negocio.
2. No inventar reglas.
3. No cambiar operacion real.
4. Todo cambio debe ser trazable.
5. Toda duda funcional debe escalarse.
6. Todo documento obsoleto se preserva en archive; no se elimina.

## Orden obligatorio de lectura

1. project/01_PROJECT_CONSTITUTION.md
2. project/05_BUSINESS_RULES.md
3. project/23_DECISION_LOG.md
4. project/03_PROJECT_STATUS.md
5. project/20_MODULE_CATALOG.md
6. Documentacion del modulo afectado
7. Codigo del modulo
8. Base de datos relacionada
9. API relacionada
10. UX relacionada

## Alcance minimo de auditoria antes de editar

- README
- docs/
- database/
- apps/
- packages/
- scripts/
- assets/

## Flujo obligatorio antes de editar

1. Confirmar seccion y modulo afectados.
2. Leer el orden obligatorio completo hasta el nivel necesario.
3. Revisar impacto en estados, datos, trazabilidad y documentacion.
4. Confirmar que no se rompe historial ni autoridad documental.
5. Aplicar el cambio minimo necesario.
6. Validar el resultado.
7. Documentar cambio, hallazgo o contradiccion.

## Regla de contradicciones

- Si la contradiccion es funcional o de negocio: documentarla, explicar impacto y esperar aprobacion. No decidirla.
- Si la contradiccion es tecnica o documental: documentarla y remitir a la autoridad vigente, sin inventar reglas nuevas.

## Reglas para Codex

- No borrar archivos historicos.
- No reiniciar documentacion existente.
- No simplificar contenido normativo.
- No sobreescribir decisiones aprobadas.
- No convertir estados tecnicos temporales en contrato funcional.
- No sacar borradores de archive para reactivarlos sin decision registrada.

## Checklist previo a cualquier cambio

- Seccion afectada identificada.
- Regla de negocio aplicable identificada.
- Estado y transicion impactada evaluada.
- Impacto en API y base de datos evaluado.
- Ruta documental a actualizar identificada.
- Plan de validacion definido.

## Checklist posterior al cambio

- Validacion ejecutada.
- Referencias cruzadas actualizadas.
- Decision log actualizado si aplica.
- Changelog actualizado si aplica.
- Hallazgos o contradicciones agregados al reporte de auditoria si corresponde.

## Lista DO NOT BREAK

1. Operacion manda.
2. Guardado automatico.
3. Estados oficiales por sistema.
4. Historial inviolable.
5. Parametros sobre hardcode.
6. Solicitud digital y solicitud fisica segun politica.
7. Trazabilidad de toda decision critica.

## Referencias cruzadas

- project/01_PROJECT_CONSTITUTION.md
- project/13_DEVELOPMENT_STANDARDS.md
- project/12_SECURITY_MODEL.md
- project/91_PROJECT_AUDIT_REPORT.md
