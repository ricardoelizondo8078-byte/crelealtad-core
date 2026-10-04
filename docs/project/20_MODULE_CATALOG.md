# 20 Module Catalog — Catálogo de Módulos

Versión: 2.21.0
Estado: Vigente y verificado
Fecha de auditoría: 2026-10-04

## Criterio de catalogación

- `Implementado`: existe superficie ejecutable y persistencia verificable para su objetivo principal.
- `Parcial`: existe una parte ejecutable, pero faltan contratos esenciales del módulo.
- `Base de datos`: existen tablas relacionadas sin API/mobile ejecutable verificado.
- `No implementado`: no se verificó superficie ejecutable.

La presencia de tablas, pantallas aisladas o archivos legacy no convierte por sí sola una capacidad en módulo completo.

## M01 Login y acceso — Parcial

Objetivo: autenticar usuarios y entregar únicamente módulos/acciones autorizados.

Verificado:

- `LoginScreen` móvil.
- `POST /auth/login` con throttling.
- `GET /auth/me` protegido.
- La API no enumera usuarios antes de autenticar.
- JWT y guard global.
- Tablas `usuarios` y `roles`; permisos JSONB por rol y conjunto efectivo personalizado opcional por usuario.
- Login por abreviatura y PIN comparado con hash bcrypt individual.
- 49 usuarios/empleados asesores activos en `MATRIZ`, sin zona y con cambio de PIN pendiente.
- `POST /auth/cambiar-pin` y pantalla móvil obligatoria de tres pasos; la API bloquea los módulos mientras la marca siga activa y audita el cambio sin conservar credenciales.
- PIN, contraseñas, tokens y encabezados de autorización redactados de logs.
- Guard global cerrado por defecto y permisos por módulo/acción en los handlers actuales.
- Login y `/auth/me` entregan permisos efectivos; el menú principal móvil T8 filtra módulos ejecutables con ese contrato y cada login inicia en ese selector.
- Las excepciones individuales no cambian `rol_id`, el rol visible ni el alcance de expedientes por responsable.
- La sesión local se restaura sólo después de validar el JWT mediante `/auth/me` y refrescar permisos efectivos.
- El menú cuenta con prototipos visuales deshabilitados, exclusivos de desarrollo, para los nueve módulos operativos futuros; están identificados como `Próximamente` y no conceden navegación ni permisos.

Pendientes críticos:

- Alcance por sucursal/zona.
- Aprobación funcional de la matriz completa rol–módulo–acción.
- Implementar recuperación administrativa/cambio voluntario de PIN y completar la sustitución individual del valor temporal compartido.
- Operar los secretos de despliegue mediante el gestor productivo aprobado.
- Manejo global de expiración durante una sesión ya abierta.

## M02 Documentación — Parcial funcional

Objetivo: crear y completar expedientes e integrantes con solicitud y evidencias.

Verificado:

- Alta y listado de grupos con persistencia.
- Creación automática de expediente al crear grupo.
- No existe alta independiente de expedientes; se evita duplicar el agregado grupo–expediente.
- Lista y detalle de expedientes.
- Alta/edición de integrantes y persona relacionada.
- Solicitud normalizada en ocho tablas con lectura y actualización parcial.
- Relaciones, ciclo, monto autorizado y rutas documentales son campos exclusivos del servidor; la API rechaza suplantaciones del cliente.
- La completitud exige todos los campos del formulario y tres archivos obligatorios confirmados en servidor; la edad se deriva de la fecha de nacimiento.
- Captura y carga inmediata autenticada de INE de la integrante, comprobante de domicilio y solicitud firmada como documentos obligatorios; INE de beneficiario y comprobante de línea de crédito permanecen disponibles como opcionales.
- Códigos postales y colonias.
- Pantallas y formularios móviles conectados parcialmente.
- Solicitud está dividida en siete pasos tipados, reglas puras de completitud/validación y un
  componente independiente para sus visores documentales; el coordinador conserva estado,
  recuperación, autoguardado y navegación.
- Recorrido activo del asesor con contratos `snake_case`, cliente HTTP autenticado y verificación TypeScript limpia.
- Pantalla `Renovación` con grupos vigentes y pasados cuyo último ciclo pertenece al asesor.
- Endpoints de consulta y creación transaccional/idempotente del expediente siguiente, con bloqueo cuando falta el historial individual completo.
- Las rutas legacy paralelas identificadas están excluidas de la compilación activa sin haber sido eliminadas.
- Pantalla T6 `Confirmar integrantes` antes del handoff, con participantes, pendientes y no participantes.
- Retiro/reintegro formal por expediente con cuatro motivos controlados, actor, fecha, checks de consistencia y auditoría.
- Totales compactos de cantidad y monto al pie de cada sección; una retirada conserva historial y no bloquea el envío.
- Selección obligatoria, única y persistente de tesorera entre participantes completas antes del handoff; la fila permanece fija, la tarjeta muestra `T · TESORERA` y la API audita asignación, cambio y desasignación por retiro.
- El rol `ASESOR` tiene alcance por responsable en rutas directas de expediente, integrante, solicitud y archivo, no sólo en la bandeja.
- Altas y cambios principales del recorrido registran auditoría transaccional sin copiar valores personales.

Pendientes críticos:

- Guardado automático consistente en todos los pasos.
- Configurar almacenamiento durable y respaldado para producción.
- Implementar cola offline, idempotencia, reanudación y reconciliación.
- Retirar o migrar definitivamente rutas, alias y variantes legacy excluidas.
- Ampliar la trazabilidad a módulos posteriores y excepciones aún no implementadas.
- Aprobar la matriz funcional completa de asesora/coordinación y aplicar su alcance territorial.
- Parametrizar políticas todavía embebidas.

## M03 Verificación — Parcial funcional

Objetivo: revisar expediente e integrante, registrar evidencias y emitir dictamen trazable.

Verificado:

- Lista de grupos en verificación.
- Detalle de grupo e integrantes.
- Pantalla extensa de verificación de integrante con captura fotográfica.
- El coordinador individual delega Revisión documental, Llamada, Visita al vecino, Imágenes del
  domicilio y las secciones de Preguntas generales, Historial crediticio, Datos personales,
  Ingresos y Encuestas de Entrevista a componentes tipados; visores y diálogos de documentos,
  evidencias y llamadas también están aislados, con hooks para el formulario y el visor.
- Concentrador individual posterior a la revisión documental con cuatro procesos equivalentes que pueden abrirse en cualquier orden: `Llamada`, `Visita al vecino`, `Imágenes del domicilio` y `Entrevista`.
- `Visita al vecino` comienza con una fotografía de fachada tomada únicamente desde la cámara y una ubicación actual; el resto de la pantalla permanece bloqueado hasta que el servidor confirma la evidencia.
- `Visita al vecino` consulta el frente y reverso del INE vigente mediante gesto lateral y abre la cara tocada en un visor opaco de pantalla completa con zoom, sin crear evidencia ni conclusión del proceso.
- Antes del INE, `Visita al vecino` muestra en un recuadro destacado el guion nominal que el verificador debe decir al vecino; la frase aparece sin comillas y en menor tamaño, y el nombre entre comillas conserva su tamaño destacado.
- Debajo del INE, `Visita al vecino` ofrece `Sí / No` para `¿La conoce? ¿Sabe dónde vive?`; al responder exige una ubicación actual válida y sólo comunica guardado tras la confirmación del servidor.
- Entre la pregunta y el guion de correspondencia, `Visita al vecino` ofrece una segunda fotografía de evidencia únicamente desde cámara; exige respuesta confirmada, registra ubicación actual y no reutiliza la evidencia si se genera otra respuesta.
- El acceso `Visita al vecino` refleja el último resultado persistido con una palomita verde para `Sí` o una tacha roja para `No`, incluyendo el resultado en su etiqueta accesible y recuperándolo entre sesiones.
- Las migraciones 018 y 019, la entidad TypeORM y la API autenticada conservan históricamente cada respuesta con integrante, actor, fecha, idempotencia y ubicación del dispositivo. El resumen no expone coordenadas y la auditoría general tampoco las duplica.
- La migración 020 y `verificacion_visita_vecino_fachadas` conservan metadatos, hash, actor y ubicación de la fachada; la respuesta nueva queda ligada a esa evidencia y el archivo se consulta sólo mediante ruta autenticada sin caché compartida.
- La migración 021 y `verificacion_visita_vecino_evidencias` ligan cada segunda evidencia con su respuesta histórica concreta; archivo, resumen y auditoría aplican la misma protección y minimización de coordenadas.
- El botón inferior `Terminar visita al vecino` sustituye la navegación genérica y sólo se habilita cuando la respuesta vigente y su segunda evidencia fueron confirmadas; al pulsarlo vuelve al concentrador.
- Debajo de la selección, `Visita al vecino` muestra un segundo guion destacado para entregar correspondencia: las frases inicial y final aparecen sin comillas y en menor tamaño; el nombre completo conserva comillas y su mayor jerarquía, sin simular una entrega o conclusión.
- `Llamada` permite escoger `Llamada telefónica` o `Llamada por WhatsApp` y, cuando existen dos teléfonos válidos y distintos, seleccionar después el principal o el secundario; con uno solo continúa directamente. El resultado declarado persiste con actor y fecha/hora y alimenta contadores independientes por canal. Si contesta, la API conserva las cuatro preguntas, las seis coincidencias, la acción posterior y una fotografía elegida de la galería; no existe captura libre.
- La paloma de `Llamada` se deriva del servidor y sobrevive al cierre de sesión o de la aplicación. Exige coincidencias positivas, evidencia y una acción distinta de `Llamar más tarde`; las dos opciones de entrevista abren directamente el proceso Entrevista tras el guardado confirmado.
- En `Entrevista`, la captura parcial tipada se autoguarda y se recupera por integrante; familiares y desacuerdos conservan historial. Las fotografías de negocio, control de pagos y folleto se toman exclusivamente con cámara y cada archivo nuevo exige actor del JWT, hora y ubicación actual, además de hash e idempotencia. Las fotos opcionales del negocio no bloquean ni concluyen el proceso.
- Después del domicilio de recolección, Entrevista pregunta si existen familiares en el grupo. `Sí` abre un selector múltiple con las demás integrantes y excluye a la entrevistada; `No` oculta el selector y limpia los identificadores elegidos. Altas y retiros se guardan como eventos inmutables con UUID, actor y fecha.
- Cambio de expediente a `EN_VERIFICACION`.
- Lectura de solicitud e integrantes mediante endpoints compartidos.
- El envío desde el recorrido del asesor usa el cliente HTTP autenticado.
- El menú principal muestra Verificación como segundo módulo; se habilita con `verificacion:leer` y comunica `Requiere permiso` sin abrir la ruta cuando falta autorización.
- `GET /expedientes/en-verificacion` entrega una bandeja autenticada y ordenada de expedientes en espera.
- Grupo, integrante, solicitud y visor de evidencias confirmadas en servidor usan el cliente autenticado.
- `GET /pendientes/revision-documental` deriva para el asesor responsable los grupos con integrantes devueltas, sin tabla ni estado paralelo.
- El menú prioriza esos grupos y el encabezado mantiene un contador global que abre la misma bandeja; cada renglón navega al expediente.
- Existe especificación vigente en `docs/modules/M03_VERIFICACION.md`.
- Grupo e integrante identifican a la tesorera recibida desde Documentación; sólo ella activa las preguntas adicionales de tesorera.

Pendientes críticos:

- Caso de uso backend de dictamen general y entidad/bitácora de su conclusión; las cuatro superficies
  persistentes de Verificación ya existen, pero no deben confundirse con ese dictamen.
- Cola, asignación y responsable de revisión.
- Observaciones estructuradas, aprobación y rechazo auditables.
- Tratamiento operativo de no coincidencias y creación real de una cita para `Agendó visita`; respuestas, acción y evidencia ya se conservan sin declarar conclusión cuando el resultado queda pendiente.
- Tratamiento posterior específico para cada resultado de `Visita al vecino`; su terminación básica ya exige respuesta y segunda evidencia confirmadas.
- Mínimo parametrizado de integrantes cuando M11 defina el producto aplicable; retiro, cero pendientes y al menos una completa ya se validan en servidor.
- Aprobar la matriz funcional completa de VERIFICADOR y aplicar su alcance territorial.
- Criterio funcional de conclusión de Entrevista y cola offline durable; sus respuestas y evidencias ya cuentan con persistencia y recuperación de servidor.
- Crear o asignar usuarios operativos al rol autorizado; al 2026-08-29 no hay usuarios activos `VERIFICADOR` en la base local.

## M04 Análisis — No implementado

Objetivo: evaluar elegibilidad, producto, capacidad y reglas autorizadas.

Verificado:

- Existen datos de solicitud y producto que pueden servir como entrada.

Pendiente:

- Especificación aprobada, API, reglas versionadas, permisos, auditoría y UI.

## M05 Desembolsos — Base de datos

Objetivo: ejecutar de forma idempotente un desembolso autorizado.

Verificado:

- Tablas relacionadas: `creditos`, `ciclos`, `caja_movimientos`, `productos_credito`.
- Relaciones de solicitudes hacia crédito.
- Contrato DEC-029: Desembolsos puede confirmar o sustituir a la tesorera sin devolver el expediente a Verificación; debe guardar la persona definitiva en `ciclos.tesorera_id`, auditar el cambio y conservar la referencia histórica del expediente.

Pendiente:

- No se verificó tabla o módulo explícito de desembolsos en el esquema/runtime actual.
- API, UI, checklist predesembolso, idempotencia, doble control y auditoría.
- Generación exclusiva en backend de `numero_credito` y `credito_id`.

## M06 Cobranza — Base de datos

Objetivo: seguimiento de calendario, pagos, saldos y cumplimiento.

Verificado:

- `creditos`, `calendario_pagos`, `pagos`, `ciclos` y relaciones principales.

Pendiente:

- API, UI, reglas de aplicación de pagos, reversos, conciliación, permisos y pruebas.

## M07 Recolección — No implementado

Objetivo: capturar recaudación en campo y entregarla/conciliarla con control.

Verificado:

- Roles iniciales RECOLECTOR y COBRADOR.
- Tablas de pagos y caja pueden ser dependencias futuras.

Pendiente:

- Especificación funcional, cola offline, recibos, idempotencia, conciliación, API y UI.

## M08 Mora — Base de datos

Objetivo: gestionar cartera vencida, seguimiento y regularización.

Verificado:

- Tabla `mora` relacionada con crédito y calendario.

Pendiente:

- API, reglas, cálculo autorizado, asignación, seguimiento, permisos y UI.

## M09 Convenios — Base de datos

Objetivo: formalizar acuerdos o reestructuras con trazabilidad.

Verificado:

- Tabla `reestructuras` relacionada con crédito.

Pendiente:

- Definir equivalencia funcional convenio/reestructura, autorización, documentos, API y UI.

## M10 Reportes — No implementado

Objetivo: analítica operativa y ejecutiva con fórmulas y fuentes auditables.

Verificado:

- Datos transaccionales parciales disponibles.

Pendiente:

- Catálogo de KPIs, fórmulas, alcance por rol, API, exportación y UI.

## M11 Parámetros — No implementado

Objetivo: administrar políticas con vigencia, aprobación y auditoría.

Verificado:

- `productos_credito` cubre parte de configuración de productos.

Pendiente crítico:

- No se verificaron tablas canónicas `parametros` y `reglas` en el esquema actual.
- Motor de vigencias, autorización dual, historial, API y UI.
- Migrar políticas críticas que permanecen hardcodeadas.

## M12 Administración — Base parcial

Objetivo: administrar usuarios, roles, permisos, empleados, sucursales y zonas.

Verificado:

- Tablas `usuarios`, `roles`, `empleados` y sus tablas hijas, `sucursales` y `zonas`.
- Ocho roles institucionales y un rol técnico aislado de prueba inventariados en la base local; el rol adicional no redefine la matriz objetivo.
- `roles.permisos` y el reemplazo opcional `usuarios.permisos_personalizados` se aplican en la API y el inicio móvil mediante un contrato común de módulo/acción. El catálogo de identificadores está centralizado y la migración 035 valida el formato JSONB sin otorgar permisos nuevos.
- La especificación propuesta `docs/modules/M12_ADMINISTRACION.md` registra el inventario agregado real y diseña la matriz inicial de los doce módulos y ocho roles institucionales. Separa par módulo–acción, alcance territorial, condición operativa y doble control.
- La propuesta deja M04–M10 denegados hasta que cada módulo cuente con especificación aprobada, retira los comodines del objetivo productivo y no convierte DEC-023 en permiso definitivo.
- El contrato actual de listas independientes genera un producto cartesiano entre módulos y acciones; la propuesta v0.1 exige capacidades explícitas por par antes de escalar M12.

Pendiente:

- API y UI administrativas.
- Aprobación explícita de Dirección de la propuesta v0.1 rol–módulo–acción, alcance, excepciones y doble control.
- Migración al contrato por pares, sin comodines productivos, probada primero en `crelealtad_test` y aplicada sólo con respaldo y plan de reversión.
- Alta/baja lógica, reasignación, alcance y auditoría.
- API y pantallas para otorgar y revocar permisos, sujetas a aprobación de la matriz y auditoría reforzada.

## Dependencias transversales prioritarias

1. Autorización y alcance territorial.
2. Auditoría de actor, motivo y resultado.
3. Motor offline y sincronización.
4. Máquina de estados en backend.
5. Parámetros y reglas versionadas.
6. Almacenamiento documental de servidor.
7. Cliente HTTP mobile unificado.
8. Pruebas end-to-end.

## D01 Migración histórica desde Excel — Parcial funcional

Capacidad transversal para preparar el corte histórico que alimentará grupos, renovaciones y reportes sin convertir el Excel operativo actual en una dependencia permanente del app.

Verificado:

- Validador parametrizado del bloque histórico y del resumen vigente.
- Manifiesto con SHA-256, conteos e incidencias sin datos personales de contacto.
- Esquema aditivo para importaciones, ciclos grupales históricos y semanas.
- Prevalidación de grupos/asesoras, carga transaccional e idempotencia.
- Corte SEM 366 cargado y activo: 1,485 ciclos, 24,884 semanas y 299 vigentes.

Pendiente:

- Contrato separado para historial individual de integrantes.
- Ensayo final repetido sobre una base limpia con el esquema definitivo.
- Integración en reportes y precarga efectiva de Renovación después de cargar el contrato individual; la consulta grupal de Renovación ya está conectada.
- Decisión operativa sobre liquidación y equivalencias de nombres.

## Referencias cruzadas

- `project/03_PROJECT_STATUS.md`
- `project/05_BUSINESS_RULES.md`
- `project/09_STATE_MACHINE.md`
- `project/10_DATABASE_PRINCIPLES.md`
- `project/11_ARCHITECTURE_GUIDE.md`
- `project/12_SECURITY_MODEL.md`
