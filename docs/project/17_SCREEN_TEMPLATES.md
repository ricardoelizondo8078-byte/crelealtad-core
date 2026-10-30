# 17 SCREEN TEMPLATES — CRELEALTAD CORE

Versión: 1.1.0
Estado: Vigente  
Fecha: 2026-10-30

## Regla general

Toda pantalla debe declararse como uno de estos tipos antes de programarse. Si no encaja, se propone una ampliación de plantilla; no se improvisa una estructura local.

## T1 — Lista operativa

Uso: grupos, expedientes, solicitantes, tareas o resultados.

Orden: `AppHeader` → `ScreenTitleBar` → búsqueda/filtros → resumen opcional → `FlatList` → estado vacío/error → acción flotante o inferior cuando aplique.

No usar `ScrollView` con `.map()` para listas que puedan crecer.

## T2 — Detalle de entidad

Uso: expediente, grupo, solicitante, crédito.

Orden: encabezados → `ContextHeader` → resumen/KPI → secciones o tarjetas → acciones contextuales. Scroll vertical único. Las listas internas grandes se separan o virtualizan.

## T3 — Formulario corto

Uso: alta o edición con pocas secciones.

Orden: encabezados → contenido → campos compartidos → validación inline → acción primaria. El teclado no debe ocultar el campo activo ni las acciones.

## T4 — Formulario largo seccionado

Uso: solicitud individual y capturas extensas.

Debe dividirse en componentes de sección y hooks/servicios. Incluye progreso, autoguardado visible, navegación de secciones y resumen de errores. No concentrar lógica, API, estilos y todas las secciones en un solo archivo.

### Composición responsive aprobada

- En escritorio, la presentación predeterminada es de dos columnas: una columna lateral estable
  muestra los pasos del flujo y la columna principal contiene exclusivamente el formulario del paso
  activo.
- La columna de pasos identifica el paso actual, los pasos concluidos y los pendientes sin obligar a
  regresar a otra pantalla. No sustituye la validación secuencial ni autoriza saltar reglas del flujo.
- La columna principal conserva progreso, autoguardado, validación inline y las acciones
  `Atrás` / `Continuar` del paso vigente. Se evita duplicar acciones entre ambas columnas.
- En móvil se conserva la composición vigente de una sola columna y sus pantallas propias. La regla
  de escritorio no autoriza comprimir ambas columnas dentro del ancho de un teléfono ni sustituir el
  flujo móvil por un modal.
- El modal centrado se reserva para tareas breves y contenidas; no es la presentación predeterminada
  de un formulario largo por pasos en escritorio.

## T5 — Gestión documental

Uso: expedientes y documentos por solicitante.

Debe mostrar categoría, obligatoriedad, estado, fecha, observación y acciones. Reemplazar conserva historial. Las completas pueden colapsarse; los pendientes se priorizan.

Cuando la tarea principal sea revisar una imagen o documento en detalle, se abre el visor
institucional inmersivo definido por `DocumentViewer`. El modo inmersivo no se usa para captura de
formularios ni como envolvente genérica de pantallas: se limita a contenido que necesita el máximo
espacio visual, zoom, desplazamiento o comparación entre caras.

## T6 — Selección masiva

Uso: enviar solicitantes, asignar elementos o aplicar acciones múltiples.

Debe usar `MultiSelectField` o patrón oficial: contador, seleccionar todos cuando sea válido, estado indeterminado, aplicar/cancelar, límites, búsqueda cuando crezca y confirmación para acciones sensibles.

## T7 — Flujo por pasos

Uso: procesos guiados con dependencia secuencial.

Debe mostrar paso actual, avance, validación antes de continuar, persistencia por paso y salida segura. No usar pestañas decorativas como sustituto de estado.

En escritorio, un flujo por pasos que también sea formulario largo adopta la composición de dos
columnas definida en T4. En móvil conserva el recorrido de una sola columna. Si un paso abre una
evidencia documental, sólo ese visor puede pasar temporalmente al modo inmersivo.

## T8 — Dashboard operativo

Uso: inicio o resumen por rol.

Debe priorizar tareas accionables, indicadores compactos y navegación directa. Evitar métricas sin acción o información decorativa.

## Contrato común

Toda plantilla debe contemplar: carga, vacío, error, permisos, conectividad, actualización, accesibilidad, teclado, safe area y acción de regreso. Los componentes y medidas exactas se rigen por `16_UI_COMPONENT_STANDARD.md`.
