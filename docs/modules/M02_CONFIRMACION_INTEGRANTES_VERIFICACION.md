# M02 — Confirmación de integrantes para Verificación

## 1. Identidad

- Nombre oficial: Confirmación de integrantes para Verificación.
- Código: M02-CIV.
- Estado: parcial funcional / implementado en Documentación; mínimo parametrizado pendiente de M11.
- Responsable operativo: Asesoría de crédito.
- Roles usuarios: ASESOR durante la matriz temporal vigente.

## 2. Objetivo y resultado observable

- Problema que resuelve: un expediente puede conservar integrantes del ciclo anterior que descansan o capturas que no se concluyeron; esas personas no deben desaparecer ni bloquear el ciclo nuevo cuando se registra formalmente que no participarán.
- Resultado esperado: antes del handoff, la asesora confirma quiénes participan, registra el motivo de quienes no participan, selecciona una tesorera participante y envía únicamente cuando no queda ninguna decisión pendiente.
- Indicadores de éxito: historial preservado, motivo/actor/fecha auditables, una tesorera válida, cero integrantes pendientes al enviar y totales de cantidad/monto visibles por sección.

## 3. Alcance

### Incluye

- Pantalla previa `Confirmar integrantes` desde el detalle del expediente.
- Secciones `Participarán en esta renovación`, `Pendientes de decidir` y `No participarán`.
- Totales compactos y destacados al pie de cada sección: número de integrantes y suma del monto formal capturado, con tipografía superior a la del contenido de las tarjetas.
- Nombre del grupo centrado en el encabezado contextual verde con acento amarillo institucional.
- Encabezados verdes a todo lo ancho que permanecen visibles durante el scroll hasta entrar la siguiente sección y reutilizan exactamente el patrón tipográfico del renglón `Integrantes` del detalle de expediente.
- La sección `No participarán` prueba texto rojo claro de contraste sobre el mismo fondo verde, sin depender únicamente del color porque conserva su etiqueta explícita.
- Motivos controlados: descanso de la renovación, documentación incompleta, decisión de no continuar y otro con detalle obligatorio.
- Retiro y reintegro formales mientras el expediente está `EN_DOCUMENTACION`.
- Handoff que ignora integrantes `RETIRADA` y bloquea cualquier otro estado incompleto.
- Exclusión de integrantes retiradas en la bandeja y el detalle operativo de Verificación.
- Selección simple, obligatoria y persistente de una tesorera entre las integrantes completas que participarán.
- Identificación visible `T · TESORERA` en la tarjeta correspondiente y referencia disponible para las preguntas adicionales de Verificación.

### No incluye

- Borrar integrantes, personas, solicitudes, documentos o historia de ciclos.
- Retirar a una persona de otros expedientes o impedir su participación futura.
- Dictamen, rechazo o autorización de Verificación.
- Definir el mínimo de integrantes: RN-014 permanece pendiente de M11 porque no existe un producto parametrizado activo en la base verificada.
- Operación offline o sincronización durable.
- Pantalla o API de Desembolso. DEC-029 deja aprobado que esa etapa puede sustituir a la tesorera sin regresar el expediente a Verificación y debe guardar la persona definitiva en `ciclos.tesorera_id` con auditoría.

## 4. Flujo operativo

1. La asesora pulsa `Enviar a verificación` en un expediente en documentación.
2. La app abre `Confirmar integrantes` sin cambiar el estado del expediente.
3. Las completas aparecen seleccionadas para participar; las incompletas quedan pendientes y las retiradas aparecen en su sección histórica.
4. Al excluir una integrante, la asesora registra un motivo; `Otro` exige detalle.
5. La API guarda estado, motivo, actor y fecha en una transacción y registra auditoría.
6. Una reintegración formal recalcula la completitud: vuelve a `SUJETA_CREDITO` si todavía cumple o a `DOCUMENTANDO` si requiere captura.
7. La asesora abre `Seleccionar tesorera`, elige una sola participante y confirma; la API guarda la referencia en el expediente y registra auditoría.
8. Si la tesorera deja de participar antes del handoff, su asignación se limpia y vuelve a ser obligatoria.
9. `Enviar a Verificación` sólo se habilita con al menos una participante completa, cero pendientes y una tesorera seleccionada.
10. Una confirmación final nombra a la tesorera, ejecuta el handoff existente y la API vuelve a validar todo bajo bloqueo transaccional.
11. Verificación conserva esta referencia. Un cambio posterior en Desembolso no revierte ni repite la verificación.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `integrantes.estado` | evento de participación | Sí | `RETIRADA` se agrega al catálogo técnico | Sí |
| `integrantes.motivo_retiro` | selección de asesora | sólo retirada | catálogo controlado | Sí |
| `integrantes.motivo_retiro_detalle` | captura de asesora | sólo motivo `OTRO` | texto 1–250 | Sí |
| `integrantes.retirada_at` | servidor | sólo retirada | timestamp | Sí |
| `integrantes.retirada_por` | JWT | sólo retirada | FK a `usuarios`, `ON DELETE RESTRICT` | Sí |
| `solicitudes.monto_solicitado` | solicitud vigente | No | suma sólo cuando fue confirmado formalmente | Sí |
| `expedientes.tesorera_integrante_id` | selección de asesora | antes del handoff | FK a una integrante del mismo expediente; estado `SUJETA_CREDITO` validado por API | Sí, mediante auditoría |
| `ciclos.tesorera_id` | confirmación futura de Desembolso | al crear ciclo | persona participante definitiva; puede diferir de la referencia de Verificación | Sí |

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| `DOCUMENTANDO` | Asesora | captura incompleta | `SUJETA_CREDITO` o `RETIRADA` | requisitos faltantes |
| `SUJETA_CREDITO` | Sistema | 7/7 completo | `RETIRADA` o handoff | ninguno |
| `RETIRADA` | Asesora | motivo formal | reintegro formal | no bloquea handoff |
| `EN_VERIFICACION` | Verificación | handoff confirmado | fuera de este alcance | retiro/reintegro bloqueados |

## 7. Pantallas

| Pantalla | Plantilla T1–T8 | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Confirmar integrantes | T6 | resolver participación y tesorera antes del handoff | excluir, cambiar motivo, reintegrar, completar captura, seleccionar tesorera, enviar | `AppHeader`, `ScreenTitleBar`, `ContextHeader`, `SummaryMetricsBar`, `RequiredSelectionBar`, `SingleSelectOption`, `StickySectionHeader`, `Card`, `StatusBadge`, `BottomSheetSelector`, `ConfirmDialog`, `BottomActionBar` |

## 8. API y persistencia

- Endpoints: `PATCH /integrantes/:id/retirar`, `PATCH /integrantes/:id/reintegrar`, `PATCH /expedientes/:id/tesorera` y `PATCH /expedientes/:id/send-to-verification`.
- Servicios: `IntegrantesService` y `ExpedientesService`.
- Tablas/relaciones: `integrantes`, `expedientes`, `solicitudes`, `usuarios` y `audit_log`.
- Idempotencia: retirar con el mismo motivo no duplica auditoría; seleccionar la misma tesorera no duplica auditoría; reintegrar fuera de `RETIRADA` devuelve el estado vigente; el handoff conserva su idempotencia.
- Auditoría: acciones `RETIRO_CICLO`, `CAMBIO_RETIRO`, `REINTEGRO_CICLO`, `ASIGNA_TESORERA`, `CAMBIA_TESORERA`, `DESASIG_TESORERA` y `ENVIO_VERIFICACION`, sin datos personales.

## 9. Reglas de negocio

- RN-003, RN-004, RN-008, RN-009, RN-010, RN-012, RN-013, RN-030, RN-039 y RN-040.
- `RETIRADA` aplica únicamente a la participación dentro del expediente vigente.
- El monto excluido es informativo y suma sólo montos solicitados formalmente confirmados; no crea, cancela ni modifica créditos.
- DEC-029: el expediente debe tener exactamente una tesorera participante antes del handoff; la tesorera definitiva puede sustituirse en Desembolso sin regresar a Verificación.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Consultar participantes | ASESOR | `expedientes:leer` | no |
| Retirar/reintegrar | ASESOR | `expedientes:actualizar` y expediente en documentación | sí |
| Seleccionar/cambiar tesorera | ASESOR | `expedientes:actualizar`, expediente en documentación e integrante participante | sí |
| Enviar | ASESOR | `expedientes:actualizar` y precondiciones válidas | sí |

## 11. Estados técnicos de UI

- Carga: indicador y contenido no interactivo.
- Vacío: informa que no existen integrantes para enviar.
- Error: mensaje accionable y reintento.
- Sin conexión: error común del cliente autenticado; no simula cambio.
- Sin permiso: API 403; navegación sigue su contrato vigente.
- Autoguardado: cada motivo, reintegro y selección de tesorera se confirma individualmente en servidor.

## 12. Casos especiales

- Duplicados: no se crean integrantes nuevos.
- Datos incompletos: pueden registrarse como no participantes o regresar a captura.
- Reintentos: retiro, reintegro y handoff son idempotentes por estado/contenido.
- Navegación interrumpida: las decisiones confirmadas permanecen en servidor.
- Concurrencia: retiro, reintegro, selección de tesorera y handoff bloquean primero el expediente; la API revalida pertenencia y participación.

## 13. Criterios de aceptación

- [x] El botón del detalle abre la pantalla previa y no envía inmediatamente.
- [x] El conteo y monto a verificar permanecen visibles en un resumen superior compacto durante el desplazamiento.
- [x] Cada tipo muestra su cantidad y monto al pie de su sección.
- [x] El grupo usa el encabezado contextual verde, centrado y con texto amarillo institucional.
- [x] Cada categoría usa un encabezado verde de lado a lado y pegajoso hasta la siguiente sección.
- [x] Las integrantes excluidas conservan la etiqueta explícita `NO PARTICIPA` y distinguen su indicador y estatus con fondo rojo suave y borde rojo.
- [x] Una integrante incompleta puede quedar fuera con motivo sin perder datos.
- [x] Una integrante completa puede excluirse con motivo.
- [x] `Otro` exige una explicación.
- [x] Una retirada puede reintegrarse y su completitud se recalcula.
- [x] Con pendientes, el botón final permanece deshabilitado y explica la causa.
- [x] Con cero pendientes, la confirmación final envía a Verificación.
- [x] Verificación no cuenta ni muestra integrantes retiradas.
- [x] Todas las transiciones quedan auditadas con actor, fecha y contexto.
- [x] La tesorera sólo puede elegirse entre participantes completas.
- [x] La selección persiste, muestra `T · TESORERA` y habilita las preguntas adicionales de Verificación.
- [x] Sin tesorera, el botón y la API bloquean el envío con una instrucción concreta.
- [x] Retirar a la tesorera limpia la asignación y obliga a seleccionar otra.
- [x] La confirmación final identifica por nombre a la tesorera enviada.

## 14. Pruebas

- Unitarias: retiro, cambio de motivo, reintegro completo/incompleto, selección válida/idempotente/inválida, retiro de tesorera, bloqueo de estado, handoff sin tesorera, con retiradas y con pendientes.
- Integración de datos: migración/rollback condicionados en `crelealtad_test`.
- UI/manuales: tres secciones, motivos, detalle `Otro`, totales, botón bloqueado y confirmación final.
- Regresión: typecheck mobile/API, Jest API y build Nest.

## 15. Decisiones abiertas

- Materializar el mínimo parametrizado de RN-014 cuando M11 defina el producto aplicable y existan parámetros vigentes.
- Diseñar M05 Desembolsos antes de ejecutar la parte pendiente de DEC-029: confirmación o sustitución auditada y copia de `integrantes.persona_id` a `ciclos.tesorera_id`.
