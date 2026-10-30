# Experiencia web de escritorio

## 1. Identidad

- Nombre oficial: Experiencia web de escritorio
- Código: WEB-DESKTOP
- Estado: en desarrollo
- Responsable operativo: Dirección CRELEALTAD
- Roles usuarios: todos los roles con acceso a la aplicación web

## 2. Objetivo y resultado observable

- Problema que resuelve: la exportación web conserva dimensiones fluidas pensadas para teléfono y estira controles, tarjetas y formularios al ancho completo del monitor.
- Resultado esperado: la misma aplicación conserva su experiencia móvil y, desde 768 px, centra el contenido, limita longitudes de lectura y aprovecha el ancho mediante rejillas progresivas. Desde 1024 px, los formularios largos por pasos muestran navegación del proceso y contenido activo en dos columnas.
- Indicadores de éxito: sin desplazamiento horizontal a 390, 768, 1024 y 1440 px; controles legibles sin estiramiento; listas principales de dos o tres columnas; formularios largos con riel de pasos estable y ancho de lectura controlado.

## 3. Alcance

### Incluye

- Tokens institucionales para breakpoints y anchos máximos.
- Encabezados a todo lo ancho con contenido interno centrado.
- Acceso, menú principal y menú de Documentación adaptables.
- Rejillas adaptables en expedientes y grupos de Verificación.
- Ancho controlado en formularios y detalles activos.
- `StepFlowLayout` compartido para formularios largos y flujos por pasos en escritorio.
- Pruebas de la selección de columnas por breakpoint.

### No incluye

- Cambios de reglas, permisos, estados, API o PostgreSQL.
- Habilitar cámara, ubicación u operación offline en navegador.
- Convertir la aplicación en dos productos o duplicar pantallas por plataforma.
- Rediseñar los componentes institucionales aprobados.

## 4. Flujo operativo

1. La aplicación detecta el ancho disponible.
2. En teléfono conserva una sola columna o la rejilla móvil ya aprobada.
3. En tablet y escritorio limita el ancho de lectura y aumenta columnas sólo en listas aptas.
4. Desde el breakpoint de escritorio, un formulario largo por pasos muestra el proceso a la izquierda y el paso activo a la derecha.
5. Encabezados y barras de módulo conservan color de extremo a extremo.

## 5. Entidades y datos

No cambia entidades, contratos ni persistencia.

## 6. Estados y transiciones

No cambia estados operativos ni transiciones.

## 7. Pantallas

| Pantalla | Plantilla | Objetivo | Adaptación de escritorio |
|---|---|---|---|
| Login | T3 | Autenticación | tarjeta centrada con ancho de formulario |
| Menú principal | T8 | Navegación por módulo | rejilla de 2 a 4 columnas |
| Documentación | T8 | Selección de tarea | una columna móvil y tres en escritorio |
| Mis expedientes | T1 | Continuar expedientes | lista virtualizada de 1 a 3 columnas |
| Grupos en Verificación | T1 | Seleccionar grupo | lista virtualizada de 1 a 3 columnas |
| Formularios cortos | T3 | Captura contenida | tarjeta o ancho máximo legible |
| Formularios largos por pasos | T4/T7 | Captura secuencial | riel de pasos a la izquierda y formulario activo a la derecha |
| Detalles | T2 | Consulta y acciones | ancho máximo amplio centrado |

## 8. API y persistencia

Sin cambios.

## 9. Reglas de negocio

Sin cambios. La adaptación es exclusivamente de composición visual.

## 10. Permisos y seguridad

La web conserva los permisos efectivos y la autorización de API existentes.

## 11. Estados técnicos de UI

Carga, vacío, error, permisos y conectividad conservan los componentes vigentes. La web continúa siendo únicamente en línea según la implementación actual.

## 12. Casos especiales

- El cambio de cantidad de columnas remonta la lista con una clave dependiente del breakpoint.
- Las filas incompletas usan espaciadores no interactivos para evitar tarjetas estiradas.
- Los campos de un formulario largo no se reparten automáticamente entre columnas ni cambian el orden del formato físico. Las dos columnas aprobadas corresponden al riel del proceso y al contenido completo del paso activo.
- El riel informa el paso actual, los concluidos y los pendientes; no habilita saltos que el flujo secuencial no autoriza.
- El modo inmersivo queda reservado para revisar documentos e imágenes con el visor institucional; no envuelve formularios.

## 13. Criterios de aceptación

- [x] El teléfono conserva su composición vigente.
- [x] El login no se estira al ancho del monitor.
- [x] El contenido principal se centra y tiene ancho máximo institucional.
- [x] Menús y listas principales aprovechan columnas adicionales.
- [x] Solicitud presenta sus siete pasos y el formulario activo en dos columnas desde 1024 px.
- [x] La misma Solicitud conserva una sola columna por debajo de 1024 px.
- [ ] Revisión visual autenticada de todos los módulos a 1024 y 1440 px.
- [ ] Prueba operativa con teclado, mouse y zoom del navegador al 200 %.

## 14. Pruebas

- Unitarias: selección de columnas por breakpoint.
- Integración: TypeScript y suite mobile.
- UI/manuales: viewports 390, 768, 1024 y 1440 px.
- Regresión: login y navegación móvil.

## 15. Decisiones abiertas

- La navegación global lateral persistente no se incorpora en esta etapa. El riel contextual de pasos de DEC-263 sí forma parte de T4/T7 y no sustituye la navegación global.
- La operación de cámara, ubicación y archivos desde navegador requiere una fase técnica separada.
