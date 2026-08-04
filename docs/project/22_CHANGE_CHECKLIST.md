# 22 CHANGE CHECKLIST — CRELEALTAD CORE

Versión: 1.0.0  
Estado: Obligatorio

## Antes de programar

- [ ] Se leyó `00_START_HERE.md` y la documentación aplicable.
- [ ] Se inspeccionó el código real y no sólo la descripción del prompt.
- [ ] El alcance y fuera de alcance están definidos.
- [ ] Se identificaron componentes, tipos y servicios reutilizables.
- [ ] No existen decisiones funcionales abiertas ocultas.

## Arquitectura y código

- [ ] El cambio respeta estructura, nombres y responsabilidades existentes.
- [ ] No mezcla innecesariamente UI, negocio, API y persistencia.
- [ ] No duplica lógica o contratos.
- [ ] No introduce dependencias sin necesidad documentada.
- [ ] No realiza refactors ajenos a la tarea.

## UI/UX, cuando aplica

- [ ] La pantalla tiene plantilla T1–T8 declarada.
- [ ] Usa tokens y componentes oficiales.
- [ ] No contiene colores ni estilos base arbitrarios.
- [ ] Implementa carga, vacío, error, permisos y conectividad aplicables.
- [ ] El scroll es el correcto y no hay scrolls verticales anidados innecesarios.
- [ ] Teclado, safe area, accesibilidad y áreas táctiles fueron considerados.
- [ ] Selección simple/múltiple y confirmaciones usan patrones oficiales.
- [ ] La apariencia es continua con el resto de módulos.

## Negocio y datos

- [ ] Reglas y estados provienen de documentos aprobados.
- [ ] Historial y trazabilidad se conservan.
- [ ] Validaciones existen en la capa adecuada.
- [ ] Cambios de schema tienen migración y compatibilidad consideradas.
- [ ] Acciones sensibles tienen permisos y auditoría.

## Validación

- [ ] TypeScript/compilación pasa.
- [ ] Lint pasa, cuando existe.
- [ ] Pruebas aplicables pasan.
- [ ] Se verificó manualmente el flujo afectado.
- [ ] No se dejaron errores, logs o datos temporales.

## Documentación y cierre

- [ ] Se actualizó la especificación del módulo si cambió su contrato.
- [ ] Se actualizó `03_PROJECT_STATUS.md` si cambió el avance real.
- [ ] Se actualizó `23_DECISION_LOG.md` si hubo decisión nueva.
- [ ] Se actualizó `24_CHANGELOG.md` si el cambio es relevante.
- [ ] El cierre enumera archivos, validaciones y pendientes reales.
