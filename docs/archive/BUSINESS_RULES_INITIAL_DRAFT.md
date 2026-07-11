# CRELEALTAD CORE
## BUSINESS_RULES.md

Versión: 1.0  
Estado: Borrador inicial  
Responsable funcional: Ricardo Elizondo  
Arquitecto funcional: ChatGPT  

---

# Reglas de Negocio

## RN-001
El sistema debe adaptarse a la operación real de CRELEALTAD. CRELEALTAD no debe cambiar su operación para adaptarse al sistema.

## RN-002
El sistema debe usar el lenguaje operativo de CRELEALTAD. No usar términos técnicos si las asesoras no los utilizan.

Ejemplos correctos:
- Documentación
- Solicitante
- Tesorera
- Verificación
- Desembolso

Ejemplos incorrectos:
- Originación
- Pipeline
- Workflow

## RN-003
El usuario no debe marcar manualmente si una solicitante está completa. El sistema lo determina automáticamente.

## RN-004
El usuario no debe cambiar manualmente el estado de un expediente. El sistema cambia el estado mediante reglas y eventos.

## RN-005
Toda captura debe guardarse automáticamente. No deben existir botones de “Guardar” en formularios operativos.

## RN-006
El expediente existe antes del desembolso.

## RN-007
Después del desembolso nacen el Grupo y el Crédito.

## RN-008
El expediente permanece como historial y nunca se elimina.

## RN-009
Una solicitante puede estar en los siguientes estados:
- Pendiente
- Completa
- Retirada
- Rechazada

## RN-010
El avance del expediente se calcula con:
- Solicitantes
- Completas
- Pendientes
- Retiradas

## RN-011
No se debe usar el término “integrantes activas” en la interfaz. Se usarán los términos:
- Solicitantes
- Completas
- Pendientes
- Retiradas

## RN-012
Una solicitante retirada no bloquea el avance del expediente, pero debe permanecer en el historial.

## RN-013
Un expediente puede enviarse a verificación cuando:
- No existen pendientes obligatorios.
- El número de completas es mayor o igual al mínimo configurado en Parámetros.

## RN-014
El mínimo de solicitantes no debe estar programado directamente. Debe venir del módulo Parámetros.

## RN-015
La documentación puede iniciar en cualquier momento, aunque el ciclo anterior siga vigente.

## RN-016
El desembolso por refinanciamiento solo puede realizarse cuando el ciclo anterior alcance el porcentaje mínimo pagado configurado en Parámetros.

## RN-017
El porcentaje mínimo actual para refinanciamiento es 80%, pero debe ser configurable.

## RN-018
El sistema debe permitir que un grupo tenga un ciclo vigente en cobranza y otro expediente en documentación.

## RN-019
La asesora no selecciona si una clienta es nueva, con historial CRELEALTAD o con historial externo. El sistema lo determina.

## RN-020
Si la persona existe en la base de datos, el sistema debe consultar su historial CRELEALTAD.

## RN-021
Si la persona no tiene historial CRELEALTAD ni comprobante externo, aplica el monto inicial configurado en Parámetros.

## RN-022
El comprobante de línea de crédito externa es opcional.

## RN-023
Si existe comprobante externo, el sistema puede usarlo para sugerir igualación o incremento de monto, según Parámetros.

## RN-024
El monto sugerido debe ser calculado por el sistema, no por la asesora.

## RN-025
La asesora puede capturar monto solicitado, pero el sistema debe validar contra las reglas del producto.

## RN-026
La solicitud física firmada debe tratarse como un documento del expediente de la solicitante.

## RN-027
Además de anexar la solicitud física, la asesora debe capturar los datos de la solicitud en el sistema.

## RN-028
Una solicitante no queda completa si la solicitud física está anexada pero sus datos no han sido capturados.

## RN-029
Los documentos se clasifican en:
- Identidad
- Domicilio
- Crédito
- Evidencias

## RN-030
Los documentos obligatorios bloquean que una solicitante quede completa.

## RN-031
Los documentos opcionales no bloquean el expediente, pero pueden afectar la evaluación de crédito.

## RN-032
Ningún documento debe eliminarse físicamente del historial.

## RN-033
Si un documento se reemplaza, debe conservarse la versión anterior.

## RN-034
Cada documento debe guardar:
- Tipo
- Versión
- Estado
- Fecha de carga
- Usuario que lo cargó
- Entidad relacionada
- Observaciones

## RN-035
Los estados posibles de un documento son:
- Pendiente
- Capturado
- Observado
- Aceptado
- Reemplazado
- Vencido

## RN-036
El sistema debe indicar qué documentos faltan por expediente y por solicitante.

## RN-037
El sistema debe mostrar primero lo pendiente, no lo completo.

## RN-038
Las solicitantes completas pueden mostrarse colapsadas para reducir saturación visual.

## RN-039
Las solicitantes retiradas deben mostrarse colapsadas y conservar historial.

## RN-040
La pantalla de expediente debe responder principalmente: “¿Qué falta para enviar a verificación?”

## RN-041
Los estados oficiales iniciales del expediente son:
- En documentación
- Con observaciones
- Listo para verificar
- En verificación
- Verificado
- En análisis
- Autorizado
- Esperando 80%
- Listo para desembolso
- Desembolsado
- Cancelado
- Rechazado

## RN-042
Cada estado debe tener un responsable operativo.

## RN-043
Los parámetros deben permitir configurar:
- Productos
- Documentos requeridos
- Número mínimo de solicitantes
- Número máximo de solicitantes
- Referencias requeridas
- Fotografías requeridas
- Monto inicial
- Reglas de igualación
- Reglas de refinanciamiento
- Porcentaje mínimo pagado

## RN-044
Codex no debe inventar reglas de negocio. Si existe duda, debe preguntar antes de implementar.

---

# Regla central

La asesora captura información y documentos.  
El sistema clasifica, valida, calcula, guarda y determina estados.
