# M02 — Documentación del asesor

## 1. Identidad

- Nombre oficial: Documentación del asesor
- Código: M02
- Estado: parcial / en desarrollo
- Responsable operativo: Asesor
- Roles usuarios: ASESOR; coordinación y revisión quedan sujetos a matriz aprobada
- Arquitectura móvil activa: el formulario individual delega reglas puras, carga documental y los
  siete pasos a componentes tipados. El coordinador conserva recuperación, estado, autoguardado,
  navegación y visores; esta separación no cambia el orden ni los requisitos de los pasos.

## 2. Objetivo y resultado observable

- Problema que resuelve: completar solicitudes y evidencias sin confundir captura local con respaldo institucional.
- Resultado esperado: cada documento obligatorio queda marcado como sincronizado solo cuando la API confirma archivo y referencia persistida.
- Indicadores de éxito: compilación móvil limpia, carga autenticada, tres tipos obligatorios y dos tipos opcionales soportados, comprobante de línea de crédito sin límite de fotos impuesto por la aplicación y error recuperable en la sesión.

## 3. Alcance

### Incluye

- Bandeja de grupos/expedientes limitada al responsable autenticado cuando el rol es `ASESOR`.
- Una excepción individual de permisos no sustituye el rol `ASESOR` ni elimina ese alcance por responsable.
- Registro de `created_by` y `asesora_id` desde el JWT para altas nuevas.
- INE de la integrante, comprobante de domicilio y solicitud firmada como evidencias obligatorias.
- INE de beneficiario y comprobante de línea de crédito como evidencias opcionales; su ausencia nunca bloquea la conclusión de la integrante.
- El comprobante de línea de crédito admite todas las fotografías necesarias dentro de una misma versión documental; los demás tipos conservan su cantidad vigente.
- Captura por cámara o selección desde galería.
- Subida autenticada, validación de contenido, almacenamiento inmutable por versión y actualización de la solicitud.
- Consulta y visualización autenticada de la versión vigente.
- Captura explícita del monto formal en el Paso 6, separada de la referencia prospectiva o del monto autorizado del ciclo anterior.
- Corrección de una integrante devuelta por Verificación mientras el expediente permanece `EN_VERIFICACION`.
- Etiquetas `REVISAR DOCUMENTACIÓN`, `RETIRADA` y `NO APROBADA` en el detalle, con paletas de Verificación, gris y roja respectivamente.
- Edad visible en las tarjetas de integrantes; únicamente una edad mayor de 70 años se destaca mediante una burbuja amarilla.
- Encabezado persistente de la solicitud individual con el crédito autorizado del ciclo anterior y el monto solicitado formal, visible durante sus siete pasos.

### No incluye

- Reconciliación de los 578 expedientes históricos que actualmente no tienen `asesora_id`.
- Alcance completo por responsable en rutas directas de expedientes, integrantes, solicitudes y documentos, ni alcance por sucursal/zona.
- Cola offline durable, reintentos después de cerrar la aplicación o reconciliación de conflictos.
- Aceptación, observación o dictamen de documentos por VERIFICADOR.
- Catálogo parametrizable de tipos documentales.
- Borrado de evidencias o administración de permisos.

## 4. Flujo operativo

1. El asesor abre los documentos de una integrante.
2. La aplicación bloquea edición y navegación mientras recupera la solicitud completa, y muestra un error con reintento si la lectura falla.
3. La aplicación consulta la solicitud y prioriza documentos obligatorios pendientes.
4. El asesor captura o selecciona las imágenes: una o dos según el documento y sin límite de cantidad impuesto por la aplicación para el comprobante de línea de crédito.
5. La aplicación muestra `Subiendo` y envía multipart con JWT.
6. La API valida tipo, tamaño, integrante y permiso; escribe una versión inmutable.
7. La API actualiza ruta y fecha en `solicitudes_documentos`.
8. Solo después de ambas confirmaciones la aplicación muestra `Sincronizado`.
9. Ante error se conserva la selección durante la sesión y permite verla o elegir nuevamente el archivo.
10. Si encuentra referencias locales creadas por la versión anterior, intenta completar su subida al servidor una por una; nunca las presenta como sincronizadas antes de la confirmación.
11. En el Paso 6, el encabezado muestra `Monto ciclo anterior` para renovaciones o `Monto solicitado` para grupos nuevos. La API entrega una referencia única: en renovación sólo acepta el autorizado anterior y nunca el prospectivo de persona. El campo formal inicia vacío hasta que el asesor lo captura y su confirmación queda persistida.
12. El monto formal se compara con el límite vigente de `productos_credito`: la aplicación lo valida antes de guardar y la API rechaza cualquier exceso. En renovaciones, el encabezado muestra la diferencia mediante `↑ $importe` verde cuando la nueva solicitud aumenta y `↓ $importe` roja cuando disminuye frente al autorizado anterior.
13. Desde el ciclo 2, el detalle muestra un comparativo grupal compacto: integrantes y monto prestado del ciclo anterior frente a integrantes completas 7/7 y monto documentado del expediente actual. La línea `Diferencia` se actualiza con la captura confirmada.
14. Si Verificación devuelve una integrante, el detalle muestra `REVISAR DOCUMENTACIÓN` y permite abrir únicamente esa captura aunque el expediente continúe `EN_VERIFICACION`.
15. Al concluir nuevamente los siete pasos, la API devuelve la integrante a `SUJETA_CREDITO`; la etiqueta desaparece automáticamente en Documentación y Verificación.

## 5. Entidades y datos

| Entidad/campo | Origen | Obligatorio | Validación | Historial |
|---|---|---:|---|---:|
| `integrante_id` | Ruta API | Sí | UUID e integrante existente | Sí |
| tipo documental | Ruta API | Según tipo | Tres obligatorios; INE de beneficiario y comprobante de línea de crédito opcionales | Sí |
| archivo | Dispositivo | Sí | JPEG, PNG o PDF; máximo 10 MB por archivo; cantidad ilimitada sólo para comprobante de línea de crédito | Sí |
| campos `doc_*_ruta` | API | Sí para completitud | Ruta confirmada de servidor | Referencia vigente |
| campos `doc_*_fecha` | API | Sí al subir | Fecha del servidor | Referencia vigente |
| `monto_solicitado_confirmado_at` | API | Sí para completar Paso 6 | Fecha generada cuando el asesor captura `monto_solicitado` | Sí |
| `productos_credito.monto_maximo` | Producto del expediente o producto activo | Sí | Límite superior del monto solicitado | Sí |

## 6. Estados y transiciones

| Estado UI | Responsable | Entrada | Salida | Bloqueos |
|---|---|---|---|---|
| Pendiente | Sistema | Sin ruta de servidor | Captura | Bloquea completitud |
| Subiendo | Sistema | Archivo seleccionado | Confirmación/error | Evita doble envío |
| Sincronizado | Sistema | Archivo y BD confirmados | Reemplazo | No bloquea por documento |
| Error | Sistema | Fallo de red/validación | Reintento | Bloquea completitud |
| Opcional | Sistema | Sin INE de beneficiario o comprobante de línea de crédito | Captura | No bloquea completitud |
| Revisar documentación | Verificación / Documentación | Integrante `DOCUMENTANDO` dentro de expediente `EN_VERIFICACION` | `SUJETA_CREDITO` tras validar los siete pasos | Sólo habilita la corrección de esa integrante |

No se agregan estados oficiales de documento ni expediente en este incremento.

## 7. Pantallas

| Pantalla | Plantilla | Objetivo | Acciones | Componentes oficiales |
|---|---|---|---|---|
| Documentos de integrante | T5 | Resolver evidencias pendientes | Capturar, seleccionar, reintentar, ver, reemplazar | `ScreenContainer`, `AppHeader`, `ScreenTitleBar`, `Card`, botones oficiales |

## 8. API y persistencia

- Endpoint de carga: `POST /solicitudes/integrante/:integranteId/documentos/:tipo`.
- Estado de corrección: `PATCH /integrantes/:integranteId/estado`, limitado a `DOCUMENTANDO` o `SUJETA_CREDITO` por reglas del servicio.
- Metadatos: `GET /solicitudes/integrante/:integranteId/documentos/:tipo/:documentoId`.
- Contenido: `GET /solicitudes/integrante/:integranteId/documentos/:tipo/:documentoId/archivos/:indice`.
- Servicio: almacenamiento documental local configurable mediante `DOCUMENT_STORAGE_PATH`.
- Tablas: `solicitudes` y `solicitudes_documentos`; sin cambio de esquema.
- El límite del Paso 6 proviene del producto asignado al expediente; mientras los expedientes históricos no tengan `producto_id`, se usa el primer producto activo. El valor de contingencia vigente es $100,000 si no existe configuración utilizable.
- Idempotencia: pendiente para la futura cola durable; cada carga confirmada crea una versión nueva.
- Auditoría: el manifiesto conserva usuario, fecha, integrante y tipo; integración transversal con `audit_log` permanece pendiente.

## 9. Reglas de negocio

- RN-003, RN-005, RN-026, RN-029, RN-032 y RN-035.
- La ruta local no completa Paso 7; solo la ruta emitida por la API es válida.
- Reemplazar crea una versión nueva y no borra la anterior.
- Todas las fotos del comprobante de línea de crédito seleccionado se guardan ordenadas dentro de la misma versión y se recorren lateralmente con el carrusel compartido de Verificaciones; tocar una abre el visor opaco de pantalla completa con zoom. Reemplazar el conjunto crea otra versión.
- La completitud exige exclusivamente INE de la integrante, comprobante de domicilio y solicitud firmada sincronizados; INE de beneficiario y comprobante de línea de crédito no participan en ese cálculo.
- El monto precargado es únicamente una referencia. El Paso 6 no queda completo hasta que exista un `monto_solicitado` positivo capturado por el asesor y confirmado por la API; la validación del backend impide avanzar a `SUJETA_CREDITO` sin esa confirmación.
- Las tarjetas de integrantes y el encabezado del formulario dejan vacío el monto formal mientras `monto_solicitado_confirmado_at` sea `NULL`; nunca presentan la precarga histórica como captura del asesor.
- La API rechaza el guardado por encima de `productos_credito.monto_maximo`; la interfaz muestra el error y mantiene bloqueado el avance. Un dato inválido creado antes de esta validación se conserva para auditoría, pero debe corregirse antes de completar el Paso 6.

## 10. Permisos y seguridad

| Acción | Rol | Condición | Auditoría |
|---|---|---|---|
| Leer evidencia | Permiso `solicitudes:leer` | JWT activo | Acceso HTTP; auditoría transversal pendiente |
| Subir/reemplazar | Permiso `solicitudes:actualizar` | JWT activo e integrante existente | Manifiesto de versión |

La bandeja y el detalle de grupos aplican alcance por responsable para `ASESOR`. El alcance continúa pendiente en las rutas directas relacionadas y por sucursal/zona. Los expedientes históricos sin asignación no se adjudican automáticamente.

## 11. Estados técnicos de UI

- Carga: indicador mientras se recupera solicitud.
- Vacío: tres documentos obligatorios pendientes y dos documentos opcionales disponibles.
- Error: mensaje accionable y reintento.
- Sin conexión: se conserva selección solo durante la sesión actual.
- Timeout: las cargas asignan 120 segundos por cada bloque de hasta dos archivos; ante agotarlo, el cliente solicita revisar la conexión/reintentar y conserva el conjunto durante la sesión.
- Sin permiso: respuesta 403 de la API.
- Autoguardado: la carga exitosa actualiza la solicitud sin botón adicional.

## 12. Casos especiales

- Duplicados: cada reenvío confirmado crea versión independiente.
- Datos incompletos: si aún no existe solicitud, el backend la crea con relaciones derivadas al actualizar el documento.
- Reintentos: manuales y únicamente durante la sesión móvil actual.
- Navegación interrumpida: una carga no confirmada no se presenta como sincronizada.
- Concurrencia: la última referencia confirmada queda vigente; las versiones anteriores permanecen almacenadas.
- Compatibilidad: las referencias locales del flujo anterior se recuperan al abrir nuevamente la integrante y se suben secuencialmente para evitar sobrescrituras concurrentes, incluidas las evidencias que ahora son opcionales.
- Hidratación: retroceder o salir no escribe datos hasta terminar la lectura inicial, y cada navegación guarda únicamente el paso visible para no reemplazar otros pasos con valores vacíos.

## 13. Criterios de aceptación

- [x] Ninguna URI local se presenta como documento confirmado.
- [x] Solo se aceptan archivos permitidos dentro del límite configurado.
- [x] La carga exige JWT y permiso de actualización.
- [x] El estado móvil distingue pendiente, subiendo, sincronizado y error.
- [x] Los dos documentos opcionales se aceptan y su ausencia no bloquea la conclusión.
- [x] El comprobante de línea de crédito permite seleccionar o capturar todas las fotos necesarias, previsualizarlas y consultarlas lateralmente, abrir cada una a pantalla completa con zoom y guardarlas como una sola versión, sin ampliar la cantidad de los demás documentos.
- [x] La pantalla no permite navegar sobre un formulario vacío mientras recupera una solicitud existente.
- [x] Guardar o retroceder persiste únicamente los campos del paso visible.
- [x] Reemplazar no elimina la versión previa.
- [x] Renovación muestra el autorizado anterior y grupo nuevo muestra el prospectivo, sin precargar ninguno dentro del campo formal.
- [x] Salir y volver a entrar distingue una referencia precargada de un monto ya capturado.
- [x] Una integrante aún no documentada conserva visible `Crédito anterior` como referencia, alineado a la derecha del avance y arriba de su barra sin aumentar la tarjeta; el renglón `Monto solicitado` permanece sin cantidad hasta la captura formal del Paso 6.
- [x] Cada tarjeta incluye debajo de `Monto solicitado` el renglón `Monto verificado`, inicialmente sin cantidad y sin inferir datos que todavía no hayan sido determinados por verificación.
- [x] Un monto superior al límite del producto no se autoguarda, no permite continuar y es rechazado por la API sin reemplazar el valor persistido.
- [x] En renovación, el indicador del encabezado cambia en vivo a `↑ $diferencia` verde o `↓ $diferencia` roja al comparar la captura con el autorizado anterior.
- [x] Desde el ciclo 2, el resumen grupal identifica ambos ciclos, cuenta como documentadas sólo integrantes completas 7/7, suma sólo sus montos solicitados confirmados y presenta en `Diferencia` tanto la variación de integrantes como la monetaria, sin calificarlas como finales.
- [x] La línea `Diferencia` abrevia visualmente el conteo como `Sra.`/`Sras.` y utiliza una tipografía destacada; el encabezado verde `Integrantes` permanece fijo durante el desplazamiento de las tarjetas.
- [x] Mobile TypeScript, build API y pruebas aplicables pasan.
- [x] Una integrante devuelta conserva `REVISAR DOCUMENTACIÓN` entre sesiones y pierde la etiqueta sólo cuando el servidor confirma otra vez su completitud.
- [x] Cada tarjeta muestra la edad junto al teléfono, prioriza la fecha de nacimiento de la solicitud vigente y usa la fecha de la persona como respaldo; 71 años o más se destacan en amarillo y una fecha ausente no se inventa.
- [x] Los siete pasos individuales mantienen visibles y diferenciados `Crédito anterior` y `Monto solicitado`; los valores ausentes se indican sin sustituirlos por cero y la captura del Paso 6 actualiza el resumen.
- [x] El solicitado usa fondo celeste y texto negro; una flecha verde ascendente o roja descendente muestra también el importe exacto de su diferencia contra el crédito anterior.
- [x] El detalle del expediente y las tarjetas del grupo en Verificación muestran como `DIST. 5.3 KM` la distancia en línea recta entre los domicilios escritos de la integrante y la tesorera; si cualquiera no puede geocodificarse, muestran `DIST. N/D` sin inventar una cifra. Al rebasar el límite operativo, la burbuja cambia a rojo claro con texto y borde rojo oscuro.
- [x] Las lecturas operativas no reutilizan respuestas HTTP `304` obsoletas; el cliente usa encabezados `no-cache` y la API responde `no-store` sin agregar parámetros técnicos que invaliden los DTO de consulta.

## 14. Pruebas

- Unitarias: validación de firma/tamaño/tipo y rutas seguras del almacenamiento.
- Integración: carga autenticada, persistencia de ruta y lectura protegida.
- UI/manuales: cámara, galería, carga, error, reintento, visor y reemplazo.
- Regresión: suite completa API y TypeScript mobile.
- Rutas viales: diferidas hasta la integración formal de mapas. La aproximación vigente transmite al geocodificador del dispositivo únicamente la dirección escrita autorizada y no utiliza la ubicación actual del teléfono.

## 15. Decisiones abiertas

- Proveedor durable de almacenamiento para producción.
- Cola offline, idempotencia entre reinicios y política de conflictos.
- Catálogo parametrizable y versionamiento documental en PostgreSQL.
- Alcance territorial y por responsable.
- Fuente operativa para reconciliar `asesora_id` en los 578 expedientes históricos.
