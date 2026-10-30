# M11 — PARÁMETROS

## 1. Identidad

- Nombre oficial: Parámetros.
- Código: M11.
- Estado: parcial.
- Responsable operativo: Dirección mediante el rol ADMINISTRADOR.
- Roles usuarios: todos los usuarios autenticados para consulta temporal; ADMINISTRADOR para definir
  y publicar el catálogo.

## 2. Objetivo y resultado observable

- Problema que resuelve: las políticas variables no deben vivir hardcodeadas en pantallas ni cambiar el significado histórico de una verificación.
- Resultado esperado: parámetros agrupados por el módulo donde se aplican, con un catálogo
  institucional versionado de financieras competidoras y tres catálogos de motivos para las
  evidencias verdes, amarillas y rojas, además de siete catálogos administrables de opciones de
  Entrevista y dos catálogos independientes de respuesta de Visita al vecino; su consumo es
  controlado desde Verificación y la publicación corresponde directamente a Administración.
- Indicadores de éxito: cero clasificaciones hardcodeadas, toda mutación auditada, ninguna
  mutación fuera de Administración y exactamente un motivo institucional por fotografía clasificada.

## 3. Alcance

### Incluye

- Alta de financiera competidora con nombre oficial y alias principal visible en el pop-up.
- Catálogo base con las trece financieras reales del selector de historial crediticio.
- Clasificación `OBJETIVO`, `REVISION` o `NO_PRIORITARIA`.
- Estado activo/inactivo, fecha de vigencia y motivo opcional dentro de la captura versionada.
- Datos opcionales del producto: semanas, tasa, seguro, apertura, retención, base, refinanciamiento y
  una descripción extensa de texto libre.
- Participación de mercado con cantidad de sucursales y, por cada una, zona, dirección, número de
  asesoras y valor de sucursal.
- Captura y publicación directa por Administración dentro de una sola transacción auditada.
- Historial inmutable de versiones y señal visual en la conclusión de Verificación.
- Listado seccionado conforme al sistema visual institucional.
- Pantallas independientes para administrar conceptos verdes, amarillos y rojos.
- Alta y baja lógica de conceptos sin borrar los que ya explican evidencia histórica.
- Pop-up posterior a la selección del color que exige un solo motivo activo antes de continuar con
  la selección de integrantes.
- Inicio organizado por los módulos Documentación, Verificación, Análisis, Desembolsos, Cobranza,
  Recolección, Mora, Convenios y Reportes. Verificación abre los catálogos vigentes; los demás se
  mantienen visibles como `Sin parámetros` hasta contar con un contrato aprobado.
- Segundo nivel de Verificación con accesos independientes a `Entrevista`, `Visita al vecino` y
  `Conclusiones`.
  `Conclusiones` abre su propia pantalla y contiene como primer parámetro la calificación de la
  semana actual de un crédito en otra financiera.
- Calificación de las semanas 1 a 16 mediante tres rangos configurables: verde, amarillo y rojo.
  Cada color define extremos inclusivos; los colores pueden ir en cualquier orden y dejar semanas
  sin clasificación, pero una misma semana no puede pertenecer a dos colores. La configuración
  inicial es verde 1–10, amarillo 11–13 y rojo 14–16.
- Calificación del número de ciclos en otra financiera mediante tres rangos configurables sobre los
  valores 1 a 40 usados en Entrevista. Conserva cualquier orden, huecos permitidos y prohibición de
  traslapes; se publica y audita de manera independiente al parámetro de semanas.
- Tolerancia de semana de desembolso entre 0 y 10: 0 cuando `SEMANA ACTUAL` está dentro del rango
  estimado y la distancia al límite más cercano cuando está antes o después. Diez representa diez
  semanas o más. Verde, amarillo y rojo son configurables sin traslapes.
- Concordancia de ficha y concordancia de préstamo como dos parámetros independientes de porcentaje
  entre 0 y 100. Cada uno compara el importe declarado contra el cálculo de DEC-233, admite rangos
  de color en cualquier orden y con huecos y prohíbe traslapes.
- Calificación del promedio completo de fotografías en una escala de 0 a 100 mediante rangos verde,
  amarillo y rojo configurables, sin traslapes. Inicia con rojo 0–33, amarillo 34–66 y verde 67–100.
- Dentro de `Entrevista`: Financieras competidoras, motivos verdes, amarillos y rojos, y siete
  familias directas: origen de contacto, desacuerdo de montos, no renovación, no residencia, control
  de pagos y razones para recomendarnos o no recomendarnos.
- Dentro de `Visita al vecino`: dos familias extensibles separadas para las opciones que explican
  una respuesta `Sí` y las que explican una respuesta `No`. Ninguna se precarga o infiere.
- Matriz de `Pasos obligatorios` con Documentos, Llamada, Visita al vecino, Imágenes del domicilio,
  Entrevista y Conclusiones para nueva, nueva con evidencia externa, ciclo 2+ y ciclo 2+ con
  evidencia externa. Cada regla admite `Obligatorio`, `Opcional` u `Obligatorio después de días`;
  la última exige un plazo entero de 1 a 3650 días. Los pasos opcionales continúan disponibles y la
  matriz no impone orden.
- Edición de etiqueta, orden y estado con código estable. Las familias visibles permiten altas;
  `Cómo conoció a la asesora` valida cada código nuevo contra el catálogo activo al guardar.

### No incluye

- Cambiar automáticamente el monto verificado o decidir el crédito.
- Borrar financieras o versiones históricas.
- Clasificar automáticamente el catálogo heredado de la entrevista.
- Interpretar, calcular o aplicar automáticamente los datos comerciales del producto.
- Precargar o inferir conceptos de evidencia; Administración debe capturar los reales.
- Reclasificar retroactivamente fotografías existentes sin una decisión operativa expresa.

## 4. Flujo operativo

1. La persona usuaria entra a Parámetros y selecciona el módulo al que pertenece la configuración.
2. En Verificación, Administración toca el renglón-botón de una financiera y entra directamente a su formulario, o
   usa `Agregar financiera` para crear una nueva.
3. La pantalla confirma que el cambio se guardará y publicará directamente desde su vigencia.
4. La API valida rol, permiso, revisión esperada, vigencia, nombres y ausencia de solapamientos.
5. La API crea la versión `PUBLICADA`, cierra la vigencia anterior y registra auditoría en una sola
   transacción.
6. Verificación consulta la versión publicada vigente al abrir o revisar la conclusión.
7. La conclusión muestra una burbuja verde, amarilla, roja o neutral, sin modificar el monto.
8. Una baja publicada retira la financiera de nuevas selecciones, pero conserva identidad e historial.

Para motivos de evidencia:

1. Administración entra a la pantalla verde, amarilla o roja desde el inicio de Parámetros.
2. Registra o edita un concepto aún no utilizado; la API normaliza duplicados, confirma rol y
   permiso, y audita la mutación.
3. Puede desactivar o reactivar el concepto. Después del primer uso no puede renombrarlo ni borrarlo.
4. Puede subir o bajar cualquier concepto; el servidor conserva el orden completo del color y lo audita.
5. Al tomar una evidencia de otra financiera, Verificación elige primero el color.
6. Mobile abre las opciones activas de ese mismo color, en el orden definido, y exige una sola selección.
7. Sólo con color y motivo habilita `Continuar con integrantes`; la API vuelve a validar que el
   concepto siga activo y corresponda al color antes de guardar.

Para Visita al vecino:

1. Administración entra a `Parámetros > Verificación > Visita al vecino`.
2. Elige `Opciones cuando responde Sí` u `Opciones cuando responde No` y administra sus opciones
   de forma independiente mediante alta, edición, orden y baja lógica.
3. En campo, tocar `Sí` o `No` abre automáticamente el selector de respuesta única de la rama elegida.
4. La respuesta sólo se guarda con exactamente una opción activa confirmada y ubicación válida.
5. El servidor conserva instantáneas de etiqueta y orden para que cambios posteriores del catálogo
   no reescriban el historial de la visita.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| Versión/nombre oficial | Administración | No | si se captura: único normalizado, 2–120 caracteres | Sí |
| Versión/clasificación | Administración | No | catálogo cerrado o `NULL` = sin clasificar | Sí |
| Versión/motivo | Administración | No | dato histórico de versiones anteriores | Sí |
| Versión/alias | Administración | No | primero = texto del pop-up; sin duplicados normalizados | Sí |
| Versión/activa | Servidor/acción | Sí | activa por defecto; baja/reactivación explícita | Sí |
| Versión/vigencia | Servidor | Sí | fecha capturada; sin superposición publicada | Sí |
| Versión/producto | Administración | No | siete textos de hasta 120 caracteres; sin cálculo automático | Sí |
| Versión/descripción | Administración | No | texto libre multilínea de hasta 10,000 caracteres | Sí |
| Versión/sucursales | Administración | No | máximo 10; orden estable dentro de la versión | Sí |
| Sucursal/zona | Administración | No | texto de hasta 120 caracteres | Sí |
| Sucursal/dirección | Administración | No | texto de hasta 250 caracteres | Sí |
| Sucursal/número de asesoras | Administración | No | entero mayor o igual a cero | Sí |
| Sucursal/valor | Administración | No | texto de hasta 120 caracteres; no se interpreta como saldo | Sí |
| Actor de definición y publicación | JWT/API | Sí | ADMINISTRADOR activo con capacidad `parametros:registrar` | Sí |
| Motivo de evidencia/clasificación | Administración | Sí | `VERDE`, `AMARILLO` o `ROJO` | Sí |
| Motivo de evidencia/concepto | Administración | Sí | 2–120 caracteres; único normalizado dentro del color; editable sólo antes del primer uso | Sí |
| Motivo de evidencia/orden | Administración | Sí | entero positivo y único dentro del color; incluye activos e inactivos | Sí |
| Motivo de evidencia/activo | Servidor/acción | Sí | baja lógica; no se elimina | Sí |
| Evidencia/motivo elegido | Verificación | Sí en nuevas evidencias externas | UUID activo y del mismo color | Sí |
| Opción de Entrevista/código | Migración/API | Sí | estable y único dentro de la familia | Sí |
| Opción de Entrevista/etiqueta | Administración | Sí | 1–120 caracteres; única normalizada | Sí |
| Opción de Entrevista/orden y activo | Administración | Sí | posición positiva única y baja lógica | Sí |
| Opción de Visita al vecino/código | Administración/API | Sí | estable, único y perteneciente a la rama `Sí` o `No` | Sí |
| Opción de Visita al vecino/etiqueta | Administración | Sí | 1–120 caracteres; única normalizada dentro de la rama | Sí |
| Selección de Visita al vecino | Verificación | Sí para respuestas nuevas | exactamente una opción activa de la misma rama que la respuesta; instantánea de etiqueta y orden | Sí |
| Conclusiones/semana verde | Administración | Sí | extremos inclusivos entre 1 y 16 | Auditoría |
| Conclusiones/semana amarilla | Administración | Sí | extremos inclusivos entre 1 y 16, sin traslapar otro color | Auditoría |
| Conclusiones/semana roja | Administración | Sí | extremos inclusivos entre 1 y 16, sin traslapar otro color | Auditoría |
| Conclusiones/ciclos verde | Administración | Sí | extremos inclusivos entre 1 y 40 | Auditoría |
| Conclusiones/ciclos amarillo | Administración | Sí | extremos inclusivos entre 1 y 40, sin traslapar otro color | Auditoría |
| Conclusiones/ciclos rojo | Administración | Sí | extremos inclusivos entre 1 y 40, sin traslapar otro color | Auditoría |
| Conclusiones/tolerancia desembolso | Administración | Sí | tres rangos inclusivos entre 0 y 10, sin traslapes | Auditoría |
| Conclusiones/promedio de fotografías | Administración | Sí | tres rangos inclusivos entre 0 y 100, sin traslapes | Auditoría |

## 6. Estados y transiciones

| Estado | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| PUBLICADA | Administración | cambio válido y confirmado | terminal/versionada | no borra la versión previa ni admite vigencias superpuestas |

Los estados `PENDIENTE_APROBACION`, `APROBADA` y `RECHAZADA` permanecen en el esquema únicamente
para compatibilidad histórica. Desde DEC-199 no se crean nuevas versiones en esos estados.

## 7. Pantallas

| Pantalla | Plantilla T1–T8 | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Inicio de Parámetros | T8 | agrupar las familias configurables por módulo de aplicación | abrir módulo con catálogos vigentes | `AppHeader`, `ScreenTitleBar`, `ModuleCard` |
| Parámetros de verificación | T8 | mostrar los catálogos que consume Verificación | abrir catálogo | `AppHeader`, `ScreenTitleBar`, `TaskMenuButton` |
| Parámetros de conclusiones | T1/T8 | elegir una familia configurable del resumen final | abrir calificación de semana, volver a Verificación | `AppHeader`, `ScreenTitleBar`, `TaskMenuButton` |
| Calificar semana del crédito | T4 | definir los rangos verde, amarillo y rojo de la semana actual externa | seleccionar dos límites por color, guardar y publicar, cancelar | `PickerField`, `Card`, `BottomActionBar` |
| Financieras competidoras | T1 | distinguir lo incluido y excluido del pop-up | abrir directamente el formulario, alta | `FinancieraStatusRow`, `SectionList`, botones oficiales |
| Parámetros de financiera | T4 | consultar o capturar identidad, clasificación, disponibilidad, producto y participación de mercado | historial, guardar y publicar/cancelar | `TextInput`, `SemanticChoiceGroup`, `SelectorField`, `StickySectionHeader`, `BottomActionBar` |
| Motivos de evidencia verde | T1/T4 | administrar opciones favorables del pop-up | alta, ordenar, desactivar, reactivar | `TextInput`, `SectionList`, `StickySectionHeader`, `StatusBadge`, botones oficiales |
| Motivos de evidencia amarilla | T1/T4 | administrar opciones que requieren atención | alta, ordenar, desactivar, reactivar | `TextInput`, `SectionList`, `StickySectionHeader`, `StatusBadge`, botones oficiales |
| Motivos de evidencia roja | T1/T4 | administrar opciones desfavorables | alta, ordenar, desactivar, reactivar | `TextInput`, `SectionList`, `StickySectionHeader`, `StatusBadge`, botones oficiales |
| Parámetros de entrevista | T1/T8 | elegir financieras, motivos de evidencia o una de siete familias directas | abrir catálogo | `FlatList`, `TaskMenuButton` |
| Opciones de entrevista | T1/T4 | administrar etiqueta, orden y disponibilidad | alta cuando aplica, editar, ordenar, desactivar/reactivar | `FlatList`, `TextInput`, `StatusBadge`, botones oficiales |
| Parámetros de Visita al vecino | T1/T8 | elegir el catálogo de la rama afirmativa o negativa | abrir catálogo | `FlatList`, `TaskMenuButton` |
| Opciones de Visita al vecino | T1/T4 | administrar etiqueta, orden y disponibilidad por rama | alta, editar, ordenar, desactivar/reactivar | `FlatList`, `TextInput`, `StatusBadge`, botones oficiales |
| Pasos obligatorios | T4 | definir obligatoriedad por tipo de integrante | cambiar obligatorio/opcional y publicar matriz completa | `Card`, `SelectorField`, `BottomActionBar`, `ConfirmDialog` |

En los tres catálogos de motivos, cada concepto usa un renglón compacto. El texto y su estado se
muestran primero; debajo, subir, bajar, `Editar` y `Desactivar` o `Reactivar` comparten una sola fila.
Las acciones conservan un área táctil mínima de 44 px. `CONCEPTOS REGISTRADOS` usa la franja
institucional con bordes superior e inferior, es ligeramente más larga que las tarjetas y permanece
fija sobre una superficie opaca mientras se desplazan los conceptos. Cada tarjeta muestra en una
columna lateral centrada una insignia grande con su posición `1, 2, 3…`, que se actualiza después de
subir o bajar. El modo de edición
presenta también `Guardar cambio` y `Cancelar` en una sola fila, sin reducir la legibilidad del campo.

El inicio de M11 presenta una tarjeta por módulo operativo. Sólo Verificación está habilitada porque
es el único módulo con familias de parámetros ejecutables en el corte vigente; las demás tarjetas
permanecen visibles, deshabilitadas y con la etiqueta `Sin parámetros`. Esta organización no crea
valores, permisos ni reglas para módulos todavía no especificados. Al entrar a Verificación aparece
un segundo nivel con Entrevista, Visita al vecino y Conclusiones. Dentro de Entrevista aparecen
Financieras competidoras, los tres catálogos de motivos y las siete familias directas; dentro de
Visita al vecino aparecen únicamente los dos catálogos independientes `Sí` y `No`. Todas las tarjetas
del primer nivel usan el tema gris de Parámetros para no confundirse con el Menú principal. El
segundo nivel abandona la cuadrícula y presenta cada catálogo como un renglón rectangular de ancho
completo, con icono, título, descripción y flecha de apertura.

El catálogo muestra primero `Agregar financiera`, sin tarjeta explicativa. Después separa
`SE MUESTRAN EN EL POP-UP` de `NO SE MUESTRAN` y usa un renglón compacto por financiera. Sólo
presenta el primer alias visible y un círculo con fondo verde, amarillo o rojo claro y borde sólido
del mismo tono según la clasificación seleccionada; permanece blanco con borde gris cuando no existe
clasificación. Tocar cualquier parte
del renglón abre directamente `Parámetros de financiera`; no existe una pantalla intermedia de
detalle. El círculo del catálogo representa sólo la clasificación publicada vigente y se actualiza
al regresar después de `Guardar y publicar`.

El formulario ordena `Alias para el pop-up`, `Nombre oficial`, `Clasificación`,
`Motivo de la clasificación`, `Vigencia desde` y al final
`¿Se muestran en el pop-up?`. Alias, nombre, clasificación y motivo no son obligatorios;
si existe motivo debe tener al menos cinco caracteres. La vigencia se precarga con la fecha local y
se presenta y captura como `DD-MMM-AAAA`, con mes abreviado en español y mayúsculas, por ejemplo
`08-OCT-2026`; mobile la convierte al contrato ISO `AAAA-MM-DD` antes de enviarla. Acepta hoy o una
fecha futura. La API evalúa `hoy` como día calendario de
`America/Mexico_City`, sin adelantarlo por la fecha UTC del servidor. Una selección de color puede
tocarse nuevamente para volver a
`SIN CLASIFICAR`. La disponibilidad reutiliza el mismo `SelectorField` compacto `Sí / No` de
Verificación, con el tema gris de Parámetros, y cambia al confirmar la publicación directa.
`Historial` permanece disponible como acción secundaria dentro del formulario, sin crear un paso
obligatorio antes de editar. Para usuarios sin permiso de modificación, el mismo formulario se
presenta en modo de sólo lectura.

Después de la disponibilidad, el formulario muestra el renglón `PRODUCTO` y los campos opcionales
`Semanas`, `Tasa`, `Seguro`, `Apertura`, `Retención`, `Base` y `Refinanciamiento`. Inmediatamente
después incorpora `Descripción`, un área multilínea de texto libre con capacidad de hasta 10,000
caracteres. El renglón `PARTICIPACIÓN MERCADO` inicia después de esa descripción con `Número de
sucursales`, un selector desplazable de `0` a `10`
que previsualiza la opción tocada y exige confirmarla antes de modificar el formulario. La cantidad
confirmada abre un bloque delimitado por sucursal con `Zona`, `Dirección`, `# Asesoras` y
`Valor $ de sucursal`. Reducir temporalmente la cantidad no destruye lo escrito durante la edición;
Sólo se envían los bloques correspondientes a la cantidad final. El formulario y el historial permiten
revisar estos datos.

## 8. API y persistencia

- Endpoints: listado administrativo, publicación directa e historial, además del catálogo vigente
  para Verificación. Las rutas de aprobación, rechazo y publicación diferida fueron retiradas.
- Servicios: `ParametrosFinancierasService` concentra normalización, vigencia, control de concurrencia
  y publicación transaccional exclusiva de Administración.
- Tablas/relaciones: `financieras_competidoras`, `financieras_competidoras_versiones`,
  `parametros_verificacion_pasos_versiones` y `parametros_verificacion_pasos_reglas`; los actores
  de publicación referencian `usuarios`.
- Pasos de Verificación: `GET/PUT /parametros/verificacion/pasos` administra la matriz completa;
  `GET /verificacion/parametros/pasos/integrantes/:id/requisitos` devuelve el tipo calculado, la
  revisión vigente y las seis reglas aplicables con alcance verificado.
- Datos iniciales: migración 040 aplicada en prueba y operación; trece identidades base, sin versiones ni clasificación inferida.
- Separación nombre/alias: migración 041 aplicada en prueba y operación; el nombre oficial queda
  versionado y el primer alias alimenta la captura.
- Captura opcional: migración 042 aplicada en prueba y operación; clasificación y motivo admiten
  `NULL`, mientras vigencia y disponibilidad se derivan sin inventar respuestas de la usuaria.
- Producto y mercado: migración 043 aplicada, revertida y reaplicada en `crelealtad_test`, y después
  aplicada con respaldo en `crelealtad`. Los siete datos de producto viven en la versión y las
  sucursales en `financieras_competidoras_sucursales_version`, ligadas con `ON DELETE RESTRICT`.
- Límite de sucursales: migración 044 aplicada, revertida y reaplicada en `crelealtad_test`, y después
  aplicada con respaldo en `crelealtad`; alinea el constraint de persistencia con el selector `0–10`.
- Descripción extensa: migración 045 aplicada, revertida y reaplicada en `crelealtad_test`, y después
  aplicada con respaldo en `crelealtad`; agrega `descripcion TEXT NULL` a cada versión sin modificar
  las versiones existentes.
- Gobierno directo: migración 046 aplicada, revertida y reaplicada en `crelealtad_test`, validada con
  rollback sobre los roles reales y aplicada con respaldo en `crelealtad`; conserva en Administración
  `parametros:leer/actualizar/registrar` y retira `parametros:aprobar/rechazar` de roles y excepciones.
- Idempotencia: unicidad de nombre normalizado, revisión esperada y vigencias sin solapamiento;
  los conflictos se responden sin duplicar.
- Auditoría: cada cambio directo registra `FIN_PUBLICADA` con actor, versión, vigencia y datos
  publicados; nunca sustituye ni borra versiones anteriores.
- Motivos de evidencia: `GET/POST /parametros/evidencia/motivos-clasificacion`,
  `PATCH /parametros/evidencia/motivos-clasificacion/:id` y
  `PATCH /parametros/evidencia/motivos-clasificacion/:id/estado` concentran la administración;
  `GET /verificacion/evidencia/motivos-clasificacion` entrega únicamente opciones activas al flujo
  operativo. Altas, ediciones y cambios de estado registran `MOT_EVI_ALTA`, `MOT_EVI_EDITA` y
  `MOT_EVI_ESTADO`. La ruta específica `/:id/estado` se declara antes de `/:id` y tiene una prueba
  HTTP que impide que una regresión la envíe al manejador de edición. Las mutaciones extraen las
  filas de la respuesta estructurada `[filas, conteo]` de TypeORM antes de responder y auditar.
- Entrevista: `GET/POST /parametros/verificacion/entrevista`,
  `PATCH /parametros/verificacion/entrevista/:id`, `PATCH .../:id/estado` y `PUT .../orden`
  concentran la administración. `GET /verificacion/parametros/entrevista` entrega el catálogo al
  flujo operativo bajo `verificacion:leer`.
- Persistencia de Entrevista: la migración 053 crea `parametros_entrevista_opciones`, precarga 88
  opciones en 18 familias y conserva código, etiqueta, orden, baja lógica, actores y fechas. Fue
  aplicada, verificada, revertida y reaplicada en `crelealtad_test`; después se aplicó con respaldo
  verificado en `crelealtad`.
- Persistencia de Visita al vecino: la migración 064 agrega las familias extensibles
  `VISITA_VECINO_RESPUESTA_SI` y `VISITA_VECINO_RESPUESTA_NO` al mismo catálogo, sin precargar
  opciones, y crea `verificacion_visita_vecino_opciones` para conservar la selección con
  instantáneas de etiqueta y orden. Un trigger valida la familia y disponibilidad al insertar. Fue
  aplicada, revertida y reaplicada en `crelealtad_test`; después del respaldo verificado
  `database/backups/crelealtad-pre-064-20261018.backup` se aplicó en `crelealtad`. La migración 065
  limita cada visita a una sola opción; también pasó aplicación, reversión, reaplicación e
  integración en prueba y se desplegó después de validar
  `database/backups/crelealtad-pre-065-20261018.backup`. Ambas bases quedaron con 62 migraciones
  canónicas, sin pendientes, deriva ni entradas desconocidas.
- Persistencia de motivos: la migración 050 crea `motivos_clasificacion_evidencia`, agrega
  `motivo_clasificacion_id` a `verificacion_entrevista_evidencias` y enlaza de forma restrictiva el
  UUID con el mismo color. El campo nullable conserva el legado, mientras un `CHECK NOT VALID`
  protege cada inserción nueva de historial externo sin exigir una clasificación retroactiva.
- Despliegue 050: pasó aplicación, rollback protegido y reaplicación en `crelealtad_test`; después
  se aplicó en `crelealtad` con respaldo validado. Ambas bases quedaron 47/47, sin pendientes,
  drift ni entradas desconocidas. No se precargó ningún concepto.
- Catálogo base 051: completa hasta cinco motivos activos por color sin reemplazar registros
  existentes. Pasó aplicación, reversión y reaplicación en `crelealtad_test`; en operación conservó
  tres motivos amarillos existentes, agregó dos amarillos, cinco verdes y cinco rojos. Ambas bases
  quedaron 48/48, sin pendientes, drift ni entradas desconocidas.
- Orden de motivos 052: agrega `orden` positivo y único por clasificación, conserva inicialmente el
  orden administrativo visible y habilita `PUT /parametros/evidencia/motivos-clasificacion/orden`.
  La operación exige todos los UUID del color, bloquea el catálogo durante el cambio y audita cada
  posición modificada con `MOT_EVI_ORDEN`. Verificación recibe los activos en ese mismo orden.
  Aplicación, reversión y reaplicación pasaron en `crelealtad_test`; después se respaldó y aplicó en
  `crelealtad`. Ambas bases quedaron 49/49, sin pendientes, drift ni entradas desconocidas.
- Rangos de semana 056: sustituye la partición ordenada de 055 por tres rangos independientes y sin
  traslapes. Pasó aplicación, reversión y reaplicación en `crelealtad_test`; después se respaldó y
  aplicó en `crelealtad`. Ambas bases quedaron con 53 migraciones, sin pendientes, deriva ni
  entradas desconocidas.

## 9. Reglas de negocio

- RN-M11-01: la clasificación es una señal de análisis, no una autorización ni una regla automática de monto.
- RN-M11-02: `OBJETIVO` se presenta en verde, `REVISION` en amarillo y `NO_PRIORITARIA` en rojo.
- RN-M11-03: en Conclusiones la burbuja muestra sólo el nombre de la financiera; una clasificación
  vigente aporta verde, amarillo o rojo y su ausencia deja fondo blanco con marco oscuro, sin una
  leyenda visible de clasificación.
- RN-M11-04: el color de la financiera en Conclusiones usa la clasificación publicada vigente al
  momento de la consulta; una publicación posterior puede actualizar esa señal visual sin modificar
  respuestas, evidencias ni cálculos temporales de la entrevista.
- RN-M11-05: no se elimina historial; una baja se representa con una versión `activa=false`.
- RN-M11-06: Administración, entendida como Dirección, define y publica directamente M11; Gerencia
  no interviene en este catálogo.
- RN-M11-07: `Otra` es una opción funcional del selector y no una identidad del catálogo.
- RN-M11-08: quitar una financiera crea una versión inactiva; no borra su identidad o versiones.
- RN-M11-09: el pop-up muestra el primer alias publicado; si no existe, usa el nombre oficial.
- RN-M11-10: una corrección del nombre oficial cambia la identidad únicamente dentro de la
  publicación directa confirmada.
- RN-M11-11: alias, nombre oficial y clasificación son opcionales individualmente; una alta nueva requiere al menos alias o nombre para tener identidad visible.
- RN-M11-12: una edición completamente vacía o sin cambios no se publica.
- RN-M11-13: la vigencia inicia en la fecha capturada y la disponibilidad permanece activa salvo baja o reactivación explícita.
- RN-M11-14: las secciones del catálogo reflejan exclusivamente la disponibilidad publicada.
- RN-M11-15: la edición permite definir con `Sí / No` si la financiera se muestra en el pop-up;
  `No` es una baja lógica versionada y no un borrado.
- RN-M11-16: el motivo es opcional con mínimo de cinco caracteres cuando se captura; la vigencia explícita debe ser una fecha válida de hoy o futura.
- RN-M11-17: la disponibilidad reutiliza `SelectorField`, igual que las preguntas binarias de Verificación, y no utiliza el semáforo de clasificación.
- RN-M11-18: producto, número de sucursales y datos de cada sucursal son opcionales y se versionan
  dentro de la misma publicación directa.
- RN-M11-19: el número de sucursales se elige en un selector desplazable de cero a diez; la opción se
  previsualiza en el selector y sólo cambia los bloques al confirmar. El total publicado se deriva de
  los bloques guardados.
- RN-M11-20: tasa, seguro, apertura, retención, base, refinanciamiento y valor de sucursal son datos
  declarativos; M11 no los calcula ni los usa para autorizar, rechazar o modificar un crédito.
- RN-M11-21: la descripción del producto es opcional, admite texto libre multilínea de hasta 10,000
  caracteres, conserva saltos de línea internos y se guarda en la misma versión; no genera ni
  modifica reglas automáticas de crédito.
- RN-M11-22: existen tres catálogos independientes de conceptos: verde, amarillo y rojo; un
  concepto sólo puede ofrecerse para el color al que pertenece.
- RN-M11-23: cada fotografía nueva de historial crediticio externo exige exactamente un motivo,
  elegido después del color y antes de seleccionar integrantes.
- RN-M11-24: el motivo se guarda por fotografía como referencia institucional; no determina por sí
  solo dictamen, autorización, estado ni consecuencia financiera.
- RN-M11-25: desactivar un concepto lo retira de nuevas selecciones, pero no borra ni altera las
  fotografías que ya lo utilizaron. Un duplicado inactivo se reactiva; no se crea otra identidad.
- RN-M11-26: las evidencias anteriores a la migración 050 conservan motivo `NULL`; el sistema no
  inventa una explicación retroactiva.
- RN-M11-27: si un color no tiene conceptos activos o el catálogo no puede consultarse, mobile no
  permite confirmar la clasificación ni simula que la evidencia quedó guardada.
- RN-M11-28: un reintento idempotente exacto puede resolver el motivo histórico aunque haya sido
  desactivado después del primer registro confirmado; esta excepción sólo recupera la evidencia ya
  existente y nunca autoriza una fotografía nueva con un concepto inactivo.
- RN-M11-29: cada color dispone de cinco motivos activos iniciales; la carga completa faltantes y no
  sustituye conceptos que Administración ya haya registrado.
- RN-M11-30: Administración puede renombrar un motivo únicamente mientras ninguna evidencia lo haya
  utilizado. Después debe desactivarlo y crear el reemplazo para conservar el significado histórico.
- RN-M11-31: Administración define un orden único por color que incluye motivos activos e inactivos;
  el pop-up filtra los inactivos sin reordenar los restantes. Un alta nueva se agrega al final.
- RN-M11-32: el inicio agrupa parámetros por módulo de aplicación. Una tarjeta sólo se habilita
  cuando ese módulo tiene por lo menos una familia de parámetros aprobada e implementada; mostrar
  un módulo como `Sin parámetros` no autoriza ni anticipa reglas nuevas.
- RN-M11-33: las tarjetas del selector de módulos usan exclusivamente el tema gris de M11. Las
  familias dentro del módulo seleccionado se muestran como renglones rectangulares, no como una
  segunda cuadrícula de módulos.
- RN-M11-34: Parámetros de Verificación presenta `Entrevista`, `Visita al vecino` y `Conclusiones`
  como accesos hermanos. Las familias de los tres apartados permanecen separadas.
- RN-M11-35: el primer parámetro de Conclusiones define tres rangos inclusivos dentro de las semanas
  1 a 16. Verde, amarillo y rojo pueden ir en cualquier orden y dejar semanas sin clasificación;
  cada rango cumple `Desde <= Hasta` y mobile, API y PostgreSQL rechazan cualquier traslape o valor
  fuera del intervalo.
- RN-M11-36: sólo ADMINISTRADOR puede guardar y publicar los rangos. La mutación conserva actor,
  fecha, valores anteriores y posteriores en auditoría. Verificación puede consultar el vigente.
- RN-M11-37: `SEMANA ACTUAL` de la otra financiera usa el rango vigente para mostrarse verde,
  amarillo o rojo. Si no se pudo confirmar el parámetro, el dato permanece neutral y no simula una
  clasificación.
- RN-M11-38: `Calificar número de ciclos` usa exactamente los valores 1–40 de Entrevista. Sus tres
  rangos pueden cambiar de orden y dejar huecos, pero no traslaparse.
- RN-M11-39: `CICLOS EN ESA FINANCIERA` usa el parámetro vigente para mostrarse verde, amarillo o
  rojo. Sin consulta confirmada o fuera de los rangos, permanece neutral.
- RN-M11-40: la tolerancia de desembolso vale 0 dentro del rango estimado, mide hacia el límite más
  cercano fuera de éste y se limita a 10, que representa diez semanas o más.
- RN-M11-41: Administración configura de 0 a 10 los rangos verde, amarillo y rojo de esa tolerancia;
  admite cualquier orden y huecos, pero ningún valor puede pertenecer a dos colores.
- RN-M11-42: `MES DE DESEMBOLSO` y su rango estimado usan el tono de tolerancia confirmado; sin
  parámetro o datos suficientes permanecen neutrales.
- RN-M11-43: la diferencia porcentual de ficha o préstamo se calcula como
  `|declarado − calculado| ÷ calculado × 100`, redondeada al entero más cercano y limitada a 100.
- RN-M11-44: ficha y préstamo tienen configuraciones independientes entre 0 y 100; admiten cualquier
  orden y huecos, pero un mismo porcentaje no puede pertenecer a dos colores.
- RN-M11-45: la configuración inicial de ambos parámetros es verde 0–5%, amarillo 6–10% y rojo
  11–100%. El tono se aplica sólo al valor calculado de la tercera columna; el dato declarado de la
  segunda columna permanece neutral. Sin operandos positivos o parámetro confirmado, la tercera
  celda también permanece neutral.
- RN-M11-46: el promedio completo de fotografías usa un parámetro independiente entre 0 y 100, con
  rangos inclusivos configurables, huecos permitidos y traslapes prohibidos. Inicia en rojo 0–33,
  amarillo 34–66 y verde 67–100.
- RN-M11-47: el tono se aplica únicamente al círculo cuando DEC-245 produce un promedio completo y
  el parámetro fue confirmado. Con `?`, error de consulta o valor fuera de los rangos, permanece
  neutral.
- RN-M11-48: `VISITA_VECINO_RESPUESTA_SI` y `VISITA_VECINO_RESPUESTA_NO` son catálogos extensibles,
  independientes y sin datos iniciales inventados; Administración debe configurar al menos una
  opción activa en cada rama que se utilice.
- RN-M11-49: una respuesta nueva de Visita al vecino exige exactamente una opción activa de la
  familia que corresponda al `Sí` o `No`; catálogo vacío, error de consulta, mezcla de familias o
  más de una opción bloquean el guardado.
- RN-M11-50: editar, ordenar o desactivar una opción no reescribe las visitas confirmadas, porque cada
  relación conserva instantáneas de etiqueta y orden. Las visitas anteriores a la migración 064 no
  reciben opciones inferidas.
- RN-M11-51: Administración elige en un selector desplazable un entero de 0 a 12 integrantes
  verificadas requeridas para habilitar `Finalizar Verificación de Grupo`; cuentan aprobadas y
  rechazadas, no pendientes. Cero elimina el mínimo de revisiones concluidas, pero sin publicación
  o sin consulta confirmada el botón permanece bloqueado.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Leer catálogo | Todos los roles activos | capacidad exacta temporal `parametros:leer` | no |
| Definir alta/cambio | ADMINISTRADOR | `parametros:actualizar` y `parametros:registrar` | sí |
| Publicar directamente | ADMINISTRADOR | confirmación explícita, revisión y vigencia válidas | sí |
| Consultar vigente | VERIFICADOR autorizado | `verificacion:leer` | no |
| Leer motivos administrativos | Usuario autorizado | `parametros:leer` | no |
| Crear motivo | ADMINISTRADOR | `parametros:registrar` y rol exacto | sí |
| Editar motivo no utilizado | ADMINISTRADOR | `parametros:actualizar`, rol exacto y cero evidencias relacionadas | sí |
| Desactivar/reactivar motivo | ADMINISTRADOR | `parametros:actualizar` y rol exacto | sí |
| Consultar motivos activos | VERIFICADOR autorizado | `verificacion:leer` | no |
| Definir rangos de semana de Conclusiones | ADMINISTRADOR | `parametros:actualizar`, rol exacto y rangos sin traslapes | sí |
| Consultar rangos para Conclusiones | VERIFICADOR autorizado | `verificacion:leer` | no |
| Definir rangos de ciclos de Conclusiones | ADMINISTRADOR | `parametros:actualizar`, rol exacto y rangos sin traslapes | sí |
| Definir tolerancia de desembolso | ADMINISTRADOR | `parametros:actualizar`, rol exacto y rangos 0–10 sin traslapes | sí |
| Definir concordancia de ficha o préstamo | ADMINISTRADOR | `parametros:actualizar`, rol exacto y rangos 0–100 sin traslapes | sí |
| Definir rangos del promedio de fotografías | ADMINISTRADOR | `parametros:actualizar`, rol exacto y rangos 0–100 sin traslapes | sí |

## 11. Estados técnicos de UI

- Carga: estado explícito de consulta.
- Vacío: invita a registrar la primera financiera si el usuario puede actualizar.
- Error: conserva pantalla y ofrece reintento.
- Sin conexión: lectura de la entrevista conserva el catálogo local heredado; las mutaciones de Parámetros se bloquean y no simulan éxito.
- Con conexión: el selector de Entrevista usa únicamente las financieras disponibles que devuelve M11.
- Motivos sin opciones: después de elegir el color, explica que Administración aún no registró
  conceptos activos y mantiene deshabilitada la continuación.
- Error al consultar motivos: muestra el error de conexión dentro del pop-up y bloquea la
  confirmación; nunca usa conceptos hardcodeados como respaldo.
- Sin permiso: mientras DEC-189 esté vigente sólo aplica a cuentas o roles inactivos; al retirar la excepción, navegación y API vuelven a exigir la capacidad efectiva configurada.
- Autoguardado: no aplica; la publicación directa requiere confirmación explícita.

## 12. Casos especiales

- Duplicados: nombre y alias se comparan sin acentos, mayúsculas ni espacios repetidos.
- Datos opcionales: se permite capturar sólo el dato que cambió; una edición vacía o sin cambios no se publica.
- Reintentos: un conflicto devuelve el estado vigente para refrescar antes de volver a enviar.
- Navegación interrumpida: no hay mutación hasta confirmar.
- Concurrencia: bloqueo transaccional y revisión esperada evitan publicar sobre una versión desactualizada.
- Motivo desactivado durante una captura: la API rechaza una selección nueva y obliga a consultar
  nuevamente el catálogo; la evidencia no se presenta como confirmada.

## 13. Criterios de aceptación

- [x] El módulo aparece a todos los usuarios mediante la capacidad exacta temporal `parametros:leer`, sin heredar acciones de modificación.
- [x] Conserva grilla, encabezados, tarjetas, estados y botones institucionales.
- [x] No existe clasificación de competencia hardcodeada.
- [x] La API permite publicar únicamente a ADMINISTRADOR con `parametros:registrar`.
- [x] Verificación conserva el catálogo heredado si no hay conexión.
- [x] La conclusión muestra sólo el nombre de la financiera y expresa mediante el color la
  clasificación vigente al momento de revisión; sin clasificación usa blanco con marco oscuro.
- [x] No se modifica automáticamente el monto verificado.
- [x] Las trece financieras iniciales aparecen en Parámetros sin clasificación inferida.
- [x] El catálogo muestra un renglón por financiera con alias y un único círculo de estado; blanco significa sin clasificar.
- [x] Tocar el renglón abre directamente `Parámetros de financiera`, sin pantalla intermedia; ahí la
  clasificación ofrece selección verde, amarilla y roja sin depender sólo del color.
- [x] Agregar y quitar publican directamente y conservan auditoría e historial.
- [x] Parámetros conserva el nombre oficial y Verificación muestra el alias reconocido por las integrantes.
- [x] El semáforo usa círculos claros en reposo y color sólido al seleccionar, con recuadros delimitados.
- [x] La edición conserva alias, nombre oficial y clasificación como los primeros tres datos y sin asteriscos de obligatoriedad.
- [x] El catálogo elimina la explicación superior y separa en renglones las financieras que se muestran y no se muestran en el pop-up.
- [x] La edición incluye motivo y vigencia, y termina con `¿Se muestran en el pop-up?` usando el selector institucional compacto `Sí / No` de Verificación.
- [x] Debajo de la disponibilidad aparecen los renglones `PRODUCTO` y `PARTICIPACIÓN MERCADO` con
  todos los campos solicitados y un bloque por cada sucursal indicada.
- [x] Los nuevos datos se conservan en publicación, formulario e historial sin
  volver obligatorio ningún campo.
- [x] `Descripción` aparece después de `Refinanciamiento`, antes de `PARTICIPACIÓN MERCADO`, admite
  texto libre multilínea y conserva su contenido en publicación, ficha e historial.
- [x] `Guardar y publicar` crea la versión vigente sin pantalla, ruta o permiso de aprobación de Gerencia.
- [x] El inicio de Parámetros ofrece pantallas independientes para motivos verdes, amarillos y rojos.
- [x] Administración puede agregar, editar los conceptos no utilizados, desactivar y reactivar sin borrar.
- [x] El pop-up de evidencia muestra sólo conceptos activos del color elegido y permite una sola selección.
- [x] `Continuar con integrantes` permanece deshabilitado hasta tener color y un motivo.
- [x] La API rechaza motivo ausente, inactivo o perteneciente a otro color.
- [x] Las fotografías históricas conservan motivo `NULL` sin inferencia ni modificación.
- [x] Cada color tiene cinco motivos activos iniciales y los conceptos existentes se preservan.
- [x] `CONCEPTOS REGISTRADOS` permanece fijo durante el scroll y usa la franja institucional.
- [x] Administración puede subir o bajar motivos y el pop-up conserva ese orden.
- [x] El inicio agrupa los parámetros por módulo, abre Verificación en un segundo nivel y distingue
  como `Sin parámetros` las áreas que todavía no tienen familias aprobadas.
- [x] El selector de módulos conserva tarjetas grises y los catálogos de Verificación se presentan
  como renglones rectangulares de ancho completo.
- [x] Parámetros de Verificación muestra `Entrevista`, `Visita al vecino` y `Conclusiones`; este
  último abre una pantalla independiente y permite entrar a `Calificar semana del crédito`.
- [x] `Visita al vecino` abre dos catálogos independientes, `Opciones cuando responde Sí` y
  `Opciones cuando responde No`, con alta, edición, orden y baja lógica.
- [x] Ambos catálogos inician vacíos, sin textos inferidos; el flujo operativo bloquea una respuesta
  cuando su rama no tiene opciones activas y exige exactamente una selección confirmada.
- [x] La selección histórica conserva etiqueta y orden aunque Administración cambie después el
  catálogo; ninguna visita anterior recibe una explicación retroactiva.
- [x] La calificación presenta, de arriba hacia abajo, círculos verde, amarillo y rojo; junto a cada
  color permite seleccionar `Desde` y `Hasta` entre las semanas 1 y 16.
- [x] La configuración inicial es verde 1–10, amarillo 11–13 y rojo 14–16; puede publicarse cualquier
  orden y dejar semanas neutrales, siempre que los rangos sean válidos y no se traslapen.
- [x] Conclusiones colorea `SEMANA ACTUAL` con la configuración confirmada por la API y conserva un
  estado neutral cuando no puede consultarla.
- [x] Ficha y préstamo usan parámetros porcentuales independientes, auditados y neutrales cuando no
  pueden calcularse o consultarse.
- [x] El promedio completo de fotografías usa rangos 0–100 independientes y auditados; el círculo
  conserva presentación neutral mientras falte una calificación o no se confirme el parámetro.
- [x] Cada paso de los cuatro tipos permite obligatoriedad permanente, opcional o condicionada por
  un plazo editable; una modalidad sin plazo válido no puede publicarse.
- [x] El primer acceso de Parámetros de Verificación permite publicar, con versión y auditoría, la
  cantidad de revisiones concluidas que habilita el cierre visual del grupo; no existe valor inicial
  inferido y la transición formal continúa separada.

## 14. Pruebas

- Unitarias: normalización, colores/etiquetas, rol exclusivo, publicación directa, vigencia,
  alta, edición segura, baja lógica de motivos, selección única obligatoria, catálogos separados de
  Visita al vecino, una opción por respuesta e idempotencia exacta.
- Integración: permisos de controladores, transacciones auditadas y migraciones directas/reversas.
- UI/manuales: grilla gris por módulo, segundo nivel de Verificación en renglones, apertura directa
  del formulario, estados vacío/error/carga, alta, confirmación, publicación, tres pantallas de
  motivos, dos catálogos de Visita al vecino, selector de respuesta única por rama, rangos de semana, bloqueo
  sin opciones y actualización del círculo al regresar.
- Regresión: entrevista, conclusión y catálogo estático de respaldo.

## 15. Decisiones abiertas

- La clasificación inicial de cada financiera debe ser capturada por Dirección mediante Administración;
  no se infiere ni se precarga.
- Las unidades y reglas de cálculo de los datos de producto permanecen abiertas; hasta que operación
  las defina, se conservan como textos declarativos sin interpretación automática.
