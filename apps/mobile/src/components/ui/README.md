# UI Components

## Header

A reusable top app bar for module screens.

### Props

- `title: string`
- `userName: string`
- `weekLabel?: string`
- `avatarLabel?: string`
- `logoLabel?: string`
- `onBackPress?: () => void`
- `showBackButton?: boolean`
- `testID?: string`

### Preview

Use `HeaderPreview` to see a simple example in a development environment.

### Design notes

- Keeps the visual pattern aligned with the app shell.
- Uses a simple, high-contrast layout for readability.
- Does not contain business logic.

## ModuleCard

Tarjeta interactiva para el selector principal de módulos.

### Props

- `title: string`
- `description: string`
- `iconLabel: string`
- `moduleTheme: ModuleThemeKey`
- `onPress?: () => void | Promise<void>`
- `disabled?: boolean`
- `statusLabel?: string`
- `style?: StyleProp<ViewStyle>`

### Design notes

- Consume exclusivamente el tema, espaciado, radio, sombra y medidas publicados en `tokens.ts`.
- La tarjeta completa es táctil y expone nombre, descripción y destino a accesibilidad.
- No decide permisos ni navegación; recibe únicamente módulos ya autorizados por la pantalla.
- Las tarjetas deshabilitadas comunican su disponibilidad mediante texto y estado accesible, sin ejecutar navegación.

## TaskMenuButton

Botón-tarjeta compacto para concentradores de tareas o procesos equivalentes.

### Props

- `title: string`
- `iconLabel: string`
- `moduleTheme: ModuleThemeKey`
- `onPress?: () => void | Promise<void>`
- `disabled?: boolean`
- `completed?: boolean`
- `result?: 'positive' | 'negative'`
- `accessibilityHint?: string`

### Design notes

- Presenta acciones pares sin convertir ninguna en un avance primario obligatorio.
- Usa el tema del módulo, la tarjeta base y las medidas táctiles oficiales.
- La tarjeta completa es táctil y el indicador de apertura no sustituye la etiqueta accesible.
- `completed` muestra una palomita de proceso realizado; `result` muestra una palomita verde
  para resultado positivo o una tacha roja para resultado negativo y lo anuncia a accesibilidad.
- No decide orden, estado, permisos ni persistencia; esas responsabilidades pertenecen al flujo que lo usa.

## DocumentImageCarousel

Carrusel de consulta para documentos con más de una imagen, como el frente y reverso de una identificación.

### Props

- `title: string`
- `pages: readonly { uri: string; label: string; headers?: Record<string, string> }[]`
- `moduleTheme?: ModuleThemeKey`

### Design notes

- Permite cambiar de imagen con un gesto horizontal y comunica la cara e índice actuales.
- Tocar una imagen abre un modal opaco de pantalla completa; la aplicación no permanece visible detrás del documento.
- En pantalla completa reutiliza `ZoomableImage`, conserva el gesto lateral al 100 % y captura el arrastre para recorrer la imagen cuando existe zoom.
- Virtualiza tanto la vista previa como la pantalla completa: monta únicamente la fotografía visible y
  sus vecinas para que un conjunto numeroso de imágenes de alta resolución no bloquee la interfaz.
- No decide el orden documental, descarga archivos ni persiste resultados; recibe páginas ya autorizadas y resueltas por la pantalla.

## PrimaryButton y SecondaryButton

Botón de baja jerarquía visual para acciones secundarias.

### Props adicionales

- `tone?: 'default' | 'danger'` (solo `SecondaryButton`)
- `leadingIcon?: React.ReactNode`
- `trailingContent?: React.ReactNode`
- `accessibilityLabel?: string`

### Design notes

- `danger` usa fondo rojo suave, borde y texto rojos para acciones como cerrar sesión.
- `leadingIcon` permite anteponer un icono decorativo con la misma separación en ambos botones, sin sustituir el texto operativo ni su etiqueta accesible.
- `trailingContent` permite añadir un indicador compacto al final; el contenido debe conservar una etiqueta accesible y no depender sólo del color.
- Conserva la altura táctil y el comportamiento accesible del botón secundario base.
- Las acciones asíncronas se ejecutan mediante el controlador global de procesamiento: un segundo
  toque se ignora y la pantalla permanece bloqueada hasta que la promesa concluye.

## ProcessingOverlay

Superficie modal única para comunicar y bloquear una operación en curso.

### Design notes

- `ProcessingProvider` la monta una sola vez en la raíz de la aplicación.
- El cliente HTTP central publica automáticamente `Cargando…` o `Guardando…`.
- `useProcessingAction` protege acciones asíncronas de componentes compartidos y
  `useProcessing().run` cubre ubicación y controles legacy. Los flujos que abren cámara, galería
  u otro modal nativo deben usar un estado ocupado local para no superponer superficies modales.
- Mantiene un conteo de operaciones anidadas o paralelas; no se oculta hasta terminar la última.
- Incluye indicador animado, mensaje visible, anuncio accesible y bloqueo del botón físico de
  regreso mientras continúa el proceso.
- Es una protección de interacción; no reemplaza idempotencia, confirmación del servidor ni
  recuperación offline.

## BottomSheetSelector, ConfirmDialog, BinaryChoiceDialog y BottomActionBar

- `BottomSheetSelector` concentra selecciones contextuales y formularios breves sin definir lógica de negocio.
- `ConfirmDialog` protege acciones finales con una confirmación explícita y estado ocupado.
- `ConfirmDialog.details` presenta datos de confirmación como renglones de etiqueta y valor cuando un párrafo dificultaría su lectura; los valores largos pueden ocupar más de una línea.
- `BinaryChoiceDialog` presenta dos resultados operativos mutuamente excluyentes sin interpretar el cierre del diálogo como una respuesta; `busy` bloquea respuestas repetidas mientras el servidor confirma una operación.
- `BottomActionBar` mantiene una acción primaria y una secundaria alcanzables al pie de pantallas operativas.
- Estos componentes reutilizan exclusivamente tokens y controles oficiales.

## YesNoField

- Campo binario reutilizable para confirmaciones `Sí / No`, `Coincide / No coincide` y etiquetas equivalentes.
- Puede presentar un valor registrado de sólo lectura antes de las opciones, sin convertirlo en campo editable.
- Cada opción tiene área táctil amplia, rol accesible de radio, texto explícito y estado visible sin depender únicamente del color.
- La pantalla entrega la respuesta y el texto operativo; el componente no persiste ni interpreta reglas de avance.

## MonthYearPickerField

- Campo compuesto para respuestas que requieren mes y año sin día específico.
- Abre un solo modal con dos listas desplazables simultáneas y conserva los valores actuales como
  borrador al reabrir.
- Sólo aplica ambos valores mediante `Confirmar selección`; cerrar el modal conserva la respuesta
  anterior.
- Recibe catálogos de meses y años desde la pantalla y no define rangos ni reglas de negocio.
- Puede mostrar un valor derivado opcional a la derecha de la fecha confirmada, sin calcularlo ni
  persistirlo dentro del componente.

## ContextHeader y StickySectionHeader

- `ContextHeader` presenta grupo, integrante, ciclo u otro contexto inmediatamente debajo de la barra de título; admite texto inverso o acento amarillo institucional, y puede mostrar un `trailingText` compacto en el extremo derecho sin desplazar el título centrado. Siempre consume el tema del módulo.
- `StickySectionHeader` mantiene su variante suave y agrega `variant="solid"` para encabezados de sección a todo lo ancho que permanecen visibles durante el desplazamiento; la variante sólida estandariza altura, tipografía y sombra entre pantallas.
- `textTone="withdrawn"` aplica el rojo claro institucional con contraste legible sobre verde; `fullBleed` permite extender el renglón dentro de contenedores con relleno horizontal.
- Ninguno contiene lógica de negocio ni colores definidos por la pantalla.

## SummaryMetricsBar

- Presenta dos indicadores operativos con valores grandes y etiquetas compactas, usando el color primario del módulo.
- Se coloca fuera del contenedor desplazable cuando los indicadores deben permanecer visibles durante el scroll; recibe valores ya calculados y no contiene reglas de negocio.

## RequiredSelectionBar y SingleSelectOption

- `RequiredSelectionBar` mantiene visible una asignación obligatoria, su valor actual y la acción `Seleccionar` o `Cambiar`; recibe la información ya validada y no persiste reglas de negocio.
- `SingleSelectOption` representa una candidata mediante radio accesible, etiqueta y descripción dentro de un selector de hoja inferior.
- En conjunto permiten seleccionar un único rol operativo sin depender sólo del color; la marca breve siempre se acompaña de su nombre completo.
- La tesorera usa el círculo amarillo `T` junto con la etiqueta explícita `TESORERA`.
- La marca interior no aumenta la altura exterior del badge; `TESORERA` y estados como `COMPLETA` conservan la misma medida y alineación.

## StatusStripe y StatusCard

Franja vertical semántica para tarjetas operativas de expediente, integrante y otras entidades.

### Props

- `StatusStripe`: `status: StatusKey`, `narrow?: boolean`
- `StatusCard`: `status: StatusKey`, `children: ReactNode`, `compact?: boolean`, `narrowStripe?: boolean`, `style?: StyleProp<ViewStyle>`
- `StatusTab`: `status: StatusKey`, `accessibilityLabel?: string`, `flushLeft?: boolean`

### Design notes

- La franja siempre ocupa el borde izquierdo; admite una variante gris neutra sin texto cuando no comunica un estado.
- `newGroup` muestra `NUEVO` verticalmente para distinguir los expedientes de ciclo 1.
- `newMember` muestra `NUEVO` en negro sobre gris claro cuando la API confirma que la persona no tiene historial interno previo.
- `StatusTab` presenta una segunda señal semántica como pestaña de folder sobre una tarjeta; permite conservar `NUEVO` cuando la franja lateral comunica otra incidencia prioritaria.
- `needsDocumentation` muestra `REVISAR DOC…` con los colores del módulo Verificación cuando se devuelve una integrante para corregir evidencias; desaparece al concluir nuevamente su documentación.
- `needsDocumentationGroup` muestra `REVISAR` cuando al menos una integrante del expediente requiere corrección documental.
- `rejected` muestra `NO APROBADA` con la paleta roja institucional.
- Recibe una clave de estado; las pantallas no envían colores ni textos arbitrarios.
- `StatusCard` compone la tarjeta base, la franja y el espacio seguro para el contenido.
- La variante `compact` elimina el alto mínimo y reduce únicamente el relleno vertical; se usa cuando la etiqueta es corta o está vacía.
- El catálogo visual único vive en `statusColors` dentro de `theme/tokens.ts`.

## IntegranteCard

Tarjeta operativa compartida para integrantes en Documentación y Verificación.

- Presenta nombre, posición, avance de siete pasos, crédito anterior, teléfono, edad, monto solicitado y monto verificado.
- La edad comparte el renglón del teléfono y se presenta sin la etiqueta `Edad`, en una burbuja gris clara con el formato `44 AÑOS`; cuando supera los 70 años, la burbuja cambia a amarillo y, si no existe fecha de nacimiento, muestra un guion sin inferir el dato.
- Muestra una burbuja celeste como `DIST. 5.3 KM`, calculada en línea recta entre los domicilios geocodificados de la integrante y la tesorera; si falta cualquiera de las dos ubicaciones, muestra `DIST. N/D` sin inventar una cifra. Cuando supera el límite operativo, usa fondo rojo claro con texto y borde rojo oscuro.
- Consume `StatusCard` para la franja lateral semántica y mantiene la tarjeta completa como objetivo táctil.
- `isNewMember` recupera la franja vertical `NUEVO` cuando no existe otra incidencia; si la franja ya comunica una incidencia prioritaria, agrega la pestaña superior sin ocultar ninguna señal.
- Recibe datos y estado ya resueltos por la pantalla; no calcula reglas de completitud ni dictámenes.
- Admite una nota monetaria tipada para comparar montos sin permitir colores arbitrarios desde la pantalla.
- `roleLabel` y `roleMark` identifican un rol especial mediante el `StatusBadge` compartido; no alteran el estado de la integrante.

## CreditAmountsSummary

Resumen compacto compartido por los encabezados individuales de Documentación y Verificación.

- Presenta por separado `Crédito anterior` y `Monto solicitado`.
- Un valor ausente se comunica como `Sin registro` o `Sin capturar`, sin sustituirlo por cero.
- El solicitado usa el mismo fondo celeste del teléfono y conserva su importe en negro.
- Compara ambos importes para mostrar la diferencia alineada a la derecha como `↑ $ importe` verde cuando aumenta o `↓ $ importe` roja cuando disminuye; sin crédito anterior o sin variación no muestra indicador.


## CreditHistorySummary

Resumen de sólo lectura para el historial individual confirmado con CRELEALTAD.

- Presenta el monto máximo y el mínimo junto con el ciclo o los ciclos en los que se registraron.
- Lista como máximo los cinco ciclos más recientes, del más reciente al más antiguo, con su monto autorizado.
- Recibe el historial ya deduplicado y ordenado por la API; no infiere montos, ciclos ni fechas.
- La franja verde identifica el historial interno de CRELEALTAD y no sustituye un estado operativo.
- La pantalla consumidora lo oculta cuando no existe historial interno confirmado o el resumen no contiene ciclos utilizables.
