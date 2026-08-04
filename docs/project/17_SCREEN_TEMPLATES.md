# 17 SCREEN TEMPLATES — CRELEALTAD CORE

Versión: 1.0.0  
Estado: Vigente  
Fecha: 2026-07-31

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

## T5 — Gestión documental

Uso: expedientes y documentos por solicitante.

Debe mostrar categoría, obligatoriedad, estado, fecha, observación y acciones. Reemplazar conserva historial. Las completas pueden colapsarse; los pendientes se priorizan.

## T6 — Selección masiva

Uso: enviar solicitantes, asignar elementos o aplicar acciones múltiples.

Debe usar `MultiSelectField` o patrón oficial: contador, seleccionar todos cuando sea válido, estado indeterminado, aplicar/cancelar, límites, búsqueda cuando crezca y confirmación para acciones sensibles.

## T7 — Flujo por pasos

Uso: procesos guiados con dependencia secuencial.

Debe mostrar paso actual, avance, validación antes de continuar, persistencia por paso y salida segura. No usar pestañas decorativas como sustituto de estado.

## T8 — Dashboard operativo

Uso: inicio o resumen por rol.

Debe priorizar tareas accionables, indicadores compactos y navegación directa. Evitar métricas sin acción o información decorativa.

## Contrato común

Toda plantilla debe contemplar: carga, vacío, error, permisos, conectividad, actualización, accesibilidad, teclado, safe area y acción de regreso. Los componentes y medidas exactas se rigen por `16_UI_COMPONENT_STANDARD.md`.
