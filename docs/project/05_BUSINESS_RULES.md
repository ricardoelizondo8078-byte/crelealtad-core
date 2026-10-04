# 05 Business Rules — Catálogo Normalizado

Versión: 1.3.0
Estado: Vigente y auditado
Fecha de auditoría: 2026-10-04
Fuente base: docs/project/01_PROJECT_CONSTITUTION.md + docs/archive/BUSINESS_RULES_INITIAL_DRAFT.md

## Criterio de normalizacion

- Se conserva numeracion RN.
- Se clasifica por dominio.
- No se agregan reglas de negocio nuevas sin fuente documental previa.
- Cuando existe brecha entre codigo, schema o borradores, la autoridad funcional permanece en la constitucion y en este catalogo.

## Dominio A - Gobierno Operativo

- RN-001: El sistema se adapta a la operacion real de CRELEALTAD.
- RN-002: La interfaz debe usar lenguaje operativo de CRELEALTAD.
- RN-003: El sistema determina completitud de solicitante automaticamente.
- RN-004: El sistema determina cambios de estado oficiales automaticamente.
- RN-005: Captura operativa con guardado automatico.

## Dominio B - Expediente y Solicitante

- RN-006: El expediente existe antes del desembolso.
- RN-007: Grupo y credito nacen tras desembolso autorizado.
- RN-008: El expediente permanece como historial y no se elimina.
- RN-009: Estados validos de solicitante: Pendiente, Completa, Retirada, Rechazada.
- RN-010: Avance de expediente se calcula por solicitantes y su estado.
- RN-011: No usar termino integrantes activas en interfaz.
- RN-012: Solicitante retirada no bloquea avance, pero conserva historial.
- RN-013: Envio a verificacion requiere minimas completas y sin pendientes obligatorios.
- RN-014: Minimo de solicitantes se parametriza.

## Dominio C - Ciclos y Refinanciamiento

- RN-015: La documentacion puede iniciar con ciclo anterior vigente.
- RN-016: Renovacion con refinanciamiento requiere porcentaje minimo pagado.
- RN-017: Umbral inicial 80 por ciento, configurable.
- RN-018: Puede coexistir ciclo en cobranza y expediente en documentacion.

## Dominio D - Determinacion automatica de clienta y monto

- RN-019: Sistema determina tipo de clienta.
- RN-020: Si persona existe, se consulta historial interno.
- RN-021: Sin historial interno y sin externo, aplica monto inicial parametrizado.
- RN-022: Comprobante de linea externa es opcional.
- RN-023: Con comprobante externo, sistema puede igualar o incrementar segun parametros.
- RN-024: Monto sugerido lo calcula sistema.
- RN-025: Asesora captura monto solicitado, sistema valida contra reglas de producto.

## Dominio E - Solicitud y Documentos

- RN-026: Solicitud fisica firmada es documento del expediente.
- RN-027: Solicitud fisica no sustituye captura digital estructurada.
- RN-028: Sin ambos frentes aplicables, solicitante no queda completa.
- RN-029: Clasificacion documental por categorias funcionales.
- RN-030: Documento obligatorio pendiente bloquea completitud.
- RN-031: Documento opcional no bloquea, pero puede afectar evaluacion.
- RN-032: No eliminar fisicamente historial documental.
- RN-033: Reemplazo conserva version previa.
- RN-034: Documento debe guardar metadatos minimos de trazabilidad.
- RN-035: Estados de documento: Pendiente, Capturado, Observado, Aceptado, Reemplazado, Vencido.
- RN-036: Mostrar faltantes por expediente y solicitante.
- RN-037: Priorizar visualizacion de pendientes.
- RN-038: Solicitantes completas pueden mostrarse colapsadas.
- RN-039: Solicitantes retiradas colapsadas con historial.
- RN-040: La pantalla de expediente responde que falta para enviar a verificacion.

## Dominio F - Estados de Expediente

- RN-041: Catalogo oficial inicial de estados de expediente.
- RN-042: Cada estado debe tener responsable operativo.

## Dominio G - Parametros

- RN-043: Politicas criticas configurables por parametros.

## Dominio H - IA y Codex

- RN-044: Codex no inventa reglas de negocio.

## Contradicciones y brechas documentadas durante la auditoria

1. Estados simplificados en prototipo versus catalogo oficial.
Estado documental: la implementacion actual es parcial; la autoridad funcional sigue siendo el catalogo oficial.

2. Tipos documentales hardcoded versus parametrizacion obligatoria.
Estado documental: la parametrizacion continua siendo la politica oficial; el hardcode actual se documenta como semilla temporal.

3. Entidad Solicitud en API y mobile sin tabla dedicada en schema principal.
Estado documental: RESUELTA. PostgreSQL contiene `solicitudes`, siete tablas hijas y la vista `solicitudes_completo`; la API persiste mediante TypeORM y deriva persona, expediente y grupo desde la integrante.

4. Estados técnicos en SQL versus estados funcionales de negocio.
Estado documental: RESUELTA para los catálogos cerrados de rol, usuario, persona, producto, crédito,
ciclo y pago mediante la migración 036. Continúa ABIERTA para grupo, expediente, mora,
reestructura/convenio y las validaciones `SI/NO` de solicitud porque conservan valores legacy o no
tienen correspondencia funcional aprobada. Ningún estado técnico sustituye la semántica oficial.

5. RN-007 indica que grupo y credito nacen tras el desembolso, mientras el flujo vigente crea el grupo al iniciar Documentacion y reserva el nacimiento del ciclo/credito para el desembolso real.
Estado documental: ABIERTA. No se modifico RN-007 ni la operacion; requiere decision explicita de Direccion para precisar si "grupo" se refiere al grupo crediticio desembolsado o a su identidad operativa previa.

## Controles tecnicos vigentes asociados

- La edad y `tiene_menos_70_anios` se derivan de `fecha_nac`; no son una declaracion manual de la asesora.
- `monto_autorizado`, `ciclo_numero`, relaciones y rutas documentales no forman parte de la escritura publica de la solicitud.
- Una evidencia obligatoria cuenta para completitud solo cuando su manifiesto y archivo existen en almacenamiento de servidor.
- Para el rol `ASESOR`, la API valida propiedad del expediente en cada ruta directa del recorrido activo.

## Límite entre regla y cobertura actual

- `Solicitante` es el concepto funcional; el runtime vigente lo materializa en `integrantes` y usa
  estados técnicos parciales. Esa equivalencia de persistencia no renombra la entidad funcional.
- El mínimo oficial de solicitantes es parametrizable. Mientras M11 no exista, el handoff técnico
  sólo exige al menos una participante completa, cero participantes pendientes y una tesorera
  participante completa. Esta condición temporal no define el mínimo oficial del producto.
- `Solicitud` se persiste en una tabla core y siete hijas, pero todavía no tiene una columna de estado
  propia. Su completitud se deriva de campos y evidencias; no debe inferirse un catálogo SQL nuevo.
- Verificación conserva cuatro procesos parciales y evidencias, pero todavía no emite el dictamen
  general ni las transiciones funcionales posteriores. `Conclusiones` permanece deshabilitado.
- Grupo y expediente operativos pueden existir antes del desembolso; crédito y ciclo financiero sólo
  nacen con el desembolso real. La precisión semántica de RN-007 permanece abierta para Dirección.

## Referencias cruzadas

- project/08_ENTITY_CATALOG.md
- project/09_STATE_MACHINE.md
- project/10_DATABASE_PRINCIPLES.md
- project/90_ARCHITECT_REVIEW.md
