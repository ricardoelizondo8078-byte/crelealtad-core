# X01 — Sincronización offline de campo

## 1. Identidad

- Nombre oficial: Sincronización offline de campo.
- Código: X01.
- Estado: primera vertical implementada; pendiente de prueba manual en dispositivo, cifrado local productivo y ampliación a los demás procesos de Verificación.
- Responsable operativo: Operación de campo y coordinación técnica.
- Roles usuarios: usuarios autenticados con permiso vigente sobre M02 o M03.

## 2. Objetivo y resultado observable

- Problema que resuelve: evitar que una interrupción de red, el cierre de la app o un reintento borren una captura de campo o dupliquen una escritura.
- Resultado esperado: la app conserva por usuario y entidad los borradores y archivos pendientes, reintenta en orden, distingue guardado local de confirmación del servidor y bloquea estados finales mientras exista trabajo sin confirmar.
- Indicadores de éxito: recuperación después de reiniciar; deduplicación de autoguardados; reintento con espera creciente; documentos reanudables; conflictos visibles y nunca resueltos por última escritura silenciosa.

## 3. Alcance

### Incluye

- Repositorio local versionado y separado por usuario.
- Cola durable para solicitudes JSON, multipart idempotente y documentos por lotes.
- Archivos pendientes copiados al directorio durable privado de la app.
- Reintento inmediato, al volver la app a primer plano, periódico y manual.
- Backoff acotado y clasificación entre error transitorio y conflicto bloqueante.
- Borrador recuperable de la solicitud individual de M02.
- Borrador recuperable de la Entrevista de M03.
- Carga documental de M02 con identificador estable y progreso de lote persistido.
- Bloqueo de `SUJETA_CREDITO` cuando la entidad conserva operaciones pendientes o bloqueadas.
- Control optimista de concurrencia para datos personales, Solicitud y Entrevista mediante la
  versión confirmada por servidor; un reintento idéntico es idempotente y un contenido distinto
  sobre una versión atrasada queda bloqueado.

### No incluye

- Cambiar reglas, estados oficiales o permisos de M02/M03.
- Permitir dictámenes, handoff o cambios de estado sin confirmación del servidor.
- Resolver automáticamente conflictos financieros, de identidad o de decisión.
- Sincronizar todavía las secuencias de Llamada, Visita al vecino o Imágenes del domicilio que dependen de identificadores de pasos previos confirmados por servidor.
- Declarar lista para producción la persistencia local sensible: la primera vertical usa el almacenamiento privado disponible y requiere cifrado local auditado antes de operar con datos reales.

## 4. Flujo operativo

1. La usuaria autenticada abre una captura y la app consulta servidor y borrador local.
2. Si hay cambios locales no confirmados, éstos prevalecen sólo como borrador visible; no sustituyen silenciosamente la verdad del servidor.
3. Cada edición guarda primero un borrador local y consolida la escritura equivalente en la cola.
4. El motor intenta enviar la operación de inmediato y vuelve a hacerlo al recuperar actividad o vencer el backoff.
5. El servidor confirma la operación y la app retira el elemento de la cola; sólo entonces muestra estado sincronizado.
6. Un `409`, `412`, validación no reintentable o cambio incompatible deja la operación bloqueada para revisión; nunca aplica última escritura gana.
7. Antes de un estado final, la app comprueba que no existan operaciones pendientes o bloqueadas para la entidad.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `OfflineDraft` | Formulario móvil | Sí durante captura | usuario, módulo, tipo e ID de entidad | Se conserva última versión local y fechas de confirmación |
| `OfflineOperation` | Servicio de sincronización | Sí al diferir una escritura | contrato versionado, endpoint permitido y payload serializable | Sí hasta confirmación o resolución |
| `OfflineFileRef` | Cámara/galería | Sí para multipart | existencia, tamaño, nombre y copia durable | Se elimina sólo al confirmar o descartar explícitamente |
| `DocumentUploadProgress` | API de documentos | No | `carga_id`, siguiente índice y total | Sí mientras la carga esté pendiente |

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| `LOCAL` | Repositorio móvil | cambio de formulario | `PENDING` | Ninguno |
| `PENDING` | Motor de sincronización | operación en cola o reintento | `SYNCING` | Espera de backoff o sesión |
| `SYNCING` | Motor de sincronización | ejecución elegible | confirmado, `PENDING` o `BLOCKED` | Una ejecución por usuario |
| `BLOCKED` | Política de conflicto | rechazo no reintentable | reintento manual tras corrección | Impide estado final |
| Confirmado | API | respuesta 2xx válida | operación retirada | No se simula sin servidor |

## 7. Pantallas

| Pantalla | Plantilla T1–T8 | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Capturar Solicitud | T4 | Captura por pasos recuperable | editar, avanzar, reintentar, completar | componentes actuales y `StatusBadge` |
| Entrevista | T4 | Entrevista recuperable | editar, reintentar, continuar | componentes actuales y `StatusBadge` |

## 8. API y persistencia

- Endpoints: conserva los contratos activos de M02/M03; la carga documental acepta un `carga_id`
  UUID estable para iniciar o reanudar lotes. Los `PATCH` de integrante/Solicitud reciben la fecha
  esperada y el `PUT` de Entrevista recibe la revisión esperada.
- Servicios: repositorio offline, almacén de archivos, ejecutor y motor de sincronización.
- Tablas/relaciones: no modifica PostgreSQL en esta vertical.
- Idempotencia: consolidación por `dedupe_key` en autoguardados; UUID estable en carga documental;
  repetición idéntica aceptada sin otra revisión ni auditoría; las evidencias reutilizarán sus claves
  vigentes.
- Auditoría: el servidor mantiene la auditoría institucional; los reintentos idempotentes no deben crear eventos operativos duplicados.

## 9. Reglas de negocio

- Conserva RN y decisiones vigentes de M02/M03.
- Un documento local no completa la solicitud.
- `SUJETA_CREDITO` requiere archivos y escrituras confirmados en servidor.
- La API sigue siendo autoridad de permisos, alcance, validación y estados.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Guardar borrador local | usuario autenticado | permiso efectivo del módulo | metadatos locales por usuario |
| Sincronizar operación | usuario autenticado | JWT vigente y permiso de API | auditoría normal del endpoint |
| Resolver conflicto | pendiente de flujo administrativo | no se resuelve automáticamente | debe quedar explícita |

- La cola nunca persiste el JWT ni encabezados de autorización.
- El cierre de sesión no mezcla colas: cada almacén está separado por `usuario_id`.
- El borrado automático de evidencia pendiente está prohibido; sólo se limpia al confirmar o descartar explícitamente.

## 11. Estados técnicos de UI

- Carga: recuperando servidor o borrador local.
- Vacío: formulario sin datos previos.
- Error: fallo no reintentable con acción concreta.
- Sin conexión: guardado local y pendiente de sincronizar.
- Sin permiso: bloqueo de API vigente.
- Autoguardado: guardando localmente, pendiente, sincronizando, sincronizado o bloqueado.

## 12. Casos especiales

- Duplicados: los autoguardados compatibles se consolidan; multipart usa clave estable.
- Datos incompletos: pueden ser borrador, pero no cambiar de estado final.
- Reintentos: espera exponencial acotada y activación al volver a primer plano.
- Navegación interrumpida: el borrador y la cola sobreviven al cierre de la app.
- Concurrencia: una ejecución por usuario; un cambio nuevo no sobrescribe una operación ya en vuelo.

## 13. Criterios de aceptación

- [ ] Cerrar y abrir la app recupera solicitud y entrevista no confirmadas.
- [ ] Recuperar conectividad sincroniza sin intervención y sin duplicados.
- [x] Una operación `SYNCING` interrumpida vuelve a `PENDING` al restaurarse.
- [x] Los documentos reanudan desde el lote confirmado.
- [x] La UI distingue local, pendiente, sincronizando, confirmado y bloqueado.
- [x] No se permite `SUJETA_CREDITO` con cola pendiente o bloqueada.
- [x] Un conflicto no se resuelve con última escritura gana.

## 14. Pruebas

- Unitarias: repositorio, consolidación, recuperación, backoff y clasificación de errores.
- Integración: reanudación/idempotencia de carga documental en API.
- UI/manuales: captura sin red, cierre, apertura, reconexión, error bloqueante y cierre de solicitud.
- Regresión: lint, TypeScript y suites completas de API y mobile.

## 15. Decisiones abiertas

- Seleccionar y auditar el mecanismo de cifrado local para producción antes de usar datos reales.
- Aprobar la política operativa y UI de resolución humana de conflictos.
- Definir las cadenas offline de Llamada, Visita al vecino e Imágenes del domicilio que dependen de pasos previos confirmados.
