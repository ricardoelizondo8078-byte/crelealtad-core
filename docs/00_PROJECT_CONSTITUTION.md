# CRELEALTAD CORE
# 00_PROJECT_CONSTITUTION.md

Versión: 1.1.0  
Estado: Autoridad Máxima Vigente  
Fecha efectiva: 2026-07-09  
Ámbito: Producto, Operación, UX, Arquitectura, Datos, Desarrollo, IA y Gobierno Técnico  

---

# Cláusula de Autoridad

Este documento define la constitución oficial de CRELEALTAD CORE.

Todo cambio técnico, funcional, de UX, de datos, de flujo operativo, de automatización y de soporte asistido por IA deberá ser evaluado contra esta constitución antes de implementarse.

Si existe conflicto entre este documento y cualquier otro artefacto, aplica el siguiente orden jerárquico:

1. Constitución del proyecto (este documento).
2. Reglas de negocio aprobadas.
3. Decisiones de arquitectura y diseño de datos.
4. UX y Design System.
5. Implementación de código vigente.

Ningún criterio de conveniencia técnica, velocidad de entrega o preferencia de ingeniería puede invalidar un principio inmutable definido aquí.

Esta constitución también prevalece sobre:

- Especificaciones parciales no ratificadas.
- Bocetos de interfaz no aprobados.
- Suposiciones de asistentes de IA.
- Defaults de frameworks, librerías o plantillas generadas.
- Simplificaciones temporales de MVP que contradigan el modelo operativo objetivo.

Cuando exista ambigüedad, la interpretación válida será la que mejor preserve simultáneamente:

- La operación real de CRELEALTAD.
- La trazabilidad histórica.
- La automatización de reglas.
- La seguridad de evolución futura.

---

# Índice Maestro

1. Propósito del sistema.
2. Visión del producto.
3. Filosofía de operación.
4. Principios inmutables.
5. Flujo operativo completo del crédito grupal.
6. Ciclo de vida del grupo.
7. Ciclo de vida del expediente.
8. Ciclo de vida de la solicitud.
9. Estados válidos de todas las entidades.
10. Reglas de negocio.
11. Arquitectura del sistema.
12. Principios de diseño UX.
13. Principios de base de datos.
14. Convenciones de desarrollo.
15. Reglas para IA.
16. Reglas para Codex.
17. Checklist obligatorio antes de cualquier cambio.
18. Lista DO NOT BREAK.
19. Glosario.
20. Referencias cruzadas.

---

# 1) Propósito del sistema

## 1.1 Propósito central

CRELEALTAD CORE existe para administrar de forma integral, consistente y trazable el ciclo operativo del crédito grupal de CRELEALTAD, desde la documentación previa al desembolso hasta el historial operativo que sostiene seguimiento, cobranza y evolución de ciclos.

## 1.2 Propósito operativo

El sistema debe:

- Adaptarse a la operación real de CRELEALTAD.
- Reducir tiempo operativo de asesoras en campo.
- Reducir errores de captura y omisiones documentales.
- Determinar automáticamente estados y pendientes críticos.
- Preservar historial documental y de decisiones.
- Evitar dependencia de memoria del usuario.
- Permitir continuidad operativa con conectividad variable.

## 1.3 Propósito de negocio

La plataforma sostiene continuidad, gobernanza y crecimiento institucional bajo estos objetivos:

- Estandarizar la ejecución del crédito grupal.
- Disminuir riesgo por expedientes incompletos o inconsistentes.
- Mejorar la preparación para verificación, análisis y desembolso.
- Incrementar trazabilidad para auditoría interna y externa.
- Habilitar escalabilidad modular a largo plazo sin reescritura total.

## 1.4 Propósito tecnológico

La tecnología es un medio, no un fin. Toda decisión técnica debe validar:

- Alineación con operación real.
- Capacidad de configuración por parámetros.
- Evolución incremental segura.
- Mantenibilidad a largo plazo.
- Trazabilidad de cambios.

---

# 2) Visión del producto

## 2.1 Visión estratégica

CRELEALTAD CORE será una plataforma modular de misión crítica capaz de orquestar todo el ciclo de crédito grupal con una sola fuente de verdad funcional, operativa y de datos.

## 2.2 Visión funcional

El producto evolucionará por módulos conectados por un núcleo de reglas:

- Login y control de acceso.
- Documentación.
- Verificación.
- Análisis.
- Desembolsos.
- Cobranza.
- Recolección.
- Mora.
- Convenios.
- Reportes.
- Parámetros.
- Administración.

## 2.3 Visión de experiencia

La asesora debe sentir que el sistema le indica con claridad:

- Qué hacer ahora.
- Qué falta para avanzar.
- Qué bloquea un paso.
- Qué puede resolverse después.

La interfaz no es catálogo de funciones; es guía operativa de trabajo en campo.

## 2.4 Visión de evolución

La plataforma debe crecer sin romper continuidad. Se prioriza:

- Reutilización de componentes.
- Reglas configurables.
- Trazabilidad de decisiones.
- Compatibilidad hacia atrás en procesos críticos.

---

# 3) Filosofía de operación

## 3.1 Postulado principal

La operación manda.

CRELEALTAD no cambia su forma de trabajar para acomodarse al software. El software cambia para representar correctamente la operación.

## 3.2 Filosofía de documentación

- Las asesoras administran expedientes, no estructuras técnicas.
- La captura puede suceder en momentos distintos.
- El sistema debe recordar pendientes por solicitante y expediente.
- El sistema debe ordenar la atención por faltantes de mayor impacto.

## 3.3 Filosofía de expediente

- El expediente existe antes del desembolso.
- El expediente no desaparece después del desembolso.
- El expediente es registro histórico permanente.
- Grupo y crédito nacen como consecuencia del desembolso autorizado.

## 3.4 Filosofía de solicitante

- La solicitante no se marca manualmente como completa.
- El sistema determina completitud según reglas y documentos requeridos.
- Solicitud física y captura digital son obligatorias para completitud cuando aplique.

## 3.5 Filosofía de estados

- El usuario no mueve estados oficiales manualmente.
- El estado es resultado de eventos y reglas.
- El sistema explica por qué un estado cambió o no cambió.

## 3.6 Filosofía documental

- Los documentos se administran por tipo documental, no por álbum de imágenes.
- No se elimina historial documental.
- Reemplazo implica nueva versión, nunca borrado destructivo.

---

# 4) Principios inmutables

Los siguientes principios son no negociables.

## 4.1 Principio I: La operación manda

Nunca se cambia el proceso real para simplificar programación.

## 4.2 Principio II: Automatización por defecto

El sistema calcula automáticamente:

- Estado de solicitante.
- Estado de expediente.
- Tipo de clienta según historial.
- Pendientes de documentación.
- Elegibilidad de avance.
- Sugerencia de monto.

## 4.3 Principio III: Configuración sobre hardcode

Políticas críticas deben vivir en parámetros y reglas configurables:

- Integrantes mínimas y máximas.
- Documentos requeridos.
- Referencias requeridas.
- Fotografías requeridas.
- Monto inicial.
- Igualación e incremento por historial.
- Refinanciamiento y porcentaje mínimo pagado.

## 4.4 Principio IV: Guardado automático

La captura operativa no depende de botones de guardado. El sistema conserva progreso de forma automática.

## 4.5 Principio V: Historial inviolable

No se borra evidencia histórica relevante de expedientes, documentos, cambios de estado ni eventos clave.

## 4.6 Principio VI: UX de campo

Diseño para asesoras en campo:

- Alta legibilidad.
- Poco texto.
- Acciones claras.
- Botones amplios.
- Uso con una sola mano.

## 4.7 Principio VII: Consistencia sistémica

Los módulos deben sentirse parte de un mismo producto. No se permiten patrones visuales aislados.

## 4.8 Principio VIII: Trazabilidad de decisión

Todo cambio de estado y validación crítica debe ser explicable y auditable.

## 4.9 Principio IX: Mínima fricción operativa

La interfaz prioriza resolver trabajo, no mostrar datos por mostrar.

## 4.10 Principio X: Seguridad evolutiva

Cambios deben preservar compatibilidad de procesos críticos y continuidad operativa.

---

# 5) Flujo operativo completo del crédito grupal

## 5.1 Visión general end-to-end

El flujo operativo canónico del crédito grupal se compone de macrofases:

1. Preparación y entrada al módulo de documentación.
2. Alta de grupo nuevo o renovación.
3. Creación/apertura de expediente.
4. Alta de solicitantes en expediente.
5. Captura de solicitud individual por solicitante.
6. Captura y validación documental por solicitante.
7. Determinación automática de completitud.
8. Evaluación de elegibilidad para enviar a verificación.
9. Verificación: aprobación, observación o rechazo.
10. Análisis (cuando aplique).
11. Autorización.
12. Validación de regla de refinanciamiento (80% configurable).
13. Preparación de desembolso.
14. Registro de desembolso.
15. Nacimiento de grupo/ciclo de crédito operativo.
16. Conservación histórica del expediente.

## 5.2 Fase A: Entrada a documentación

Objetivo: posicionar a la asesora en una decisión clara de trabajo.

Acciones permitidas principales:

- Renovación.
- Grupo nuevo.
- Mis expedientes.

Restricciones:

- No agregar accesos que distraigan de la tarea operativa.
- No saturar con indicadores no accionables.

## 5.3 Fase B: Alta de grupo y apertura de expediente

En grupo nuevo:

- Se registra identidad operativa de grupo.
- Se crea expediente asociado para iniciar documentación.

En renovación:

- Se inicia nuevo expediente de ciclo siguiente condicionado por reglas de negocio.

## 5.4 Fase C: Gestión de solicitantes

Por expediente:

- Se agregan solicitantes.
- Se conserva conteo por estado de solicitante.
- Se identifica avance real por faltantes.

Indicadores mínimos de control:

- Solicitantes.
- Completas.
- Pendientes.
- Retiradas.

## 5.5 Fase D: Captura de solicitud individual

Para cada solicitante:

- Captura estructurada según orden de solicitud física.
- Validaciones de formato y obligatoriedad.
- Captura de referencias, domicilio, negocio y validaciones finales.

Regla crítica:

- Solicitud física anexada sin captura digital no completa solicitante.

## 5.6 Fase E: Captura documental

Documento por documento:

- Estado inicial pendiente.
- Evidencia capturada cambia estado según regla documental.
- Documentos requeridos bloquean completitud si faltan.
- Documentos opcionales no bloquean pero influyen evaluación.

## 5.7 Fase F: Completitud automática

Una solicitante se considera completa únicamente cuando:

- Solicitud individual requerida está capturada.
- Documentos requeridos están en estado aceptable para completitud.

El sistema calcula este estado automáticamente.

## 5.8 Fase G: Expediente listo para verificación

Condiciones mínimas:

- No pendientes obligatorios críticos.
- Número de completas mayor o igual al mínimo parametrizado.

Al cumplir condición:

- Expediente puede transitar a listo para verificar/en verificación según evento.

## 5.9 Fase H: Verificación

Resultados posibles:

- Aprobación.
- Regreso con observaciones.
- Rechazo.

Efecto:

- Actualización de estado de expediente.
- Registro de observaciones y trazabilidad de decisión.

## 5.10 Fase I: Autorización y predesembolso

Cuando expediente se autoriza:

- Puede requerir validación de pago mínimo de ciclo previo para refinanciamiento.
- Regla de 80% es valor actual configurable.

## 5.11 Fase J: Desembolso y posterioridad

Con desembolso registrado:

- Se consolida evento operativo de crédito.
- Se mantiene expediente como historial.
- Se habilitan procesos aguas abajo (ciclo/cobranza/reportes).

---

# 6) Ciclo de vida del grupo

## 6.1 Definición

Grupo es la unidad solidaria que sostiene relación operativa del crédito.

## 6.2 Etapas de grupo

1. Propuesto.
2. En integración documental.
3. En evaluación.
4. Elegible para desembolso.
5. Activo con crédito vigente.
6. En renovación potencial.
7. Cerrado o inactivo.

## 6.3 Reglas de transición

- Un grupo nuevo inicia en integración documental al crearse expediente.
- Un grupo no se considera activo financiero sin desembolso registrado.
- Renovación no elimina ni sobreescribe historial previo.

## 6.4 Eventos relevantes

- Alta inicial.
- Asociación de expediente.
- Autorización de expediente.
- Desembolso.
- Cierre de ciclo.
- Inicio de ciclo siguiente.

## 6.5 Controles mínimos

- Trazabilidad de asesoría responsable.
- Historial de expedientes por ciclo.
- Relación con créditos y pagos.

---

# 7) Ciclo de vida del expediente

## 7.1 Naturaleza

Expediente es el contenedor operativo y documental del proceso previo al desembolso y el registro histórico posterior.

## 7.2 Estados oficiales canónicos del expediente

Estados definidos como base oficial de negocio:

1. En documentación.
2. Con observaciones.
3. Listo para verificar.
4. En verificación.
5. Verificado.
6. En análisis.
7. Autorizado.
8. Esperando 80%.
9. Listo para desembolso.
10. Desembolsado.
11. Cancelado.
12. Rechazado.

## 7.3 Reglas de evolución

- El expediente no cambia estado por selección manual directa.
- Transiciones dependen de eventos y validaciones.
- El sistema debe impedir saltos inválidos.

## 7.4 Matriz de transición de referencia

- En documentación -> Listo para verificar: cuando cumple mínimos configurados y sin bloqueantes.
- En documentación -> Con observaciones: cuando verificación previa devuelve pendiente.
- Listo para verificar -> En verificación: al enviar a verificación.
- En verificación -> Verificado: revisión favorable.
- En verificación -> Con observaciones: revisión con requerimientos.
- En verificación -> Rechazado: rechazo definitivo.
- Verificado -> En análisis: cuando proceso contempla módulo de análisis.
- En análisis -> Autorizado: dictamen favorable.
- Autorizado -> Esperando 80%: renovación sin porcentaje mínimo pagado.
- Autorizado -> Listo para desembolso: cuando cumple condiciones de desembolso.
- Esperando 80% -> Listo para desembolso: al cumplir porcentaje configurado.
- Listo para desembolso -> Desembolsado: registro de desembolso.
- Cualquier estado habilitado por política -> Cancelado: cancelación autorizada.

## 7.5 Estado como contrato funcional

Cada estado debe tener:

- Definición operativa.
- Responsable principal.
- Criterio de entrada.
- Criterio de salida.
- Evidencia mínima asociada.

---

# 8) Ciclo de vida de la solicitud

## 8.1 Definición

Solicitud es el registro estructurado de información individual de una solicitante dentro de un expediente.

## 8.2 Componentes funcionales de la solicitud individual

Estructura canónica de captura:

- Información personal.
- Domicilio particular.
- Referencias.
- Datos de pareja (cuando aplique).
- Datos del negocio o trabajo.
- Beneficiario.
- Validaciones finales.

## 8.3 Reglas de calidad de captura

- Orden de captura refleja formato operativo físico.
- Validaciones de campos obligatorios en tiempo de captura.
- Validaciones de formato de fecha, CURP, teléfonos y código postal.
- Cálculos automáticos (ejemplo: total de negocio).
- Restricciones semánticas (ejemplo: estado de nacimiento según nacionalidad).

## 8.4 Estados funcionales de solicitud

Para operación y evaluación:

1. No iniciada.
2. En captura.
3. Incompleta con errores.
4. Capturada válida.
5. Observada para corrección.
6. Reemplazada por versión posterior.
7. Cerrada por resolución de expediente.

## 8.5 Acoplamiento con documentación

La solicitud individual no sustituye documentos. La completitud de solicitante depende de ambos frentes:

- Solicitud capturada.
- Documentación requerida en estado válido.

---

# 9) Estados válidos de todas las entidades

Esta sección define el catálogo canónico de estados y su semántica operativa. Cuando exista estado técnico auxiliar, no podrá contradecir ni ocultar estado oficial.

## 9.1 Persona

Estados válidos:

- Activa.
- Inactiva.
- Bloqueada.
- Depurada lógica (soft delete).

## 9.2 Usuario

Estados válidos:

- Activo.
- Inactivo.
- Suspendido.
- Bloqueado.

## 9.3 Rol

Estados válidos:

- Activo.
- Inactivo.

## 9.4 Parámetro

Estados válidos:

- Activo.
- Inactivo.
- Vigencia futura.
- Expirado.

## 9.5 Regla

Estados válidos:

- Activa.
- Inactiva.
- En prueba controlada.
- Retirada.

## 9.6 Producto

Estados válidos:

- Activo.
- Inactivo.
- Suspendido.

## 9.7 Grupo

Estados válidos:

- Propuesto.
- En documentación.
- En evaluación.
- Activo.
- En renovación.
- Cerrado.

## 9.8 Expediente

Estados válidos oficiales:

- En documentación.
- Con observaciones.
- Listo para verificar.
- En verificación.
- Verificado.
- En análisis.
- Autorizado.
- Esperando 80%.
- Listo para desembolso.
- Desembolsado.
- Cancelado.
- Rechazado.

## 9.9 Solicitante

Estados válidos oficiales:

- Pendiente.
- Completa.
- Retirada.
- Rechazada.

## 9.10 Solicitud

Estados válidos:

- No iniciada.
- En captura.
- Incompleta.
- Capturada.
- Observada.
- Reemplazada.
- Cerrada.

## 9.11 Documento

Estados válidos oficiales:

- Pendiente.
- Capturado.
- Observado.
- Aceptado.
- Reemplazado.
- Vencido.

## 9.12 Crédito

Estados válidos:

- Borrador.
- Preparado para desembolso.
- Desembolsado.
- Vigente.
- Vencido.
- Liquidado.
- Reestructurado.
- Cancelado.

## 9.13 Ciclo

Estados válidos:

- Planeado.
- Activo.
- En cierre.
- Cerrado.

## 9.14 Desembolso

Estados válidos:

- Pendiente.
- Programado.
- Ejecutado.
- Cancelado.
- Reversado (solo por política excepcional auditada).

## 9.15 Pago

Estados válidos:

- Pendiente.
- Aplicado.
- Parcial.
- Vencido.
- Reversado.

## 9.16 Política de normalización de estados

- Los estados visibles al usuario siguen vocabulario operativo.
- Los estados técnicos internos se mapean 1 a 1 o n a 1 sin ambigüedad.
- Ningún estado técnico puede impedir trazabilidad del estado oficial.

---

# 10) Reglas de negocio

## 10.1 Marco normativo

Esta sección consolida reglas base aprobadas y las expresa como contratos operativos obligatorios.

## 10.2 Reglas nucleares

RN-001. El sistema se adapta a la operación real de CRELEALTAD.  
RN-002. El sistema usa lenguaje operativo, no jerga técnica.  
RN-003. Completitud de solicitante se determina automáticamente.  
RN-004. Estado de expediente cambia por reglas y eventos, no por edición manual.  
RN-005. Captura con guardado automático en formularios operativos.  
RN-006. El expediente existe antes del desembolso.  
RN-007. Grupo y crédito emergen con desembolso.  
RN-008. El expediente permanece como historial y no se elimina.  
RN-009. Estados de solicitante: Pendiente, Completa, Retirada, Rechazada.  
RN-010. Avance de expediente con KPIs de solicitantes.  
RN-011. No usar “integrantes activas” en UI; usar catálogo oficial.  
RN-012. Retirada no bloquea avance pero permanece en historial.  
RN-013. Envío a verificación condicionado a mínimos y faltantes.  
RN-014. Mínimos no hardcodeados; vienen de parámetros.  
RN-015. Documentación puede iniciar aun con ciclo anterior vigente.  
RN-016. Refinanciamiento exige porcentaje mínimo pagado configurable.  
RN-017. Valor de referencia actual 80%, configurable.  
RN-018. Convivencia de ciclo vigente y expediente nuevo simultáneo permitida.  
RN-019. Tipo de clienta se determina automáticamente.  
RN-020. Si persona existe, consultar historial interno.  
RN-021. Sin historial interno/externo, aplica monto inicial parametrizado.  
RN-022. Comprobante externo es opcional.  
RN-023. Con comprobante externo, aplicar reglas de igualación/incremento parametrizadas.  
RN-024. Monto sugerido lo calcula el sistema.  
RN-025. Monto solicitado capturable por asesora, validado por reglas.  
RN-026. Solicitud física firmada es documento del expediente de solicitante.  
RN-027. Además de anexo físico, captura digital obligatoria de datos de solicitud.  
RN-028. Sin captura digital, solicitante no queda completa aunque haya anexo físico.  
RN-029. Documentos por categorías: Identidad, Domicilio, Crédito, Evidencias.  
RN-030. Documentos obligatorios bloquean completitud.  
RN-031. Opcionales no bloquean, pero pueden influir en evaluación.  
RN-032. No eliminación física de documentos del historial.  
RN-033. Reemplazo documental conserva versión anterior.  
RN-034. Todo documento guarda metadatos obligatorios (tipo, versión, estado, fecha, usuario, entidad, observaciones).  
RN-035. Estados documentales oficiales definidos.  
RN-036. El sistema indica faltantes por expediente y solicitante.  
RN-037. La vista prioriza pendientes sobre completos.  
RN-038. Completas pueden mostrarse colapsadas.  
RN-039. Retiradas deben mostrarse colapsadas y conservar historial.  
RN-040. Pantalla de expediente responde: “¿Qué falta para enviar a verificación?”.  
RN-041. Catálogo inicial oficial de estados de expediente.  
RN-042. Cada estado tiene responsable operativo.  
RN-043. Parámetros configuran productos, requisitos y políticas.  
RN-044. Codex no inventa reglas de negocio.

## 10.3 Reglas derivadas obligatorias

- Cualquier excepción de flujo debe registrarse como regla explícita y auditable.
- Si una regla depende de dato externo, debe existir fallback seguro y trazable.
- Las reglas de cálculo monetario deben quedar versionadas y probadas.
- Cambios de reglas críticas requieren control de vigencia temporal.

## 10.4 Matriz de bloqueo operativo

Bloquea avance de solicitante:

- Solicitud no capturada.
- Documento obligatorio pendiente/observado/vencido.
- Inconsistencia crítica de validación.

Bloquea envío de expediente a verificación:

- Menos completas que mínimo parametrizado.
- Pendientes obligatorios críticos.
- Inconsistencias no resueltas de expediente.

No bloquea por diseño, pero registra advertencia:

- Documento opcional pendiente.
- Solicitante retirada correctamente marcada.

## 10.5 Regla de explicabilidad

Toda regla automática visible para usuario debe tener texto explicativo breve:

- Condición evaluada.
- Resultado.
- Acción sugerida.

---

# 11) Arquitectura del sistema

## 11.1 Principios arquitectónicos

- Monorepo con separación clara de aplicaciones y dominios.
- Frontend móvil y backend desacoplados por contratos API.
- Persistencia transaccional en PostgreSQL.
- Almacenamiento documental compatible con S3.
- Evolución modular por capacidades de negocio.

## 11.2 Estructura de alto nivel

- apps/mobile: cliente operativo móvil.
- apps/api: backend de dominio y orquestación.
- database: esquema, migraciones y artefactos de datos.
- docs: cuerpo de conocimiento institucional.
- packages/shared: artefactos compartidos.
- infra: activos de despliegue/entorno.

## 11.3 Arquitectura móvil

- React Native + TypeScript.
- Pantallas por feature orientadas a tareas.
- Componentes UI reutilizables.
- Catálogos locales y validaciones de entrada.
- Flujos de captura y revisión centrados en expediente.

## 11.4 Arquitectura API

- NestJS modular por dominio.
- Controladores por recurso.
- Servicios de negocio y orquestación de estado.
- Capa de persistencia evolutiva (actualmente con componentes temporales en memoria en áreas específicas).

## 11.5 Dominios iniciales implementados/semilla

- Grupos.
- Expedientes.
- Solicitantes.
- Solicitudes.
- Documentos.
- Salud de servicio.

## 11.6 Arquitectura de estado

- El estado funcional no vive en la UI.
- La UI consulta y presenta estado oficial.
- La API determina transiciones válidas.
- Las reglas y parámetros gobiernan decisiones automáticas.

## 11.7 Requisitos no funcionales

- Seguridad de acceso por autenticación y rol.
- Trazabilidad de cambios de estado.
- Integridad referencial de entidades núcleo.
- Escalabilidad modular por incremento de dominios.
- Observabilidad mínima en eventos críticos.

## 11.8 Ruta arquitectónica del MVP 1.0

Fases aprobadas:

1. Foundation.
2. Documentación.
3. Verificación.
4. Desembolsos.
5. Hardening y release readiness.

---

# 12) Principios de diseño UX

## 12.1 Fundamento

La UX responde a operación de campo y perfil de usuaria principal (asesora, alrededor de 55 años, contexto de movilidad, tiempo limitado, internet variable).

## 12.2 Principios oficiales de interacción

- Una pantalla responde una sola pregunta operativa.
- Mostrar primero pendientes.
- Reducir toques innecesarios.
- Lenguaje operativo, no técnico.
- Guardado automático.
- Acciones principales claras y limitadas.
- Navegación corta, idealmente 2 toques, máximo 3.

## 12.3 Principios de interfaz

- Alto contraste.
- Tipografía legible.
- Botones grandes y separados.
- Tarjetas como patrón de selección primaria.
- Estado representado con badge y color consistente.

## 12.4 Principios de diseño por componentes

Componentes oficiales de sistema:

- Header.
- Buscador.
- Chips.
- Card de expediente.
- KPIs.
- Card de solicitante.
- Card de documento.
- Badge de estado.
- Botón principal.
- Botón secundario.
- Campo.
- Selector de fotografías.
- Modal.
- Lista.

## 12.5 Reglas de semántica visual

- El color comunica estado operativo.
- No usar color como adorno sin significado.
- Franja lateral y badge deben coincidir semánticamente.

## 12.6 Reglas de formulación

- Los formularios siguen el orden de la solicitud física.
- No reordenar por comodidad técnica.
- Validación debe guiar corrección inmediata.

## 12.7 Política de no saturación

No introducir en pantallas operativas:

- Estadísticas no accionables.
- Menús accesorios no esenciales.
- Flujos alternos no priorizados.

---

# 13) Principios de base de datos

## 13.1 Objetivo de datos

Asegurar integridad, trazabilidad, flexibilidad de evolución y soporte a reglas de negocio configurables.

## 13.2 Principios estructurales

- Entidades núcleo normalizadas.
- Llaves primarias uniformes.
- Integridad referencial explícita.
- Auditoría temporal y de actor.
- Soft delete para preservación histórica.

## 13.3 Entidades canónicas de datos

- personas.
- usuarios.
- roles.
- usuarios_roles.
- productos.
- parametros.
- reglas.
- expedientes.
- solicitantes.
- grupos.
- ciclos.
- creditos.
- desembolsos.
- pagos.
- documentos.

## 13.4 Convenciones de naming

- Tablas en minúscula descriptiva.
- PK como id.
- FK como entidad_id.
- Fechas de auditoría estandarizadas.

## 13.5 Principios de auditoría

Toda tabla crítica debe soportar:

- created_at.
- updated_at.
- created_by.
- updated_by.
- deleted_at.
- status.

## 13.6 Principios documentales de datos

- Documento con asociación flexible a entidades dominio.
- Versionamiento documental en reemplazos.
- Metadatos obligatorios para trazabilidad.

## 13.7 Principios de parametrización

- Parámetros no son constantes de código.
- Reglas referencian parámetros.
- Cambio de valor debe ser auditable por vigencia y responsable.

## 13.8 Principios de compatibilidad evolutiva

- Migrations incrementales.
- Sin cambios destructivos sin plan de transición.
- Backfill controlado y trazable cuando se introducen campos críticos.

---

# 14) Convenciones de desarrollo

## 14.1 Convenciones generales

- Código tipado y legible.
- Módulos por dominio funcional.
- Evitar duplicación.
- Reglas fuera de componentes visuales.
- Servicios responsables de lógica de negocio.

## 14.2 Convenciones frontend

- UI basada en Design System oficial.
- Formularios con validación inmediata.
- Lenguaje de interfaz operativo.
- Estado de proceso proveniente del backend/reglas.

## 14.3 Convenciones backend

- Controlador: contrato de entrada/salida.
- Servicio: reglas y orquestación.
- Persistencia: separada de presentación.
- Validación estructural y funcional.

## 14.4 Convenciones de pruebas

Pruebas mínimas para cambios funcionales:

- Pruebas unitarias de reglas nuevas/modificadas.
- Pruebas de transición de estado.
- Pruebas de casos borde de validación.
- Pruebas de regresión en flujo principal afectado.

## 14.5 Convenciones de documentación

Cada cambio relevante actualiza:

- Regla impactada.
- Flujo impactado.
- Estado impactado.
- Referencia cruzada actualizada.

## 14.6 Convenciones de calidad

No se acepta:

- Hardcode de políticas configurables.
- Cambio silencioso de semántica de estado.
- Eliminación destructiva de historial crítico.
- Duplicidad de componente oficial.

## 14.7 Convenciones de nomenclatura funcional

Priorizar vocabulario de operación:

- Solicitud.
- Solicitante.
- Documentación.
- Verificación.
- Desembolso.

Evitar jerga técnica en superficies operativas.

---

# 15) Reglas para IA

## 15.1 Rol de la IA en el proyecto

La IA participa como acelerador de diseño, análisis y ejecución técnica, pero no como autoridad autónoma de reglas de negocio.

## 15.2 Restricciones obligatorias

La IA no puede:

- Inventar reglas de negocio.
- Cambiar estados oficiales sin decisión explícita.
- Introducir términos operativos no aprobados.
- Reemplazar decisiones funcionales humanas.

## 15.3 Comportamiento esperado

La IA debe:

- Basarse en documentación vigente del repositorio.
- Declarar supuestos cuando haya vacíos.
- Solicitar aclaración en ambigüedades críticas.
- Priorizar coherencia con constitución.

## 15.4 Reglas de trazabilidad de IA

Toda intervención de IA sobre activos críticos debe dejar:

- Contexto consultado.
- Sección afectada.
- Tipo de cambio.
- Riesgo potencial.

## 15.5 Regla de seguridad funcional

Ante conflicto entre rapidez y consistencia operativa, la IA debe elegir consistencia.

---

# 16) Reglas para Codex

## 16.1 Rol institucional

Codex actúa como Lead Software Engineer bajo lineamientos funcionales y arquitectónicos aprobados.

## 16.2 Mandatos obligatorios para Codex

- No inventar reglas de negocio.
- No modificar la operación para facilitar implementación.
- No hardcodear parámetros de política.
- No romper estados ni transiciones oficiales.
- No crear componentes visuales fuera del Design System sin aprobación.

## 16.3 Protocolo de implementación

Antes de codificar:

1. Identificar regla de negocio aplicable.
2. Identificar estados impactados.
3. Verificar parámetros involucrados.
4. Confirmar contrato API y/o modelo de datos.
5. Validar impacto UX.

Durante codificación:

- Mantener separación de responsabilidades.
- Escribir pruebas mínimas de protección.
- Evitar side effects ocultos.

Después de codificar:

- Verificar checklist obligatorio.
- Confirmar no regresión del flujo principal.
- Actualizar documentación impactada.

## 16.4 Escalación de duda

Si hay ambigüedad funcional, Codex debe detener implementación de la parte ambigua y solicitar definición.

---

# 17) Checklist obligatorio antes de cualquier cambio

Este checklist es mandatorio para todo cambio en código, reglas, estados, UX, datos o configuración de parámetros.

## 17.1 Validación funcional previa

- Se identificó la regla de negocio exacta que gobierna el cambio.
- El cambio respeta lenguaje operativo oficial.
- El cambio no altera operación real de asesoras.
- Se definió impacto en flujo de expediente/solicitante/documento.

## 17.2 Validación de estados

- Se identificaron estados de entrada y salida.
- No se introdujeron transiciones inválidas.
- Se preservó trazabilidad de cambios de estado.
- Se verificó impacto en KPIs de avance.

## 17.3 Validación de parámetros

- Toda política variable quedó parametrizada.
- No se dejó valor crítico hardcodeado.
- Se validó valor por defecto y vigencia.

## 17.4 Validación UX

- La pantalla responde una sola pregunta operativa.
- Se muestran primero pendientes.
- Se mantiene consistencia del Design System.
- Se evita saturación visual y texto innecesario.

## 17.5 Validación de datos

- Integridad referencial preservada.
- Auditoría preservada.
- No se eliminó historial crítico.
- Se evaluó impacto en migraciones y compatibilidad.

## 17.6 Validación técnica

- Pruebas nuevas o actualizadas ejecutadas.
- No hay regresión en flujo principal.
- Código mantiene modularidad y legibilidad.
- Se actualizó documentación de contrato si aplica.

## 17.7 Aprobación final

- Responsable funcional informado cuando cambio toca reglas.
- Riesgos y mitigaciones documentados.
- Referencias cruzadas actualizadas.

---

# 18) Lista DO NOT BREAK

Lista de invariantes críticos que no pueden romperse bajo ninguna circunstancia sin reforma explícita de esta constitución.

1. No cambiar la operación real para ajustarse al software.
2. No permitir selección manual arbitraria de estados oficiales.
3. No eliminar historial de expediente/documento/evento crítico.
4. No considerar completa una solicitante sin solicitud capturada y requisitos documentales obligatorios cumplidos.
5. No enviar expediente a verificación si no cumple mínimos parametrizados.
6. No hardcodear políticas funcionales configurables.
7. No reemplazar lenguaje operativo por jerga técnica en UI.
8. No introducir componentes visuales paralelos al Design System sin autorización.
9. No ocultar pendientes críticos detrás de capas visuales secundarias.
10. No eliminar trazabilidad de quién, cuándo y por qué cambió un estado.
11. No romper consistencia de badge/estado/color.
12. No impedir convivencia operativa de ciclo vigente y documentación de ciclo siguiente cuando política lo permite.
13. No anular la regla de refinanciamiento por porcentaje mínimo pagado configurable.
14. No aceptar datos estructuralmente inválidos en solicitud individual.
15. No suprimir validaciones críticas de CURP, teléfono y código postal sin política aprobada.
16. No mezclar lógica de negocio crítica dentro de componentes de UI.
17. No desplegar cambios de reglas sin pruebas de regresión básicas.
18. No usar IA para inventar definiciones no aprobadas.
19. No aceptar cambios sin checklist obligatorio completo.
20. No contradecir esta constitución en documentos subordinados.

---

# 19) Glosario

## 19.1 Términos de negocio

- Asesora: usuaria operativa principal en campo.
- Solicitante: persona que participa en expediente para evaluación de crédito.
- Expediente: registro operativo y documental previo al desembolso, conservado como historial.
- Grupo: unidad solidaria asociada al crédito grupal.
- Crédito: obligación financiera con ciclo propio.
- Ciclo: periodo operativo/comercial de un grupo.
- Desembolso: evento de entrega del crédito.
- Pago: evento de recuperación del crédito.
- Verificación: revisión operativa de evidencia y cumplimiento.
- Análisis: evaluación de viabilidad de autorización cuando el flujo lo requiera.

## 19.2 Términos documentales

- Documento: evidencia asociada a solicitante/expediente/grupo/crédito según contexto.
- Documento obligatorio: documento cuya ausencia bloquea avance.
- Documento opcional: documento no bloqueante que puede influir evaluación.
- Solicitud física: formato firmado por solicitante, parte documental del expediente.
- Solicitud digital capturada: representación estructurada en sistema del formato operativo.

## 19.3 Términos de estado

- Pendiente: requisito no resuelto.
- Completa: solicitante con requisitos de completitud cumplidos.
- Retirada: solicitante fuera de continuidad, preservando historial.
- Rechazada: solicitante o expediente sin continuidad por decisión negativa.
- Observado: registro con requerimientos de corrección.

## 19.4 Términos técnicos de gobierno

- Parámetro: valor configurable de política operativa.
- Regla: evaluación formal que determina comportamiento del sistema.
- Hardcode: valor fijo en código donde debería existir configuración.
- Trazabilidad: capacidad de reconstruir decisiones y cambios.
- Compatibilidad evolutiva: capacidad de cambiar sin romper continuidad crítica.

---

# 20) Referencias cruzadas

## 20.1 Referencias de negocio

- docs/business/BUSINESS_RULES.md
- README.md

## 20.2 Referencias de producto y alcance

- docs/roadmap/MVP_1_0_IMPLEMENTATION_PLAN.md
- docs/roadmap/US-001_TECHNICAL_REVIEW.md

## 20.3 Referencias de arquitectura

- docs/architecture/ARCHITECTURE.md
- docs/architecture/DOMAIN_MODEL.md
- docs/architecture/ERD_V2_PROPOSAL.md

## 20.4 Referencias de datos

- docs/database/DATABASE_DESIGN_REVIEW.md
- docs/database/ENTITY_CATALOG.md
- database/schema/init.sql

## 20.5 Referencias de UX y diseño

- UX_GUIDELINES.md
- DESIGN_SYSTEM.md
- docs/ux/UX-001.md

## 20.6 Referencias de implementación actual

- apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx
- apps/mobile/src/features/expedientes/ExpedienteDetailScreen.tsx
- apps/mobile/src/features/documentos/DocumentosScreen.tsx
- apps/api/src/documentos/documentos.entity.ts
- apps/api/src/solicitudes/solicitudes.entity.ts
- apps/api/src/expedientes/expedientes.service.ts

---

# Apéndice A) Marco de responsabilidad por estado de expediente

Este apéndice define responsabilidad primaria (R), soporte (S) y validación (V) por estado.

- En documentación: R Asesora, S Soporte operativo, V Coordinación documental.
- Con observaciones: R Asesora, S Verificación, V Coordinación documental.
- Listo para verificar: R Sistema (determinación), S Asesora, V Verificación.
- En verificación: R Verificación, S Asesora, V Coordinación.
- Verificado: R Verificación, S Sistema, V Coordinación.
- En análisis: R Análisis, S Verificación, V Coordinación de riesgo.
- Autorizado: R Autorización, S Análisis, V Gobierno operativo.
- Esperando 80%: R Sistema + Cobranza, S Asesora, V Coordinación.
- Listo para desembolso: R Sistema + Desembolsos, S Operación, V Control interno.
- Desembolsado: R Desembolsos, S Sistema, V Control interno.
- Cancelado: R Responsable autorizado, S Sistema, V Auditoría interna.
- Rechazado: R Verificación/Análisis según origen, S Sistema, V Control de calidad.

---

# Apéndice B) Modelo de decisión automática de completitud de solicitante

## B.1 Entradas mínimas

- Existencia de solicitud digital capturada para solicitante.
- Estado de cada documento requerido.
- Indicadores de excepción autorizada (si aplica).

## B.2 Evaluación

- Si falta solicitud capturada -> Pendiente.
- Si algún documento requerido no está en estado válido -> Pendiente.
- Si solicitud capturada y requeridos válidos -> Completa.
- Si se marca retiro por evento autorizado -> Retirada.
- Si existe resolución negativa -> Rechazada.

## B.3 Salidas

- Estado de solicitante.
- Razones de pendiente.
- Acción siguiente sugerida.

---

# Apéndice C) Política de evolución de esta constitución

## C.1 Tipos de cambio

- Corrección editorial: no cambia semántica.
- Ajuste operativo menor: precisa criterios sin alterar principios inmutables.
- Reforma mayor: altera contratos funcionales o principios.

## C.2 Requisitos de aprobación

- Corrección editorial: revisión técnica.
- Ajuste operativo menor: validación funcional + técnica.
- Reforma mayor: aprobación ejecutiva del proyecto + actualización de referencias cruzadas.

## C.3 Reglas de versionado

- Mayor: cambios de principios o contratos críticos.
- Menor: nuevas secciones o ampliaciones compatibles.
- Parche: correcciones de precisión sin cambio de política.

---

# Apéndice D) Especificación de uso de formatos de solicitud

Este proyecto reconoce dos capas de captura:

1. Capa de formato físico firmado en operación real.
2. Capa de captura digital estructurada en sistema.

## D.1 Solicitud Individual

La estructura digital vigente de Solicitud Individual incluye, como mínimo:

- Información personal.
- Domicilio particular.
- Referencias.
- Datos de pareja (cuando aplique).
- Datos del negocio o trabajo.
- Beneficiario.
- Validaciones finales.

## D.2 Solicitud Grupal

La Solicitud Grupal se representa operativamente mediante:

- Alta/identidad de grupo.
- Asociación de solicitantes al expediente del grupo.
- Consolidación de avance por KPIs de solicitantes.
- Elegibilidad grupal para verificación y desembolso conforme reglas.

## D.3 Regla de consistencia formato-sistema

Toda evolución de formato físico debe reflejarse en captura digital sin romper:

- Orden lógico de captura para la asesora.
- Completitud automática.
- Reglas de bloqueo y avance.

---

# Apéndice E) Catálogo de riesgos críticos y mitigación

## E.1 Riesgo: hardcode de políticas

Impacto: deriva operativa y decisiones inconsistentes.  
Mitigación: parámetros versionados y pruebas de regresión.

## E.2 Riesgo: transición de estado inválida

Impacto: bloqueo de proceso o autorización indebida.  
Mitigación: motor de estado con matriz de transición y pruebas automáticas.

## E.3 Riesgo: pérdida de historial documental

Impacto: incumplimiento de trazabilidad.  
Mitigación: prohibición de borrado destructivo y versionamiento.

## E.4 Riesgo: UX no alineada a campo

Impacto: baja adopción y errores de captura.  
Mitigación: principios UX obligatorios, revisión de usabilidad por operación.

## E.5 Riesgo: IA inventa reglas

Impacto: divergencia funcional.  
Mitigación: regla explícita de no invención y revisión humana en ambigüedades.

---

# Apéndice F) Declaración de cumplimiento obligatorio

Toda persona o sistema que contribuya al proyecto CRELEALTAD CORE declara que:

- Leyó y comprendió esta constitución.
- Ejecutará cambios dentro de sus límites.
- Escalará dudas antes de introducir ambigüedad funcional.
- Priorizará continuidad operativa sobre conveniencia técnica.

El incumplimiento de esta constitución invalida la aceptación técnica y funcional de cualquier entrega.

---

# Apéndice G) Flujo operativo detallado por rol y punto de control

## G.1 Roles operativos en el crédito grupal

Roles funcionales de referencia para orquestación del flujo:

- Asesora de crédito.
- Verificación.
- Análisis.
- Desembolsos.
- Cobranza.
- Coordinación operativa.
- Administración de parámetros.
- Control interno/auditoría.
- Soporte técnico.

## G.2 Secuencia operativa detallada: Grupo nuevo

### Tramo 1: Inicio y preparación

Paso 1. Asesora inicia sesión.  
Control: usuario activo y rol válido.

Paso 2. Asesora entra a módulo Documentación.  
Control: módulo habilitado por rol.

Paso 3. Asesora selecciona Grupo nuevo.  
Control: disponibilidad de flujo.

Paso 4. Sistema crea contexto de trabajo del grupo.  
Salida: id de grupo de trabajo.

Paso 5. Sistema crea expediente inicial asociado.  
Salida: id de expediente.

Paso 6. Sistema registra bitácora de creación de expediente.  
Control: auditoría de actor y timestamp.

### Tramo 2: Integración de solicitantes

Paso 7. Asesora agrega primera solicitante.  
Control: validación mínima de identidad operativa.

Paso 8. Sistema vincula solicitante a expediente.  
Salida: solicitante en estado Pendiente.

Paso 9. Sistema inicializa documentos base por solicitante.  
Salida: catálogo documental inicial con estados Pendiente.

Paso 10. Asesora revisa card de solicitante y pendientes.  
Control: visualización prioritaria de faltantes.

Paso 11. Asesora repite integración para solicitantes adicionales.  
Control: límites mínimo/máximo por parámetros.

### Tramo 3: Captura de solicitud individual

Paso 12. Asesora abre sección Capturar solicitud para solicitante A.

Paso 13. Sistema presenta estructura de captura en orden operativo.

Paso 14. Asesora captura información personal.

Paso 15. Sistema valida fecha de nacimiento en formato y existencia real.

Paso 16. Sistema valida CURP con reglas de formato.

Paso 17. Asesora captura domicilio particular.

Paso 18. Sistema valida código postal, municipio y consistencia de estado.

Paso 19. Asesora captura referencias.

Paso 20. Sistema valida teléfonos a 10 dígitos.

Paso 21. Asesora captura datos de negocio/trabajo.

Paso 22. Sistema calcula total económico automáticamente.

Paso 23. Asesora captura beneficiario.

Paso 24. Asesora responde validaciones finales.

Paso 25. Sistema evalúa completitud de solicitud.

Paso 26. Sistema persiste solicitud en formato estructurado.

Paso 27. Sistema deja evidencia de creación/actualización.

### Tramo 4: Captura documental

Paso 28. Asesora abre sección Documentos de solicitante A.

Paso 29. Sistema lista documentos requeridos y opcionales.

Paso 30. Asesora registra Solicitud física.

Paso 31. Sistema cambia estado documental conforme acción.

Paso 32. Asesora registra INE.

Paso 33. Sistema actualiza estado INE y timestamp.

Paso 34. Asesora registra comprobante de domicilio.

Paso 35. Sistema actualiza estado documental y mantiene trazabilidad.

Paso 36. Asesora decide si adjunta comprobante de crédito externo.

Paso 37. Sistema lo trata como opcional salvo política específica.

Paso 38. Sistema recalcula completitud de solicitante.

Paso 39. Sistema muestra resultado:

- Completa, o
- Pendiente con lista de faltantes.

### Tramo 5: Consolidación de expediente

Paso 40. Sistema recalcula KPIs de expediente:

- Solicitantes.
- Completas.
- Pendientes.
- Retiradas.

Paso 41. Sistema evalúa condición de envío a verificación.

Paso 42. Si no cumple, muestra faltantes bloqueantes priorizados.

Paso 43. Asesora atiende faltantes hasta cumplir mínimos.

Paso 44. Sistema habilita acción Enviar a verificación.

Paso 45. Asesora ejecuta envío.

Paso 46. Sistema cambia estado de expediente a En verificación.

Paso 47. Sistema registra evento de handoff documental.

### Tramo 6: Verificación

Paso 48. Verificación recibe expediente en bandeja.

Paso 49. Verificación revisa solicitantes y documentos.

Paso 50. Verificación evalúa consistencia de datos críticos.

Paso 51. Verificación decide resultado:

- Aprobar.
- Regresar con observaciones.
- Rechazar.

Paso 52. Sistema aplica transición de estado autorizada.

Paso 53. Sistema conserva observaciones y responsable.

### Tramo 7: Análisis y autorización

Paso 54. Cuando aplica, expediente pasa a análisis.

Paso 55. Análisis evalúa política de producto y riesgo.

Paso 56. Análisis emite dictamen.

Paso 57. Sistema cambia estado a Autorizado o Rechazado.

### Tramo 8: Regla de refinanciamiento

Paso 58. Si expediente es de renovación, sistema evalúa porcentaje mínimo pagado del ciclo anterior.

Paso 59. Si no cumple, estado Esperando 80% (valor parametrizable).

Paso 60. Cobranza actualiza pagos en ciclo anterior.

Paso 61. Al cumplir umbral, sistema transita a Listo para desembolso.

### Tramo 9: Desembolso y cierre operativo de ciclo

Paso 62. Desembolsos prepara expediente autorizado.

Paso 63. Se registra desembolso en sistema.

Paso 64. Estado cambia a Desembolsado.

Paso 65. Se conserva expediente como historial.

Paso 66. Se habilita continuidad operativa en ciclo de crédito.

## G.3 Secuencia operativa detallada: Renovación

La renovación incorpora todo el flujo anterior con condiciones adicionales:

Paso R1. Sistema identifica grupo con ciclo vigente.

Paso R2. Sistema permite abrir expediente nuevo sin cerrar ciclo anterior (regla de convivencia).

Paso R3. Asesora integra solicitantes candidatas para renovación.

Paso R4. Sistema consulta historial interno por persona.

Paso R5. Sistema determina tipo de clienta automáticamente.

Paso R6. Sistema sugiere monto por reglas de historial/igualación/parámetros.

Paso R7. Asesora captura monto solicitado.

Paso R8. Sistema valida monto solicitado contra reglas de producto.

Paso R9. Expediente sigue flujo documental, verificación y autorización.

Paso R10. Antes de desembolso se aplica regla de porcentaje pagado mínimo configurable.

## G.4 Controles transversales por etapa

Controles obligatorios en cada etapa:

- Integridad de identidad de entidad.
- Trazabilidad de actor y tiempo.
- Registro de razón en transición sensible.
- Validación de parámetros vigentes.
- Preservación de historial.

---

# Apéndice H) Matriz de estados y transiciones por entidad

## H.1 Persona

Estados:

- Activa.
- Inactiva.
- Bloqueada.
- Depurada lógica.

Transiciones válidas:

- Activa -> Inactiva: baja administrativa.
- Activa -> Bloqueada: incidencia de seguridad.
- Inactiva -> Activa: reactivación autorizada.
- Cualquiera -> Depurada lógica: proceso de depuración autorizado.

Transiciones inválidas:

- Depurada lógica -> Activa sin proceso formal de restauración.

## H.2 Usuario

Estados:

- Activo.
- Inactivo.
- Suspendido.
- Bloqueado.

Transiciones válidas:

- Activo -> Suspendido: incumplimiento temporal.
- Activo -> Inactivo: baja de operación.
- Suspendido -> Activo: regularización.
- Bloqueado -> Activo: desbloqueo controlado.

## H.3 Parámetro

Estados:

- Activo.
- Inactivo.
- Vigencia futura.
- Expirado.

Transiciones válidas:

- Vigencia futura -> Activo: llega fecha de vigencia.
- Activo -> Expirado: fin de vigencia.
- Activo -> Inactivo: desactivación administrativa.
- Inactivo -> Activo: reactivación.

Condición crítica:

- Todo cambio conserva valor previo y responsable.

## H.4 Regla

Estados:

- Activa.
- Inactiva.
- En prueba controlada.
- Retirada.

Transiciones válidas:

- Inactiva -> En prueba controlada.
- En prueba controlada -> Activa.
- Activa -> Inactiva.
- Activa -> Retirada.

Condición crítica:

- Regla activa debe referenciar parámetros válidos.

## H.5 Documento

Estados oficiales:

- Pendiente.
- Capturado.
- Observado.
- Aceptado.
- Reemplazado.
- Vencido.

Transiciones válidas:

- Pendiente -> Capturado: carga inicial.
- Capturado -> Observado: revisión con hallazgo.
- Capturado -> Aceptado: validación correcta.
- Observado -> Reemplazado: nueva versión aportada.
- Reemplazado -> Capturado o Aceptado según flujo.
- Aceptado -> Vencido: pérdida de vigencia por política temporal.

Transiciones prohibidas directas:

- Pendiente -> Aceptado sin evidencia.
- Vencido -> Aceptado sin recaptura/reevaluación.

## H.6 Solicitante

Estados oficiales:

- Pendiente.
- Completa.
- Retirada.
- Rechazada.

Transiciones válidas:

- Pendiente -> Completa: cumple solicitud + documentos requeridos.
- Pendiente -> Retirada: retiro formal.
- Pendiente -> Rechazada: decisión negativa.
- Completa -> Pendiente: aparece observación bloqueante posterior.
- Completa -> Rechazada: decisión de rechazo posterior.

Transiciones no válidas:

- Retirada -> Completa sin reintegración formal.

## H.7 Solicitud

Estados:

- No iniciada.
- En captura.
- Incompleta.
- Capturada.
- Observada.
- Reemplazada.
- Cerrada.

Transiciones válidas:

- No iniciada -> En captura.
- En captura -> Incompleta.
- En captura -> Capturada.
- Incompleta -> En captura.
- Capturada -> Observada.
- Observada -> Reemplazada.
- Capturada -> Cerrada.

## H.8 Expediente

Estados oficiales:

- En documentación.
- Con observaciones.
- Listo para verificar.
- En verificación.
- Verificado.
- En análisis.
- Autorizado.
- Esperando 80%.
- Listo para desembolso.
- Desembolsado.
- Cancelado.
- Rechazado.

Transiciones canónicas:

- En documentación -> Listo para verificar.
- En documentación -> Con observaciones.
- Con observaciones -> En documentación.
- Listo para verificar -> En verificación.
- En verificación -> Verificado.
- En verificación -> Con observaciones.
- En verificación -> Rechazado.
- Verificado -> En análisis.
- En análisis -> Autorizado.
- En análisis -> Rechazado.
- Autorizado -> Esperando 80%.
- Autorizado -> Listo para desembolso.
- Esperando 80% -> Listo para desembolso.
- Listo para desembolso -> Desembolsado.
- Cualquiera según política -> Cancelado.

## H.9 Grupo

Estados:

- Propuesto.
- En documentación.
- En evaluación.
- Activo.
- En renovación.
- Cerrado.

Transiciones:

- Propuesto -> En documentación.
- En documentación -> En evaluación.
- En evaluación -> Activo.
- Activo -> En renovación.
- En renovación -> Activo (nuevo ciclo desembolsado).
- Activo -> Cerrado.

## H.10 Crédito

Estados:

- Borrador.
- Preparado para desembolso.
- Desembolsado.
- Vigente.
- Vencido.
- Liquidado.
- Reestructurado.
- Cancelado.

## H.11 Ciclo

Estados:

- Planeado.
- Activo.
- En cierre.
- Cerrado.

## H.12 Desembolso

Estados:

- Pendiente.
- Programado.
- Ejecutado.
- Cancelado.
- Reversado.

## H.13 Pago

Estados:

- Pendiente.
- Parcial.
- Aplicado.
- Vencido.
- Reversado.

## H.14 Reglas de consistencia entre entidades

- No puede existir expediente Desembolsado sin registro de desembolso Ejecutado.
- No puede existir solicitante Completa sin solicitud Capturada.
- No puede existir solicitante Completa con documento obligatorio Pendiente/Observado/Vencido.
- No puede existir expediente Listo para desembolso si reglas de refinanciamiento no cumplen.

---

# Apéndice I) Reglas de negocio ampliadas por dominio

## I.1 Dominio de identidad y solicitante

Reglas ampliadas:

- Una persona puede aparecer en más de un expediente en diferentes ciclos.
- El sistema debe detectar coincidencia por criterios de identidad válidos.
- Duplicados potenciales deben generar alerta operativa, no bloqueo automático ciego.
- El historial interno tiene prioridad sobre datos declarativos nuevos cuando hay conflicto, salvo evidencia actualizada válida.

## I.2 Dominio de solicitud individual

Reglas ampliadas:

- La solicitud se considera un documento vivo versionable.
- Cada edición significativa debe conservar marca temporal.
- Errores de formato críticos bloquean estado Capturada.
- El cálculo automático de totales no puede ser sobreescrito manualmente.

## I.3 Dominio documental

Reglas ampliadas:

- Los documentos deben clasificarse por tipo funcional, no por canal de carga.
- Un documento observado debe contener observación actionable.
- Reemplazo documental no borra versión previa; la obsoleta se marca como reemplazada.
- Todo documento debe mapear a una entidad de negocio y contexto de uso.

## I.4 Dominio de expediente

Reglas ampliadas:

- El avance del expediente es función del estado de solicitantes y bloqueantes.
- Una solicitante retirada no resta trazabilidad del expediente.
- El sistema debe mostrar causa de no elegibilidad para verificación.

## I.5 Dominio de verificación

Reglas ampliadas:

- Verificación no captura operación base; valida consistencia y cumplimiento.
- Toda observación debe vincularse a entidad concreta (solicitante/documento/expediente).
- El retorno con observaciones debe mantener contexto para corrección rápida.

## I.6 Dominio de desembolso

Reglas ampliadas:

- No hay desembolso sin estado previo Listo para desembolso.
- En renovación, no hay desembolso sin cumplimiento de porcentaje mínimo pagado.
- Registro de desembolso requiere actor, fecha y referencia de operación.

## I.7 Dominio de parámetros y reglas

Reglas ampliadas:

- Cambios de parámetros deben tener vigencia controlada.
- Parámetros críticos requieren aprobación dual (funcional y técnica).
- Reglas en prueba controlada no pueden aplicarse globalmente sin liberación formal.

## I.8 Dominio de auditoría

Reglas ampliadas:

- Todo cambio sensible debe registrar quién, cuándo y motivo.
- Eventos de excepción deben incluir justificación explícita.
- Bitácoras no deben ser editables por usuarios operativos comunes.

## I.9 Dominio de resiliencia operativa

Reglas ampliadas:

- Operación debe tolerar conectividad variable.
- Interrupciones de sesión no deben provocar pérdida silenciosa de captura.
- Fallas de red deben retornar mensajes accionables y reintento seguro.

---

# Apéndice J) Manual de arquitectura de referencia empresarial

## J.1 Capa de presentación

Responsabilidades:

- Guiar tareas operativas con claridad.
- Capturar datos con validación temprana.
- Mostrar estado oficial y pendientes.

Prohibiciones:

- Calcular reglas de negocio críticas en cliente.
- Persistir lógica de transición oficial fuera de servicios.

## J.2 Capa de aplicación

Responsabilidades:

- Orquestar casos de uso.
- Enforzar reglas transversales.
- Gestionar transiciones de estado.

## J.3 Capa de dominio

Responsabilidades:

- Definir entidades, invariantes y reglas.
- Resolver decisiones de negocio.

## J.4 Capa de infraestructura

Responsabilidades:

- Persistencia.
- Integraciones.
- Storage documental.
- Observabilidad.

## J.5 Contratos entre capas

- Entrada validada.
- Errores clasificados.
- Salida determinística.
- Eventos auditables.

## J.6 Principios de modularización

- Un módulo por contexto de negocio principal.
- Acoplamiento por contratos explícitos.
- Dependencias dirigidas desde capa superior a servicios estables.

## J.7 Principios de evolución

- Añadir antes que romper.
- Mantener compatibilidad funcional durante transición.
- Versionar contratos cuando haya cambios incompatibles.

## J.8 Principios de integraciones

- Integraciones externas encapsuladas.
- Retries con control de idempotencia.
- Fallback operativo cuando sea posible.

## J.9 Principios de observabilidad

- Logs estructurados por evento clave.
- Correlación por id de expediente y solicitante.
- Métricas de flujo (tiempos, bloqueos, retrabajos).

## J.10 Principios de seguridad

- Acceso mínimo necesario por rol.
- Protección de datos sensibles.
- Trazabilidad de acceso a información crítica.

---

# Apéndice K) Framework UX operativo detallado

## K.1 Pregunta única por pantalla

Cada pantalla debe poder responder una pregunta operativa explícita.

Ejemplos:

- ¿Qué expediente debo abrir?
- ¿Qué falta para enviar a verificación?
- ¿Qué documento está pendiente en esta solicitante?

## K.2 Jerarquía de información

Orden obligatorio:

1. Bloqueantes.
2. Pendientes importantes.
3. Completos colapsables.
4. Historial y contexto secundario.

## K.3 Redacción operacional

Reglas de copy:

- Frases cortas.
- Verbos de acción.
- Sin tecnicismos.
- Sin ambigüedad.

## K.4 Retroalimentación inmediata

Toda acción relevante devuelve:

- Confirmación de resultado.
- Estado actual.
- Siguiente paso sugerido.

## K.5 Manejo de error usable

Error útil incluye:

- Qué salió mal.
- Dónde está el problema.
- Cómo corregirlo.

## K.6 Diseño para interrupciones

Como la asesora trabaja en campo:

- Debe poder retomar tarea sin perder contexto.
- Debe evitarse navegación profunda que se rompa con interrupciones.

## K.7 Diseño para una mano

- Objetivos táctiles grandes.
- Acciones primarias accesibles.
- Evitar patrones que demanden precisión milimétrica.

## K.8 Diseño para claridad de estado

- Estado en texto siempre visible.
- Color refuerza, no sustituye, semántica.
- Evitar combinaciones confusas de semáforo.

## K.9 Diseño de formularios largos

- Secciones claras y anclables.
- Validación en contexto.
- Evitar repreguntas innecesarias.
- Mantener continuidad visual.

## K.10 UX de revisión y verificación

- Mostrar diferencias relevantes entre versión previa y actual.
- Facilitar comentario sobre evidencia puntual.
- Evitar sobrecarga cognitiva en revisores.

---

# Apéndice L) Estándar de datos, auditoría y calidad

## L.1 Integridad de identidad

- Todas las entidades críticas tienen identificador estable.
- Relaciones entre expediente-solicitante-documento deben ser consistentes.

## L.2 Integridad temporal

- Timestamps obligatorios en creación y actualización.
- Eventos de estado con marca temporal.

## L.3 Integridad referencial

- No insertar referencias huérfanas.
- No eliminar padres con hijos activos sin política explícita.

## L.4 Auditoría de actor

- Campos de actor para acciones sensibles.
- Registro de origen de cambio (manual, automático, sistema).

## L.5 Calidad de dato operativo

Indicadores mínimos:

- Porcentaje de solicitudes con validaciones críticas correctas.
- Porcentaje de expedientes regresados por observaciones evitables.
- Tiempo promedio de resolución de pendientes.

## L.6 Calidad documental

- Cobertura de documentos obligatorios.
- Tasa de reemplazo por observación.
- Tiempo de respuesta ante observación documental.

## L.7 Gobierno de catálogos

- Catálogos oficiales con responsable.
- Cambios de catálogo trazables.
- Evitar proliferación de variantes no autorizadas.

## L.8 Política de retención

- Historial crítico conserva vigencia institucional.
- Depuración lógica controlada y auditable.

---

# Apéndice M) Convenciones de ingeniería y entrega

## M.1 Estructura de cambios

Todo cambio debe incluir:

- Contexto del problema.
- Regla o principio aplicable.
- Descripción de solución.
- Pruebas ejecutadas.
- Riesgos residuales.

## M.2 Convención de commits

Formato recomendado:

- tipo(scope): descripción breve

Tipos sugeridos:

- feat.
- fix.
- refactor.
- test.
- docs.
- chore.

## M.3 Convención de ramas

- main como línea estable.
- ramas de trabajo por objetivo funcional.
- evitar cambios multiobjetivo no relacionados.

## M.4 Convención de PR técnico

PR debe incluir:

- Qué cambia.
- Por qué cambia.
- Qué no cambia.
- Evidencia de prueba.

## M.5 Convención de pruebas

Pruebas mínimas por tipo de cambio:

- Cambio de regla: unit test + caso borde.
- Cambio de estado: transición válida + transición inválida.
- Cambio de validación: casos de formato inválido y válido.
- Cambio UX crítico: recorrido de tarea principal.

## M.6 Convención de feature flags

Cuando aplique rollout gradual:

- Flag con dueño.
- Fecha objetivo de retiro.
- Métrica de éxito.

## M.7 Convención de deuda técnica

- Registrar deuda explícita.
- Priorizar deuda que afecta reglas, estados o trazabilidad.

## M.8 Convención de incidentes

Ante incidente en producción:

1. Contener.
2. Diagnosticar causa raíz.
3. Corregir.
4. Proteger con prueba.
5. Documentar aprendizaje.

---

# Apéndice N) Reglas avanzadas para IA y automatización asistida

## N.1 Clasificación de decisiones para IA

- Clase A: decisiones editoriales/documentales de bajo riesgo.
- Clase B: decisiones técnicas acotadas con impacto moderado.
- Clase C: decisiones funcionales de alto impacto (requieren validación humana explícita).

## N.2 Operación permitida de IA por clase

- Clase A: permitida con revisión ligera.
- Clase B: permitida con revisión técnica obligatoria.
- Clase C: propuesta solamente; ejecución tras aprobación funcional.

## N.3 Prohibiciones absolutas

- IA no autoriza por sí sola cambio de principios inmutables.
- IA no redefine estados oficiales sin reforma.
- IA no altera reglas de desembolso/refinanciamiento por inferencia.

## N.4 Trazabilidad de prompts y resultados

Para cambios sensibles, registrar:

- Objetivo.
- Contexto fuente usado.
- Artefacto generado.
- Validación humana final.

## N.5 Calidad mínima de output de IA

El resultado de IA debe ser:

- Coherente con constitución.
- Trazable a fuentes internas.
- Sin contradicciones funcionales.
- Claro en supuestos y límites.

## N.6 Protocolo de duda ambigua

Si IA detecta ambigüedad de negocio:

1. Enumerar opciones posibles.
2. Señalar riesgos por opción.
3. Solicitar definición explícita.
4. No ejecutar cambio irreversible hasta definición.

---

# Apéndice O) Checklist operativo por módulo

## O.1 Documentación

- Se pueden crear grupos y expedientes sin fricción.
- Se pueden capturar solicitantes sin pérdida de contexto.
- Solicitud sigue orden del formato operativo.
- Documentos requeridos y opcionales están claramente diferenciados.
- El sistema explica faltantes para verificación.

## O.2 Verificación

- Bandeja muestra expedientes en orden accionable.
- Cada observación apunta a evidencia concreta.
- Decisiones de aprobar/regresar/rechazar quedan auditadas.

## O.3 Análisis

- Reglas de producto y riesgo aplicadas son trazables.
- El dictamen deja fundamento explícito.

## O.4 Desembolsos

- Solo expedientes elegibles llegan a desembolso.
- Regla de refinanciamiento se evalúa antes de ejecutar.
- Registro de desembolso conserva actor y fecha.

## O.5 Cobranza

- Pagos alimentan condiciones de renovación.
- Estados de crédito reflejan realidad de pago.

## O.6 Parámetros

- Parámetros críticos tienen responsable.
- Cambios de parámetro dejan rastro de vigencia.

## O.7 Administración

- Usuarios y roles mantienen principio de mínimo privilegio.

---

# Apéndice P) DO NOT BREAK ampliado (100 salvaguardas)

Las siguientes salvaguardas amplían la lista principal para control preventivo:

1. No romper la premisa de operación manda.
2. No introducir estados ocultos no mapeados.
3. No permitir ediciones manuales de estado sin evento.
4. No omitir auditoría en transición crítica.
5. No eliminar versiones documentales previas.
6. No mezclar documentos obligatorios y opcionales sin distinción.
7. No suprimir mensaje de faltantes bloqueantes.
8. No declarar expediente listo sin mínimos parametrizados.
9. No asumir 80% fijo en código.
10. No omitir validación de monto solicitado.
11. No degradar semántica de Pendiente/Completa/Retirada/Rechazada.
12. No permitir completitud con solicitud ausente.
13. No permitir completitud con documento obligatorio ausente.
14. No usar nomenclatura técnica en UI operativa.
15. No introducir botón Guardar en formularios operativos sin justificación formal.
16. No romper orden de captura de solicitud física.
17. No esconder estado actual de expediente.
18. No romper consistencia entre badge y texto de estado.
19. No cambiar KPIs de expediente sin decisión funcional.
20. No quitar indicador de pendientes.
21. No quitar indicador de retiradas.
22. No quitar indicador de completas.
23. No duplicar componentes oficiales del design system.
24. No crear pantalla huérfana fuera de flujo operativo.
25. No introducir menú distractor en inicio de documentación.
26. No eliminar trazabilidad de observaciones.
27. No permitir observaciones sin entidad objetivo.
28. No permitir rechazo sin motivo registrable.
29. No permitir cancelación sin responsable.
30. No romper integración expediente-solicitantes.
31. No romper integración solicitante-documentos.
32. No romper integración expediente-verificación.
33. No romper integración autorización-desembolso.
34. No romper referencias cruzadas documentales.
35. No hardcodear catálogos cambiantes.
36. No hardcodear política de producto.
37. No hardcodear límites de integrantes.
38. No hardcodear reglas de referencias.
39. No hardcodear regla de refinanciamiento.
40. No hardcodear lista documental obligatoria si política la define.
41. No eliminar soporte a historial interno de persona.
42. No anular consulta de historial en renovación.
43. No sobreescribir evidencia sin versión.
44. No perder timestamps de cambios críticos.
45. No perder actor de cambios críticos.
46. No permitir registros huérfanos en datos.
47. No romper integridad referencial.
48. No usar borrado físico en entidades históricas críticas.
49. No suprimir soft delete cuando aplique.
50. No degradar validaciones de identidad.
51. No degradar validaciones de teléfono.
52. No degradar validaciones de código postal.
53. No degradar validaciones de CURP.
54. No aceptar valores monetarios incoherentes sin alerta.
55. No romper cálculo automático de totales.
56. No permitir edición manual de cálculo automático sin política.
57. No romper criterio de visualización de pendientes primero.
58. No desordenar secciones clave de formularios.
59. No introducir flujos >3 niveles sin justificación.
60. No bloquear recuperación ante interrupción de captura.
61. No dejar errores sin mensaje accionable.
62. No mezclar errores técnicos con mensajes operativos.
63. No omitir pruebas en cambios de reglas.
64. No omitir pruebas en cambios de estados.
65. No omitir pruebas en cambios de validación.
66. No desplegar cambios críticos sin verificación cruzada.
67. No cerrar incidencia sin prueba de no regresión.
68. No invalidar documentación con cambios no documentados.
69. No alterar constitución sin versionado.
70. No alterar constitución sin responsable.
71. No aceptar cambio sin checklist completo.
72. No aceptar PR sin alcance declarado.
73. No mezclar cambios no relacionados en un mismo PR crítico.
74. No ignorar impacto en operación de campo.
75. No ignorar impacto en accesibilidad.
76. No introducir baja legibilidad en tipografía o contraste.
77. No reducir tamaño táctil de acciones principales.
78. No ocultar acciones primarias entre acciones secundarias.
79. No romper rol y permisos en rutas críticas.
80. No exponer datos sensibles sin control.
81. No permitir escritura sin autenticación en módulos críticos.
82. No permitir bypass de autorización por cliente.
83. No suprimir logs estructurados de eventos críticos.
84. No suprimir correlación por expediente en trazas.
85. No suprimir correlación por solicitante en trazas.
86. No romper compatibilidad de API sin versionado.
87. No cambiar contrato de payload sin coordinación.
88. No cambiar significado de campos existentes sin migración funcional.
89. No introducir dependencias externas sin evaluación de riesgo.
90. No introducir deuda técnica oculta en reglas críticas.
91. No dejar TODO sin dueño en flujo crítico.
92. No usar IA para decidir reglas sin validación humana.
93. No usar IA para aprobar producción en cambios críticos.
94. No inventar excepciones operativas no documentadas.
95. No omitir contexto en observaciones de verificación.
96. No permitir desembolso duplicado para mismo evento.
97. No permitir reversos sin auditoría reforzada.
98. No cerrar ciclo sin consistencia de pagos.
99. No perder continuidad entre ciclo anterior y renovación.
100. No violar la autoridad jerárquica de esta constitución.

---

# Apéndice Q) Plan de verificación de cumplimiento constitucional

## Q.1 Objetivo

Proveer un marco sistemático para verificar, de forma continua, que el proyecto y sus entregas respetan esta constitución.

## Q.2 Frecuencia

- Revisión ligera por cada cambio.
- Revisión completa por release.
- Auditoría semestral de cumplimiento estructural.

## Q.3 Criterios de evaluación

Eje funcional:

- Respeta reglas de negocio.
- Respeta estados oficiales.
- Respeta flujo operativo real.

Eje UX:

- Pregunta única por pantalla.
- Pendientes primero.
- Consistencia de componentes y lenguaje.

Eje técnico:

- Parametrización de políticas.
- Integridad y auditoría de datos.
- Cobertura de pruebas críticas.

## Q.4 Niveles de hallazgo

- Crítico: rompe principio inmutable o DO NOT BREAK.
- Alto: afecta flujo principal o estado oficial.
- Medio: afecta consistencia sin bloquear operación.
- Bajo: mejora recomendada.

## Q.5 Acciones por severidad

- Crítico: bloqueo de liberación.
- Alto: corrección previa a despliegue productivo.
- Medio: plan de remediación calendarizado.
- Bajo: backlog priorizado.

---

# Apéndice R) Hoja de ruta constitucional de madurez

## R.1 Nivel 1: Fundacional

Características:

- Reglas núcleo definidas.
- Estados oficiales definidos.
- Flujo principal operativo en MVP.

## R.2 Nivel 2: Controlado

Características:

- Parametrización de políticas críticas consolidada.
- Auditoría de estado completa.
- Pruebas de transición robustas.

## R.3 Nivel 3: Escalable

Características:

- Módulos ampliados con coherencia total.
- Métricas operativas de mejora continua.
- Automatización de validaciones constitucionales.

## R.4 Nivel 4: Institucional

Características:

- Gobierno de cambios estable y predecible.
- Riesgos operativos bajo control preventivo.
- Continuidad de negocio soportada por evidencia histórica sólida.

---

# Apéndice S) Playbooks operativos institucionales

## S.1 Playbook de documentación inicial

Objetivo: lograr expedientes preparados para verificación con mínimo retrabajo.

Entrada:

- Grupo nuevo o expediente de renovación creado.
- Asesora autenticada.
- Parámetros de producto vigentes.

Rutina diaria recomendada:

1. Revisar expedientes con más pendientes bloqueantes.
2. Priorizar solicitantes cercanas a completitud.
3. Resolver primero documentos obligatorios faltantes.
4. Resolver captura digital de solicitud pendiente.
5. Recalcular y confirmar elegibilidad para verificación.

Buenas prácticas:

- Trabajar expediente por expediente, no solicitante suelta.
- Evitar saltos de contexto innecesarios.
- Confirmar claridad de observaciones antes de cerrar jornada.

Antipatrones:

- Capturar evidencia sin asociarla a entidad correcta.
- Marcar mentalmente pendientes sin registrarlos en sistema.
- Postergar validaciones de formato para “después”.

## S.2 Playbook de respuesta a observaciones

Objetivo: cerrar observaciones en el menor ciclo posible.

Secuencia:

1. Leer observación completa.
2. Identificar entidad objetivo.
3. Corregir dato/documento puntual.
4. Validar que no generó inconsistencia colateral.
5. Reenviar a verificación.

Tiempo objetivo:

- Observación simple: mismo día.
- Observación con recaptura en campo: siguiente visita programada.

## S.3 Playbook de autorización y predesembolso

Objetivo: garantizar que solo casos elegibles lleguen a desembolso.

Controles:

- Estado de expediente Autorizado.
- Condición de refinanciamiento verificada.
- Evidencia documental íntegra.
- Responsable operativo identificado.

## S.4 Playbook de incidencias críticas

Clasificación:

- Incidencia A: bloqueo de flujo principal.
- Incidencia B: inconsistencia de estado.
- Incidencia C: degradación UX no bloqueante.

Respuesta:

1. Contención.
2. Diagnóstico.
3. Mitigación.
4. Corrección estable.
5. Prueba de no regresión.
6. Lección aprendida documentada.

## S.5 Playbook de cambio de parámetro crítico

Ejemplos de parámetro crítico:

- Integrantes mínimas.
- Umbral de refinanciamiento.
- Regla de documentos obligatorios.
- Monto inicial por tipo de clienta.

Pasos:

1. Solicitud formal de cambio.
2. Validación funcional.
3. Validación técnica.
4. Definición de vigencia.
5. Comunicación operativa.
6. Monitoreo postcambio.

---

# Apéndice T) Matriz RACI ampliada por macroproceso

## T.1 Convención

- R: Responsable ejecutor.
- A: Aprobador final.
- C: Consultado.
- I: Informado.

## T.2 Alta de grupo y expediente

- Asesora: R.
- Coordinación operativa: A.
- Soporte técnico: C.
- Control interno: I.

## T.3 Captura de solicitud individual

- Asesora: R.
- Coordinación documental: A.
- Verificación: C.
- Soporte técnico: I.

## T.4 Gestión documental

- Asesora: R.
- Coordinación documental: A.
- Verificación: C.
- Control interno: I.

## T.5 Envío a verificación

- Sistema (motor de reglas): R técnico de elegibilidad.
- Asesora: R operativo de ejecución.
- Verificación: A de recepción y evaluación.
- Coordinación: I.

## T.6 Dictamen de verificación

- Verificación: R.
- Coordinación operativa: A.
- Asesora: C.
- Control interno: I.

## T.7 Análisis y autorización

- Análisis: R.
- Aprobador designado: A.
- Verificación: C.
- Asesora: I.

## T.8 Desembolso

- Desembolsos: R.
- Coordinación financiera: A.
- Cobranza: C.
- Control interno: I.

## T.9 Gestión de parámetros

- Administración de parámetros: R.
- Gobierno funcional: A.
- Arquitectura técnica: C.
- Operación: I.

## T.10 Incidentes críticos

- Soporte técnico: R.
- Líder técnico: A.
- Operación: C.
- Control interno: I.

---

# Apéndice U) Catálogo de escenarios funcionales y de excepción

## U.1 Escenarios de entrada

1. Grupo nuevo sin historial previo.
2. Grupo nuevo con múltiples solicitantes en días distintos.
3. Renovación con ciclo anterior vigente.
4. Renovación con porcentaje pagado insuficiente.
5. Renovación con historial interno completo.
6. Renovación con combinación de historial interno y externo.

## U.2 Escenarios de solicitud individual

7. Solicitud con todos los campos válidos en primera captura.
8. Solicitud con CURP inválida y corrección inmediata.
9. Solicitud con fecha inválida y recaptura.
10. Solicitud con teléfonos incompletos y bloqueo.
11. Solicitud mexicana con estado de nacimiento obligatorio.
12. Solicitud extranjera con estado de nacimiento no aplicable.
13. Solicitud con CP no catalogado y captura manual de colonia/municipio.
14. Solicitud con CP catalogado y autocompletado correcto.
15. Solicitud con cálculo de total de negocio consistente.
16. Solicitud con inconsistencias de monto y recálculo automático.

## U.3 Escenarios documentales

17. Todos los documentos obligatorios capturados.
18. Falta de documento obligatorio con bloqueo de completitud.
19. Documento opcional pendiente sin bloqueo.
20. Documento observado y reemplazo por nueva versión.
21. Documento vencido que exige recaptura.
22. Solicitud física capturada sin captura digital (bloquea completitud).
23. Solicitud digital capturada sin solicitud física (según política documental, mantener pendiente).

## U.4 Escenarios de solicitante

24. Solicitante pasa de Pendiente a Completa.
25. Solicitante completa regresa a Pendiente por observación posterior.
26. Solicitante retirada se conserva en historial.
27. Solicitante rechazada no bloquea consulta histórica.

## U.5 Escenarios de expediente

28. Expediente con mínimo de completas exacto y envío permitido.
29. Expediente debajo de mínimo y envío bloqueado.
30. Expediente con observaciones y retorno a documentación.
31. Expediente rechazado en verificación.
32. Expediente verificado y enviado a análisis.
33. Expediente autorizado en espera de 80%.
34. Expediente autorizado listo para desembolso sin espera.
35. Expediente desembolsado con historial íntegro.

## U.6 Escenarios de refinanciamiento

36. Porcentaje pagado 79.9% y bloqueo.
37. Porcentaje pagado 80.0% y habilitación.
38. Umbral cambiado por parámetros y evaluación correcta.

## U.7 Escenarios de concurrencia operativa

39. Múltiples solicitantes editadas en paralelo.
40. Actualización de documento mientras se recalculan KPIs.
41. Reapertura de expediente tras observaciones en mismo día.

## U.8 Escenarios de resiliencia

42. Falla de red en guardado de solicitud con recuperación.
43. Reintento de actualización documental idempotente.
44. Reinicio de app con recuperación de contexto de expediente.

## U.9 Escenarios de seguridad y acceso

45. Usuario sin rol intenta transición de estado.
46. Usuario inactivo intenta acceso.
47. Cambio de rol impacta visibilidad de acciones.

## U.10 Escenarios de auditoría

48. Transición con actor y timestamp correctos.
49. Observación con motivo completo.
50. Reemplazo documental con versión previa accesible.

---

# Apéndice V) Suite constitucional de pruebas (catálogo extendido)

## V.1 Pruebas de reglas de negocio

Caso 1. Validar que el sistema, no la usuaria, determine completitud de solicitante.  
Caso 2. Validar que estado de expediente no sea editable manualmente.  
Caso 3. Validar que el mínimo de solicitantes provenga de parámetros.  
Caso 4. Validar convivencia de ciclo vigente y expediente en documentación.  
Caso 5. Validar regla de refinanciamiento configurable por porcentaje.  
Caso 6. Validar que retiradas no bloqueen avance cuando política lo define.  
Caso 7. Validar que solicitud física sin captura digital no complete solicitante.  
Caso 8. Validar que documento opcional pendiente no bloquee envío si no hay bloqueantes.  
Caso 9. Validar sugerencia de monto por reglas y no por captura manual.  
Caso 10. Validar clasificación automática de tipo de clienta.  
Caso 11. Validar preservación de historial en reemplazo documental.  
Caso 12. Validar que reglas de estado sigan matriz autorizada.

## V.2 Pruebas de estado de solicitante

Caso 13. Pendiente inicial al crear solicitante.  
Caso 14. Cambio a Completa con solicitud y documentos obligatorios correctos.  
Caso 15. Cambio a Pendiente por observación posterior de documento obligatorio.  
Caso 16. Cambio a Retirada por evento formal.  
Caso 17. Cambio a Rechazada por dictamen negativo.

## V.3 Pruebas de estado de expediente

Caso 18. En documentación al crear expediente.  
Caso 19. Listo para verificar al cumplir mínimos.  
Caso 20. En verificación al enviar.  
Caso 21. Con observaciones tras retorno.  
Caso 22. Verificado tras dictamen favorable.  
Caso 23. En análisis cuando flujo lo requiere.  
Caso 24. Autorizado tras dictamen positivo.  
Caso 25. Esperando 80% en renovación no cumplida.  
Caso 26. Listo para desembolso al cumplir condiciones.  
Caso 27. Desembolsado tras registro válido.

## V.4 Pruebas de validación de solicitud

Caso 28. Fecha inválida bloquea guardado.  
Caso 29. CURP inválida bloquea guardado.  
Caso 30. Teléfono con menos de 10 dígitos bloquea guardado.  
Caso 31. CP de longitud distinta a 5 bloquea guardado.  
Caso 32. Estado nacimiento obligatorio para mexicana.  
Caso 33. Estado nacimiento no aplicable para extranjera.  
Caso 34. Total negocio calculado automáticamente.

## V.5 Pruebas documentales

Caso 35. Documento requerido en Pendiente bloquea completitud.  
Caso 36. Documento requerido en Capturado habilita avance parcial.  
Caso 37. Documento Observado mantiene pendiente.  
Caso 38. Documento Aceptado satisface requisito.  
Caso 39. Documento Reemplazado conserva versión previa.  
Caso 40. Documento Vencido reactiva pendiente.

## V.6 Pruebas de parámetros

Caso 41. Cambio de mínimo de solicitantes impacta elegibilidad inmediatamente según vigencia.  
Caso 42. Cambio de umbral de refinanciamiento impacta evaluación.  
Caso 43. Cambio de documentos obligatorios impacta cálculo de completitud.

## V.7 Pruebas de auditoría

Caso 44. Toda transición registra actor.  
Caso 45. Toda transición registra timestamp.  
Caso 46. Todo reemplazo documental registra versión.  
Caso 47. Toda observación registra motivo.

## V.8 Pruebas de UX operacional

Caso 48. Pantalla de expediente responde con claridad qué falta para verificar.  
Caso 49. Pendientes aparecen antes que completas.  
Caso 50. Completas y retiradas pueden colapsarse.  
Caso 51. No hay lenguaje técnico en textos críticos.  
Caso 52. Acciones primarias son visibles y de fácil toque.

## V.9 Pruebas de resiliencia

Caso 53. Falla temporal de red no pierde contexto de captura.  
Caso 54. Reintento de envío a verificación evita duplicidad.  
Caso 55. Reapertura de expediente conserva estado y KPIs consistentes.

## V.10 Pruebas de seguridad

Caso 56. Usuario sin permisos no ejecuta transición crítica.  
Caso 57. Usuario inactivo no accede a módulos operativos.  
Caso 58. Registro de acceso sensible queda auditado.

## V.11 Pruebas de no regresión por módulo

Caso 59. Crear grupo mantiene creación de expediente asociado.  
Caso 60. Alta de solicitante mantiene asociación a expediente.  
Caso 61. Captura de solicitud mantiene persistencia por solicitante.  
Caso 62. Captura de documentos mantiene actualización por clave documental.  
Caso 63. Envío a verificación mantiene transición esperada.

## V.12 Pruebas ampliadas de cobertura constitucional (64 al 160)

Caso 64. Verificar que no exista botón guardar en formularios operativos primarios.  
Caso 65. Verificar que expedientes no permitan salto directo a Desembolsado.  
Caso 66. Verificar que Rechazado no transite a Autorizado sin reapertura formal.  
Caso 67. Verificar que Solicitud física y Solicitud digital estén ambas modeladas.  
Caso 68. Verificar que KPI de retiradas se actualice en tiempo.  
Caso 69. Verificar que KPI de pendientes se actualice tras captura documental.  
Caso 70. Verificar que flujo de observaciones preserve comentarios históricos.  
Caso 71. Verificar que operación en campo mantenga legibilidad bajo brillo alto (prueba de contraste).  
Caso 72. Verificar que botones críticos cumplan tamaño mínimo táctil institucional.  
Caso 73. Verificar que color de estado no contradiga texto de estado.  
Caso 74. Verificar que documentos opcionales se distingan visualmente.  
Caso 75. Verificar que historial de expediente permanezca tras desembolso.  
Caso 76. Verificar que entidad documento conserve relación con solicitante/expediente según contexto.  
Caso 77. Verificar que no se borren registros por reemplazo documental.  
Caso 78. Verificar que observaciones de verificación estén asociadas a un target preciso.  
Caso 79. Verificar que falla en creación de solicitud devuelva mensaje accionable.  
Caso 80. Verificar que falla en actualización documental devuelva mensaje accionable.  
Caso 81. Verificar que lista de expedientes se refresque tras alta de grupo.  
Caso 82. Verificar que envío a verificación invalide edición no permitida según política.  
Caso 83. Verificar que estado En verificación no acepte edición manual en cliente.  
Caso 84. Verificar que estado Con observaciones devuelva lista priorizada de faltantes.  
Caso 85. Verificar que mínima de completas configurable afecte habilitación del envío.  
Caso 86. Verificar que cambios de parámetros estén auditados.  
Caso 87. Verificar que reglas en prueba no impacten producción sin autorización.  
Caso 88. Verificar que actor de desembolso quede registrado.  
Caso 89. Verificar que fecha de desembolso quede registrada.  
Caso 90. Verificar que crédito no quede vigente sin desembolso ejecutado.  
Caso 91. Verificar que reverso de desembolso exija control reforzado.  
Caso 92. Verificar que pago aplicado altere estado de ciclo según reglas.  
Caso 93. Verificar que umbral de renovación responda a pagos reales.  
Caso 94. Verificar que grupo con ciclo vigente pueda iniciar nueva documentación.  
Caso 95. Verificar que la UI de inicio de documentación muestre solo acciones aprobadas.  
Caso 96. Verificar que no se muestre menú hamburguesa en contexto no autorizado.  
Caso 97. Verificar que encabezado mantenga identidad de usuario y módulo.  
Caso 98. Verificar que búsqueda no requiera botón adicional.  
Caso 99. Verificar que chips de filtro no rompan flujo principal.  
Caso 100. Verificar que tarjetas de expediente sean tocables completas.  
Caso 101. Verificar que no aparezca botón Abrir redundante en tarjeta.  
Caso 102. Verificar que textos operativos estén en lenguaje CRELEALTAD.  
Caso 103. Verificar que términos prohibidos no aparezcan en UI operativa.  
Caso 104. Verificar que validación de referencias familiares sea consistente.  
Caso 105. Verificar que beneficiario se capture con datos mínimos válidos.  
Caso 106. Verificar que monto máximo permitido aplique según parámetros/producto.  
Caso 107. Verificar que captura de ocupación se normalice correctamente.  
Caso 108. Verificar que municipio se derive de CP cuando catálogo lo permite.  
Caso 109. Verificar que en ausencia de catálogo exista captura manual controlada.  
Caso 110. Verificar que campos opcionales no bloqueen completitud salvo regla explícita.  
Caso 111. Verificar que campos obligatorios sí bloqueen cuando faltan.  
Caso 112. Verificar que transacciones fallidas no dupliquen entidades.  
Caso 113. Verificar idempotencia básica de actualización documental repetida.  
Caso 114. Verificar que eliminaciones lógicas no rompan reportabilidad histórica.  
Caso 115. Verificar que actualizaciones de estado disparen recalculo de KPIs.  
Caso 116. Verificar que retiradas no se mezclen con pendientes en conteo visual.  
Caso 117. Verificar que completadas colapsadas sigan accesibles para consulta.  
Caso 118. Verificar que auditoría muestre secuencia correcta de cambios por expediente.  
Caso 119. Verificar consistencia entre API y UI en nombres de estados.  
Caso 120. Verificar que cualquier estado desconocido sea manejado como error controlado.  
Caso 121. Verificar que migraciones no destruyan datos productivos.  
Caso 122. Verificar que scripts de inicialización respeten naming conventions.  
Caso 123. Verificar que índices críticos existan para consultas operativas frecuentes.  
Caso 124. Verificar que reglas de acceso por rol estén alineadas con matriz RACI.  
Caso 125. Verificar que logs no expongan datos sensibles de forma innecesaria.  
Caso 126. Verificar que errores de backend no filtren detalle técnico a usuaria final.  
Caso 127. Verificar que mensajes de éxito confirmen acción y próximo paso.  
Caso 128. Verificar que acciones de retorno (back) no pierdan progreso útil.  
Caso 129. Verificar que componentes reutilizables mantengan comportamiento uniforme.  
Caso 130. Verificar que nuevas pantallas reutilicen componentes oficiales.  
Caso 131. Verificar que no exista código duplicado de reglas críticas entre módulos.  
Caso 132. Verificar que contratos de DTO no acepten atributos no permitidos en operaciones sensibles.  
Caso 133. Verificar que pruebas unitarias cubran casos borde de transición.  
Caso 134. Verificar que pruebas de integración cubran flujo de documentación a verificación.  
Caso 135. Verificar que despliegue no rompa compatibilidad de app móvil existente.  
Caso 136. Verificar que fallback de conectividad degrade con gracia.  
Caso 137. Verificar que tiempos de respuesta se mantengan en umbral operativo.  
Caso 138. Verificar que listas grandes no degraden usabilidad de campo.  
Caso 139. Verificar que formato de fechas sea consistente en toda la app.  
Caso 140. Verificar que normalización a mayúsculas siga patrón institucional cuando aplica.  
Caso 141. Verificar que updates concurrentes no produzcan estado imposible.  
Caso 142. Verificar bloqueo de transición ante prerrequisito incumplido.  
Caso 143. Verificar que resumen de expediente no oculte bloqueantes críticos.  
Caso 144. Verificar que ruta de corrección de observación sea más corta que ruta de captura inicial completa.  
Caso 145. Verificar que capturas parciales no se reporten como completas.  
Caso 146. Verificar que cambios en catálogo de estados se reflejen en badges.  
Caso 147. Verificar que consistencia de texto esté alineada con glosario oficial.  
Caso 148. Verificar que no existan términos en inglés en UI operativa sin aprobación.  
Caso 149. Verificar que alertas críticas usen prioridad visual correcta.  
Caso 150. Verificar que acceso a documentación histórica sea posible tras cierre de expediente.  
Caso 151. Verificar que proceso de cancelación deje motivo obligatorio.  
Caso 152. Verificar que proceso de rechazo deje motivo obligatorio.  
Caso 153. Verificar que reapertura (si existe por política) preserve historial previo.  
Caso 154. Verificar que scripts de backfill respeten trazabilidad.  
Caso 155. Verificar que reporte básico de avance no contradiga datos de expediente.  
Caso 156. Verificar que métricas de calidad documental se calculen correctamente.  
Caso 157. Verificar que cambio de versión de documento sea visible.  
Caso 158. Verificar que envío a verificación quede una sola vez por evento.  
Caso 159. Verificar que eventos críticos sean observables por correlación de ids.  
Caso 160. Verificar cumplimiento integral de checklist constitucional.

---

# Apéndice W) Mapa de control interno y auditoría operativa

## W.1 Objetivo

Establecer controles permanentes para asegurar que la ejecución del crédito grupal permanezca alineada al marco constitucional.

## W.2 Controles preventivos

- Validación automática de prerequisitos antes de cada transición sensible.
- Restricción de permisos por rol para acciones críticas.
- Alertas de inconsistencias de datos en captura.
- Bloqueo de despliegue si se detectan violaciones DO NOT BREAK críticas.

## W.3 Controles detectivos

- Monitoreo diario de expedientes atascados por bloqueantes.
- Monitoreo de tasas de retorno con observaciones.
- Monitoreo de transiciones rechazadas por matriz inválida.
- Monitoreo de cambios de parámetros críticos.

## W.4 Controles correctivos

- Protocolos de remediación priorizada por severidad.
- Ajuste de reglas/UX tras análisis de causa raíz.
- Planes de refuerzo de capacitación operativa.

## W.5 Evidencia mínima para auditoría

- Registro de estados por expediente y fecha.
- Bitácora de observaciones y resoluciones.
- Bitácora de parámetros y vigencias.
- Bitácora de eventos de desembolso.
- Evidencia de ejecución de pruebas críticas por release.

## W.6 Indicadores clave de cumplimiento

- % expedientes enviados a verificación sin retorno.
- % solicitantes completas a la primera revisión.
- Tiempo promedio de cierre de observaciones.
- % cambios de parámetros con aprobación dual.
- % releases sin hallazgos críticos de constitución.

## W.7 Umbrales sugeridos de alerta

- Retorno con observaciones > 25%: investigar calidad documental.
- Expedientes atascados > 7 días en documentación: activar revisión operativa.
- Incidentes de estado inválido > 0 por release: bloqueo de liberación.

---

# Apéndice X) Guía de referencias cruzadas y consistencia documental

## X.1 Regla de enlazado interno

Toda sección normativa debe poder rastrearse a:

- Regla de negocio correspondiente.
- Estado o transición relacionada.
- Módulo funcional impactado.
- Activo técnico impactado.

## X.2 Regla de actualización documental

Cuando se modifica un contrato funcional, actualizar en conjunto:

- Constitución.
- Regla de negocio fuente.
- Documento de arquitectura o datos aplicable.
- Pruebas de verificación funcional.

## X.3 Regla de consistencia terminológica

- Un término oficial, una semántica oficial.
- Glosario como fuente de verdad terminológica.
- Evitar sinónimos ambiguos en documentos operativos.

---

# Apéndice Y) Protocolo de reforma constitucional

## Y.1 Cuándo procede una reforma

- Cambia operación real de CRELEALTAD.
- Cambia contrato central de estados.
- Cambia principio inmutable.
- Cambia modelo de autoridad documental.

## Y.2 Proceso formal

1. Propuesta escrita con justificación.
2. Análisis de impacto funcional.
3. Análisis de impacto técnico.
4. Plan de transición y mitigación.
5. Aprobación por autoridad definida.
6. Publicación de nueva versión.

## Y.3 Contenido mínimo de propuesta

- Texto anterior.
- Texto propuesto.
- Razón de cambio.
- Riesgo de no cambiar.
- Riesgo de cambiar.
- Plan de adopción.

## Y.4 Salvaguarda

Ninguna reforma puede eliminar trazabilidad histórica.

---

# Apéndice Z) Cierre institucional

Esta constitución es el marco rector del proyecto CRELEALTAD CORE. Su objetivo no es solo documentar, sino proteger continuidad operativa, coherencia funcional, calidad técnica y sostenibilidad de largo plazo.

Toda entrega futura debe poder responder afirmativamente:

- ¿Respeta la operación real?
- ¿Respeta estados y reglas oficiales?
- ¿Reduce fricción en campo?
- ¿Mantiene trazabilidad y control?
- ¿Preserva la evolución segura del sistema?

Si alguna respuesta es no, la entrega no está lista para adopción operativa.

---

# Apéndice AA) Manual operativo empresarial por módulo

## AA.1 Módulo Login y acceso

### Objetivo del módulo

Garantizar acceso seguro, simple y trazable para perfiles operativos y administrativos, con foco en continuidad de trabajo en campo.

### Entradas esperadas

- Credenciales de usuario vigentes.
- Estado activo de usuario.
- Perfil de rol válido para módulo solicitado.

### Salidas esperadas

- Sesión autenticada.
- Contexto de módulo habilitado por rol.
- Registro de acceso para auditoría.

### Reglas obligatorias

- Acceso denegado a usuarios inactivos o bloqueados.
- Registro de intentos fallidos según política de seguridad.
- Mensajes operativos claros sin exposición de detalles técnicos sensibles.

### Riesgos frecuentes

- Fricción por credenciales no recordadas en campo.
- Bloqueos no sincronizados con operación real.
- Ambigüedad de permisos por rol.

### Controles de mitigación

- Procedimiento de recuperación de acceso simple y auditado.
- Matriz de permisos centralizada y versionada.
- Alertas de accesos atípicos para control interno.

## AA.2 Módulo Documentación

### Objetivo del módulo

Coordinar la integración documental de expedientes de crédito grupal desde inicio hasta elegibilidad para verificación, con guía explícita sobre pendientes.

### Entradas esperadas

- Grupo nuevo o renovación con expediente activo.
- Solicitud individual por solicitante en proceso de captura.
- Catálogo documental vigente por producto y política.

### Salidas esperadas

- Solicitantes en estado Pendiente o Completa según reglas.
- Expediente en estado En documentación o Listo para verificar.
- Trazabilidad de avance y pendientes.

### Reglas de navegación

- Pantalla principal con acciones priorizadas.
- Acceso inmediato a Mis expedientes.
- Entrada directa a detalle de expediente.
- Entrada directa a captura de solicitud y documentos por solicitante.

### Reglas de operación

- Guardado automático en formularios operativos.
- Validación progresiva de campos críticos.
- Cálculo automático de completitud de solicitante.
- Priorización visual de pendientes.

### Reglas de decisión

- Envío a verificación solo si cumple mínimos parametrizados.
- Retiradas no bloquean, pero deben conservar historial y conteo.
- Documentos opcionales no bloquean envío salvo política explícita.

### Riesgos frecuentes

- Captura parcial no concluida en jornada de campo.
- Carga documental incompleta por conectividad.
- Confusión entre evidencia capturada y estado real.

### Controles de mitigación

- Indicadores de avance por solicitante.
- Lista de faltantes bloqueantes por prioridad.
- Confirmación de transición con explicación de condición cumplida.

## AA.3 Módulo Verificación

### Objetivo del módulo

Asegurar calidad y consistencia de expedientes recibidos, emitiendo decisión objetiva: aprobar, observar o rechazar.

### Entradas esperadas

- Expediente en estado En verificación.
- Evidencia documental por solicitante.
- Solicitudes individuales capturadas.

### Salidas esperadas

- Estado Verificado, Con observaciones o Rechazado.
- Observaciones accionables registradas.
- Trazabilidad de revisor y fecha.

### Reglas operativas

- Toda observación debe indicar entidad objetivo.
- Toda decisión debe incluir motivo.
- La revisión debe preservar neutralidad y consistencia de criterio.

### Riesgos frecuentes

- Observaciones ambiguas que aumentan retrabajo.
- Falta de correlación entre observación y evidencia.
- Criterio desigual entre revisores.

### Controles de mitigación

- Plantillas de observación estandarizadas.
- Catálogo de motivos de observación/rechazo.
- Revisión cruzada de calidad de dictámenes.

## AA.4 Módulo Análisis

### Objetivo del módulo

Determinar viabilidad técnica y financiera de expedientes verificados cuando el flujo institucional requiere análisis.

### Entradas esperadas

- Expediente verificado.
- Reglas de producto vigentes.
- Historial relevante de comportamiento.

### Salidas esperadas

- Dictamen de autorización o rechazo.
- Justificación de decisión.
- Trazabilidad de analista y momento de decisión.

### Reglas operativas

- Dictamen con fundamento auditable.
- Separación entre criterio objetivo y notas contextuales.
- No mutar evidencias originales del expediente.

### Riesgos frecuentes

- Falta de estandarización de criterios.
- Decisiones opacas sin fundamento suficiente.

### Controles de mitigación

- Matriz de criterios de análisis.
- Revisión de consistencia inter-analista.

## AA.5 Módulo Desembolsos

### Objetivo del módulo

Registrar y controlar la ejecución de desembolso para expedientes elegibles, preservando cumplimiento de políticas previas.

### Entradas esperadas

- Expediente en Listo para desembolso.
- Condiciones de refinanciamiento cumplidas cuando apliquen.

### Salidas esperadas

- Evento de desembolso ejecutado y auditado.
- Estado de expediente Desembolsado.
- Activación de continuidad de ciclo financiero.

### Reglas operativas

- No desembolsar sin elegibilidad completa.
- Registro obligatorio de actor, fecha y referencia.
- Prohibido duplicar desembolso para mismo caso.

### Riesgos frecuentes

- Omisión de prerequisitos de refinanciamiento.
- Duplicidad por reintentos no idempotentes.

### Controles de mitigación

- Llaves de idempotencia por evento.
- Validación de precondiciones en servidor.

## AA.6 Módulo Cobranza

### Objetivo del módulo

Gestionar pagos y estado de cartera para soportar continuidad de ciclo y reglas de renovación.

### Entradas esperadas

- Créditos vigentes.
- Eventos de pago registrados.

### Salidas esperadas

- Estado de crédito actualizado.
- Porcentaje pagado actualizado por ciclo.
- Información de elegibilidad para renovación.

### Reglas operativas

- Todo pago debe quedar vinculado a crédito y ciclo.
- Reversos de pago exigen auditoría reforzada.

### Riesgos frecuentes

- Inconsistencia entre saldo y porcentaje pagado.
- Impacto tardío en reglas de renovación.

### Controles de mitigación

- Reconciliación periódica de pagos.
- Monitoreo de desvíos de porcentaje.

## AA.7 Módulo Parámetros

### Objetivo del módulo

Administrar políticas configurables sin alterar código de negocio central.

### Entradas esperadas

- Solicitudes de cambio de política.
- Catálogo de parámetros vigente.

### Salidas esperadas

- Parámetros actualizados con vigencia.
- Bitácora de cambio y aprobaciones.

### Reglas operativas

- Cambio de parámetro crítico requiere doble aprobación.
- Mantener histórico de valor previo y nuevo.

### Riesgos frecuentes

- Cambios abruptos sin comunicación operativa.
- Inconsistencia de vigencias entre parámetros dependientes.

### Controles de mitigación

- Ventanas de cambio programadas.
- Validación de dependencias antes de publicar.

## AA.8 Módulo Administración

### Objetivo del módulo

Gestionar usuarios, roles, catálogos y gobierno de acceso con trazabilidad.

### Entradas esperadas

- Solicitudes de alta/baja/modificación de usuarios.
- Cambios de asignación de rol.

### Salidas esperadas

- Control de acceso actualizado.
- Evidencia de asignación por responsable.

### Reglas operativas

- Principio de menor privilegio.
- Segregación de funciones en acciones críticas.

### Riesgos frecuentes

- Acumulación de permisos excesivos.
- Roles desactualizados por cambios organizacionales.

### Controles de mitigación

- Revisión periódica de permisos.
- Reporte de acceso por rol y módulo.

## AA.9 Módulo Reportes

### Objetivo del módulo

Convertir datos operativos en información para decisión, sin contradecir fuente transaccional.

### Entradas esperadas

- Datos transaccionales consolidados.
- Definiciones oficiales de KPI.

### Salidas esperadas

- Indicadores de productividad, calidad y riesgo.
- Reportes de cumplimiento constitucional.

### Reglas operativas

- KPI con fórmula versionada.
- Trazabilidad de fuente de dato.

### Riesgos frecuentes

- Métricas inconsistentes entre áreas.
- Interpretación errónea por falta de definición.

### Controles de mitigación

- Diccionario institucional de métricas.
- Validación cruzada con operación.

---

# Apéndice AB) Contratos operativos de proceso por etapa

## AB.1 Contrato de creación de grupo

Precondiciones:

- Usuario autenticado.
- Permiso de alta de grupo activo.

Postcondiciones:

- Grupo creado con identificador único.
- Expediente inicial asociado.
- Bitácora de evento de creación.

Errores controlados:

- Nombre de grupo vacío o inválido.
- Permiso insuficiente.

## AB.2 Contrato de alta de solicitante

Precondiciones:

- Expediente existente y activo.

Postcondiciones:

- Solicitante asociada al expediente.
- Estado inicial Pendiente.
- Documentos base inicializados.

Errores controlados:

- Expediente inexistente.
- Datos mínimos no válidos.

## AB.3 Contrato de captura de solicitud individual

Precondiciones:

- Solicitante activa en expediente.

Postcondiciones:

- Solicitud persistida con validaciones aprobadas.
- Estado de solicitud actualizado.
- Recalculo de completitud disparado.

Errores controlados:

- Formato de campo crítico inválido.
- Inconsistencia lógica de datos.

## AB.4 Contrato de actualización documental

Precondiciones:

- Solicitante válida.
- Tipo documental reconocido.

Postcondiciones:

- Estado documental actualizado.
- Timestamp actualizado.
- Recalculo de completitud de solicitante.

Errores controlados:

- Documento no encontrado para solicitante.
- Estado documental inválido.

## AB.5 Contrato de envío a verificación

Precondiciones:

- Expediente cumple mínimos y no tiene bloqueantes críticos.

Postcondiciones:

- Estado en En verificación.
- Evento de handoff registrado.

Errores controlados:

- Mínimo de completas no alcanzado.
- Pendientes obligatorios presentes.

## AB.6 Contrato de dictamen de verificación

Precondiciones:

- Expediente en En verificación.

Postcondiciones:

- Estado actualizado según dictamen.
- Motivo de decisión registrado.

Errores controlados:

- Dictamen fuera de catálogo permitido.

## AB.7 Contrato de autorización

Precondiciones:

- Expediente verificado.
- Criterios de análisis satisfechos.

Postcondiciones:

- Estado Autorizado o Rechazado.
- Fundamento de decisión registrado.

## AB.8 Contrato de validación de refinanciamiento

Precondiciones:

- Expediente de renovación autorizado.
- Datos de pagos del ciclo anterior disponibles.

Postcondiciones:

- Estado Esperando 80% o Listo para desembolso.
- Evidencia de porcentaje calculado.

## AB.9 Contrato de desembolso

Precondiciones:

- Expediente en Listo para desembolso.

Postcondiciones:

- Evento de desembolso ejecutado.
- Estado Desembolsado.

Errores controlados:

- Duplicidad de evento.
- Prerrequisito faltante.

---

# Apéndice AC) Especificación funcional ampliada de formatos y captura estructurada

## AC.1 Finalidad de este apéndice

Este apéndice formaliza cómo deben interpretarse y digitalizarse los formatos de Solicitud Individual y Solicitud Grupal dentro de CRELEALTAD CORE.

Su propósito no es diseñar una pantalla aislada, sino fijar el contrato funcional entre:

- El formato físico utilizado por la operación.
- La captura digital estructurada.
- El motor de validación.
- El motor de completitud.
- El expediente como contenedor histórico.

La regla rectora es simple: el sistema no sustituye el formato físico firmado; lo representa, lo valida, lo complementa y lo vuelve trazable.

## AC.2 Principios rectores de la captura

1. Toda captura digital debe corresponder a un bloque funcional reconocible por la asesora.
2. Ninguna captura debe obligar al usuario a traducir conceptos del negocio a conceptos técnicos.
3. La información crítica debe capturarse una sola vez y reutilizarse en todo el flujo.
4. Las validaciones deben ocurrir lo más temprano posible, sin castigar a la usuaria con recaptura innecesaria.
5. La solicitud individual y la documentación son dimensiones complementarias; ninguna sustituye a la otra.
6. La captura incompleta debe poder persistirse de manera segura sin generar falsos positivos de completitud.
7. Todo valor calculado por el sistema debe distinguirse explícitamente de un valor declarado por la solicitante.
8. Todo cambio posterior relevante debe dejar marca temporal y actor responsable.

## AC.3 Bloques funcionales mínimos de Solicitud Individual

La Solicitud Individual digital debe organizarse como mínimo en los siguientes bloques, aun cuando la interfaz final decida dividirlos en varias pantallas, secciones o tarjetas:

1. Identidad de la solicitante.
2. Datos personales complementarios.
3. Domicilio particular.
4. Referencias.
5. Datos de pareja cuando aplique.
6. Datos de negocio o trabajo.
7. Beneficiario.
8. Validaciones y confirmaciones finales.

La ausencia de uno de estos bloques no necesariamente impide guardar progreso parcial, pero sí impide declarar capturada la solicitud cuando el bloque sea obligatorio según política vigente.

## AC.4 Identidad de la solicitante

La identidad de la solicitante es el primer contrato de calidad del expediente. Debe incluir, como mínimo, capacidad para registrar:

- Nombre completo.
- Fecha de nacimiento.
- CURP cuando aplique.
- Teléfono principal.
- Nacionalidad.
- Género conforme al catálogo vigente.
- Estado civil conforme al catálogo vigente.
- Nivel de estudios conforme al catálogo vigente.

Catálogos institucionales vigentes observados en la base actual de captura:

- Género: MASCULINO, FEMENINO.
- Estado civil: SOLTERO, DIVORCIADO, UNION LIBRE, CASADO, VIUDO.
- Nivel de estudios: PRIMARIA, SECUNDARIA, PREPARATORIA, TECNICA, UNIVERSIDAD.
- Nacionalidad: MEXICANA, EXTRANJERA.

La constitución establece que estos catálogos podrán evolucionar por parámetros o catálogos administrables, pero no deberán alterarse directamente en código sin decisión funcional expresa.

Reglas obligatorias para identidad:

- El sistema debe impedir formato imposible de fecha.
- El sistema debe validar longitud y estructura básica de CURP cuando aplique.
- El sistema debe permitir registrar nacionalidad extranjera sin forzar un estado de nacimiento mexicano inexistente.
- El sistema debe detectar potenciales duplicados de persona antes de crear nuevas identidades maestras, privilegiando alerta operativa sobre bloqueo ciego.
- El sistema debe distinguir entre dato faltante, dato inválido y dato pendiente de validación.

## AC.5 Domicilio particular

El domicilio particular debe capturarse de forma suficientemente estructurada para soportar validación, verificación, trazabilidad y documentación de soporte.

El contrato mínimo de domicilio debe cubrir:

- Calle y número.
- Código postal.
- Colonia.
- Municipio.
- Estado.
- Referencias de ubicación cuando la operación lo requiera.

La base móvil actual ya contiene comportamiento de catálogo postal para Nuevo León y debe considerarse precedente de diseño:

- Existencia de estado por defecto para plaza inicial.
- Capacidad de autocompletar municipio y estado a partir de código postal catalogado.
- Capacidad de listar colonias disponibles por código postal.
- Posibilidad de captura manual controlada cuando el código postal no esté catalogado.

Políticas constitucionales de domicilio:

- El autocompletado nunca debe ocultar la posibilidad de corrección controlada.
- El sistema debe señalar con claridad cuándo un dato proviene de catálogo y cuándo fue ingresado manualmente.
- La falta de catálogo no debe bloquear toda la operación; debe activar un camino de excepción controlada.
- Un comprobante de domicilio válido no reemplaza la obligación de registrar el domicilio estructurado en solicitud cuando dicho bloque sea obligatorio.

## AC.6 Referencias

La solicitud individual debe soportar al menos dos referencias cuando la política vigente así lo exija. El contrato mínimo de cada referencia debe contemplar:

- Nombre.
- Teléfono.
- Parentesco o relación.
- Observaciones operativas si aplican.

Catálogo funcional observado para parentesco:

- ESPOSO(A).
- HIJO(A).
- PADRE/MADRE.
- HERMANO(A).
- FAMILIAR.
- AMIGO(A).
- OTRO.

Reglas constitucionales de referencias:

- El mínimo requerido debe salir de parámetros y no de código fijo.
- Si una referencia es obligatoria, nombre y teléfono no pueden quedar estructuralmente vacíos.
- No debe permitirse marcar completa una solicitud con referencias requeridas faltantes.
- El sistema debe poder distinguir referencia faltante de referencia capturada con dato inválido.
- Si la política futura exige evidencia complementaria para referencias, el modelo deberá extenderse sin romper solicitudes ya capturadas.

## AC.7 Datos de pareja cuando aplique

La estructura de solicitud individual reconoce que ciertos datos solo aplican de acuerdo con el contexto personal de la solicitante. Por lo tanto:

- Los bloques condicionados deben aparecer únicamente cuando la lógica funcional lo justifique.
- La ausencia de ese bloque no debe generar error si no aplica.
- Cuando sí aplique, debe quedar evidencia explícita de que el bloque fue atendido.

La captura condicional debe operar con el principio de mínima fricción: preguntar solo lo necesario, pero nunca sacrificar información requerida por el expediente real.

## AC.8 Datos de negocio o trabajo

El bloque de negocio o trabajo es parte esencial del análisis futuro y del contexto de crédito. Como mínimo debe prever capacidad de capturar:

- Actividad principal.
- Antigüedad de negocio o trabajo.
- Ingresos declarados relevantes.
- Egresos o compromisos principales cuando el formato vigente los contemple.
- Totales derivados requeridos por la lógica de evaluación.

Catálogo observado para antigüedad de negocio:

- 0-1 AÑO.
- 1-3 AÑOS.
- 3-5 AÑOS.
- 5-10 AÑOS.
- MÁS DE 10 AÑOS.

Reglas inmutables para este bloque:

- Los cálculos derivados deben ser responsabilidad del sistema.
- Los totales automáticos no pueden ser sobreescritos manualmente sin mecanismo formal de excepción.
- El dato declarado por la asesora o la solicitante debe permanecer distinguible del dato calculado.
- Cualquier inconsistencia matemática crítica debe impedir marcar la solicitud como capturada.

## AC.9 Beneficiario

La solicitud individual digital debe permitir capturar como mínimo:

- Nombre de beneficiario.
- Teléfono de beneficiario.
- Parentesco o relación cuando la política lo requiera.

Este bloque existe para sostener continuidad operativa y no debe omitirse en los recorridos funcionales aprobados. Si el formato físico vigente exige datos adicionales, el bloque deberá ampliarse conservando compatibilidad hacia atrás.

## AC.10 Validaciones y confirmaciones finales

El bloque final no es un resumen cosmético. Es un punto de control constitucional donde el sistema debe:

- Revalidar integridad estructural de campos críticos.
- Confirmar obligatoriedad satisfecha por bloque.
- Mostrar pendientes accionables.
- Advertir inconsistencias lógicas detectadas.
- Registrar fecha/hora de última validación exitosa.

La experiencia de usuario de este bloque debe responder: qué quedó bien, qué falta y qué bloquea; nunca debe obligar a interpretar mensajes técnicos.

## AC.11 Solicitud física y solicitud digital

La solicitud física firmada y la solicitud digital estructurada son obligatorias como capas distintas cuando la política del producto así lo determine.

Por definición constitucional:

- La solicitud física es evidencia documental.
- La solicitud digital es evidencia estructurada y utilizable por reglas.
- Ninguna capa reemplaza a la otra.

Escenarios obligatorios:

- Si existe solicitud física sin solicitud digital capturada, la solicitante no puede quedar completa.
- Si existe solicitud digital capturada sin solicitud física exigible, la solicitante tampoco puede quedar completa cuando la política documental la marque obligatoria.
- Si la política vigente permite una excepción documental, la excepción debe quedar explicitada, justificada y auditada.

## AC.12 Solicitud Grupal como estructura operativa

La Solicitud Grupal no debe interpretarse como una sola hoja desconectada del resto del dominio. En CRELEALTAD CORE se representa como una estructura operativa compuesta por:

- Identidad o contexto de grupo.
- Apertura o asociación de expediente.
- Integración de solicitantes.
- Consolidación de indicadores grupales.
- Validación de elegibilidad para verificación.
- Condiciones para transición a autorización y desembolso.

Campos o bloques mínimos que la representación digital grupal debe ser capaz de reflejar:

- Identificador del grupo o alias operativo.
- Asesora responsable.
- Tipo de trámite: grupo nuevo o renovación.
- Producto aplicable.
- Fecha de inicio de documentación.
- Lista de solicitantes asociadas.
- Conteos de solicitantes, completas, pendientes, retiradas y rechazadas.
- Indicadores de mínimo y máximo permitidos por parámetros.
- Señal de cumplimiento o incumplimiento grupal.

## AC.13 Renovación y coexistencia de ciclos

La constitución ratifica que una renovación puede convivir con el ciclo anterior aún vigente en cobranza. Por tanto, la estructura grupal digital debe ser capaz de representar simultáneamente:

- El ciclo anterior como operación viva de cobranza.
- El nuevo expediente como proceso de documentación.
- La regla de refinanciamiento como condición de desbloqueo.

Nunca deberá modelarse una renovación como simple edición destructiva del ciclo anterior. Deben coexistir registros, estados y trazas separados.

## AC.14 Mapeo obligatorio de formato físico a estructura digital

Todo cambio futuro en formatos físicos deberá pasar por una matriz formal de mapeo que responda, por cada campo o sección:

1. Nombre operativo del dato.
2. Sección del formato físico.
3. Ubicación en captura digital.
4. Tipo de dato.
5. Regla de obligatoriedad.
6. Regla de validación.
7. Impacto en completitud.
8. Impacto en análisis o desembolso.
9. Responsable de mantenimiento.

Sin esta matriz, ningún rediseño de formato deberá considerarse listo para producción.

## AC.15 Reglas de convivencia con la implementación actual

La implementación actual del backend y móvil contiene estructuras semilla y catálogos iniciales. Dichos artefactos son útiles como referencia, pero no sustituyen esta constitución.

En particular:

- Estados simplificados o temporales en servicios demo no prevalecen sobre catálogos canónicos.
- Campos de ejemplo en servicios de memoria no limitan la estructura institucional final.
- Catálogos embebidos son aceptables solo como base inicial mientras se formaliza su administración central.

## AC.16 Resultado esperado de este apéndice

Al concluir cualquier implementación relacionada con solicitud individual o grupal, debe ser posible demostrar que:

- Cada bloque del formato físico tiene representación digital controlada.
- Cada regla de obligatoriedad está trazada a parámetros o reglas aprobadas.
- El sistema distingue progreso parcial, captura válida y completitud real.
- No existe dependencia de memoria humana para interpretar faltantes.

---

# Apéndice AD) Gobierno operativo de excepciones, observaciones y decisiones críticas

## AD.1 Objetivo

CRELEALTAD CORE es un sistema para operación real, por lo que debe existir un gobierno explícito de excepciones. Este apéndice define cómo manejar los casos en que la realidad operativa no encaja limpiamente en el flujo nominal sin por ello perder control, trazabilidad o consistencia.

## AD.2 Tipos constitucionales de excepción

Las excepciones se clasifican, como mínimo, en las siguientes categorías:

1. Excepción documental.
2. Excepción de datos.
3. Excepción de identidad.
4. Excepción de refinanciamiento.
5. Excepción de verificación.
6. Excepción técnica-operativa.
7. Excepción de sincronización o conectividad.

Cada categoría deberá tener un tratamiento diferenciado y no podrá resolverse con un simple comentario libre sin estructura.

## AD.3 Excepción documental

Una excepción documental existe cuando un documento obligatorio no está disponible en el momento esperado, presenta una particularidad de origen o requiere una dispensa controlada.

Reglas obligatorias:

- La excepción no elimina la obligación original; la suspende o reencuadra bajo control.
- Debe registrar documento afectado, motivo, actor, fecha, vigencia y autoridad que la aprueba.
- Debe indicar si bloquea completitud, bloquea verificación o solo genera observación.
- Debe vencer o resolverse; no puede quedar abierta indefinidamente sin seguimiento.

## AD.4 Excepción de datos

Aplica cuando un dato no puede capturarse conforme al camino estándar pero la operación requiere continuidad controlada.

Ejemplos típicos:

- Código postal no catalogado.
- CURP en validación posterior.
- Falta temporal de dato secundario no crítico.
- Campo condicionado por situación poco frecuente.

Mandatos:

- Debe existir motivo estructurado.
- Debe quedar marca de dato provisional, pendiente o por confirmar.
- No debe presentarse como dato definitivo si aún no lo es.
- Debe generar cola de seguimiento si afecta control posterior.

## AD.5 Excepción de identidad

Una excepción de identidad ocurre cuando el sistema detecta posible duplicado, inconsistencia relevante entre historial y nueva captura, o incertidumbre sobre la persona maestra.

Políticas:

- Nunca fusionar identidades de forma automática por coincidencia parcial débil.
- Nunca crear duplicados silenciosos cuando exista evidencia fuerte de coincidencia.
- Escalar a revisión operativa cuando la confianza sea intermedia.
- Registrar la resolución adoptada y su fundamento.

## AD.6 Excepción de refinanciamiento

La regla de porcentaje mínimo pagado es constitucional. Cualquier intento de continuar una renovación sin el umbral requerido debe tratarse como excepción formal si se pretende análisis especial.

Esta excepción requiere, como mínimo:

- Evidencia del porcentaje calculado.
- Parámetro vigente aplicable.
- Justificación de negocio.
- Aprobador con facultad.
- Resultado explícito: bloqueado, diferido o habilitado bajo condición.

## AD.7 Excepción de verificación

No toda observación de verificación es una excepción; sin embargo, sí lo es cuando requiere apartarse del comportamiento estándar del flujo.

Una excepción de verificación debe capturar:

- Entidad afectada.
- Naturaleza del hallazgo.
- Severidad.
- Acción requerida.
- Fecha compromiso de resolución.
- Responsable de atenderla.

## AD.8 Excepción técnica-operativa

Ocurre cuando la plataforma no puede cumplir una función esperada por falla técnica, conectividad deficiente, indisponibilidad de integración o anomalía de sincronización.

Mandatos constitucionales:

- Nunca ocultar la falla técnica simulando éxito.
- Nunca perder datos sin notificación clara.
- Siempre distinguir operación confirmada de operación pendiente de sincronizar.
- Toda excepción técnica con impacto operativo debe generar evidencia de incidente.

## AD.9 Observaciones como acto formal

Las observaciones no son texto suelto. Son actos formales de control operativo. Toda observación válida debe incluir:

- Objeto observado.
- Motivo claro y accionable.
- Severidad.
- Usuario emisor.
- Fecha y hora.
- Estado de atención.

Las observaciones deben redactarse para que la asesora sepa exactamente qué corregir. Mensajes genéricos como revisar expediente, documento incorrecto o datos incompletos son inaceptables si no identifican el problema concreto.

## AD.10 Catálogo mínimo de severidad

La severidad mínima institucional debe contemplar:

- Informativa.
- Menor.
- Mayor.
- Crítica.

Efectos esperados:

- Informativa: no bloquea, solo orienta.
- Menor: puede permitir continuidad con seguimiento.
- Mayor: bloquea la etapa actual.
- Crítica: bloquea y escala.

## AD.11 Decisiones críticas y obligación de fundamento

Las decisiones críticas incluyen como mínimo:

- Aprobación o rechazo de expediente.
- Retorno con observaciones.
- Autorización de desembolso.
- Dispensa de excepción relevante.
- Cambio de parámetro crítico.

Toda decisión crítica debe registrar fundamento suficiente para auditoría. Un cambio de estado sin motivo o sin actor identificable se considerará incumplimiento constitucional.

## AD.12 Vigencia y caducidad de excepciones

Ninguna excepción puede permanecer abierta de forma indefinida sin semántica temporal. Debe definirse, según el caso:

- Fecha de emisión.
- Fecha límite de atención.
- Condición de expiración.
- Consecuencia de no atender.

Cuando una excepción caduque sin resolución, el sistema debe disparar el tratamiento definido por operación: bloqueo, alerta, escalación o devolución de flujo.

## AD.13 Junta mínima de resolución

Para excepciones de alto impacto debe existir un esquema de resolución colegiada mínima, que involucre según corresponda:

- Operación.
- Verificación o análisis.
- Propietario funcional.
- Soporte o arquitectura si el origen es técnico.

El objetivo no es burocratizar; es evitar decisiones silenciosas que después nadie pueda explicar.

## AD.14 Trazabilidad completa

La plataforma debe poder responder, respecto de cualquier excepción u observación:

1. Qué pasó.
2. A quién afectó.
3. Quién lo detectó.
4. Cuándo ocurrió.
5. Qué se decidió.
6. Quién lo autorizó.
7. Cuándo se resolvió.
8. Qué cambió en el estado o en la elegibilidad.

Si el sistema no puede responder estas preguntas, la implementación no cumple con el gobierno operativo exigido.

## AD.15 Principio de no normalización de la excepción

Las excepciones existen para absorber realidad operativa extraordinaria, no para convertirse en el camino principal. Por tanto:

- El uso recurrente de una misma excepción debe detonar revisión de proceso, parámetros o diseño.
- No se permite diseñar pantallas cuyo flujo principal dependa de excepciones frecuentes no analizadas.
- Toda excepción recurrente debe medirse para decidir si debe convertirse en regla explícita.

---

# Apéndice AE) Manual ampliado de integridad de datos, auditoría y trazabilidad

## AE.1 Propósito

Este apéndice define el estándar empresarial mínimo de integridad de datos para CRELEALTAD CORE. El sistema no solo debe almacenar información: debe preservar confianza institucional en que la información es correcta, interpretable, auditable y evolutivamente segura.

## AE.2 Fuente de verdad por dominio

La plataforma deberá reconocer fuentes de verdad primarias por cada contexto:

- Identidad maestra: persona.
- Participación en expediente: solicitante.
- Proceso previo y posterior a desembolso: expediente.
- Relación colectiva solidaria: grupo.
- Obligación financiera: crédito.
- Evidencia: documento.
- Política viva: parámetro y regla.

Una misma pregunta de negocio debe tener una respuesta autoritativa clara. Por ejemplo:

- El estado de solicitante se obtiene del motor de reglas y su evidencia estructurada, no de una etiqueta manual.
- La elegibilidad de expediente se obtiene del estado canónico y bloqueantes, no de un comentario libre.
- El cumplimiento de refinanciamiento se obtiene de cálculo trazable, no de percepción del usuario.

## AE.3 Integridad estructural

Todo dato debe cumplir las reglas de estructura definidas para su tipo antes de considerarse aceptado. La integridad estructural incluye, sin limitarse a:

- Tipo de dato correcto.
- Longitud válida.
- Formato válido.
- Catálogo válido.
- Existencia de relaciones requeridas.

La integridad estructural no equivale a verdad material, pero sí es la primera barrera para evitar contaminación de datos.

## AE.4 Integridad semántica

La integridad semántica garantiza que el dato tenga sentido dentro del dominio. Ejemplos:

- Una solicitante no puede ser Completa si falta solicitud digital requerida.
- Un documento Reemplazado no puede seguir siendo la versión vigente.
- Un expediente no puede estar Listo para desembolso si mantiene bloqueantes de refinanciamiento.
- Un desembolso no puede estar Ejecutado si el crédito aún no fue habilitado.

Toda regla semántica crítica debe vivir como lógica explícita y probarse automáticamente.

## AE.5 Integridad temporal

La historia importa. El sistema debe poder representar adecuadamente el tiempo. Por ello:

- Deben existir timestamps confiables de creación y actualización.
- Los eventos críticos deben registrar secuencia temporal auditable.
- Los parámetros críticos deben poder vincularse a una vigencia.
- Las decisiones no deben reinterpretarse retroactivamente sin evidencia.

El uso generalizado de sobrescritura silenciosa destruye integridad temporal y queda prohibido para datos críticos.

## AE.6 Integridad relacional

Las relaciones entre entidades deben reflejar el modelo de dominio aprobado. Como mínimo:

- Toda solicitante pertenece a un expediente.
- Todo ciclo pertenece a un grupo.
- Todo desembolso pertenece a un crédito.
- Todo documento debe tener dueño contextual claro.

El diseño conceptual actual de base de datos, con claves foráneas por entidad, constituye una base válida para esta exigencia. Su evolución deberá respetar trazabilidad y claridad de pertenencia.

## AE.7 Política de estados canónicos

Los estados constitucionales son contratos de negocio. Los estados simplificados de demos, semillas o prototipos no constituyen verdad de dominio. Por lo tanto:

- Debe existir catálogo canónico central de estados por entidad.
- Cualquier alias temporal debe mapearse explícitamente al estado canónico si se usa solo para prototipo o migración.
- No se debe mezclar inglés, español y abreviaturas arbitrarias en estados oficiales.
- Toda transición debe ser válida según matriz aprobada.

## AE.8 Política de borrado

La plataforma privilegia historial inviolable. En consecuencia:

- El borrado físico de datos críticos está prohibido en la operación ordinaria.
- El soft delete o marca equivalente debe conservar rastro suficiente cuando aplique.
- Un documento nunca debe desaparecer del historial por reemplazo.
- Una solicitante retirada o rechazada sigue siendo parte del expediente histórico.

## AE.9 Política de actualización

Toda actualización de dato crítico debe dejar, al menos:

- Valor actual.
- Fecha de actualización.
- Actor responsable.
- Contexto del cambio cuando sea sensible.

Se consideran sensibles, como mínimo:

- Cambios de estado.
- Cambios de monto.
- Cambios de identidad.
- Cambios de excepciones.
- Cambios de parámetros críticos.

## AE.10 Política documental de evidencia

Cada documento debe poder responder:

1. Qué es.
2. A quién pertenece.
3. Qué versión es.
4. Cuál es su estado.
5. Quién lo cargó o sustituyó.
6. Cuándo se hizo la operación.
7. Si sustituye o fue sustituido por otro.

La estructura actual del backend solo cubre una fracción de esta riqueza. Eso es aceptable como semilla, pero toda evolución deberá converger al contrato constitucional completo.

## AE.11 Bitácora mínima institucional

Además de auditoría de tablas, el sistema deberá construir bitácora lógica de eventos críticos. Eventos mínimos:

- Creación de expediente.
- Alta de solicitante.
- Captura o edición relevante de solicitud.
- Carga, observación o reemplazo documental.
- Envío a verificación.
- Dictamen de verificación.
- Autorización o rechazo.
- Validación de refinanciamiento.
- Registro de desembolso.
- Cambio de parámetros críticos.

## AE.12 Calidad de datos y monitoreo

La constitución exige que la plataforma pueda medir calidad de datos al menos en estos ejes:

- Completitud.
- Consistencia.
- Validez.
- Oportunidad.
- Trazabilidad.

Ejemplos de indicadores recomendados:

- Porcentaje de solicitantes con CURP válida cuando aplique.
- Porcentaje de expedientes devueltos por observaciones documentales.
- Promedio de tiempo entre creación de expediente y elegibilidad para verificación.
- Número de excepciones documentales por plaza o asesora.
- Tasa de reemplazo documental por tipo.

## AE.13 Parámetros como datos de gobierno

Los parámetros no son constantes técnicas, sino datos de gobierno. Por ello:

- Deben tener propietario funcional.
- Deben poder distinguir estado activo e inactivo.
- Deben registrar vigencia o al menos fecha efectiva.
- Deben poder auditase sus cambios.

El cambio de parámetro sin control es equivalente a cambiar reglas del negocio sin aprobación.

## AE.14 Reconciliación y consistencia operacional

Cuando existan operaciones offline, reintentos o sincronización diferida, el sistema debe contar con políticas de reconciliación que eviten:

- Duplicados silenciosos.
- Sobrescritura de cambios más nuevos por cambios viejos.
- Estados fantasma.
- Documentos sin asociación válida.

Toda estrategia de sincronización debe dejar claro qué entidad ganó, por qué ganó y qué evidencia queda de la resolución del conflicto.

## AE.15 Datos de prueba, demo y seed

Los datos semilla son útiles para acelerar desarrollo, pero representan un riesgo si se confunden con definiciones oficiales. La política constitucional es:

- Los seeds no definen negocio.
- Los mocks no definen contratos finales.
- Los ejemplos de servicios no sustituyen catálogos institucionales.
- Todo seed debe estar alineado semánticamente o marcarse explícitamente como temporal.

## AE.16 Resultado exigido

Una solución se considerará alineada con este apéndice solo si puede demostrar integridad estructural, semántica, temporal y relacional, además de trazabilidad suficiente para auditoría operativa y técnica.

---

# Apéndice AF) Estándar ampliado de UX de campo y experiencia operativa

## AF.1 Propósito

La UX de CRELEALTAD CORE no es decoración ni preferencia de estilo. Es un instrumento operativo que debe disminuir errores, acelerar captura y sostener confianza para asesoras que trabajan en campo, con atención fragmentada, presión de tiempo y conectividad variable.

## AF.2 Usuario primario constitucional

El usuario primario es la asesora de crédito en operación real. A partir de la documentación UX actual, se ratifican estas condiciones de diseño:

- Debe poder entender la pantalla principal en menos de 3 segundos.
- Debe operar con una sola mano cuando sea posible.
- Debe enfrentar texto mínimo y altamente legible.
- Debe recibir acciones principales claras y pocas.
- Debe trabajar sin depender de búsqueda compleja, jerarquías confusas o menús recargados.

## AF.3 Pregunta guía por pantalla

Toda pantalla del sistema debe responder una pregunta operativa dominante. Si no puede expresarse esa pregunta de forma simple, la pantalla probablemente está mal definida.

Ejemplos constitucionales:

- Inicio de Documentación: ¿Qué quiero hacer en Documentación?
- Expediente: ¿Qué falta para enviarlo a verificación?
- Solicitante: ¿Qué le falta a esta solicitante para quedar completa?
- Verificación: ¿Qué debo revisar y qué decisión procede?
- Desembolsos: ¿Qué expediente ya está listo y por qué?

## AF.4 Principio de reducción de carga cognitiva

El sistema debe reducir la cantidad de decisiones simultáneas que la asesora necesita tomar. Para ello:

- Debe mostrar primero pendientes y bloqueantes.
- Debe colapsar o relegar lo ya completo cuando eso ayude a la concentración.
- Debe evitar tableros saturados de datos secundarios.
- Debe privilegiar progresión guiada sobre exploración libre compleja.

## AF.5 Prioridad visual oficial

La jerarquía visual obligatoria debe favorecer este orden:

1. Acción inmediata disponible.
2. Bloqueante actual.
3. Estado oficial.
4. Progreso útil.
5. Historial secundario.

Este orden no implica ocultar contexto, sino evitar que el usuario tenga que escanear elementos irrelevantes antes de ver lo importante.

## AF.6 Reglas de escritura en interfaz

La redacción UI debe:

- Usar lenguaje operativo de CRELEALTAD.
- Evitar tecnicismos no usados por asesoras.
- Favorecer frases cortas y accionables.
- Indicar claramente siguiente paso y causa de bloqueo.

No se permiten mensajes ambiguos como error de validación, registro inválido o información inconsistente sin especificar dónde está el problema y cómo resolverlo.

## AF.7 Acciones primarias y secundarias

Cada pantalla debe tener una acción primaria evidente. Las acciones secundarias no deben competir visualmente con ella.

Ejemplos:

- En Documentación home, solo tres acciones principales: Renovación, Grupo nuevo, Mis expedientes.
- En una card de solicitante, la acción dominante debe apuntar al siguiente pendiente real.
- En verificación, la decisión primaria debe estar claramente separada entre aprobar, observar o rechazar.

## AF.8 Estados visibles y explicables

Todo estado mostrado al usuario debe ir acompañado de una explicación utilizable cuando sea relevante. Ver En verificación o Con observaciones no basta si el usuario no entiende qué la llevó ahí o qué se espera de ella.

La explicación puede presentarse en:

- Etiquetas auxiliares.
- Mensajes breves.
- Listas de pendientes.
- Motivos de bloqueo.

Pero siempre debe ser comprensible por operación, no por ingeniería.

## AF.9 Formularios operativos

Los formularios del sistema deben obedecer estas reglas:

- Guardado automático como norma.
- Segmentación por bloques lógicos.
- Validación inmediata no intrusiva.
- Persistencia segura de progreso parcial.
- Indicadores de avance sólo si aportan claridad.

La interfaz no debe castigar a la asesora por capturar en orden no perfecto cuando la operación real no es lineal.

## AF.10 Catálogos, defaults y autocompletado

Los catálogos son herramientas de ayuda, no cajas negras. La experiencia correcta debe:

- Ofrecer opciones consistentes y legibles.
- Preseleccionar defaults razonables cuando estén aprobados.
- Permitir corrección controlada.
- Mostrar cuando un valor provino de catálogo.

El ejemplo vigente de Nuevo León como estado por defecto es aceptable como configuración inicial, pero nunca debe convertirse en supuesto rígido universal del sistema.

## AF.11 Diseño para conectividad variable

La UX debe asumir que la red puede fallar. Por ello:

- El usuario debe saber si su cambio quedó guardado localmente, sincronizado o pendiente.
- El sistema debe evitar pérdida silenciosa.
- Los reintentos deben ser comprensibles.
- Los conflictos deben explicarse con lenguaje simple.

## AF.12 Errores y recuperación

Un buen diseño no es el que nunca falla, sino el que permite recuperarse rápido. Toda experiencia de error debe responder:

1. Qué pasó.
2. Qué se pudo guardar y qué no.
3. Qué debe hacer la asesora ahora.
4. Si necesita soporte o puede continuar.

## AF.13 Consistencia visual sistémica

Aunque hoy el Design System formal esté incompleto en documentación, este proyecto ya tiene mandato constitucional de consistencia. Eso implica:

- Headers homogéneos.
- Patrones repetibles de cards, formularios y listas.
- Semántica estable para colores de estado.
- Tipografías y espaciados consistentes.
- Comportamiento recurrente de botones y acciones.

No se admiten pantallas que parezcan de otro producto por resolver rápido una necesidad puntual.

## AF.14 Reglas específicas para cards de solicitante

Las cards o resúmenes de solicitante deben ser extremadamente funcionales. Como mínimo deben dejar visible:

- Nombre de la solicitante.
- Estado actual.
- Principal pendiente.
- Acción siguiente recomendada.
- Monto solicitado cuando sea pertinente.
- Señales de observación o excepción.

Las solicitantes completas pueden presentarse colapsadas. Las retiradas deben preservarse visualmente sin saturar el flujo principal.

## AF.15 Reglas específicas para expediente

La vista de expediente debe funcionar como centro de control. Debe poder responder al instante:

- Cuántas solicitantes hay.
- Cuántas están completas.
- Qué documentos o solicitudes faltan.
- Si ya cumple el mínimo.
- Si puede ir a verificación.
- Qué lo está bloqueando.

La vista de expediente no debe convertirse en un simple listado histórico sin dirección operativa.

## AF.16 Reglas para usuarios secundarios

Aunque la asesora sea el usuario primario, verificación, análisis, desembolsos y control interno también requieren experiencia cuidada. La política constitucional es:

- Cada rol debe ver lo que necesita para decidir.
- Ningún rol debe heredar complejidad irrelevante del rol anterior.
- Deben preservarse trazas y contexto entre handoffs.
- Las decisiones deben poder entenderse sin navegar múltiples pantallas desconectadas.

## AF.17 Criterio de aceptación UX

No se aceptará una pantalla solo porque compila o because se ve bien. Debe demostrar que mejora claridad operativa, reduce ambigüedad y respeta el flujo de campo definido por negocio.

---

# Apéndice AG) Protocolo ampliado para IA, Codex y automatización asistida

## AG.1 Objeto

La plataforma y su repositorio podrán usar asistentes de IA para documentación, análisis, codificación y revisión. Este apéndice define límites, deberes y criterios de aceptación para cualquier contribución asistida por IA.

## AG.2 Principio de subordinación funcional

La IA está subordinada al negocio y a esta constitución. Nunca debe convertirse en fuente autónoma de reglas. Su rol es asistir, acelerar, estructurar y detectar inconsistencias, no redefinir el dominio por conveniencia estadística.

## AG.3 Actividades permitidas

La IA puede apoyar en:

- Redacción y estructuración documental.
- Propuesta de arquitectura compatible con la constitución.
- Generación de código alineado a contratos existentes.
- Refactorización segura.
- Diseño de pruebas.
- Revisión de consistencia entre código y documentación.
- Identificación de riesgos o huecos.

## AG.4 Actividades prohibidas sin validación humana explícita

- Inventar reglas de negocio.
- Crear estados no aprobados para entidades críticas.
- Modificar parámetros críticos por inferencia.
- Reducir controles de trazabilidad para simplificar implementación.
- Reemplazar formatos o flujos físicos sin base documental aprobada.
- Asumir que un mock o seed representa una decisión funcional definitiva.

## AG.5 Protocolo mínimo de uso seguro

Toda intervención de IA que impacte producto, datos, UX o arquitectura debe seguir este orden:

1. Leer la constitución y documentación relevante.
2. Identificar el contrato o regla afectada.
3. Formular hipótesis explícita de cambio.
4. Implementar el cambio mínimo necesario.
5. Validar con pruebas o chequeos concretos.
6. Dejar rastro claro de qué se cambió y por qué.

## AG.6 Regla de evidencia

Cuando una IA proponga una decisión, debe poder vincularla a alguna de estas fuentes:

- Esta constitución.
- Regla de negocio aprobada.
- Modelo de dominio aprobado.
- Esquema o contrato técnico vigente.
- Instrucción humana explícita.

Si no existe fuente verificable, la propuesta debe etiquetarse como hipótesis y escalarse para validación.

## AG.7 Codex como ejecutor técnico

Codex o cualquier agente similar que edite el repositorio deberá operar bajo estos mandatos adicionales:

- Preferir cambios mínimos y reversibles.
- No abrir alcance sin motivo verificable.
- Validar después del primer cambio sustantivo.
- No normalizar estados o reglas temporales en código final.
- Respetar jerarquía documental vigente.

## AG.8 IA para documentación

Cuando la IA genere documentación institucional:

- Debe preservar consistencia terminológica.
- Debe distinguir hecho aprobado de propuesta.
- Debe evitar resúmenes que pierdan semántica crítica.
- Debe actualizar referencias cruzadas cuando agregue o modifique contenido normativo.

## AG.9 IA para revisión de código

La IA que revise código deberá priorizar:

- Riesgos de regresión funcional.
- Inconsistencias con estados canónicos.
- Hardcodes indebidos de política.
- Pérdida de trazabilidad.
- Desalineación UX con operación de campo.

No debe limitarse a estilo, formato o preferencias cosméticas si existe riesgo de negocio mayor.

## AG.10 IA para generación de pruebas

Las pruebas generadas con ayuda de IA deben cubrir al menos:

- Transiciones de estado válidas e inválidas.
- Reglas de completitud de solicitante.
- Bloqueos documentales.
- Regla de refinanciamiento.
- Persistencia o auditabilidad de eventos críticos.

## AG.11 Trazabilidad de contribuciones asistidas

Las contribuciones relevantes asistidas por IA deben dejar claro:

- Qué cambió.
- Qué fuente normativa lo respaldó.
- Qué validación se ejecutó.
- Qué riesgos residuales permanecen.

Esto no implica sobrecargar cada commit con burocracia, pero sí evitar entregas opacas.

## AG.12 Reglas de seguridad informacional

La IA no debe exponer datos sensibles innecesarios, credenciales ni información operativa crítica fuera de los canales y herramientas autorizadas. Toda automatización deberá respetar políticas de acceso y mínimo privilegio.

## AG.13 Criterio de rechazo automático

Una propuesta de IA deberá rechazarse automáticamente si hace cualquiera de las siguientes cosas:

- Introduce estados nuevos sin aprobación.
- Convierte una regla configurable en hardcode.
- Elimina historial documental o de eventos.
- Presenta como hecho una inferencia no documentada.
- Reduce control de auditoría para ganar velocidad.

## AG.14 Resultado esperado

La IA será considerada correctamente utilizada cuando acelere el proyecto sin erosionar autoridad documental, control operativo ni calidad de implementación.

---

# Apéndice AH) Matriz ampliada de referencias cruzadas y trazabilidad normativa

## AH.1 Objetivo

Este apéndice une explícitamente la documentación existente del repositorio con la constitución, para que ningún equipo tenga que adivinar dónde vive la autoridad de cada tema.

## AH.2 Mapeo de negocio

- BUSINESS_RULES.md se considera fuente primaria de reglas nucleares ya aprobadas o esbozadas; esta constitución las absorbe, endurece y organiza en capítulos 3, 4, 5, 7, 8, 9 y 10.
- El principio La operación manda nace en BUSINESS_RULES.md y queda institucionalizado en capítulos 3 y 4.
- La automatización de estados y completitud se consolida en capítulos 4, 7, 8, 9, 10 y apéndices B, H, I y AC.
- La coexistencia de renovación con ciclo anterior se formaliza en capítulos 5, 6, 7 y apéndice AC.

## AH.3 Mapeo de arquitectura

- ARCHITECTURE.md aporta la estructura base del monorepo y principios de separación de aplicaciones; su autoridad queda incorporada en capítulo 11 y apéndices J y AB.
- DOMAIN_MODEL.md aporta las entidades conceptuales maestras; su autoridad se absorbe en capítulos 6, 7, 8, 9 y 13.
- ERD_V2_PROPOSAL.md y DATABASE_DESIGN_REVIEW.md deben leerse siempre bajo el filtro de capítulos 9, 13 y apéndice AE.

## AH.4 Mapeo de producto y alcance

- PRODUCT_VISION.md está hoy incompleto, por lo que la visión oficial vigente es la de capítulos 2 y 5 de esta constitución.
- MVP_1_0_IMPLEMENTATION_PLAN.md alimenta capítulo 11 y la secuencia de handoff entre Documentación, Verificación y Desembolsos.
- ROADMAP.md y PROJECT_STATUS.md, cuando evolucionen, deberán alinearse a esta constitución y no al revés.

## AH.5 Mapeo de UX

- UX-001 define lineamientos concretos para la entrada del módulo Documentación y se incorpora en capítulo 12 y apéndice AF.
- UX_GUIDELINES.md y DESIGN_SYSTEM.md están vacíos o incompletos al momento de esta versión; por tanto, la autoridad UX vigente recae en esta constitución hasta que dichos artefactos se desarrollen y sean ratificados.

## AH.6 Mapeo de base de datos y esquema

- init.sql representa el primer borrador implementable del esquema; sus tablas y relaciones respaldan capítulo 13 y apéndice AE.
- Los defaults y status temporales de init.sql no sustituyen el catálogo canónico de estados definido por esta constitución.
- DATABASE_DESIGN_REVIEW.md apoya las decisiones de relaciones y naming, pero siempre subordinado a principios de dominio y operación.

## AH.7 Mapeo de implementación actual

- apps/api/src/documentos refleja catálogo semilla de documentos por solicitante y un estado simplificado de Documento; la constitución lo usa como referencia mínima, no como límite funcional.
- apps/api/src/solicitudes refleja un primer contrato de campos base para solicitud individual; el detalle normativo oficial queda en apéndice AC.
- apps/mobile/src/catalogs/solicitud.ts y address.ts contienen catálogos y defaults útiles para la estructura de captura; la constitución fija cómo deben gobernarse y evolucionar.

## AH.8 Mapeo de autoridad por tema

Para evitar dudas, el orden de consulta recomendado por tema es:

1. Estados y transiciones: constitución capítulos 7, 8, 9 y apéndice H.
2. Completitud de solicitante: constitución capítulo 10 y apéndice B.
3. Formatos de solicitud: constitución apéndices D y AC.
4. Excepciones y observaciones: constitución apéndice AD.
5. Integridad y auditoría de datos: constitución capítulo 13 y apéndice AE.
6. UX de campo: constitución capítulo 12, UX-001 y apéndice AF.
7. Uso de IA y Codex: constitución capítulos 15, 16 y apéndice AG.

## AH.9 Regla de mantenimiento de trazabilidad

Cada vez que se modifique un documento base del repositorio en temas de negocio, arquitectura, datos, UX o IA, deberá revisarse si afecta alguna referencia de este apéndice. No se permitirá que la constelación documental del proyecto derive en contradicción silenciosa.

## AH.10 Cierre normativo

La existencia de múltiples archivos en el repositorio no distribuye la autoridad. La autoridad está centralizada en esta constitución; el resto de los documentos la complementa, la implementa o la evidencia.

---

# Apéndice AC) Diccionario funcional de datos y validaciones

## AC.1 Principio del diccionario

Cada campo crítico debe definir:

- Nombre funcional.
- Entidad dueña.
- Naturaleza del dato.
- Regla de validación.
- Impacto operativo.

## AC.2 Campos de identidad personal

Campo: nombre_completo  
Entidad: solicitante/persona  
Validación: texto no vacío, normalización operativa según política  
Impacto: identificación principal en flujo.

Campo: fecha_nacimiento  
Entidad: solicitud  
Validación: fecha real válida  
Impacto: políticas de elegibilidad.

Campo: curp  
Entidad: solicitud/persona  
Validación: longitud y patrón válido  
Impacto: identificación y control de duplicados.

Campo: nacionalidad  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: habilita/inhabilita campos dependientes.

Campo: estado_nacimiento  
Entidad: solicitud  
Validación: obligatorio si nacionalidad mexicana  
Impacto: consistencia legal/operativa.

Campo: genero  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: completitud de solicitud.

Campo: estado_civil  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: completitud de solicitud.

Campo: ocupacion  
Entidad: solicitud  
Validación: obligatorio  
Impacto: perfil económico.

Campo: nivel_estudio  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: contexto de análisis.

## AC.3 Campos de domicilio particular

Campo: calle  
Entidad: solicitud  
Validación: obligatorio  
Impacto: localización y evidencia.

Campo: numero_exterior  
Entidad: solicitud  
Validación: obligatorio  
Impacto: precisión domiciliaria.

Campo: numero_interior  
Entidad: solicitud  
Validación: opcional  
Impacto: completitud contextual.

Campo: colonia  
Entidad: solicitud  
Validación: obligatorio  
Impacto: consistencia geográfica.

Campo: municipio  
Entidad: solicitud  
Validación: obligatorio  
Impacto: consistencia geográfica.

Campo: estado  
Entidad: solicitud  
Validación: catálogo oficial/valor derivado  
Impacto: consistencia geográfica.

Campo: codigo_postal  
Entidad: solicitud  
Validación: 5 dígitos  
Impacto: autocompletado y validación territorial.

Campo: entre_calles  
Entidad: solicitud  
Validación: obligatorio  
Impacto: localización operativa.

Campo: telefono  
Entidad: solicitud  
Validación: 10 dígitos  
Impacto: contacto y validación cruzada.

## AC.4 Campos de referencias

Campo: referencia1_nombre_completo  
Entidad: solicitud  
Validación: obligatorio  
Impacto: red de referencia.

Campo: referencia1_parentesco  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: consistencia de referencia.

Campo: referencia1_telefono  
Entidad: solicitud  
Validación: 10 dígitos  
Impacto: contacto de verificación.

Campo: referencia1_direccion  
Entidad: solicitud  
Validación: obligatorio  
Impacto: completitud referencial.

Campo: referencia2_nombre_completo  
Entidad: solicitud  
Validación: obligatorio  
Impacto: red de referencia.

Campo: referencia2_parentesco  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: consistencia de referencia.

Campo: referencia2_telefono  
Entidad: solicitud  
Validación: 10 dígitos  
Impacto: contacto de verificación.

Campo: referencia2_direccion  
Entidad: solicitud  
Validación: obligatorio  
Impacto: completitud referencial.

## AC.5 Campos de pareja

Campo: pareja_nombre_completo  
Entidad: solicitud  
Validación: opcional  
Impacto: contexto socioeconómico.

Campo: pareja_actividad_economica  
Entidad: solicitud  
Validación: opcional  
Impacto: contexto socioeconómico.

Campo: pareja_ingreso_semanal  
Entidad: solicitud  
Validación: numérico positivo u opcional  
Impacto: análisis complementario.

## AC.6 Campos de negocio o trabajo

Campo: negocio_calle  
Entidad: solicitud  
Validación: obligatorio  
Impacto: ubicación de actividad económica.

Campo: negocio_numero_exterior  
Entidad: solicitud  
Validación: obligatorio  
Impacto: precisión de ubicación.

Campo: negocio_numero_interior  
Entidad: solicitud  
Validación: opcional  
Impacto: precisión contextual.

Campo: negocio_colonia  
Entidad: solicitud  
Validación: obligatorio  
Impacto: consistencia territorial.

Campo: negocio_municipio  
Entidad: solicitud  
Validación: obligatorio  
Impacto: consistencia territorial.

Campo: negocio_estado  
Entidad: solicitud  
Validación: catálogo oficial/derivado  
Impacto: consistencia territorial.

Campo: negocio_codigo_postal  
Entidad: solicitud  
Validación: 5 dígitos  
Impacto: consistencia territorial.

Campo: negocio_desde_cuando  
Entidad: solicitud  
Validación: catálogo de antigüedad  
Impacto: análisis de estabilidad.

Campo: negocio_ingreso_semanal  
Entidad: solicitud  
Validación: obligatorio numérico  
Impacto: análisis de capacidad de pago.

Campo: negocio_otros_ingresos  
Entidad: solicitud  
Validación: opcional numérico  
Impacto: análisis complementario.

Campo: negocio_gastos  
Entidad: solicitud  
Validación: obligatorio numérico  
Impacto: cálculo de total.

Campo: negocio_total  
Entidad: solicitud  
Validación: derivado automático  
Impacto: base de decisión financiera.

Campo: negocio_giro  
Entidad: solicitud  
Validación: obligatorio  
Impacto: clasificación de actividad.

## AC.7 Campos de beneficiario

Campo: beneficiario_nombre_completo  
Entidad: solicitud  
Validación: obligatorio  
Impacto: protección operativa.

Campo: beneficiario_parentesco  
Entidad: solicitud  
Validación: catálogo oficial  
Impacto: consistencia jurídica/operativa.

Campo: beneficiario_telefono  
Entidad: solicitud  
Validación: 10 dígitos  
Impacto: contacto de contingencia.

Campo: beneficiario_direccion  
Entidad: solicitud  
Validación: obligatorio  
Impacto: completitud de contacto.

## AC.8 Campos de validaciones finales

Campo: tiene_medidor_luz_sin_adeudo  
Entidad: solicitud  
Validación: SI/NO obligatorio  
Impacto: señal de cumplimiento básico.

Campo: vive_maximo_5km_tesorera  
Entidad: solicitud  
Validación: SI/NO obligatorio  
Impacto: viabilidad operativa grupal.

Campo: tiene_menos_70_anios  
Entidad: solicitud  
Validación: SI/NO obligatorio  
Impacto: política de elegibilidad.

## AC.9 Campos de entidad documento

Campo: documento_id  
Entidad: documento  
Validación: identificador único  
Impacto: trazabilidad.

Campo: documento_clave  
Entidad: documento  
Validación: catálogo de tipo documental  
Impacto: semántica de requisito.

Campo: documento_nombre  
Entidad: documento  
Validación: descriptivo legible  
Impacto: UX operativa.

Campo: documento_requerido  
Entidad: documento  
Validación: booleano  
Impacto: bloqueo de completitud.

Campo: documento_estado  
Entidad: documento  
Validación: catálogo de estados documentales  
Impacto: decisión de avance.

Campo: documento_version  
Entidad: documento  
Validación: incremental  
Impacto: historial de reemplazo.

Campo: documento_observacion  
Entidad: documento  
Validación: texto estructurado cuando estado observado  
Impacto: corrección guiada.

Campo: documento_updated_at  
Entidad: documento  
Validación: timestamp  
Impacto: trazabilidad temporal.

## AC.10 Campos de entidad solicitante

Campo: solicitante_id  
Entidad: solicitante  
Validación: id único  
Impacto: relación con expediente.

Campo: solicitante_expediente_id  
Entidad: solicitante  
Validación: FK válida  
Impacto: integridad referencial.

Campo: solicitante_persona_id  
Entidad: solicitante  
Validación: FK válida  
Impacto: historial multiexpediente.

Campo: solicitante_estado  
Entidad: solicitante  
Validación: catálogo oficial  
Impacto: KPI de expediente.

Campo: solicitante_monto_solicitado  
Entidad: solicitante/solicitud  
Validación: numérico dentro de reglas  
Impacto: evaluación de producto.

Campo: solicitante_monto_sugerido  
Entidad: solicitante  
Validación: cálculo de reglas  
Impacto: guía operativa.

## AC.11 Campos de entidad expediente

Campo: expediente_id  
Entidad: expediente  
Validación: id único  
Impacto: pivote de flujo.

Campo: expediente_group_id  
Entidad: expediente  
Validación: FK válida  
Impacto: continuidad grupal.

Campo: expediente_titulo  
Entidad: expediente  
Validación: no vacío  
Impacto: identificación operativa.

Campo: expediente_estado  
Entidad: expediente  
Validación: catálogo oficial  
Impacto: handoff entre módulos.

Campo: expediente_created_at  
Entidad: expediente  
Validación: timestamp  
Impacto: trazabilidad temporal.

Campo: expediente_updated_at  
Entidad: expediente  
Validación: timestamp  
Impacto: trazabilidad temporal.

## AC.12 Campos de KPIs de expediente

Campo: kpi_solicitantes_total  
Entidad: vista operativa expediente  
Validación: conteo >= 0  
Impacto: seguimiento.

Campo: kpi_solicitantes_completas  
Entidad: vista operativa expediente  
Validación: conteo >= 0  
Impacto: elegibilidad para verificación.

Campo: kpi_solicitantes_pendientes  
Entidad: vista operativa expediente  
Validación: conteo >= 0  
Impacto: priorización de trabajo.

Campo: kpi_solicitantes_retiradas  
Entidad: vista operativa expediente  
Validación: conteo >= 0  
Impacto: trazabilidad operativa.

Regla de consistencia:  
kpi_solicitantes_total = completas + pendientes + retiradas + rechazadas (si se reporta por separado).

## AC.13 Campos de parámetros críticos

Campo: parametro_min_solicitantes  
Entidad: parámetros  
Validación: entero positivo  
Impacto: habilitación de envío a verificación.

Campo: parametro_max_solicitantes  
Entidad: parámetros  
Validación: entero positivo mayor o igual a mínimo  
Impacto: control de capacidad.

Campo: parametro_porcentaje_refinanciamiento  
Entidad: parámetros  
Validación: decimal 0-100  
Impacto: elegibilidad de desembolso en renovación.

Campo: parametro_monto_inicial  
Entidad: parámetros  
Validación: numérico positivo  
Impacto: sugerencia de monto.

Campo: parametro_regla_igualacion  
Entidad: parámetros/reglas  
Validación: estructura de política válida  
Impacto: cálculo de monto sugerido.

Campo: parametro_documentos_requeridos  
Entidad: parámetros  
Validación: catálogo estructurado  
Impacto: completitud documental.

## AC.14 Campos de auditoría comunes

Campo: created_at  
Entidad: todas las transaccionales  
Validación: timestamp no nulo  
Impacto: trazabilidad.

Campo: updated_at  
Entidad: todas las transaccionales  
Validación: timestamp no nulo  
Impacto: trazabilidad.

Campo: created_by  
Entidad: todas las transaccionales  
Validación: actor válido  
Impacto: responsabilidad.

Campo: updated_by  
Entidad: todas las transaccionales  
Validación: actor válido  
Impacto: responsabilidad.

Campo: deleted_at  
Entidad: transaccionales con depuración lógica  
Validación: timestamp nullable  
Impacto: preservación histórica.

Campo: status  
Entidad: todas las transaccionales/catálogos  
Validación: catálogo por entidad  
Impacto: estado operacional.

## AC.15 Campos de desembolso y pagos

Campo: desembolso_id  
Entidad: desembolso  
Validación: id único  
Impacto: evento financiero.

Campo: desembolso_credito_id  
Entidad: desembolso  
Validación: FK válida  
Impacto: trazabilidad de crédito.

Campo: desembolso_estado  
Entidad: desembolso  
Validación: catálogo de estado  
Impacto: control de ejecución.

Campo: pago_id  
Entidad: pago  
Validación: id único  
Impacto: trazabilidad de cobranza.

Campo: pago_credito_id  
Entidad: pago  
Validación: FK válida  
Impacto: control de saldo.

Campo: pago_estado  
Entidad: pago  
Validación: catálogo de estado  
Impacto: evolución de cartera.

## AC.16 Calidad de dato obligatoria

Reglas generales:

- Sin valores nulos en campos obligatorios de operación.
- Normalización consistente para campos de texto definidos por política.
- Catálogos controlados para campos de selección.
- Integridad referencial en toda relación crítica.

## AC.17 Reglas de evolución del diccionario

- Todo campo nuevo debe documentarse antes o junto con su implementación.
- Todo cambio de semántica requiere versión de diccionario.
- Todo campo deprecado debe tener plan de transición.

---

# Apéndice AD) Procedimientos estándar de operación (SOP)

## AD.1 SOP de arranque diario de operación

1. Verificar estado general del sistema.
2. Revisar expedientes pendientes críticos.
3. Confirmar parámetros críticos vigentes.
4. Asignar prioridades de atención en campo.

## AD.2 SOP de cierre diario de operación

1. Revisar expedientes con avance parcial.
2. Confirmar observaciones pendientes por corregir.
3. Registrar incidencias funcionales detectadas.
4. Consolidar pendientes para jornada siguiente.

## AD.3 SOP de gestión de observaciones

1. Recibir observación.
2. Clasificar por criticidad.
3. Corregir en origen.
4. Validar impacto colateral.
5. Reenviar a verificación.

## AD.4 SOP de cambio de parámetro crítico

1. Solicitud formal.
2. Evaluación funcional.
3. Evaluación técnica.
4. Publicación controlada.
5. Comunicación a operación.
6. Seguimiento de impacto.

## AD.5 SOP de incidente de estado inconsistente

1. Contener caso afectado.
2. Congelar transición adicional del caso.
3. Diagnosticar causa.
4. Corregir dato/regla.
5. Revalidar flujo completo.
6. Documentar causa raíz.

## AD.6 SOP de liberación de versión

1. Validar checklist constitucional.
2. Ejecutar suite mínima de pruebas críticas.
3. Revisar hallazgos.
4. Autorizar despliegue.
5. Monitorear postdespliegue.

---

# Apéndice AE) Catálogo extendido de métricas y tableros

## AE.1 Métricas de productividad documental

- Expedientes iniciados por periodo.
- Solicitudes capturadas por asesora.
- Documentos capturados por jornada.
- Tiempo promedio de completitud por solicitante.

## AE.2 Métricas de calidad

- Tasa de observaciones por expediente.
- Tasa de rechazo por causa.
- Reprocesos por tipo documental.
- Errores de validación por campo.

## AE.3 Métricas de flujo

- Tiempo en En documentación.
- Tiempo en En verificación.
- Tiempo en En análisis.
- Tiempo a desembolso desde inicio.

## AE.4 Métricas de cumplimiento constitucional

- % cambios con checklist completo.
- % releases sin hallazgos críticos.
- % cambios de parámetros con aprobación dual.
- % incidencias con causa raíz documentada.

## AE.5 Métricas de experiencia operativa

- Toques promedio por tarea clave.
- Tiempo de resolución de observación.
- Satisfacción operativa por módulo.

## AE.6 Reglas de tablero

- Tablero de operación diaria.
- Tablero de calidad semanal.
- Tablero ejecutivo mensual.
- Tablero de riesgo constitucional por release.

---

# Apéndice AF) Banco ampliado de historias operativas y criterios de aceptación

## AF.1 Propósito

Este banco estandariza escenarios de uso reales para alinear análisis, diseño, desarrollo, pruebas y operación diaria bajo criterios unificados.

## AF.2 Estructura de cada historia

Cada historia contiene:

- Contexto.
- Acción esperada.
- Resultado esperado.
- Criterio de aceptación.

## AF.3 Historias de documentación (H-001 a H-040)

H-001  
Contexto: asesora inicia jornada con tres expedientes abiertos.  
Acción esperada: abre Mis expedientes y prioriza por pendientes.  
Resultado esperado: el sistema muestra primero expedientes con bloqueantes.  
Criterio de aceptación: la prioridad visual coincide con pendientes críticos.

H-002  
Contexto: asesora necesita crear grupo nuevo en campo.  
Acción esperada: usa flujo Grupo nuevo desde entrada de documentación.  
Resultado esperado: grupo y expediente inicial quedan creados.  
Criterio de aceptación: existe relación grupo-expediente sin intervención adicional.

H-003  
Contexto: expediente recién creado sin solicitantes.  
Acción esperada: asesora agrega primera solicitante.  
Resultado esperado: solicitante queda en estado Pendiente.  
Criterio de aceptación: se inicializan documentos base automáticamente.

H-004  
Contexto: solicitante con captura parcial de solicitud.  
Acción esperada: asesora continúa captura en otra visita.  
Resultado esperado: contexto previo permanece visible.  
Criterio de aceptación: no hay pérdida de datos ya capturados.

H-005  
Contexto: CURP mal capturada.  
Acción esperada: sistema valida y solicita corrección.  
Resultado esperado: no permite guardar como capturada válida.  
Criterio de aceptación: mensaje indica exactamente qué corregir.

H-006  
Contexto: fecha de nacimiento imposible.  
Acción esperada: sistema rechaza valor inválido.  
Resultado esperado: bloqueo de avance en ese campo.  
Criterio de aceptación: validación aplica antes de completar solicitud.

H-007  
Contexto: teléfono de referencia con longitud incompleta.  
Acción esperada: sistema marca error en campo.  
Resultado esperado: no permite estado Capturada.  
Criterio de aceptación: exige 10 dígitos.

H-008  
Contexto: nacionalidad mexicana.  
Acción esperada: estado de nacimiento se vuelve obligatorio.  
Resultado esperado: falta de este dato bloquea completitud.  
Criterio de aceptación: regla condicional se cumple siempre.

H-009  
Contexto: nacionalidad extranjera.  
Acción esperada: estado de nacimiento no aplica.  
Resultado esperado: el campo no bloquea captura.  
Criterio de aceptación: consistencia de regla condicional inversa.

H-010  
Contexto: código postal en catálogo local.  
Acción esperada: sistema autocompleta municipio/estado.  
Resultado esperado: reducción de captura manual.  
Criterio de aceptación: datos autocompletados coherentes con catálogo.

H-011  
Contexto: código postal no catalogado.  
Acción esperada: permitir captura manual controlada.  
Resultado esperado: flujo no se bloquea por ausencia de catálogo.  
Criterio de aceptación: se mantiene validación de longitud y formato.

H-012  
Contexto: solicitante con solicitud digital completa pero sin solicitud física.  
Acción esperada: sistema mantiene pendiente documental.  
Resultado esperado: no marca completa.  
Criterio de aceptación: regla de dualidad físico-digital respetada.

H-013  
Contexto: solicitud física capturada sin datos digitales.  
Acción esperada: sistema mantiene pendiente de solicitud.  
Resultado esperado: no marca completa.  
Criterio de aceptación: RN-028 se cumple.

H-014  
Contexto: tres documentos obligatorios, dos capturados.  
Acción esperada: mostrar claramente el faltante.  
Resultado esperado: estado global sigue Pendiente.  
Criterio de aceptación: faltante prioritario visible.

H-015  
Contexto: documento opcional pendiente.  
Acción esperada: sistema no bloquea completitud si obligatorios están completos.  
Resultado esperado: solicitante puede quedar Completa.  
Criterio de aceptación: opcional no bloqueante respetado.

H-016  
Contexto: documento observado por verificación.  
Acción esperada: asesora reemplaza versión.  
Resultado esperado: historial conserva versión anterior.  
Criterio de aceptación: documento previo accesible en auditoría.

H-017  
Contexto: solicitante retirada por decisión operativa.  
Acción esperada: sistema cambia estado a Retirada.  
Resultado esperado: permanece en historial y KPI de retiradas.  
Criterio de aceptación: no desaparece del expediente.

H-018  
Contexto: expediente con mínimo de completas alcanzado.  
Acción esperada: habilitar envío a verificación.  
Resultado esperado: acción visible y ejecutable.  
Criterio de aceptación: se cumplen bloqueos cero y mínimos.

H-019  
Contexto: expediente por debajo de mínimo requerido.  
Acción esperada: deshabilitar envío a verificación.  
Resultado esperado: mensaje con causa explícita.  
Criterio de aceptación: no transición inválida.

H-020  
Contexto: asesoras usan lenguaje operativo.  
Acción esperada: UI evita tecnicismos.  
Resultado esperado: comprensión inmediata del estado.  
Criterio de aceptación: terminología alineada al glosario oficial.

H-021  
Contexto: expediente tiene muchas solicitantes completas.  
Acción esperada: sistema permite colapsar completas.  
Resultado esperado: enfoque en pendientes.  
Criterio de aceptación: reducción de saturación visual.

H-022  
Contexto: expediente con observaciones nuevas.  
Acción esperada: mostrar observaciones en primer plano.  
Resultado esperado: asesora corrige sin navegar en exceso.  
Criterio de aceptación: ruta de corrección corta.

H-023  
Contexto: asesora vuelve del detalle a lista.  
Acción esperada: mantener continuidad del flujo.  
Resultado esperado: lista refleja cambios recientes.  
Criterio de aceptación: refresco de datos consistente.

H-024  
Contexto: fallo temporal de red en guardado.  
Acción esperada: mensaje accionable y posibilidad de reintento.  
Resultado esperado: no corrupción de estado.  
Criterio de aceptación: consistencia tras recuperación.

H-025  
Contexto: múltiples actualizaciones documentales seguidas.  
Acción esperada: recalcular completitud sin retraso significativo.  
Resultado esperado: estado actualizado en tiempo operativo.  
Criterio de aceptación: coherencia entre detalle y resumen.

H-026  
Contexto: expediente con solicitantes pendientes y retiradas.  
Acción esperada: mostrar KPIs diferenciados.  
Resultado esperado: decisión de trabajo informada.  
Criterio de aceptación: conteos consistentes.

H-027  
Contexto: monto solicitado excede regla de producto.  
Acción esperada: sistema valida y avisa límite.  
Resultado esperado: corrección antes de continuar.  
Criterio de aceptación: no persistir valor inválido.

H-028  
Contexto: historial interno disponible para persona.  
Acción esperada: sistema lo utiliza para sugerencia de monto.  
Resultado esperado: propuesta automática trazable.  
Criterio de aceptación: no decisión manual arbitraria.

H-029  
Contexto: no existe historial interno ni externo.  
Acción esperada: aplicar monto inicial parametrizado.  
Resultado esperado: consistencia con política vigente.  
Criterio de aceptación: fuente de valor verificable.

H-030  
Contexto: comprobante externo presente.  
Acción esperada: aplicar regla de igualación/incremento según parámetros.  
Resultado esperado: monto sugerido ajustado.  
Criterio de aceptación: cálculo reproducible.

H-031  
Contexto: asesora requiere avanzar rápido en campo.  
Acción esperada: interfaz minimiza toques innecesarios.  
Resultado esperado: flujo operativo fluido.  
Criterio de aceptación: navegación principal <= 3 niveles.

H-032  
Contexto: expediente listo para verificación.  
Acción esperada: enviar con un acto claro.  
Resultado esperado: transición a En verificación.  
Criterio de aceptación: evento auditado.

H-033  
Contexto: reintento accidental de envío a verificación.  
Acción esperada: prevenir duplicidad de evento.  
Resultado esperado: un solo handoff vigente.  
Criterio de aceptación: idempotencia funcional.

H-034  
Contexto: expediente regresa con observaciones.  
Acción esperada: estado Con observaciones.  
Resultado esperado: lista de pendientes de corrección.  
Criterio de aceptación: observaciones asociadas por entidad.

H-035  
Contexto: correcciones realizadas.  
Acción esperada: reenviar a verificación.  
Resultado esperado: nuevo ciclo de revisión sin perder historial.  
Criterio de aceptación: trazabilidad de iteraciones.

H-036  
Contexto: expediente rechazado.  
Acción esperada: conservar expediente como historial.  
Resultado esperado: no edición de continuidad sin política.  
Criterio de aceptación: estado y motivo preservados.

H-037  
Contexto: expediente autorizado para desembolso.  
Acción esperada: validar condiciones previas finales.  
Resultado esperado: transición a Listo para desembolso.  
Criterio de aceptación: prerequisitos completos.

H-038  
Contexto: renovación con porcentaje pagado insuficiente.  
Acción esperada: mantener estado Esperando 80%.  
Resultado esperado: bloqueo de desembolso.  
Criterio de aceptación: umbral parametrizado aplicado.

H-039  
Contexto: renovación con porcentaje pagado suficiente.  
Acción esperada: habilitar desembolso.  
Resultado esperado: transición a Listo para desembolso.  
Criterio de aceptación: cálculo de porcentaje auditable.

H-040  
Contexto: desembolso ejecutado.  
Acción esperada: registrar evento financiero y estado final.  
Resultado esperado: expediente Desembolsado e historial íntegro.  
Criterio de aceptación: evento único y trazable.

## AF.4 Historias de verificación/análisis/desembolso (H-041 a H-080)

H-041  
Contexto: verificador abre bandeja diaria.  
Acción esperada: priorizar por antigüedad y criticidad.  
Resultado esperado: atención ordenada de casos.  
Criterio de aceptación: reglas de priorización consistentes.

H-042  
Contexto: expediente sin evidencia suficiente.  
Acción esperada: emitir observación puntual.  
Resultado esperado: retorno accionable a documentación.  
Criterio de aceptación: observación no ambigua.

H-043  
Contexto: expediente con consistencia integral.  
Acción esperada: aprobar verificación.  
Resultado esperado: estado Verificado.  
Criterio de aceptación: evidencia de dictamen registrada.

H-044  
Contexto: observación recurrente por mismo error.  
Acción esperada: clasificar causa raíz operativa.  
Resultado esperado: recomendación de mejora de proceso.  
Criterio de aceptación: aprendizaje documentado.

H-045  
Contexto: analista recibe expediente verificado.  
Acción esperada: evaluar reglas de producto.  
Resultado esperado: dictamen fundamentado.  
Criterio de aceptación: trazabilidad de criterios.

H-046  
Contexto: regla de producto cambia con vigencia futura.  
Acción esperada: análisis aplica regla según fecha.  
Resultado esperado: decisión coherente temporalmente.  
Criterio de aceptación: no mezcla de vigencias.

H-047  
Contexto: expediente no viable en análisis.  
Acción esperada: rechazo con motivo estructurado.  
Resultado esperado: estado Rechazado.  
Criterio de aceptación: motivo auditable.

H-048  
Contexto: expediente viable y autorizado.  
Acción esperada: marcar Autorizado y notificar desembolsos.  
Resultado esperado: continuidad de flujo.  
Criterio de aceptación: handoff registrado.

H-049  
Contexto: desembolsos recibe expediente no elegible por regla 80%.  
Acción esperada: bloquear ejecución.  
Resultado esperado: evitar desembolso indebido.  
Criterio de aceptación: estado Esperando 80% persistente.

H-050  
Contexto: umbral de refinanciamiento actualizado.  
Acción esperada: desembolsos evalúa con nuevo parámetro vigente.  
Resultado esperado: decisión actualizada correctamente.  
Criterio de aceptación: versión de parámetro trazable.

H-051  
Contexto: operador intenta desembolso duplicado.  
Acción esperada: sistema rechaza duplicidad.  
Resultado esperado: un solo evento válido.  
Criterio de aceptación: control idempotente activo.

H-052  
Contexto: incidencia durante registro de desembolso.  
Acción esperada: retorno de error accionable y recuperación segura.  
Resultado esperado: no estado intermedio corrupto.  
Criterio de aceptación: consistencia transaccional.

H-053  
Contexto: control interno revisa casos desembolsados.  
Acción esperada: consulta bitácora de actor y fecha.  
Resultado esperado: auditoría completa.  
Criterio de aceptación: evidencia íntegra.

H-054  
Contexto: expediente cancelado por política.  
Acción esperada: registrar motivo y responsable.  
Resultado esperado: estado Cancelado trazable.  
Criterio de aceptación: no cancelación anónima.

H-055  
Contexto: revisión cruzada de decisiones de verificación.  
Acción esperada: comparar consistencia de criterios.  
Resultado esperado: reducción de variación entre revisores.  
Criterio de aceptación: métricas de consistencia mejoran.

H-056  
Contexto: análisis identifica patrón de riesgo por tipo documental.  
Acción esperada: emitir recomendación de ajuste de parámetros.  
Resultado esperado: mejora preventiva.  
Criterio de aceptación: decisión registrada y evaluable.

H-057  
Contexto: desembolsos valida prerequisitos finales.  
Acción esperada: checklist completo antes de ejecutar.  
Resultado esperado: menor incidencia postdesembolso.  
Criterio de aceptación: checklist archivado.

H-058  
Contexto: expediente regresado múltiples veces.  
Acción esperada: elevar caso para análisis de causa sistémica.  
Resultado esperado: plan de corrección estructural.  
Criterio de aceptación: acciones concretas definidas.

H-059  
Contexto: solicitud de excepción operativa.  
Acción esperada: registrar excepción con aprobación formal.  
Resultado esperado: decisión controlada y auditable.  
Criterio de aceptación: excepción no rompe principios inmutables.

H-060  
Contexto: necesidad de trazar ciclo completo de un caso.  
Acción esperada: reconstruir timeline por evento.  
Resultado esperado: trazabilidad end-to-end.  
Criterio de aceptación: secuencia cronológica íntegra.

H-061  
Contexto: equipo requiere evidencia de cumplimiento constitucional.  
Acción esperada: generar reporte de hallazgos por release.  
Resultado esperado: visibilidad de riesgo.  
Criterio de aceptación: reporte con severidad y acciones.

H-062  
Contexto: cambio de regla impacta autorización.  
Acción esperada: pruebas de regresión previas al despliegue.  
Resultado esperado: sin ruptura del flujo principal.  
Criterio de aceptación: suite crítica aprobada.

H-063  
Contexto: integración entre módulos falla en handoff.  
Acción esperada: activar protocolo de incidente B.  
Resultado esperado: restauración controlada.  
Criterio de aceptación: tiempo de recuperación dentro de objetivo.

H-064  
Contexto: actualización de catálogo de estados.  
Acción esperada: sincronizar UI, API y documentación.  
Resultado esperado: semántica uniforme.  
Criterio de aceptación: cero divergencias detectadas.

H-065  
Contexto: verificador detecta información contradictoria.  
Acción esperada: observar con detalle específico.  
Resultado esperado: corrección focalizada.  
Criterio de aceptación: evidencia de contradicción documentada.

H-066  
Contexto: expediente cumple todo, salvo validación de excepción.  
Acción esperada: no aprobar hasta resolver excepción.  
Resultado esperado: consistencia de criterio.  
Criterio de aceptación: no bypass sin autorización.

H-067  
Contexto: analista rota y nuevo analista continúa caso.  
Acción esperada: continuidad sin pérdida de contexto.  
Resultado esperado: decisión consistente.  
Criterio de aceptación: bitácora suficiente para relevo.

H-068  
Contexto: desembolso programado y pospuesto.  
Acción esperada: actualizar estado de desembolso sin perder trazabilidad.  
Resultado esperado: control temporal exacto.  
Criterio de aceptación: historial de cambios disponible.

H-069  
Contexto: solicitud de reverso de desembolso por incidente.  
Acción esperada: aplicar protocolo reforzado.  
Resultado esperado: reverso excepcional auditado.  
Criterio de aceptación: autorización dual registrada.

H-070  
Contexto: cierre de periodo operativo mensual.  
Acción esperada: consolidar métricas de flujo y calidad.  
Resultado esperado: informe para dirección.  
Criterio de aceptación: datos consistentes con transaccional.

H-071  
Contexto: alta demanda de expedientes en verificación.  
Acción esperada: priorizar por antigüedad y riesgo.  
Resultado esperado: disminución de backlog crítico.  
Criterio de aceptación: SLA operativo mejora.

H-072  
Contexto: discrepancia entre tablero y detalle.  
Acción esperada: investigar origen de inconsistencia.  
Resultado esperado: ajuste de cálculo o mapeo.  
Criterio de aceptación: reconciliación completada.

H-073  
Contexto: caso rechazada solicita revisión.  
Acción esperada: permitir consulta histórica, no alteración arbitraria.  
Resultado esperado: transparencia sin romper gobernanza.  
Criterio de aceptación: ruta de revisión formal.

H-074  
Contexto: operación requiere evidencia para auditor externo.  
Acción esperada: exportar historial de decisiones y documentos.  
Resultado esperado: cumplimiento de evidencia.  
Criterio de aceptación: integridad de exportación validada.

H-075  
Contexto: regla crítica se depreca.  
Acción esperada: transición con plan y vigencia controlada.  
Resultado esperado: continuidad sin ruptura.  
Criterio de aceptación: coexistencia temporal documentada.

H-076  
Contexto: cambio de responsable operativo por estado.  
Acción esperada: actualizar matriz y comunicación.  
Resultado esperado: accountability clara.  
Criterio de aceptación: matriz vigente publicada.

H-077  
Contexto: verificación detecta patrón de error de captura.  
Acción esperada: retroalimentar documentación con pauta concreta.  
Resultado esperado: reducción de recurrencia.  
Criterio de aceptación: métrica de error disminuye.

H-078  
Contexto: equipo de desembolsos requiere prevalidación automática.  
Acción esperada: sistema presenta checklist predesembolso.  
Resultado esperado: menor riesgo operativo.  
Criterio de aceptación: todos los ítems obligatorios visibles.

H-079  
Contexto: monitoreo detecta estado inválido raro.  
Acción esperada: bloquear propagación y alertar.  
Resultado esperado: contención temprana.  
Criterio de aceptación: incidente clasificado y corregido.

H-080  
Contexto: revisión postrelease.  
Acción esperada: comparar resultados vs criterios constitucionales.  
Resultado esperado: lecciones y mejoras priorizadas.  
Criterio de aceptación: plan de mejora aprobado.

## AF.5 Historias de gobierno, calidad y evolución (H-081 a H-120)

H-081  
Contexto: propuesta de cambio en principio operativo.  
Acción esperada: activar protocolo de reforma constitucional.  
Resultado esperado: evaluación formal de impacto.  
Criterio de aceptación: no cambio informal en principio inmutable.

H-082  
Contexto: equipo detecta hardcode de parámetro crítico.  
Acción esperada: remediación prioritaria.  
Resultado esperado: parámetro externalizado.  
Criterio de aceptación: evidencia de configuración activa.

H-083  
Contexto: documento de soporte desactualizado.  
Acción esperada: alinear con constitución vigente.  
Resultado esperado: coherencia documental.  
Criterio de aceptación: referencias cruzadas consistentes.

H-084  
Contexto: release candidate preparado.  
Acción esperada: ejecutar checklist constitucional completo.  
Resultado esperado: validación previa a despliegue.  
Criterio de aceptación: checklist firmado.

H-085  
Contexto: hallazgo crítico en revisión final.  
Acción esperada: bloquear liberación.  
Resultado esperado: corrección antes de producción.  
Criterio de aceptación: cero hallazgos críticos abiertos.

H-086  
Contexto: cambio de catálogo de términos UI.  
Acción esperada: validar contra glosario oficial.  
Resultado esperado: lenguaje operativo uniforme.  
Criterio de aceptación: sin términos prohibidos.

H-087  
Contexto: nuevo integrante de equipo técnico.  
Acción esperada: onboarding con constitución y DO NOT BREAK.  
Resultado esperado: menor riesgo de cambios inconsistentes.  
Criterio de aceptación: confirmación de lectura y comprensión.

H-088  
Contexto: propuesta de nuevo componente visual.  
Acción esperada: justificar no reutilización de componente oficial.  
Resultado esperado: decisión consciente y trazable.  
Criterio de aceptación: aprobación de diseño documentada.

H-089  
Contexto: soporte recibe incidencia recurrente de captura.  
Acción esperada: clasificar como deuda UX o regla.  
Resultado esperado: backlog priorizado por impacto.  
Criterio de aceptación: ticket con causa y plan.

H-090  
Contexto: auditoría semestral de cumplimiento.  
Acción esperada: revisar muestras por módulo y estado.  
Resultado esperado: mapa de cumplimiento y brechas.  
Criterio de aceptación: informe formal emitido.

H-091  
Contexto: actualización de política de riesgo institucional.  
Acción esperada: reflejar en parámetros/reglas y documentación.  
Resultado esperado: coherencia entre política y sistema.  
Criterio de aceptación: pruebas de transición aprobadas.

H-092  
Contexto: equipo IA propone optimización de flujo.  
Acción esperada: evaluar contra principios inmutables.  
Resultado esperado: adopción solo si no contradice operación.  
Criterio de aceptación: decisión registrada.

H-093  
Contexto: duda funcional en implementación.  
Acción esperada: detener parte ambigua y escalar.  
Resultado esperado: evitar invención de reglas.  
Criterio de aceptación: aclaración previa a merge.

H-094  
Contexto: cambio grande en modelo de datos.  
Acción esperada: plan de migración y compatibilidad.  
Resultado esperado: continuidad sin pérdida histórica.  
Criterio de aceptación: validación de backfill.

H-095  
Contexto: revisión de permisos por rol.  
Acción esperada: aplicar principio de menor privilegio.  
Resultado esperado: reducción de riesgo de acceso indebido.  
Criterio de aceptación: matriz de accesos actualizada.

H-096  
Contexto: creación de reporte ejecutivo nuevo.  
Acción esperada: definir fórmula y fuente por KPI.  
Resultado esperado: reporte confiable y auditable.  
Criterio de aceptación: validación cruzada con transaccional.

H-097  
Contexto: introducción de regla experimental.  
Acción esperada: activar estado En prueba controlada.  
Resultado esperado: impacto acotado.  
Criterio de aceptación: rollout controlado documentado.

H-098  
Contexto: retiro de regla obsoleta.  
Acción esperada: deprecación formal y limpieza controlada.  
Resultado esperado: sin efectos colaterales.  
Criterio de aceptación: evidencia de retiro y sustitución.

H-099  
Contexto: análisis de tendencias de observaciones.  
Acción esperada: identificar top causas raíz.  
Resultado esperado: plan de prevención trimestral.  
Criterio de aceptación: reducción medible en siguiente periodo.

H-100  
Contexto: ciclo de mejora continua.  
Acción esperada: priorizar iniciativas de alto impacto operativo.  
Resultado esperado: evolución sostenible.  
Criterio de aceptación: tablero de avance activo.

H-101  
Contexto: revisión de cumplimiento de guardado automático.  
Acción esperada: verificar que no existan flujos dependientes de botón guardar en operación principal.  
Resultado esperado: continuidad de principio UX-007.  
Criterio de aceptación: hallazgos cero en pantallas críticas.

H-102  
Contexto: evaluación de consistencia visual por módulos.  
Acción esperada: auditar uso de componentes oficiales.  
Resultado esperado: identidad uniforme de producto.  
Criterio de aceptación: sin componentes paralelos no aprobados.

H-103  
Contexto: despliegue con alto volumen de operación.  
Acción esperada: monitoreo reforzado de métricas de flujo.  
Resultado esperado: detección temprana de degradaciones.  
Criterio de aceptación: tiempos dentro de umbral objetivo.

H-104  
Contexto: solicitud de atajo funcional fuera de política.  
Acción esperada: rechazar atajo y proponer alternativa alineada.  
Resultado esperado: preservación de integridad de proceso.  
Criterio de aceptación: excepción no autorizada no implementada.

H-105  
Contexto: cambio organizacional de responsables por estado.  
Acción esperada: actualizar matriz RACI y comunicar.  
Resultado esperado: roles claros y vigentes.  
Criterio de aceptación: trazabilidad de cambio publicada.

H-106  
Contexto: nuevo requerimiento de campo en solicitud.  
Acción esperada: registrar en diccionario funcional y validaciones.  
Resultado esperado: incorporación controlada.  
Criterio de aceptación: documentación y pruebas simultáneas.

H-107  
Contexto: eliminación propuesta de campo histórico.  
Acción esperada: evaluar impacto en trazabilidad y reportes.  
Resultado esperado: decisión basada en riesgo.  
Criterio de aceptación: no pérdida de evidencia crítica.

H-108  
Contexto: conflicto entre velocidad y consistencia funcional.  
Acción esperada: priorizar consistencia.  
Resultado esperado: menor deuda operativa futura.  
Criterio de aceptación: decisión documentada.

H-109  
Contexto: revisión de seguridad de accesos a datos sensibles.  
Acción esperada: verificar permisos y logs.  
Resultado esperado: cumplimiento de mínimos de protección.  
Criterio de aceptación: hallazgos críticos mitigados.

H-110  
Contexto: integración de nuevo módulo futuro.  
Acción esperada: adoptar principios de constitución desde diseño inicial.  
Resultado esperado: menor retrabajo de alineación.  
Criterio de aceptación: checklist constitucional desde fase de diseño.

H-111  
Contexto: operación en zona de baja conectividad.  
Acción esperada: app responde con feedback claro ante fallos.  
Resultado esperado: usuaria entiende siguiente acción.  
Criterio de aceptación: mensajes accionables consistentes.

H-112  
Contexto: datos de persona potencialmente duplicados.  
Acción esperada: sistema alerta y permite resolución controlada.  
Resultado esperado: menor duplicidad histórica.  
Criterio de aceptación: flujo de resolución trazable.

H-113  
Contexto: actualización masiva de parámetros no críticos.  
Acción esperada: validar que no impacte reglas críticas.  
Resultado esperado: cambio seguro.  
Criterio de aceptación: sin alteración de estados oficiales.

H-114  
Contexto: reclamo por decisión automática de estado.  
Acción esperada: mostrar explicabilidad de regla aplicada.  
Resultado esperado: transparencia operacional.  
Criterio de aceptación: condición y resultado visibles.

H-115  
Contexto: revisión de deuda técnica trimestral.  
Acción esperada: priorizar deuda que afecta reglas/estados/auditoría.  
Resultado esperado: reducción de riesgo sistémico.  
Criterio de aceptación: plan con responsables y fechas.

H-116  
Contexto: propuesta de optimización en captura de documentos.  
Acción esperada: validar impacto en trazabilidad de versiones.  
Resultado esperado: mejora sin perder historial.  
Criterio de aceptación: versiones previas preservadas.

H-117  
Contexto: auditoría detecta terminología no oficial en UI.  
Acción esperada: corrección inmediata de copy.  
Resultado esperado: lenguaje operativo uniforme.  
Criterio de aceptación: glosario como referencia única.

H-118  
Contexto: se incorpora automatización IA para soporte de documentación.  
Acción esperada: restringir IA a decisiones permitidas por clase.  
Resultado esperado: apoyo sin invención de reglas.  
Criterio de aceptación: trazabilidad de intervención IA.

H-119  
Contexto: revisión anual de constitución.  
Acción esperada: evaluar vigencia y proponer mejoras.  
Resultado esperado: documento vivo y gobernado.  
Criterio de aceptación: versión nueva o ratificación formal.

H-120  
Contexto: evaluación de madurez institucional.  
Acción esperada: medir nivel actual contra hoja de ruta.  
Resultado esperado: metas claras de evolución.  
Criterio de aceptación: plan anual de madurez aprobado.

---

# Apéndice AG) Criterios de aceptación global del sistema

## AG.1 Criterios funcionales globales

- El flujo desde creación de grupo hasta desembolso es ejecutable sin saltos manuales de estado.
- La completitud de solicitante se calcula automáticamente en todos los casos.
- Los mínimos de avance se obtienen de parámetros y no de constantes hardcodeadas.

## AG.2 Criterios de experiencia globales

- El usuario entiende la acción principal de cada pantalla en menos de tres segundos.
- Los pendientes críticos son visibles en primer plano.
- La navegación principal no excede tres niveles en tareas críticas.

## AG.3 Criterios de datos globales

- Integridad referencial en entidades núcleo.
- Trazabilidad de actor y tiempo en transiciones críticas.
- Historial documental y de estado conservado.

## AG.4 Criterios de gobierno globales

- Todo cambio crítico pasa por checklist obligatorio.
- Todo cambio de parámetro crítico tiene aprobación dual.
- Toda liberación evidencia ejecución de pruebas críticas.

## AG.5 Criterios de seguridad globales

- Accesos por rol con principio de menor privilegio.
- Protección de información sensible.
- Bitácora de eventos críticos disponible para auditoría.

## AG.6 Criterios de evolución globales

- Cambios compatibles con continuidad operativa.
- Reformas constitucionales solo por proceso formal.
- Referencias cruzadas mantenidas en consistencia.

---

# Fin del documento constitutivo
