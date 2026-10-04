# M02 — Renovación de grupos

## 1. Identidad

- Nombre oficial: Renovación de grupos
- Código: M02-R
- Estado: parcial / en desarrollo
- Responsable operativo: Operación de crédito
- Roles usuarios: ASESOR

## 2. Objetivo y resultado observable

- Problema que resuelve: los ciclos históricos ya están estructurados, pero el asesor no puede consultarlos para iniciar el ciclo siguiente.
- Resultado esperado: el asesor abre “Renovación”, ve los grupos cuyo último ciclo está a su cargo y crea un expediente con integrantes y montos formales precargados desde ese ciclo.
- Indicadores de éxito: alcance por asesor, cero expedientes parciales, reintento sin duplicados y auditoría del inicio.

## 3. Alcance

### Incluye

- Grupos del corte histórico activo cuyo último ciclo está asignado al asesor autenticado.
- Separación visual entre vigentes y ciclos pasados.
- Creación transaccional de expediente, integrantes y solicitudes core del ciclo siguiente.
- Reutilización de `persona_id` como identidad permanente.
- Lectura de `monto_autorizado` del último ciclo como monto individual efectivamente prestado.
- Bloqueo explícito cuando el último ciclo no cumple el contrato individual exacto.

### No incluye

- Una pantalla de historial personal del asesor.
- Reconciliación manual de ciclos individuales ambiguos o incompletos.
- Copia de documentos, dictámenes o solicitudes hijas del ciclo anterior.
- Decidir liquidación de ciclos pasados.
- Evaluar aquí el umbral de refinanciamiento; puede coexistir ciclo vigente y expediente en documentación.

## 4. Flujo operativo

1. El asesor entra a “Renovación”.
2. La API resuelve su `empleados.id` desde el JWT.
3. La API devuelve el último ciclo de cada grupo asignado, separable por vigente/pasado.
4. La pantalla muestra el grupo y la disponibilidad de datos individuales.
5. El asesor toca una tarjeta disponible.
6. La API valida propiedad, último ciclo, cobertura completa de integrantes y montos e idempotencia.
7. Una transacción crea expediente, integrantes y solicitudes del ciclo siguiente y registra auditoría.
8. La app abre automáticamente el expediente creado para modificar integrantes y montos.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `grupo_id` | último ciclo D01 | Sí | último ciclo asignado al asesor | Sí |
| `numero_ciclo` | D01 | Sí | ciclo máximo del grupo | Sí |
| `persona_id` | integrante del expediente fuente | Sí | identidad existente | Sí |
| `monto_autorizado` origen | solicitud del último ciclo | Sí | monto efectivamente prestado, no nulo | Sí |
| `monto_solicitado` nuevo | `monto_autorizado` del ciclo anterior | Sí | precarga editable para la nueva solicitud; todavía no es autorización | Sí |
| `asesora_id` | empleado del JWT | Sí | usuario–empleado vigente | Sí |

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| Disponible | API | último ciclo y contrato individual completos | creación | ninguno |
| Datos pendientes | API | faltan integrantes o montos del ciclo | segundo contrato | no crea |
| En documentación | Asesor | transacción confirmada | flujo M02 | reglas M02 |

## 7. Pantallas

| Pantalla | Plantilla T1–T8 | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Renovación | T1 lista operativa | crear el expediente siguiente con una pulsación | tocar tarjeta, reintentar | `AppHeader`, `ScreenTitleBar`, `SectionList`, `StatusBadge`, `ScreenState` |
| Detalle de expediente | T2 detalle operativo | comparar por integrante el monto prestado en el ciclo anterior contra lo solicitado en el ciclo nuevo | abrir integrante, continuar captura | `AppHeader`, `ScreenTitleBar`, `Card`, comparación monetaria compacta |

## 8. API y persistencia

- Endpoints: `GET /renovaciones/grupos`, `POST /renovaciones/grupos/:grupoId` y `GET /integrantes/expediente/:expedienteId`.
- Servicio: `RenovacionesService`.
- Tablas: histórico D01 sólo lectura; `grupos`, `expedientes`, `integrantes`, `solicitudes` y `audit_log`.
- Idempotencia: bloqueo transaccional por grupo y auditoría única lógica por grupo/ciclo origen; un reintento devuelve el mismo expediente.
- Auditoría: acción `INICIO_RENOVACION`, actor, expediente, grupo, ciclos origen/destino y conteo, sin datos personales.
- Proyección comparativa: la lista de integrantes devuelve `montoSolicitado` y `cicloNumeroActual` desde la solicitud actual, y `montoAutorizadoAnterior` sólo cuando existe una única solicitud de la misma persona y grupo en `ciclo_numero - 1`. Si falta o es ambigua, `comparacionMontoDisponible=false` y la UI no infiere una tendencia.
- Referencia del Paso 6: `GET /integrantes/:id` devuelve `montoReferenciaPaso6` y `origenMontoReferenciaPaso6`. Si `ciclo_numero > 1`, la única fuente permitida es `monto_autorizado` del ciclo anterior; la API no sustituye un faltante con `personas.monto_solicitado`.
- El mismo contrato devuelve `montoMaximoSolicitable` desde el producto del expediente o, para expedientes históricos sin producto, desde el producto activo. La captura muestra junto al monto anterior `↑` verde cuando aumenta y `↓` roja cuando disminuye.
- Aunque la renovación conserve internamente una precarga, `montoSolicitado` se expone como `NULL` en tarjetas y detalle hasta que exista `monto_solicitado_confirmado_at`; el autorizado anterior permanece separado como referencia.

## 9. Reglas de negocio

- RN-006, RN-008, RN-015, RN-016, RN-018, RN-020 y RN-025.
- Persona permanece como identidad; el nuevo integrante referencia la misma `persona_id`.
- El monto proviene de la solicitud del ciclo, nunca de `personas.monto_solicitado`.
- El monto histórico individual se interpreta como `solicitudes.monto_autorizado`; al precargar la solicitud del ciclo siguiente se copia a `monto_solicitado`, sin autorizar anticipadamente el nuevo crédito.
- El comparativo grupal sólo aparece para `cicloNumeroActual >= 2`. `Prestado` suma los autorizados anteriores comparables; `Monto documentado` suma solicitudes confirmadas de integrantes completas 7/7; `Diferencia` resta prestado anterior al monto documentado actual.
- La comparación del detalle usa siempre `monto_autorizado` del ciclo anterior contra `monto_solicitado` del nuevo ciclo. No usa `personas.monto_solicitado` ni distribuye el total grupal.
- Todo ciclo requiere un expediente único del mismo grupo. El expediente puede existir sin ciclo hasta que ocurra el desembolso real.
- El expediente histórico fuente se relaciona por `ciclo_historico_origen_id` y no tiene `asesora_id`; no aparece en “Mis expedientes”.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Ver grupos renovables | ASESOR | último ciclo asignado | no |
| Crear renovación | ASESOR | permiso crear y cobertura completa | sí |

## 11. Estados técnicos de UI

- Carga: indicador oficial.
- Vacío: sin grupos asignados.
- Error: explicación y reintento.
- Sin conexión: mensaje normalizado del cliente HTTP.
- Sin permiso: API 403 y navegación filtrada.
- Autoguardado: no aplica; la creación es una transacción única.

## 12. Casos especiales

- Duplicados: el mismo grupo/ciclo devuelve el expediente ya creado.
- Datos incompletos: no escribe ninguna fila.
- Reintentos: seguros después de timeout.
- Navegación interrumpida: el expediente confirmado permanece y el reintento lo recupera.
- Concurrencia: `pg_advisory_xact_lock` serializa la creación por grupo.

## 13. Criterios de aceptación

- [x] El asesor no ve una pantalla de historial personal.
- [x] Ve grupos vigentes y pasados de su cartera histórica actual.
- [x] Los grupos pasados usan tarjeta gris claro y etiqueta textual `PASADO`.
- [x] Un grupo sin datos individuales completos queda visible pero bloqueado.
- [x] La API no crea expedientes parciales.
- [x] Una renovación elegible crea expediente, integrantes y montos en una transacción.
- [x] El reintento no duplica.
- [x] Tocar una tarjeta elegible crea y abre directamente el expediente, sin un segundo botón.
- [x] Cada tarjeta conserva el monto solicitado en su tamaño original, muestra `Crédito anterior` a la derecha del avance y arriba de su barra sin agregar un renglón, y presenta junto al solicitado `↑` verde, `↓` roja o `=` con la diferencia; la descripción accesible comunica `AUMENTA`, `DISMINUYE` o `MISMO MONTO`.
- [x] El expediente de renovación muestra el comparativo grupal aprobado con `Ciclo N (anterior)`, `Ciclo N+1 (documentando)`, integrantes, prestado, monto documentado y una línea final denominada únicamente `Diferencia`, con variación de integrantes y de monto.
- [x] El conteo de la diferencia usa `Sra.`/`Sras.` sin abreviar la lectura accesible, y el encabezado verde de integrantes se mantiene fijo al recorrer la lista.
- [x] El corte cargado habilita 276 grupos; 10 de los 26 mostrados a `GPE_BARRON` son elegibles.

## 14. Pruebas

- Unitarias: alcance, cobertura, bloqueo e idempotencia del servicio.
- Integración: contrato individual, simulación transaccional completa, integridad e idempotencia de la carga.
- UI/manuales: carga, vacío, error, vigentes/pasados, bloqueado y creación con una pulsación.
- Regresión: build API, Jest API y TypeScript mobile.

## 15. Decisiones abiertas

- Reglas de reconciliación para filas históricas ambiguas o sin coincidencia de persona/ciclo.
- Regla para equivalencias de nombres y liquidación histórica.
- Reconciliar los grupos que permanecen bloqueados sin inferir integrantes ni montos.
