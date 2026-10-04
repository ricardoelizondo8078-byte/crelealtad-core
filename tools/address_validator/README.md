# CRELEALTAD Address Validator V5

Versión definitiva basada en V3.2. Conserva todas las columnas originales, Google y Parseo, y agrega columnas oficiales consolidadas sin sobrescribir información fuente.

## Uso

1. Ejecuta `00_INSTALAR.bat`.
2. Ejecuta `01_CONFIGURAR_API_GRAFICO.bat` y guarda una API key válida.
3. Coloca un archivo `.xlsx` en `input`.
4. Ejecuta `02_ABRIR_APLICACION.bat`.
5. Previsualiza, prueba la API y procesa.

El resultado se guarda en `output` con sufijo `_VALIDADO_V5.xlsx`. Las decisiones completas se registran en `logs/decisiones_v5.jsonl` y los errores en `logs/errores.log`.

## Decisión y puntuación

El motor pondera simultáneamente dirección completa, granularidades de validación y geocódigo, Place ID, coordenadas, faltantes, no confirmados, coincidencia SEPOMEX, consistencia colonia–municipio–CP y coincidencias con el parseo original. La segunda pasada de Geocoding se limita a casos MEDIA, REVISAR, incompletos, con componentes críticos faltantes o contradicciones.

## Compatibilidad y protección

- `DIRECCION` nunca se modifica.
- Las columnas de Parseo nunca se modifican.
- Las columnas Google existentes nunca se sobrescriben.
- La caché SQLite de V3 es compatible y las consultas existentes se reutilizan.
- El catálogo oficial SEPOMEX se lee desde `catalogos`.

## Pruebas

Ejecuta `04_EJECUTAR_PRUEBAS.bat`. La suite cubre normalización, puntuación, consolidación, selección de segunda pasada, caché, SEPOMEX, preservación de columnas y generación integral del Excel.
