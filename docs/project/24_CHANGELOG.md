# 24 Changelog - Historial de Cambios del Proyecto

## [2026-10-04] - Rotación local de credenciales y saneamiento de Git

### Seguridad local

- Se rotaron la contraseña del rol PostgreSQL local y el secreto JWT de desarrollo sin imprimir
  sus valores. Las conexiones loopback de PostgreSQL pasaron de `trust` a `scram-sha-256`; se
  comprobó que la credencial anterior y la conexión sin contraseña fueran rechazadas.
- `apps/api/.env` permanece ignorado y con acceso limitado a Admin/SYSTEM. La API dejó de tener un
  secreto JWT de respaldo fuera de pruebas, la configuración de base exige credenciales explícitas
  y los comandos canónicos cargan el `.env` local sin versionarlo.
- Se retiró `apps/api/.env.test` del repositorio y se agregó `.env.test.example` sin secretos. Los
  dos generadores de plantillas dejaron de incrustar el PIN temporal y ahora sólo lo reciben desde
  `TEMP_USER_PIN`; este cambio no modifica los hashes ni los PIN almacenados en PostgreSQL.
- El escáner de secretos cubre también `usuario_password` para impedir que una contraseña temporal
  vuelva a entrar en código ejecutable.

### Historial y recuperación

- Los 51 commits de `main` se reescribieron en una copia aislada para retirar archivos `.env`,
  contraseñas literales, respaldos JWT y URLs con credenciales. Se conservaron autores, fechas,
  mensajes, conteo de commits y los 27 blobs binarios verificados; la única ruta retirada fue
  `apps/api/.env.test`.
- El historial restaurado produjo cero hallazgos, pasó `git fsck` y quedó integrado en el `main`
  local sin cambiar el contenido de ninguno de los 1,581 archivos de trabajo. El bundle recuperable
  está en `CRELEALTAD CORE BACKUPS/HISTORY_SANITIZED_20261004` con manifiesto SHA-256.
- `origin/main` se reescribió mediante `force-with-lease` después de validar que el remoto no había
  cambiado y se comprobó que apunta al mismo HEAD saneado que `main`. Después se expiraron reflogs,
  se purgaron objetos locales y `git fsck` terminó sin objetos inalcanzables.
- Las credenciales encontradas quedaron revocadas por la rotación. Cualquier clon, fork o copia
  externa anterior puede conservar el historial viejo y debe volver a clonarse o eliminar sus
  referencias antiguas antes de considerarse saneado.

### Verificado

- `npm run verify`, build Nest, 38 suites y 191 pruebas aprobadas.
- `crelealtad` y `crelealtad_test`: 32/32 migraciones aplicadas, sin pendientes, drift ni entradas
  desconocidas.

## [2026-10-04] - Primera descomposición de Verificación y Solicitud

### Modularidad móvil

- `IntegranteVerificacionScreen` dejó de definir dentro de la pantalla los contratos de datos,
  mapeos de historial crediticio, catálogos de Entrevista y fábricas de evidencias. `Visita al
  vecino`, `Imágenes del domicilio`, `Revisión documental` y `Preguntas generales` de Entrevista
  tienen componentes presentacionales propios; el archivo principal conserva por ahora la
  coordinación y las operaciones de red.
- `SolicitudFormScreen` delega contratos/reglas puras, carga documental y el campo telefónico a
  módulos específicos. Sus siete pasos quedaron separados como componentes con contratos tipados;
  el coordinador conserva recuperación, estado, autoguardado, navegación y visores.
- Los estilos propios de las secciones extraídas viven junto a sus componentes y se retiraron los
  duplicados que ya no tenían consumidores en las pantallas originales.

### Alcance

- La refactorización no modifica reglas, estados, permisos, tablas, endpoints ni flujo operativo.
  No genera una decisión funcional nueva y no cambia `docs/DECISIONES.md` ni el diagrama de datos.
- Permanecen dentro del coordinador de Verificación las secciones aún no extraídas de Entrevista;
  su separación posterior debe conservar los mismos contratos y validaciones.

### Verificado

- `npm run verify` aprobado: escaneo de secretos, TypeScript de API/mobile y 38 suites/189 pruebas.
- Export Android de Expo/Metro aprobado con 817 módulos y bytecode Hermes; el artefacto temporal de
  comprobación se eliminó después de verificarlo.
- Build Nest aprobado y `git diff --check` sin errores de espacios; Git sólo informó la conversión
  de finales de línea ya configurada en el árbol de trabajo.

## [2026-10-04] - Endurecimiento transversal y control de migraciones

### Seguridad y sesión

- Se retiraron credenciales PostgreSQL literales de scripts activos, históricos y de migración; los
  valores se reciben por variables de entorno y los scripts administrativos dejaron de imprimir PIN
  o contraseñas.
- `npm run security:secrets` inspecciona código ejecutable versionado y no versionado y forma parte de
  `npm run verify` sin revelar los posibles valores encontrados.
- Mobile guarda el JWT en Expo SecureStore, migra y elimina el token legacy de AsyncStorage y limpia
  sesión segura, memoria y usuario ante un `401` autenticado.
- Expo se alineó a 57.0.26 y los módulos nativos relacionados a sus parches compatibles.
- El contrato de permisos se centralizó y normaliza por denegación cualquier módulo, acción o forma
  desconocida. La migración 035 valida que los arreglos JSONB de roles y excepciones individuales
  contengan texto, sin otorgar permisos nuevos ni resolver la matriz funcional pendiente.
- El login exitoso actualiza `ultimo_login` y registra `audit_log.LOGIN` con contexto no sensible en
  una sola transacción.

### Modularidad y dependencias

- La validación de tamaño, firma JPEG/PNG/PDF, UUID de ruta y SHA-256 se centralizó en una política
  común reutilizada por Documentación y las evidencias de Verificación.
- El catálogo de los nueve módulos planificados salió de `App.tsx` y usa identificadores canónicos
  dentro del tipo institucional M01–M12; continúan visibles sólo en desarrollo y marcados como
  próximos, sin rutas ficticias.
- La evaluación de acceso operativo y el armado del menú salieron de `App.tsx`; las claves de
  idempotencia duplicadas en cuatro flujos de Verificación se consolidaron en un servicio común.
- La API fijó versiones transitivas corregidas de Multer, body-parser, file-type y qs. El audit de
  producción quedó sin avisos altos o críticos; permanecen dos moderados de NestJS 10 cuya solución
  exige una migración coordinada de CommonJS a NestJS 12/ESM.

### Base de datos

- La migración 033 agregó tres FKs faltantes: crédito–solicitud y los códigos postales de domicilio y
  negocio. Ambas bases conservaron cero huérfanos.
- La migración 034 creó `schema_migrations`; `crelealtad_test` y `crelealtad` quedaron baselinizadas
  con 31 archivos canónicos hasta 034, sin pendientes, drift ni entradas desconocidas.
- Antes de modificar `crelealtad` se creó y validó el respaldo custom
  `database/backups/crelealtad-pre-033-034-20261004-1058.backup`. La base quedó con 50 tablas públicas.
- El ledger incorpora `db:migrations:apply`, que exige confirmación nominal, valida drift y registra
  cada migración sólo después de confirmar su transacción. La 035 fue probada en `crelealtad_test`,
  respaldada en `database/backups/crelealtad-pre-035-20261004-111743.backup` y aplicada a
  `crelealtad`; ambas bases quedaron con 32 migraciones aplicadas y cero pendientes o drift.

### Verificado

- `npm run verify`, TypeScript de API/mobile, build Nest y 38 suites/189 pruebas aprobadas.
- Sintaxis válida en los 63 scripts JavaScript cuya configuración de credenciales fue migrada.

## [2026-10-04] - Reutilizar el comprobante en Evidencia de otra financiera

### Agregado

- El bloque `Evidencia de otra financiera` consulta todas las imágenes vigentes del comprobante de
  línea de crédito ya capturado en Documentación y las presenta antes de las fotografías tomadas
  durante la Entrevista.
- La usuaria puede seguir agregando evidencia sin límite; las fotografías nuevas conservan su rama
  activa o inactiva, ubicación y actor.
- La consulta documental usa el mismo carrusel protegido, muestra carga y error locales y permite
  reintentar sin bloquear el resto de la pantalla.

### Integridad

- Las imágenes documentales no se copian ni se vuelven a guardar en la tabla de evidencias de
  Entrevista. Se conserva una sola fuente para el comprobante y un historial separado para las
  fotografías adicionales.

### Verificado

- TypeScript de mobile aprobado.

## [2026-10-03] - Mantener visible la pregunta del medidor

### Ajustado

- `¿TIENE MEDIDOR DE LUZ?` aparece siempre debajo de la tarjeta de fachada, incluso antes de tomar
  o guardar esa fotografía.
- Las burbujas `Sí / No` permanecen deshabilitadas hasta que el servidor confirma la fachada y el
  campo muestra una explicación breve del requisito.
- El vínculo histórico entre respuesta y fachada, las causas de `No` y el criterio de terminación
  no cambian.

## [2026-10-03] - Igualar el visor del comprobante de crédito con Verificaciones

### Corregido

- La previsualización del comprobante de línea de crédito dejó de apilar fotografías en una lista
  vertical y ahora reutiliza `DocumentImageCarousel`, el mismo carrusel horizontal de
  Verificaciones.
- `Ver` presenta todas las fotografías guardadas en orden lateral; tocar cualquiera abre el visor
  opaco de pantalla completa con pellizco, arrastre y controles de zoom.
- El carrusel compartido ahora carga de forma diferida sólo la foto visible y sus vecinas. Antes
  montaba simultáneamente todas las imágenes originales y todas sus vistas ampliables, lo que podía
  congelar Expo al seleccionar un comprobante numeroso o con fotografías de alta resolución.
- `Guardar`, `Ver` y `Actualizar` ya no compiten con el modal global de procesamiento. El guardado
  usa el indicador de su propio botón, el error queda visible y recuperable en la previsualización,
  y el éxito se comunica mediante `SINCRONIZADO` sin abrir una alerta nativa encima del visor.
- La previsualización y la consulta del comprobante usan una capa de pantalla local; sólo el zoom
  abre un modal nativo. Esto evita el anidamiento de modales que podía dejar una capa invisible
  capturando los toques después de guardar.
- Se identificó que la API en el puerto 3100 seguía ejecutando en memoria la compilación anterior
  con el límite de dos archivos. Se reinició el proceso compilado para activar el contrato vigente.

### Verificado

- TypeScript de mobile aprobado.
- Bundles iOS y Android de desarrollo generados correctamente por Metro después de virtualizar el
  carrusel.
- Integración completa del wizard aprobada nuevamente en `crelealtad_test`, transmitiendo y
  recuperando cuatro fotografías dentro de un solo comprobante.
- API recompilada reiniciada y escuchando nuevamente en el puerto 3100.

## [2026-10-03] - Permitir fotos ilimitadas en el comprobante de línea de crédito

### Agregado

- El Paso 7 permite seleccionar simultáneamente todas las fotos necesarias para el comprobante de
  línea de crédito, sin un límite de cantidad impuesto por la aplicación.
- La pantalla documental alternativa permite además encadenar capturas de cámara mediante
  `Agregar otra` antes de transmitir el conjunto.
- La previsualización y el visor recorren todas las imágenes en su orden; reemplazar conserva el
  comportamiento de versión nueva sin borrar la anterior.

### API y seguridad

- La API admite cualquier cantidad de archivos exclusivamente para `comprobante_credito` y conserva
  el máximo de dos para los demás tipos. Cada archivo mantiene el límite individual de 10 MB y la
  validación real de JPEG, PNG o PDF.
- No se modificó el esquema PostgreSQL ni la regla que mantiene este documento como opcional.

### Verificado

- TypeScript de mobile/API y build Nest aprobados.
- Seis pruebas unitarias de almacenamiento aprobadas, incluida una versión con cinco fotos y el
  rechazo de tres fotos para un documento distinto.
- Integración completa del wizard aprobada en `crelealtad_test`, cargando cuatro fotos en un solo
  comprobante y limpiando los registros técnicos al finalizar.

## [2026-10-03] - Desbloquear la carga de imágenes en el Paso 7

### Corregido

- El selector nativo de cámara o galería ya no se abre debajo del overlay global de procesamiento
  en las dos superficies documentales activas.
- Al volver de seleccionar el comprobante de línea de crédito, la previsualización queda
  interactiva para guardar, cancelar o elegir otra imagen; la pantalla recupera también Atrás y
  las demás acciones.
- El bloqueo global se conserva durante la transmisión real al servidor, evitando dobles envíos sin
  interferir con los controles nativos del dispositivo.

### Verificado

- `npm run typecheck` aprobado en `apps/mobile`.

## [2026-10-03] - Agregar evidencia al historial crediticio externo

### Agregado

- Después de `¿Qué tasa maneja?` y de `¿Qué tasa manejaba?`, Entrevista muestra una tarjeta de
  evidencia fotográfica tomada sólo con cámara y sin límite de cantidad.
- Crédito activo e inactivo usan tipos persistentes distintos; al cambiar la respuesta no se mezclan
  ni se eliminan las fotografías confirmadas de la otra rama.
- La tarjeta recupera el historial, muestra carrusel ampliable, estados de carga/guardado/error y
  conserva las tomas fallidas para reintento con la misma idempotencia.

### Datos y seguridad

- La migración 032 amplía la restricción de tipo de `verificacion_entrevista_evidencias` sin crear
  otra tabla ni modificar filas existentes. Cada alta conserva cámara, hora, ubicación, usuario,
  archivo protegido, hash, auditoría e idempotencia del contrato vigente.
- La reversión se bloquea si existen fotografías de cualquiera de los dos tipos nuevos.

### Verificado

- Cadena de migraciones recreada hasta 032 en `crelealtad_test`; restricción con los cinco tipos
  confirmada y setup técnico aprobado.
- Respaldo custom verificado en `database/backups/crelealtad-pre-032-20261003.backup`; migración
  aplicada en `crelealtad` sin alterar filas existentes.
- TypeScript de mobile/API, build Nest y suite completa de 36 suites/180 pruebas aprobadas.

## [2026-10-03] - Persistir la Entrevista y geolocalizar todas sus fotografías

### Agregado

- `verificacion_entrevistas` autoguarda una captura parcial tipada por integrante, con actor inicial,
  último actor, revisión y FKs restrictivas.
- `verificacion_entrevista_familiares` y `verificacion_entrevista_desacuerdos_montos` conservan
  altas y retiros como eventos inmutables; no se borra historia al corregir una selección.
- `verificacion_entrevista_evidencias` unifica negocio, control de pagos y folleto. Toda foto nueva
  exige cámara, horas de toma/ubicación, latitud, longitud, fuente y usuario autenticado, además de
  archivo protegido, hash e idempotencia.
- Mobile recupera la entrevista antes de habilitar autoguardado, serializa escrituras y comunica
  guardando, guardado o error. Un fallo de recuperación no sobrescribe el servidor con campos vacíos.
- Se agregó la especificación `docs/modules/M03_ENTREVISTA.md` con la matriz campo–tipo–condición.

### Compatibilidad

- Las evidencias previas a la migración 031 se conservan con `legado_sin_ubicacion = TRUE`; no se
  inventan coordenadas retrospectivas.
- La ausencia de ubicación de DEC-063 queda sustituida por DEC-170 para toda captura nueva.
- El criterio de conclusión y la cola offline durable continúan abiertos; un borrador guardado no
  genera por sí solo una paloma ni cambia el estado del expediente.

### Verificado

- Creación, rollback y reaplicación de 031 en `crelealtad_test`.
- Respaldo custom verificado en `database/backups/crelealtad-pre-031-20261003.backup` y migración
  aplicada en `crelealtad`: 49 tablas públicas y cero filas artificiales de entrevista/evidencia.
- TypeScript de API/mobile, build Nest, 36 suites y 178 pruebas aprobadas.

## [2026-10-03] - Condicionar la fotografía del medidor de luz

### Agregado

- Después de confirmar la fachada, `Imágenes del domicilio` pregunta si el domicilio tiene medidor
  de luz mediante `Sí / No`.
- `Sí` se confirma en servidor antes de habilitar la cámara del medidor; `No` abre el selector
  desplazable con cinco causas controladas y exige confirmar una.
- La nueva tabla histórica `verificacion_medidor_luz_respuestas` liga cada respuesta a la fachada
  vigente y conserva causa, actor, fecha, idempotencia, FKs restrictivas y auditoría.
- El cierre y la palomita se derivan del resumen del servidor: fachada más foto para `Sí`, o fachada
  más causa para `No`. La fachada con la integrante continúa opcional.

### Verificado

- Migración 030, reversión y reaplicación validadas en `crelealtad_test`; después se creó y verificó
  `database/backups/crelealtad-pre-030-20261003.backup` y se aplicó la migración en `crelealtad`.
- Compilación TypeScript de mobile/API, pruebas unitarias de servicio/controlador y prueba de
  integración del flujo de imágenes del domicilio.

## [2026-10-03] - Identificar campos libres ya contestados

### Ajustado

- En Verificación, los campos libres vacíos mantienen fondo blanco y borde gris de `1`; al contener
  texto o importe conservan el fondo blanco y cambian a borde ocre de `2`.
- Los errores siguen usando borde rojo y los teléfonos confirmados conservan sus estados verde y
  azul respaldados por evidencia.
- No se agregan palomitas ni fondo ocre a la escritura libre.

## [2026-10-03] - Agregar desconocimiento del domicilio de recolección

### Agregado

- El pop-up de domicilio de recolección termina con `NO SÉ DÓNDE SE RECOLECTARÁ` después de todas
  las integrantes.
- Esa respuesta muestra fondo rojo claro, borde y texto rojos, tacha izquierda y flecha derecha.
  Elegir después una integrante restaura el formato ocre con palomita.

## [2026-10-03] - Completar la uniformidad de selectores confirmados

### Ajustado

- Todo `PickerField` con confirmación explícita presenta automáticamente su valor mediante el
  renglón uniforme, sin depender de una propiedad agregada en cada pregunta.
- Semana, mes de desembolso, ciclos, tasa y motivos condicionales adoptan palomita izquierda, texto
  fuerte, flecha derecha, fondo suave y borde de `2`.
- El selector combinado del último pago adopta el mismo formato y conserva las semanas derivadas.
- Los importes y textos escritos manualmente continúan como campos editables.

## [2026-10-03] - Igualar el borde de respuestas y burbujas

### Ajustado

- Los renglones-respuesta ocres y rojos usan borde de `2`, igual que las burbujas `Sí / No`.
- El cambio incluye respuestas de catálogo, integrantes, desacuerdos y tesorera desconocida, sin
  alterar tamaños, colores ni interacción.

## [2026-10-03] - Destacar en rojo el motivo de no vivir en el domicilio

### Ajustado

- La respuesta confirmada de `¿Por qué no vive en este domicilio?` usa fondo rojo claro, borde,
  texto y tacha rojos, y conserva la flecha para reabrir el selector.
- No cambian el catálogo, la confirmación, la obligatoriedad ni la limpieza condicional.

## [2026-10-03] - Uniformar respuestas confirmadas y editables

### Ajustado

- Los selectores de catálogo resaltados usan el mismo renglón ocre de los selectores de integrantes:
  palomita izquierda, texto fuerte, flecha derecha, borde completo, fondo suave y alto mínimo común.
- El cambio alcanza cómo conoció a la asesora, financiera anterior y familiar propietario del
  domicilio, sin alterar sus preguntas, opciones, validaciones ni pop-ups.

## [2026-10-03] - Simplificar familiares seleccionadas

### Ajustado

- Después de confirmar familiares desaparecen la pregunta secundaria, el campo repetido, el título
  anterior y la ayuda.
- Queda `FAMILIARES EN EL GRUPO` con un recuadro ocre tocable por cada nombre seleccionado.

## [2026-10-03] - Identificar el domicilio de recolección

### Ajustado

- El resumen compacto muestra `DOMICILIO DE RECOLECCIÓN` encima del único recuadro ocre con nombre.
- No se repite la pregunta ni el nombre, y no se atribuye el domicilio a la tesorera cuando se eligió
  a otra integrante.

## [2026-10-03] - Eliminar duplicación del domicilio de recolección

### Ajustado

- Después de confirmar el domicilio desaparecen la pregunta, el campo repetido y el título
  `Domicilio seleccionado`.
- Queda sólo un recuadro ocre con palomita y nombre, tocable para cambiar la selección.

## [2026-10-03] - Igualar los renglones de respuesta de tesorería

### Ajustado

- `NO CONOZCO A LA TESORERA` adopta el mismo alto, relleno vertical y margen inferior del recuadro
  ocre con el nombre seleccionado.
- La `X` usa el mismo tamaño visual que la palomita; se conserva el tono rojo claro.

## [2026-10-03] - Eliminar duplicación de la tesorera seleccionada

### Ajustado

- Después de confirmar a la tesorera desaparecen la pregunta secundaria, el campo repetido y el
  título `Tesorera seleccionada`.
- Queda sólo un recuadro ocre con palomita y nombre.
- El recuadro sigue siendo tocable para cambiar la selección.

## [2026-10-03] - Separar conocimiento e identificación de la tesorera

### Ajustado

- Entrevista pregunta primero `¿Conoce a la tesorera del grupo?` mediante `Sí / No`.
- `Sí` abre automáticamente el pop-up sólo con las integrantes para seleccionar una tesorera.
- Se retiró del pop-up la antigua opción de desconocimiento.
- `No` muestra directamente `NO CONOZCO A LA TESORERA` en un recuadro rojo claro.
- El cambio continúa sin modificar la tesorera oficial del expediente.

## [2026-10-03] - Registrar una causa por cada desacuerdo de monto

### Ajustado

- Marcar una integrante abre inmediatamente su catálogo de causas dentro del mismo pop-up.
- Al guardar la causa vuelve la lista para seleccionar otra integrante y registrar una causa distinta.
- `Guardar selección` se bloquea mientras alguna integrante seleccionada no tenga causa.
- Los renglones rojos muestran `Causa: ...` debajo de cada integrante.
- Se retiró la pregunta general separada sobre el motivo del desacuerdo.

## [2026-10-03] - Abrir automáticamente los motivos condicionales

### Ajustado

- Cada pop-up de motivo se abre al seleccionar la respuesta `Sí / No` que lo habilita, sin requerir
  un toque adicional sobre la pregunta consecuencia.
- En desacuerdo de montos, primero abre la selección de integrantes y al confirmarla abre el motivo.
- Cambiar entre `Sí` y `No` en recomendación abre el catálogo correspondiente.

## [2026-10-03] - Agregar catálogos de motivos en Entrevista

### Implementado

- Cinco seguimientos reutilizan el pop-up con scroll, selección única y `Confirmar selección`:
  desacuerdo con montos, no renovación, falta del control de pagos, recomendación y domicilio no
  habitado.
- La recomendación presenta catálogos distintos para `Sí` y `No`.
- El desacuerdo con los montos conserva la selección de integrantes y agrega un motivo independiente.
- Cada catálogo termina con `Otro motivo` y la selección se limpia si cambia la respuesta principal.
- Las respuestas permanecen locales hasta definir la persistencia general de Entrevista.

## [2026-10-02] - Agregar apellido paterno a la confirmación del domicilio

### Ajustado

- La primera pregunta de `DATOS PERSONALES` muestra ahora los nombres de pila y el apellido paterno
  de la integrante: `[nombres y apellido paterno], ¿vive en este domicilio?`.
- Se conservan las opciones obligatorias `Sí / No` y la misma posición del formulario.

## [2026-10-02] - Confirmar nominalmente el domicilio

### Implementado

- `DATOS PERSONALES` inicia con `[nombres de la integrante], ¿vive en este domicilio?` antes de la
  pregunta sobre renta, propiedad o domicilio familiar.
- El nombre se obtiene de la solicitud vigente y la respuesta obligatoria usa las burbujas
  `Sí / No`.
- La respuesta permanece local hasta definir la persistencia general de Entrevista.

## [2026-10-02] - Preguntar si el hogar conoce el crédito

### Implementado

- Después de `¿Quién vive actualmente con usted?`, Entrevista muestra
  `¿Saben los que viven con usted del crédito?`.
- La nueva pregunta es obligatoria, utiliza las burbujas `Sí / No` y aparece antes de consultar si
  alguien más aporta ingresos al hogar.
- La respuesta permanece local hasta definir la persistencia general de Entrevista.

## [2026-10-02] - Hacer opcionales los datos de la asesora anterior

### Ajustado

- `¿Qué asesora la atendía en esa financiera?` y `¿Cuál es el teléfono de la asesora?` ya no
  muestran asterisco ni bloquean la Entrevista cuando quedan vacías.
- Si se captura el teléfono, se mantiene la validación de diez dígitos.

## [2026-10-02] - Aclarar la pregunta sobre la asesora anterior

### Ajustado

- `¿Cuál es el nombre de la asesora?` cambia a `¿Qué asesora la atendía en esa financiera?` en las
  rutas activa e inactiva del historial crediticio.
- El campo conserva la captura de texto, obligatoriedad y comportamiento existentes.

## [2026-10-02] - Ampliar el rango de tasas en Entrevista

### Ajustado

- `¿Qué tasa maneja?` y `¿Qué tasa manejaba?` muestran ahora todos los valores enteros del `65` al
  `100`, inclusive.
- Ambas preguntas siguen usando el mismo selector desplazable, selección única y confirmación
  explícita, sin escritura manual ni signo de porcentaje.

## [2026-10-02] - Permitir desconocer quién es la tesorera

### Implementado

- El selector `¿Quién es la tesorera del grupo?` agrega `NO SÉ QUIÉN ES LA TESORERA` siempre al
  final, después de todas las integrantes y con la misma capitalización visual.
- La opción conserva la selección única: marcarla sustituye cualquier integrante marcada y elegir
  después una integrante sustituye esta respuesta.
- La respuesta permanece local y no modifica la tesorera oficial del expediente.

## [2026-10-02] - Agregar domicilio familiar en Entrevista

### Implementado

- La pregunta del tipo de domicilio agrega la tercera burbuja `Familiar` junto a `Renta` y `Dueña`.
- Al seleccionarla se abre automáticamente el selector desplazable compartido con `Papás`, `Hijos`,
  `Abuelos` y `Otro familiar`.
- La relación requiere confirmación, permanece visible y se limpia si la respuesta cambia a `Renta`
  o `Dueña`.
- La captura continúa local dentro de Entrevista; no se modificaron API, esquema ni datos.

## [2026-10-02] - Mostrar el ciclo grupal en Verificación

### Implementado

- `Verificación de Grupo` y `Verificación Individual` muestran `CICLO N` al extremo derecho del
  renglón que contiene el nombre centrado del grupo.
- El valor se toma del ciclo de la solicitud vigente del expediente y no del conteo de historial
  individual previo.
- Un ciclo ausente o inconsistente se comunica como `CICLO N/D`, sin inferir datos.
- `ContextHeader` admite ahora un texto contextual corto al extremo derecho sin descentrar el título.
- La etiqueta del ciclo usa una tipografía ligeramente mayor y queda centrada verticalmente con el
  mismo margen superior e inferior en iOS y Android.

## [2026-10-01] - Mostrar el historial individual con CRELEALTAD

### Implementado

- `Entrevista` muestra una tarjeta `CON CRELEALTAD` dentro de `HISTORIAL CREDITICIO` únicamente
  cuando existen participaciones individuales confirmadas anteriores al expediente actual.
- La tarjeta presenta el monto máximo y mínimo con sus ciclos coincidentes y hasta cinco ciclos
  recientes con monto autorizado.
- La API unifica solicitudes autorizadas y créditos reales por `persona_id`, deduplica por
  expediente y prioriza el crédito real cuando ambas fuentes representan la misma participación.
- Se agregó `CreditHistorySummary` a la biblioteca UI y una prueba de servicio para máximo, mínimo,
  empates y límite de cinco ciclos.
- No se modificó el esquema ni se escribieron datos operativos.

## [2026-10-01] - Ampliar las imágenes del domicilio

### Implementado

- Tocar la vista previa de fachada, medidor de luz o fachada con la integrante abre el visor
  compartido a pantalla completa.
- El visor permite zoom con pellizco, arrastre y controles visibles para ampliar o reducir.
- La interacción está disponible en el acceso independiente y dentro de Entrevista, para imágenes
  confirmadas y para una toma local pendiente de envío.

## [2026-10-01] - Simplificar las tarjetas de Imágenes del domicilio

### Ajustado

- Se retiró la oración descriptiva debajo del título en `Fachada`, `Medidor de luz` y `Fachada con
  la integrante`, tanto en el proceso independiente como dentro de Entrevista.
- Las tarjetas conservan su título, estado, cámara, vista previa, reintento y reemplazo.
- Entrevista agrega espacio entre la última tarjeta y `¿Me puede confirmar su número?`.

## [2026-10-01] - Reutilizar Imágenes del domicilio dentro de Entrevista

### Implementado

- `Entrevista` muestra `Fachada`, `Medidor de luz` y `Fachada con la integrante` después de la
  aportación semanal condicional y antes de confirmar el teléfono principal.
- El nuevo punto de acceso reutiliza exactamente la captura persistente de `Imágenes del domicilio`:
  cámara, ubicación, vista previa, reintento, reemplazo, estado confirmado e historial del servidor.
- No se crean archivos ni estados duplicados. Una evidencia tomada desde Entrevista aparece también
  en el proceso independiente y fachada más medidor conservan la misma palomita del concentrador.
- Se aclaró el texto visible para indicar que fachada y medidor de luz son obligatorios, mientras
  la fachada con la integrante continúa opcional.

## [2026-09-30] - Precisar cómo conoció a la asesora

### Ajustado

- El título `¿Cómo la conoció?` cambia a `¿Cómo conoció a la asesora?`.
- Se conservan las cuatro opciones, la apertura automática y `Confirmar selección`.

## [2026-09-30] - Preguntar cómo conoció a la asesora

### Implementado

- Responder `Sí` a `¿Conoce a la asesora?` abre automáticamente el pop-up
  `¿Cómo la conoció?`.
- Las opciones son `Por otra integrante`, `En otra financiera`, `A través de Facebook` y `Otro`.
- La selección usa el formato estándar, exige `Confirmar selección` y permanece visible en el
  campo; responder `No` la oculta y limpia.

## [2026-09-30] - Renombrar la aportación semanal

### Ajustado

- `¿A cuánto asciende el otro ingreso semanal?` cambia a
  `¿A cuánto asciende la aportación semanal?`.
- Conserva el formato monetario obligatorio y sólo aparece cuando otra persona aporta ingresos al
  hogar.

## [2026-09-30] - Preguntar por aportaciones al hogar

### Ajustado

- `¿Tienen algún otro ingreso aparte del suyo?` cambia a
  `¿Alguien más aporta ingresos al hogar?`.
- Se conserva `Sí / No` y el importe semanal obligatorio que aparece al responder `Sí`.
- `No` continúa ocultando y limpiando el importe condicional.

## [2026-09-30] - Mostrar semanas desde el último pago

### Implementado

- El resultado de `¿Cuándo fue su último pago?` muestra la fecha confirmada a la izquierda y las
  semanas completas transcurridas a la derecha como `25 SEM`.
- Al capturarse sólo mes y año, el cálculo toma el primer día de ese mes y la fecha calendario
  actual mediante UTC.
- Las semanas se recalculan como información derivada y no agregan otro campo persistente.

## [2026-09-30] - Unificar mes y año del último pago

### Corregido

- `¿Cuándo fue su último pago?` deja de mostrar dos campos y abre un único pop-up.
- El pop-up presenta simultáneamente un scroll de meses y otro de años.
- Mes y año se aplican juntos mediante un solo `Confirmar selección`; cerrar conserva la respuesta
  anterior.
- El campo muestra fuera del pop-up la combinación confirmada, por ejemplo `Septiembre 2026`.

## [2026-09-30] - Capturar el crédito anterior inactivo

### Implementado

- Responder `No` a `¿Actualmente está activo?` muestra una ruta propia, separada de la captura del
  crédito vigente.
- La ruta pregunta ficha anterior, último pago, ciclos en la financiera, tasa anterior, nombre y
  teléfono de la asesora y motivo de no renovación.
- El último pago usa dos selectores confirmados: mes de `Enero` a `Diciembre` y año, comenzando por
  el actual y cubriendo los cien años anteriores.
- Ciclos conserva el scroll del `1` al `40`, tasa el rango simple del `69` al `84`, la ficha sólo
  pesos enteros y el teléfono diez dígitos.
- Cambiar entre `Sí / No` limpia la ruta anterior para evitar respuestas con significado distinto.

## [2026-09-30] - Precisar los ciclos de la financiera

### Ajustado

- `¿Cuántos ciclos ha tenido?` cambia a `¿Cuántos ciclos lleva en esa financiera?`.
- Se conserva sin cambios el selector del `1` al `40` y la acción `Confirmar selección`.
- La nueva redacción aclara que el dato corresponde a la financiera elegida en el mismo bloque.

## [2026-09-30] - Seleccionar el mes de desembolso

### Ajustado

- `¿En qué semana se desembolsó?` cambia a `¿En qué mes se desembolsó?`.
- El selector deja de mostrar semanas del `1` al `16` y ofrece los doce meses, de `Enero` a
  `Diciembre`, en orden calendario.
- Se conserva el mismo scroll, la marca temporal de la opción y la acción `Confirmar selección` de
  los demás selectores del bloque.
- Retirar el antecedente de crédito grupal limpia también el mes seleccionado.

## [2026-09-30] - Quitar la selección duplicada de montos no aceptados

### Corregido

- Después de guardar, desaparecen el campo desplegable y el encabezado que repetían la integrante
  seleccionada.
- Permanecen únicamente los renglones rojos de montos no aceptados; tocar cualquiera abre otra vez
  el selector con las marcas actuales para agregar, retirar o corregir integrantes.
- Cuando aún no existe una selección, se conserva el campo inicial necesario para abrir la lista.
- La variante es optativa en el componente compartido y no altera los selectores de tesorera,
  domicilio de pagos o familiares.

## [2026-09-30] - Separar Historial crediticio en Entrevista

### Ajustado

- Se agrega la franja amarilla `HISTORIAL CREDITICIO` inmediatamente después de
  `PREGUNTAS GENERALES` y antes de `DATOS PERSONALES`.
- El bloque reúne, sin duplicar y en el orden operativo indicado, el antecedente grupal, la
  financiera, la vigencia, el valor condicional de la ficha, las dos semanas, ciclos, tasa, nombre
  y teléfono de la asesora.
- Se conservan las condiciones, selectores, confirmaciones, formatos y limpieza de respuestas ya
  implementados; no cambia su persistencia local.

## [2026-09-30] - Capturar el valor de la ficha vigente

### Implementado

- Responder `Sí` a `¿Actualmente está activo?` muestra `¿De qué valor es su ficha?` antes de la
  semana actual.
- El campo acepta únicamente pesos enteros y aplica el formato compartido con espacio después del
  signo y coma de miles, por ejemplo `$ 18,000`.
- La respuesta es obligatoria mientras está visible y se limpia al cambiar la vigencia a `No` o al
  retirar el antecedente de crédito grupal.
- La captura continúa local junto con el resto de las respuestas generales de Entrevista.

## [2026-09-30] - Eliminar el bloqueo restante al abrir una integrante

### Corregido

- La pantalla individual deja de lanzar nuevamente la geocodificación nativa de todas las
  integrantes al abrir el concentrador; calcula la distancia sólo con coordenadas ya registradas.
- Cuando todavía faltan coordenadas muestra `DIST. N/D` y evita bloquear el hilo de interacción con
  una tarea derivada que no fue solicitada en esa pantalla.
- Las consultas iniciales de integrante, solicitud, grupo, llamadas y evidencias usan los estados de
  carga locales y no abren el modal global; el desplazamiento y `Atrás` quedan disponibles una vez
  visible el concentrador.
- Las cargas y demás escrituras iniciadas por la persona usuaria conservan el bloqueo global para
  impedir acciones simultáneas.

## [2026-09-30] - Recuperar desplazamiento del concentrador de Verificación

### Corregido

- El `ScrollView` principal de Verificación Individual vuelve a controlar su propia referencia; el
  visor horizontal de documentos usa una referencia independiente.
- La barra inferior deja de superponerse de forma absoluta al contenido y ocupa su espacio debajo
  del área desplazable.
- La persistencia derivada de coordenadas se ejecuta sin abrir el modal global de procesamiento, por
  lo que ya no intercepta scroll, botones ni regreso mientras termina en segundo plano.
- El menú puede desplazarse hasta los últimos botones y la acción de regreso permanece operable
  después de recargar Expo Go.

## [2026-09-30] - Corregir la unidad de Tasa

### Corregido

- El selector de tasa muestra valores simples del `69` al `84`.
- Se retira el símbolo de porcentaje; el rango, la posición y la confirmación no cambian.

## [2026-09-30] - Convertir Tasa en selector acotado

### Ajustado

- `¿Qué tasa maneja?` se mueve inmediatamente debajo de `¿Cuántos ciclos ha tenido?`.
- La tasa deja de admitir escritura manual y se selecciona del `69%` al `84%`.
- La opción queda marcada como borrador y sólo se aplica mediante `Confirmar selección`.

## [2026-09-30] - Confirmar selecciones de semanas y ciclos

### Ajustado

- Al tocar una semana o un número de ciclos, la opción queda marcada dentro de la lista sin cambiar
  todavía la respuesta guardada en pantalla.
- `Confirmar selección` aplica el valor; cerrar el selector conserva la respuesta anterior.

## [2026-09-30] - Convertir semanas y ciclos en selectores

### Ajustado

- La financiera confirmada se presenta en un recuadro amarillo con borde lateral ocre, texto fuerte
  y palomita, diferenciándola de una entrada editable.
- `¿En qué semana van?` y `¿En qué semana se desembolsó?` usan listas de selección del `1` al `16`.
- `¿Cuántos ciclos ha tenido?` usa una lista desplazable del `1` al `40`.
- Los tres campos dejan de aceptar escritura manual y sólo conservan valores del catálogo visible.

## [2026-09-30] - Ampliar el antecedente de crédito grupal

### Implementado

- Responder `Sí` a `¿Ha estado en algún otro crédito grupal?` muestra, además de la financiera, si
  está activo, semana actual, semana de desembolso, número de ciclos, nombre y teléfono de la
  asesora y tasa manejada.
- Los nuevos datos son obligatorios mientras la rama está visible; semanas y ciclos aceptan números,
  y el teléfono exige diez dígitos.
- Responder `No` oculta el bloque y limpia todas sus respuestas locales.

## [2026-09-30] - Mostrar participación del monto solicitado

### Implementado

- El selector `¿Con qué integrantes NO está de acuerdo?` muestra antes de cada nombre el porcentaje
  que representa su monto solicitado respecto de la suma solicitada por todas las integrantes
  activas del expediente.
- El porcentaje usa un decimal y el renglón conserva después el nombre y el monto solicitado.
- Si falta cualquier monto positivo, la respuesta continúa bloqueada y no se presenta un porcentaje
  calculado con información parcial.

## [2026-09-30] - Mantener Conclusiones deshabilitado

### Ajustado

- `Conclusiones` permanece visible al final del menú, con el signo de pesos a la izquierda, pero se
  presenta deshabilitado y no abre ninguna pantalla.
- Los demás accesos conservan su comportamiento.

## [2026-09-30] - Agregar Conclusiones al menú de Verificación

### Implementado

- El concentrador individual muestra al final el botón `Conclusiones`.
- El botón reutiliza el componente visual del resto del menú y presenta un signo de pesos a la
  izquierda.
- La acción abre las conclusiones locales del verificador; no habilita el dictamen ni la transición
  final, que continúan pendientes de contrato, persistencia y permisos aprobados.

## [2026-09-30] - Separar la ubicación de la evidencia del negocio

### Ajustado

- La tarjeta `Fotografías del negocio` incorpora el espaciado vertical estándar antes de
  `¿Dónde se ubica el negocio?`.
- El ajuste es exclusivamente visual y no modifica el orden, las respuestas ni la evidencia.

## [2026-09-30] - Actualizar preguntas y evidencia del apartado Negocio

### Ajustado

- La primera pregunta del bloque cambia a `¿De qué es el negocio?`.
- Se agrega inmediatamente después `¿Cuál es el ingreso libre semanal?` como importe obligatorio.
- La tarjeta opcional de fotografías queda debajo del ingreso y disponible desde que se selecciona
  `Negocio`; admite tomas ilimitadas únicamente desde la cámara, recuperación desde servidor y
  vista a pantalla completa con zoom.
- `¿Dónde se ubica el negocio?` permanece dentro del bloque, después de la evidencia fotográfica.

## [2026-09-30] - Aumentar el contraste del borde de Edad

### Ajustado

- El borde normal de la burbuja de edad cambia de gris claro a gris medio institucional.
- El fondo, el texto y la advertencia amarilla para edades mayores de 70 años no cambian.

## [2026-09-30] - Cambiar Créditos por Ciclos en la burbuja

### Ajustado

- La burbuja individual muestra `CICLO / CICLOS` en lugar de `CRÉDITO / CRÉDITOS`.
- El conteo, la posición, los colores y la fuente de datos permanecen sin cambios.

## [2026-09-30] - Ajustar el color de la burbuja de créditos

### Ajustado

- La burbuja de créditos individuales usa fondo verde claro con borde y texto verde oscuro.
- Las burbujas de edad y distancia conservan sus tratamientos existentes.

## [2026-09-30] - Mostrar contexto individual en Verificación

### Implementado

- La tarjeta fija de Verificación Individual muestra tres burbujas: créditos individuales previos
  registrados, edad y distancia aproximada al domicilio de la tesorera.
- El conteo de créditos unifica solicitudes autorizadas y créditos reales por expediente, evita
  duplicados y excluye el expediente actual antes del desembolso.
- La edad reutiliza el fondo gris y la advertencia amarilla cuando supera 70 años.
- La distancia reutiliza el celeste informativo y cambia a rojo cuando supera 5 km; los datos no
  disponibles se muestran como `N/D`.

## [2026-09-30] - Precisar el uso del crédito

### Ajustado

- `¿Por qué pidió el crédito?` cambia a `¿En qué va a utilizar el crédito?`.
- El campo conserva su posición, obligatoriedad y estado; su placeholder cambia a `Uso del crédito`.

## [2026-09-30] - Corregir signos de interrogación en Verificación

### Corregido

- Se revisaron todas las preguntas literales de las pantallas activas de Verificación.
- Siete preguntas que no comenzaban con `¿`, o lo tenían a mitad del texto, ahora usan apertura y
  cierre correctos.
- También se corrigieron las tildes vinculadas en `cuánto`, `están`, `compañeras`, `cuántos` y
  `quién`, sin modificar opciones, condiciones ni persistencia.

## [2026-09-29] - Agregar el apartado condicional Negocio

### Ajustado

- Seleccionar `Negocio` como origen de ingresos abre una franja amarilla titulada `NEGOCIO`.
- La primera pregunta del apartado es `¿En caso de tener negocio, de qué es?` y se vuelve
  obligatoria dentro de esa condición.
- La ubicación y las fotografías existentes permanecen dentro del mismo apartado y aparecen al
  capturar el tipo de negocio.

## [2026-09-29] - Ordenar las preguntas posteriores a los teléfonos

### Ajustado

- Después del teléfono secundario, `DATOS PERSONALES` pregunta en orden: crédito grupal anterior,
  capacidad de pago semanal, motivo del crédito, origen de ingresos y tipo de negocio.
- El selector de financiera, el apartado condicional `SUELDO` y los datos y fotografías del negocio
  permanecen inmediatamente junto a la pregunta que los habilita.

## [2026-09-29] - Reordenar Datos personales de Entrevista

### Ajustado

- Las primeras siete preguntas siguen el orden operativo marcado por Dirección: tipo de domicilio,
  antigüedad en el domicilio, personas que viven en casa, quién vive con la integrante, otros
  ingresos, teléfono principal y teléfono secundario.
- El importe condicional de otro ingreso permanece inmediatamente debajo de su pregunta.
- El origen de ingresos, el apartado `SUELDO`, la capacidad de pago, el antecedente crediticio, el
  motivo del crédito y los datos del negocio quedaron después de esas siete preguntas.

## [2026-09-29] - Ajustar la instrucción de entrega del folleto

### Ajustado

- El mensaje utiliza la tipografía negra y fuerte del recuadro `TESORERA · CON HISTORIAL`.
- Se eliminó el signo de admiración del recuadro amarillo.

## [2026-09-29] - Capturar evidencia de entrega del folleto para tesorera

### Implementado

- Responder `No` al conocimiento del premio muestra `"Entregar folleto de premio a tesorera"` en
  un recuadro amarillo.
- Se habilita una fotografía tomada exclusivamente con la cámara, sin carrete.
- La vista previa puede abrirse a pantalla completa con pellizco, desplazamiento y controles de
  zoom; también permite repetir la toma.
- La fotografía se identifica como `EVIDENCIA LOCAL` y se limpia si la respuesta cambia a `Sí`.

## [2026-09-29] - Mostrar siempre la pregunta de mejora del servicio

### Ajustado

- La encuesta de servicio termina con `¿En qué cree usted que podemos mejorar?`.
- El campo aparece inmediatamente debajo de la recomendación para toda integrante con historial.
- Ya no depende de que alguna valoración sea regular, mala, lenta, poco clara o negativa.

## [2026-09-29] - Precisar la pregunta de sueldo semanal

### Ajustado

- La primera pregunta del apartado `SUELDO` ahora dice `¿Cuál es su sueldo semanal?`.
- Conserva la captura monetaria y su posición antes del lugar y la antigüedad laboral.

## [2026-09-29] - Agrupar los datos de sueldo

### Ajustado

- Seleccionar `Sueldo` abre una franja amarilla con el título `SUELDO`.
- El bloque pregunta primero cuánto gana semanalmente, después dónde trabaja y finalmente cuánto
  tiempo tiene trabajando ahí.
- El ingreso semanal ya no aparece fuera del apartado salarial.
- Desmarcar `Sueldo` oculta el bloque y limpia sus tres respuestas.

## [2026-09-29] - Ajustar etiquetas de antigüedad laboral

### Ajustado

- `De 3 a 5 años` cambia a `3 a 5 años`.
- `Más de 5 años` cambia a `≥ 5 años`, mostrando el signo de mayor o igual.

## [2026-09-29] - Capturar datos laborales para ingresos por sueldo

### Implementado

- Seleccionar `Sueldo` muestra las preguntas obligatorias `¿Dónde trabaja?` y `¿Desde hace cuánto
  tiempo trabaja ahí?`.
- La antigüedad permite elegir `1 año`, `2 años`, `De 3 a 5 años` o `Más de 5 años`.
- La condición funciona si se eligen `Sueldo` y `Negocio` al mismo tiempo.
- Desmarcar `Sueldo` oculta y limpia ambos datos laborales.

## [2026-09-29] - Eliminar preguntas duplicadas de tesorería

### Corregido

- Se retiraron de la evaluación exclusiva de la tesorera la opinión del crédito y la recomendación
  de la financiera, junto con el motivo asociado.
- La tesorera continúa respondiendo ambas materias una sola vez dentro de `ENCUESTA DE SERVICIO`,
  como integrante con historial.
- Permanecen en su apartado exclusivo la asistencia semanal, la firma del control, el trato de la
  asesora y el conocimiento del premio para tesoreras.

## [2026-09-29] - Unificar la selección de tesorera y domicilio de pagos

### Implementado

- Las dos preguntas abren el mismo pop-up ocre utilizado para seleccionar familiares.
- Cada lista muestra una casilla por integrante y las acciones `Cancelar / Guardar selección`.
- La selección es única, sólo se aplica al guardar y permanece visible debajo de la pregunta.
- El selector compartido ahora admite un límite máximo sin alterar sus usos de selección múltiple.

## [2026-09-29] - Identificar visualmente los montos no aceptados

### Ajustado

- La pregunta del selector presenta `NO` en mayúsculas y con el peso fuerte del encabezado.
- Las integrantes marcadas muestran una `X` en lugar de palomita.
- Todo el renglón seleccionado y el resumen posterior utilizan fondo rojo claro y borde rojo.

## [2026-09-29] - Eliminar el pop-up informativo de montos

### Corregido

- Responder `Sí` a la conformidad de montos ya no abre el desglose informativo de compañeras.
- La respuesta `Sí` se conserva y limpia cualquier selección negativa previa.
- Responder `No` mantiene el selector múltiple con nombre y monto para identificar a las
  integrantes con cuyo importe no se está de acuerdo.

## [2026-09-29] - Seleccionar los montos con desacuerdo

### Implementado

- Responder `No` abre el mismo selector múltiple usado para familiares, con encabezado amarillo,
  casillas y acciones `Cancelar / Guardar selección`.
- Cada opción muestra nombre y monto solicitado; se exige seleccionar al menos una integrante.
- Las selecciones guardadas permanecen visibles como `Integrantes con monto no aceptado`.
- Responder `Sí` conserva el desglose informativo y elimina cualquier desacuerdo previo.

## [2026-09-29] - Exigir montos solicitados reales en el desglose

### Corregido

- La pantalla ahora consume el campo canónico `monto_solicitado` devuelto por el endpoint del
  expediente; antes intentaba leer únicamente la variante camelCase.
- Todas las compañeras muestran su monto solicitado real y positivo.
- Una respuesta incompleta bloquea la captura y solicita actualizar; ya no se muestran `SIN MONTO`,
  `$0` ni valores sustitutos.

## [2026-09-29] - Desplegar los montos de las compañeras

### Implementado

- La pregunta ahora dice `¿Está de acuerdo con los montos de sus compañeras?`.
- Elegir `Sí` o `No` abre un pop-up con las demás integrantes y sus montos solicitados.
- La entrevistada queda excluida; DEC-098 sustituyó el tratamiento inicial de importes ausentes y
  ahora exige el monto solicitado real de todas las compañeras.

## [2026-09-29] - Ampliar la evidencia del control de pagos

### Implementado

- Tocar la vista previa abre la fotografía a pantalla completa.
- El visor permite pellizcar, arrastrar y utilizar controles visibles de zoom hasta `400%`.
- `Cerrar` regresa a la entrevista sin perder la fotografía seleccionada.

## [2026-09-29] - Desbloquear la cámara del control de pagos

### Corregido

- La cámara y la galería ya no se mantienen debajo del overlay global de procesamiento.
- La aplicación espera a que el diálogo de origen termine de cerrarse antes de abrir el selector
  nativo, evitando una presentación simultánea que podía congelar sus controles.
- Se utiliza el contrato actual de Expo para capturar exclusivamente imágenes.

## [2026-09-29] - Separar la evaluación del servicio de la asesora

### Implementado

- `EVALUACIÓN DEL SERVICIO DE LA ASESORA` ahora aparece en una franja amarilla independiente,
  igual a los demás apartados de Entrevista.
- Sus preguntas permanecen inmediatamente debajo y separadas del bloque `CONTROL DE PAGOS`.

## [2026-09-29] - Incorporar Mi Tandita y Solidar

### Implementado

- El catálogo de financieras grupales agrega `Mi Tandita` y `Solidar` en orden alfabético.
- `Otra` continúa al final y la selección permanece exclusiva.

## [2026-09-29] - Selección visible de la última financiera grupal

### Implementado

- La pregunta ahora dice `¿Con qué financiera tuvo su último crédito grupal?`.
- El desplegable conserva selección única y mantiene la opción elegida resaltada con fondo, borde,
  texto del tema de Verificación y palomita.
- La elección se aplica mediante `Confirmar selección`, por lo que puede comprobarse antes de cerrar
  la lista.

## [2026-09-29] - Ampliar el catálogo de financieras grupales

### Implementado

- La lista incorpora `Came`, `Credi Ok`, `CrediMujer`, `Todo Fácil` y `Tuiio (Santander)`.
- `Crédito Sí` ahora aparece como `Crédito Sí (Afirme)`.
- Todas las instituciones se presentan en orden alfabético y `Otra` permanece al final.

## [2026-09-29] - Explicar el Premio al Buen Manejo

### Implementado

- La última pregunta ahora dice `¿Conoce nuestro premio para tesoreras?`.
- Al responder `No`, el recuadro amarillo informa que el premio es el `1%` del valor grupal
  desembolsado del ciclo anterior y que se paga desde el desembolso del tercer ciclo.
- El mismo recuadro muestra las condiciones finales: todos los pagos puntuales, ningún pago menor a
  la ficha y ahorro mínimo de `$70` por integrante.

## [2026-09-29] - Preguntar por el bono de la tesorera

### Implementado

- La encuesta exclusiva de la tesorera con historial termina ahora con
  `¿Conoce nuestro bono para tesorera?`.
- La respuesta es obligatoria, exclusiva y se presenta en burbujas `Sí / No` con el tema de
  Verificación.
- La pregunta queda antes de la encuesta general que la tesorera responde también como integrante.

## [2026-09-28] - Diferenciar el botón Ver teléfono

### Implementado

- `Confirmar` conserva los colores ocres del módulo de Verificación.
- Después de la evidencia confirmada, `Ver` utiliza fondo celeste claro, borde azul más oscuro y
  texto azul oscuro.
- El cambio no modifica dimensiones, alineación, palomita, accesibilidad ni apertura del visor.

## [2026-09-28] - Guardar el teléfono confirmado en la persona

### Implementado

- Una confirmación con evidencia actualiza `personas.telefono` o
  `personas.telefono_secundario` dentro de la misma transacción.
- Una falla revierte evidencia, confirmación y actualización del dato maestro; la palomita continúa
  dependiendo de la respuesta confirmada por el servidor.
- La auditoría registra campo, origen y referencias de integrante, llamada y evidencia, sin copiar
  el número telefónico.
- La migración 029 sólo completó el teléfono maestro vacío que ya contaba con evidencia; conservó
  cualquier valor existente, terminó con dos confirmaciones sincronizadas y cero conflictos.
- Antes de aplicarla se generó y verificó el respaldo
  `database/backups/crelealtad-pre-029-20260928-194134.backup`.

## [2026-09-28] - Ampliar la evidencia telefónica

### Implementado

- El botón `Ver` abre directamente un visor opaco casi a pantalla completa en lugar de mostrar la
  evidencia como miniatura dentro de una hoja inferior.
- La imagen permite zoom por pellizco hasta 400 %, arrastre y controles visibles para acercar,
  alejar y restablecer el tamaño.
- `Cambiar evidencia` permanece disponible dentro del visor; después de seleccionar otra imagen se
  muestra la confirmación de guardado y cancelar la selección devuelve a la evidencia vigente.
- El visor utiliza el tema visual de Verificación y mantiene etiquetas accesibles en sus acciones.

## [2026-09-28] - Unificar y versionar la evidencia de llamada

### Implementado

- Toda evidencia, incluida la originada al confirmar un teléfono desde Entrevista, queda relacionada
  con su intento en `verificacion_llamada_evidencias`.
- La tabla distingue evidencia de encuesta y de confirmación telefónica, conserva el tipo y número
  utilizados y asigna una versión consecutiva por intento y propósito.
- `verificacion_entrevista_telefono_confirmaciones` conserva la confirmación y su referencia
  `evidencia_id`; ya no fragmenta el historial visual de Llamada.
- En un teléfono confirmado, el botón cambia de `Confirmar` a `Ver`; abre la imagen protegida vigente
  y permite reemplazarla. Cada reemplazo agrega una versión y conserva intactas las anteriores.
- La migración 028 respaldó `crelealtad`, incorporó dos evidencias de encuesta y una de confirmación
  telefónica al historial unificado, y terminó con cero evidencias sin intento y cero referencias
  inválidas.

## [2026-09-28] - Completar Llamada desde Entrevista

### Implementado

- Guardar la evidencia de una llamada contestada dentro de Entrevista marca también `Llamada` como
  realizada en el menú.
- No se solicita entrar después al proceso ni contestar su encuesta.
- `No contestó` conserva el intento, pero no confirma el teléfono ni completa `Llamada`.
- Mientras no exista evidencia confirmada, el número continúa editable; después se aplican la
  palomita y el bloqueo definidos para teléfonos confirmados.

## [2026-09-28] - Reutilizar la confirmación previa y bloquear el teléfono

### Implementado

- Cada intento nuevo de `Llamada` conserva el número utilizado y su tipo principal o secundario.
- Una llamada contestada con evidencia confirma automáticamente ese mismo número al abrir
  Entrevista; no solicita repetir llamada ni evidencia.
- Un teléfono con palomita queda bloqueado para edición y su acción `Confirmar` se deshabilita.
- Los 44 intentos históricos permanecen íntegros y sin número atribuido porque ese dato no fue
  capturado cuando se registraron.
- La migración 027 fue probada con ida y vuelta en `crelealtad_test`, respaldada en
  `database/backups/crelealtad-pre-027-20260928-184818.backup` y aplicada en `crelealtad` sin pares
  incompletos ni cambios a los intentos anteriores.

## [2026-09-28] - Evidencia y palomita al confirmar un teléfono en Entrevista

### Implementado

- `No contestó` registra el intento geolocalizado y termina el flujo sin abandonar Entrevista.
- `Sí contestó` abre únicamente la selección y guardado de evidencia; ya no lleva a la encuesta del
  proceso independiente `Llamada`.
- La API conserva tipo de teléfono, número normalizado, intento contestado, evidencia protegida,
  hash, actor y fecha mediante la migración 026.
- Antes de activar la migración 026 en `crelealtad` se generó y verificó el respaldo
  `database/backups/crelealtad-pre-026-20260928-182211.backup`; la nueva tabla inició con cero filas.
- El campo obtiene borde y círculo verdes con palomita sólo después de la confirmación del servidor;
  el indicador se recupera al reabrir y se retira visualmente si se cambia el número.
- Después de subir la evidencia, mobile vuelve a consultar el resumen persistido y sólo cierra la
  captura y pinta la palomita cuando el servidor devuelve el mismo tipo y número; una carga no
  confirmada conserva el flujo abierto y muestra el error para reintentar.
- La confirmación del teléfono y los accesos del menú reutilizan el mismo indicador compartido:
  círculo verde claro, borde verde oscuro y palomita verde, evitando variantes locales.
- El proceso `Llamada`, cuando se abre desde su acceso propio, conserva completa su encuesta.

## [2026-09-28] - Elegir teléfono principal o secundario en Llamada

### Implementado

- Después de elegir llamada telefónica o WhatsApp, la primera vista de `Llamada` muestra los
  números `Principal` y `Secundario` cuando ambos son válidos y diferentes.
- Si sólo existe el número principal, abre directamente la aplicación correspondiente sin agregar
  otro paso.
- Un número secundario vacío, incompleto o repetido no aparece como opción.
- Se conservan los contadores por canal, el registro de ubicación y la regla que habilita WhatsApp
  únicamente después del primer intento telefónico.

## [2026-09-28] - Confirmar también el teléfono secundario

### Implementado

- El teléfono secundario usa el mismo tamaño de campo y botón `Confirmar` del teléfono principal.
- El botón permanece visible y deshabilitado cuando está vacío o incompleto; se habilita únicamente
  al capturar diez dígitos.
- Al confirmarlo permite elegir llamada telefónica o WhatsApp y continúa el mismo proceso persistente
  de Llamada.
- El campo secundario continúa siendo opcional y puede dejarse vacío.

## [2026-09-28] - Canal de llamada desde Confirmar teléfono

### Implementado

- El campo principal usa el espacio disponible y deja el botón `Confirmar`, sin modificar su tamaño,
  alineado al margen derecho del formulario.
- `Confirmar` abre un selector para llamada telefónica o llamada por WhatsApp.
- Ambos canales continúan el proceso existente: resultado, ubicación y encuesta de llamada cuando
  corresponda.
- WhatsApp permanece visible pero deshabilitado hasta registrar la primera llamada telefónica, de
  acuerdo con la regla vigente.

## [2026-09-28] - Botón Confirmar para el teléfono principal

### Implementado

- El campo de `¿Me puede confirmar su número?` ocupa menos ancho y conserva espacio suficiente para
  el número formateado.
- El botón cuadrado con icono fue sustituido por `Confirmar` en los colores de Verificación.
- El botón sólo se habilita con diez dígitos y reutiliza el flujo existente para abrir la llamada.
- El número secundario conserva el botón y el espacio reservado definidos previamente.

## [2026-09-28] - Dos encuestas completas para la tesorera

### Implementado

- La tesorera con historial confirmado conserva completa su encuesta exclusiva: control de pagos,
  opinión del crédito, asistencia semanal, firma del control, trato de la asesora, recomendación y
  motivo.
- Después responde también la encuesta general de servicio porque continúa siendo integrante.
- Ambos bloques usan estados independientes; responder uno no completa ni modifica el otro.

### Alcance

- Las respuestas permanecen locales mientras se define el contrato general de persistencia de
  Entrevista.

## [2026-09-28] - Encuesta de servicio por historial individual

### Implementado

- La API expone `tiene_historial_interno` como valor explícito `true / false / null`, calculado por
  la identidad individual en otros expedientes con crédito o monto autorizado confirmado.
- `Control de pagos` dejó de depender del ciclo del grupo: aparece sólo para la tesorera cuando su
  historial individual está confirmado.
- Toda integrante con historial individual confirmado recibe una encuesta breve en burbujas sobre
  opinión del crédito, trato en desembolso, rapidez, claridad y recomendación.
- Una valoración regular o negativa abre la pregunta obligatoria `¿Qué podríamos mejorar?`.
- Un historial desconocido no se interpreta como renovación y no habilita ninguna encuesta.

### Alcance

- Las respuestas y la fotografía del control permanecen locales; no se modificó el esquema. La
  persistencia protegida, auditoría y sincronización de la encuesta continúan pendientes.

## [2026-09-27] - Encuesta a la tesorera desde el ciclo 2

### Implementado

- La entrevista muestra `ENCUESTA A LA TESORERA` exclusivamente para la tesorera de una
  renovación, equivalente al ciclo 2 o posterior.
- `¿Tienen su control de pagos?` muestra debajo un botón para tomar una fotografía con la cámara o
  seleccionarla desde la galería cuando la respuesta es `Sí`. La vista la identifica como selección
  local, no como evidencia confirmada por el servidor.
- La captura usa el mismo formato visual de `Imágenes del domicilio`: tarjeta con borde ocre,
  estado visible y botón ocre de ancho completo con icono de cámara, sin leyendas intermedias.
- `No` exige registrar qué ocurrió y recuerda explicar la firma semanal por asesora y tesorera, así
  como su presentación obligatoria en el próximo desembolso.
- La evaluación de calidad incorpora las cinco preguntas del formato físico y solicita el motivo de
  recomendar o no a CRELEALTAD.

### Alcance

- La encuesta y la fotografía permanecen locales. No se modificó el esquema ni se escribió
  información operativa; persistencia protegida, auditoría y sincronización continúan pendientes.

## [2026-09-27] - Antecedente en otros créditos grupales

### Implementado

- Después del tamaño del hogar se agregó `¿Ha estado en algún otro crédito grupal?` con selección
  obligatoria `Sí / No` en los colores de Verificación.
- `Sí` abre automáticamente, sin otro toque, una lista desplegable obligatoria con
  `Compartamos Banco`, `Crediclub`, `Crédito Sí`, `Banco BanFeliz`, `Exitus Contigo`,
  `Seamos Socios` y `Otra`.
- `No` oculta la lista y limpia la financiera previamente seleccionada.

### Alcance

- Las respuestas permanecen locales hasta implementar el contrato general de persistencia de
  Entrevista. No se modificó el esquema ni se escribió información operativa.

## [2026-09-27] - Personas en casa y otros ingresos

### Implementado

- Después de `¿Quién vive actualmente con usted?` se agregó `¿Cuántas personas viven en casa?`
  con burbujas `1`, `2`, `3`, `4`, `5` y `≥6` en los colores de Verificación. Las opciones del
  `1` al `5` son círculos iguales; únicamente `≥6` conserva forma ovalada.
- Después del ingreso semanal se agregó `¿Tienen algún otro ingreso aparte del suyo?` con
  `Sí / No`.
- `Sí` abre un importe semanal obligatorio con teclado numérico y formato monetario; `No` lo
  oculta y elimina cualquier valor previamente capturado.

### Alcance

- El otro ingreso no se suma automáticamente ni modifica la capacidad de pago. Las respuestas
  permanecen locales mientras se define el contrato general de Entrevista.

## [2026-09-26] - Ingresos y capacidad de pago en Datos personales

### Implementado

- Después de los teléfonos se agregó `¿De dónde provienen sus ingresos?` con selección múltiple
  `Sueldo / Negocio`; puede elegirse una o ambas opciones. Los controles usan botones tipo cápsula
  y el color ocre del módulo de Verificación al seleccionarse.
- Se agregaron `¿A cuánto ascienden sus ingresos semanales?` y
  `¿Cuánto puede pagar por semana?` como importes obligatorios con teclado numérico y formato `$`.
- Las tres preguntas aparecen antes de `¿Quién vive actualmente con usted?`.

### Alcance

- Las respuestas permanecen locales y no aplican todavía porcentajes, límites o decisiones
  financieras automáticas.

## [2026-09-26] - Teléfonos al inicio de Datos personales

### Implementado

- `DATOS PERSONALES` comienza con `¿Me puede confirmar su número?`; el teléfono vigente aparece
  precargado, puede editarse y tiene un botón cuadrado para marcar.
- Inmediatamente después aparece `¿Tiene algún número secundario?`, con captura opcional y el mismo
  control de llamada. El renglón reserva un espacio transparente del tamaño del botón para igualar
  el largo de ambos campos; al completar diez dígitos el control aparece sin mover el contenido.
- Los controles de llamada reutilizan el formato visual del teléfono superior: cuadro azul claro
  con icono oscuro, en lugar del botón ocre.
- `¿Quién vive actualmente con usted?` continúa después de los dos campos telefónicos.
- Se agregó el componente compartido `PhoneCallField`, construido con tokens y el flujo existente
  de confirmación de llamada.

### Alcance

- Los cambios son locales al formulario de Entrevista y no modifican todavía el teléfono maestro
  almacenado en servidor.

## [2026-09-25] - Bloque Datos personales en Entrevista

### Implementado

- `PREGUNTAS GENERALES` termina después de la pregunta sobre familiares en el grupo y de su
  selector condicional.
- `PREGUNTAS GENERALES` y `DATOS PERSONALES` usan la misma franja horizontal con fondo ocre claro y
  texto ocre oscuro del módulo de Verificación.
- Se reutilizó `StickySectionHeader` y los tokens institucionales, sin cambiar respuestas,
  obligatoriedad o persistencia.

## [2026-09-25] - Primera pregunta general de Entrevista

### Implementado

- `PREGUNTAS GENERALES` comienza con `¿Conoce a la asesora?` y las opciones únicas obligatorias
  `Sí / No`.
- La nueva pregunta aparece antes de `¿Conoce a todas las integrantes del grupo?` y conserva el
  alcance local vigente de las respuestas generales de Entrevista.

## [2026-09-25] - Familiares dentro del grupo en Entrevista

### Implementado

- Después del domicilio de recolección se agregó `¿Tiene algún familiar en este grupo?` con las
  opciones únicas `Sí / No`.
- `Sí` abre automáticamente un selector emergente de selección múltiple con las demás integrantes
  del grupo. La entrevistada queda excluida y los valores se conservan por identificador, no por nombre.
- Después de guardar el popup, todos los nombres seleccionados permanecen visibles debajo de la
  respuesta y se actualizan con cada cambio de selección.
- `No` oculta el selector y elimina selecciones anteriores. La pregunta queda antes de
  `¿Quién vive actualmente con usted?`, conforme a la ubicación indicada.
- Se agregó `MultiSelectPickerField` como componente compartido, con selección temporal,
  cancelación, confirmación, desplazamiento y estados accesibles de casilla.

### Alcance

- La captura permanece local como el resto de respuestas generales de Entrevista; no simula
  persistencia ni conclusión confirmada por el servidor.

## [2026-09-25] - Evidencia del negocio exclusivamente desde cámara

### Cambiado

- `Fotografías del negocio` abre únicamente la cámara del teléfono; se retiró el acceso al carrete
  y a la galería. Cada apertura captura una fotografía y la acción puede repetirse sin límite de
  cantidad ni mínimo obligatorio.
- Las nuevas evidencias se registran con origen `CAMARA`. La migración 025 amplía el constraint para
  preservar cualquier fila histórica `GALERIA` sin permitir que mobile vuelva a crearla.

### Verificado

- La ausencia de fotografías continúa sin bloquear ni concluir Entrevista; se mantienen el límite
  técnico de 10 MB por archivo, almacenamiento protegido, idempotencia y reintento.

## [2026-09-25] - Fotografías opcionales del negocio en Entrevista

### Implementado

- Cuando el verificador captura el tipo de negocio, Entrevista muestra una tarjeta opcional para
  tomar fotografías con la cámara, volver a agregar más y ampliar las guardadas.
- No se exige una fotografía y no existe máximo de cantidad; sólo se conserva el límite técnico
  de JPEG/PNG y 10 MB por archivo.
- Una selección parcial conserva las fotografías confirmadas y mantiene las fallidas para reintento
  con la misma clave de idempotencia.
- La API autenticada lista, registra y entrega cada archivo protegido con alcance a la integrante.
  La tabla `verificacion_entrevista_negocio_evidencias` conserva historial, hash, actor, fecha y
  origen `CAMARA`; la auditoría registra metadatos sin copiar la imagen.
- La migración 024 fue probada con aplicación repetida, rollback y reaplicación en
  `crelealtad_test`; después de un respaldo completo se aplicó a `crelealtad` sin alterar los
  5,063 integrantes ni los 865 expedientes existentes.

### Verificado

- TypeScript de API y mobile terminó sin errores.
- Las 3 suites específicas aprobaron 7 pruebas de servicio, controlador y almacenamiento.
- La tabla operativa nació vacía con FKs restrictivas, checks e índices; el respaldo previo es
  `database/backups/crelealtad-pre-024-20260925-203427.backup`.

## [2026-09-25] - Medidor de luz obligatorio en Imágenes del domicilio

### Implementado

- Se agregó `2. Medidor de luz` entre `1. Fachada` y `3. Fachada con la integrante`; conserva cámara exclusiva, ubicación, fecha, actor autenticado, idempotencia, vista previa y repetición.
- `Fachada` y `Medidor de luz` son obligatorias. `Fachada con la integrante` permanece opcional.
- `Terminar imágenes del domicilio` y la palomita verde del concentrador exigen que la API haya confirmado fachada y medidor; el resumen recupera ambas evidencias entre sesiones.
- La migración 023 amplió el tipo controlado de `verificacion_imagenes_domicilio` con `MEDIDOR_LUZ`, sin modificar ni eliminar las 5 filas existentes. Se creó y verificó el respaldo completo `crelealtad_pre_023_medidor_luz_20260925.dump` antes de aplicarla.

### Verificado

- TypeScript de API y mobile terminó sin errores.
- La suite unitaria específica aprobó 5 pruebas y la integración real aprobó el flujo con tres evidencias, la regla de cierre y la persistencia geolocalizada del medidor.
- La restricción quedó validada en `crelealtad` y `crelealtad_test`; la tabla operativa conservó sus 5 filas.

## [2026-09-25] - Documentos disponibles durante toda la Verificación

### Implementado

- El concentrador de Verificación Individual muestra `Documentos` como primer acceso, antes de `Llamada`.
- El verificador puede volver a abrir las imágenes, consultar frente y reverso y utilizar el zoom después de superar el Paso 1.
- La consulta incluye `INE Beneficiario` y `Comprobante Línea de Crédito`, identificados como opcionales; su ausencia se informa sin bloquear el flujo.
- La reapertura es de consulta: conserva el avance, oculta las decisiones `Sí / No` y regresa al menú mediante `Volver a procesos`.
- Los cuatro procesos operativos existentes mantienen su orden libre y sus indicadores actuales.

### Verificado

- TypeScript de mobile termina sin errores.

## [2026-09-25] - INE del beneficiario opcional

### Implementado

- `INE Beneficiario` muestra la burbuja `OPCIONAL` en el Paso 7 y en la pantalla documental
  alterna; si ya existe, conserva captura, consulta, reintento y reemplazo.
- El botón `COMPLETO ✓`, el avance 7/7 y la transición a `SUJETA_CREDITO` exigen únicamente
  INE de la integrante, comprobante de domicilio y solicitud firmada confirmados por el servidor.
- El detalle del expediente usa el mismo conjunto de tres evidencias para calcular el avance.
- La revisión inicial de Verificación dejó de bloquearse por la INE opcional del beneficiario y
  continúa evaluando los tres documentos obligatorios.
- No se modificó PostgreSQL ni se borraron rutas o archivos existentes.

### Verificado

- `npm run typecheck` terminó sin errores para API y mobile.
- La prueba de validación de integrantes confirmó que una solicitud completa sin INE del
  beneficiario puede pasar a `SUJETA_CREDITO` y que el faltante opcional no se reporta como
  bloqueante del Paso 7.
- La suite completa aprobó 33 suites y 153 pruebas; `nest build` terminó sin errores.

## [2026-09-25] - Bloqueo global de interacción durante procesamiento

### Implementado

- Se agregó un controlador central con conteo de operaciones anidadas y paralelas; la interfaz no
  vuelve a habilitarse hasta que termina la última operación, incluso cuando alguna falla.
- El shell monta una única superficie modal con indicador animado y mensajes `Cargando…`,
  `Guardando…` o `Procesando…`; captura todos los toques, bloquea el regreso físico y anuncia el
  estado mediante accesibilidad.
- El cliente HTTP activa el bloqueo de forma predeterminada y permite declarar como silencioso el
  trabajo de fondo. Los botones compartidos ignoran nuevos toques mientras una acción asíncrona
  bloqueante está activa.
- El autoguardado de Solicitud y las búsquedas de colonias por código postal ya no abren el overlay;
  el formulario conserva su indicador discreto `Guardando…` / `Guardado ✓` sin interrumpir la
  captura.
- Login, renovación, documentación, solicitud y los procesos de Verificación con cámara, galería,
  ubicación o reintento quedaron conectados al mismo contrato global.
- La protección evita concurrencia iniciada desde la interfaz, pero conserva como responsabilidades
  independientes la idempotencia de API, la confirmación real del servidor y la sincronización
  offline.

### Verificado

- `npm run typecheck` en la raíz terminó sin errores para API y mobile.
- La exportación web de Expo completó 514 módulos sin errores.
- Se verificó el controlador con operaciones anidadas, paralelas, liberación ante error y rechazo
  de una segunda acción exclusiva.

## [2026-09-25] - Palomita persistente de Imágenes del domicilio

### Implementado

- El concentrador de Verificación recibe ahora el estado ya calculado de `Imágenes del domicilio` y muestra la palomita verde cuando la fachada obligatoria fue confirmada por la API.
- El indicador se recupera del resumen persistente al volver a abrir el expediente; la fotografía opcional con la integrante no condiciona la palomita.
- Se confirmó mediante consulta agregada y sin exponer datos personales que `verificacion_imagenes_domicilio` existe y contiene evidencias guardadas. No fue necesaria una migración ni un cambio de API.

### Verificado

- `npx tsc --noEmit` en mobile terminó sin errores.

## [2026-09-25] - Nomenclatura trasladada fuera de Imágenes del domicilio

### Implementado

- Se retiró la tarjeta `Nomenclaturas de las calles` de `Imágenes del domicilio`; las dos tarjetas restantes se renumeran automáticamente como `1. Fachada` y `2. Fachada con la integrante`.
- `Fachada` es la única evidencia obligatoria y `Fachada con la integrante` permanece opcional. Tanto mobile como el resumen de la API habilitan `Terminar imágenes del domicilio` con la fachada confirmada por el servidor.
- El tipo `NOMENCLATURAS_CALLES`, la restricción de PostgreSQL y cualquier fila histórica permanecen intactos para el módulo futuro. No se ejecutó migración ni borrado de datos.
- Se actualizaron pruebas unitarias e integración para comprobar que nomenclatura y fachada con la integrante pueden estar ausentes al terminar.

### Verificado

- Las tres suites unitarias específicas aprobaron 8 pruebas y la integración real confirmó que la foto con la integrante no basta para cerrar y que la fachada sí permite terminar sin nomenclatura.
- La suite completa de API aprobó 33 suites y 153 pruebas. `nest build` y `npx tsc --noEmit` en mobile terminaron sin errores.

## [2026-09-22] - Persistencia geolocalizada de Imágenes del domicilio

### Implementado

- La migración 022 creó `verificacion_imagenes_domicilio` con una fila histórica por toma, tipo controlado, archivo protegido, hash, fecha de foto, usuario verificador, coordenadas, precisión disponible, fecha de lectura e idempotencia.
- La API autenticada permite registrar y recuperar las imágenes por integrante con alcance y permisos de Verificación. Los archivos se validan como JPEG/PNG real de hasta 10 MB y se entregan con `Cache-Control: private, no-store`.
- El resumen devuelve la captura más reciente de cada tipo, omite coordenadas y actor, y sólo declara habilitado el cierre cuando existen nomenclaturas y fachada. `audit_log` tampoco copia coordenadas.
- Mobile toma cada imagen únicamente con cámara, obtiene ubicación inmediatamente después, muestra estados de envío y conserva foto, punto y clave durante la sesión para reintentar sin duplicar. Sólo una confirmación del servidor cambia el estado a `GUARDADA` y satisface el cierre.
- Las tres imágenes continúan disponibles en cualquier orden y con marco ocre; fachada con la integrante permanece opcional.
- El volcado oficial quedó actualizado a 43 tablas, 70 FKs, 44 restricciones UNIQUE, 53 CHECK explícitos y 159 índices.

### Verificado

- La migración 022 se aplicó dos veces, inspeccionó, revirtió y reaplicó en `crelealtad_test`; la prueba integral confirmó orden libre, obligatoriedad de las dos evidencias, idempotencia, actor, ubicación, archivo protegido, minimización y limpieza.
- Se creó y validó `crelealtad_pre_022_imagenes_domicilio_20260922.dump` (4,098,690 bytes; SHA-256 `F6B28E77469308DB4D06F8F711A8084361E3DD2F791D3BEFFC79C518B9054882`).
- `crelealtad` recibió la tabla vacía con 17 columnas, 12 restricciones y 3 índices; no se modificaron filas operativas existentes.
- Las tres suites unitarias específicas aprobaron 7 pruebas y la integración real aprobó 1 prueba. La suite completa aprobó 33 suites y 152 pruebas; `nest build` y TypeScript mobile terminaron sin errores.
- `npm run test:setup` reconstruyó `crelealtad_test` desde el volcado actualizado, verificó la presencia de la tabla nueva y la integración volvió a aprobar sobre ese entorno limpio.

## [2026-09-22] - Marcos ocres en Visita al vecino

### Implementado

- Fachada, INE/pregunta, evidencia y aviso bloqueado usan marco ocre fuerte, pero conservan su fondo blanco.
- Sólo los dos guiones mantienen el fondo amarillo claro que ya utilizaban.
- `Card` amplió su contrato con la variante reutilizable `outlined`, que conserva la superficie base y toma el borde del tema del módulo.

### Verificado

- TypeScript mobile terminó sin errores.

## [2026-09-22] - Tres imágenes del domicilio

### Implementado

- `Imágenes del domicilio` sustituyó la fotografía genérica por tres capturas diferenciadas: nomenclaturas de las calles, fachada y fachada con la integrante.
- Nomenclaturas y fachada son obligatorias; fachada con la integrante se mantiene visible como opcional. Cada evidencia abre únicamente la cámara, muestra su estado y vista previa, y permite volver a tomarla.
- Las tres tarjetas están disponibles desde el inicio, pueden capturarse en cualquier orden y usan un marco ocre fuerte para distinguir claramente cada evidencia.
- El botón inferior ahora dice `Terminar imágenes del domicilio`, permanece deshabilitado hasta capturar las dos fotografías obligatorias y permite regresar al concentrador sin exigir la opcional.
- La pantalla no muestra una paloma de proceso ni simula confirmación de servidor. Las imágenes permanecen locales durante la sesión hasta definir almacenamiento, metadatos, reintentos y auditoría.

### Verificado

- `npx tsc --noEmit` terminó sin errores en `apps/mobile`.

## [2026-09-22] - Terminación condicionada de Visita al vecino

### Implementado

- El botón inferior ahora dice `Terminar visita al vecino` y usa la acción primaria del módulo.
- Permanece deshabilitado hasta contar con una respuesta confirmada y su fotografía de evidencia confirmada; cargas, reintentos y archivos pendientes no satisfacen la condición.
- Al activarlo regresa al concentrador. El criterio se deriva de los registros existentes y no agrega otra escritura ni un estado paralelo.

### Verificado

- TypeScript mobile terminó sin errores.

## [2026-09-22] - Iconos y textos breves para fotografías de Visita al vecino

### Implementado

- La tarjeta de fachada muestra iconos vectoriales de cámara y casa; la de evidencia muestra cámara y busto de persona.
- Ambos avisos usan instrucciones breves y dejan de mencionar visualmente la captura de ubicación.
- La ubicación continúa siendo obligatoria y se conserva sin cambios en la API y PostgreSQL.

### Verificado

- TypeScript mobile terminó sin errores.

## [2026-09-22] - Segunda evidencia geolocalizada de Visita al vecino

### Implementado

- Entre `¿La conoce? ¿Sabe dónde vive?` y el recuadro amarillo de correspondencia se agregó `2. Fotografía de evidencia`.
- La captura sólo se habilita después de guardar la respuesta, abre directamente la cámara, no ofrece carrete y obtiene una ubicación actual inmediatamente después de la toma.
- Una captura con error de red conserva durante la sesión la imagen, el punto y la clave originales para reintentar sin duplicar. Una respuesta posterior no reutiliza la evidencia de la respuesta anterior.
- La migración 021 creó `verificacion_visita_vecino_evidencias`, ligada por FK restrictiva a `verificacion_visitas_vecino`, con metadatos, SHA-256, actor, idempotencia y ubicación; el archivo vive en almacenamiento protegido.
- La API valida alcance, respuesta más reciente, JPEG/PNG real y máximo de 10 MB; el archivo se entrega sólo por una ruta autenticada `private, no-store`. Resumen y auditoría omiten coordenadas.
- El volcado oficial quedó actualizado a 42 tablas, 68 FKs, 44 restricciones UNIQUE, 44 CHECK explícitos y 156 índices.

### Verificado

- La migración 021 se aplicó, inspeccionó, revirtió y reaplicó en `crelealtad_test` antes de la base operativa.
- Se creó y validó `crelealtad_pre_021_evidencia_visitas_vecino_20260922.dump` (4,090,901 bytes; SHA-256 `6FDCCA2D8C595ABACD9601B491C6EC795FB441A51007DA2C9F8CCCC24E8A1FF5`).
- `crelealtad` conservó sus tres respuestas y tres fachadas; la nueva tabla quedó aplicada vacía con 16 columnas y 11 constraints.
- Cuatro suites específicas aprobaron 18 pruebas, incluida integración real contra `crelealtad_test` y limpieza completa de sus datos técnicos.
- La suite completa aprobó 29 suites y 144 pruebas. `nest build` y TypeScript mobile terminaron sin errores.

## [2026-09-22] - Fotografía geolocalizada de fachada en Visita al vecino

### Implementado

- `Visita al vecino` comienza con una tarjeta obligatoria para tomar la fachada directamente desde la cámara; el flujo oficial no expone selección desde el carrete.
- Después de la toma, mobile obtiene una ubicación actual y conserva foto, punto, precisión disponible, fechas e idempotencia para reintentar el mismo envío sin duplicarlo.
- Guiones, INE, pregunta y segundo mensaje permanecen bloqueados hasta que el servidor confirma la evidencia. Una nueva fachada inicia una nueva visita y limpia en pantalla el indicador de la respuesta anterior.
- La migración 020 creó `verificacion_visita_vecino_fachadas` para metadatos, actor, hash y ubicación; el archivo queda fuera de PostgreSQL en almacenamiento protegido. También añadió `verificacion_visitas_vecino.fachada_id` como FK restrictiva y nullable sólo para historia anterior.
- La API valida alcance, estado, JPEG/PNG real y máximo de 10 MB, expone la imagen sólo por una ruta autenticada `private, no-store` y exige que cada respuesta nueva use la fachada más reciente de la integrante.
- La auditoría registra la captura sin copiar imagen ni coordenadas. Los resúmenes normales tampoco exponen el punto preciso.
- El volcado oficial quedó actualizado a 41 tablas, 66 FKs, 44 restricciones UNIQUE, 36 CHECK explícitos y 153 índices.

### Verificado

- La migración 020 se aplicó, inspeccionó, revirtió y reaplicó en `crelealtad_test` antes de la base operativa.
- Se creó y validó `crelealtad_pre_020_fachada_visitas_vecino_20260922.dump` (4,081,676 bytes; SHA-256 `62D867A9C0E52A5495ADA1E06E29D4DE17BE751692C47DC0F02C159E9EF7C89E`).
- `crelealtad` conservó sus tres respuestas históricas con `fachada_id = NULL` y recibió la nueva tabla vacía de 16 columnas; no se modificó ni eliminó información operativa.
- Cuatro suites específicas aprobaron 14 pruebas; la suite completa aprobó 29 suites y 140 pruebas. `nest build` y TypeScript mobile terminaron sin errores.

## [2026-09-22] - Ubicación y persistencia de la respuesta del vecino

### Implementado

- La migración 019 hace obligatorias latitud, longitud, fecha/hora de lectura y fuente `DISPOSITIVO` para cada fila nueva de `verificacion_visitas_vecino`; la precisión horizontal permanece opcional.
- Se agregó entidad TypeORM y API autenticada para registrar la confirmación de forma idempotente y consultar la respuesta más reciente sin exponer coordenadas.
- La API valida alcance a la integrante, estados de expediente/integrante y permiso `verificacion:registrar`; guarda la visita y su auditoría en una transacción. `audit_log` no copia latitud, longitud ni precisión.
- Mobile obtiene ubicación en primer plano al tocar `Sí / No`, conserva el resultado anterior durante el envío y actualiza la palomita o tacha únicamente después de la confirmación del servidor.
- Permiso denegado, servicios apagados, lectura inválida o error de red no crean la visita ni simulan éxito. Un reintento reutiliza la misma clave para evitar duplicados.
- El resumen del servidor restaura la última respuesta entre sesiones; cada respuesta posterior crea otra fila y no sobrescribe el historial.
- El volcado oficial quedó actualizado a 40 tablas, 63 FKs, 44 restricciones UNIQUE, 28 CHECK explícitos y 149 índices.

### Verificado

- La migración 019 se aplicó, inspeccionó, revirtió y reaplicó en `crelealtad_test` antes de la base operativa.
- Una segunda ejecución con una fila sintética existente reconoció el esquema ya actualizado, conservó la fila y terminó correctamente; la limpieza posterior dejó cero registros de prueba.
- Se creó y validó el respaldo `crelealtad_pre_019_ubicacion_visitas_vecino_20260922.dump` (4,074,438 bytes; SHA-256 `4DBBF3DAB5855B5F084EC855028E35676C91BAA59749106D3217247116BA6918`).
- `crelealtad` quedó con 11 columnas, 7 constraints y 0 filas en `verificacion_visitas_vecino` al aplicar la migración; no se modificaron datos operativos.
- Cuatro suites específicas aprobaron 20 pruebas, incluida la integración real contra `crelealtad_test`; la suite completa aprobó 28 suites y 135 pruebas. `nest build` y TypeScript mobile terminaron sin errores.

## [2026-09-22] - Tabla base para Visita al vecino

### Implementado

- La migración 018 creó `verificacion_visitas_vecino` como bitácora histórica independiente de las llamadas.
- Cada fila conserva integrante, respuesta booleana a `¿La conoce? ¿Sabe dónde vive?`, actor, fecha/hora y clave de idempotencia.
- Las llaves foráneas hacia `integrantes` y `usuarios` usan `ON DELETE RESTRICT`; un índice único evita duplicados por actor/reintento y otro acelera la consulta cronológica por integrante.
- Se agregó rollback condicionado que se niega a retirar la tabla cuando ya contiene historial.
- El volcado oficial del esquema quedó actualizado a 40 tablas, 63 FKs, 44 restricciones UNIQUE, 25 CHECK explícitos y 149 índices.

### Verificado

- La migración se creó, inspeccionó, revirtió y reaplicó correctamente en `crelealtad_test`.
- Se generó y verificó el respaldo `crelealtad_pre_018_visitas_vecino_20260922.dump` antes de aplicar el cambio operativo.
- La tabla quedó aplicada en `crelealtad` con seis columnas, cuatro constraints, tres índices y cero filas.
- No se modificaron filas operativas existentes; la entidad TypeORM, API y conexión mobile permanecen pendientes.

## [2026-09-22] - Guion para iniciar la Visita al vecino

### Implementado

- Antes del INE, `Visita al vecino` muestra un recuadro amarillo destacado con `Estoy intentando localizar a` y el nombre completo en el renglón inferior.
- El nombre se obtiene de la solicitud vigente y se presenta en mayúsculas para facilitar su lectura en campo.
- El guion permanece visible mientras el INE carga o cuando su consulta requiere reintento; no registra respuestas ni marca el proceso como realizado.
- El recuadro reutiliza la variante compartida `Card.accent` y la jerarquía tipográfica aplicada a los guiones de Llamada.
- Las frases aparecen sin comillas y con tipografía ligeramente menor; el nombre conserva sus comillas y la mayor jerarquía tipográfica sin cambiar de tamaño.
- Debajo del INE se agregó `¿La conoce? ¿Sabe dónde vive?` con selección exclusiva `Sí` verde o `No` roja mediante `YesNoField`.
- La respuesta es local a la sesión: no se presenta como guardada ni marca la visita como realizada.
- Al volver al concentrador, `Visita al vecino` refleja la respuesta con una palomita verde para `Sí` o una tacha roja para `No`, y anuncia el resultado a accesibilidad.
- Debajo de la pregunta se agregó un segundo recuadro amarillo con `Traigo correspondencia para`, el nombre completo de la integrante y `Y necesito que me la firme de recibido.` en tres renglones; sólo el nombre lleva comillas.
- El nombre se resuelve dinámicamente desde la solicitud vigente, usa la mayor jerarquía tipográfica y el recuadro no simula entrega, guardado ni conclusión.

### Verificado

- `npm --prefix apps/mobile run typecheck` termina sin errores.
- La entrega visual no modificó la API ni escribió datos operativos; la estructura PostgreSQL se agregó después mediante la migración 018 descrita arriba.

## [2026-09-21] - Auditoría general y cierre del recorrido de Documentación

### Corregido

- La API rechaza montos autorizados, ciclos, relaciones y rutas/fechas documentales enviados por el cliente; el servidor deriva el contexto y genera las evidencias.
- La completitud ya valida todos los campos obligatorios del formulario y confirma manifiesto/archivo de las cuatro evidencias antes de permitir `SUJETA_CREDITO`.
- Se retiraron la enumeración pública `GET /auth/login-list` y el alta duplicada `POST /expedientes`; el grupo y su expediente nacen en una sola transacción.
- La selección del expediente operativo dejó de depender del orden del arreglo y usa el expediente más reciente de forma determinista.
- El alcance por responsable de `ASESOR` se aplica también a rutas directas de expedientes, integrantes, solicitudes y documentos.
- Grupo, expediente, integrante, solicitud y carga documental registran actor y contexto mediante auditoría transaccional sin copiar valores personales.
- Mobile restaura la sesión sólo después de validarla con `/auth/me`; la edad se calcula y dejó de preguntarse manualmente.
- La configuración PostgreSQL falla cerrado en producción y valida TLS por defecto.

### Verificado

- No se modificó el esquema ni se escribieron datos reales; las integraciones utilizaron únicamente `crelealtad_test` y datos inventados.
- `npm run verify` aprobó TypeScript de API/mobile y 25 suites con 123 pruebas; `npm --prefix apps/api run build` terminó correctamente.
- Se actualizaron estado, reglas, flujo, entidades, arquitectura, base de datos, módulos, decisiones y el reporte de auditoría general.

## [2026-09-21] - Corrección de precisión en la ubicación de llamadas

### Corregido

- La API dejó de rechazar las lecturas reales de iPhone y Android cuando latitud, longitud o precisión contienen más decimales que las escalas de PostgreSQL.
- Mobile normaliza latitud y longitud a siete decimales y la precisión horizontal a dos antes de enviar; la API repite esa normalización como protección para clientes que aún tengan un bundle anterior.
- Se conservan los límites geográficos y la validación de números finitos. El ajuste no reduce la utilidad del punto para el futuro reporte de cercanía.
- Si una validación de ubicación vuelve a fallar, la app muestra una instrucción en español para obtener otra lectura en lugar de exponer nombres internos de campos y mensajes técnicos.
- La prueba de integración envía deliberadamente coordenadas y precisión con decimales adicionales y confirma los valores normalizados que quedan en PostgreSQL.

### Verificado

- `npm run verify` aprobó TypeScript de API y mobile, 23 suites y 113 pruebas; la compilación de Nest también terminó sin errores.

## [2026-09-21] - WhatsApp después del primer intento telefónico

### Implementado

- Cuando la integrante no tiene llamadas telefónicas registradas, `Llamada por teléfono` permanece habilitada y `Llamada por WhatsApp` aparece deshabilitada.
- La pantalla explica que WhatsApp estará disponible después de registrar la primera llamada por teléfono y comunica el estado deshabilitado a tecnologías de asistencia.
- Un resultado telefónico confirmado habilita WhatsApp inmediatamente, tanto para `Sí contestó` como para `No contestó`.
- La condición se deriva de los contadores del servidor. Durante carga o error del historial, WhatsApp permanece bloqueado; una llamada telefónica guardada correctamente actualiza el resumen.
- La API aplica la misma regla y rechaza WhatsApp sin antecedente telefónico, por lo que no puede omitirse desde otro cliente. No fue necesario modificar PostgreSQL.

### Verificado

- `npm run verify` aprobó TypeScript de API y mobile, 23 suites y 113 pruebas; la compilación de Nest también terminó sin errores.
- Las pruebas focalizadas cubren bloqueo inicial, ausencia de escritura y habilitación posterior a cualquier resultado telefónico.

## [2026-09-21] - Arranque remoto de Expo separado de la API

### Implementado

- `npm run dev` conserva el arranque LAN actual de API y Expo.
- `npm run dev:remote` inicia Expo SDK 57 mediante su túnel oficial y mantiene la URL de API centralizada en `EXPO_PUBLIC_API_BASE_URL`.
- Se agregó `@expo/ngrok` 4.1.3 como única dependencia de desarrollo del túnel.
- La app detecta un hostname público de Metro y evita tratarlo como si fuera la API.
- No se abrió el firewall a Internet, no se publicó la API y PostgreSQL continúa sin exposición directa.

### Verificado

- TypeScript de API y mobile termina sin errores y el build Nest concluye correctamente.
- El bundle iOS de Expo se generó con Hermes: 780 módulos y 38 activos.
- API y Metro activos respondieron HTTP 200 en LAN.
- La creación de la URL pública de ngrok quedó pendiente de autorización explícita para externalizar el bundle; el entorno de seguridad bloqueó esa prueba.
- `npm audit` atribuye a `@expo/ngrok` un hallazgo moderado transitivo en `uuid` sin corrección disponible; la dependencia queda limitada al entorno de desarrollo. Los dos hallazgos altos reportados pertenecen a otras ramas del árbol de Expo/Babel.
- El acceso remoto de la API continúa pendiente de una decisión de infraestructura segura.

## [2026-09-21] - Ubicación al registrar el resultado de una llamada

### Implementado

- Al tocar `Sí contestó` o `No contestó`, mobile solicita una lectura actual del dispositivo antes de enviar el resultado; el diálogo informa que se registrará la ubicación.
- La API exige y valida latitud, longitud y fecha/hora de captura, acepta la precisión horizontal cuando está disponible y fija la fuente como `DISPOSITIVO`.
- `verificacion_llamadas` conserva esos datos en el mismo intento inmutable. Si el permiso está denegado, la ubicación está apagada o no hay una lectura válida, no se guarda el intento ni se incrementan los contadores.
- La migración reversible 017 agregó cinco columnas y cuatro checks; permite que los 28 intentos históricos permanezcan sin ubicación y su rollback se niega a eliminar coordenadas ya registradas.
- La finalidad inmediata es persistir evidencia para un reporte posterior; todavía no se calcula distancia contra el domicilio ni se define un umbral de cercanía.

### Verificado

- La migración pasó aplicación repetida, inspección de restricciones, rollback condicionado y reaplicación en `crelealtad_test`.
- Se creó y validó el respaldo `crelealtad_pre_017_ubicacion_llamadas_20260921.dump` antes de aplicar la migración en `crelealtad`; los 28 intentos anteriores quedaron intactos y sin coordenadas inventadas.
- El esquema operativo conserva 39 tablas, 61 FKs, 44 restricciones UNIQUE y 146 índices; los checks explícitos aumentaron de 20 a 24.
- Las pruebas del módulo cubren persistencia de coordenadas y rechazo HTTP 400 cuando falta la ubicación.
- `npm run verify` aprobó TypeScript de API y mobile, 23 suites y 110 pruebas; la compilación de Nest también terminó sin errores.

## [2026-09-21] - Consulta del INE en Visita al vecino

### Implementado

- `Visita al vecino` dejó de mostrar el acceso preparado y ahora consulta el INE vigente ya confirmado para la integrante.
- La pantalla presenta el frente y permite deslizar horizontalmente al reverso, conservando acceso a ambas imágenes aunque se hayan capturado en orden inverso.
- Tocar cualquiera de las caras abre un modal opaco de pantalla completa; la aplicación no queda visible detrás y el visor permite zoom, recorrido y cambio lateral entre ambas imágenes.
- Se agregó el componente compartido `DocumentImageCarousel`, con estados accesibles de cara e índice, y se reutilizó `ZoomableImage` para la ampliación.
- La pantalla comunica carga, error y reintento sin crear evidencia nueva, cambiar el orden almacenado, concluir la visita ni agregar persistencia.

### Verificado

- `npm run verify` termina sin errores: TypeScript de API y mobile, 23 suites y 109 pruebas aprobadas.
- No se modificó el esquema, la API ni el contenido operativo de PostgreSQL.

## [2026-09-19] - Encuesta, evidencia y conclusión persistente de Llamada

### Implementado

- Una llamada contestada conserva en PostgreSQL las respuestas de identidad y domicilio, las seis coincidencias de la pregunta 3 y la acción posterior de la pregunta 4.
- Después de terminar las cuatro preguntas, la app habilita la selección de una fotografía desde la galería. La API acepta una imagen JPEG o PNG válida de hasta 10 MB, guarda el archivo en almacenamiento protegido y registra ruta, MIME, tamaño, SHA-256, actor y fecha.
- La encuesta, sus seis características, la evidencia y el evento de auditoría se escriben de forma transaccional; un reintento para el mismo intento de llamada no duplica la encuesta.
- Se ajustó la acción de auditoría a `ENCUESTA_LLAMADA` para respetar el límite de 20 caracteres de `audit_log.accion`; antes, `ENCUESTA_LLAMADA_REGISTRADA` provocaba un error 500 y PostgreSQL revertía correctamente toda la encuesta.
- `Llamada` sólo concluye con todas las coincidencias positivas, evidencia confirmada y `Agendó visita`, `Entrevista corta` o `Entrevista larga`. La paloma se consulta al servidor y reaparece después de cerrar sesión o la aplicación.
- `Llamar más tarde` y una no coincidencia conservan el historial sin paloma. Las opciones de entrevista corta y larga abren directamente Entrevista después de la confirmación del servidor.
- La migración 016 agregó `verificacion_llamada_encuestas`, `verificacion_llamada_caracteristicas` y `verificacion_llamada_evidencias`; el esquema operativo contiene 39 tablas, 61 FKs, 20 checks explícitos y 146 índices.

### Verificado

- La migración pasó aplicación, segunda ejecución idempotente, inspección de restricciones, rollback y reaplicación en `crelealtad_test`.
- Se creó un respaldo binario previo y la migración se aplicó en `crelealtad`; sus 20 intentos anteriores permanecen y las tablas nuevas iniciaron vacías.
- Las pruebas unitarias del módulo cubren intento, idempotencia, conclusión, `Llamar más tarde`, evidencia obligatoria, almacenamiento y permisos del controlador.
- `npm run verify` aprobó 23 suites y 109 pruebas, incluida la carga multipart real contra `crelealtad_test`; TypeScript de API y mobile y la compilación de Nest terminaron sin errores.

## [2026-09-19] - Presentación durante la encuesta de llamada

### Implementado

- Entre las preguntas 1 y 2 se agregó un recuadro amarillo con tipografía grande para presentar a CRELEALTAD y explicar que la llamada corresponde al crédito grupal solicitado.
- El texto incorpora dinámicamente el nombre real del grupo; no queda limitado a `KAHORY`.
- El recuadro reutiliza la nueva variante compartida `Card.accent`, con el mismo amarillo claro que los valores registrados de las preguntas de Verificación.

### Verificado

- `npm run verify` termina correctamente.
- TypeScript de API y mobile finaliza sin errores.
- Jest aprueba 21 suites y 102 pruebas.

## [2026-09-19] - Diferir o concluir la encuesta de llamada

### Implementado

- La pregunta 4 agrega la opción `Llamar más tarde`.
- Esa opción permite regresar al concentrador sin marcar el proceso `Llamada` como realizado, incluso cuando las confirmaciones todavía no se concluyeron.
- `Agendó visita`, `Entrevista corta` y `Entrevista larga` muestran una paloma verde en el acceso `Llamada` después de pulsar `Continuar`.
- La paloma incluye semántica accesible `Realizado` y permanece local a la sesión; no simula persistencia ni confirmación del servidor.

### Verificado

- `npm run verify` termina correctamente.
- TypeScript de API y mobile finaliza sin errores.
- Jest aprueba 21 suites y 102 pruebas.

## [2026-09-19] - Ruta posterior a una llamada contestada

### Implementado

- `No contestó` continúa guardándose en servidor y cierra el diálogo de resultado sin abrir otro paso.
- Después de la confirmación de `Sí contestó`, la app abre la segunda vista dentro de `Llamada` sin presentar otro diálogo.
- `¿Qué se realizará ahora?` es la pregunta 4 de esa vista y permite seleccionar exclusivamente `Agendó visita`, `Entrevista corta` o `Entrevista larga`.
- La pregunta anterior de disponibilidad para recibir visita se sustituyó por esta selección operativa aprobada.
- El botón `Continuar` permanece deshabilitado hasta completar las confirmaciones anteriores y seleccionar una opción; una inconsistencia conserva el bloqueo vigente.
- `Agendó visita` y `Entrevista corta` regresan al concentrador; `Entrevista larga` abre la entrevista general existente.
- La primera vista de `Llamada` conserva únicamente los dos botones y sus contadores; la encuesta reemplaza ese contenido y ofrece `Volver a llamadas` para regresar sin salir al concentrador.
- La selección es local y sólo dirige la sesión vigente; no crea una cita ni agrega persistencia al historial de llamadas.

### Verificado

- `npm run verify` termina correctamente.
- TypeScript de API y mobile finaliza sin errores.
- Jest aprueba 21 suites y 102 pruebas.

## [2026-09-18] - Estabilidad de conexión y cargas documentales

### Implementado

- Login y cargas documentales reutilizan el cliente HTTP centralizado, por lo que los errores de red ya no exponen excepciones internas de Expo.
- Las consultas ordinarias conservan el límite de 15 segundos y las cargas multipart disponen de 120 segundos para enviar hasta dos archivos dentro del contrato vigente de 10 MB por archivo.
- Las dos pantallas documentales adjuntan cada evidencia como `File` nativo de `expo-file-system`; se retiró el descriptor `{ uri, name, type }` incompatible con el `fetch` predeterminado de Expo SDK 57.
- Antes de transmitir, la app comprueba que el archivo continúe disponible, no esté vacío y respete el máximo de 10 MB; una falla de preparación conserva un mensaje accionable en lugar de presentarse como problema de red.
- `npm run dev` verifica y reutiliza una API o un Expo ya saludables y levanta únicamente el servicio faltante; un proceso ajeno que ocupe el puerto continúa bloqueando el arranque.

### Verificado

- TypeScript de mobile termina sin errores.
- El bundle iOS servido por Metro contiene la implementación de archivo nativo y sus validaciones de preparación.
- El supervisor reutiliza correctamente API y Expo activos, y conserva ambos procesos al finalizar la comprobación.
- Los health checks local y LAN responden correctamente en el puerto 3100.

## [2026-09-18] - Identificación de integrantes en Documentación

### Implementado

- La bandeja `Grupos en Verificación` detecta si cualquier integrante activa del expediente está `DOCUMENTANDO`.
- La tarjeta muestra la abreviatura vertical `REVISAR DOC.` —`Revisar documentación`— para que el aviso sea legible dentro de la franja.
- El grupo continúa habilitado y puede abrirse normalmente; la marca no cambia el estado del expediente ni bloquea el trabajo.
- Al resolverse el último pendiente documental, la etiqueta desaparece automáticamente al actualizar la bandeja.
- La señal documental tiene prioridad visual sobre `NUEVO` mientras ambas condiciones coincidan.

### Verificado

- La prueba unitaria de la bandeja cubre un grupo con revisión documental abierta y otro sin pendientes.
- TypeScript y compilaciones aplicables se ejecutan como puerta de entrega.

## [2026-09-18] - Identificación de grupos nuevos en Verificación

### Implementado

- La bandeja `Grupos en Verificación` muestra la franja vertical `NUEVO` a la izquierda de los expedientes de ciclo 1, reutilizando `StatusCard` y la señal institucional de Documentación.
- La API autenticada `GET /expedientes/en-verificacion` entrega `es_grupo_nuevo_ciclo_1` a partir del ciclo vigente; no clasifica por nombre, fecha ni posición.
- Las renovaciones conservan la tarjeta sin la marca y la semántica accesible anuncia explícitamente `Grupo nuevo, ciclo 1` cuando corresponde.
- No se agregó ni modificó esquema de base de datos.

### Verificado

- Prueba unitaria de la bandeja API cubre un grupo de ciclo 1 y una renovación de ciclo 4.
- TypeScript y compilaciones aplicables se ejecutan como puerta de entrega.

## [2026-09-18] - Registro y contadores de llamadas de Verificación

### Implementado

- Cada resultado `Sí contestó / No contestó` declarado después de abrir el marcador o WhatsApp se conserva en `verificacion_llamadas` con integrante, canal, usuario y fecha/hora.
- Los dos botones mantienen su nombre fijo y muestran por canal el total rojo de no contestadas y el total verde de contestadas; una leyenda textual evita depender únicamente del color.
- El icono telefónico utiliza el mismo componente y separación que el icono de WhatsApp.
- La API expone resumen y registro autenticados; la escritura requiere `verificacion:registrar`, valida que el expediente continúe `EN_VERIFICACION` y usa una clave por intento para no duplicar conteos ante reintentos.
- La migración reversible `015_registrar_llamadas_verificacion.sql` añade tabla, FKs restrictivas, checks, índices, permisos auditados para `ASESOR` y `VERIFICADOR`, y un rollback que se niega a borrar historial existente.
- Antes de aplicar la migración a `crelealtad` se generó y verificó el respaldo `database/backups/pre-015-crelealtad-20260918.dump`; la tabla inició con cero registros.

### Verificado

- TypeScript de API y mobile termina sin errores.
- `npm run verify` aprobó 21 suites y 102 pruebas; `npm run build` de la API también terminó correctamente.
- Las pruebas unitarias cubren agregados, actor autenticado, idempotencia, conflicto de clave y bloqueos fuera de Verificación.
- La migración fue aplicada, repetida y revertida en `crelealtad_test`; el rollback protegido rechazó eliminar la tabla mientras contenía intentos.
- PostgreSQL operativo quedó en 36 tablas, 56 FKs, 14 checks explícitos y 138 índices; ambos roles objetivo contienen una sola acción `registrar` y el cambio de permiso quedó en `audit_log`.

## [2026-09-18] - Llamada telefónica o por WhatsApp en Verificación

### Implementado

- El proceso `Llamada` de Verificación Individual muestra dos acciones claramente identificadas: `Llamada por teléfono` y `Llamada por WhatsApp`.
- La acción de WhatsApp usa el icono reconocible de la marca junto con su etiqueta textual; el botón compartido `SecondaryButton` admite ahora un icono inicial decorativo sin alterar accesibilidad ni jerarquía.
- Ambas acciones reutilizan el teléfono vigente de la integrante. El marcador conserva su confirmación existente y WhatsApp abre la conversación del número mediante el enlace universal oficial para que el verificador inicie ahí la llamada.
- Los teléfonos mexicanos de diez dígitos se convierten al formato internacional `52` requerido por WhatsApp; también se normaliza el formato móvil histórico `521`.
- Después de abrir correctamente cualquiera de los dos destinos se conserva el diálogo local `Sí contestó / No contestó` y el resto del contacto inicial no cambia.
- Si el teléfono no es válido o WhatsApp no puede abrirse, la app muestra una instrucción accionable y no simula que la llamada comenzó.

### Verificado

- `npx tsc --noEmit` termina sin errores en `apps/mobile`.

## [2026-09-11] - Concentrador de Verificación Individual

### Implementado

- Después de la revisión documental previa, Verificación Individual abre un concentrador con cuatro accesos equivalentes: `Llamada`, `Visita al vecino`, `Imágenes del domicilio` y `Entrevista`.
- Se retiraron del concentrador la leyenda `Paso X de Y`, la barra de avance lineal y la acción `Continuar` entre procesos.
- Cada proceso puede abrirse en cualquier orden y regresar al mismo concentrador sin perder el estado local de la pantalla durante la sesión.
- `Llamada`, captura de imagen y entrevista reutilizan las superficies existentes; `Visita al vecino` queda como acceso preparado sin inventar campos ni persistencia antes de definir su contrato.
- Se agregó `TaskMenuButton` a la biblioteca UI compartida para representar tareas pares con área táctil completa y semántica accesible.
- El progreso local anterior que apuntaba directamente a `llamada-integrante` se interpreta de forma compatible como entrada al nuevo concentrador.

### Verificado

- `npx tsc --noEmit` termina sin errores en `apps/mobile`.

## [2026-09-04] - Distancia aproximada hasta la tesorera

### Implementado

- Las tarjetas de integrantes en `Detalle de Expediente` y `Verificación de Grupo` muestran una burbuja celeste abreviada como `DIST. 5.3 KM`.
- La cifra se calcula con Haversine, en línea recta, a partir de las coordenadas obtenidas de los domicilios escritos de la integrante y de la tesorera.
- La captura del domicilio y la primera apertura de grupos existentes geocodifican calle, número, colonia, municipio, estado y código postal mediante el proveedor del dispositivo; no se consulta ni guarda la ubicación actual del teléfono.
- La autorización expresa para transmitir esos campos del domicilio al geocodificador Apple/Google quedó otorgada por Ricardo el 2026-09-04.
- Las coordenadas, fuente y fecha se persisten en `solicitudes_domicilios`; si falta una ubicación válida, la burbuja muestra `DIST. N/D` sin inventar una cifra.
- Cuando la distancia rebasa el límite operativo vigente de 5 km, centralizado en una única política técnica hasta que exista el contrato remoto de Parámetros, la burbuja usa fondo rojo claro con texto y borde rojo oscuro.
- Las respuestas operativas de la API deshabilitan ETag y caché, y el cliente móvil envía `Cache-Control: no-cache`; esto evita reutilizar un JSON `304` anterior sin provocar que iOS agregue el parámetro técnico `_` a la URL.
- El geocodificador intenta de forma escalonada la dirección completa y variantes que conservan la calle, sin caer en un centroide genérico de municipio o código postal.
- Se incorporó la migración reversible `014_geocodificacion_domicilios.sql`, validada primero en `crelealtad_test` y aplicada después de respaldar `crelealtad`.
- El cálculo exacto por recorrido vial queda diferido hasta la integración formal de mapas.

### Verificado

- Build de API, TypeScript de mobile y suites aplicables de API aprobados.
- La migración y su rollback condicionado se probaron en `crelealtad_test`; producción conserva 19 domicilios, cero pares inválidos y cuatro columnas nuevas verificadas.

## [2026-09-02] - Tesorera obligatoria antes de Verificación

### Implementado

- `Confirmar integrantes` mantiene fija una franja obligatoria para seleccionar o cambiar a una única tesorera entre las participantes completas.
- El selector inferior muestra nombre y monto solicitado, usa selección única accesible y no habilita la confirmación sin candidata.
- La participante elegida se identifica como `T · TESORERA` en Documentación, en el detalle de Verificación y en su encabezado individual; sólo ella activa las preguntas adicionales ya existentes.
- La etiqueta `TESORERA` conserva exactamente la misma altura exterior que `COMPLETA`; el círculo interior con la `T` se ajustó sin aumentar el renglón de estados.
- La confirmación final separa participantes, monto, tesorera y no participantes en renglones de etiqueta y valor para facilitar la revisión antes del envío.
- La API persiste `expedientes.tesorera_integrante_id`, valida expediente/participación, bloquea el handoff sin tesorera y audita asignación, cambio y desasignación por retiro.
- La migración 013 añade una FK compuesta para impedir referencias a integrantes de otro expediente. Se validó primero en `crelealtad_test`, se creó y comprobó un respaldo previo y después se aplicó a `crelealtad` sin asignar datos retrospectivos.
- DEC-029 establece que una sustitución de tesorera en el futuro módulo de Desembolsos se audita y se guarda como persona definitiva en `ciclos.tesorera_id`, sin regresar el expediente a Verificación ni sobrescribir su referencia histórica.

### Verificado

- `npm run verify`: typecheck API/mobile y 19 suites con 91 pruebas aprobadas.
- Build Nest aprobado y migración/rollback condicionado comprobados en `crelealtad_test`.
- Revisión visual a 390 × 844: franja fija, seis candidatas válidas, selección única y acción bloqueada hasta elegir; no se modificó el expediente usado para la inspección.

## [2026-09-01] - Importes en encabezados individuales

### Implementado

- Los encabezados persistentes de los siete pasos de Documentación y de todos los pasos de Verificación muestran por separado `Crédito anterior` y `Monto solicitado`.
- El crédito anterior proviene del monto autorizado del ciclo previo y el solicitado conserva el valor formal de la solicitud vigente.
- Un importe ausente se presenta como `Sin registro` o `Sin capturar`, sin inferir cero.
- Ambos módulos reutilizan `CreditAmountsSummary`; en Documentación, la captura formal del Paso 6 actualiza el resumen visible.
- El fondo del solicitado se estandarizó con el celeste del teléfono; el importe se presenta en negro y un indicador independiente muestra la diferencia exacta como `↑ $ importe` verde o `↓ $ importe` rojo frente al crédito anterior.

### Verificado

- TypeScript de mobile y la carga del paquete web móvil terminan sin errores.

## [2026-09-01] - Edad visible en tarjetas de integrantes

### Implementado

- Documentación y Verificación muestran la edad de cada integrante junto a su teléfono mediante la tarjeta compartida `IntegranteCard`.
- Una edad mayor de 70 años se presenta en una burbuja amarilla; 70 años permanece con presentación normal.
- El backend calcula la edad desde la fecha de nacimiento de la solicitud vigente y utiliza la fecha de la persona como respaldo, sin crear consultas adicionales por tarjeta.
- La política de cálculo y el límite de 70 años quedaron centralizados y no requirieron cambios de esquema ni migraciones.

### Verificado

- Las pruebas dirigidas de edad, solicitud e integrantes terminan con 15 casos aprobados.
- Build de API, TypeScript de mobile, salud de la API y carga del paquete web móvil terminan sin errores.

## [2026-09-01] - Contacto inicial de Verificación

### Implementado

- El Paso 2 abre el marcador del dispositivo y muestra el resultado `Sí contestó / No contestó` sólo después de iniciar correctamente la llamada.
- La rama `Sí contestó` presenta cuatro bloques de confirmación sin captura libre: identidad, domicilio, seis características del domicilio y disponibilidad para recibir visita.
- Identidad y domicilio muestran los valores ya registrados en la solicitud para que el verificador marque `Sí coincide` o `No coincide`.
- Una no coincidencia o la imposibilidad de recibir visita queda visible y bloquea el avance, porque el tratamiento posterior continúa pendiente de definición funcional.
- Se agregaron `YesNoField` y `BinaryChoiceDialog` a la biblioteca UI compartida.
- Se retiró la tarjeta redundante del resultado de llamada para reducir la densidad del Paso 2.
- `YesNoField` muestra verde y rojo desde el estado inactivo y oscurece la alternativa seleccionada; la acción inferior conserva la etiqueta `Continuar` mientras espera respuestas.

### Verificado

- TypeScript de mobile termina sin errores.
- La vista móvil se comprobó a 390 × 844 px con estados positivo y negativo, sin errores visibles de ejecución.

## [2026-08-31] - Zoom para revisión documental

### Implementado

- Las fotografías del Paso 1 de Verificación pueden ampliarse hasta 4× mediante pellizco o controles `− / +`.
- Cuando la imagen está ampliada puede desplazarse para leer datos; el porcentaje restablece el zoom al 100 %.
- Frente y reverso conservan navegación independiente y reinician su escala al abrir otro documento.
- `DocumentViewer` reutiliza el mismo componente ampliable para mantener el comportamiento documental uniforme.

### Corregido

- Al superar el 100 %, la superficie de la fotografía toma desde el primer contacto el gesto de un dedo, permitiendo recorrer centro, bordes y esquinas sin que el contenedor exterior intercepte el movimiento.

## [2026-08-31] - Identificación persistente de integrantes nuevas

### Corregido

- La tarjeta compartida de integrantes vuelve a consumir `es_nueva_con_nosotros`; una integrante sin historial interno muestra nuevamente `NUEVO` en la franja vertical de Documentación y del detalle de grupo en Verificación.
- La identificación de nueva ya no compite con `RETIRADA`, `REVISAR DOCUMENTACIÓN` o `NO APROBADA`: cuando existe una incidencia prioritaria, `NUEVO` permanece visible en una pestaña superior independiente.
- El encabezado fijo de la verificación individual muestra la pestaña gris `NUEVO` sobre el recuadro de datos y la conserva durante todos los pasos del flujo.
- Los lectores de pantalla reciben también la advertencia “Integrante nueva con CRELEALTAD”.

### Verificado

- TypeScript de mobile termina sin errores.
- Expo web compila y carga correctamente hasta la pantalla autenticada de acceso.

## [2026-08-31] - Identidad gris para las pantallas generales

### Implementado

- Login y Menú principal dejaron de consumir el verde de Documentación y usan el nuevo tema tipado `general`, con la paleta seleccionada `OPCIÓN B — GRIS PLATA CLARO`.
- El degradado y encabezado usan `#9CA3AF → #6B7280`; el PIN, el teclado y la acción de entrada conservan su composición con el gris `#6B7280`.
- Los textos sobre el encabezado claro y los iconos del sistema cambian a tonos oscuros con contraste suficiente; las barras y acciones conservan texto blanco.
- La bandeja global `Pendientes para ti` usa el mismo encabezado, barra de título y áreas seguras grises; la franja `REVISAR` conserva su color semántico de estado.
- Las tarjetas de cada módulo mantienen sus colores propios; el verde continúa identificando Documentación sólo después de entrar a ese módulo.

## [2026-08-31] - Revisión completa del Paso 1

### Corregido

- `Revisar documentación` permanece deshabilitado hasta que los cuatro documentos tengan respuesta `Sí` o `No` y al menos uno esté marcado con `No`.
- La validación se repite antes de enviar la solicitud y sólo incluye como observados los documentos rechazados, evitando devoluciones con revisiones parciales.

## [2026-08-31] - Bandeja personal de revisión documental

### Implementado

- El asesor responsable ve `PENDIENTES PARA TI` antes de los módulos cuando Verificación devuelve documentos.
- Cada renglón agrupa por grupo, muestra integrantes pendientes y antigüedad, y abre directamente el expediente.
- El avatar de las pantallas autenticadas incorpora un contador rojo que abre la bandeja completa; el número representa correcciones abiertas, no mensajes sin leer.
- `GET /pendientes/revision-documental` deriva el destinatario mediante el empleado ligado al asesor y cruza el estado vigente con `REV_DOC_SOLICITADA`.
- La bandeja se actualiza al iniciar sesión, volver al menú, abrirla, regresar la app al primer plano y concluir nuevamente la documentación.
- No se agregó tabla, migración, chat, rechazo, opinión ni notificación push.

### Verificado

- TypeScript de API y mobile termina sin errores.
- El build de Nest termina correctamente.
- Jest aprueba 18 suites y 81 pruebas; la nueva cobertura incluye agrupación, total, bandeja vacía, alcance por usuario autenticado y clasificación declarativa de permisos.
- La consulta derivada se ejecutó contra el esquema PostgreSQL local en modo de sólo lectura.

## [2026-08-30] - Revisión documental compartida entre módulos

### Implementado

- `POR DOCUMENTAR` cambia a `REVISAR DOCUMENTACIÓN` en Verificación y Documentación, usando la paleta amarilla del módulo Verificación.
- La alerta se abrevia a `REVISAR DOC…` en integrantes y la tarjeta del grupo muestra `REVISAR` cuando contiene al menos una integrante devuelta.
- `RECHAZADA` se presenta como `NO APROBADA` con paleta roja; `RETIRADA` conserva su etiqueta gris.
- Verificación devuelve una integrante a `DOCUMENTANDO` sin sacar al expediente de `EN_VERIFICACION`; la incidencia ya no depende de AsyncStorage.
- Documentación permite corregir únicamente la integrante devuelta mientras el resto del expediente continúa bloqueado para edición.
- Los documentos señalados por Verificación quedan pendientes de reemplazo en la pantalla del asesor; sus archivos anteriores se conservan y las rutas sustituidas quedan auditadas.
- La app conserva el identificador canónico del documento rechazado (`ine`, `comprobante`, `ine_beneficiario` o `solicitud_firmada`) al solicitar la corrección y bloquea localmente cualquier solicitud que no pueda identificarlo.
- Al validar nuevamente los siete pasos, la API restablece `SUJETA_CREDITO` y la etiqueta desaparece automáticamente en ambos módulos.
- Solicitud y conclusión de la revisión quedan auditadas con actor, estado anterior y contexto del expediente.
- Los códigos de auditoría `REV_DOC_SOLICITADA` y `REV_DOC_COMPLETADA` respetan el límite vigente de 20 caracteres de `audit_log.accion`.
- El dictamen negativo permanece bloqueado; este cambio sólo normaliza cómo se presenta un estado `RECHAZADA` ya existente.

### Verificado

- TypeScript de API y mobile termina sin errores.
- Cuatro pruebas unitarias cubren solicitud, conclusión, bloqueo fuera de Verificación y mantenimiento del bloqueo de dictámenes.

## [2026-08-30] - Rol operativo y permiso individual de Guadalupe Barrón

### Corregido

- Guadalupe conserva el rol visible y operativo `ASESOR`; la restricción de Verificación ya no se representa con un rol técnico alterno.
- `usuarios.permisos_personalizados` permite excluir Verificación para esa cuenta sin alterar el permiso temporal del resto del rol `ASESOR`.
- Login, `/auth/me` y el guard global calculan los mismos permisos efectivos.
- Al conservar `ASESOR`, `GET /grupos` vuelve a aplicar el alcance por responsable y `Mis Expedientes` devuelve sus tres expedientes asignados, no la bandeja institucional paginada de 20 grupos.
- El rol técnico temporal quedó inactivo y sin usuarios; ningún expediente, grupo o integrante cambió de estado o propiedad.

### Verificado

- La migración y su rollback se ejecutaron en `crelealtad_test` antes de aplicar el cambio en `crelealtad`.
- El respaldo previo de PostgreSQL quedó validado en formato custom.

## [2026-08-30] - Identificación visual de integrantes excluidas

### Implementado

- El indicador con signo menos y la etiqueta `NO PARTICIPA` usan fondo rojo suave y borde rojo, con la misma intensidad visual que el estado amarillo `PENDIENTE`.
- La tarjeta conserva nombre, monto, motivo y acciones sin cambios; la exclusión no depende únicamente del color porque mantiene símbolo y texto explícitos.

## [2026-08-29] - Confirmación de integrantes antes de Verificación

### Implementado

- El botón del detalle abre `Confirmar integrantes` y ya no ejecuta el handoff inmediatamente.
- Participantes, pendientes y no participantes muestran su cantidad y suma de monto al pie de cada sección.
- Una integrante completa o pendiente puede quedar `RETIRADA` únicamente en el expediente vigente con motivo controlado, actor y fecha; `Otro` exige detalle.
- El reintegro formal recalcula la solicitud y devuelve a `SUJETA_CREDITO` o `DOCUMENTANDO`.
- El handoff ignora retiradas, bloquea pendientes, exige al menos una completa y registra conteos enviados/excluidos.
- Verificación cuenta y muestra sólo participantes confirmadas.
- Se agregaron `BottomSheetSelector`, `ConfirmDialog`, `BottomActionBar` y `SelectionIndicator` a la biblioteca UI compartida.
- `Confirmar integrantes` alinea el nombre del grupo con el encabezado verde y acento amarillo del módulo; cada categoría usa una franja verde pegajosa que se reemplaza al entrar la siguiente sección.
- Los totales de cantidad y monto al pie de cada categoría usan tipografía de sección, mayor y más legible que la información de las tarjetas.
- Los renglones de categorías y el renglón `Integrantes` del detalle consumen el mismo `StickySectionHeader` sólido, con idéntica altura, tipografía y sombra; como prueba visual, `No participarán` usa rojo claro accesible sobre verde.
- Se agregó `ContextHeader` y se amplió `StickySectionHeader` con una variante sólida reutilizable, respaldados por tokens institucionales.
- El texto introductorio fue sustituido por `SummaryMetricsBar`: mantiene fijos, en tipografía grande, el número de participantes y el monto total que se enviará a Verificación mientras la lista se desplaza.

### Datos y seguridad

- La migración 011 agrega el estado `RETIRADA`, cuatro campos de contexto, dos checks y una FK a usuarios con `ON DELETE RESTRICT`.
- El rollback se niega a eliminar el esquema si ya existe historial de retiros.
- La migración fue aplicada dos veces, revertida y reaplicada en `crelealtad_test`; después se respaldó y migró `crelealtad` sin alterar sus 5,062 integrantes existentes.

### Verificado

- TypeScript API y mobile terminan correctamente.
- El build Nest termina correctamente.
- Jest aprueba 15 suites y 69 pruebas.
- Expo web compila y abre correctamente hasta la pantalla autenticada de acceso.

## [2026-08-29] - Carga documental resistente a capturas rápidas

### Implementado

- El Paso 7 bloquea una segunda selección o confirmación mientras la carga actual espera respuesta del servidor, evitando solicitudes duplicadas por doble toque.
- La vista previa muestra `Guardando...` y deshabilita guardar, cancelar y cerrar hasta recibir confirmación; después de un error conserva la imagen para un reintento explícito.
- Expo web convierte la imagen seleccionada en un archivo multipart real antes de enviarla; Android e iOS conservan el descriptor nativo.
- La recuperación de documentos locales pendientes termina antes de habilitar el formulario, evitando que una carga automática compita con una acción manual.

### Verificado

- TypeScript mobile termina correctamente.
- Una doble pulsación sobre `Guardar` produjo una sola versión en almacenamiento y dejó el documento opcional de la integrante de prueba en `SINCRONIZADO`, sin errores de consola.

## [2026-08-29] - Auditoría y consolidación arquitectónica general

### Implementado

- La creación de grupo y expediente ahora comparte una transacción; una falla parcial revierte ambos registros.
- El handoff a Verificación usa bloqueo pesimista, valida estado e integrantes completas, es idempotente y registra usuario/antes/después en `audit_log`.
- Los cambios manuales de integrante quedaron limitados a `SUJETA_CREDITO`, con validación de completitud y auditoría transaccional; aprobar o rechazar continúa bloqueado hasta contar con contrato funcional.
- Verificación dejó de simular finalización, retiró la selección de rechazos previa al handoff y eliminó fórmulas hardcodeadas de pago semanal y capacidad.
- Solicitudes deriva identidad y contexto desde `integrante_id`, conserva sólo rutas canónicas, reutiliza un upsert tipado para sus siete tablas hijas y depende de un puerto de almacenamiento documental.
- Se eliminó el ciclo directo Solicitudes–Integrantes, así como entidades, servicios, pantallas, respaldos y suites `.skip` sin imports ni rutas activas.
- El formulario móvil de Solicitud comparte un mapper de payloads, serializa escrituras y ya no retrocede cuando el guardado falla.
- JWT usa una configuración única y obliga `JWT_SECRET` en producción. Logging y validación dejaron de serializar payloads, cabeceras y valores personales.
- Se activaron puertas TypeScript para implícitos `any`, símbolos sin uso, retornos y fallthrough; la raíz expone `typecheck`, `test` y `verify`.

### Verificado

- `npm run typecheck` termina correctamente en API y mobile.
- `npm run build` termina correctamente en API.
- Jest aprueba 14 suites y 61 pruebas; las integraciones usan exclusivamente `crelealtad_test`.
- No se modificó el esquema ni se aplicaron migraciones a la base operativa.

## [2026-08-29] - Verificación habilitada temporalmente para asesores

### Implementado

- DEC-023 establece que, durante la etapa actual de desarrollo, todos los usuarios activos acceden a los módulos ejecutables; los módulos marcados como `Próximamente` permanecen bloqueados.
- El rol `ASESOR` incorpora `verificacion:leer`, por lo que sus sesiones reciben el acceso desde login y `/auth/me`, habilitan la tarjeta móvil y superan el mismo guard de API que ya protegía la bandeja.
- La migración 010 conserva los permisos existentes, es idempotente, registra antes/después en `audit_log` y cuenta con rollback condicionado para no sobrescribir cambios posteriores.

### Verificado

- La migración y su rollback se probaron en `crelealtad_test` antes de aplicarse en la base local `crelealtad`.
- Se validaron los permisos efectivos del rol y la cobertura de todas las cuentas activas sin consultar datos personales.

## [2026-08-29] - Franjas laterales de estado en Documentación

### Implementado

- Las tarjetas de grupo en `Mis expedientes` y las tarjetas de integrantes en la captura de solicitud incorporan una franja vertical en el borde izquierdo.
- En `Mis expedientes`, la franja es gris clara y no lleva texto; únicamente muestra `NUEVO` cuando el ciclo calculado del expediente es 1. Las burbujas verdes de estado `DOCUMENTANDO` y de días se conservan sin sustituirlas por la franja.
- La captura de solicitud mantiene `PENDIENTE` o `COMPLETA` según la completitud ya calculada.
- Se agregaron `StatusStripe` y `StatusCard` a la biblioteca UI compartida, respaldados por claves y colores semánticos centralizados en `tokens.ts`.
- La franja conserva un alto mínimo para mostrar completos los textos verticales y no invade el contenido de la tarjeta.
- `GET /grupos` expone si el expediente corresponde al ciclo 1, calculándolo con ciclos, solicitudes, auditoría de renovación e historial disponibles; no se modificaron reglas, estados, esquema ni datos.
- La respuesta de creación confirma también la condición de ciclo 1 y la navegación conserva esa confirmación hasta que `Mis expedientes` termina de recargarse, evitando perder la etiqueta inmediatamente después del alta.
- El cliente mantiene compatibilidad con respuestas anteriores de `GET /grupos`: cuando la bandera aún no existe, contrasta los identificadores contra el catálogo autorizado de renovaciones y sólo marca como nuevo al grupo sin ciclos históricos.
- Las tarjetas de `Mis expedientes` usan la variante compacta de `StatusCard`, sin alto mínimo y con menor relleno vertical; las tarjetas de integrantes conservan su altura para alojar su contenido operativo.
- En el detalle del expediente, la franja deja de repetir `PENDIENTE` o `COMPLETA`: permanece gris y vacía para personas con historial, y muestra `NUEVO` en negro únicamente cuando no existe crédito previo ni solicitud anterior con monto autorizado fuera del expediente actual.
- El alta de integrante devuelve y conserva esa clasificación durante la navegación inmediata, para que `NUEVO` aparezca al regresar al detalle aun antes de una segunda consulta de la bandeja.

### Verificado

- TypeScript mobile y API terminan correctamente; la prueba focalizada de grupos valida la distinción entre ciclo 1 y renovación.
- La composición se revisó a 390 x 844 puntos con tarjetas cortas y extensas, sin recorte de texto.

## [2026-08-29] - Verificación enlazada desde el menú principal

### Implementado

- Verificación aparece como el segundo módulo del proceso; queda habilitado con `verificacion:leer` y visible como `Requiere permiso` para las demás sesiones, sin permitir navegación.
- `GET /expedientes/en-verificacion` entrega una bandeja específica de expedientes en revisión, ordenada por antigüedad y protegida por JWT y permiso de módulo.
- La bandeja, el detalle de grupo y la verificación de integrante dejaron de hacer consultas anónimas y reutilizan el cliente HTTP autenticado.
- El detalle del expediente entrega su grupo relacionado, evitando una consulta con permisos ajenos al rol verificador.
- El visor de Verificación abre con autorización las evidencias que Documentación ya confirmó en servidor.
- Se documentó el alcance parcial, los bloqueos y las decisiones abiertas en `docs/modules/M03_VERIFICACION.md`; no se modificaron permisos, usuarios, esquema ni datos.

### Verificado

- TypeScript mobile y API terminan correctamente.
- Las pruebas focalizadas de servicio, controlador y cobertura de permisos aprobaron 3 suites y 13 casos.

## [2026-08-29] - Catálogo visual del menú principal

### Implementado

- El menú T8 muestra en desarrollo las tarjetas de Análisis, Desembolsos, Cobranza, Recolección, Mora, Convenios, Reportes, Parámetros y Administración.
- Los módulos todavía no ejecutables están deshabilitados, llevan la leyenda `Próximamente` y no crean rutas ni permisos ficticios.
- Cada módulo cuenta con un tema visual tipado; `ModuleCard` incorpora estado deshabilitado, disponibilidad textual y accesibilidad.
- La cuadrícula conserva dos columnas aun cuando el número de tarjetas sea impar, y `Cerrar sesión` permanece fijo al pie mientras el catálogo se desplaza.

### Verificado

- TypeScript mobile termina correctamente.

## [2026-08-28] - Menú principal por módulos y permisos

### Implementado

- Después de cada login, la aplicación abre un menú principal T8 antes de entrar a cualquier flujo operativo.
- El selector muestra únicamente módulos ejecutables habilitados por los permisos efectivos de la sesión; no crea accesos ficticios para módulos todavía no implementados.
- Documentación quedó como un módulo independiente con sus tres acciones vigentes: Crear grupo, Renovación y Mis expedientes.
- Verificación conserva su bandeja actual y regresa al menú principal; las pantallas internas de Documentación regresan primero al inicio de su módulo.
- Se agregó `ModuleCard` a la biblioteca UI compartida, con tema visual y contrato accesible basado en tokens.
- `Cerrar sesión` permanece fijo al pie del menú y usa la variante secundaria `danger`, con fondo rojo suave, borde y texto rojos.

### Verificado

- TypeScript mobile termina correctamente.

## [2026-08-28] - Comparativo grupal durante la renovación

### Implementado

- El detalle del expediente muestra, sólo desde el ciclo 2, una franja compacta con `Ciclo N (anterior)` y `Ciclo N+1 (documentando)`.
- El ciclo anterior presenta integrantes y suma prestada desde los montos autorizados individuales del ciclo inmediato anterior.
- El ciclo en documentación presenta integrantes completas 7/7 y suma únicamente sus montos solicitados confirmados.
- La última línea se identifica sólo como `Diferencia` y muestra `↑` verde, `↓` roja o `=` al comparar el monto documentado contra el total prestado anterior.
- La misma línea muestra además la diferencia entre integrantes completas 7/7 y las integrantes del ciclo anterior; por ejemplo, una completa frente a nueve anteriores presenta `↓ 8 Sras.`.
- Para conservar una sola línea, el conteo visual se abrevia como `Sra.` o `Sras.`; la descripción accesible mantiene la palabra `integrante` completa.
- `Diferencia`, la variación de señoras y la variación monetaria usan 16 px y peso 700, manteniendo las flechas verdes o rojas.
- El encabezado `Integrantes` usa el verde institucional y queda fijo bajo el encabezado de la pantalla mientras las tarjetas se desplazan.
- `GET /integrantes/expediente/:expedienteId` expone `cicloNumeroActual`; no se agregó una tabla ni se modificó PostgreSQL.

### Verificado

- TypeScript mobile, build API y pruebas unitarias de integrantes terminan correctamente.

## [2026-08-28] - Crédito anterior junto al avance

### Corregido

- `Crédito anterior` se movió al espacio derecho sobre la barra de avance, frente a `Completo 7/7` o al conteo pendiente.
- El teléfono vuelve a ocupar una línea limpia y la zona inferior queda reservada para `Monto solicitado` y `Monto verificado`.

## [2026-08-28] - Espacio para monto verificado en tarjetas

### Implementado

- Se agregó `Monto verificado:` debajo de `Monto solicitado`, inicialmente sin cantidad.
- `Monto verificado` usa el mismo tamaño, tipografía, color y peso visual que `Monto solicitado`.
- El nuevo renglón ocupa el espacio liberado al reubicar `Crédito anterior`, conservando la tarjeta compacta y sin presentar como verificado un monto inexistente.

## [2026-08-28] - Reubicación de crédito anterior en tarjetas

### Corregido

- La referencia `Anterior` ahora se identifica claramente como `Crédito anterior`.
- Se eliminó el renglón inferior de `Crédito anterior`, sin aumentar la altura de la tarjeta y dejando libre ese espacio para el futuro monto verificado.

## [2026-08-28] - Etiqueta de monto solicitado en tarjetas

### Corregido

- Las tarjetas de integrantes muestran `Monto solicitado` en lugar de `Monto`, dejando clara su diferencia frente al futuro monto verificado.

## [2026-08-28] - Monto en blanco antes de documentar

### Corregido

- Las tarjetas dejaron de presentar la precarga del ciclo anterior como monto solicitado del ciclo nuevo.
- La API sólo expone `montoSolicitado` como monto formal cuando existe `monto_solicitado_confirmado_at`; antes de la captura devuelve `NULL` y conserva por separado el autorizado anterior.
- El renglón `Monto solicitado` y el encabezado compacto permanecen sin cantidad hasta que el asesor capture el Paso 6; la referencia `Crédito anterior` continúa visible.

## [2026-08-28] - Conectividad automática de Expo y API en desarrollo

### Corregido

- El inicio raíz unifica la API en el puerto `3100`, usa `start:dev`, espera el health check y entrega a Expo la IP de la ruta de red activa sin escribir archivos `.env`.
- Mobile dejó de depender de IPs LAN fijas y deriva el host de la sesión de Expo cuando no existe una URL explícita para otro ambiente.
- El script PowerShell móvil delega al runner raíz y CORS de desarrollo dejó de depender de una subred concreta.
- El runner detecta cambios de IP y termina de forma controlada sus procesos para que el iniciador automático los levante con la nueva red.
- Se añadieron instaladores idempotentes para permitir únicamente `3100` y `8081` desde la subred local y para arrancar el entorno al iniciar sesión en Windows.
- Expo inicia en modo LAN/offline, evitando que consultas externas de validación bloqueen Metro cuando la laptop no tiene salida a Internet.

### Verificado

- TypeScript mobile, build API y sintaxis del runner terminan correctamente.
- La suite API completa aprobó 12 suites y 48 pruebas.
- Health y CORS respondieron por LAN; Metro sirvió el manifiesto y un bundle iOS de 808 módulos sin las IPs anteriores ni el puerto `3000`.
- En la estación de desarrollo se verificaron las dos reglas de firewall para perfiles privado y público, limitadas a `LocalSubnet`, y el acceso de autoarranque del usuario actual.

## [2026-08-28] - Límite e indicador comparativo en Paso 6

### Corregido

- El Paso 6 dejó de aceptar como válido o autoguardar un monto superior al límite vigente del producto; el botón de avance permanece bloqueado y muestra el máximo permitido.
- La API aplica la misma regla antes de cualquier escritura y rechaza el exceso sin reemplazar el monto persistido.
- El límite se obtiene de `productos_credito.monto_maximo`, con respaldo del producto activo para expedientes históricos sin `producto_id`.
- En renovaciones, el encabezado del monto anterior muestra en vivo la diferencia como `↑ $importe` verde al aumentar o `↓ $importe` roja al disminuir la nueva solicitud.
- Los montos fuera de límite almacenados antes de esta corrección se muestran como inválidos y requieren corrección explícita; no se alteran silenciosamente.
- El detalle del expediente deja esos casos en Paso 6 pendiente, incluso si habían alcanzado previamente el estado técnico `SUJETA_CREDITO`, para permitir su corrección sin reescribir el historial automáticamente.

## [2026-08-28] - Corrección de fuente del monto anterior en Paso 6

### Corregido

- La API entrega una referencia explícita para el Paso 6 y clasifica la solicitud por `ciclo_numero`.
- En renovaciones, el encabezado usa exclusivamente `solicitudes.monto_autorizado` del ciclo anterior; nunca utiliza el prospectivo de `personas.monto_solicitado` como respaldo.
- La pantalla dejó de decidir entre fuentes monetarias y consume `montoReferenciaPaso6` junto con `origenMontoReferenciaPaso6`.

## [2026-08-28] - Captura explícita del monto en Paso 6

### Implementado

- El monto precargado dejó de ocupar el campo editable: en renovaciones aparece en el encabezado como `Monto ciclo anterior` y en grupos nuevos como `Monto solicitado` prospectivo.
- El campo formal abre vacío y el asesor debe capturarlo; al reabrir, sólo se hidrata cuando la API ya registró su confirmación.
- El detalle del expediente y la validación de backend ya no consideran completo el Paso 6 únicamente por sus validaciones: exigen monto positivo y confirmación de captura.
- Se añadió `solicitudes.monto_solicitado_confirmado_at` mediante migración incremental; no se creó otra tabla ni se modificó el historial financiero.

### Verificado

- TypeScript mobile, build API y prueba focalizada de integrantes terminan correctamente.
- La migración se verificó primero en `crelealtad_test`; la suite API completa aprobó 12 suites y 48 pruebas.
- Antes de aplicarla en `crelealtad` se generó un respaldo custom verificable. La base conservó 1,617 solicitudes, 23 montos y suma de $590,000; quedaron 4 capturas existentes confirmadas y 19 referencias pendientes.

## [2026-08-28] - Comparación de monto anterior en detalle de expediente

### Implementado

- Cada tarjeta de integrante muestra `Autorizado anterior` desde `solicitudes.monto_autorizado` del ciclo previo y `Solicita este ciclo` desde `solicitudes.monto_solicitado` de la solicitud actual.
- La tarjeta conserva su altura compacta: el solicitado mantiene el tamaño anterior, `Crédito anterior` aparece a la derecha del avance sobre la barra y la diferencia se muestra a un lado mediante `↑` verde, `↓` roja o `=`. La flecha, el valor y la descripción accesible evitan depender únicamente del color.
- La API relaciona persona, grupo y `ciclo_numero - 1`, y sólo habilita la comparación cuando encuentra un antecedente único. Los casos ausentes o ambiguos se muestran como `SIN MONTO ANTERIOR` sin inferencias.
- Se eliminó de esta lista el respaldo prospectivo en `personas.monto_solicitado`; no se modificó el esquema ni se escribieron datos operativos.

### Verificado

- La revisión agregada de PostgreSQL encontró 23 solicitudes actuales: 18 con antecedente único, 5 sin antecedente y 0 ambiguas.
- La prueba focalizada de integrantes aprobó 3 casos, incluida la protección ante ambigüedad.
- TypeScript mobile y build API terminan correctamente; la suite API completa aprobó 12 suites y 48 pruebas.

## [2026-08-27] - Corrección de sincronización documental en solicitud

### Implementado

- El Paso 7 del formulario dejó de guardar referencias `storage:` como resultado final y ahora utiliza la carga multipart autenticada ya disponible.
- Los cuatro documentos obligatorios cambian a `Sincronizado` únicamente después de que el servidor confirma archivo, ruta y fecha; entonces permiten concluir la integrante.
- Las referencias locales creadas por la versión anterior se recuperan al reabrir la integrante y se suben secuencialmente, conservando error y reintento cuando la conexión falla.
- El contrato de API, la persistencia y ambas pantallas documentales aceptan `comprobante_credito` como quinto tipo opcional; su ausencia no bloquea la completitud.
- La reapertura del formulario muestra un estado de recuperación y bloquea navegación hasta hidratar los datos; un error de lectura ya no deja un formulario vacío editable.
- Retroceder, continuar o salir guarda únicamente el paso visible, por lo que el Paso 7 no puede reemplazar los seis pasos previos con campos vacíos.
- Los documentos confirmados se abren desde el servidor. Los archivos locales rechazados permanecen visibles y ofrecen `Elegir de nuevo` en lugar de ocultarse o repetir indefinidamente el mismo archivo inválido.
- No se modificó el esquema ni se creó una tabla adicional.

### Verificado

- TypeScript mobile y build API terminan correctamente.
- Suite API completa: 12 suites y 47 pruebas aprobadas; la cobertura incluye aceptación y persistencia del documento opcional.

## [2026-08-27] - Pantalla y API de renovación grupal

### Historial individual y renovación con una pulsación

- Contrato individual V1: sólo acepta ciclo inequívoco, persona existente, integrante única, conteo exacto y suma de montos igual al préstamo grupal.
- La migración aditiva 008 relaciona cada expediente histórico fuente con el ciclo importado y la importación individual, sin crear una tabla paralela de integrantes.
- Carga activa: 276 últimos ciclos, 276 expedientes fuente y 1,594 integrantes/solicitudes con `monto_autorizado`; cero diferencias de integridad.
- Los expedientes históricos fuente no tienen `asesora_id` y no aparecen en la bandeja personal.
- Tocar una tarjeta elegible crea y abre directamente el expediente de renovación; se eliminó el segundo botón.
- Para `GPE_BARRON`, 10 de 26 grupos quedaron habilitados; los demás conservan bloqueo por datos no reconciliados.
- Se retiró la escritura del estado inexistente `EN_RENOVACION` sobre `grupos`: el grupo conserva su identidad y estado vigente, mientras el nuevo expediente queda en `EN_DOCUMENTACION`. Los intentos fallidos se revirtieron completos y no dejaron expedientes parciales.
- La bandeja de integrantes y el formulario leen `solicitudes.monto_solicitado` cuando existe solicitud; `personas.monto_solicitado` queda únicamente como dato prospectivo previo. El guardado del formulario dejó de sobrescribir el prospecto con el monto formal.
- En el expediente de renovación de DECIDIDAS se restauraron con auditoría dos precargas afectadas por la lectura anterior; validación final: 9 de 9 montos positivos y suma de $253,000 igual al ciclo fuente.

### Relación ciclo–expediente reforzada

- `ciclos.expediente_id` es obligatorio, único y usa borrado restringido.
- La FK compuesta impide asociar un ciclo con un expediente de otro grupo.
- El expediente puede permanecer sin ciclo durante documentación; el ciclo continúa naciendo sólo con el desembolso real.
- El monto individual histórico quedó definido como `solicitudes.monto_autorizado`, es decir, el monto efectivamente prestado durante ese ciclo.
- La migración `007_reforzar_ciclo_expediente.sql` incluye prevalidaciones y reversión explícita.

### Implementado

- Pantalla T1 `Renovación`, sin historial personal del asesor, con secciones de grupos vigentes y ciclos pasados.
- Los grupos pasados se distinguen mediante tarjeta gris claro y etiqueta `PASADO`, sin depender únicamente del color.
- Consulta del último ciclo de cada grupo limitada al asesor autenticado y a la base histórica activa.
- Creación transaccional e idempotente del expediente siguiente, con reutilización de `persona_id`, monto formal del ciclo, actualización de estado y auditoría `INICIO_RENOVACION`.
- Bloqueo visible y sin escrituras cuando faltan integrantes o montos del último ciclo.
- Especificación `M02_RENOVACION_GRUPOS.md`, estado compartido de carga/vacío/error y pruebas del servicio.

### Verificado

- Build API y TypeScript mobile terminan correctamente.
- Suite focalizada de permisos y renovación: 2 suites y 11 pruebas aprobadas.
- Suite API completa: 12 suites y 46 pruebas aprobadas.
- Las pruebas de integración quedaron fijadas a `crelealtad_test`, crean sus propias entidades y limpian únicamente sus UUID; se restauró desde el contrato la única solicitud histórica afectada durante la detección y se comprobó nuevamente la igualdad 1,594 integrantes = 1,594 solicitudes.
- Las pruebas de integración quedaron fijadas a `crelealtad_test`, crean sus propias entidades y limpian únicamente sus UUID; se restauró desde el contrato la única solicitud histórica afectada durante la detección y se comprobó nuevamente la igualdad 1,594 integrantes = 1,594 solicitudes.

### Alcance y pendientes

- No se creó una pantalla de historial del asesor.
- No se copiaron montos prospectivos de `personas` ni se inventaron montos desde el total grupal.
- Permanecen 193 últimos ciclos bloqueados por fuente ausente, persona/monto no resuelto, ambigüedad o diferencias de conteo/suma; no se hicieron inferencias.

## [2026-08-27] - Proceso repetible de migración histórica grupal

### Implementado

- Lector parametrizado para cualquier corte futuro de `BASE DE DATOS 76.xlsm`, sin dependencia de SEM 364/366 en código.
- Validación cruzada entre 24,884 movimientos históricos y el resumen lateral de 299 vigentes.
- Artefactos con SHA-256, manifiesto, incidencias, ciclos y semanas; se omiten nombres y teléfonos de contacto.
- Migración aditiva `006_historial_grupos_excel.sql` con importaciones inmutables, ciclos grupales históricos y comportamiento semanal.
- Prevalidación de grupos/asesoras, alta explícita de faltantes, transacción completa, base activa única e idempotencia por hash.
- Especificación D01 y procedimiento operativo para ensayar y ejecutar el corte final.

### Verificado

- Prueba sintética y TypeScript del paquete de migración en verde.
- SEM 366: 1,485 ciclos, 24,884 semanas, 299 vigentes, 46 códigos de asesora, cero errores y 17 advertencias `OFNA`.
- Carga en `crelealtad_test`: cero ciclos sin grupo, cero semanas huérfanas y repetición sin duplicados.
- Respaldo completo verificable antes de aplicar en `crelealtad`.
- Base local: 52 grupos de origen agregados, 1,485 ciclos y 24,884 semanas; segunda carga idempotente.

### Alcance y pendientes

- No se escribieron filas en `creditos` ni `ciclos` transaccionales.
- No se infirió `LIQUIDADO` para registros sin `GRUPO VIGENTE=1`.
- No se fusionaron variantes de nombres sin aprobación operativa.
- Falta diseñar el contrato del Excel de integrantes y probar la salida final sobre una base limpia.

## [2026-08-27] - Sesión visible, conectividad y bandeja propia del asesor

### Implementado

- `AppHeader` obtiene la identidad, el rol y el avatar del usuario autenticado; se retiraron los valores permanentes de demostración.
- `AppHeader` presenta la abreviatura operativa del usuario como identidad principal y calcula el avatar separando también los segmentos unidos por guion bajo.
- Login y `GET /auth/me` incluyen `rol_nombre` en el contrato de sesión.
- El cliente HTTP móvil cancela solicitudes después de 15 segundos y presenta un mensaje operativo de conexión en lugar de mantener una carga indefinida.
- Los grupos nuevos registran el usuario autenticado en `grupos.created_by`; los expedientes nuevos resuelven `usuarios.id → empleados.id` y guardan este último en `expedientes.asesora_id`. El cliente ya no puede proponer `created_by`.
- La bandeja `/grupos` del rol `ASESOR` y el detalle de grupo se limitan a expedientes cuyo `asesora_id` coincide con el JWT.
- La lista móvil presenta un estado vacío cuando el asesor no tiene expedientes asignados.

### Verificado

- La revisión real más reciente mostró 581 expedientes abiertos con cero asignaciones en `asesora_id`: 18 en `EN_DOCUMENTACION` y 563 con el estado legado `En proceso`; no se modificaron esas filas.
- La verificación HTTP autenticada confirmó `rol_nombre`, respuesta 200 y cero grupos visibles para un asesor sin asignaciones.
- TypeScript mobile y build API terminan correctamente.
- La suite completa de API aprobó 10 suites y 39 pruebas, incluidas las nuevas pruebas de propiedad y alcance por asesor.

### Alcance y pendientes

- No se inventó ni aplicó una asignación histórica. Los 578 expedientes existentes requieren una fuente operativa aprobada para asociarlos a su asesor real.
- El alcance por responsable es parcial: la bandeja y detalle de grupos ya se limitan para `ASESOR`; faltan controles equivalentes en todas las rutas directas de expedientes, integrantes, solicitudes y documentos, además del alcance por sucursal/zona.
- No se modificó el esquema ni el contenido operativo existente de PostgreSQL.

## [2026-08-26] - Carga documental confirmada para el asesor

### Implementado

- Especificación vigente del incremento en `docs/modules/M02_DOCUMENTACION_ASESOR.md`.
- Endpoint multipart autenticado para los cuatro documentos obligatorios de la integrante.
- Validación por firma de contenido para JPEG, PNG y PDF, con máximo de 10 MB por archivo y hasta dos páginas.
- Almacenamiento configurable mediante `DOCUMENT_STORAGE_PATH`, manifiesto con actor y versiones inmutables; reemplazar no elimina la versión anterior.
- Persistencia de ruta y fecha en `solicitudes_documentos` solamente después de confirmar el archivo en servidor.
- Lectura protegida de metadatos y contenido documental.
- Pantalla T5 que prioriza pendientes y distingue `Pendiente`, `Subiendo`, `Sincronizado` y `Error`, con reintento en la sesión y visor autenticado.
- Componentes compartidos `StatusBadge`, `DocumentCard` y `DocumentViewer`.

### Verificado

- `npx tsc --noEmit` de mobile termina correctamente.
- `npm run build` de la API termina correctamente.
- La suite completa aprobó 9 suites y 36 pruebas.
- Las pruebas documentales cubren formato válido, contenido inválido, lectura y rechazo de identificadores manipulados.

### Alcance y pendientes

- No se modificó el esquema ni el contenido operativo existente de PostgreSQL.
- El filesystem configurable permite verificar el flujo servidor en desarrollo; producción requiere almacenamiento durable, respaldo y monitoreo.
- Cola offline, reanudación entre reinicios, idempotencia distribuida, alcance territorial y auditoría transversal continúan pendientes.

## [2026-08-26] - Estabilización del flujo activo del asesor

### Implementado

- Contratos móviles tipados y canónicos en `snake_case` para integrante, solicitud y código postal.
- Uso del cliente HTTP autenticado en documentación, detalle de expediente y envío a verificación del recorrido activo del asesor.
- Validación que impide considerar como evidencia confirmada una ruta documental exclusivamente local.
- Exclusión de variantes legacy reemplazadas de la compilación activa, sin borrar archivos ni alterar datos.
- Lectura secuencial de las tablas hijas de solicitud dentro de la transacción para obtener una respuesta plana determinista.
- Limpieza de pruebas corregida para usar las relaciones reales entre expedientes y grupos.

### Verificado

- `npx tsc --noEmit` de mobile termina correctamente.
- `npm run build` de la API termina correctamente.
- La suite completa aprobó 8 suites y 33 pruebas.

### Alcance

- No se modificó el esquema ni el contenido operativo de PostgreSQL.
- No se crearon pantallas administrativas para otorgar permisos; esa capacidad permanece en M12 y requiere matriz funcional aprobada, API y auditoría.
- La carga real de documentos se implementó en el incremento posterior del mismo día; la cola offline y las pantallas operativas completas de roles distintos de ASESOR siguen pendientes.

## [2026-08-26] - Autorización efectiva por módulo y acción

### Implementado

- Relación TypeORM de usuario con rol y lectura de `roles.permisos` en autenticación JWT.
- Contrato de permisos efectivos en login y `GET /auth/me`.
- Guard global cerrado por defecto: toda ruta protegida requiere permiso declarado o clasificación autenticada explícita.
- Permisos de módulo/acción en los 26 handlers vigentes.
- Inicio móvil filtrado por permisos efectivos y estado para cuentas sin funciones habilitadas.

### Verificado

- La API compila correctamente.
- Nueve pruebas focalizadas de autenticación y autorización aprobadas.
- La prueba de cobertura confirma que ningún handler vigente queda sin clasificación de acceso.
- La primera validación de este cambio aprobó 32 de 33 pruebas; el fallo de integración y la limpieza heredada quedaron corregidos posteriormente en la estabilización del flujo del asesor del mismo día.
- La primera validación todavía reportó divergencias TypeScript preexistentes; la estabilización posterior del mismo día recuperó una compilación móvil limpia.

### Alcance

- No se modificó el esquema ni el contenido de PostgreSQL.
- No se asignaron permisos nuevos ni se inventaron capacidades para módulos futuros.
- El alcance territorial por sucursal, zona y responsable continúa pendiente.

## [2026-08-13] - Login por abreviatura y alta inicial de asesores

### Aprobado

- Login de asesores mediante abreviatura operativa en lugar de correo.
- Rol inicial `ASESOR` y sucursal `MATRIZ` para los asesores de la tabla fuente.
- Zona sin asignar durante la etapa inicial, preservando capacidad de asignacion futura.
- Estado inicial `ACTIVO` para todos los asesores de la carga.
- Estado futuro calculado contra grupos activos: sin grupos activos implica `INACTIVO`.

### Verificado

- La nueva tabla contiene 50 registros, de los cuales 49 representan asesores y `OFNA` es una fila administrativa.
- Numeracion, abreviaturas, nombres e identificadores `#2` sin duplicados.
- Migración probada primero en `crelealtad_test` y aplicada después en `crelealtad` con respaldo previo verificable.
- 49 usuarios, 49 empleados y 49 filas laborales cargados con rol `ASESOR`, sucursal `MATRIZ`, zona nula y estado `ACTIVO`.
- Login implementado por abreviatura en API, JWT y mobile; `ANA_VAZQUEZ` autenticó correctamente y un PIN incorrecto devolvió 401.
- Cada cuenta almacena un hash bcrypt individual, no el PIN en texto plano, y conserva `requiere_cambio_pin = true`.
- La API compila y sus 6 suites/20 pruebas pasan.

### Observaciones

- No se modifico la tabla fuente.
- La comision se tratara como dato laboral con vigencia, no como permiso del rol.
- El valor temporal compartido `1234` es exclusivamente para desarrollo y pruebas; debe sustituirse mediante un flujo de cambio obligatorio antes de producción.
- La inactivación automática según grupos activos permanece pendiente hasta reconciliar la base de grupos.

## [2026-08-13] - Actualización del inventario técnico oficial

### Actualizado

- `03_PROJECT_STATUS.md` con el estado real de API, mobile, datos, testing y riesgos.
- `08_ENTITY_CATALOG.md` con entidades y cobertura reales por dominio.
- `10_DATABASE_PRINCIPLES.md` con 32 tablas, una vista, constraints, índices, permisos y brechas de auditoría.
- `11_ARCHITECTURE_GUIDE.md` con módulos activos, 26 handlers HTTP, runtime móvil y estado offline.
- `20_MODULE_CATALOG.md` con clasificación verificable por módulo.
- `23_DECISION_LOG.md` para cerrar la brecha histórica de persistencia y registrar contradicciones vigentes.
- `91_PROJECT_AUDIT_REPORT.md` marcado como snapshot histórico superado.

### Verificado

- Persistencia PostgreSQL mediante TypeORM.
- Autenticación JWT global.
- Solicitudes normalizadas en ocho tablas.
- Roles y permisos JSONB presentes.
- Ausencia de autorización granular, RLS, triggers y auditoría transversal completa.
- Uso mixto de cliente HTTP autenticado y `fetch` directo en mobile.
- La API compila correctamente y sus 5 suites/17 pruebas activas pasan.
- La limpieza de `crelealtad_test` reporta errores que requieren corrección aun con Jest en verde.
- La verificación TypeScript de mobile falla por divergencias entre contratos y código activo/legado.

### Observaciones

- No se modificó código funcional.
- No se modificó el esquema ni contenido de PostgreSQL.
- No se agregaron reglas de negocio.
- Las cifras provienen de código activo y metadatos del esquema al 2026-08-13.

---

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
