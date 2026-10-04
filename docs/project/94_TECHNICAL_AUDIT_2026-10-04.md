# 94 Auditoría técnica integral — 2026-10-04

Estado: ejecutada con correcciones transversales aplicadas
Alcance: código activo, dependencias, flujo de información, esquema PostgreSQL, módulos M01–M12 y documentación canónica

## Dictamen

La base técnica es funcional para continuar desarrollo, pero todavía no es apta para producción.
Backend y mobile compilan; la API cuenta con autorización global, persistencia real, pruebas y
migraciones controladas. Las brechas que impiden producción no se resuelven creando pantallas vacías:
requieren decisiones de negocio aprobadas, seguridad operativa y arquitectura offline/durable.

No se consultaron ni copiaron datos personales. Las validaciones de base utilizaron metadatos,
restricciones y conteos de integridad.

## Correcciones ejecutadas

| Área | Resultado |
|---|---|
| Secretos | Credenciales literales retiradas de scripts e historial local; PostgreSQL/JWT locales rotados y escaneo automático integrado a `npm run verify`. |
| Sesión móvil | JWT migrado de AsyncStorage a SecureStore; invalidación común ante `401`. |
| Dependencias API | Parches compatibles aplicados y `picomatch` productivo corregido; sin avisos altos o críticos, quedan dos moderados ligados a NestJS 10. |
| Dependencias mobile | Expo 57 y módulos nativos alineados; el audit conserva avisos transitivos del toolchain Expo/Metro sin corrección compatible disponible. |
| Archivos | Política común para tamaño, firma real, UUID y SHA-256; multipart acotado y documentos numerosos reunidos por lotes en una sola versión. |
| Datos | Tres FKs faltantes agregadas con cero huérfanos. |
| Migraciones | Ledger por SHA-256 y ejecutor transaccional activo hasta 035 en prueba y base local real; cero pendientes o drift. |
| Recuperación | Respaldos custom previos a 033/034 y 035 creados y validados. |
| Calidad | TypeScript API/mobile, build Nest, 39 suites y 203 pruebas aprobadas; export Android con Hermes verificado. |
| Autorización | Catálogo técnico único, normalización cerrada y constraints JSONB; no sustituye la matriz funcional pendiente. |
| Trazabilidad | Login exitoso actualiza su marca y `audit_log` en una sola transacción sin copiar credenciales. |
| Modularidad mobile | Catálogo de módulos, evaluación de acceso y claves idempotentes extraídos de las pantallas/shell que los consumen. |

## Estado de módulos

| Módulo | Estado verificable | Siguiente bloqueo real |
|---|---|---|
| M01 Login | Parcial funcional | Cambio/recuperación de PIN, rotación del PIN temporal y matriz territorial. |
| M02 Documentación | Parcial funcional | Cola offline durable y proveedor de archivos productivo. |
| M03 Verificación | Parcial funcional | Dictamen/conclusiones, asignación y matriz aprobada. |
| M04 Análisis | No implementado | Reglas de elegibilidad, capacidad, productos y excepciones aprobadas. |
| M05 Desembolsos | Base de datos | Evento idempotente, doble control, checklist y folio generado por backend. |
| M06 Cobranza | Base de datos | Aplicación/reverso de pagos, conciliación e idempotencia. |
| M07 Recolección | No implementado | Custodia, entrega, arqueo y trazabilidad de efectivo. |
| M08 Mora | Base de datos | Cálculo oficial, asignación, acciones y escalamiento. |
| M09 Convenios | Base de datos | Definir relación funcional con `reestructuras` y aprobaciones. |
| M10 Reportes | No implementado | Catálogo de indicadores, fórmulas, cortes y alcance de datos. |
| M11 Parámetros | No implementado | Modelo versionado, vigencias, aprobación y auditoría. |
| M12 Administración | Parcial técnico | CRUD seguro de usuarios/roles/permisos y matriz definitiva. |

Los módulos faltantes permanecen en el catálogo visual de desarrollo como `Próximamente`; no tienen
rutas ficticias ni permisos inventados.

## Riesgos prioritarios pendientes

1. Rotar el PIN temporal de 49 asesores y habilitar cambio obligatorio; usar un gestor de secretos
   para despliegue.
2. Aprobar la matriz módulo–acción–rol y el alcance por sucursal/zona. DEC-023 continúa siendo una
   excepción temporal.
3. Sustituir filesystem local por almacenamiento durable con respaldo, monitoreo y carga reanudable.
4. Diseñar la cola offline antes de ampliar masivamente formularios: persistencia, reintento con
   backoff, idempotencia, deduplicación y política explícita de conflictos.
5. Dividir los hotspots `IntegranteVerificacionScreen`, `SolicitudFormScreen`,
   `IntegrantesService` y `VerificacionLlamadasService` por casos de uso y secciones probables.
6. Agregar pruebas automatizadas mobile y recorridos end-to-end de permiso insuficiente, reinicio,
   reconexión y archivos.
7. Planear la migración CommonJS → ESM necesaria para NestJS 12; la actualización directa compila,
   pero no es aceptable mientras impida arrancar la suite Jest actual.
8. Consolidar el working tree en entregas revisables: la auditoría encontró cientos de cambios
   preexistentes mezclados. No se descartaron ni reescribieron cambios ajenos y no se creó un commit
   masivo que impida rastrear su origen.

## Secuencia recomendada

1. Cerrar M01/M12: credenciales, cambio de PIN, matriz y alcance territorial.
2. Construir infraestructura transversal offline y almacenamiento durable.
3. Consolidar M02/M03 y su prueba end-to-end.
4. Especificar/aprobar M11 antes de M04–M10 para evitar políticas financieras hardcodeadas.
5. Implementar M04 → M05 → M06/M07 → M08/M09 → M10, con auditoría e idempotencia desde el primer endpoint.

## Cadencia de auditoría

- En cada cambio: `npm run verify`, revisión de migraciones y checklist 22.
- Al cierre de cada sprint o módulo: auditoría focal de reglas, permisos, datos y recuperación de error.
- Antes de cada despliegue: dependencias, secretos, respaldo/restauración, ledger y pruebas end-to-end.
- Auditoría integral: cada trimestre y también después de un cambio de arquitectura, incidente o módulo financiero nuevo.
